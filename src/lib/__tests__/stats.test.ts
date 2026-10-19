import { describe, expect, it } from 'vitest'
import {
    countByMonth,
    countByWeekday,
    countByYear,
    flightLegDistanceKm,
    mergeCurrencyTotals,
    sortedCurrencyTotals,
    sumByCurrency,
    topList,
    totalDistanceKm,
    totalFlightMinutes,
    totalTrainMinutes,
    trainLegMinutes,
    visitedCityCount,
    yearsOf,
} from '../stats'
import type { FlightStatsRow, TrainStatsRow } from '../journeyColumns'

type Row = { code: string | null; price?: number | string | null; currency?: string | null }

let seq = 0

/** Minimal flight row — only the columns the aggregations read. */
function flightRow(partial: Partial<FlightStatsRow> = {}): FlightStatsRow {
    seq += 1
    return {
        id: `flight-${seq}`,
        airline_code: 'CA',
        flight_number: `CA${seq}`,
        departure_airport: 'SHA',
        arrival_airport: 'PEK',
        departure_date: '2026-05-01',
        ...partial,
    }
}

/** Minimal train row for the hero city count. */
function trainRow(partial: Partial<TrainStatsRow> = {}): TrainStatsRow {
    seq += 1
    return {
        id: `train-${seq}`,
        train_company: 'SNCF',
        train_number: `T${seq}`,
        departure_station: 'Paris Nord',
        arrival_station: 'Lyon Part-Dieu',
        departure_date: '2026-05-01',
        ...partial,
    }
}

describe('sumByCurrency', () => {
    it('groups amounts by currency and coerces string prices', () => {
        const rows: Row[] = [
            { code: 'a', price: '120.5', currency: 'CNY' },
            { code: 'b', price: 80, currency: 'CNY' },
            { code: 'c', price: 300, currency: 'JPY' },
        ]
        expect(sumByCurrency(rows, r => r.price, r => r.currency)).toEqual({ CNY: 200.5, JPY: 300 })
    })

    it('skips rows without a currency, without an amount, or with a non-numeric amount', () => {
        const rows: Row[] = [
            { code: 'a', price: 100, currency: null },
            { code: 'b', price: null, currency: 'CNY' },
            { code: 'c', price: 'abc', currency: 'CNY' },
            { code: 'd', price: 50, currency: 'CNY' },
        ]
        expect(sumByCurrency(rows, r => r.price, r => r.currency)).toEqual({ CNY: 50 })
    })

    it('returns an empty object for an empty dataset', () => {
        expect(sumByCurrency([], (r: Row) => r.price, r => r.currency)).toEqual({})
    })
})

describe('mergeCurrencyTotals', () => {
    it('sums overlapping currencies across maps', () => {
        expect(mergeCurrencyTotals({ CNY: 100, JPY: 5 }, { CNY: 20, EUR: 3 })).toEqual({
            CNY: 120, JPY: 5, EUR: 3,
        })
    })

    it('returns an empty object when given no maps', () => {
        expect(mergeCurrencyTotals()).toEqual({})
    })
})

describe('sortedCurrencyTotals', () => {
    it('orders entries by descending amount', () => {
        expect(sortedCurrencyTotals({ USD: 40, JPY: 300, CNY: 120.5 })).toEqual([
            { currency: 'JPY', amount: 300 },
            { currency: 'CNY', amount: 120.5 },
            { currency: 'USD', amount: 40 },
        ])
    })

    it('breaks amount ties by currency code so the order stays stable', () => {
        expect(sortedCurrencyTotals({ EUR: 50, CNY: 50 }).map(e => e.currency)).toEqual(['CNY', 'EUR'])
    })

    it('returns an empty array for no totals', () => {
        expect(sortedCurrencyTotals({})).toEqual([])
    })
})

describe('topList', () => {
    it('ranks by descending count with alphabetical tie-breaks', () => {
        const rows: Row[] = [
            { code: 'MU' }, { code: 'CZ' }, { code: 'MU' }, { code: 'CA' },
            { code: 'CZ' }, { code: 'MU' }, { code: '9C' },
        ]
        // MU×3 first, CZ×2 second; the 1-count trio is alphabetical, with the
        // digit-leading code sorting before letters under localeCompare.
        expect(topList(rows, r => r.code)).toEqual([
            { value: 'MU', count: 3 },
            { value: 'CZ', count: 2 },
            { value: '9C', count: 1 },
            { value: 'CA', count: 1 },
        ])
    })

    it('keeps the order stable across equally counted values', () => {
        const rows: Row[] = [{ code: 'MU' }, { code: 'CA' }]
        expect(topList(rows, r => r.code).map(e => e.value)).toEqual(['CA', 'MU'])
    })

    it('slices to the limit when given', () => {
        const rows: Row[] = [{ code: 'MU' }, { code: 'MU' }, { code: 'CA' }, { code: 'CZ' }]
        expect(topList(rows, r => r.code, 2)).toEqual([
            { value: 'MU', count: 2 },
            { value: 'CA', count: 1 },
        ])
    })

    it('skips blank values and returns an empty list for no rows', () => {
        expect(topList([{ code: '' }, { code: null }], r => r.code)).toEqual([])
        expect(topList([] as Row[], r => r.code)).toEqual([])
    })
})

