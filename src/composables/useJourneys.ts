// Centralised journey data access: the only place that reads the full
// flights/trains dataset. Detail/list pages keep their targeted queries,
// while every write (insert/update/delete) invalidates the module cache so
// the stats dashboard never shows stale aggregates.
import { ref } from 'vue'
import { client } from '@/lib/neon'
import {
    FLIGHT_STATS_COLUMNS, TRAIN_STATS_COLUMNS,
    type FlightStatsRow, type TrainStatsRow,
} from '@/lib/journeyColumns'

let cache: { userId: string; flights: FlightStatsRow[]; trains: TrainStatsRow[] } | null = null

export function invalidateJourneysCache() {
    cache = null
}

export function useJourneys() {
    const flights = ref<FlightStatsRow[]>([])
    const trains = ref<TrainStatsRow[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const load = async (userId: string) => {
        // Serve repeat visits from cache; a profile switch falls through.
        if (cache && cache.userId === userId) {
            flights.value = cache.flights
            trains.value = cache.trains
            return
        }

        loading.value = true
        error.value = null

        const [flightRes, trainRes] = await Promise.all([
            client.from('flights').select(FLIGHT_STATS_COLUMNS).eq('user_id', userId).returns<FlightStatsRow[]>(),
            client.from('trains').select(TRAIN_STATS_COLUMNS).eq('user_id', userId).returns<TrainStatsRow[]>(),
        ])

        if (flightRes.error || trainRes.error) {
            error.value = flightRes.error?.message ?? trainRes.error?.message ?? 'Failed to load journeys'
        } else {
            flights.value = flightRes.data ?? []
            trains.value = trainRes.data ?? []
            cache = { userId, flights: flights.value, trains: trains.value }
        }

        loading.value = false
    }

    return { flights, trains, loading, error, load }
}
