<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
    MapLibreMap,
    NavigationControl,
    Popup,
    setWorkerUrl,
    type ExpressionSpecification,
    type GeoJSONSource,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useTheme } from '@/composables/useTheme'
import { flightRouteGeoJSON, type AirportProperties, type RouteProperties } from '@/lib/flightRoutes'
import type { FlightStatsRow } from '@/lib/journeyColumns'

/**
 * Route map — MapLibre GL over OpenFreeMap vector tiles, with brand-gradient
 * great-circle arcs.
 *
 * Replaces the former Leaflet + CARTO raster setup: vector tiles stay crisp on
 * retina displays, the basemap carries place labels, arcs get a two-tone
 * gradient plus a soft glow pass, and no third-party API key is needed.
 * OpenFreeMap is MIT-licensed with an unlimited free public instance, and can be
 * self-hosted from its weekly planet dumps if that ever changes.
 */

// MapLibre locates its web worker relative to `import.meta.url`. In dev that
// resolves correctly because vite.config.ts excludes maplibre-gl from
// pre-bundling, but a production build bundles maplibre into this async chunk
// and never emits `maplibre-gl-worker.mjs` next to it — MapLibre computes the
// filename at runtime, so Rollup can't statically see it to copy it over. The
// default lookup then 404s, the worker pool dies, and the map paints only its
// background clear colour (blank). Importing the worker with `?url` makes Vite
// emit it as a real hashed asset and hand back its URL; `setWorkerUrl` points
// MapLibre at it before any map instance is created.
setWorkerUrl(workerUrl)

const STYLE_URL = {
    light: 'https://tiles.openfreemap.org/styles/positron',
    dark: 'https://tiles.openfreemap.org/styles/dark',
} as const

/** Fallback framing before any flight data lands: a relaxed world view. */
const DEFAULT_CENTER: [number, number] = [10, 25]
const DEFAULT_ZOOM = 1.1

const props = defineProps<{ flights: FlightStatsRow[] }>()

const { isDark } = useTheme()
const container = ref<HTMLDivElement | null>(null)

// Imperative MapLibre handles — deliberately non-reactive, the map owns its state.
let map: MapLibreMap | null = null
let popup: Popup | null = null
let hasFitted = false

/**
 * Arc and marker colours per theme. Dark mode uses lighter tints of the same
 * brand violet / sunset orange so the arcs still read against a near-black
 * basemap. Mirrors --color-brand and --color-sunset in style.css.
 */
const palette = computed(() =>
    isDark.value
        ? {
            arcFrom: '#a78bfa',
            arcTo: '#fdba74',
            glowOpacity: 0.3,
            dot: '#141414',
            dotStroke: '#e3e3ff',
            label: '#e3e3ff',
            halo: '#0c0c0c',
        }
        : {
            arcFrom: '#7b5ff1',
            arcTo: '#ff8b37',
            glowOpacity: 0.22,
            dot: '#ffffff',
            dotStroke: '#7b5ff1',
            label: '#374151',
            halo: '#ffffff',
        },
)

const geo = computed(() => flightRouteGeoJSON(props.flights))

/**
 * Both arc layers share one gradient so the glow sits directly under the line.
 * `line-progress` requires `lineMetrics: true` on the source and runs 0→1 per
 * feature, so every route gets its own full violet→orange ramp.
 */
function arcGradient(): ExpressionSpecification {
    const { arcFrom, arcTo } = palette.value
    return ['interpolate', ['linear'], ['line-progress'], 0, arcFrom, 1, arcTo]
}

/**
 * Hides the basemap's administrative borders so the arcs are the only lines
 * competing for attention.
 *
 * OpenFreeMap names them differently per style (`boundary_2` and
 * `boundary_disputed` in positron, `boundary_country_z0-4` and `boundary_state`
 * in dark), so match by prefix instead of a hardcoded list. Runs from the
 * `style.load` handler, which fires before the vector tiles arrive — so the
 * borders are suppressed before they ever paint, with no visible flash.
 * Country labels are deliberately kept.
 */
function hideBasemapBorders() {
    if (!map) return
    for (const layer of map.getStyle().layers) {
        if (layer.type === 'line' && layer.id.startsWith('boundary')) {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
        }
    }
}

/**
 * Adds sources and layers to the current style.
 *
 * Called from the `style.load` handler, which MapLibre also fires after
 * `setStyle()` — a style swap discards every custom layer, so this doubles as
 * the re-add path for theme changes and is idempotent via the layer check.
 */
