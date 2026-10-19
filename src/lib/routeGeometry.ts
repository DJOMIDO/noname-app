// src/lib/routeGeometry.ts
// Transport-agnostic geometry for the stats route maps. Everything here works
// on plain `{ lat, lng, city }` nodes, so the same great-circle arcs, round-trip
// lens pairing, four-step heat counting and antimeridian-safe camera bounds
// serve both the flight map (nodes resolved from airports.json) and the train
// map (nodes resolved by geocoding station/city names). Pure logic with no map-
// or dataset dependency, so it stays unit-testable in the Node-only vitest env.
import type { Feature, LineString, Position } from 'geojson'
import * as turf from '@turf/turf'
import { haversineKm } from './geo'

/** One resolved endpoint: coordinates plus the city label used for heat/pairing. */
export interface RouteNode {
    lat: number
    lng: number
    /** City-level label — the heat/pairing key and the popup headline word. */
    city: string
}

/** A single journey as an ordered chain of nodes (a stopover adds a middle one). */
export interface RouteJourney {
    /** Departure date; round-trip pairing consumes the earliest legs first. */
    date: string
    nodes: RouteNode[]
}

export interface RouteProperties {
    /** "Beijing → London" — hover popup headline. Always the two endpoints,
     *  so a connecting journey reads the same as a direct one. */
    label: string
    /** Stopover city for a multi-leg journey, otherwise null. */
    via: string | null
    /** Total great-circle distance in km across every leg. */
    distanceKm: number
    /** How many journeys in the current dataset run this city pair, in either
     *  direction — the map's four-step heat colour reads this. */
    times: number
    /** True when this leg's direction is matched against an opposite-direction
     *  journey (earliest departures first) — matched legs render as the two
     *  mirror-symmetric halves of a lens around their shared chord (UMETrip
     *  style). Leftover one-way legs stay on the true great circle, even on an
     *  already-paired route, until a return ticket folds them in. */
    paired: boolean
}

/** [[west, south], [east, north]] in degrees. */
export type CameraBounds = [[number, number], [number, number]]

/** Vertex count per arc — enough for a smooth curve, cheap at world zoom. */
const ARC_POINTS = 100
/** Slack around the extent so arcs never touch the panel edge. */
const BOUNDS_PADDING_DEG = 3
/** Half-width of the frame used when a single point is on the map. */
const SINGLE_POINT_SPAN_DEG = 6
/** Web Mercator cannot represent the poles. */
const MAX_LAT = 85

/**
 * Round-trip lens shaping. `ratio` is the bulge as a fraction of chord length;
 * `minDeg` / `maxDeg` clamp it in degrees so a short pair stays visible and a
 * long pair stays a readable lens instead of a giant banana.
 *
 * The flight defaults are tuned for a world-scale map, where a short hop still
 * needs a 1.2° floor to read as a round trip. The train map fits to a region
 * and its hops are short, so the same floor over-bulges — trainRoutes passes a
 * gentler lens instead.
 */
export interface LensOptions {
    ratio: number
    minDeg: number
    maxDeg: number
}

export const FLIGHT_LENS: LensOptions = { ratio: 0.15, minDeg: 1.2, maxDeg: 8 }

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
 * endpoints.
 *
 * Sampled in cosine-corrected space so the bulge looks isotropic at any
 * latitude; the destination longitude is unwrapped relative to the origin (a
 * lens never spans more than a half turn) and the result is split at the
 * antimeridian with interpolated boundary points.
 */
function lensPieces(dep: RouteNode, arr: RouteNode, lens: LensOptions): Position[][] {
    let bLng = arr.lng
    while (bLng - dep.lng > 180) bLng -= 360
    while (bLng - dep.lng < -180) bLng += 360

    const cosLat = Math.max(Math.cos((((dep.lat + arr.lat) / 2) * Math.PI) / 180), 0.08)
    const ax = dep.lng * cosLat
    const bx = bLng * cosLat
    const dx = bx - ax
    const dy = arr.lat - dep.lat
    const len = Math.hypot(dx, dy)
    const h = Math.min(Math.max(len * lens.ratio, lens.minDeg), lens.maxDeg)

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
 * Arc geometry between two nodes as GeoJSON positions ([lng, lat]).
 * A paired round-trip leg becomes one half of the mirror-symmetric lens; a
 * one-way leg rides the true great circle. turf returns a MultiLineString
 * when a great circle crosses the antimeridian; each piece becomes its own
 * LineString so the arc renders on both sides instead of streaking across
 * the whole map.
 */
function arcSegments(dep: RouteNode, arr: RouteNode, paired: boolean, lens: LensOptions): Position[][] {
    if (paired) return lensPieces(dep, arr, lens)
    const arc = turf.greatCircle([dep.lng, dep.lat], [arr.lng, arr.lat], { npoints: ARC_POINTS })
    const geometry = arc.geometry
    return geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates]
}

