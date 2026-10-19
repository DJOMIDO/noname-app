<script lang="ts">
/** One ranked row: big label, optional muted sub-label, bar-driving value. */
export interface TopListItem {
    label: string
    sub?: string
    /** Drives the bar width relative to the largest value in the list. */
    value: number
    /** Right-aligned readout; falls back to the raw value. */
    display?: string
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * TopListCard — glass ranking card with hand-rolled CSS bars (no Chart.js:
 * the glass styling and the bar transitions are easier to control in the
 * DOM). Shows the first `visibleN` rows; "Show all" reveals the complete
 * ranking inside the card behind a height-capped, scrollable list, so the
 * card grows by a bounded amount instead of stretching with every row.
 */
const props = withDefaults(defineProps<{
    title: string
    items: TopListItem[]
    visibleN?: number
}>(), { visibleN: 5 })

const expanded = ref(false)
const hasMore = computed(() => props.items.length > props.visibleN)
const visibleItems = computed(() =>
    hasMore.value && !expanded.value ? props.items.slice(0, props.visibleN) : props.items)
const maxValue = computed(() => Math.max(...props.items.map(item => item.value), 1))

const barWidth = (value: number) => `${(value / maxValue.value) * 100}%`
const display = (item: TopListItem) => item.display ?? String(item.value)
</script>

<template>
    <div class="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md
        dark:border-white/10 dark:bg-white/5">
        <div class="mb-4 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300">{{ title }}</h3>
            <slot name="actions" />
        </div>

        <!-- Expanded: the full ranking scrolls inside a height-capped list -->
        <ul v-if="items.length" class="space-y-2.5"
            :class="expanded && 'max-h-80 overflow-y-auto overscroll-contain pr-1'">
            <!-- Rows are display-only and never reordered, and labels may repeat
                 (a route flown twice), so the index keeps keys unique. -->
            <li v-for="(item, index) in visibleItems" :key="`${item.label}-${index}`" class="flex items-center gap-3">
                <div class="w-24 shrink-0 sm:w-28">
                    <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{{ item.label }}</p>
                    <p v-if="item.sub" class="truncate text-xs text-gray-400 dark:text-gray-500">{{ item.sub }}</p>
                </div>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    <div class="h-full rounded-full bg-gradient-to-r from-brand to-sunset transition-all duration-500"
                        :style="{ width: barWidth(item.value) }" />
                </div>
                <span class="min-w-7 shrink-0 text-right text-sm font-semibold text-gray-500 tabular-nums dark:text-gray-400">
                    {{ display(item) }}
                </span>
            </li>
        </ul>

        <button v-if="hasMore" type="button" :aria-expanded="expanded"
            class="mt-3 rounded-md text-xs font-semibold text-brand transition-colors hover:text-violet-600
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand
                dark:text-violet-300 dark:hover:text-violet-200"
            @click="expanded = !expanded">
            {{ expanded ? 'Show less' : `Show all (${items.length})` }}
        </button>

        <p v-if="!items.length" class="text-sm text-gray-400 italic">No data yet</p>
    </div>
</template>
