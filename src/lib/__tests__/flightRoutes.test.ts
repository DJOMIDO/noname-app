import { describe, expect, it } from 'vitest'
import * as turf from '@turf/turf'
import type { Position } from 'geojson'
import { flightRouteGeoJSON, routeHeatKey } from '../flightRoutes'
import type { FlightStatsRow } from '../journeyColumns'

let seq = 0

/** Minimal stats row — only the airport columns feed the route geometry. */
function flight(from: string, to: string, via?: string): FlightStatsRow {
    seq += 1
    return {
        id: `flight-${seq}`,
        airline_code: 'CA',
        flight_number: `CA${seq}`,
        departure_airport: from,
        stopover_airport: via ?? null,
        arrival_airport: to,
        departure_date: '2026-05-01',
    }
}

/** airports.json coordinates, used to assert the frame covers both endpoints. */
const COORDS = {
    LAX: { lat: 33.9425, lng: -118.4081 },
    PEK: { lat: 40.0799, lng: 116.6031 },
    SHA: { lat: 31.1979, lng: 121.3363 },
    LHR: { lat: 51.47, lng: -0.4543 },
} as const

/** The unbowed reference path between two known airports. */
function greatCircleCoords(from: keyof typeof COORDS, to: keyof typeof COORDS): Position[] {
    const arc = turf.greatCircle(
        [COORDS[from].lng, COORDS[from].lat],
        [COORDS[to].lng, COORDS[to].lat],
        { npoints: 100 },
    )
    return arc.geometry.type === 'LineString' ? arc.geometry.coordinates : arc.geometry.coordinates.flat()
}

describe('flightRouteGeoJSON', () => {
    it('returns empty collections and no bounds without flights', () => {
        const { routes, airports, bounds } = flightRouteGeoJSON([])
        expect(routes.features).toEqual([])
        expect(airports.features).toEqual([])
        expect(bounds).toBeNull()
    })

    it('skips flights whose airports are missing from the dataset', () => {
        const { routes, airports, bounds } = flightRouteGeoJSON([flight('ZZZ', 'LAX')])
        expect(routes.features).toEqual([])
        expect(airports.features).toEqual([])
        expect(bounds).toBeNull()
    })

    it('builds one smooth arc per route with a readable label and distance', () => {
        const { routes } = flightRouteGeoJSON([flight('LHR', 'SHA')])
        expect(routes.features).toHaveLength(1)

        const [arc] = routes.features
        expect(arc.geometry.type).toBe('LineString')
        expect(arc.geometry.coordinates).toHaveLength(100)
        expect(arc.properties.label).toBe('London → Shanghai')
        expect(arc.properties.via).toBeNull()
        // London → Shanghai is ~9,200 km on the great circle.
        expect(arc.properties.distanceKm).toBeGreaterThan(9000)
        expect(arc.properties.distanceKm).toBeLessThan(9400)
    })

    it('emits GeoJSON positions as [lng, lat]', () => {
        const { routes, airports } = flightRouteGeoJSON([flight('LHR', 'SHA')])
        const [firstLng, firstLat] = routes.features[0].geometry.coordinates[0]
        expect(firstLng).toBeCloseTo(COORDS.LHR.lng, 3)
        expect(firstLat).toBeCloseTo(COORDS.LHR.lat, 3)
        expect(airports.features[0].geometry.coordinates).toEqual([COORDS.LHR.lng, COORDS.LHR.lat])
    })

    it('splits an antimeridian-crossing arc into segments instead of one long streak', () => {
        // turf returns a MultiLineString for LAX→PEK; each piece must become its
        // own LineString so both sides of the dateline render.
        const { routes } = flightRouteGeoJSON([flight('LAX', 'PEK')])
        expect(routes.features.length).toBeGreaterThan(1)
        for (const arc of routes.features) {
            expect(arc.geometry.type).toBe('LineString')
            for (const [lng, lat] of arc.geometry.coordinates) {
                expect(lng).toBeGreaterThanOrEqual(-180)
                expect(lng).toBeLessThanOrEqual(180)
                expect(lat).toBeGreaterThanOrEqual(-90)
                expect(lat).toBeLessThanOrEqual(90)
            }
        }
    })

    it('draws a shared hub once across several flights', () => {
        const { airports } = flightRouteGeoJSON([
            flight('SHA', 'PEK'),
            flight('PEK', 'LAX'),
            flight('PEK', 'LHR'),
        ])
        const codes = airports.features.map(f => f.properties.iata)
        expect(codes).toEqual(['SHA', 'PEK', 'LAX', 'LHR'])
        expect(new Set(codes).size).toBe(codes.length)
    })

    it('labels an airport with its code, city and country', () => {
        const { airports } = flightRouteGeoJSON([flight('LAX', 'PEK')])
        const pek = airports.features.find(f => f.properties.iata === 'PEK')
        expect(pek?.properties.label).toBe('PEK (Beijing, China)')
    })
})

