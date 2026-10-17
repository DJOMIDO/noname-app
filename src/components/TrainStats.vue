<script setup lang="ts">
import type { Train, CurrencyTotals } from '@/types/journeys'
import StatCard from '@/components/stats/StatCard.vue'
import CurrencyTotalsList from '@/components/stats/CurrencyTotalsList.vue'

defineProps<{
    trains: Train[]
    totalSpentByCurrency: CurrencyTotals
}>()
</script>

<template>
    <div class="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total Train Journeys" :value="trains.length" />
        <StatCard label="Total Spent">
            <CurrencyTotalsList :totals="totalSpentByCurrency" />
        </StatCard>
    </div>
</template>
