<script setup lang="ts">
import { Card } from '@/components/ui/card'
import FlightBarChart from '@/views/FlightBarChart.vue';
import FlightRouteChart from '@/views/FlightRouteChart.vue';
import FlightMapChart from '@/views/FlightMapChart.vue';

defineProps<{ flights: any[] }>()
</script>

<template>
    <div class="space-y-4">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Flights</h3>
                <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{{ flights.length }}</p>
            </Card>

            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Spent</h3>
                <p class="text-3xl font-bold text-green-600 dark:text-green-300">
                    € {{flights.reduce((sum, f) => sum + (f.price || 0), 0).toFixed(2)}}
                </p>
            </Card>
        </div>

        <div class="max-w-6xl mx-auto">
            <FlightMapChart :flights="flights" />
        </div>

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
