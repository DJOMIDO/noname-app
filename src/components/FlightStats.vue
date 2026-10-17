<script setup lang="ts">
import type { Flight, CurrencyTotals } from '@/types/journeys'
import FlightMapChart from '@/views/FlightMapChart.vue'
import FlightRouteChart from '@/views/FlightRouteChart.vue'
import FlightBarChart from '@/views/FlightBarChart.vue'
import FlightDurationStats from '@/views/FlightDurationStats.vue'
import FlightStatsSummary from '@/views/FlightStatsSummary.vue'

defineProps<{
    flights: Flight[]
    totalSpentByCurrency: CurrencyTotals
}>()
</script>

<template>
    <div class="space-y-4">
        <div class="mx-auto max-w-6xl">
            <FlightMapChart :flights="flights" />
        </div>

        <FlightStatsSummary :flights="flights" :total-spent-by-currency="totalSpentByCurrency" />

        <FlightDurationStats :flights="flights" />

        <div class="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row">
            <div class="h-[300px] w-full md:w-1/2">
                <FlightBarChart :flights="flights" />
            </div>
            <div class="h-[300px] w-full md:w-1/2">
                <FlightRouteChart :flights="flights" />
            </div>
        </div>
    </div>
</template>
