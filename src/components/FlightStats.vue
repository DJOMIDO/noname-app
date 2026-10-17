<script setup lang="ts">
import type { CurrencyTotals } from '@/types/journeys'
import type { FlightStatsRow } from '@/lib/journeyColumns'
import FlightMapChart from '@/views/FlightMapChart.vue'
import FlightRouteChart from '@/views/FlightRouteChart.vue'
import FlightBarChart from '@/views/FlightBarChart.vue'
import FlightDurationStats from '@/views/FlightDurationStats.vue'
import FlightStatsSummary from '@/views/FlightStatsSummary.vue'
import ChartPanel from '@/components/stats/ChartPanel.vue'

defineProps<{
    flights: FlightStatsRow[]
    totalSpentByCurrency: CurrencyTotals
}>()
</script>

<template>
    <div class="space-y-4">
        <ChartPanel title="Route Map" body-class="h-[420px]">
            <FlightMapChart :flights="flights" />
        </ChartPanel>

        <FlightStatsSummary :flights="flights" :total-spent-by-currency="totalSpentByCurrency" />

        <FlightDurationStats :flights="flights" />

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanel title="Flights per Month">
                <FlightBarChart :flights="flights" />
            </ChartPanel>
            <ChartPanel title="Top Flight Routes">
                <FlightRouteChart :flights="flights" />
            </ChartPanel>
        </div>
    </div>
</template>