describe('flightRouteGeoJSON stopovers', () => {
    it('draws one arc per leg, both carrying the whole journey', () => {
        const { routes } = flightRouteGeoJSON([flight('PEK', 'SYD', 'SIN')])
        // Beijing→Singapore and Singapore→Sydney, one feature each.
        expect(routes.features).toHaveLength(2)
        for (const arc of routes.features) {
            expect(arc.properties.label).toBe('Beijing → Sydney')
            expect(arc.properties.via).toBe('Singapore')
        }
    })

    it('keeps the headline on the endpoints and names the stopover separately', () => {
        const { routes } = flightRouteGeoJSON([flight('PEK', 'SYD', 'SIN')])
        expect(routes.features[0].properties.label).not.toContain('Singapore')
        expect(routes.features[0].properties.via).toBe('Singapore')
    })

    it('sums the leg distances, which exceed the direct great circle', () => {
        const direct = flightRouteGeoJSON([flight('PEK', 'SYD')]).routes.features[0]
        const viaSin = flightRouteGeoJSON([flight('PEK', 'SYD', 'SIN')]).routes.features[0]
        // Routing through Singapore adds ~1,900 km over the direct path.
        expect(viaSin.properties.distanceKm).toBeGreaterThan(direct.properties.distanceKm)
        expect(viaSin.properties.distanceKm - direct.properties.distanceKm).toBeGreaterThan(1500)
    })

    it('gives the stopover its own dot and includes it in the camera frame', () => {
        const { airports, bounds } = flightRouteGeoJSON([flight('PEK', 'SYD', 'SIN')])
        expect(airports.features.map(f => f.properties.iata)).toEqual(['PEK', 'SIN', 'SYD'])

        const [[west, south], [east, north]] = bounds!
        // Singapore (1.36°N, 103.99°E) sits south-west of both endpoints.
        expect(south).toBeLessThan(1.36)
        expect(west).toBeLessThan(103.99)
        expect(east).toBeGreaterThan(103.99)
        expect(north).toBeGreaterThan(1.36)
    })

    it('degrades to a direct arc when the stopover is not in the dataset', () => {
        const { routes, airports } = flightRouteGeoJSON([flight('PEK', 'SYD', 'ZZZ')])
        expect(routes.features).toHaveLength(1)
        expect(routes.features[0].properties.via).toBeNull()
        expect(airports.features.map(f => f.properties.iata)).toEqual(['PEK', 'SYD'])
    })

    it('still skips a flight whose own endpoints are unknown', () => {
        const { routes, airports } = flightRouteGeoJSON([flight('ZZZ', 'SYD', 'SIN')])
        expect(routes.features).toEqual([])
        expect(airports.features).toEqual([])
    })

    it('keeps a direct flight free of a stopover marker', () => {
        const { routes } = flightRouteGeoJSON([flight('LHR', 'SHA')])
        expect(routes.features).toHaveLength(1)
        expect(routes.features[0].properties.via).toBeNull()
    })
})

