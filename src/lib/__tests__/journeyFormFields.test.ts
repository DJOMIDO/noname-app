import { describe, expect, it } from 'vitest'
import { FLIGHT_MORE_FIELDS, TRAIN_MORE_FIELDS, hasAnyValue } from '../journeyFormFields'

describe('more-info field lists', () => {
    it('cover the optional flight columns tucked behind the disclosure', () => {
        expect(FLIGHT_MORE_FIELDS).toEqual([
            'stopover_airport', 'gate', 'aircraft_type', 'aircraft_reg',
            'price', 'currency', 'booking_ref', 'notes',
        ])
    })

    it('cover the optional train columns tucked behind the disclosure', () => {
        expect(TRAIN_MORE_FIELDS).toEqual([
            'train_type', 'departure_city', 'arrival_city',
            'price', 'currency', 'booking_ref', 'notes',
        ])
    })
})

describe('hasAnyValue', () => {
    it('is false when every listed key is blank', () => {
        expect(hasAnyValue({ price: '', currency: '', notes: '' }, ['price', 'currency', 'notes'])).toBe(false)
    })

    it('is true when one listed key holds a value', () => {
        expect(hasAnyValue({ price: '', notes: 'window seat' }, ['price', 'notes'])).toBe(true)
    })

    it('treats null, undefined and whitespace-only strings as empty', () => {
        expect(hasAnyValue({ a: null, b: undefined, c: '   ' }, ['a', 'b', 'c'])).toBe(false)
    })

    it('keeps a zero price as a real value', () => {
        // A free/zero fare is still data the edit view should not hide.
        expect(hasAnyValue({ price: 0 }, ['price'])).toBe(true)
    })

    it('ignores keys outside the given list', () => {
        expect(hasAnyValue(
            { airline_code: 'MU', notes: '' },
            ['notes'],
        )).toBe(false)
    })

    it('is false for an empty key list', () => {
        expect(hasAnyValue({ price: '100' }, [])).toBe(false)
    })
})
