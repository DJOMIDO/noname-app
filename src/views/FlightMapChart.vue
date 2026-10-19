<script setup lang="ts">
import { computed } from 'vue'
import RouteMapChart from '@/views/RouteMapChart.vue'
import { flightRouteGeoJSON } from '@/lib/flightRoutes'
import type { FlightStatsRow } from '@/lib/journeyColumns'

/**
 * Flight route map — resolves flight rows into airport-node GeoJSON via the
 * bundled airports.json (synchronous, no network) and delegates rendering to
 * the shared RouteMapChart. Kept as its own async-loaded component so maplibre
 * stays out of the main bundle.
 */
const props = defineProps<{ flights: FlightStatsRow[] }>()

const geo = computed(() => flightRouteGeoJSON(props.flights))
</script>

<template>
    <RouteMapChart :routes="geo.routes" :points="geo.airports" :bounds="geo.bounds"
        point-text-property="iata" variant="flight" />
</template>
