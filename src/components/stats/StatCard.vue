<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
    label: string
    value?: string | number | null
    hint?: string
    // number: hero metric (big brand); title: brand text; muted: neutral text
    variant?: 'number' | 'title' | 'muted'
    class?: HTMLAttributes['class']
}>(), {
    variant: 'number',
})
</script>

<template>
    <div :class="cn(
        'rounded-2xl border border-white/60 bg-white/70 p-6 text-center shadow-sm backdrop-blur-md',
        'transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/15',
        'dark:border-white/10 dark:bg-white/5 dark:hover:border-brand/40',
        props.class,
    )">
        <h3 class="mb-1 text-sm text-gray-500 dark:text-gray-300">{{ label }}</h3>

        <!-- Default to a formatted value line; a slot can override (e.g. currency list) -->
        <slot>
            <p v-if="value !== null && value !== undefined" :class="cn(
                variant === 'number' && 'text-3xl font-bold text-brand dark:text-violet-200',
                variant === 'title' && 'text-xl font-semibold text-brand dark:text-violet-200',
                variant === 'muted' && 'text-xl font-semibold text-gray-700 dark:text-gray-100',
            )">{{ value }}</p>
        </slot>

        <p v-if="hint" class="mt-1 text-sm text-mint dark:text-green-300">{{ hint }}</p>
    </div>
</template>