describe('totalDistanceKm', () => {
    it('sums the great-circle distance of every flight', () => {
        // Shanghai → Beijing is roughly 1,080 km on the great circle.
        const total = totalDistanceKm([flightRow(), flightRow()])
        expect(total).toBeGreaterThan(2000)
        expect(total).toBeLessThan(2400)
    })

    it('splits a stopover into two legs, exceeding the direct distance', () => {
        const direct = totalDistanceKm([flightRow()])
        const viaSin = totalDistanceKm([flightRow({ arrival_airport: 'SIN', stopover_airport: 'PEK' })])
        // SHA→PEK→SIN adds the ~4,300 km Beijing–Singapore leg.
        expect(viaSin).toBeGreaterThan(direct + 4000)
    })

    it('skips flights whose airports are not in the dataset', () => {
        const known = totalDistanceKm([flightRow()])
        expect(totalDistanceKm([flightRow(), flightRow({ departure_airport: 'ZZZ' })])).toBe(known)
    })

    it('returns zero without flights', () => {
        expect(totalDistanceKm([])).toBe(0)
    })
})

describe('totalFlightMinutes', () => {
    it('sums timezone-aware durations', () => {
        // Both Shanghai and Beijing are UTC+8, so 08:00→10:30 is exactly 150.
        const total = totalFlightMinutes([
            flightRow({
                departure_time: '08:00', arrival_date: '2026-05-01', arrival_time: '10:30',
            }),
        ])
        expect(total).toBe(150)
    })

    it('skips flights without complete date/time pairs', () => {
        const total = totalFlightMinutes([
            flightRow({ departure_time: '08:00', arrival_date: '2026-05-01', arrival_time: '10:30' }),
            flightRow({ departure_time: '08:00' }),
            flightRow(),
        ])
        expect(total).toBe(150)
    })

    it('returns zero without flights', () => {
        expect(totalFlightMinutes([])).toBe(0)
    })
})

describe('countByYear', () => {
    it('fills gap years with zero counts so the line stays continuous', () => {
        const rows = [
            flightRow({ departure_date: '2024-03-01' }),
            flightRow({ departure_date: '2026-05-01' }),
            flightRow({ departure_date: '2026-08-01' }),
        ]
        expect(countByYear(rows)).toEqual([
            { year: 2024, count: 1 },
            { year: 2025, count: 0 },
            { year: 2026, count: 2 },
        ])
    })

    it('accepts train rows too (any dated row)', () => {
        expect(countByYear([
            trainRow({ departure_date: '2025-06-01' }),
            trainRow({ departure_date: '2026-07-01' }),
        ])).toEqual([
            { year: 2025, count: 1 },
            { year: 2026, count: 1 },
        ])
    })

    it('returns an empty array without dated flights', () => {
        expect(countByYear([])).toEqual([])
    })
})

describe('countByWeekday', () => {
    it('always returns seven buckets, counting the departure weekday', () => {
        // 2026-05-01 is a Friday (weekday 5), 2026-05-03 a Sunday (weekday 0).
        const result = countByWeekday([
            flightRow({ departure_date: '2026-05-01' }),
            flightRow({ departure_date: '2026-05-03' }),
        ])
        expect(result).toHaveLength(7)
        expect(result[5]).toEqual({ weekday: 5, count: 1 })
        expect(result[0]).toEqual({ weekday: 0, count: 1 })
        expect(result[1].count).toBe(0)
    })

    it('accepts train rows too (any dated row)', () => {
        // 2026-05-01 is a Friday (weekday 5).
        const result = countByWeekday([trainRow({ departure_date: '2026-05-01' })])
        expect(result[5]).toEqual({ weekday: 5, count: 1 })
        expect(result.reduce((n, b) => n + b.count, 0)).toBe(1)
    })

    it('returns all-zero buckets without flights', () => {
        expect(countByWeekday([])).toEqual(
            Array.from({ length: 7 }, (_, weekday) => ({ weekday, count: 0 })),
        )
    })
})

