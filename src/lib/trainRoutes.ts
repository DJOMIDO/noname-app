// src/lib/trainRoutes.ts
// Train-specific front end for the shared route geometry. Trains carry no
// coordinates, so the map component resolves each endpoint against the bundled
// offline gazetteer (see lib/stationGazetteer.ts) and hands the positions in
// here; this module stays a pure function so it is unit-testable offline, with
// no network or map dependency.
//
// Endpoints are pooled at STATION level (unlike the flight map's city pooling):
// trains are station-based and users record the specific station, so the heat
// count and round-trip pairing key on the resolved station and each distinct
// station keeps its own dot at its own coordinates, instead of every stop in a
// city collapsing onto one representative point. Synonyms that resolve to the
// same gazetteer row share a dot. A train whose endpoints did not resolve is
// skipped — the same graceful degrade the flight map applies to unknown airports.
import type { FeatureCollection, LineString, Point } from 'geojson'
import type { TrainStatsRow } from './journeyColumns'
import type { PlaceCoord } from './stationGazetteer'
import {
    boundsOf,
    buildRoutes,
    type CameraBounds,
    type LensOptions,
    type RouteJourney,
    type RouteNode,
    type RouteProperties,
} from './routeGeometry'

export type { CameraBounds, RouteProperties }

/**
 * Gentler round-trip lens for trains. The train map fits to a region and its
 * hops are short, so the flight-tuned 1.2° floor would bulge a short pair into
 * a fat banana; here the bulge stays ~10% of the chord with only a tiny floor
 * so a paired round trip still reads as two arcs without shouting.
 */
const TRAIN_LENS: LensOptions = { ratio: 0.1, minDeg: 0.15, maxDeg: 3.5 }

export interface StationProperties {
    /** Short text rendered under the dot — the resolved city (or station) name. */
    name: string
    /** Hover popup headline, e.g. "Shanghai · China". */
    label: string
}

export type TrainRouteCollection = FeatureCollection<LineString, RouteProperties>
export type StationCollection = FeatureCollection<Point, StationProperties>

export interface TrainRouteGeoJSON {
    routes: TrainRouteCollection
    stations: StationCollection
    /** Frame covering every resolved city, or null when nothing resolved. */
    bounds: CameraBounds | null
}

const clean = (value?: string | null): string => (value ?? '').trim()

/**
 * The name we resolve for one endpoint: the station field when present, else the
 * city field. The gazetteer is station-granular and prefers station rows, so
 * querying the station name pins the dot to the actual station ("Valence TGV"
 * resolves to the TGV station, not the city's main station or centroid). Both
 * the query builder and the GeoJSON builder use this, so the coordinate map the
 * component resolves always lines up with the lookups here.
 */
export function endpointQuery(city?: string | null, station?: string | null): string {
    return clean(station) || clean(city)
}

/** Every distinct endpoint name a set of trains needs geocoded. */
export function trainGeocodeQueries(trains: readonly TrainStatsRow[]): string[] {
    const queries = new Set<string>()
    for (const train of trains) {
        const dep = endpointQuery(train.departure_city, train.departure_station)
        const arr = endpointQuery(train.arrival_city, train.arrival_station)
        if (dep) queries.add(dep)
        if (arr) queries.add(arr)
    }
    return [...queries]
}

/** Leading/trailing noise trimmed from a station name for the dot label. */
const DISPLAY_PREFIX = /^(gare de |gare d'|gare |station de |station |bahnhof )/i
const DISPLAY_SUFFIX = /( railway station| rail station| station)$/i

function prettyStation(name: string): string {
    const trimmed = name.replace(DISPLAY_PREFIX, '').replace(DISPLAY_SUFFIX, '').trim()
    return trimmed || name
}

/**
 * Pooling key + dot label for one endpoint. Trains are station-based, so this
 * prefers the resolved gazetteer row's name: distinct stations stay distinct
 * dots at their own coordinates, while synonyms that resolve to the same row
 * ("Paris Nord" / "Gare de Paris-Nord") merge onto one. Prettified for display
 * ("Gare de Paris-Nord" -> "Paris-Nord"). Falls back to the user's station/city
 * text only when the row carried no name.
 */
function nodeLabel(
    result: PlaceCoord,
    cityField?: string | null,
    station?: string | null,
): string {
    const canonical = result.name || clean(station) || clean(cityField) || result.city || ''
    return prettyStation(canonical)
}

interface ResolvedEndpoint {
    /** City-level pooling key (and the dot label). */
    label: string
    result: PlaceCoord
}

/**
 * Looks up one endpoint in the coordinate map, or null when it did not geocode.
 * Pure lookup — nothing is registered until the journey is known to be valid,
 * so a skipped same-city hop never leaves a lone dot behind.
 */
function lookupEndpoint(
    coords: ReadonlyMap<string, PlaceCoord | null>,
    cityField?: string | null,
    station?: string | null,
): ResolvedEndpoint | null {
    const query = endpointQuery(cityField, station)
    if (!query) return null
    const result = coords.get(query)
    if (!result) return null
    return { label: nodeLabel(result, cityField, station), result }
}

/**
 * Builds the route node for a resolved endpoint, snapping it to the first-seen
 * coordinate for its station label so synonyms resolving to the same station
 * share one dot and arcs pin exactly to it. Distinct stations keep distinct dots.
 */
function snapNode(
    nodeRep: Map<string, { lat: number; lng: number }>,
    nodeCountry: Map<string, string | null>,
    { label, result }: ResolvedEndpoint,
): RouteNode {
    const rep = nodeRep.get(label) ?? { lat: result.lat, lng: result.lng }
    nodeRep.set(label, rep)
    nodeCountry.set(label, result.country)
    return { lat: rep.lat, lng: rep.lng, city: label }
}

/**
 * Builds the GeoJSON the train route map renders from train rows plus their
 * resolved coordinates. Trains have no stopover concept, so every journey is a
 * single two-node leg; the heat/lens/pairing semantics are identical to flights.
 */
export function trainRouteGeoJSON(
    trains: readonly TrainStatsRow[],
    coords: ReadonlyMap<string, PlaceCoord | null>,
): TrainRouteGeoJSON {
    // Representative coordinate per station label, in first-seen order — drives
    // both the point layer and the camera frame, and snaps arcs onto their dots.
    const nodeRep = new Map<string, { lat: number; lng: number }>()
    const nodeCountry = new Map<string, string | null>()

    const journeys: RouteJourney[] = []
    for (const train of trains) {
        const dep = lookupEndpoint(coords, train.departure_city, train.departure_station)
        const arr = lookupEndpoint(coords, train.arrival_city, train.arrival_station)
        if (!dep || !arr) continue
        // A same-station hop has no meaningful arc; skip it and leave no dot.
        if (dep.label === arr.label) continue

        journeys.push({
            date: train.departure_date,
            nodes: [snapNode(nodeRep, nodeCountry, dep), snapNode(nodeRep, nodeCountry, arr)],
        })
    }

    const stations: StationCollection = {
        type: 'FeatureCollection',
        features: [...nodeRep.entries()].map(([name, { lat, lng }]) => {
            const country = nodeCountry.get(name)
            return {
                type: 'Feature',
                properties: {
                    name,
                    label: country ? `${name} · ${country}` : name,
                },
                geometry: { type: 'Point', coordinates: [lng, lat] },
            }
        }),
    }

    return {
        routes: { type: 'FeatureCollection', features: buildRoutes(journeys, TRAIN_LENS) },
        stations,
        bounds: boundsOf([...nodeRep.values()]),
    }
}
