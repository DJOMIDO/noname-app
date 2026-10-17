// Centralised journey data access: the only place that reads the full
// flights/trains dataset. Detail/list pages keep their targeted queries,
// while every write (insert/update/delete) invalidates the module cache so
// the stats dashboard never shows stale aggregates.
import { ref } from 'vue'
import { client } from '@/lib/neon'
import type { Flight, Train } from '@/types/journeys'

// Narrow column sets for the stats dashboard — detail-only fields like notes,
// booking refs or seat numbers are deliberately excluded to keep the
// full-dataset payload minimal.
export const FLIGHT_STATS_COLUMNS = [
    'id', 'airline_code', 'flight_number',
    'departure_airport', 'arrival_airport',
    'departure_date', 'arrival_date', 'departure_time', 'arrival_time',
    'aircraft_type', 'price', 'currency',
].join(',')

export const TRAIN_STATS_COLUMNS = [
    'id', 'train_company', 'train_number', 'train_type',
    'departure_station', 'arrival_station',
    'departure_city', 'arrival_city',
    'departure_date', 'arrival_date', 'departure_time', 'arrival_time',
    'price', 'currency',
].join(',')

let cache: { userId: string; flights: Flight[]; trains: Train[] } | null = null

export function invalidateJourneysCache() {
    cache = null
}

export function useJourneys() {
    const flights = ref<Flight[]>([])
    const trains = ref<Train[]>([])
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
            client.from('flights').select(FLIGHT_STATS_COLUMNS).eq('user_id', userId).returns<Flight[]>(),
            client.from('trains').select(TRAIN_STATS_COLUMNS).eq('user_id', userId).returns<Train[]>(),
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
