<script lang="ts">
/** One ranked row: big label, optional muted sub-label (city / code), count. */
export interface TopListItem {
    label: string
    sub?: string
    count: number
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * TopListCard — glass ranking card with hand-rolled CSS bars (no Chart.js:
 * the in-place expand animation and the glass styling are easier to control
 * in the DOM). Shows the first `visibleN` rows; the rest unfold in place
 * behind a Show all / Show less toggle.
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
const hiddenItems = computed(() => (hasMore.value ? props.items.slice(props.visibleN) : []))
const maxCount = computed(() => Math.max(...props.items.map(item => item.count), 1))

const barWidth = (count: number) => `${(count / maxCount.value) * 100}%`
</script>

<template>
    <div class="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md
        dark:border-white/10 dark:bg-white/5">
        <h3 class="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{{ title }}</h3>

        <ul v-if="items.length" class="space-y-2.5">
            <li v-for="item in visibleItems" :key="item.label" class="flex items-center gap-3">
                <div class="w-24 shrink-0 sm:w-28">
                    <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{{ item.label }}</p>
                    <p v-if="item.sub" class="truncate text-xs text-gray-400 dark:text-gray-500">{{ item.sub }}</p>
                </div>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    <div class="h-full rounded-full bg-gradient-to-r from-brand to-sunset transition-all duration-500"
                        :style="{ width: barWidth(item.count) }" />
                </div>
                <span class="w-7 shrink-0 text-right text-sm font-semibold text-gray-500 tabular-nums dark:text-gray-400">
                    {{ item.count }}
                </span>
            </li>
        </ul>

        <!-- Collapsed tail rows: grid-rows 0fr→1fr keeps the unfold in place -->
        <div v-if="hasMore" class="grid transition-[grid-template-rows] duration-300 ease-out"
            :class="expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
            <div class="overflow-hidden">
                <ul class="space-y-2.5 pt-2.5">
                    <li v-for="item in hiddenItems" :key="item.label" class="flex items-center gap-3">
                        <div class="w-24 shrink-0 sm:w-28">
                            <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{{ item.label }}</p>
                            <p v-if="item.sub" class="truncate text-xs text-gray-400 dark:text-gray-500">{{ item.sub }}</p>
                        </div>
                        <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                            <div class="h-full rounded-full bg-gradient-to-r from-brand to-sunset transition-all duration-500"
                                :style="{ width: barWidth(item.count) }" />
                        </div>
                        <span class="w-7 shrink-0 text-right text-sm font-semibold text-gray-500 tabular-nums dark:text-gray-400">
                            {{ item.count }}
                        </span>
                    </li>
                </ul>
            </div>
        </div>

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
