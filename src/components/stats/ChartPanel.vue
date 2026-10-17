<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * ChartPanel — glass frame for charts and the route map, matching StatCard.
 * Provides a themed title header and a fixed-height, clipped body so the
 * chart canvas / map fills the panel instead of floating bare on the page.
 */
withDefaults(defineProps<{
    title: string
    bodyClass?: HTMLAttributes['class']
}>(), {
    bodyClass: 'h-[300px]',
})
</script>

<template>
    <div class="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md
        dark:border-white/10 dark:bg-white/5">
        <h3 class="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{{ title }}</h3>
        <div :class="cn('relative w-full overflow-hidden rounded-xl', bodyClass)">
            <slot />
        </div>
    </div>
</template>
