<script setup lang="ts">
import { computed } from 'vue'
import type { FlightStatsRow, TrainStatsRow } from '@/lib/journeyColumns'
import { totalDistanceKm, totalFlightMinutes, visitedCityCount } from '@/lib/stats'

/**
 * StatsHero — FR24-style headline strip above the tabs: the three numbers a
 * traveller cares about first (flights, distance, time in the air) as hero
 * digits, with the long-tail indicators as small chips underneath.
 * Distance and duration are flight-scoped (trains carry no coordinates); the
 * train count rides along in the chip row.
 */
const props = defineProps<{
    flights: FlightStatsRow[]
    trains: TrainStatsRow[]
}>()

const flightCount = computed(() => props.flights.length)
const distanceKm = computed(() => totalDistanceKm(props.flights))
const cityCount = computed(() => visitedCityCount(props.flights, props.trains))
const airlineCount = computed(() =>
    new Set(props.flights.map(f => f.airline_code).filter(Boolean)).size)

const timeInAir = computed(() => {
    const minutes = totalFlightMinutes(props.flights)
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
})

// "2024 — 2026" across all logged flights; a single year shows on its own.
const yearSpan = computed(() => {
    const years = props.flights
        .map(f => f.departure_date?.slice(0, 4))
        .filter((y): y is string => Boolean(y))
        .sort()
    if (years.length === 0) return null
    const first = years[0]
    const last = years[years.length - 1]
    return first === last ? first : `${first} — ${last}`
})

const metrics = computed(() => [
    { label: 'Flights', value: String(flightCount.value), unit: '' },
    { label: 'Distance', value: distanceKm.value.toLocaleString(), unit: 'km' },
    { label: 'Time in the air', value: timeInAir.value, unit: '' },
])

const chips = computed(() => [
    `${cityCount.value} ${cityCount.value === 1 ? 'city' : 'cities'}`,
    `${airlineCount.value} ${airlineCount.value === 1 ? 'airline' : 'airlines'}`,
    `${props.trains.length} ${props.trains.length === 1 ? 'train' : 'trains'}`,
    ...(yearSpan.value ? [yearSpan.value] : []),
])
</script>

<template>
    <section class="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-white/60
        bg-white/70 shadow-xl shadow-brand/10 backdrop-blur-md
        dark:border-white/10 dark:bg-white/5">
        <!-- Hero digits: three equal cells, divided on sm and up -->
        <div class="grid grid-cols-3 divide-x divide-gray-200/60 dark:divide-white/10">
            <div v-for="metric in metrics" :key="metric.label" class="px-2 py-6 text-center sm:px-4 sm:py-8">
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

        <!-- Secondary indicators: quiet chip row under the digits -->
        <div class="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200/60 px-4 py-3 dark:border-white/10">
            <span v-for="chip in chips" :key="chip"
                class="rounded-full bg-brand/8 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-brand/15 dark:text-gray-300">
                {{ chip }}
            </span>
        </div>
    </section>
</template>
