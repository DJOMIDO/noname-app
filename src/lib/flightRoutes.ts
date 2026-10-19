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
/** Slack around the airport extent so arcs never touch the panel edge. */
const BOUNDS_PADDING_DEG = 3
/** Half-width of the frame used when a single airport is on the map. */
const SINGLE_POINT_SPAN_DEG = 6
/** Web Mercator cannot represent the poles. */
const MAX_LAT = 85

/**
 * Great-circle segments between two airports as GeoJSON positions ([lng, lat]).
 * turf returns a MultiLineString when the path crosses the antimeridian; each
 * piece becomes its own LineString so the arc renders on both sides instead of
 * streaking across the whole map.
 */
function arcSegments(dep: Airport, arr: Airport): Position[][] {
    const arc = turf.greatCircle([dep.lng, dep.lat], [arr.lng, arr.lat], { npoints: ARC_POINTS })
    const geometry = arc.geometry
    if (geometry.type === 'MultiLineString') return geometry.coordinates
    return [geometry.coordinates]
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
            for (const coordinates of arcSegments(legs[index], legs[index + 1])) {
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
