<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{ currentPage: number, totalPages: number }>()
const emit = defineEmits<{ (e: 'prev'): void, (e: 'next'): void }>()
</script>

<template>
    <div class="flex justify-center items-center gap-4 mt-6">
        <button
            class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-white disabled:opacity-50"
            :disabled="props.currentPage === 1" @click="emit('prev')">
            &lt; Previous
        </button>

        <span class="text-gray-600 dark:text-gray-300">
            Page {{ props.currentPage }} of {{ props.totalPages }}
        </span>

        <button
            class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-white disabled:opacity-50"
            :disabled="props.currentPage === props.totalPages" @click="emit('next')">
            Next &gt;
        </button>
    </div>
</template>