function addRouteLayers() {
    if (!map || map.getLayer('route-line')) return
    const colors = palette.value

    map.addSource('routes', { type: 'geojson', data: geo.value.routes, lineMetrics: true })
    map.addSource('airports', { type: 'geojson', data: geo.value.airports })

    map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
            'line-gradient': arcGradient(),
            'line-width': ['interpolate', ['linear'], ['zoom'], 0, 4, 6, 8, 12, 14],
            'line-opacity': colors.glowOpacity,
            'line-blur': 3,
        },
    })

    map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
            'line-gradient': arcGradient(),
            'line-width': ['interpolate', ['linear'], ['zoom'], 0, 1, 6, 2, 12, 3],
            'line-opacity': 0.9,
        },
    })

    map.addLayer({
        id: 'airport-dot',
        type: 'circle',
        source: 'airports',
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 2.5, 6, 4, 12, 6],
            'circle-color': colors.dot,
            'circle-stroke-color': colors.dotStroke,
            'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 0, 1, 6, 1.6, 12, 2.2],
        },
    })

    // IATA codes only from zoom 2.5 up — at world scale 100+ labels would be
    // an unreadable swarm. 'Noto Sans Bold' ships with the OpenFreeMap glyphs.
    map.addLayer({
        id: 'airport-label',
        type: 'symbol',
        source: 'airports',
        minzoom: 2.5,
        layout: {
            'text-field': ['get', 'iata'],
            'text-font': ['Noto Sans Bold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 2.5, 9, 8, 12, 14, 14],
            'text-offset': [0, 1.15],
            'text-anchor': 'top',
            'text-optional': true,
        },
        paint: {
            'text-color': colors.label,
            'text-halo-color': colors.halo,
            'text-halo-width': 1.2,
        },
    })
}

function fitToData() {
    if (!map) return
    const { bounds } = geo.value
    if (!bounds) {
        // The year filter emptied the data — drift back to the world view
        // instead of leaving a blank map framed on the previous routes.
        map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 500 })
        return
    }
    map.fitBounds(bounds, { padding: 32, maxZoom: 6, duration: 700 })
    hasFitted = true
}

/** Pushes the latest GeoJSON into the existing sources and optionally reframes. */
function syncData(fit: boolean) {
    if (!map || !map.getLayer('route-line')) return
    ;(map.getSource('routes') as GeoJSONSource | undefined)?.setData(geo.value.routes)
    ;(map.getSource('airports') as GeoJSONSource | undefined)?.setData(geo.value.airports)
    if (fit) fitToData()
}

/**
 * Hover popup for arcs and airport dots.
 *
 * Bound at the map level rather than per layer so it survives style swaps; the
 * layer-existence check keeps it inert while a new style is still loading.
 * Popup text comes from the bundled airports.json, never from user input.
 */
function attachHover(target: MapLibreMap) {
    const routeLayers = ['route-line', 'route-glow']

    target.on('mousemove', event => {
        if (!target.getLayer('route-line')) return

        const hits = target.queryRenderedFeatures(event.point, { layers: routeLayers })
        const route = hits[0]?.properties as RouteProperties | undefined

        const dotHits = route ? [] : target.queryRenderedFeatures(event.point, { layers: ['airport-dot'] })
        const airport = dotHits[0]?.properties as AirportProperties | undefined

        const headline = route?.label ?? airport?.label
        if (!headline) {
            target.getCanvas().style.cursor = ''
            popup?.remove()
            return
        }

        target.getCanvas().style.cursor = 'pointer'
        // "via Dubai · 10,036 km" for a connecting flight, "10,036 km" otherwise.
        const detail = route
            ? [route.via ? `via ${route.via}` : '', `${Math.round(Number(route.distanceKm)).toLocaleString()} km`]
                .filter(Boolean)
                .join(' · ')
            : ''

        popup ??= new Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 10,
            className: 'route-map-popup',
        })
        popup
            .setLngLat(event.lngLat)
            .setHTML(`<strong>${headline}</strong>${detail ? `<span>${detail}</span>` : ''}`)
            .addTo(target)
    })

    target.on('mouseout', () => popup?.remove())
}

onMounted(() => {
    if (!container.value) return

    const instance = new MapLibreMap({
        container: container.value,
        style: STYLE_URL[isDark.value ? 'dark' : 'light'],
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: { compact: true },
        // The map lives inside a scrolling page, so the wheel must not hijack it.
        scrollZoom: false,
        dragRotate: false,
        touchZoomRotate: { around: 'center' },
        pitchWithRotate: false,
        touchPitch: false,
    })
    map = instance

    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    instance.on('style.load', () => {
        hideBasemapBorders()
        addRouteLayers()
        if (!hasFitted) fitToData()
    })
    attachHover(instance)
})

onBeforeUnmount(() => {
    popup?.remove()
    popup = null
    map?.remove()
    map = null
    hasFitted = false
})

// Year-filter changes re-frame the map so the visible arcs always fill the panel.
watch(geo, () => syncData(true))

watch(isDark, dark => {
    map?.setStyle(STYLE_URL[dark ? 'dark' : 'light'])
})
</script>

<template>
    <div ref="container" class="h-full w-full" data-testid="route-map" />
</template>
