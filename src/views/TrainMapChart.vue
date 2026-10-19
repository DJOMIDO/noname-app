<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import RouteMapChart from '@/views/RouteMapChart.vue'
import { resolvePlaces, type PlaceCoord } from '@/lib/stationGazetteer'
import { trainGeocodeQueries, trainRouteGeoJSON } from '@/lib/trainRoutes'
import type { TrainStatsRow } from '@/lib/journeyColumns'

/**
 * Train route map — trains carry no coordinates, so each endpoint station/city
 * name is resolved against the bundled offline station gazetteer (see
 * lib/stationGazetteer.ts) before the shared route geometry can draw it. No
 * network is involved, so resolution is instant and never rate-limited; the
 * brief "Resolving stations…" overlay only covers the lazy dataset import.
 * Names absent from the gazetteer are skipped, exactly as the flight map skips
 * unknown airports.
 *
 * Kept as its own async-loaded component so maplibre stays out of the main
 * bundle, mirroring FlightMapChart.
 */
const props = defineProps<{ trains: TrainStatsRow[] }>()

// Resolved coordinates keyed by the exact query string trainRoutes looks up.
const coords = ref<Map<string, PlaceCoord | null>>(new Map())
const loading = ref(props.trains.length > 0)

// Guards overlapping resolves when the year filter changes quickly: only the
// latest request may write into `coords`, so a slow earlier batch cannot
// clobber a newer one.
let requestToken = 0

const geo = computed(() => trainRouteGeoJSON(props.trains, coords.value))

async function resolve() {
    const token = (requestToken += 1)
    const queries = trainGeocodeQueries(props.trains)
    if (queries.length === 0) {
        if (token === requestToken) {
            coords.value = new Map()
            loading.value = false
        }
        return
    }
    loading.value = true
    const resolved = await resolvePlaces(queries)
    if (token !== requestToken) return
    coords.value = resolved
    loading.value = false
}

onMounted(resolve)
watch(() => props.trains, resolve)
</script>

<template>
    <RouteMapChart :routes="geo.routes" :points="geo.stations" :bounds="geo.bounds"
        point-text-property="name" variant="train" :loading="loading" />
</template>
