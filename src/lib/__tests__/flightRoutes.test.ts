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

/** The true great-circle path between two known airports. */
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

    it('pools same-city airports into one route: TFU and CTU are both Chengdu', () => {
        const { routes } = flightRouteGeoJSON([flight('TFU', 'CAN'), flight('CAN', 'CTU')])
        expect(routes.features).toHaveLength(2)
        for (const arc of routes.features) expect(arc.properties.times).toBe(2)
        const labels = routes.features.map(f => f.properties.label).sort()
        expect(labels).toEqual(['Chengdu → Guangzhou', 'Guangzhou → Chengdu'])
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

describe('flightRouteGeoJSON round-trip pairing', () => {
    it('leaves a one-direction leg unpaired on the true great circle', () => {
        const { routes } = flightRouteGeoJSON([flight('SHA', 'PEK')])
        expect(routes.features[0].properties.paired).toBe(false)
        expect(routes.features[0].geometry.coordinates).toEqual(greatCircleCoords('SHA', 'PEK'))
    })

    it('flags both directions of a round trip as paired', () => {
        const { routes } = flightRouteGeoJSON([flight('SHA', 'PEK'), flight('PEK', 'SHA')])
        expect(routes.features).toHaveLength(2)
        for (const arc of routes.features) expect(arc.properties.paired).toBe(true)
    })

    it('draws a paired round trip as two arcs mirror-symmetric about the chord', () => {
        const { routes } = flightRouteGeoJSON([flight('SHA', 'PEK'), flight('PEK', 'SHA')])
        const [outbound, homeward] = routes.features
        const out = outbound.geometry.coordinates
        const home = homeward.geometry.coordinates
        const last = out.length - 1
        expect(home).toHaveLength(out.length)

        // Endpoints stay pinned to the airports.
        expect(out[0][0]).toBeCloseTo(COORDS.SHA.lng, 6)
        expect(out[0][1]).toBeCloseTo(COORDS.SHA.lat, 6)
        expect(home[0][0]).toBeCloseTo(COORDS.PEK.lng, 6)
        expect(home[last][0]).toBeCloseTo(COORDS.SHA.lng, 6)

        // Mirror symmetry: paired points average onto the straight chord.
        for (const i of [25, 50, 74]) {
            const t = i / last
            expect((out[i][0] + home[last - i][0]) / 2)
                .toBeCloseTo(COORDS.SHA.lng + t * (COORDS.PEK.lng - COORDS.SHA.lng), 6)
            expect((out[i][1] + home[last - i][1]) / 2)
                .toBeCloseTo(COORDS.SHA.lat + t * (COORDS.PEK.lat - COORDS.SHA.lat), 6)
        }

        // And the lens is actually open in the middle.
        expect(Math.hypot(out[50][0] - home[last - 50][0], out[50][1] - home[last - 50][1])).toBeGreaterThan(2)
    })

    it('overlaps an extra same-direction flight onto its side of the lens', () => {
        // A one-way that matches a paired direction rides the very same arc:
        // the lens shape depends only on endpoints and travel direction, so
        // repeat flights thicken the heat colour, not the arc count.
        const { routes } = flightRouteGeoJSON([flight('SHA', 'PEK'), flight('PEK', 'SHA'), flight('SHA', 'PEK')])
        expect(routes.features).toHaveLength(3)
        const [first, , third] = routes.features
        expect(first.properties.paired).toBe(true)
        expect(third.properties.paired).toBe(true)
        expect(third.geometry.coordinates).toEqual(first.geometry.coordinates)
        expect(third.properties.times).toBe(3)
    })

    it('flags only the legs with traffic in both directions', () => {
        // PEK↔SHA runs both ways and pairs; the one-way SHA→LHR leg does not.
        const { routes } = flightRouteGeoJSON([flight('PEK', 'SHA'), flight('SHA', 'PEK'), flight('SHA', 'LHR')])
        expect(routes.features).toHaveLength(3)
        const [outbound, homeward, plain] = routes.features
        expect(outbound.properties.paired).toBe(true)
        expect(homeward.properties.paired).toBe(true)
        expect(plain.properties.paired).toBe(false)
    })

    it('pairs a round trip that switches airports within its cities', () => {
        // Outbound leaves Chengdu Tianfu, return lands at Chengdu Shuangliu:
        // city-level pairing still recognises the round trip.
        const { routes } = flightRouteGeoJSON([flight('TFU', 'CAN'), flight('CAN', 'CTU')])
        const [outbound, homeward] = routes.features
        expect(outbound.properties.paired).toBe(true)
        expect(homeward.properties.paired).toBe(true)
    })

    it('splits a dateline-crossing paired lens into continuous in-range pieces', () => {
        const { routes } = flightRouteGeoJSON([flight('LAX', 'PEK'), flight('PEK', 'LAX')])
        expect(routes.features.length).toBeGreaterThan(2)
        for (const arc of routes.features) {
            expect(arc.properties.paired).toBe(true)
            const points = arc.geometry.coordinates
            for (const [lng, lat] of points) {
                expect(lng).toBeGreaterThanOrEqual(-180)
                expect(lng).toBeLessThanOrEqual(180)
                expect(lat).toBeGreaterThanOrEqual(-90)
                expect(lat).toBeLessThanOrEqual(90)
            }
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
