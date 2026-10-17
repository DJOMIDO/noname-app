// src/lib/geo.ts
// Route helpers for the journey detail pages: great-circle distance and
// timezone offset difference, both derived from airports.json.
import airports from '@/assets/data/airports.json'
import { DateTime } from 'luxon'

export interface Airport {
    iata: string
    name: string
    city?: string
    country?: string
    lat: number
    lng: number
    timezone: string
}

const byIata = new Map<string, Airport>(
    (airports as unknown as Airport[]).map(a => [a.iata.toUpperCase(), a]),
)

export function airportByIata(iata?: string | null): Airport | undefined {
    return iata ? byIata.get(iata.toUpperCase()) : undefined
}

/** Great-circle distance in kilometres between two airports. */
export function haversineKm(a: Airport, b: Airport): number {
    const R = 6371
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

/**
 * UTC offset difference (arrival − departure) in whole hours on a given date.
 * Returns null when either airport or its timezone is unknown.
 */
export function timezoneOffsetDiffHours(
    depIata?: string | null,
    arrIata?: string | null,
    date?: string | null,
): number | null {
    const dep = airportByIata(depIata)?.timezone
    const arr = airportByIata(arrIata)?.timezone
    if (!dep || !arr) return null
    const day = date || '2000-01-01'
    const depOff = DateTime.fromISO(`${day}T12:00`, { zone: dep }).offset
    const arrOff = DateTime.fromISO(`${day}T12:00`, { zone: arr }).offset
    return Math.round((arrOff - depOff) / 60)
}
