<script lang="ts">
/** Which dashboard view the header metrics are scoped to. */
export type StatsView = 'overview' | 'flights' | 'trains'
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type ComponentPublicInstance } from 'vue'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import type { FlightStatsRow, TrainStatsRow } from '@/lib/journeyColumns'
import {
    totalDistanceKm,
    totalFlightMinutes,
    totalTrainMinutes,
    visitedCityCount,
} from '@/lib/stats'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import iconFlight from '@/assets/images/flight.png'
import iconTrain from '@/assets/images/train.png'

/**
 * StatsHeader — the dashboard's control surface in one glass card: the view
 * switcher (reka-ui TabsTrigger, driven by the Tabs root this card sits in),
 * three hero digits scoped to the active view, secondary indicator chips and
 * the year filter. Distance and time are flight-scoped where trains cannot
 * contribute (no coordinates); the trains view flips to rail metrics.
 */
const props = defineProps<{
    view: StatsView
    /** Already year-filtered rows. */
    flights: FlightStatsRow[]
    /** Already year-filtered rows. */
    trains: TrainStatsRow[]
    /** Years present in the full dataset, newest first. */
    years: number[]
    activeYear: number | null
}>()

const emit = defineEmits<{
    (e: 'year-change', year: number | null): void
}>()

const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const pluralize = (n: number, singular: string, plural?: string) =>
    `${n} ${n === 1 ? singular : plural ?? `${singular}s`}`

const metrics = computed(() => {
    switch (props.view) {
        case 'flights':
            return [
                { label: 'Flights', value: String(props.flights.length), unit: '' },
                { label: 'Distance', value: totalDistanceKm(props.flights).toLocaleString(), unit: 'km' },
                { label: 'Time in the air', value: formatTime(totalFlightMinutes(props.flights)), unit: '' },
            ]
        case 'trains':
            return [
                { label: 'Journeys', value: String(props.trains.length), unit: '' },
                { label: 'Time on rails', value: formatTime(totalTrainMinutes(props.trains)), unit: '' },
                { label: 'Cities', value: String(visitedCityCount([], props.trains)), unit: '' },
            ]
        default:
            return [
                { label: 'Journeys', value: String(props.flights.length + props.trains.length), unit: '' },
                { label: 'Distance', value: totalDistanceKm(props.flights).toLocaleString(), unit: 'km' },
                {
                    label: 'Time',
                    value: formatTime(totalFlightMinutes(props.flights) + totalTrainMinutes(props.trains)),
                    unit: '',
                },
            ]
    }
})

// "2024 — 2026" across the filtered rows; a single year shows on its own.
const yearSpan = computed(() => {
    const dates = [
        ...props.flights.map(f => f.departure_date),
        ...props.trains.map(t => t.departure_date),
    ].filter(Boolean).sort()
    if (dates.length === 0) return null
    const first = dates[0].slice(0, 4)
    const last = dates[dates.length - 1].slice(0, 4)
    return first === last ? first : `${first} — ${last}`
})

const infoChips = computed(() => {
    const airlineCount = new Set(props.flights.map(f => f.airline_code).filter(Boolean)).size
    const companyCount = new Set(props.trains.map(t => t.train_company).filter(Boolean)).size
    switch (props.view) {
        case 'flights':
            return [
                pluralize(visitedCityCount(props.flights, []), 'city', 'cities'),
                pluralize(airlineCount, 'airline'),
            ]
        case 'trains':
            return [
                pluralize(visitedCityCount([], props.trains), 'city', 'cities'),
                pluralize(companyCount, 'company', 'companies'),
            ]
        default:
            return [
                pluralize(visitedCityCount(props.flights, props.trains), 'city', 'cities'),
                pluralize(airlineCount, 'airline'),
                pluralize(companyCount, 'company', 'companies'),
            ]
    }
})

// Same chip recipe as the journeys-page year filter.
const yearChipClass = (active: boolean) => cn(
    'shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors border-0 cursor-pointer',
    active
        ? 'bg-brand text-white shadow-sm dark:bg-violet-500 dark:text-white'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/15 dark:hover:text-gray-200',
)

const triggerClass = cn(
    'flex flex-1 items-center justify-center gap-2 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500',
    'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow',
    'dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white',
)

// Mobile: the info chips and the year filter each become their own horizontally
// swipeable strip (two rows) instead of wrapping into a ragged multi-line block;
// from `sm` up both wrappers go `contents` so every chip flows back into a
// single centered row. Edge fades are the swipe affordance, mirroring
// CurrencyTotalsList; a horizontal strip never fights the page's vertical scroll.
const infoEl = ref<HTMLElement | null>(null)
const yearEl = ref<HTMLElement | null>(null)
const infoPrev = ref(false)
const infoNext = ref(false)
const yearPrev = ref(false)
const yearNext = ref(false)

const stripEdges = (el: HTMLElement | null) => ({
    prev: !!el && el.scrollLeft > 1,
    next: !!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
})
const syncInfo = () => {
    const e = stripEdges(infoEl.value)
    infoPrev.value = e.prev
    infoNext.value = e.next
}
const syncYear = () => {
    const e = stripEdges(yearEl.value)
    yearPrev.value = e.prev
    yearNext.value = e.next
}

useEventListener(infoEl, 'scroll', syncInfo, { passive: true })
useResizeObserver(infoEl, syncInfo)
useEventListener(yearEl, 'scroll', syncYear, { passive: true })
useResizeObserver(yearEl, syncYear)
watch([infoChips, yearSpan], () => nextTick(syncInfo))
watch(() => props.years.length, () => nextTick(syncYear))

