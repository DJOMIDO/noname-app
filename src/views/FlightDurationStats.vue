<script setup lang="ts">
import { computed } from 'vue'
import type { Flight } from '@/types/journeys'
import { getFlightDuration } from '@/utils/getFlightDuration'
import StatCard from '@/components/stats/StatCard.vue'

const props = defineProps<{ flights: Flight[] }>()

type FlightWithDuration = Flight & { duration: number }

const glassPanel =
    'rounded-2xl border border-white/60 bg-white/70 p-6 text-center shadow-sm backdrop-blur-md ' +
    'transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/15 ' +
    'dark:border-white/10 dark:bg-white/5 dark:hover:border-brand/40'

const durations = computed<FlightWithDuration[]>(() =>
    props.flights
        .map(f => {
            const mins = getFlightDuration(
                f.departure_airport,
                f.departure_date,
                f.departure_time,
                f.arrival_airport,
                f.arrival_date,
                f.arrival_time,
            )
            return mins != null ? { ...f, duration: mins } : null
        })
        .filter((f): f is FlightWithDuration => f !== null)
        .sort((a, b) => b.duration - a.duration),
)

const totalMinutes = computed(() => durations.value.reduce((sum, f) => sum + f.duration, 0))
const top5Longest = computed(() => durations.value.slice(0, 5))
const shortest = computed(() => durations.value[durations.value.length - 1] ?? null)

function formatDuration(mins: number): string {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
}
</script>

<template>
    <div class="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Flight Time" :value="formatDuration(totalMinutes)" />

        <div :class="glassPanel">
            <h3 class="mb-2 text-sm text-gray-500 dark:text-gray-300">Top 5 Longest Flights</h3>
            <ul v-if="top5Longest.length" class="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                <li v-for="f in top5Longest" :key="f.id">
                    <span class="font-medium text-brand dark:text-violet-200">
                        {{ f.departure_airport }} → {{ f.arrival_airport }}
                    </span>
                    <span class="mx-1 text-gray-400">·</span>
                    <span class="text-mint dark:text-green-300">{{ formatDuration(f.duration) }}</span>
                </li>
            </ul>
            <p v-else class="text-sm italic text-gray-400">No duration data yet</p>
        </div>

        <div v-if="shortest" :class="glassPanel">
            <h3 class="mb-2 text-sm text-gray-500 dark:text-gray-300">Shortest Flight</h3>
            <p class="text-sm">
                <span class="font-medium text-brand dark:text-violet-200">
                    {{ shortest.departure_airport }} → {{ shortest.arrival_airport }}
                </span>
                <span class="mx-1 text-gray-400">·</span>
                <span class="text-mint dark:text-green-300">{{ formatDuration(shortest.duration) }}</span>
            </p>
        </div>
    </div>
</template>
