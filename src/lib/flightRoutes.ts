// src/lib/flightRoutes.ts
// Geometry for the stats route map: turns flight rows into great-circle arcs
// and airport points as GeoJSON, plus a camera bounds that survives routes
// crossing the antimeridian. Pure logic with no map-library dependency, so it
// stays unit-testable in the Node-only vitest environment.
import type { Feature, FeatureCollection, LineString, Point, Position } from 'geojson'
import * as turf from '@turf/turf'
import { airportByIata, haversineKm, type Airport } from './geo'
import type { FlightStatsRow } from './journeyColumns'

export interface RouteProperties {
    /** "Beijing → London" — hover popup headline. Always the two endpoints,
     *  so a connecting flight reads the same as a direct one. */
    label: string
    /** Stopover city for a connecting flight, otherwise null. */
    via: string | null
    /** Total great-circle distance in km across every leg. */
    distanceKm: number
    /** How many flights in the current dataset fly this city pair, in either
     *  direction — the map's four-step heat colour reads this. */
    times: number
    /** True when this leg's direction is matched against an opposite-direction
     *  flight (earliest departures first) — matched legs render as the two
     *  mirror-symmetric halves of a lens around their shared chord (UMETrip
     *  style). Leftover one-way flights stay on the true great circle, even on
     *  an already-paired route, until a return ticket folds them in. */
    paired: boolean
}

export interface AirportProperties {
    /** Three-letter code, rendered as the label under each dot. */
    iata: string
    /** "PEK (Beijing, China)" — hover popup headline. */
    label: string
}

export type RouteCollection = FeatureCollection<LineString, RouteProperties>
export type AirportCollection = FeatureCollection<Point, AirportProperties>

/** [[west, south], [east, north]] in degrees. */
export type CameraBounds = [[number, number], [number, number]]

export interface FlightRouteGeoJSON {
    routes: RouteCollection
    airports: AirportCollection
    /**
     * Frame covering every airport, or null when there is nothing to show (the
     * map then keeps its default world view).
     */
    bounds: CameraBounds | null
}

/** Vertex count per arc — enough for a smooth curve, cheap at world zoom. */
const ARC_POINTS = 100
/** Lens bulge for a paired round-trip leg, as a fraction of chord length. */
const LENS_RATIO = 0.15
/** Floor so a short round-trip pair stays visible at world zoom. */
const MIN_LENS_DEG = 1.2
/** Cap so a long pair stays a readable lens instead of a giant banana. */
const MAX_LENS_DEG = 8
/** Slack around the airport extent so arcs never touch the panel edge. */
const BOUNDS_PADDING_DEG = 3
/** Half-width of the frame used when a single airport is on the map. */
const SINGLE_POINT_SPAN_DEG = 6
/** Web Mercator cannot represent the poles. */
const MAX_LAT = 85

/**
 * Splits an unwrapped path at antimeridian crossings, interpolating the exact
 * boundary latitude so both ends of the split touch ±180° instead of leaving
 * a gap. A running 360° shift per crossing keeps every piece continuous and
 * inside [−180, 180] on its own.
 */
function splitAtAntimeridian(raw: Position[]): Position[][] {
    const pieces: Position[][] = []
    let current: Position[] = []
    let shift = 0

    for (const [rawLng, lat] of raw) {
        const lng = rawLng + shift
        if (current.length > 0 && (lng > 180 || lng < -180)) {
            const [prevLng, prevLat] = current[current.length - 1]
            const boundary = lng > 180 ? 180 : -180
            const t = (boundary - prevLng) / (lng - prevLng)
            const latAtBoundary = prevLat + t * (lat - prevLat)
            current.push([boundary, latAtBoundary])
            pieces.push(current)
            // Reopen on the other side; later raw points ride the same shift.
            shift -= 2 * boundary
            current = [[-boundary, latAtBoundary]]
        }
        current.push([rawLng + shift, lat])
    }
    pieces.push(current)

    return pieces
}

/**
 * One half of the round-trip lens (UMETrip-style forward/reverse arcs): a
 * quadratic Bezier from dep to arr bulging to the LEFT of its own travel
 * direction, by `h` degrees at mid-span. Outbound and return travel opposite
 * ways, so the same left-of-travel rule puts them on opposite sides of the
 * shared chord and the two arcs come out mirror-symmetric, pinned at both
 * airports.
 *
 * Sampled in cosine-corrected space so the bulge looks isotropic at any
 * latitude; the destination longitude is unwrapped relative to the origin (a
 * lens never spans more than a half turn) and the result is split at the
 * antimeridian with interpolated boundary points.
 */
