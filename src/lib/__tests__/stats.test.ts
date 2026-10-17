import { describe, expect, it } from 'vitest'
import { mergeCurrencyTotals, mostFrequent, sumByCurrency } from '../stats'

type Row = { code: string | null; price?: number | string | null; currency?: string | null }

describe('mostFrequent', () => {
    const rows: Row[] = [
        { code: 'MU' }, { code: 'CA' }, { code: 'MU' }, { code: 'MU' }, { code: 'CA' },
    ]

    it('returns the value with the highest count', () => {
        expect(mostFrequent(rows, r => r.code)).toEqual({ value: 'MU', count: 3 })
    })

    it('skips null, undefined and empty values', () => {
        const withBlanks: Row[] = [{ code: null }, { code: '' }, { code: 'CZ' }, { code: 'CZ' }]
        expect(mostFrequent(withBlanks, r => r.code)).toEqual({ value: 'CZ', count: 2 })
    })

    it('keeps the first seen value when counts tie', () => {
        const tied: Row[] = [{ code: 'MU' }, { code: 'CA' }]
        expect(mostFrequent(tied, r => r.code)).toEqual({ value: 'MU', count: 1 })
    })

    it('returns null when nothing qualifies', () => {
        expect(mostFrequent([], (r: Row) => r.code)).toBeNull()
        expect(mostFrequent([{ code: '' }], r => r.code)).toBeNull()
    })
})

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
