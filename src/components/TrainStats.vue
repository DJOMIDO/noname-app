<script setup lang="ts">
import { computed } from 'vue'
import type { CurrencyTotals } from '@/types/journeys'
import type { TrainStatsRow } from '@/lib/journeyColumns'
import { mostFrequent, type TopResult } from '@/lib/stats'
import StatCard from '@/components/stats/StatCard.vue'
import CurrencyTotalsList from '@/components/stats/CurrencyTotalsList.vue'

const props = defineProps<{
    trains: TrainStatsRow[]
    totalSpentByCurrency: CurrencyTotals
}>()

const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`

const mostCompany = computed(() => mostFrequent(props.trains, t => t.train_company))
const mostType = computed(() => mostFrequent(props.trains, t => t.train_type))
const mostRoute = computed(() =>
    mostFrequent(props.trains, t => {
        const from = t.departure_city || t.departure_station
        const to = t.arrival_city || t.arrival_station
        return from && to ? `${from} → ${to}` : null
    }),
)
const mostDeparture = computed(() => mostFrequent(props.trains, t => t.departure_city || t.departure_station))
const mostArrival = computed(() => mostFrequent(props.trains, t => t.arrival_city || t.arrival_station))

type Top = TopResult<string> | null
function label(top: Top): string {
    return top?.value ?? 'N/A'
}
function hint(top: Top): string | undefined {
    return top ? times(top.count) : undefined
}
</script>

<template>
    <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Total Train Journeys" :value="trains.length" featured />
            <StatCard label="Total Spent" featured>
                <CurrencyTotalsList :totals="totalSpentByCurrency" size="lg" />
            </StatCard>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Top Company" :value="label(mostCompany)" :hint="hint(mostCompany)" variant="title" />
            <StatCard label="Most Common Route" :value="label(mostRoute)" :hint="hint(mostRoute)" variant="title" />
            <StatCard label="Top Train Type" :value="label(mostType)" :hint="hint(mostType)" variant="title" />

            <StatCard label="Most Frequent Departure" :value="label(mostDeparture)" :hint="hint(mostDeparture)" variant="title" />
            <StatCard label="Most Frequent Arrival" :value="label(mostArrival)" :hint="hint(mostArrival)" variant="title" />
        </div>
    </div>
</template>