describe('countByMonth', () => {
    it('buckets by calendar month, oldest first, only for months present', () => {
        const rows = [
            flightRow({ departure_date: '2026-05-01' }),
            flightRow({ departure_date: '2026-05-20' }),
            flightRow({ departure_date: '2026-01-15' }),
        ]
        expect(countByMonth(rows)).toEqual([
            { label: 'Jan 2026', year: 2026, month: 1, count: 1 },
            { label: 'May 2026', year: 2026, month: 5, count: 2 },
        ])
    })

    it('sorts across a year boundary', () => {
        const rows = [
            flightRow({ departure_date: '2026-02-01' }),
            flightRow({ departure_date: '2025-12-01' }),
        ]
        expect(countByMonth(rows).map(m => m.label)).toEqual(['Dec 2025', 'Feb 2026'])
    })

    it('accepts pooled flight and train rows', () => {
        expect(countByMonth([
            flightRow({ departure_date: '2026-05-01' }),
            trainRow({ departure_date: '2026-05-09' }),
        ])).toEqual([
            { label: 'May 2026', year: 2026, month: 5, count: 2 },
        ])
    })

    it('returns an empty array without dated rows', () => {
        expect(countByMonth([])).toEqual([])
    })
})

describe('visitedCityCount', () => {
    it('counts same-city flight airports once', () => {
        // PVG and SHA are both Shanghai; PEK is Beijing.
        const count = visitedCityCount([
            flightRow({ arrival_airport: 'PVG' }),
            flightRow({ arrival_airport: 'SHA' }),
            flightRow({ arrival_airport: 'PEK' }),
        ], [])
        expect(count).toBe(2)
    })

    it('merges train cities with flight cities and falls back to the station', () => {
        const count = visitedCityCount(
            [flightRow({ arrival_airport: 'PEK' })],
            [
                trainRow({ arrival_city: 'Beijing' }),
                trainRow({ arrival_city: null, arrival_station: 'Lyon Part-Dieu' }),
            ],
        )
        expect(count).toBe(2)
    })

    it('returns zero without journeys', () => {
        expect(visitedCityCount([], [])).toBe(0)
    })
})

describe('flightLegDistanceKm', () => {
    it('measures a direct flight', () => {
        // Shanghai → Beijing is roughly 1,080 km on the great circle.
        expect(flightLegDistanceKm(flightRow())).toBeGreaterThan(1000)
        expect(flightLegDistanceKm(flightRow())).toBeLessThan(1200)
    })

    it('sums both legs of a stopover flight', () => {
        const viaPek = flightLegDistanceKm(flightRow({ arrival_airport: 'SIN', stopover_airport: 'PEK' }))
        expect(viaPek).toBeGreaterThan(flightLegDistanceKm(flightRow()) + 4000)
    })

    it('returns zero when an endpoint is unknown', () => {
        expect(flightLegDistanceKm(flightRow({ departure_airport: 'ZZZ' }))).toBe(0)
    })
})

describe('trainLegMinutes', () => {
    it('diffs departure and arrival timestamps', () => {
        expect(trainLegMinutes(trainRow({
            departure_time: '08:00', arrival_date: '2026-05-01', arrival_time: '10:30',
        }))).toBe(150)
    })

    it('handles overnight arrivals across midnight', () => {
        expect(trainLegMinutes(trainRow({
            departure_date: '2026-05-01', departure_time: '22:00',
            arrival_date: '2026-05-02', arrival_time: '06:30',
        }))).toBe(510)
    })

    it('returns null without a complete arrival', () => {
        expect(trainLegMinutes(trainRow({ departure_time: '08:00' }))).toBeNull()
        expect(trainLegMinutes(trainRow({
            departure_time: null, arrival_date: '2026-05-01', arrival_time: '10:30',
        }))).toBeNull()
    })
})

describe('totalTrainMinutes', () => {
    it('diffs departure and arrival timestamps', () => {
        const total = totalTrainMinutes([
            trainRow({
                departure_time: '08:00', arrival_date: '2026-05-01', arrival_time: '10:30',
            }),
        ])
        expect(total).toBe(150)
    })

    it('handles overnight arrivals across midnight', () => {
        const total = totalTrainMinutes([
            trainRow({
                departure_date: '2026-05-01', departure_time: '22:00',
                arrival_date: '2026-05-02', arrival_time: '06:30',
            }),
        ])
        expect(total).toBe(510)
    })

    it('skips rows without a complete arrival', () => {
        const total = totalTrainMinutes([
            trainRow({ departure_time: '08:00', arrival_date: '2026-05-01', arrival_time: '10:30' }),
            trainRow({ departure_time: '08:00' }),
            trainRow({ departure_time: null, arrival_date: '2026-05-01', arrival_time: '10:30' }),
        ])
        expect(total).toBe(150)
    })

    it('returns zero without trains', () => {
        expect(totalTrainMinutes([])).toBe(0)
    })
})

describe('yearsOf', () => {
    it('pools flight and train years, newest first, deduped', () => {
        const years = yearsOf(
            [
                flightRow({ departure_date: '2024-03-01' }),
                flightRow({ departure_date: '2026-05-01' }),
            ],
            [
                trainRow({ departure_date: '2025-06-01' }),
                trainRow({ departure_date: '2026-07-01' }),
            ],
        )
        expect(years).toEqual([2026, 2025, 2024])
    })

    it('returns an empty list without journeys', () => {
        expect(yearsOf([], [])).toEqual([])
    })
})