function lensPieces(dep: Airport, arr: Airport): Position[][] {
    let bLng = arr.lng
    while (bLng - dep.lng > 180) bLng -= 360
    while (bLng - dep.lng < -180) bLng += 360

    const cosLat = Math.max(Math.cos((((dep.lat + arr.lat) / 2) * Math.PI) / 180), 0.08)
    const ax = dep.lng * cosLat
    const bx = bLng * cosLat
    const dx = bx - ax
    const dy = arr.lat - dep.lat
    const len = Math.hypot(dx, dy)
    const h = Math.min(Math.max(len * LENS_RATIO, MIN_LENS_DEG), MAX_LENS_DEG)

    // Left of travel is the heading rotated 90° counter-clockwise: (-dy, dx).
    // The control point sits at 2h so the curve peaks at exactly h mid-span.
    const norm = len || 1
    const cx = (ax + bx) / 2 + (2 * h * -dy) / norm
    const cy = (dep.lat + arr.lat) / 2 + (2 * h * dx) / norm

    const raw: Position[] = []
    for (let index = 0; index < ARC_POINTS; index += 1) {
        const t = index / (ARC_POINTS - 1)
        const mt = 1 - t
        const x = mt * mt * ax + 2 * mt * t * cx + t * t * bx
        const y = mt * mt * dep.lat + 2 * mt * t * cy + t * t * arr.lat
        raw.push([x / cosLat, y])
    }
    return splitAtAntimeridian(raw)
}

/**
 * Arc geometry between two airports as GeoJSON positions ([lng, lat]).
 * A paired round-trip leg becomes one half of the mirror-symmetric lens; a
 * one-way leg rides the true great circle. turf returns a MultiLineString
 * when a great circle crosses the antimeridian; each piece becomes its own
 * LineString so the arc renders on both sides instead of streaking across
 * the whole map.
 */
function arcSegments(dep: Airport, arr: Airport, paired: boolean): Position[][] {
    if (paired) return lensPieces(dep, arr)
    const arc = turf.greatCircle([dep.lng, dep.lat], [arr.lng, arr.lat], { npoints: ARC_POINTS })
    const geometry = arc.geometry
    return geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates]
}

const clampLat = (lat: number) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat))

/**
 * Camera bounds covering every airport.
 *
 * Longitudes are unwrapped relative to the first airport so that a route
 * crossing the antimeridian (LAX→PEK) yields a contiguous box rather than one
 * spanning the entire globe. The result may therefore fall outside ±180, which
 * MapLibre accepts.
 */
function boundsOf(airports: Airport[]): CameraBounds | null {
    if (airports.length === 0) return null

    const anchor = airports[0].lng
    let west = Infinity
    let east = -Infinity
    let south = Infinity
    let north = -Infinity

    for (const airport of airports) {
        let lng = airport.lng
        while (lng - anchor > 180) lng -= 360
        while (lng - anchor < -180) lng += 360
        west = Math.min(west, lng)
        east = Math.max(east, lng)
        south = Math.min(south, clampLat(airport.lat))
        north = Math.max(north, clampLat(airport.lat))
    }

    // A lone airport has zero extent, so pad it into a city-level frame.
    if (west === east) {
        west -= SINGLE_POINT_SPAN_DEG
        east += SINGLE_POINT_SPAN_DEG
    }
    if (south === north) {
        south -= SINGLE_POINT_SPAN_DEG
        north += SINGLE_POINT_SPAN_DEG
    }

    return [
        [west - BOUNDS_PADDING_DEG, clampLat(south - BOUNDS_PADDING_DEG)],
        [east + BOUNDS_PADDING_DEG, clampLat(north + BOUNDS_PADDING_DEG)],
    ]
}

function placeOf(airport: Airport): string {
    return [airport.city, airport.country].filter(Boolean).join(', ')
}

const cityOf = (airport: Airport): string => airport.city ?? airport.iata

/**
 * Unordered endpoint-pair key for CITY labels: PVG→ADD and ADD→SHA are the
 * same route for heat purposes (Shanghai is one market), so a round trip warms
 * one colour instead of splitting it.
 */
export function routeHeatKey(departure: string | null, arrival: string | null): string {
    return [departure ?? '', arrival ?? ''].sort().join('-')
}

/**
 * Airports a flight touches in order: departure, optional stopover, arrival.
 *
 * Both endpoints must resolve in airports.json — a flight with an unknown
 * origin or destination draws nothing, matching the previous behaviour. A
 * stopover that fails to resolve is simply dropped, degrading to a direct arc
 * rather than dropping the whole flight.
 */
function flightLegs(flight: FlightStatsRow): Airport[] | null {
    const dep = airportByIata(flight.departure_airport)
    const arr = airportByIata(flight.arrival_airport)
    if (!dep || !arr) return null

    const stopover = airportByIata(flight.stopover_airport)
    return stopover ? [dep, stopover, arr] : [dep, arr]
}

