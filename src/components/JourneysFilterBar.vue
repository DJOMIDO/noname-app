<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { Search, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
    activeYear: number | null
    years: number[]
}>()

const emit = defineEmits<{
    (e: 'search', query: string): void
    (e: 'year-change', year: number | null): void
}>()

const query = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

// Debounce so typing does not hammer the Data API on every keystroke.
const onInput = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => emit('search', query.value.trim()), 300)
}

const clear = () => {
    query.value = ''
    if (timer) clearTimeout(timer)
    emit('search', '')
}

const chipClass = (active: boolean) => cn(
    'shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors border-0 cursor-pointer',
    active
        ? 'bg-brand text-white shadow-sm dark:bg-violet-500 dark:text-white'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/15 dark:hover:text-gray-200',
)

// Year chips live in one horizontally swipeable strip (mirrors StatsHeader and
// CurrencyTotalsList) so a long year list scrolls instead of wrapping to many
// rows; edge fades are the swipe affordance, and a horizontal strip never
// fights the page's vertical scroll.
const yearEl = ref<HTMLElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)

const updateEdges = () => {
    const el = yearEl.value
    if (!el) return
    canScrollPrev.value = el.scrollLeft > 1
    canScrollNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

useEventListener(yearEl, 'scroll', updateEdges, { passive: true })
useResizeObserver(yearEl, updateEdges)
watch(() => props.years.length, () => nextTick(updateEdges))
</script>

<template>
    <div class="mb-6 space-y-3">
        <!-- Search -->
        <div class="relative">
            <Search
                class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                aria-hidden="true" />
            <input v-model="query" @input="onInput" type="search" placeholder="Search trips by airline, number or city..."
                aria-label="Search journeys"
                class="w-full rounded-xl border border-gray-200/70 bg-white/70 py-2 pl-10 pr-10 text-sm
                    placeholder:text-gray-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20
                    dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500" />
            <button v-if="query" @click="clear" title="Clear search" aria-label="Clear search"
                class="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                <X class="size-4" />
            </button>
        </div>

        <!-- Year chips: one horizontally swipeable strip (left-aligned to match
             the search box) so a long year list scrolls instead of wrapping -->
        <div class="relative">
            <div ref="yearEl" role="group" aria-label="Filter by year"
                class="flex snap-x gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button :class="chipClass(activeYear === null)" @click="emit('year-change', null)">
                    All time
                </button>
                <button v-for="y in years" :key="y" :class="chipClass(activeYear === y)"
                    @click="emit('year-change', y)">
                    {{ y }}
                </button>
            </div>
            <span v-if="canScrollPrev" aria-hidden="true"
                class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-gray-900" />
            <span v-if="canScrollNext" aria-hidden="true"
                class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-gray-900" />
        </div>
    </div>
</template>
