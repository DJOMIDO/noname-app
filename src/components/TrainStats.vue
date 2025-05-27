<script setup lang="ts">
import { Card } from '@/components/ui/card'

defineProps<{
    trains: any[]
    totalSpentByCurrency: Record<string, number>
}>()
</script>

<template>
    <div class="space-y-4">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Train Journeys</h3>
                <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{{ trains.length }}</p>
            </Card>

            <Card class="p-6 text-center bg-gray-100 dark:bg-gray-800">
                <h3 class="text-sm text-gray-500 dark:text-gray-300 mb-1">Total Spent</h3>
                <ul v-if="Object.keys(totalSpentByCurrency).length"
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

        </div>

        <div class="mt-8 text-center text-gray-400 italic">More charts or stats coming soon...</div>
    </div>
</template>