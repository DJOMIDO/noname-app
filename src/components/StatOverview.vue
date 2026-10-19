<script setup lang="ts">
import { computed } from 'vue'
import type { CurrencyTotals } from '@/types/journeys'
import type { FlightStatsRow, TrainStatsRow } from '@/lib/journeyColumns'
import { airportByIata } from '@/lib/geo'
import { topList } from '@/lib/stats'
import airlines from '@/assets/data/airlines.json'
import ChartPanel from '@/components/stats/ChartPanel.vue'
import StatCard from '@/components/stats/StatCard.vue'
import CurrencyTotalsList from '@/components/stats/CurrencyTotalsList.vue'
import TopListCard, { type TopListItem } from '@/components/stats/TopListCard.vue'
import JourneyYearChart from '@/views/JourneyYearChart.vue'

/**
 * StatOverview — the cross-modal dashboard: money + a pooled year trend, three
 * rankings that blend flights and trains (cities, carriers, corridors), and the
 * travel bookends. The old single-winner "Top X" cards are absorbed into the
 * full rankings, so nothing is lost — only upgraded to the flights-tab language.
 */
const props = defineProps<{
    flights: FlightStatsRow[]
    trains: TrainStatsRow[]
    totalSpentByCurrency: CurrencyTotals
    firstDeparture?: string | null
    lastDeparture?: string | null
    mostUsedTransport: string
}>()

const allJourneys = computed(() => [...props.flights, ...props.trains])

const cityOf = (iata: string) => airportByIata(iata)?.city ?? iata
const trainCity = (t: TrainStatsRow, side: 'departure' | 'arrival') =>
    side === 'departure' ? (t.departure_city || t.departure_station) : (t.arrival_city || t.arrival_station)

// Arrival cities pooled across both modes; flight airports resolve through
// airports.json so same-city codes (PVG/SHA) fold into one entry.
const topCities = computed<TopListItem[]>(() =>
    topList([
        ...props.flights.map(f => cityOf(f.arrival_airport)),
        ...props.trains.map(t => trainCity(t, 'arrival')),
    ], c => c || null)
        .map(({ value: city, count }) => ({ label: city, value: count })))

// Airlines and rail companies ranked together as "who moves me most"; the sub
// label keeps the mode legible, ties broken alphabetically for a stable order.
const topCarriers = computed<TopListItem[]>(() => {
    const airlineItems = topList(props.flights, f => f.airline_code)
        .map(({ value: code, count }) => ({
            label: airlines.find(a => a.code === code)?.name ?? code,
            sub: `Airline · ${code}`,
            value: count,
        }))
    const companyItems = topList(props.trains, t => t.train_company)
        .map(({ value: company, count }) => ({ label: company, sub: 'Rail', value: count }))
    return [...airlineItems, ...companyItems]
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
})

// City-level unordered pairs pooled across both modes — the same corridor flown
// and railed counts once, matching the per-tab route rankings.
const routeOf = (from: string, to: string) =>
    from && to && from !== to ? [from, to].sort().join(' ↔ ') : null
const topRoutes = computed<TopListItem[]>(() =>
    topList([
        ...props.flights.map(f => routeOf(cityOf(f.departure_airport), cityOf(f.arrival_airport))),
        ...props.trains.map(t => routeOf(trainCity(t, 'departure'), trainCity(t, 'arrival'))),
    ], r => r)
        .map(({ value: route, count }) => ({ label: route, value: count })))
</script>

<template>
    <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StatCard label="Total Spent" featured>
                <CurrencyTotalsList :totals="totalSpentByCurrency" size="lg" />
            </StatCard>
            <ChartPanel title="Journeys per Year" class="lg:col-span-2">
                <JourneyYearChart :rows="allJourneys" label="Journeys" />
            </ChartPanel>
        </div>

        <!-- relative: the row is the positioning context TopListCard expands against -->
        <div class="relative grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TopListCard title="Top Cities" :items="topCities" />
            <TopListCard title="Top Carriers" :items="topCarriers" />
            <TopListCard title="Top Routes" :items="topRoutes" />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="First Departure" :value="firstDeparture" variant="muted" />
            <StatCard label="Last Departure" :value="lastDeparture" variant="muted" />
            <StatCard label="Top Transport Mode" :value="mostUsedTransport" variant="title" />
        </div>
    </div>
</template>
