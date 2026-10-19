import type { CurrencyTotals } from '@/types/journeys'
import type { FlightStatsRow, TrainStatsRow } from '@/lib/journeyColumns'
import { airportByIata, haversineKm } from '@/lib/geo'
import { getFlightDuration } from '@/utils/getFlightDuration'

export interface TopResult<T> {
    value: T
    count: number
}

// Returns the most frequent non-empty value produced by `keyFn`, or null when
// nothing qualifies. Consolidates the ad-hoc "sort entries by count" logic that
// was duplicated across the stats page and its views.
export function mostFrequent<R, T>(
    rows: R[],
    keyFn: (row: R) => T | null | undefined,
): TopResult<T> | null {
    const counts = new Map<T, number>()
    for (const row of rows) {
        const value = keyFn(row)
        if (value === null || value === undefined || value === '') continue
        counts.set(value, (counts.get(value) ?? 0) + 1)
    }

    let top: TopResult<T> | null = null
    for (const [value, count] of counts) {
        if (!top || count > top.count) top = { value, count }
    }
    return top
}

// Sums a numeric field grouped by currency code, skipping rows missing either.
export function sumByCurrency<R>(
    rows: R[],
    priceFn: (row: R) => number | string | null | undefined,
    currencyFn: (row: R) => string | null | undefined,
): CurrencyTotals {
    const totals: CurrencyTotals = {}
    for (const row of rows) {
        const price = Number(priceFn(row))
        const currency = currencyFn(row)
        if (!currency || !price || Number.isNaN(price)) continue
        totals[currency] = (totals[currency] ?? 0) + price
    }
    return totals
}

// Merges two currency total maps, summing overlapping currencies.
export function mergeCurrencyTotals(...maps: CurrencyTotals[]): CurrencyTotals {
    const merged: CurrencyTotals = {}
    for (const map of maps) {
        for (const [currency, amount] of Object.entries(map)) {
            merged[currency] = (merged[currency] ?? 0) + amount
        }
    }
    return merged
}

export interface CurrencyTotalEntry {
    currency: string
    amount: number
}

// Totals as an array ordered by descending amount, falling back to the currency
// code on ties. Object key order follows the fetched rows, so anything that
// shows only a leading slice of the currencies needs this to stay meaningful
// (biggest spenders first) and stable between loads.
export function sortedCurrencyTotals(totals: CurrencyTotals): CurrencyTotalEntry[] {
    return Object.entries(totals)
        .map(([currency, amount]) => ({ currency, amount }))
        .sort((a, b) => b.amount - a.amount || a.currency.localeCompare(b.currency))
}

// Full ranked list behind the Top-N cards: every non-empty value produced by
// `keyFn`, ordered by descending count with alphabetical tie-breaks so the
// ranking stays stable between loads. `mostFrequent` remains the single-winner
// shortcut for the overview cards.
export function topList<R, T>(
    rows: readonly R[],
    keyFn: (row: R) => T | null | undefined,
    limit?: number,
): TopResult<T>[] {
    const counts = new Map<T, number>()
    for (const row of rows) {
        const value = keyFn(row)
        if (value === null || value === undefined || value === '') continue
        counts.set(value, (counts.get(value) ?? 0) + 1)
    }

    const ranked = [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)))
    return limit === undefined ? ranked : ranked.slice(0, limit)
}

// Great-circle distance of a single flight, splitting at a resolvable
// stopover so the number matches the route map's per-leg mileage. Zero when
// either endpoint is unknown.
export function flightLegDistanceKm(flight: FlightStatsRow): number {
    const dep = airportByIata(flight.departure_airport)
    const arr = airportByIata(flight.arrival_airport)
    if (!dep || !arr) return 0
    const stopover = airportByIata(flight.stopover_airport)
    return Math.round(stopover
        ? haversineKm(dep, stopover) + haversineKm(stopover, arr)
        : haversineKm(dep, arr))
}

// Total great-circle distance across every flight; flights (or legs) with
// unknown airports are skipped rather than guessed.
export function totalDistanceKm(flights: readonly FlightStatsRow[]): number {
    return flights.reduce((total, flight) => total + flightLegDistanceKm(flight), 0)
}

