<!-- components/StatOverview.vue -->
<script setup lang="ts">
import { Card } from '@/components/ui/card'

defineProps<{
    flightCount: number
    trainCount: number
    totalSpent: number
    firstDeparture?: string
    lastDeparture?: string
    topCity?: string
    mostUsedTransport: string
    mostUsedAirline: string
    mostUsedTrainCompany: string
    mostCommonFlightRoute: string
    mostUsedFlightNumber: string
    mostCommonTrainRoute: string
}>()
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h2 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Flights</h2>
            <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{{ flightCount }}</p>
        </Card>
        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h2 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Trains</h2>
            <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{{ trainCount }}</p>
        </Card>
        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h2 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Spent</h2>
            <p class="text-3xl font-bold text-green-600 dark:text-green-300">€ {{ totalSpent.toFixed(2) }}</p>
        </Card>
        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h2 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Most Visited City</h2>
            <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ topCity }}</p>
        </Card>

        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h2 class="text-sm text-gray-500 dark:text-gray-300 mb-1">First Departure</h2>
            <p class="text-xl font-semibold text-gray-700 dark:text-gray-100">{{ firstDeparture }}</p>
        </Card>

        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h2 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Last Departure</h2>
            <p class="text-xl font-semibold text-gray-700 dark:text-gray-100">{{ lastDeparture }}</p>
        </Card>

        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Top Transport Mode</h3>
            <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedTransport }}</p>
        </Card>

        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Top Airline</h3>
            <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedAirline }}</p>
        </Card>

        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Top Train Company</h3>
            <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedTrainCompany }}</p>
        </Card>

        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Top Flight Route</h3>
            <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostCommonFlightRoute }}</p>
        </Card>

        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Top Flight Number</h3>
            <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostUsedFlightNumber }}</p>
        </Card>

        <Card class="p-6 text-center shadow-md bg-gray-100 dark:bg-gray-800">
            <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Top Train Route</h3>
            <p class="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{{ mostCommonTrainRoute }}</p>
        </Card>

    </div>
    <div class="mt-8 text-center text-gray-400 italic">More charts or stats coming soon...</div>
</template>
