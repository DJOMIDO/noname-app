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
import { Loader2, Maximize2, Minimize2, Type } from 'lucide-vue-next'
import { useEventListener, useScrollLock } from '@vueuse/core'
import type { FeatureCollection, LineString, Point } from 'geojson'
import { useTheme } from '@/composables/useTheme'
import type { CameraBounds, RouteProperties } from '@/lib/routeGeometry'
import { basemapLabelLayerIds } from '@/lib/mapLabels'
import { cn } from '@/lib/utils'

/**
 * RouteMapChart — the transport-agnostic MapLibre renderer behind both route
 * maps. It draws pre-built GeoJSON (arcs coloured by a four-step heat scale for
 * times travelled; round-trip pairs arrive pre-separated from the geometry layer
 * as mirror-symmetric lens arcs) over OpenFreeMap vector tiles, and owns every
 * piece of map chrome: theme-aware basemap, place-name toggle, theater-mode
 * fullscreen, hover popups and the heat legend.
 *
 * FlightMapChart and TrainMapChart are thin data-prep wrappers that resolve
 * their rows into `routes` / `points` / `bounds` and pick a `variant` for the
 * popup + legend wording. Keeping the map here means the two tabs cannot drift.
 *
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

/** Fallback framing before any data lands: a relaxed world view. */
const DEFAULT_CENTER: [number, number] = [10, 25]
const DEFAULT_ZOOM = 1.1

/** Point features only need a hover headline; the dot's text comes from `pointTextProperty`. */
interface MapPointProperties {
    label: string
}

const props = withDefaults(defineProps<{
    routes: FeatureCollection<LineString, RouteProperties>
    points: FeatureCollection<Point, MapPointProperties>
    bounds: CameraBounds | null
    /** GeoJSON property rendered as the label under each dot ('iata' / 'name'). */
    pointTextProperty?: string
    /** Drives popup + legend wording: a flight is "flown", a train "ridden". */
    variant?: 'flight' | 'train'
    /** Train geocoding is async; the wrapper shows a resolving overlay. */
    loading?: boolean
}>(), {
    pointTextProperty: 'iata',
    variant: 'flight',
    loading: false,
})

const { isDark } = useTheme()
const container = ref<HTMLDivElement | null>(null)

/** Place-name visibility, persisted so the map reopens as the user left it. */
const LABELS_STORAGE_KEY = 'map-labels'
const showLabels = ref(localStorage.getItem(LABELS_STORAGE_KEY) !== 'false')

/** Theater-mode fullscreen: while expanded the shell teleports to <body>. */
const expanded = ref(false)
const bodyScrollLock = useScrollLock(document.body)

/** Past-tense verb for the heat legend and hover detail, per variant. */
const travelledVerb = computed(() => (props.variant === 'train' ? 'ridden' : 'flown'))

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
 * travelled (1 / 2–3 / 4–6 / 7+); dark mode lifts the same hues a step so they
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

const legendLabel = computed(() =>
    `Route heat legend: slate ${travelledVerb.value} once, sky 2 to 3 times, amber 4 to 6 times, rose 7 or more`)

/**
 * Four-step heat colour: how many times the city pair was travelled, in either
 * direction. A `step` expression reads `times` off each route feature, so every
 * leg of the same route paints identically. A ramp along the line would read as
 * direction and fight the heat semantics, so the colour is flat per feature.
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
 * transport shields) per the user's toggle. Our own point labels stay put —
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

    map.addSource('routes', { type: 'geojson', data: props.routes })
    map.addSource('points', { type: 'geojson', data: props.points })

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
        id: 'point-dot',
        type: 'circle',
        source: 'points',
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 2.5, 6, 4, 12, 6],
            'circle-color': colors.dot,
            'circle-stroke-color': colors.dotStroke,
            'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 0, 1, 6, 1.6, 12, 2.2],
        },
    })

    // Codes/names only from zoom 2.5 up — at world scale 100+ labels would be
    // an unreadable swarm. 'Noto Sans Bold' ships with the OpenFreeMap glyphs.
    map.addLayer({
        id: 'point-label',
        type: 'symbol',
        source: 'points',
        minzoom: 2.5,
        layout: {
            'text-field': ['get', props.pointTextProperty],
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
    if (!props.bounds) {
        // The year filter (or an unresolved geocode) emptied the data — drift
        // back to the world view instead of framing the previous routes.
        map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 500 })
        return
    }
    map.fitBounds(props.bounds, { padding: 32, maxZoom: 6, duration: 700 })
    hasFitted = true
}

/** Pushes the latest GeoJSON into the existing sources and optionally reframes. */
function syncData(fit: boolean) {
    if (!map || !map.getLayer('route-line')) return
    ;(map.getSource('routes') as GeoJSONSource | undefined)?.setData(props.routes)
    ;(map.getSource('points') as GeoJSONSource | undefined)?.setData(props.points)
    if (fit) fitToData()
}

