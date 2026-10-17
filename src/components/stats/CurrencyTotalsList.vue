<script setup lang="ts">
import type { CurrencyTotals } from '@/types/journeys'
import { cn } from '@/lib/utils'

withDefaults(defineProps<{ totals: CurrencyTotals; size?: 'md' | 'lg' }>(), {
    size: 'md',
})
</script>

<template>
    <ul v-if="Object.keys(totals).length" :class="cn(
        'space-y-1 text-gray-800 dark:text-gray-100',
        size === 'md' ? 'text-xl' : 'text-3xl',
    )">
        <li v-for="(amount, currency) in totals" :key="currency" class="flex items-baseline justify-center gap-1.5">
            <span class="font-semibold text-brand dark:text-violet-200">{{ amount.toFixed(2) }}</span>
            <span :class="cn('text-mint dark:text-green-300', size === 'lg' && 'text-lg font-medium')">{{ currency }}</span>
        </li>
    </ul>
    <p v-else class="mt-2 text-sm italic text-gray-400">No spending recorded</p>
</template>
