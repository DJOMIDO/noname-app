import type { CurrencyTotals } from '@/types/journeys'

export interface TopResult<T> {
    value: T
    count: number
}

// Returns the most frequent non-empty value produced by `keyFn`, or null when
// nothing qualifies. Consolidates the ad-hoc "sort entries by count" logic that
// was duplicated across the stats page and its views.
export function mostFrequent<R, T>(
    rows: R[],
    keyFn: (row: R) => T | null | undefined,
): TopResult<T> | null {
    const counts = new Map<T, number>()
    for (const row of rows) {
        const value = keyFn(row)
        if (value === null || value === undefined || value === '') continue
        counts.set(value, (counts.get(value) ?? 0) + 1)
    }

    let top: TopResult<T> | null = null
    for (const [value, count] of counts) {
        if (!top || count > top.count) top = { value, count }
    }
    return top
}

// Sums a numeric field grouped by currency code, skipping rows missing either.
export function sumByCurrency<R>(
    rows: R[],
    priceFn: (row: R) => number | string | null | undefined,
    currencyFn: (row: R) => string | null | undefined,
): CurrencyTotals {
    const totals: CurrencyTotals = {}
    for (const row of rows) {
        const price = Number(priceFn(row))
        const currency = currencyFn(row)
        if (!currency || !price || Number.isNaN(price)) continue
        totals[currency] = (totals[currency] ?? 0) + price
    }
    return totals
}

// Merges two currency total maps, summing overlapping currencies.
export function mergeCurrencyTotals(...maps: CurrencyTotals[]): CurrencyTotals {
    const merged: CurrencyTotals = {}
    for (const map of maps) {
        for (const [currency, amount] of Object.entries(map)) {
            merged[currency] = (merged[currency] ?? 0) + amount
        }
    }
    return merged
}

export interface CurrencyTotalEntry {
    currency: string
    amount: number
}

// Totals as an array ordered by descending amount, falling back to the currency
// code on ties. Object key order follows the fetched rows, so anything that
// shows only a leading slice of the currencies needs this to stay meaningful
// (biggest spenders first) and stable between loads.
export function sortedCurrencyTotals(totals: CurrencyTotals): CurrencyTotalEntry[] {
    return Object.entries(totals)
        .map(([currency, amount]) => ({ currency, amount }))
        .sort((a, b) => b.amount - a.amount || a.currency.localeCompare(b.currency))
}
