<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import { Maximize2, Minimize2, Type } from 'lucide-vue-next'
import { useEventListener, useScrollLock } from '@vueuse/core'
import { useTheme } from '@/composables/useTheme'
import { flightRouteGeoJSON, type AirportProperties, type RouteProperties } from '@/lib/flightRoutes'
import type { FlightStatsRow } from '@/lib/journeyColumns'
import { basemapLabelLayerIds } from '@/lib/mapLabels'
import { cn } from '@/lib/utils'

/**
 * Route map — MapLibre GL over OpenFreeMap vector tiles, with great-circle
 * arcs coloured by a four-step heat scale (times flown).
 *
 * Replaces the former Leaflet + CARTO raster setup: vector tiles stay crisp on
 * retina displays, the basemap carries place labels, and no third-party API
 * key is needed. OpenFreeMap is MIT-licensed with an unlimited free public
 * instance, and can be self-hosted from its weekly planet dumps if that ever
 * changes.
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

/** Place-name visibility, persisted so the map reopens as the user left it. */
const LABELS_STORAGE_KEY = 'map-labels'
const showLabels = ref(localStorage.getItem(LABELS_STORAGE_KEY) !== 'false')

/** Theater-mode fullscreen: while expanded the shell teleports to <body>. */
const expanded = ref(false)
const bodyScrollLock = useScrollLock(document.body)

/** Glass chip styling shared by the floating map control buttons. */
const chipClass = 'flex size-8 items-center justify-center rounded-lg border border-white/60 bg-white/85 shadow-sm backdrop-blur-md transition-colors dark:border-white/10 dark:bg-gray-900/70'

const shellClass = computed(() =>
    expanded.value
        ? 'fixed inset-0 z-[60] bg-white dark:bg-gray-950'
        : 'relative h-full w-full',
)

// Fullscreen reaches the real viewport edges, so the controls must clear the
// notch / home indicator; inside the panel the insets are irrelevant.
const controlsClass = computed(() =>
    expanded.value
        ? 'absolute z-10 flex gap-1.5 left-[calc(0.75rem_+_env(safe-area-inset-left,0px))] top-[calc(0.75rem_+_env(safe-area-inset-top,0px))]'
        : 'absolute left-3 top-3 z-10 flex gap-1.5',
)

// Without a legend the heat colours are just arbitrary colours; the chip sits
// bottom-left, clear of MapLibre's attribution in the bottom-right corner.
const legendClass = computed(() => cn(
    'absolute z-10 flex items-center gap-2.5 rounded-lg border border-white/60 bg-white/85 px-2.5 py-1.5 text-[10px] font-medium text-gray-600 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-gray-900/70 dark:text-gray-300',
    expanded.value
        ? 'left-[calc(0.75rem_+_env(safe-area-inset-left,0px))] bottom-[calc(0.75rem_+_env(safe-area-inset-bottom,0px))]'
        : 'bottom-3 left-3',
))

// Imperative MapLibre handles — deliberately non-reactive, the map owns its state.
let map: MapLibreMap | null = null
let popup: Popup | null = null
let hasFitted = false

/**
 * Arc and marker colours per theme. The heat ramp runs cool→warm by times
 * flown (1 / 2–3 / 4–6 / 7+); dark mode lifts the same hues a step so they
 * still read against a near-black basemap. Dot and label colours mirror
 * --color-brand and --color-sunset in style.css.
 */
type HeatRamp = readonly [string, string, string, string]

/** Legend labels, index-aligned with the ramp and the step stops below. */
const HEAT_BINS = ['1', '2–3', '4–6', '7+'] as const

const palette = computed(() =>
    isDark.value
        ? {
            heat: ['#cbd5e1', '#7dd3fc', '#fcd34d', '#fda4af'] as HeatRamp,
            glowOpacity: 0.3,
            dot: '#141414',
            dotStroke: '#e3e3ff',
            label: '#e3e3ff',
            halo: '#0c0c0c',
        }
        : {
            heat: ['#94a3b8', '#0ea5e9', '#f59e0b', '#f43f5e'] as HeatRamp,
            glowOpacity: 0.22,
            dot: '#ffffff',
            dotStroke: '#7b5ff1',
            label: '#374151',
            halo: '#ffffff',
        },
)

