<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
    label: string
    value?: string | number | null
    hint?: string
    // number: hero metric (big brand); title: brand text; muted: neutral text
    variant?: 'number' | 'title' | 'muted'
    // featured cards get more padding, a soft brand ring and larger value type
    featured?: boolean
    class?: HTMLAttributes['class']
}>(), {
    variant: 'number',
    featured: false,
})
</script>

<template>
    <div :class="cn(
        'flex flex-col justify-center rounded-2xl border border-white/60 bg-white/70 p-6 text-center shadow-sm backdrop-blur-md',
        'transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/15',
        'dark:border-white/10 dark:bg-white/5 dark:hover:border-brand/40',
        props.featured && 'p-8 ring-1 ring-brand/15 dark:ring-brand/20',
        props.class,
    )">
        <h3 :class="cn('mb-1 text-sm text-gray-500 dark:text-gray-300', props.featured && 'text-base')">{{ label }}</h3>

        <!-- Default to a formatted value line; a slot can override (e.g. currency list) -->
        <slot>
            <p v-if="value !== null && value !== undefined" :class="cn(
                variant === 'number' && 'text-3xl font-bold text-brand dark:text-violet-200',
                variant === 'title' && 'text-xl font-semibold text-brand dark:text-violet-200',
                variant === 'muted' && 'text-xl font-semibold text-gray-700 dark:text-gray-100',
                props.featured && variant === 'number' && 'text-5xl',
                props.featured && variant === 'title' && 'text-2xl',
                props.featured && variant === 'muted' && 'text-2xl',
            )">{{ value }}</p>
        </slot>

        <p v-if="hint" class="mt-1 text-sm text-mint dark:text-green-300">{{ hint }}</p>
    </div>
</template>
