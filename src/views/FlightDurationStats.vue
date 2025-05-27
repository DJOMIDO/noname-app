<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@/components/ui/card'
import { getFlightDuration } from '@/utils/getFlightDuration'
const props = defineProps<{ flights: any[] }>()

const durations = computed(() => {
    return props.flights
        .map(f => {
            const mins = getFlightDuration(
                f.departure_airport,
                f.departure_date,
                f.departure_time,
                f.arrival_airport,
                f.arrival_date,
                f.arrival_time
            )
            return mins != null ? { ...f, duration: mins } : null
        })
        .filter(Boolean)
        .sort((a, b) => b!.duration - a!.duration)
})

const totalMinutes = computed(() =>
    durations.value.reduce((sum, f) => sum + f.duration, 0)
)
const top5Longest = computed(() => durations.value.slice(0, 5))
const shortest = computed(() => durations.value[durations.value.length - 1] || null)

function formatDuration(mins: number): string {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
}
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-6xl mx-auto">
        <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Flight Time</h3>
            <div class="flex-1 flex items-center justify-center">
                <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-300">
                    {{ formatDuration(totalMinutes) }}
                </p>
            </div>
        </Card>

        <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-2 text-center">Top 5 Longest Flights</h3>
            <ul class="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                <li v-for="f in top5Longest" :key="f.id">
                    <span class="text-indigo-600 dark:text-indigo-300">
                        {{ f.departure_airport }} → {{ f.arrival_airport }}
                    </span>
                    :
                    <span class="text-green-600 dark:text-green-300">
                        {{ formatDuration(f.duration) }}
                    </span>
                </li>
            </ul>
        </Card>

        <Card v-if="shortest" class="p-6 bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-2 text-center">Shortest Flight</h3>
            <div class="flex-1 flex items-center justify-center">
                <p class="text-sm text-center">
                    <span class="text-indigo-600 dark:text-indigo-300">
                        {{ shortest.departure_airport }} → {{ shortest.arrival_airport }}
                    </span>
                    :
                    <span class="text-green-600 dark:text-green-300">
                        {{ formatDuration(shortest.duration) }}
                    </span>
                </p>
            </div>
        </Card>
    </div>
</template>
