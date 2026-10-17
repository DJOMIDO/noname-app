<script setup lang="ts">
import { computed } from 'vue'
import type { Flight, CurrencyTotals } from '@/types/journeys'
import { mostFrequent, type TopResult } from '@/lib/stats'
import StatCard from '@/components/stats/StatCard.vue'
import CurrencyTotalsList from '@/components/stats/CurrencyTotalsList.vue'
import airlines from '@/assets/data/airlines.json'

const props = defineProps<{
    flights: Flight[]
    totalSpentByCurrency: CurrencyTotals
}>()

const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`

const mostAirline = computed(() => mostFrequent(props.flights, f => f.airline_code))
const mostAirlineName = computed(() => {
    const code = mostAirline.value?.value
    if (!code) return 'N/A'
    return airlines.find(a => a.code === code)?.name ?? code
})

const mostFlightNumber = computed(() =>
    mostFrequent(props.flights, f => (f.airline_code && f.flight_number ? `${f.airline_code}${f.flight_number}` : null)),
)

const mostRoute = computed(() =>
    mostFrequent(props.flights, f => (f.departure_airport && f.arrival_airport ? `${f.departure_airport} → ${f.arrival_airport}` : null)),
)

const mostDeparture = computed(() => mostFrequent(props.flights, f => f.departure_airport))
const mostArrival = computed(() => mostFrequent(props.flights, f => f.arrival_airport))
const mostAircraft = computed(() => mostFrequent(props.flights, f => f.aircraft_type))

// Renders 'N/A' with no hint when there is no data for the metric.
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
            <StatCard label="Total Flights" :value="flights.length" featured />
            <StatCard label="Total Spent" featured>
                <CurrencyTotalsList :totals="totalSpentByCurrency" size="lg" />
            </StatCard>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Most Used Airline" :value="mostAirlineName" :hint="hint(mostAirline)" variant="title" />
            <StatCard label="Most Frequent Flight Number" :value="label(mostFlightNumber)" :hint="hint(mostFlightNumber)" variant="title" />
            <StatCard label="Most Common Route" :value="label(mostRoute)" :hint="hint(mostRoute)" variant="title" />

            <StatCard label="Most Frequent Departure" :value="label(mostDeparture)" :hint="hint(mostDeparture)" variant="title" />
            <StatCard label="Most Frequent Arrival" :value="label(mostArrival)" :hint="hint(mostArrival)" variant="title" />
            <StatCard label="Most Used Aircraft" :value="label(mostAircraft)" :hint="hint(mostAircraft)" variant="title" />
        </div>
    </div>
</template>
