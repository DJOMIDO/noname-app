<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

defineProps<{ currentPage: number, totalPages: number }>()
const emit = defineEmits<{ (e: 'prev'): void, (e: 'next'): void }>()
</script>

<template>
    <!-- Hidden when there is nothing to page through -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-3">
        <button :disabled="currentPage === 1" @click="emit('prev')"
            class="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-sm
                font-medium text-gray-700 transition-colors hover:border-brand/40 hover:text-brand
                disabled:pointer-events-none disabled:opacity-40
                dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-brand/40 dark:hover:text-violet-200">
            <ChevronLeft class="size-4" aria-hidden="true" />
            Previous
        </button>

        <span class="text-sm tabular-nums text-gray-500 dark:text-gray-400">
            {{ currentPage }} / {{ totalPages }}
        </span>

        <button :disabled="currentPage === totalPages" @click="emit('next')"
            class="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-sm
                font-medium text-gray-700 transition-colors hover:border-brand/40 hover:text-brand
                disabled:pointer-events-none disabled:opacity-40
                dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:border-brand/40 dark:hover:text-violet-200">
            Next
            <ChevronRight class="size-4" aria-hidden="true" />
        </button>
    </div>
</template>