const geo = computed(() => flightRouteGeoJSON(props.flights))

/**
 * Four-step heat colour: how many times the city pair was flown, in either
 * direction. A `step` expression reads `times` off each route feature, so
 * every leg of the same route paints identically. Replaces the old
 * line-progress brand gradient — a ramp along the line would read as
 * direction and fight the heat semantics.
 */
function heatColor(): ExpressionSpecification {
    const [once, few, often, many] = palette.value.heat
    return ['step', ['get', 'times'], once, 2, few, 4, often, 7, many]
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
 * Shows or hides every basemap text layer (place names, water names, POIs,
 * transport shields) per the user's toggle. Our own IATA labels stay put —
 * they annotate our data, not the basemap. Runs from `style.load` too, since
 * a theme swap rebuilds every layer with visibility reset.
 */
function applyLabelVisibility() {
    if (!map) return
    const visibility = showLabels.value ? 'visible' : 'none'
    for (const id of basemapLabelLayerIds(map.getStyle().layers)) {
        map.setLayoutProperty(id, 'visibility', visibility)
    }
}

function toggleLabels() {
    showLabels.value = !showLabels.value
    localStorage.setItem(LABELS_STORAGE_KEY, String(showLabels.value))
    applyLabelVisibility()
}

function toggleExpanded() {
    expanded.value = !expanded.value
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

    map.addSource('routes', { type: 'geojson', data: geo.value.routes })
    map.addSource('airports', { type: 'geojson', data: geo.value.airports })

    map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
            'line-color': heatColor(),
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
            'line-color': heatColor(),
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
        // "via Dubai · 10,036 km · flown 3×" for a repeated connecting flight,
        // "10,036 km" for a one-off direct one.
        const detail = route
            ? [
                route.via ? `via ${route.via}` : '',
                `${Math.round(Number(route.distanceKm)).toLocaleString()} km`,
                Number(route.times) > 1 ? `flown ${route.times}×` : '',
            ]
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
        applyLabelVisibility()
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

/**
 * Theater-mode expand: the shell teleports to <body> and covers the viewport.
 * It cannot stay in place — ChartPanel's `backdrop-blur-md` makes it the
 * containing block for `position: fixed` descendants, so an in-place overlay
 * would only ever cover the panel. Reparenting keeps the canvas (and its WebGL
 * context) alive; MapLibre learns the new box size only from `resize()`.
 * Expanding also re-frames the arcs: the same zoom spans a different extent on
 * a fullscreen aspect ratio than in the 420px panel.
 */
watch(expanded, isExpanded => {
    bodyScrollLock.value = isExpanded
    nextTick(() => {
        map?.resize()
        if (isExpanded) fitToData()
    })
})

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && expanded.value) expanded.value = false
})
</script>

<template>
    <Teleport to="body" :disabled="!expanded">
        <div :class="shellClass">
            <div ref="container" class="h-full w-full" data-testid="route-map" />
            <div :class="controlsClass">
                <button type="button" :aria-pressed="showLabels"
                    :aria-label="showLabels ? 'Hide place names' : 'Show place names'"
                    :class="cn(chipClass, showLabels
                        ? 'text-brand dark:text-violet-300'
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300')"
                    @click="toggleLabels">
                    <Type class="size-4" />
                </button>
                <button type="button" :aria-label="expanded ? 'Exit full screen' : 'Expand map to full screen'"
                    :class="cn(chipClass, 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white')"
                    @click="toggleExpanded">
                    <Minimize2 v-if="expanded" class="size-4" />
                    <Maximize2 v-else class="size-4" />
                </button>
            </div>
            <div :class="legendClass" role="img"
                aria-label="Route heat legend: slate flown once, sky 2 to 3 times, amber 4 to 6 times, rose 7 or more">
                <span v-for="(bin, index) in HEAT_BINS" :key="bin" class="flex items-center gap-1">
                    <span class="h-1.5 w-4 rounded-full" :style="{ backgroundColor: palette.heat[index] }" />
                    <span>{{ bin }}</span>
                </span>
            </div>
        </div>
    </Teleport>
</template>
