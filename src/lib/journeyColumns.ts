// Explicit column sets for journey reads. Every list/aggregate query names the
// fields it actually consumes instead of `select('*')`, and the row type is
// derived from the very same tuple — so vue-tsc rejects reading a column that
// was never fetched.
//
// Exception by design: the detail/edit pages load the full row (`select('*')`)
// because their form is bound to every editable column.
import type { Flight, Train } from '@/types/journeys'

// --- Flights ---------------------------------------------------------------

// Stats dashboard: chart inputs only (no seat/gate/notes/timestamps).
const FLIGHT_STATS = [
    'id', 'airline_code', 'flight_number',
    'departure_airport', 'arrival_airport',
    'departure_date', 'arrival_date', 'departure_time', 'arrival_time',
    'aircraft_type', 'price', 'currency',
] as const satisfies readonly (keyof Flight)[]

export const FLIGHT_STATS_COLUMNS = FLIGHT_STATS.join(',')
export type FlightStatsRow = Pick<Flight, typeof FLIGHT_STATS[number]>

// Journey list cards + the home-page recent strip: everything a card renders.
const FLIGHT_CARD = [
    'id', 'airline_code', 'flight_number',
    'departure_airport', 'arrival_airport',
    'departure_date', 'arrival_date', 'departure_time', 'arrival_time',
    'aircraft_type', 'seat_number',
] as const satisfies readonly (keyof Flight)[]

export const FLIGHT_CARD_COLUMNS = FLIGHT_CARD.join(',')
export type FlightCardRow = Pick<Flight, typeof FLIGHT_CARD[number]>

// --- Trains ----------------------------------------------------------------

const TRAIN_STATS = [
    'id', 'train_company', 'train_number', 'train_type',
    'departure_station', 'arrival_station',
    'departure_city', 'arrival_city',
    'departure_date', 'arrival_date', 'departure_time', 'arrival_time',
    'price', 'currency',
] as const satisfies readonly (keyof Train)[]

export const TRAIN_STATS_COLUMNS = TRAIN_STATS.join(',')
export type TrainStatsRow = Pick<Train, typeof TRAIN_STATS[number]>

const TRAIN_CARD = [
    'id', 'train_company', 'train_number', 'train_type',
    'departure_station', 'arrival_station',
    'departure_date', 'departure_time', 'arrival_time',
    'coach', 'seat_number',
] as const satisfies readonly (keyof Train)[]

export const TRAIN_CARD_COLUMNS = TRAIN_CARD.join(',')
export type TrainCardRow = Pick<Train, typeof TRAIN_CARD[number]>
