<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { CurrencyTotals } from '@/types/journeys'
import type { FlightStatsRow } from '@/lib/journeyColumns'
import { airportByIata } from '@/lib/geo'
import { topList } from '@/lib/stats'
import airlines from '@/assets/data/airlines.json'
import FlightBarChart from '@/views/FlightBarChart.vue'
import FlightYearChart from '@/views/FlightYearChart.vue'
import FlightWeekdayChart from '@/views/FlightWeekdayChart.vue'
import FlightDurationStats from '@/views/FlightDurationStats.vue'
import FlightStatsSummary from '@/views/FlightStatsSummary.vue'
import ChartPanel from '@/components/stats/ChartPanel.vue'
import TopListCard, { type TopListItem } from '@/components/stats/TopListCard.vue'

// Routes are eagerly imported, so a static import here would pull maplibre-gl
// (~280 KB gzipped) into the main bundle. Only this panel needs it.
const FlightMapChart = defineAsyncComponent(() => import('@/views/FlightMapChart.vue'))

const props = defineProps<{
    flights: FlightStatsRow[]
    totalSpentByCurrency: CurrencyTotals
}>()

// Every flight touches two airports; rank them by total touches.
const topAirports = computed<TopListItem[]>(() =>
    topList(props.flights.flatMap(f => [f.departure_airport, f.arrival_airport]), iata => iata)
        .map(({ value, count }) => ({ label: value, sub: airportByIata(value)?.city, count })))

const topAirlines = computed<TopListItem[]>(() =>
    topList(props.flights, f => f.airline_code)
        .map(({ value, count }) => ({
            label: airlines.find(a => a.code === value)?.name ?? value,
            sub: value,
            count,
        })))

// City-level unordered pairs, the same pooling the route map heat uses, so
// CTU/TFU-style airport switches do not split a ranking entry.
const cityOf = (iata: string) => airportByIata(iata)?.city ?? iata
const topRoutes = computed<TopListItem[]>(() =>
    topList(props.flights, f => {
        const from = cityOf(f.departure_airport)
        const to = cityOf(f.arrival_airport)
        return from === to ? null : [from, to].sort().join(' ↔ ')
    }).map(({ value, count }) => ({ label: value, count })))
</script>

<template>
    <div class="space-y-4">
        <ChartPanel title="Route Map" body-class="h-[420px]">
            <FlightMapChart :flights="flights" />
        </ChartPanel>

        <FlightStatsSummary :flights="flights" :total-spent-by-currency="totalSpentByCurrency" />

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TopListCard title="Top Airports" :items="topAirports" />
            <TopListCard title="Top Airlines" :items="topAirlines" />
            <TopListCard title="Top Routes" :items="topRoutes" />
        </div>

        <FlightDurationStats :flights="flights" />

        <ChartPanel title="Flights per Year">
            <FlightYearChart :flights="flights" />
        </ChartPanel>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanel title="Flights per Month">
                <FlightBarChart :flights="flights" />
            </ChartPanel>
            <ChartPanel title="Flights per Weekday">
                <FlightWeekdayChart :flights="flights" />
            </ChartPanel>
        </div>
    </div>
</template>
