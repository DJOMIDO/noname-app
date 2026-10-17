import { computed, type Ref } from 'vue'
import type { CurrencyTotals } from '@/types/journeys'
import type { FlightStatsRow, TrainStatsRow } from '@/lib/journeyColumns'
import { mostFrequent, sumByCurrency, mergeCurrencyTotals } from '@/lib/stats'
import airlines from '@/assets/data/airlines.json'
import airports from '@/assets/data/airports.json'

const NA = 'N/A'

// Resolves an arrival "city" label for a journey. Flights store an IATA code,
// trains store a city name directly (falling back to the arrival station).
function arrivalCity(flight: FlightStatsRow): string | undefined {
    const match = airports.find(a => a.iata === flight.arrival_airport)
    return match?.city ?? flight.arrival_airport ?? undefined
}

// Centralises every aggregate shown on the stats dashboard so the page
// component only handles fetching and layout.
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

    const topCity = computed(() => {
        const cities = [
            ...flights.value.map(arrivalCity),
            ...trains.value.map(t => t.arrival_city ?? t.arrival_station),
        ]
        return mostFrequent(cities, c => c)?.value ?? NA
    })

    const mostUsedTransport = computed(() => {
        const f = flights.value.length
        const t = trains.value.length
        return f > t ? 'Flight' : f < t ? 'Train' : 'Equal'
    })

    const mostUsedAirline = computed(() => {
        const top = mostFrequent(flights.value, f => f.airline_code)
        if (!top) return NA
        const match = airlines.find(a => a.code === top.value)
        return match ? match.name : top.value
    })

    const mostUsedTrainCompany = computed(() =>
        mostFrequent(trains.value, t => t.train_company)?.value ?? NA,
    )

    return {
        totalFlightSpentByCurrency,
        totalTrainSpentByCurrency,
        totalSpentByCurrency,
        firstDeparture,
        lastDeparture,
        topCity,
        mostUsedTransport,
        mostUsedAirline,
        mostUsedTrainCompany,
    }
}