/**
 * Hover popup for arcs and point dots.
 *
 * Bound at the map level rather than per layer so it survives style swaps; the
 * layer-existence check keeps it inert while a new style is still loading.
 * Popup text comes from bundled/resolved data, never from raw user input.
 */
function attachHover(target: MapLibreMap) {
    const routeLayers = ['route-line', 'route-glow']

    target.on('mousemove', event => {
        if (!target.getLayer('route-line')) return

        const hits = target.queryRenderedFeatures(event.point, { layers: routeLayers })
        const route = hits[0]?.properties as RouteProperties | undefined

        const dotHits = route ? [] : target.queryRenderedFeatures(event.point, { layers: ['point-dot'] })
        const point = dotHits[0]?.properties as MapPointProperties | undefined

        const headline = route?.label ?? point?.label
        if (!headline) {
            target.getCanvas().style.cursor = ''
            popup?.remove()
            return
        }

        target.getCanvas().style.cursor = 'pointer'
        // Flight: "via Dubai · 10,036 km · flown 3×". Train distance is a
        // great-circle estimate (real rail miles run higher), so it is flagged
        // as straight-line rather than presented as distance travelled.
        const distance = props.variant === 'train'
            ? `~${Math.round(Number(route?.distanceKm ?? 0)).toLocaleString()} km straight-line`
            : `${Math.round(Number(route?.distanceKm ?? 0)).toLocaleString()} km`
        const detail = route
            ? [
                route.via ? `via ${route.via}` : '',
                distance,
                Number(route.times) > 1 ? `${travelledVerb.value} ${route.times}×` : '',
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
        // Rotation is on so the globe can be spun (mouse: right/ctrl-drag,
        // touch: two-finger twist — neither hijacks page scroll). Pitch stays
        // locked so there is no tilt, per the globe interaction choice.
        dragRotate: true,
        touchZoomRotate: { around: 'center' },
        pitchWithRotate: false,
        touchPitch: false,
    })
    map = instance

    // Compass doubles as the "reset to north" control once rotation is enabled.
    instance.addControl(new NavigationControl({ showCompass: true }), 'top-right')
    instance.on('style.load', () => {
        // Globe at low zoom, auto-transitioning to flat Mercator as you zoom in
        // (MapLibre's default transition point). Re-applied on every style.load
        // because setStyle() — the theme swap below — resets the projection to
        // the incoming style's default, dropping us back to flat Mercator.
        instance.setProjection({ type: 'globe' })
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

// Data changes (year filter, or geocoded train coords landing) re-frame the map
// so the visible arcs always fill the panel.
watch(() => [props.routes, props.points, props.bounds], () => syncData(true))

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
            <div ref="container" class="h-full w-full" data-testid="route-map" :data-variant="variant" />
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
            <div :class="legendClass" role="img" :aria-label="legendLabel">
                <span v-for="(bin, index) in HEAT_BINS" :key="bin" class="flex items-center gap-1">
                    <span class="h-1.5 w-4 rounded-full" :style="{ backgroundColor: palette.heat[index] }" />
                    <span>{{ bin }}</span>
                </span>
            </div>
            <!-- Async geocoding overlay: trains resolve their stations over the
                 network, so show progress instead of an empty basemap. -->
            <div v-if="loading"
                class="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px] dark:bg-gray-950/40">
                <span class="flex items-center gap-2 rounded-lg border border-white/60 bg-white/85 px-3 py-1.5
                    text-xs font-medium text-gray-600 shadow-sm backdrop-blur-md
                    dark:border-white/10 dark:bg-gray-900/70 dark:text-gray-300">
                    <Loader2 class="size-3.5 animate-spin" />
                    Resolving stations…
                </span>
            </div>
        </div>
    </Teleport>
</template>
