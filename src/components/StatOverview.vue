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
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Flights" :value="flightCount" />
        <StatCard label="Trains" :value="trainCount" />
        <StatCard label="Total Spent">
            <CurrencyTotalsList :totals="totalSpentByCurrency" />
        </StatCard>

        <StatCard label="Most Visited City" :value="topCity" variant="title" />
        <StatCard label="First Departure" :value="firstDeparture" variant="muted" />
        <StatCard label="Last Departure" :value="lastDeparture" variant="muted" />

        <StatCard label="Top Transport Mode" :value="mostUsedTransport" variant="title" />
        <StatCard label="Top Airline" :value="mostUsedAirline" variant="title" />
        <StatCard label="Top Train Company" :value="mostUsedTrainCompany" variant="title" />
    </div>
</template>
