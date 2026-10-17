import { describe, expect, it } from 'vitest'
import { airportByIata, haversineKm, timezoneOffsetDiffHours } from '../geo'

describe('airportByIata', () => {
    it('finds a known airport and exposes its city and timezone', () => {
        const sha = airportByIata('SHA')
        expect(sha?.city).toBe('Shanghai')
        expect(sha?.timezone).toBe('Asia/Shanghai')
    })

    it('is case-insensitive', () => {
        expect(airportByIata('pek')?.city).toBe('Beijing')
    })

    it('returns undefined for unknown, empty or missing codes', () => {
        expect(airportByIata('ZZZ')).toBeUndefined()
        expect(airportByIata('')).toBeUndefined()
        expect(airportByIata(null)).toBeUndefined()
        expect(airportByIata(undefined)).toBeUndefined()
    })
})

describe('haversineKm', () => {
    it('computes the great-circle distance for a known pair', () => {
        const distance = haversineKm(airportByIata('PEK')!, airportByIata('SHA')!)
        // Beijing → Shanghai is ~1076 km; allow rounding on the dataset coords.
        expect(distance).toBeGreaterThan(1050)
        expect(distance).toBeLessThan(1100)
    })

    it('is symmetric', () => {
        const pek = airportByIata('PEK')!
        const sha = airportByIata('SHA')!
        expect(haversineKm(pek, sha)).toBe(haversineKm(sha, pek))
    })

    it('is zero between an airport and itself', () => {
        const lax = airportByIata('LAX')!
        expect(haversineKm(lax, lax)).toBe(0)
    })
})

describe('timezoneOffsetDiffHours', () => {
    it('accounts for daylight saving at the destination', () => {
        // Shanghai (UTC+8) → Los Angeles: UTC-7 in July, UTC-8 in January.
        expect(timezoneOffsetDiffHours('SHA', 'LAX', '2026-07-01')).toBe(-15)
        expect(timezoneOffsetDiffHours('SHA', 'LAX', '2026-01-01')).toBe(-16)
    })

    it('returns the plain offset difference where neither side observes DST', () => {
        expect(timezoneOffsetDiffHours('SHA', 'HND', '2026-07-01')).toBe(1)
    })

    it('returns 0 within one timezone', () => {
        // PEK and SHA both sit in Asia/Shanghai.
        expect(timezoneOffsetDiffHours('PEK', 'SHA', '2026-07-01')).toBe(0)
    })

    it('falls back to a fixed date when none is given', () => {
        expect(timezoneOffsetDiffHours('SHA', 'LAX')).toBe(-16)
    })

    it('returns null when either airport is unknown', () => {
        expect(timezoneOffsetDiffHours('ZZZ', 'LAX', '2026-07-01')).toBeNull()
        expect(timezoneOffsetDiffHours('SHA', null, '2026-07-01')).toBeNull()
    })
})
