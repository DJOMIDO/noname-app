import { computed, type Ref } from 'vue'
import type { CurrencyTotals } from '@/types/journeys'
import type { FlightStatsRow, TrainStatsRow } from '@/lib/journeyColumns'
import { sumByCurrency, mergeCurrencyTotals } from '@/lib/stats'

// Centralises the money / date / transport-mode aggregates shown on the stats
// dashboard so the page component only handles fetching and layout. The
// cross-modal rankings (top cities / carriers / routes) live in StatOverview,
// which needs the raw rows rather than a single winner.
export function useJourneyStats(flights: Ref<FlightStatsRow[]>, trains: Ref<TrainStatsRow[]>) {
    const allJourneys = computed<(FlightStatsRow | TrainStatsRow)[]>(() => [...flights.value, ...trains.value])

    const totalFlightSpentByCurrency = computed<CurrencyTotals>(() =>
        sumByCurrency(flights.value, f => f.price, f => f.currency),
    )

    const totalTrainSpentByCurrency = computed<CurrencyTotals>(() =>
        sumByCurrency(trains.value, t => t.price, t => t.currency),
    )

    const totalSpentByCurrency = computed<CurrencyTotals>(() =>
        mergeCurrencyTotals(totalFlightSpentByCurrency.value, totalTrainSpentByCurrency.value),
    )

    const sortedDepartureDates = computed(() =>
        allJourneys.value.map(j => j.departure_date).filter(Boolean).sort(),
    )

    const firstDeparture = computed(() => sortedDepartureDates.value[0] ?? null)
    const lastDeparture = computed(() => sortedDepartureDates.value[sortedDepartureDates.value.length - 1] ?? null)

    const mostUsedTransport = computed(() => {
        const f = flights.value.length
        const t = trains.value.length
        return f > t ? 'Flight' : f < t ? 'Train' : 'Equal'
    })

    return {
        totalFlightSpentByCurrency,
        totalTrainSpentByCurrency,
        totalSpentByCurrency,
        firstDeparture,
        lastDeparture,
        mostUsedTransport,
    }
}
