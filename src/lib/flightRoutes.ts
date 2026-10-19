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
/** Bow strength for a forward/reverse arc pair, as a fraction of leg length. */
const CURVE_RATIO = 0.12
/** Bulge cap, matched to BOUNDS_PADDING_DEG so a bowed arc stays in frame. */
const MAX_BOW_DEG = 3
/** Slack around the airport extent so arcs never touch the panel edge. */
const BOUNDS_PADDING_DEG = 3
/** Half-width of the frame used when a single airport is on the map. */
const SINGLE_POINT_SPAN_DEG = 6
/** Web Mercator cannot represent the poles. */
const MAX_LAT = 85

/** Cosine-corrected segment length in degrees, so bulges look isotropic. */
function segLen(a: Position, b: Position): number {
    const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180)
    return Math.hypot((b[0] - a[0]) * Math.cos(midLat), b[1] - a[1])
}

/**
 * Bows great-circle pieces perpendicular to themselves so an outbound and a
 * return leg render as two distinct arcs (forward/reverse arc, as in UMETrip)
 * instead of overlapping exactly.
 *
 * The offset follows sin(π t) over the whole path — pieces included, so a
 * dateline split does not pinch — which pins the endpoints to their airports.
 * It is measured in a cosine-corrected space so the bulge looks the same at
 * any latitude, and longitudes are unwrapped point-to-point so a bowed arc
 * crossing the antimeridian stays one continuous stroke. The sign is always
 * the same rotation of the local heading, and that is what separates the two
 * directions: the return leg traverses the circle in reverse, so its
 * perpendicular flips and it bulges to the other side.
 */
function bowPieces(pieces: Position[][]): Position[][] {
    const total = pieces.reduce((count, piece) => count + piece.length, 0)
    if (total < 3) return pieces

    const length = pieces.reduce(
        (sum, piece) => piece.slice(1).reduce((inner, point, index) => inner + segLen(piece[index], point), sum),
        0,
    )
    const peak = Math.min(length * CURVE_RATIO, MAX_BOW_DEG)

    const bowed: Position[][] = []
    let running = 0
    let prevLng: number | null = null

    for (const piece of pieces) {
        const out: Position[] = []
        for (let index = 0; index < piece.length; index += 1) {
            const [lng, lat] = piece[index]
            const t = running / (total - 1)
            running += 1
            const offset = peak * Math.sin(Math.PI * t)

            const [pLng, pLat] = piece[Math.max(0, index - 1)]
            const [nLng, nLat] = piece[Math.min(piece.length - 1, index + 1)]
            const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.08)
            const dx = (nLng - pLng) * cosLat
            const dy = nLat - pLat
            const norm = Math.hypot(dx, dy) || 1

            let outLng = lng + (-dy / norm * offset) / cosLat
            const outLat = lat + (dx / norm) * offset
            if (prevLng !== null) {
                while (outLng - prevLng > 180) outLng -= 360
                while (outLng - prevLng < -180) outLng += 360
            }
            prevLng = outLng
            out.push([outLng, outLat])
        }
        bowed.push(out)
    }

    return bowed
}

/**
 * Great-circle segments between two airports as GeoJSON positions ([lng, lat]).
 * turf returns a MultiLineString when the path crosses the antimeridian; each
 * piece becomes its own LineString so the arc renders on both sides instead of
 * streaking across the whole map. With `bowed`, the pieces are bent into a
 * forward/reverse arc pair so opposite directions do not overlap.
 */
function arcSegments(dep: Airport, arr: Airport, bowed: boolean): Position[][] {
    const arc = turf.greatCircle([dep.lng, dep.lat], [arr.lng, arr.lat], { npoints: ARC_POINTS })
    const geometry = arc.geometry
    const pieces = geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates]
    return bowed ? bowPieces(pieces) : pieces
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
 * Unordered endpoint-pair key: PEK→SHA and SHA→PEK are the same route for
 * heat purposes, so a round trip warms one colour instead of splitting it.
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
    const resolved = flights
        .map(flight => ({ flight, legs: flightLegs(flight) }))
        .filter((entry): entry is { flight: FlightStatsRow; legs: Airport[] } => entry.legs !== null)

    const pairCounts = new Map<string, number>()
    for (const { flight } of resolved) {
        const key = routeHeatKey(flight.departure_airport, flight.arrival_airport)
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
    }

    // Ordered leg traffic: a leg only bows into a forward/reverse pair when
    // the opposite direction also exists — one-way legs stay true great circles.
    const legCounts = new Map<string, number>()
    for (const { legs } of resolved) {
        for (let index = 0; index < legs.length - 1; index += 1) {
            const key = `${legs[index].iata}>${legs[index + 1].iata}`
            legCounts.set(key, (legCounts.get(key) ?? 0) + 1)
        }
    }
    const bothDirections = (a: Airport, b: Airport) =>
        (legCounts.get(`${a.iata}>${b.iata}`) ?? 0) > 0 && (legCounts.get(`${b.iata}>${a.iata}`) ?? 0) > 0

    for (const { flight, legs } of resolved) {
        for (const airport of legs) uniqueAirports.set(airport.iata, airport)

        const properties: RouteProperties = {
            label: `${cityOf(legs[0])} → ${cityOf(legs[legs.length - 1])}`,
            via: legs.length > 2 ? cityOf(legs[1]) : null,
            distanceKm: legs
                .slice(1)
                .reduce((total, arr, index) => total + haversineKm(legs[index], arr), 0),
            times: pairCounts.get(routeHeatKey(flight.departure_airport, flight.arrival_airport)) ?? 1,
        }

        for (let index = 0; index < legs.length - 1; index += 1) {
            const bowed = bothDirections(legs[index], legs[index + 1])
            for (const coordinates of arcSegments(legs[index], legs[index + 1], bowed)) {
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