// Total minutes in the air, skipping flights whose dates/times cannot produce
// a duration (same timezone-aware helper the duration cards use).
export function totalFlightMinutes(flights: readonly FlightStatsRow[]): number {
    let total = 0
    for (const flight of flights) {
        const minutes = getFlightDuration(
            flight.departure_airport,
            flight.departure_date,
            flight.departure_time,
            flight.arrival_airport,
            flight.arrival_date,
            flight.arrival_time,
        )
        if (minutes != null) total += minutes
    }
    return total
}

// Total minutes on rails: naive departure→arrival timestamp diff. Trains
// carry no IATA codes to resolve timezones from, so cross-border services
// are off by the border delta — accepted for the hero strip. Rows missing
// an arrival date/time are skipped.
export function totalTrainMinutes(trains: readonly TrainStatsRow[]): number {
    let total = 0
    for (const train of trains) {
        if (!train.departure_date || !train.departure_time) continue
        if (!train.arrival_date || !train.arrival_time) continue
        const from = new Date(`${train.departure_date}T${train.departure_time}`)
        const to = new Date(`${train.arrival_date}T${train.arrival_time}`)
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) continue
        total += Math.round((to.getTime() - from.getTime()) / 60000)
    }
    return total
}

export interface YearCount {
    year: number
    count: number
}

// Flights per departure year, filling every gap year with a zero count so the
// year-over-year line chart stays continuous instead of jumping across holes.
export function countByYear(flights: readonly FlightStatsRow[]): YearCount[] {
    const counts = new Map<number, number>()
    for (const flight of flights) {
        const year = Number(flight.departure_date?.slice(0, 4))
        if (!Number.isInteger(year) || year <= 0) continue
        counts.set(year, (counts.get(year) ?? 0) + 1)
    }
    if (counts.size === 0) return []

    const years = [...counts.keys()].sort((a, b) => a - b)
    const filled: YearCount[] = []
    for (let year = years[0]; year <= years[years.length - 1]; year += 1) {
        filled.push({ year, count: counts.get(year) ?? 0 })
    }
    return filled
}

export interface WeekdayCount {
    /** 0 = Sunday … 6 = Saturday, matching Date#getDay. */
    weekday: number
    count: number
}

// Flights per departure weekday. Always returns seven buckets (zeros included)
// so the distribution chart keeps a stable shape. The date is parsed as local
// midnight — a bare `YYYY-MM-DD` would parse as UTC and shift the weekday for
// negative-offset timezones.
export function countByWeekday(flights: readonly FlightStatsRow[]): WeekdayCount[] {
    const counts = new Array<number>(7).fill(0)
    for (const flight of flights) {
        if (!flight.departure_date) continue
        const weekday = new Date(`${flight.departure_date}T00:00:00`).getDay()
        if (Number.isNaN(weekday)) continue
        counts[weekday] += 1
    }
    return counts.map((count, weekday) => ({ weekday, count }))
}

// Distinct arrival cities across flights and trains for the hero strip. Flight
// airports resolve through airports.json so same-city codes (PVG/SHA) count
// once; trains contribute their arrival city, falling back to the station.
export function visitedCityCount(
    flights: readonly FlightStatsRow[],
    trains: readonly TrainStatsRow[],
): number {
    const cities = new Set<string>()
    for (const flight of flights) {
        if (!flight.arrival_airport) continue
        const airport = airportByIata(flight.arrival_airport)
        cities.add((airport?.city ?? flight.arrival_airport).toLowerCase())
    }
    for (const train of trains) {
        const city = train.arrival_city ?? train.arrival_station
        if (city) cities.add(city.toLowerCase())
    }
    return cities.size
}

// Years covered by the logged journeys (flights and trains pooled), newest
// first — the year-filter chips derive from real data instead of a hardcoded
// window, same as the journeys page.
export function yearsOf(
    flights: readonly FlightStatsRow[],
    trains: readonly TrainStatsRow[],
): number[] {
    const years = new Set<number>()
    for (const row of [...flights, ...trains]) {
        const year = Number(row.departure_date?.slice(0, 4))
        if (Number.isInteger(year) && year > 0) years.add(year)
    }
    return [...years].sort((a, b) => b - a)
}
