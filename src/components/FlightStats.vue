<script setup lang="ts">
import FlightBarChart from '@/views/FlightBarChart.vue';
import FlightRouteChart from '@/views/FlightRouteChart.vue';
import FlightMapChart from '@/views/FlightMapChart.vue';
import FlightDurationStats from '@/views/FlightDurationStats.vue';
import FlightStatsSummary from '@/views/FlightStatsSummary.vue';

defineProps<{
    flights: any[]
    totalSpentByCurrency: Record<string, number>
}>()
</script>

<template>
    <div class="space-y-4">

        <div class="max-w-6xl mx-auto">
            <FlightMapChart :flights="flights" />
        </div>

        <FlightStatsSummary :flights="flights" :total-spent-by-currency="totalSpentByCurrency" />

        <FlightDurationStats :flights="flights" />

        <div class="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
            <div class="w-full md:w-1/2 h-[300px]">
                <FlightBarChart :flights="flights" />
            </div>
            <div class="w-full md:w-1/2 h-[300px]">
                <FlightRouteChart :flights="flights" />
            </div>
        </div>

        <div class="mt-8 text-center text-gray-400 italic">More charts or stats coming soon...</div>
    </div>
</template>
