<script setup lang="ts">
import type { CurrencyTotals } from '@/types/journeys'

defineProps<{ totals: CurrencyTotals }>()
</script>

<template>
    <ul v-if="Object.keys(totals).length" class="space-y-1 text-xl text-gray-800 dark:text-gray-100">
        <li v-for="(amount, currency) in totals" :key="currency" class="flex justify-center gap-1">
            <span class="font-semibold text-brand dark:text-violet-200">{{ amount.toFixed(2) }}</span>
            <span class="text-mint dark:text-green-300">{{ currency }}</span>
        </li>
    </ul>
    <p v-else class="mt-2 text-sm italic text-gray-400">No spending recorded</p>
</template>
