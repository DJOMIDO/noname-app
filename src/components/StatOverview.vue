<script setup lang="ts">
import type { CurrencyTotals } from '@/types/journeys'
import StatCard from '@/components/stats/StatCard.vue'
import CurrencyTotalsList from '@/components/stats/CurrencyTotalsList.vue'

defineProps<{
    flightCount: number
    trainCount: number
    totalSpentByCurrency: CurrencyTotals
    firstDeparture?: string | null
    lastDeparture?: string | null
    topCity?: string
    mostUsedTransport: string
    mostUsedAirline: string
    mostUsedTrainCompany: string
}>()
</script>

<template>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Hero row -->
        <StatCard label="Total Spent" featured class="sm:col-span-2">
            <CurrencyTotalsList :totals="totalSpentByCurrency" size="lg" />
        </StatCard>
        <StatCard label="Flights" :value="flightCount" />
        <StatCard label="Trains" :value="trainCount" />

        <!-- Highlights row -->
        <StatCard label="Most Visited City" :value="topCity" variant="title" featured class="sm:col-span-2" />
        <StatCard label="Top Transport Mode" :value="mostUsedTransport" variant="title" />
        <StatCard label="Top Airline" :value="mostUsedAirline" variant="title" />

        <!-- Detail row -->
        <StatCard label="First Departure" :value="firstDeparture" variant="muted" />
        <StatCard label="Last Departure" :value="lastDeparture" variant="muted" />
        <StatCard label="Top Train Company" :value="mostUsedTrainCompany" variant="title" class="sm:col-span-2" />
    </div>
</template>
