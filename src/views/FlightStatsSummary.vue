<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@/components/ui/card'
import airlines from '@/assets/data/airlines.json'

const props = defineProps<{ flights: any[] }>()

const totalSpent = computed(() =>
    props.flights.reduce((sum, f) => sum + (f.price || 0), 0)
)

function mostUsed(field: string): string {
    const count: Record<string, number> = {}
    for (const f of props.flights) {
        const value = f[field]
        if (value) count[value] = (count[value] || 0) + 1
    }
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
}

function mostUsedCount(field: string, value: string): number {
    return props.flights.filter(f => f[field] === value).length
}

const mostUsedAirlineCode = computed(() => mostUsed('airline_code'))

const mostUsedAirline = computed(() => {
    const code = mostUsedAirlineCode.value
    const match = airlines.find(a => a.code === code)
    return match ? match.name : code
})

const mostUsedAirlineCount = computed(() =>
    props.flights.filter(f => f.airline_code === mostUsedAirlineCode.value).length
)

const mostUsedFlightNumber = computed(() => {
    const count: Record<string, number> = {}
    for (const f of props.flights) {
        if (f.airline_code && f.flight_number) {
            const key = `${f.airline_code}${f.flight_number}`
            count[key] = (count[key] || 0) + 1
        }
    }
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
})

const mostUsedFlightNumberCount = computed(() =>
    props.flights.filter(
        f => `${f.airline_code}${f.flight_number}` === mostUsedFlightNumber.value
    ).length
)

const mostCommonRoute = computed(() => {
    const count: Record<string, number> = {}
    for (const f of props.flights) {
        if (f.departure_airport && f.arrival_airport) {
            const key = `${f.departure_airport} → ${f.arrival_airport}`
            count[key] = (count[key] || 0) + 1
        }
    }
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
})

const mostCommonRouteCount = computed(() =>
    props.flights.filter(
        f => `${f.departure_airport} → ${f.arrival_airport}` === mostCommonRoute.value
    ).length
)

const mostUsedDeparture = computed(() => mostUsed('departure_airport'))
const mostUsedArrival = computed(() => mostUsed('arrival_airport'))
const mostUsedAircraft = computed(() => mostUsed('aircraft_type'))
</script>

<template>
    <div class="w-full max-w-6xl mx-auto space-y-4">

        <!-- 第一行：2列 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Flights</h3>
                <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{{ flights.length }}</p>
            </Card>

            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Spent</h3>
                <p class="text-3xl font-bold text-green-600 dark:text-green-300">
                    € {{ totalSpent.toFixed(2) }}
                </p>
            </Card>
        </div>

        <!-- 第二行：3列 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Most Used Airline</h3>
                <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedAirline }}</p>
                <p class="text-sm text-green-600 dark:text-green-300">({{ mostUsedAirlineCount }} times)</p>
            </Card>

            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Most Frequent Flight Number</h3>
                <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedFlightNumber }}</p>
                <p class="text-sm text-green-600 dark:text-green-300">({{ mostUsedFlightNumberCount }} times)</p>
            </Card>

            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Most Common Route</h3>
                <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostCommonRoute }}</p>
                <p class="text-sm text-green-600 dark:text-green-300">({{ mostCommonRouteCount }} times)</p>
            </Card>
        </div>

        <!-- 第三行：3列 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Most Frequent Departure</h3>
                <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedDeparture }}</p>
                <p class="text-sm text-green-600 dark:text-green-300">({{ mostUsedCount('departure_airport',
                    mostUsedDeparture) }} times)</p>
            </Card>

            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Most Frequent Arrival</h3>
                <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedArrival }}</p>
                <p class="text-sm text-green-600 dark:text-green-300">({{ mostUsedCount('arrival_airport',
                    mostUsedArrival) }} times)</p>
            </Card>

            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Most Used Aircraft</h3>
                <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedAircraft }}</p>
                <p class="text-sm text-green-600 dark:text-green-300">({{ mostUsedCount('aircraft_type',
                    mostUsedAircraft) }} times)</p>
            </Card>
        </div>
    </div>
</template>