// Auto-fit: hero values can run long ("121,531 km", "162h 20m") while each of
// the three columns is a fixed third of the card, so no single font size fits
// every value on every narrow phone. Measure each value at its responsive base
// size and, only when it would overflow its cell, scale the font down to fit on
// one line; when there is room (sm+) the inline size is cleared so the
// responsive classes win again. ResizeObserver also covers first paint, so the
// shrink lands before the user ever sees the oversized frame.
const heroGridEl = ref<HTMLElement | null>(null)
const valueEls = ref<(HTMLElement | null)[]>([])
const setValueEl = (index: number) => (el: Element | ComponentPublicInstance | null) => {
    valueEls.value[index] = el as HTMLElement | null
}

const fitValue = (el: HTMLElement | null) => {
    if (!el) return
    el.style.fontSize = ''
    const avail = el.clientWidth
    const natural = el.scrollWidth
    if (avail > 0 && natural > avail) {
        const base = parseFloat(getComputedStyle(el).fontSize)
        el.style.fontSize = `${((base * avail) / natural).toFixed(2)}px`
    }
}
const fitValues = () => valueEls.value.forEach(fitValue)

watch(metrics, () => nextTick(fitValues))
useResizeObserver(heroGridEl, () => nextTick(fitValues))
</script>

<template>
    <section class="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-white/60
        bg-white/70 shadow-xl shadow-brand/10 backdrop-blur-md
        dark:border-white/10 dark:bg-white/5">
        <!-- View switcher: lives inside the page Tabs root, so triggers drive activeTab -->
        <div class="flex justify-center px-4 pt-4 sm:px-6 sm:pt-5">
            <TabsList class="flex w-full max-w-md rounded-xl bg-gray-100 p-1 shadow-inner dark:bg-white/10">
                <TabsTrigger value="overview" :class="triggerClass">
                    Overview
                </TabsTrigger>
                <TabsTrigger value="flights" :class="triggerClass">
                    <img :src="iconFlight" alt="" class="h-4 w-4 object-contain" />
                    <span>Flights</span>
                </TabsTrigger>
                <TabsTrigger value="trains" :class="triggerClass">
                    <img :src="iconTrain" alt="" class="h-4 w-4 object-contain" />
                    <span>Trains</span>
                </TabsTrigger>
            </TabsList>
        </div>

        <!-- Hero digits: three equal cells scoped to the active view -->
        <div ref="heroGridEl" class="mt-4 grid grid-cols-3 divide-x divide-gray-200/60 sm:mt-5 dark:divide-white/10">
            <div v-for="(metric, index) in metrics" :key="metric.label" class="min-w-0 px-2 pb-6 text-center sm:px-4 sm:pb-8">
                <p :ref="setValueEl(index)"
                    class="whitespace-nowrap text-2xl font-extrabold tracking-tight tabular-nums leading-none sm:text-4xl lg:text-5xl">
                    <span class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">
                        {{ metric.value }}
                    </span>
                    <span v-if="metric.unit" class="ml-1 text-[0.55em] font-semibold text-gray-400 dark:text-gray-500">
                        {{ metric.unit }}
                    </span>
                </p>
                <p class="mt-2 text-xs font-medium tracking-wide text-gray-500 uppercase sm:text-sm dark:text-gray-400">
                    {{ metric.label }}
                </p>
            </div>
        </div>

        <!-- Info chips + year filter: on mobile two independently swipeable
             strips (one row each); from `sm` up both wrappers go `contents` so
             every chip flows back into a single centered wrapping row. -->
        <div class="flex flex-col gap-2 border-t border-gray-200/60 px-4 py-3
            sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2 dark:border-white/10">

            <!-- Row 1: secondary indicator chips -->
            <div class="relative min-w-0 sm:contents">
                <div ref="infoEl" :class="cn(
                    'flex snap-x gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:contents',
                    !infoPrev && !infoNext && 'justify-center',
                )">
                    <span v-for="chip in infoChips" :key="chip"
                        class="shrink-0 snap-start whitespace-nowrap rounded-full bg-brand/8 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-brand/15 dark:text-gray-300">
                        {{ chip }}
                    </span>
                    <span v-if="yearSpan"
                        class="shrink-0 snap-start whitespace-nowrap rounded-full bg-brand/8 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-brand/15 dark:text-gray-300">
                        {{ yearSpan }}
                    </span>
                </div>
                <span v-if="infoPrev" aria-hidden="true"
                    class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent sm:hidden dark:from-gray-900" />
                <span v-if="infoNext" aria-hidden="true"
                    class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden dark:from-gray-900" />
            </div>

            <span v-if="years.length" aria-hidden="true"
                class="mx-1 hidden h-4 w-px bg-gray-200 sm:block dark:bg-white/15" />

            <!-- Row 2: year filter -->
            <div v-if="years.length" class="relative min-w-0 sm:contents">
                <div ref="yearEl" role="group" aria-label="Filter by year" :class="cn(
                    'flex snap-x gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:contents',
                    !yearPrev && !yearNext && 'justify-center',
                )">
                    <button type="button" :class="yearChipClass(activeYear === null)" @click="emit('year-change', null)">
                        All time
                    </button>
                    <button v-for="year in years" :key="year" type="button"
                        :class="yearChipClass(activeYear === year)" @click="emit('year-change', year)">
                        {{ year }}
                    </button>
                </div>
                <span v-if="yearPrev" aria-hidden="true"
                    class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent sm:hidden dark:from-gray-900" />
                <span v-if="yearNext" aria-hidden="true"
                    class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden dark:from-gray-900" />
            </div>
        </div>
    </section>
</template>
