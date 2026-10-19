// src/lib/flightRoutes.ts
// Flight-specific front end for the shared route geometry: resolves flight rows
// into airport nodes via airports.json, hands them to `buildRoutes` for the
// great-circle arcs / round-trip lens / heat, and assembles the airport point
// layer plus a camera bounds that survives routes crossing the antimeridian.
// Pure logic with no map-library dependency, so it stays unit-testable in the
// Node-only vitest environment.
import type { FeatureCollection, LineString, Point } from 'geojson'
import { airportByIata, type Airport } from './geo'
import type { FlightStatsRow } from './journeyColumns'
import {
    boundsOf,
    buildRoutes,
    routeHeatKey,
    type CameraBounds,
    type RouteJourney,
    type RouteNode,
    type RouteProperties,
} from './routeGeometry'

// Re-exported so existing importers (the map view, the geometry tests) keep
// pulling these names from `flightRoutes` after the geometry moved out.
export { routeHeatKey }
export type { CameraBounds, RouteNode, RouteProperties }

export interface AirportProperties {
    /** Three-letter code, rendered as the label under each dot. */
    iata: string
    /** "PEK (Beijing, China)" — hover popup headline. */
    label: string
}

export type RouteCollection = FeatureCollection<LineString, RouteProperties>
export type AirportCollection = FeatureCollection<Point, AirportProperties>

export interface FlightRouteGeoJSON {
    routes: RouteCollection
    airports: AirportCollection
    /**
     * Frame covering every airport, or null when there is nothing to show (the
     * map then keeps its default world view).
     */
    bounds: CameraBounds | null
}

function placeOf(airport: Airport): string {
    return [airport.city, airport.country].filter(Boolean).join(', ')
}

const cityOf = (airport: Airport): string => airport.city ?? airport.iata

/** An airport as a geometry node: coordinates plus the city-level heat key. */
const nodeOf = (airport: Airport): RouteNode => ({
    lat: airport.lat,
    lng: airport.lng,
    city: cityOf(airport),
})

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
    // Resolve legs once: the geometry pass and the airport-point pass need the
    // same legs, and flights with unknown endpoints must not dilute the counts.
    // The departure date comes along for chronological round-trip matching.
    const resolved = flights
        .map(flight => ({ date: flight.departure_date, legs: flightLegs(flight) }))
        .filter((entry): entry is { date: string; legs: Airport[] } => entry.legs !== null)

    const journeys: RouteJourney[] = resolved.map(({ date, legs }) => ({
        date,
        nodes: legs.map(nodeOf),
    }))

    // Keyed by IATA so a hub visited by many flights yields a single dot. The
    // insertion order (journey order, then leg order) is what the point layer
    // and the camera frame are built from.
    const uniqueAirports = new Map<string, Airport>()
    for (const { legs } of resolved) {
        for (const airport of legs) uniqueAirports.set(airport.iata, airport)
    }
    const airports = [...uniqueAirports.values()]

    return {
        routes: { type: 'FeatureCollection', features: buildRoutes(journeys) },
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
