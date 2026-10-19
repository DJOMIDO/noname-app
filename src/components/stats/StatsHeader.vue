<script lang="ts">
/** Which dashboard view the header metrics are scoped to. */
export type StatsView = 'overview' | 'flights' | 'trains'
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { FlightStatsRow, TrainStatsRow } from '@/lib/journeyColumns'
import {
    totalDistanceKm,
    totalFlightMinutes,
    totalTrainMinutes,
    visitedCityCount,
} from '@/lib/stats'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import iconFlight from '@/assets/images/flight.png'
import iconTrain from '@/assets/images/train.png'

/**
 * StatsHeader — the dashboard's control surface in one glass card: the view
 * switcher (reka-ui TabsTrigger, driven by the Tabs root this card sits in),
 * three hero digits scoped to the active view, secondary indicator chips and
 * the year filter. Distance and time are flight-scoped where trains cannot
 * contribute (no coordinates); the trains view flips to rail metrics.
 */
const props = defineProps<{
    view: StatsView
    /** Already year-filtered rows. */
    flights: FlightStatsRow[]
    /** Already year-filtered rows. */
    trains: TrainStatsRow[]
    /** Years present in the full dataset, newest first. */
    years: number[]
    activeYear: number | null
}>()

const emit = defineEmits<{
    (e: 'year-change', year: number | null): void
}>()

const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const pluralize = (n: number, singular: string, plural?: string) =>
    `${n} ${n === 1 ? singular : plural ?? `${singular}s`}`

const metrics = computed(() => {
    switch (props.view) {
        case 'flights':
            return [
                { label: 'Flights', value: String(props.flights.length), unit: '' },
                { label: 'Distance', value: totalDistanceKm(props.flights).toLocaleString(), unit: 'km' },
                { label: 'Time in the air', value: formatTime(totalFlightMinutes(props.flights)), unit: '' },
            ]
        case 'trains':
            return [
                { label: 'Journeys', value: String(props.trains.length), unit: '' },
                { label: 'Time on rails', value: formatTime(totalTrainMinutes(props.trains)), unit: '' },
                { label: 'Cities', value: String(visitedCityCount([], props.trains)), unit: '' },
            ]
        default:
            return [
                { label: 'Journeys', value: String(props.flights.length + props.trains.length), unit: '' },
                { label: 'Distance', value: totalDistanceKm(props.flights).toLocaleString(), unit: 'km' },
                {
                    label: 'Time',
                    value: formatTime(totalFlightMinutes(props.flights) + totalTrainMinutes(props.trains)),
                    unit: '',
                },
            ]
    }
})

// "2024 — 2026" across the filtered rows; a single year shows on its own.
const yearSpan = computed(() => {
    const dates = [
        ...props.flights.map(f => f.departure_date),
        ...props.trains.map(t => t.departure_date),
    ].filter(Boolean).sort()
    if (dates.length === 0) return null
    const first = dates[0].slice(0, 4)
    const last = dates[dates.length - 1].slice(0, 4)
    return first === last ? first : `${first} — ${last}`
})

const infoChips = computed(() => {
    const airlineCount = new Set(props.flights.map(f => f.airline_code).filter(Boolean)).size
    const companyCount = new Set(props.trains.map(t => t.train_company).filter(Boolean)).size
    switch (props.view) {
        case 'flights':
            return [
                pluralize(visitedCityCount(props.flights, []), 'city', 'cities'),
                pluralize(airlineCount, 'airline'),
            ]
        case 'trains':
            return [
                pluralize(visitedCityCount([], props.trains), 'city', 'cities'),
                pluralize(companyCount, 'company', 'companies'),
            ]
        default:
            return [
                pluralize(visitedCityCount(props.flights, props.trains), 'city', 'cities'),
                pluralize(airlineCount, 'airline'),
                pluralize(companyCount, 'company', 'companies'),
            ]
    }
})

// Same chip recipe as the journeys-page year filter.
const yearChipClass = (active: boolean) => cn(
    'rounded-full px-3 py-1 text-xs font-medium transition-colors border-0 cursor-pointer',
    active
        ? 'bg-brand text-white shadow-sm dark:bg-violet-500 dark:text-white'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/15 dark:hover:text-gray-200',
)

const triggerClass = cn(
    'flex flex-1 items-center justify-center gap-2 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500',
    'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow',
    'dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white',
)
</script>

<template>
    <section class="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-white/60
        bg-white/70 shadow-xl shadow-brand/10 backdrop-blur-md
        dark:border-white/10 dark:bg-white/5">
        <!-- View switcher: lives inside the page Tabs root, so triggers drive activeTab -->
        <div class="flex justify-center px-4 pt-4 sm:px-6 sm:pt-5">
            <TabsList class="flex w-full max-w-md rounded-xl bg-gray-100 p-1 shadow-inner dark:bg-white/10">
                <TabsTrigger value="overview" :class="triggerClass">
                    Overview
                </TabsTrigger>
                <TabsTrigger value="flights" :class="triggerClass">
                    <img :src="iconFlight" alt="" class="h-4 w-4 object-contain" />
                    <span>Flights</span>
                </TabsTrigger>
                <TabsTrigger value="trains" :class="triggerClass">
                    <img :src="iconTrain" alt="" class="h-4 w-4 object-contain" />
                    <span>Trains</span>
                </TabsTrigger>
            </TabsList>
        </div>

        <!-- Hero digits: three equal cells scoped to the active view -->
        <div class="mt-4 grid grid-cols-3 divide-x divide-gray-200/60 sm:mt-5 dark:divide-white/10">
            <div v-for="metric in metrics" :key="metric.label" class="px-2 pb-6 text-center sm:px-4 sm:pb-8">
                <p class="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                    <span class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">
                        {{ metric.value }}
                    </span>
                    <span v-if="metric.unit" class="ml-1 text-lg font-semibold text-gray-400 sm:text-xl dark:text-gray-500">
                        {{ metric.unit }}
                    </span>
                </p>
                <p class="mt-2 text-xs font-medium tracking-wide text-gray-500 uppercase sm:text-sm dark:text-gray-400">
                    {{ metric.label }}
                </p>
            </div>
        </div>

        <!-- Info chips + year filter: one wrapping row under a hairline -->
        <div class="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200/60 px-4 py-3 dark:border-white/10">
            <span v-for="chip in infoChips" :key="chip"
                class="rounded-full bg-brand/8 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-brand/15 dark:text-gray-300">
                {{ chip }}
            </span>
            <span v-if="yearSpan"
                class="rounded-full bg-brand/8 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-brand/15 dark:text-gray-300">
                {{ yearSpan }}
            </span>

            <span v-if="years.length" aria-hidden="true"
                class="mx-1 hidden h-4 w-px bg-gray-200 sm:block dark:bg-white/15" />

            <div v-if="years.length" class="flex flex-wrap items-center justify-center gap-1.5"
                role="group" aria-label="Filter by year">
                <button type="button" :class="yearChipClass(activeYear === null)" @click="emit('year-change', null)">
                    All time
                </button>
                <button v-for="year in years" :key="year" type="button"
                    :class="yearChipClass(activeYear === year)" @click="emit('year-change', year)">
                    {{ year }}
                </button>
            </div>
        </div>
    </section>
</template>
