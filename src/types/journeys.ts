// Row shapes for the Neon `flights` / `trains` tables.
// Mirrors neon/migrations/*_create_journey_tables.sql.

export interface Flight {
    id: string
    user_id: string
    airline_code: string
    flight_number: string
    departure_airport: string
    stopover_airport?: string | null
    arrival_airport: string
    departure_date: string
    departure_time?: string | null
    arrival_date?: string | null
    arrival_time?: string | null
    gate?: string | null
    seat_number?: string | null
    aircraft_type?: string | null
    aircraft_reg?: string | null
    price?: number | string | null
    currency?: string | null
    booking_ref?: string | null
    notes?: string | null
    created_at: string
    updated_at: string
}

export interface Train {
    id: string
    user_id: string
    train_company: string
    train_number: string
    train_type?: string | null
    departure_station: string
    arrival_station: string
    departure_city?: string | null
    arrival_city?: string | null
    departure_date: string
    departure_time?: string | null
    arrival_date?: string | null
    arrival_time?: string | null
    coach?: string | null
    seat_number?: string | null
    price?: number | string | null
    currency?: string | null
    booking_ref?: string | null
    notes?: string | null
    created_at: string
    updated_at: string
}

// Amount totals keyed by currency code.
export type CurrencyTotals = Record<string, number>