const clampLat = (lat: number) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat))

/**
 * Camera bounds covering every point.
 *
 * Longitudes are unwrapped relative to the first point so that a route
 * crossing the antimeridian (LAX→PEK) yields a contiguous box rather than one
 * spanning the entire globe. The result may therefore fall outside ±180, which
 * MapLibre accepts.
 */
export function boundsOf(points: readonly { lat: number; lng: number }[]): CameraBounds | null {
    if (points.length === 0) return null

    const anchor = points[0].lng
    let west = Infinity
    let east = -Infinity
    let south = Infinity
    let north = -Infinity

    for (const point of points) {
        let lng = point.lng
        while (lng - anchor > 180) lng -= 360
        while (lng - anchor < -180) lng += 360
        west = Math.min(west, lng)
        east = Math.max(east, lng)
        south = Math.min(south, clampLat(point.lat))
        north = Math.max(north, clampLat(point.lat))
    }

    // A lone point has zero extent, so pad it into a city-level frame.
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

/**
 * Unordered endpoint-pair key for CITY labels: PVG→ADD and ADD→SHA are the
 * same route for heat purposes (Shanghai is one market), so a round trip warms
 * one colour instead of splitting it.
 */
export function routeHeatKey(departure: string | null, arrival: string | null): string {
    return [departure ?? '', arrival ?? ''].sort().join('-')
}

/**
 * Turns resolved journeys into route line features: one LineString per leg per
 * antimeridian piece, each carrying the whole journey's properties.
 *
 * Heat pools both directions of a city pair into one count; round-trip pairing
 * matches each directed city-level leg against its opposite up to
 * min(there, back) times in departure-date order, so matched legs share the
 * lens and leftover one-ways stay visibly separate on their true great circle
 * until a return ticket folds them in.
 */
export function buildRoutes(
    journeys: readonly RouteJourney[],
    lens: LensOptions = FLIGHT_LENS,
): Feature<LineString, RouteProperties>[] {
    const routeFeatures: Feature<LineString, RouteProperties>[] = []

    // Heat per unordered endpoint CITY pair: both directions of a round trip
    // pool into one count, and same-city endpoint changes count together
    // instead of splitting.
    const heatKeyOf = (nodes: readonly RouteNode[]) =>
        routeHeatKey(nodes[0].city, nodes[nodes.length - 1].city)
    const pairCounts = new Map<string, number>()
    for (const { nodes } of journeys) {
        const key = heatKeyOf(nodes)
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
    }

    // Round-trip matching per directed city-level leg: each direction can only
    // pair up min(there, back) times. Matched legs share the lens; leftover
    // one-ways stay visibly separate on their true great circle until a return
    // ticket for them shows up and folds them into the existing lens.
    const legKeyOf = (a: RouteNode, b: RouteNode) => `${a.city}>${b.city}`
    const legCounts = new Map<string, number>()
    for (const { nodes } of journeys) {
        for (let index = 0; index < nodes.length - 1; index += 1) {
            const key = legKeyOf(nodes[index], nodes[index + 1])
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
    // earliest journeys form the lens pairs — a later return ticket closes the
    // oldest still-open one-way.
    const pairedFlags: boolean[][] = journeys.map(() => [])
    const chronological = journeys
        .map((_, index) => index)
        .sort((a, b) =>
            journeys[a].date === journeys[b].date ? a - b : journeys[a].date < journeys[b].date ? -1 : 1)
    for (const entryIndex of chronological) {
        const { nodes } = journeys[entryIndex]
        for (let index = 0; index < nodes.length - 1; index += 1) {
            const key = legKeyOf(nodes[index], nodes[index + 1])
            const left = quota.get(key) ?? 0
            pairedFlags[entryIndex].push(left > 0)
            if (left > 0) quota.set(key, left - 1)
        }
    }

    for (const [entryIndex, { nodes }] of journeys.entries()) {
        const base: Omit<RouteProperties, 'paired'> = {
            label: `${nodes[0].city} → ${nodes[nodes.length - 1].city}`,
            via: nodes.length > 2 ? nodes[1].city : null,
            distanceKm: nodes
                .slice(1)
                .reduce((total, arr, index) => total + haversineKm(nodes[index], arr), 0),
            times: pairCounts.get(heatKeyOf(nodes)) ?? 1,
        }

        for (let index = 0; index < nodes.length - 1; index += 1) {
            // paired is per leg: one leg of a journey can run both ways while
            // its sibling leg is one-way.
            const properties: RouteProperties = { ...base, paired: pairedFlags[entryIndex][index] }
            for (const coordinates of arcSegments(nodes[index], nodes[index + 1], properties.paired, lens)) {
                routeFeatures.push({
                    type: 'Feature',
                    properties,
                    geometry: { type: 'LineString', coordinates },
                })
            }
        }
    }

    return routeFeatures
}
