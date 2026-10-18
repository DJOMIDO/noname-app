<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import type { CurrencyTotals } from '@/types/journeys'
import { sortedCurrencyTotals } from '@/lib/stats'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
    totals: CurrencyTotals
    size?: 'md' | 'lg'
}>(), {
    size: 'md',
})

const entries = computed(() => sortedCurrencyTotals(props.totals))

// One fixed-height strip, so the card never grows with the currency count and
// the sibling cards on the same grid row keep their own height. Overflow is
// reached by a horizontal swipe, which does not fight the page's vertical
// scroll the way an inner vertical scroller would.
const listEl = ref<HTMLUListElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)

const updateEdges = () => {
    const el = listEl.value
    if (!el) return
    canScrollPrev.value = el.scrollLeft > 1
    canScrollNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

// The strip also reflows when the sidebar collapses or the data arrives, so
// watch the box size and the entries rather than only the window.
useEventListener(listEl, 'scroll', updateEdges, { passive: true })
useResizeObserver(listEl, updateEdges)
watch(entries, () => nextTick(updateEdges))
</script>

<template>
    <div v-if="entries.length" class="relative">
        <ul ref="listEl" aria-label="Spending by currency" tabindex="0" :class="cn(
            'flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-2xl py-1.5 outline-none',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'focus-visible:ring-2 focus-visible:ring-brand/40',
            // Keep the old centered look while everything fits; centering an
            // overflowing row would push the first chip out of reach.
            !canScrollPrev && !canScrollNext && 'justify-center',
        )">
            <li v-for="entry in entries" :key="entry.currency" class="shrink-0 snap-start">
                <span :class="cn(
                    'flex items-baseline gap-1.5 rounded-2xl bg-brand/5 ring-1 ring-inset ring-brand/15',
                    'dark:bg-white/5 dark:ring-white/10',
                    size === 'md' ? 'px-3 py-1.5' : 'px-4 py-2',
                )">
                    <span :class="cn(
                        'font-semibold tabular-nums text-brand dark:text-violet-200',
                        size === 'md' ? 'text-lg' : 'text-3xl',
                    )">{{ entry.amount.toFixed(2) }}</span>
                    <span :class="cn(
                        'font-medium text-mint dark:text-green-300',
                        size === 'md' ? 'text-sm' : 'text-lg',
                    )">{{ entry.currency }}</span>
                </span>
            </li>
        </ul>

        <!-- Edge fades double as the affordance that more currencies await a swipe -->
        <span v-if="canScrollPrev" aria-hidden="true"
            class="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-2xl bg-gradient-to-r from-white to-transparent dark:from-gray-900" />
        <span v-if="canScrollNext" aria-hidden="true"
            class="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-2xl bg-gradient-to-l from-white to-transparent dark:from-gray-900" />
    </div>
    <p v-else class="mt-2 text-sm italic text-gray-400">No spending recorded</p>
</template>
