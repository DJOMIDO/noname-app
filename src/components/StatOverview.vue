<!-- components/StatOverview.vue -->
<script setup lang="ts">
import { Card } from '@/components/ui/card'

defineProps<{
    flightCount: number
    trainCount: number
    totalSpentByCurrency: Record<string, number>
    firstDeparture?: string
    lastDeparture?: string
    topCity?: string
    mostUsedTransport: string
    mostUsedAirline: string
    mostUsedTrainCompany: string
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
            <ul v-if="totalSpentByCurrency && Object.keys(totalSpentByCurrency).length"
                class="text-xl text-gray-800 dark:text-gray-100 space-y-1">
                <li v-for="(amount, currency) in totalSpentByCurrency" :key="currency"
                    class="flex justify-center gap-1">
                    <span class="font-semibold text-indigo-600 dark:text-indigo-300">
                        {{ amount.toFixed(2) }}
                    </span>
                    <span class="text-green-600 dark:text-green-300">{{ currency }}</span>
                </li>
            </ul>
            <p v-else class="text-sm text-gray-400 italic mt-2">No spending recorded</p>
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

    </div>
    <div class="mt-8 text-center text-gray-400 italic">More charts or stats coming soon...</div>
</template>