/**
 * Builds the GeoJSON the route map renders from a set of flight rows.
 * A connecting flight yields one arc per leg, all sharing the same properties
 * so hovering any leg reports the whole journey.
 */
export function flightRouteGeoJSON(flights: readonly FlightStatsRow[]): FlightRouteGeoJSON {
    const routeFeatures: Feature<LineString, RouteProperties>[] = []
    // Keyed by IATA so a hub visited by many flights yields a single dot.
    const uniqueAirports = new Map<string, Airport>()

    // Resolve legs once: the heat pass and the geometry pass need the same
    // legs, and flights with unknown endpoints must not dilute the counts.
    // The departure date comes along for chronological round-trip matching.
    const resolved = flights
        .map(flight => ({ date: flight.departure_date, legs: flightLegs(flight) }))
        .filter((entry): entry is { date: string; legs: Airport[] } => entry.legs !== null)

    // Heat per unordered endpoint CITY pair: both directions of a round trip
    // pool into one count, and same-city airport changes (CTU/TFU, ISL/IST)
    // count together instead of splitting.
    const heatKeyOf = (legs: readonly Airport[]) =>
        routeHeatKey(cityOf(legs[0]), cityOf(legs[legs.length - 1]))
    const pairCounts = new Map<string, number>()
    for (const { legs } of resolved) {
        const key = heatKeyOf(legs)
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
    }

    // Round-trip matching per directed city-level leg: each direction can only
    // pair up min(there, back) times. Matched legs share the lens; leftover
    // one-ways stay visibly separate on their true great circle until a return
    // ticket for them shows up and folds them into the existing lens.
    const legKeyOf = (a: Airport, b: Airport) => `${cityOf(a)}>${cityOf(b)}`
    const legCounts = new Map<string, number>()
    for (const { legs } of resolved) {
        for (let index = 0; index < legs.length - 1; index += 1) {
            const key = legKeyOf(legs[index], legs[index + 1])
            legCounts.set(key, (legCounts.get(key) ?? 0) + 1)
        }
    }
    const quota = new Map<string, number>()
    for (const [key, count] of legCounts) {
        const [from, to] = key.split('>')
        quota.set(key, Math.min(count, legCounts.get(`${to}>${from}`) ?? 0))
    }

    // Consume each direction's quota in departure-date order (ISO dates sort
    // lexicographically; ties keep dataset order), so the chronologically
    // earliest flights form the lens pairs — a later return ticket closes the
    // oldest still-open one-way.
    const pairedFlags: boolean[][] = resolved.map(() => [])
    const chronological = resolved
        .map((_, index) => index)
        .sort((a, b) =>
            resolved[a].date === resolved[b].date ? a - b : resolved[a].date < resolved[b].date ? -1 : 1)
    for (const entryIndex of chronological) {
        const { legs } = resolved[entryIndex]
        for (let index = 0; index < legs.length - 1; index += 1) {
            const key = legKeyOf(legs[index], legs[index + 1])
            const left = quota.get(key) ?? 0
            pairedFlags[entryIndex].push(left > 0)
            if (left > 0) quota.set(key, left - 1)
        }
    }

    for (const [entryIndex, { legs }] of resolved.entries()) {
        for (const airport of legs) uniqueAirports.set(airport.iata, airport)

        const base: Omit<RouteProperties, 'paired'> = {
            label: `${cityOf(legs[0])} → ${cityOf(legs[legs.length - 1])}`,
            via: legs.length > 2 ? cityOf(legs[1]) : null,
            distanceKm: legs
                .slice(1)
                .reduce((total, arr, index) => total + haversineKm(legs[index], arr), 0),
            times: pairCounts.get(heatKeyOf(legs)) ?? 1,
        }

        for (let index = 0; index < legs.length - 1; index += 1) {
            // paired is per leg: one leg of a journey can run both ways while
            // its sibling leg is one-way.
            const properties: RouteProperties = { ...base, paired: pairedFlags[entryIndex][index] }
            for (const coordinates of arcSegments(legs[index], legs[index + 1], properties.paired)) {
                routeFeatures.push({
                    type: 'Feature',
                    properties,
                    geometry: { type: 'LineString', coordinates },
                })
            }
        }
    }

    const airports = [...uniqueAirports.values()]

    return {
        routes: { type: 'FeatureCollection', features: routeFeatures },
        airports: {
            type: 'FeatureCollection',
            features: airports.map(airport => ({
                type: 'Feature',
                properties: { iata: airport.iata, label: `${airport.iata} (${placeOf(airport)})` },
                geometry: { type: 'Point', coordinates: [airport.lng, airport.lat] },
            })),
        },
        bounds: boundsOf(airports),
    }
}
