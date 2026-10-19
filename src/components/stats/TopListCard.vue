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
import { Maximize2, X } from 'lucide-vue-next'

/**
 * TopListCard — glass ranking card with hand-rolled CSS bars (no Chart.js:
 * the glass styling and the bar transitions are easier to control in the
 * DOM). Collapsed it shows the first `visibleN` rows as horizontal bars.
 * Expanding (flightradar24-style) switches to the full ranking as vertical
 * columns that scroll horizontally. On `lg` the expanded card spans the full
 * row width in place (`absolute inset-x-0` against the relative row), overlaying
 * siblings who keep their tracks. The body area has a fixed height, so the
 * expanded panel is exactly as tall as its row: nothing overflows vertically,
 * siblings never wrap, and the rows below never move or get covered.
 */
const props = withDefaults(defineProps<{
    title: string
    items: TopListItem[]
    visibleN?: number
}>(), { visibleN: 5 })

const expanded = ref(false)

const hasMore = computed(() => props.items.length > props.visibleN)
const visibleItems = computed(() => props.items.slice(0, props.visibleN))
const maxValue = computed(() => Math.max(...props.items.map(item => item.value), 1))
const totalValue = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))

const barWidth = (value: number) => `${(value / maxValue.value) * 100}%`
const barHeight = (value: number) => `${(value / maxValue.value) * 100}%`
const display = (item: TopListItem) => item.display ?? String(item.value)
const percent = (item: TopListItem) =>
    totalValue.value > 0 ? `${Math.round((item.value / totalValue.value) * 100)}%` : '0%'
</script>

<template>
    <!-- Expanded on `lg`: absolute against the (relative) row so the card spans
         the full row width in place, overlaying siblings who keep their tracks
         (never wrapped). The fixed body height keeps the panel exactly as tall
         as the row, so it never spills onto the rows below. -->
    <div class="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md
        dark:border-white/10 dark:bg-white/5"
        :class="expanded && 'shadow-xl shadow-brand/10 lg:absolute lg:inset-x-0 lg:z-10'">
        <!-- Fixed header height (fits the tallest #actions content, e.g. the
             Time/Distance segmented capsule) so every card is the same height
             whether or not it renders an actions slot. -->
        <div class="mb-4 flex h-7 items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300">{{ title }}</h3>
            <div class="flex items-center gap-2">
                <slot name="actions" />
                <button v-if="hasMore" type="button" :aria-expanded="expanded"
                    :aria-label="expanded ? `Collapse ${title}` : `Show all ${items.length} ${title}`"
                    :title="expanded ? 'Collapse' : `Show all (${items.length})`"
                    class="rounded-md border-0 bg-transparent p-1 text-gray-400 transition-colors cursor-pointer
                        hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand
                        dark:text-gray-500 dark:hover:text-violet-300"
                    @click="expanded = !expanded">
                    <X v-if="expanded" class="size-4" />
                    <Maximize2 v-else class="size-4" />
                </button>
            </div>
        </div>

        <!-- Collapsed: horizontal bars, top-N. Fixed body height keeps every
             card (and its expanded state) the same size. -->
        <ul v-if="items.length && !expanded" class="h-64 space-y-2.5 overflow-hidden">
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

        <!-- Expanded: every item as a vertical column, side by side, scrolling
             horizontally inside the same fixed body height. -->
        <div v-if="items.length && expanded" class="h-64 overflow-x-auto overflow-y-hidden pb-1
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div class="flex min-w-max items-end gap-2 sm:gap-3">
                <div v-for="(item, index) in items" :key="`${item.label}-${index}`"
                    class="flex w-12 flex-col items-center gap-1 sm:w-14">
                    <span class="text-xs font-semibold text-gray-500 tabular-nums dark:text-gray-400">
                        {{ display(item) }}
                    </span>
                    <div class="flex h-40 w-full items-end justify-center">
                        <div class="w-3 rounded-t-full bg-gradient-to-t from-brand to-violet-400 sm:w-4"
                            :style="{ height: barHeight(item.value) }" />
                    </div>
                    <span class="w-full truncate text-center text-xs font-medium text-gray-800 dark:text-gray-100">
                        {{ item.label }}
                    </span>
                    <span class="text-[10px] text-gray-400 tabular-nums dark:text-gray-500">{{ percent(item) }}</span>
                </div>
            </div>
        </div>

        <p v-if="!items.length" class="flex h-64 items-center text-sm text-gray-400 italic">No data yet</p>
    </div>
</template>
