import { describe, expect, it } from 'vitest'
import type { Position } from 'geojson'
import { endpointQuery, trainGeocodeQueries, trainRouteGeoJSON } from '../trainRoutes'
import { buildRoutes, FLIGHT_LENS, type RouteJourney } from '../routeGeometry'
import type { PlaceCoord } from '../stationGazetteer'
import type { TrainStatsRow } from '../journeyColumns'

let seq = 0

/** Minimal stats row — only the endpoint + date columns feed the route map. */
function train(dep: string, arr: string, extra: Partial<TrainStatsRow> = {}): TrainStatsRow {
    seq += 1
    return {
        id: `train-${seq}`,
        train_company: 'X',
        train_number: `${seq}`,
        departure_station: dep,
        arrival_station: arr,
        departure_date: '2026-05-01',
        ...extra,
    }
}

const res = (lat: number, lng: number, city: string | null, country: string | null = null): PlaceCoord =>
    ({ lat, lng, name: city ?? '', city, country })

const coordMap = (entries: Record<string, PlaceCoord | null>) => new Map(Object.entries(entries))

const LONDON = res(51.5, -0.12, 'London', 'UK')
const PARIS = res(48.85, 2.35, 'Paris', 'FR')

describe('endpointQuery', () => {
    it('prefers the station field over the city', () => {
        expect(endpointQuery('Paris', 'Paris Gare du Nord')).toBe('Paris Gare du Nord')
    })

    it('falls back to the city when the station is blank', () => {
        expect(endpointQuery('Paris', '   ')).toBe('Paris')
        expect(endpointQuery('Paris', null)).toBe('Paris')
    })

    it('is empty when neither is present', () => {
        expect(endpointQuery(null, '  ')).toBe('')
    })
})

describe('trainGeocodeQueries', () => {
    it('collects both endpoints, prefers station and de-duplicates', () => {
        const queries = trainGeocodeQueries([
            train('London St Pancras', 'Paris Gare du Nord', { departure_city: 'London', arrival_city: 'Paris' }),
            train('Paris Gare du Nord', 'London St Pancras', { departure_city: 'Paris', arrival_city: 'London' }),
        ])
        expect(queries.sort()).toEqual(['London St Pancras', 'Paris Gare du Nord'])
    })

    it('skips endpoints with no usable name', () => {
        expect(trainGeocodeQueries([train('', 'Paris')])).toEqual(['Paris'])
    })
})