describe('flightRouteGeoJSON heat', () => {
    it('counts a one-off route as flown once', () => {
        const { routes } = flightRouteGeoJSON([flight('LHR', 'SHA')])
        expect(routes.features[0].properties.times).toBe(1)
    })

    it('pools outbound and return legs into one unordered route', () => {
        const { routes } = flightRouteGeoJSON([
            flight('SHA', 'PEK'),
            flight('PEK', 'SHA'),
            flight('SHA', 'PEK'),
        ])
        for (const arc of routes.features) expect(arc.properties.times).toBe(3)
    })

    it('keeps distinct city pairs on separate counts', () => {
        const { routes } = flightRouteGeoJSON([
            flight('SHA', 'PEK'),
            flight('SHA', 'PEK'),
            flight('PEK', 'LAX'),
        ])
        const shaPek = routes.features.find(f => f.properties.label === 'Shanghai → Beijing')
        const pekLax = routes.features.find(f => f.properties.label === 'Beijing → Los Angeles')
        expect(shaPek?.properties.times).toBe(2)
        expect(pekLax?.properties.times).toBe(1)
    })

    it('gives every leg of a connecting flight the parent route heat', () => {
        const { routes } = flightRouteGeoJSON([flight('PEK', 'SYD', 'SIN'), flight('SYD', 'PEK')])
        expect(routes.features).toHaveLength(3)
        for (const arc of routes.features) expect(arc.properties.times).toBe(2)
    })

    it('does not let unresolvable flights dilute the counts', () => {
        const { routes } = flightRouteGeoJSON([flight('SHA', 'PEK'), flight('ZZZ', 'PEK')])
        expect(routes.features[0].properties.times).toBe(1)
    })
})

describe('routeHeatKey', () => {
    it('is direction-agnostic', () => {
        expect(routeHeatKey('PEK', 'SHA')).toBe(routeHeatKey('SHA', 'PEK'))
    })

    it('separates different city pairs', () => {
        expect(routeHeatKey('PEK', 'SHA')).not.toBe(routeHeatKey('PEK', 'LAX'))
    })

    it('tolerates missing codes', () => {
        expect(routeHeatKey(null, 'PEK')).toBe(routeHeatKey('PEK', null))
    })
})

