<script setup lang="ts">
import { computed } from 'vue'
import type { CurrencyTotals } from '@/types/journeys'
import type { TrainStatsRow } from '@/lib/journeyColumns'
import { topList, trainLegMinutes } from '@/lib/stats'
import ChartPanel from '@/components/stats/ChartPanel.vue'
import StatCard from '@/components/stats/StatCard.vue'
import CurrencyTotalsList from '@/components/stats/CurrencyTotalsList.vue'
import TopListCard, { type TopListItem } from '@/components/stats/TopListCard.vue'
import JourneyMonthChart from '@/views/JourneyMonthChart.vue'
import JourneyYearChart from '@/views/JourneyYearChart.vue'
import JourneyWeekdayChart from '@/views/JourneyWeekdayChart.vue'

const props = defineProps<{
    trains: TrainStatsRow[]
    totalSpentByCurrency: CurrencyTotals
}>()

// Stations carry no coordinates, so there is no route map or distance here —
// the tab mirrors the flights layout minus those, and duration is the only
// "longest" ranking a train can offer.
const fromLabel = (t: TrainStatsRow) => t.departure_city || t.departure_station
const toLabel = (t: TrainStatsRow) => t.arrival_city || t.arrival_station
const fmtDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`

// Every journey touches two stations; rank them by total touches, sub-labelled
// with the city when one is recorded.
const topStations = computed<TopListItem[]>(() => {
    const city = new Map<string, string>()
    for (const t of props.trains) {
        if (t.departure_station && t.departure_city) city.set(t.departure_station, t.departure_city)
        if (t.arrival_station && t.arrival_city) city.set(t.arrival_station, t.arrival_city)
    }
    return topList(props.trains.flatMap(t => [t.departure_station, t.arrival_station]), s => s)
        .map(({ value: station, count }) => ({ label: station, sub: city.get(station), value: count }))
})

const topCompanies = computed<TopListItem[]>(() =>
    topList(props.trains, t => t.train_company)
        .map(({ value: company, count }) => ({ label: company, value: count })))

// City-level unordered pairs, so the same corridor served from different
// stations is not split across ranking entries.
const topRoutes = computed<TopListItem[]>(() =>
    topList(props.trains, t => {
        const from = fromLabel(t)
        const to = toLabel(t)
        return from && to && from !== to ? [from, to].sort().join(' ↔ ') : null
    }).map(({ value: route, count }) => ({ label: route, value: count })))

const topTypes = computed<TopListItem[]>(() =>
    topList(props.trains, t => t.train_type)
        .map(({ value: type, count }) => ({ label: type, value: count })))

const topNumbers = computed<TopListItem[]>(() => {
    const company = new Map<string, string>()
    for (const t of props.trains) {
        if (t.train_number && t.train_company) company.set(t.train_number, t.train_company)
    }
    return topList(props.trains, t => t.train_number)
        .map(({ value: number, count }) => ({ label: number, sub: company.get(number), value: count }))
})

// Ranked by time on rails; journeys missing a complete arrival are skipped
// rather than shown as zero, so the shortest sits at the bottom of the panel.
const longestJourneys = computed<TopListItem[]>(() =>
    props.trains
        .map(t => ({ t, minutes: trainLegMinutes(t) }))
        .filter((entry): entry is { t: TrainStatsRow; minutes: number } => entry.minutes !== null)
        .sort((a, b) => b.minutes - a.minutes)
        .map(({ t, minutes }) => ({
            label: `${fromLabel(t)} → ${toLabel(t)}`,
            sub: t.departure_date,
            value: minutes,
            display: fmtDuration(minutes),
        })))
</script>

<template>
    <div class="space-y-4">
        <!-- relative: the row is the positioning context TopListCard expands against -->
        <div class="relative grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TopListCard title="Top Stations" :items="topStations" />
            <TopListCard title="Top Companies" :items="topCompanies" />
            <TopListCard title="Top Routes" :items="topRoutes" />
        </div>

        <div class="relative grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TopListCard title="Top Train Types" :items="topTypes" />
            <TopListCard title="Top Train Numbers" :items="topNumbers" />
            <TopListCard title="Longest Journeys" :items="longestJourneys" />
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StatCard label="Total Spent" featured>
                <CurrencyTotalsList :totals="totalSpentByCurrency" size="lg" />
            </StatCard>
            <ChartPanel title="Trains per Year" class="lg:col-span-2">
                <JourneyYearChart :rows="trains" label="Trains" />
            </ChartPanel>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanel title="Trains per Month">
                <JourneyMonthChart :rows="trains" label="Trains" />
            </ChartPanel>
            <ChartPanel title="Trains per Weekday">
                <JourneyWeekdayChart :rows="trains" label="Trains" />
            </ChartPanel>
        </div>
    </div>
</template>