describe('trainRouteGeoJSON', () => {
    it('returns empty collections and no bounds without trains', () => {
        const { routes, stations, bounds } = trainRouteGeoJSON([], coordMap({}))
        expect(routes.features).toEqual([])
        expect(stations.features).toEqual([])
        expect(bounds).toBeNull()
    })

    it('skips a train whose endpoints are not in the coordinate map', () => {
        const { routes, stations } = trainRouteGeoJSON([train('London', 'Paris')], coordMap({}))
        expect(routes.features).toEqual([])
        expect(stations.features).toEqual([])
    })

    it('skips a train when only one endpoint resolved', () => {
        const coords = coordMap({ London: LONDON, Paris: null })
        expect(trainRouteGeoJSON([train('London', 'Paris')], coords).routes.features).toEqual([])
    })

    it('draws one arc with a city-level label and straight-line distance', () => {
        const coords = coordMap({ London: LONDON, Paris: PARIS })
        const { routes, stations, bounds } = trainRouteGeoJSON([train('London', 'Paris')], coords)

        expect(routes.features).toHaveLength(1)
        const props = routes.features[0].properties
        expect(props.label).toBe('London → Paris')
        expect(props.via).toBeNull()
        expect(props.times).toBe(1)
        expect(props.paired).toBe(false)
        // London → Paris is ~340 km on the great circle.
        expect(props.distanceKm).toBeGreaterThan(300)
        expect(props.distanceKm).toBeLessThan(400)

        expect(stations.features.map(f => f.properties.name).sort()).toEqual(['London', 'Paris'])
        expect(stations.features.find(f => f.properties.name === 'London')?.properties.label)
            .toBe('London · UK')
        expect(bounds).not.toBeNull()
    })

    it('queries by station but pools under the city label', () => {
        const coords = coordMap({
            '上海虹桥': res(31.23, 121.47, 'Shanghai', 'CN'),
            'Paris Gare du Nord': res(48.85, 2.35, 'Paris', 'FR'),
        })
        const { routes } = trainRouteGeoJSON(
            [train('上海虹桥', 'Paris Gare du Nord', { departure_city: 'Shanghai', arrival_city: 'Paris' })],
            coords,
        )
        expect(routes.features[0].properties.label).toBe('Shanghai → Paris')
    })

    it('flags both directions of a round trip as paired', () => {
        const coords = coordMap({ London: LONDON, Paris: PARIS })
        const { routes } = trainRouteGeoJSON([train('London', 'Paris'), train('Paris', 'London')], coords)
        expect(routes.features).toHaveLength(2)
        for (const arc of routes.features) expect(arc.properties.paired).toBe(true)
    })

    it('pools repeat same-direction trips into one heat count', () => {
        const coords = coordMap({ London: LONDON, Paris: PARIS })
        const { routes } = trainRouteGeoJSON([train('London', 'Paris'), train('London', 'Paris')], coords)
        expect(routes.features).toHaveLength(2)
        for (const arc of routes.features) {
            expect(arc.properties.paired).toBe(false)
            expect(arc.properties.times).toBe(2)
        }
    })

    it('skips a same-city hop and leaves no lone dot behind', () => {
        const coords = coordMap({
            'London St Pancras': res(51.5, -0.12, 'London', 'UK'),
            'London Kings Cross': res(51.53, -0.12, 'London', 'UK'),
        })
        const { routes, stations } = trainRouteGeoJSON([train('London St Pancras', 'London Kings Cross')], coords)
        expect(routes.features).toEqual([])
        expect(stations.features).toEqual([])
    })

    it('snaps two stations of one city onto a single representative dot', () => {
        const coords = coordMap({
            'London St Pancras': res(51.5, -0.12, 'London', 'UK'),
            // A different station, slightly different coords, same city.
            'London Kings Cross': res(51.6, -0.1, 'London', 'UK'),
            Paris: PARIS,
        })
        const { routes, stations } = trainRouteGeoJSON([
            train('London St Pancras', 'Paris'),
            train('London Kings Cross', 'Paris'),
        ], coords)

        // Both pool into the London↔Paris corridor.
        expect(routes.features).toHaveLength(2)
        for (const arc of routes.features) expect(arc.properties.times).toBe(2)

        // One London dot, pinned to the first-seen coordinate both arcs share.
        expect(stations.features).toHaveLength(2)
        const london = stations.features.find(f => f.properties.name === 'London')
        expect(london?.geometry.coordinates).toEqual([-0.12, 51.5])
    })

    it('keeps distinct stations of one city as separate dots', () => {
        // The user records full station names; two different Paris stations must
        // not collapse onto one city dot (the bug that pinned all of Paris to
        // Gare de Lyon). Each resolves to its own row name -> its own coordinate.
        const nord: PlaceCoord = { lat: 48.88, lng: 2.355, name: 'Gare de Paris-Nord', city: 'Paris', country: 'FR' }
        const lyon: PlaceCoord = { lat: 48.844, lng: 2.374, name: 'Gare de Paris-Gare-de-Lyon', city: 'Paris', country: 'FR' }
        const coords = coordMap({ 'Paris Gare du Nord': nord, 'Paris Gare de Lyon': lyon })
        const { routes, stations } = trainRouteGeoJSON([train('Paris Gare du Nord', 'Paris Gare de Lyon')], coords)

        expect(routes.features).toHaveLength(1)
        expect(stations.features).toHaveLength(2)
        expect(stations.features.map(f => f.properties.name).sort())
            .toEqual(['Paris-Gare-de-Lyon', 'Paris-Nord'])
        const nordDot = stations.features.find(f => f.properties.name === 'Paris-Nord')
        expect(nordDot?.geometry.coordinates).toEqual([2.355, 48.88])
    })
})

describe('trainRouteGeoJSON round-trip lens', () => {
    /** Distance between the two paired arcs at mid-span — twice the bulge. */
    function separation(features: { geometry: { coordinates: Position[] } }[]): number {
        const a = features[0].geometry.coordinates
        const b = features[1].geometry.coordinates
        const midA = a[Math.floor(a.length / 2)]
        const midB = b[Math.floor(b.length / 2)]
        return Math.hypot(midA[0] - midB[0], midA[1] - midB[1])
    }

    it('bulges a paired round trip far less than the flight default', () => {
        const coords = coordMap({ London: LONDON, Paris: PARIS })
        const trainRoutes = trainRouteGeoJSON([train('London', 'Paris'), train('Paris', 'London')], coords)
        expect(trainRoutes.routes.features).toHaveLength(2)
        const trainSep = separation(trainRoutes.routes.features)

        // The same round trip through the flight-tuned lens (world-zoom floor).
        const journeys: RouteJourney[] = [
            { date: '2026-05-01', nodes: [{ lat: 51.5, lng: -0.12, city: 'London' }, { lat: 48.85, lng: 2.35, city: 'Paris' }] },
            { date: '2026-05-08', nodes: [{ lat: 48.85, lng: 2.35, city: 'Paris' }, { lat: 51.5, lng: -0.12, city: 'London' }] },
        ]
        const flightSep = separation(buildRoutes(journeys, FLIGHT_LENS))

        // Short London↔Paris chord: the flight 1.2° floor opens a fat lens,
        // the train lens stays a subtle there-and-back.
        expect(trainSep).toBeLessThan(flightSep)
        expect(trainSep).toBeLessThan(1)
        expect(flightSep).toBeGreaterThan(2)
    })
})