describe('flightRouteGeoJSON forward/reverse bows', () => {
    it('keeps a one-direction leg on the true great circle', () => {
        const { routes } = flightRouteGeoJSON([flight('SHA', 'PEK')])
        expect(routes.features[0].geometry.coordinates).toEqual(greatCircleCoords('SHA', 'PEK'))
    })

    it('bows outbound and return to opposite sides instead of overlapping', () => {
        const { routes } = flightRouteGeoJSON([flight('SHA', 'PEK'), flight('PEK', 'SHA')])
        expect(routes.features).toHaveLength(2)
        const [outbound, homeward] = routes.features

        const straight = greatCircleCoords('SHA', 'PEK')
        // The return path traverses the same circle in reverse, so its middle
        // vertex is the mirror index of the outbound one.
        const outMid = outbound.geometry.coordinates[50]
        const homeMid = homeward.geometry.coordinates[50]
        const bowOut = [outMid[0] - straight[50][0], outMid[1] - straight[50][1]]
        const bowHome = [homeMid[0] - straight[49][0], homeMid[1] - straight[49][1]]

        // Both bulge away from the great circle…
        expect(Math.hypot(...bowOut)).toBeGreaterThan(0.5)
        expect(Math.hypot(...bowHome)).toBeGreaterThan(0.5)
        // …to opposite sides: the bow vectors point against each other.
        expect(bowOut[0] * bowHome[0] + bowOut[1] * bowHome[1]).toBeLessThan(0)
    })

    it('pins the endpoints of a bowed arc to the unbowed path ends', () => {
        const { routes } = flightRouteGeoJSON([flight('SHA', 'PEK'), flight('PEK', 'SHA')])
        const [outbound, homeward] = routes.features
        const last = outbound.geometry.coordinates.length - 1
        // turf's own interpolation ends, not the raw airport coords: the bow
        // offset is zero at t=0 and t=1, so the pins survive untouched.
        const straightOut = greatCircleCoords('SHA', 'PEK')
        const straightHome = greatCircleCoords('PEK', 'SHA')

        expect(outbound.geometry.coordinates[0]).toEqual(straightOut[0])
        expect(outbound.geometry.coordinates[last]).toEqual(straightOut[straightOut.length - 1])
        expect(homeward.geometry.coordinates[0]).toEqual(straightHome[0])
        expect(homeward.geometry.coordinates[last]).toEqual(straightHome[straightHome.length - 1])
    })

    it('bows only the legs with traffic in both directions', () => {
        // PEK↔SHA runs both ways and bows; the one-way SHA→LHR leg stays straight.
        const { routes } = flightRouteGeoJSON([flight('PEK', 'SHA'), flight('SHA', 'PEK'), flight('SHA', 'LHR')])
        expect(routes.features).toHaveLength(3)
        const [outbound, homeward, plain] = routes.features

        expect(outbound.geometry.coordinates).not.toEqual(greatCircleCoords('PEK', 'SHA'))
        expect(homeward.geometry.coordinates).not.toEqual(greatCircleCoords('SHA', 'PEK'))
        expect(plain.geometry.coordinates).toEqual(greatCircleCoords('SHA', 'LHR'))
    })

    it('keeps a bowed transpacific pair continuous across the antimeridian', () => {
        const { routes } = flightRouteGeoJSON([flight('LAX', 'PEK'), flight('PEK', 'LAX')])
        expect(routes.features.length).toBeGreaterThan(2)
        for (const arc of routes.features) {
            const points = arc.geometry.coordinates
            for (let index = 1; index < points.length; index += 1) {
                // A dateline streak would jump ~360° between two vertices.
                expect(Math.abs(points[index][0] - points[index - 1][0])).toBeLessThan(180)
            }
        }
    })
})

describe('flightRouteGeoJSON bounds', () => {
    it('frames every airport with padding around the extent', () => {
        const { bounds } = flightRouteGeoJSON([flight('LHR', 'SHA')])
        expect(bounds).not.toBeNull()

        const [[west, south], [east, north]] = bounds!
        expect(west).toBeLessThan(COORDS.LHR.lng)
        expect(east).toBeGreaterThan(COORDS.SHA.lng)
        expect(south).toBeLessThan(COORDS.SHA.lat)
        expect(north).toBeGreaterThan(COORDS.LHR.lat)
    })

    it('unwraps longitudes so a transpacific route stays contiguous', () => {
        const { bounds } = flightRouteGeoJSON([flight('LAX', 'PEK')])
        const [[west], [east]] = bounds!
        const span = east - west
        // A naive bbox would span 235° and zoom out to the whole globe; the
        // unwrapped box hugs the actual ~125° of Pacific covered.
        expect(span).toBeGreaterThan(100)
        expect(span).toBeLessThan(180)
        // Unwrapped longitudes may legitimately fall outside ±180.
        expect(west).toBeLessThan(-180)
    })

    it('pads a single airport into a usable frame rather than a zero-size box', () => {
        const { bounds } = flightRouteGeoJSON([flight('PEK', 'PEK')])
        const [[west, south], [east, north]] = bounds!
        expect(east - west).toBeGreaterThan(0)
        expect(north - south).toBeGreaterThan(0)
        expect(west).toBeLessThan(COORDS.PEK.lng)
        expect(east).toBeGreaterThan(COORDS.PEK.lng)
    })

    it('keeps latitude inside the Web Mercator range', () => {
        const { bounds } = flightRouteGeoJSON([flight('LHR', 'PEK')])
        const [[, south], [, north]] = bounds!
        expect(south).toBeGreaterThanOrEqual(-85)
        expect(north).toBeLessThanOrEqual(85)
    })
})
