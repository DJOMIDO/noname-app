import { describe, expect, it } from 'vitest'
import {
    csvTemplate, flightHeaders, importIdentityColumns, importMergeColumns,
    journeyIdentity, mergeImportRow, parseImportCsv, toDatabaseRow, trainHeaders,
} from '../csvImport'

// parseImportCsv rejects a file missing any expected column, so the fixtures
// always carry the full header set and only vary the data rows.
const flightCsv = (...rows: string[]) => [flightHeaders.join(','), ...rows].join('\n')

// Cells are emitted from the header list itself, so a fixture can never drift
// out of alignment with the columns it describes.
const rowFor = (headers: readonly string[], values: Record<string, string>, quote = false) =>
    headers.map(header => {
        const value = values[header] ?? ''
        return quote ? `"${value.replace(/"/g, '""')}"` : value
    }).join(',')

const flightDefaults = {
    airline_code: 'MU',
    flight_number: '5101',
    departure_airport: 'SHA',
    arrival_airport: 'PEK',
    departure_date: '2026-03-01',
    departure_time: '08:00',
}

const flightRow = (overrides: Record<string, string> = {}, quote = false) =>
    rowFor(flightHeaders, { ...flightDefaults, ...overrides }, quote)

describe('parseImportCsv', () => {
    it('maps a data row onto the header names', () => {
        const rows = parseImportCsv(flightCsv(flightRow()), 'flight')
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            rowNumber: 2,
            valid: true,
            errors: [],
            values: { airline_code: 'MU', flight_number: '5101', departure_airport: 'SHA' },
        })
    })

    it('numbers rows from 2 so they match the file the user sees', () => {
        const rows = parseImportCsv(flightCsv(flightRow(), flightRow({ flight_number: '5102' })), 'flight')
        expect(rows.map(r => r.rowNumber)).toEqual([2, 3])
    })

    it('accepts headers in any order because cells are keyed by name', () => {
        const shuffled = [...flightHeaders].reverse().join(',')
        const cells = [...flightHeaders].reverse().map(header =>
            header === 'airline_code' ? 'CA' : header === 'flight_number' ? '1234'
                : header === 'departure_airport' ? 'PEK' : header === 'arrival_airport' ? 'SHA'
                    : header === 'departure_date' ? '2026-05-01' : '')
        const rows = parseImportCsv([shuffled, cells.join(',')].join('\n'), 'flight')
        expect(rows[0]?.valid).toBe(true)
        expect(rows[0]?.values.airline_code).toBe('CA')
    })

    it('handles quoted fields containing commas and escaped quotes', () => {
        const csv = flightCsv(flightRow({
            stopover_airport: 'CGO',
            notes: 'Night, delayed "2h" note',
        }, true))
        const rows = parseImportCsv(csv, 'flight')
        expect(rows[0]?.valid).toBe(true)
        expect(rows[0]?.values.notes).toBe('Night, delayed "2h" note')
        expect(rows[0]?.values.stopover_airport).toBe('CGO')
    })

    it('trims surrounding whitespace from every cell', () => {
        const padded = rowFor(flightHeaders, {
            airline_code: ' MU ', flight_number: ' 5101 ', departure_airport: ' SHA ',
            arrival_airport: ' PEK ', departure_date: ' 2026-03-01 ', departure_time: ' 08:00 ',
        })
        const rows = parseImportCsv(flightCsv(padded), 'flight')
        expect(rows[0]?.values.airline_code).toBe('MU')
        expect(rows[0]?.valid).toBe(true)
    })

    it('accepts CRLF line endings and strips a leading BOM', () => {
        const csv = '\uFEFF' + flightCsv(flightRow()).split('\n').join('\r\n')
        const rows = parseImportCsv(csv, 'flight')
        expect(rows).toHaveLength(1)
        expect(rows[0]?.valid).toBe(true)
    })

    it('drops blank lines between records', () => {
        const rows = parseImportCsv(flightCsv(flightRow(), '', flightRow({ flight_number: '5103' })), 'flight')
        expect(rows).toHaveLength(2)
    })

    it('reports missing required fields and marks the row invalid', () => {
        const rows = parseImportCsv(flightCsv(flightRow({ airline_code: '', departure_date: '' })), 'flight')
        expect(rows[0]?.valid).toBe(false)
        expect(rows[0]?.errors).toEqual([
            'airline_code is required',
            'departure_date is required',
        ])
    })

    it('rejects malformed dates, times and negative prices', () => {
        const rows = parseImportCsv(flightCsv(flightRow({
            departure_date: '01-03-2026', arrival_date: '2026-02-30',
            departure_time: '8:0', price: '-5',
        })), 'flight')
        expect(rows[0]?.errors).toEqual([
            'departure_date must use YYYY-MM-DD',
            'arrival_date must use YYYY-MM-DD',
            'departure_time must use HH:mm',
            'price must be a non-negative number',
        ])
    })

    it('requires the full column set', () => {
        const csv = 'airline_code,flight_number\nMU,5101'
        expect(() => parseImportCsv(csv, 'flight')).toThrow(/Missing columns: departure_airport/)
    })

    it('rejects unknown columns', () => {
        const csv = [...flightHeaders, 'extra_column'].join(',') + '\n' + flightRow() + ','
        expect(() => parseImportCsv(csv, 'flight')).toThrow(/Unknown columns: extra_column/)
    })

    it('requires at least one data row', () => {
        expect(() => parseImportCsv(flightHeaders.join(','), 'flight'))
            .toThrow(/at least one data row/)
    })

    it('fails on an unclosed quoted field', () => {
        expect(() => parseImportCsv(flightCsv('"MU,5101,SHA,,PEK,2026-03-01'), 'flight'))
            .toThrow(/unclosed quoted field/)
    })

    it('validates train rows against the train required fields', () => {
        const csv = [
            trainHeaders.join(','),
            rowFor(trainHeaders, {
                departure_station: 'Beijing South',
                departure_date: '2026-04-01',
                arrival_date: '2026-04-02',
                departure_time: '8:0',
            }),
        ].join('\n')
        const rows = parseImportCsv(csv, 'train')
        expect(rows[0]?.errors).toEqual([
            'train_company is required',
            'train_number is required',
            'arrival_station is required',
            'departure_time must use HH:mm',
        ])
    })
})

describe('toDatabaseRow', () => {
    it('turns empty optional cells into null and keeps dates as text', () => {
        const row = toDatabaseRow('flight', {
            airline_code: 'MU', flight_number: '5101', departure_airport: 'SHA',
            arrival_airport: 'PEK', departure_date: '2026-03-01',
            departure_time: '08:00', notes: 'window seat',
        })
        expect(row).toMatchObject({
            airline_code: 'MU',
            stopover_airport: null,
            arrival_date: null,
            gate: null,
            seat_number: null,
            price: null,
            currency: null,
            notes: 'window seat',
        })
    })

    it('parses the price as a number', () => {
        const row = toDatabaseRow('flight', {
            airline_code: 'MU', flight_number: '5101', departure_airport: 'SHA',
            arrival_airport: 'PEK', departure_date: '2026-03-01',
            price: '1280.50', currency: 'CNY',
        })
        expect(row.price).toBe(1280.5)
    })

    it('maps the train columns', () => {
        const row = toDatabaseRow('train', {
            train_company: 'CR', train_number: 'G1', departure_station: 'Beijing South',
            arrival_station: 'Shanghai Hongqiao', departure_date: '2026-04-01',
            departure_city: 'Beijing', coach: '05', seat_number: '12A',
        })
        expect(row).toMatchObject({
            train_company: 'CR',
            train_type: null,
            arrival_city: null,
            arrival_time: null,
            departure_city: 'Beijing',
            coach: '05',
        })
    })
})

describe('csvTemplate', () => {
    it('emits the exact headers the parser expects', () => {
        expect(csvTemplate('flight')).toBe(`${flightHeaders.join(',')}\n`)
        expect(csvTemplate('train')).toBe(`${trainHeaders.join(',')}\n`)
    })

    it('round-trips: the template parses cleanly with one row', () => {
        expect(() => parseImportCsv(csvTemplate('flight') + flightRow(), 'flight')).not.toThrow()
    })
})

describe('journeyIdentity', () => {
    it('is case- and space-insensitive so a re-import matches the original', () => {
        const stored = {
            id: 'abc', airline_code: 'MU', flight_number: '5101',
            departure_date: '2026-03-01', departure_airport: 'SHA', arrival_airport: 'PEK',
        }
        const csvRow = {
            airline_code: ' mu ', flight_number: '5101', departure_date: '2026-03-01',
            departure_airport: 'sha', arrival_airport: ' PEK ',
        }
        expect(journeyIdentity('flight', csvRow)).toBe(journeyIdentity('flight', stored))
    })

    it('produces different keys when a natural-key field differs', () => {
        const base = {
            airline_code: 'MU', flight_number: '5101', departure_date: '2026-03-01',
            departure_airport: 'SHA', arrival_airport: 'PEK',
        }
        expect(journeyIdentity('flight', { ...base, departure_date: '2026-03-02' }))
            .not.toBe(journeyIdentity('flight', base))
        expect(journeyIdentity('flight', { ...base, arrival_airport: 'CAN' }))
            .not.toBe(journeyIdentity('flight', base))
    })

    it('ignores fields outside the natural key', () => {
        const base = {
            airline_code: 'MU', flight_number: '5101', departure_date: '2026-03-01',
            departure_airport: 'SHA', arrival_airport: 'PEK',
        }
        // A completed re-import adds times/price/notes but must still match.
        expect(journeyIdentity('flight', { ...base, departure_time: '08:00', price: '1280', notes: 'x' }))
            .toBe(journeyIdentity('flight', base))
    })

    it('uses the train natural key', () => {
        const a = {
            train_company: 'CR', train_number: 'G1', departure_date: '2026-04-01',
            departure_station: 'Beijing South', arrival_station: 'Shanghai Hongqiao',
        }
        const b = { ...a, train_company: 'cr', departure_station: ' beijing south ' }
        expect(journeyIdentity('train', b)).toBe(journeyIdentity('train', a))
        expect(journeyIdentity('train', { ...a, train_number: 'G3' }))
            .not.toBe(journeyIdentity('train', a))
    })
})

describe('import column sets', () => {
    it('identity columns are id plus the natural key only', () => {
        expect(importIdentityColumns('flight'))
            .toBe('id,airline_code,flight_number,departure_date,departure_airport,arrival_airport')
        expect(importIdentityColumns('train'))
            .toBe('id,train_company,train_number,departure_date,departure_station,arrival_station')
    })

    it('merge columns are id plus every editable header', () => {
        expect(importMergeColumns('flight')).toBe(`id,${flightHeaders.join(',')}`)
        expect(importMergeColumns('train')).toBe(`id,${trainHeaders.join(',')}`)
    })
})

describe('mergeImportRow', () => {
    const stored = {
        id: 'abc', airline_code: 'MU', flight_number: '5101',
        departure_airport: 'SHA', arrival_airport: 'PEK', departure_date: '2026-03-01',
        departure_time: '08:00', seat_number: '12A', price: '1280.50', currency: 'CNY',
        notes: 'window seat', gate: null,
    }

    it('keeps stored values for cells the CSV leaves blank', () => {
        const merged = mergeImportRow('flight', stored, {
            airline_code: 'MU', flight_number: '5101', departure_airport: 'SHA',
            arrival_airport: 'PEK', departure_date: '2026-03-01',
        })
        expect(merged).toMatchObject({
            departure_time: '08:00', seat_number: '12A', currency: 'CNY',
            notes: 'window seat', price: 1280.5, gate: null,
        })
    })

    it('overrides stored values with non-empty CSV cells', () => {
        const merged = mergeImportRow('flight', stored, {
            airline_code: 'MU', flight_number: '5101', departure_airport: 'SHA',
            arrival_airport: 'PEK', departure_date: '2026-03-01',
            departure_time: '09:30', price: '999', notes: 'changed',
        })
        expect(merged).toMatchObject({ departure_time: '09:30', price: 999, notes: 'changed' })
        // Untouched columns still come through from the stored row.
        expect(merged.seat_number).toBe('12A')
    })

    it('completes a partial import without wiping already-stored details', () => {
        // First pass stored only the required fields; second pass fills the rest.
        const partial = {
            id: 'abc', airline_code: 'MU', flight_number: '5101',
            departure_airport: 'SHA', arrival_airport: 'PEK', departure_date: '2026-03-01',
            departure_time: null, seat_number: null, price: null, notes: null,
        }
        const merged = mergeImportRow('flight', partial, {
            airline_code: 'MU', flight_number: '5101', departure_airport: 'SHA',
            arrival_airport: 'PEK', departure_date: '2026-03-01',
            departure_time: '08:00', seat_number: '12A', price: '1280',
        })
        expect(merged).toMatchObject({ departure_time: '08:00', seat_number: '12A', price: 1280 })
    })

    it('merges train rows against their own columns', () => {
        const storedTrain = {
            id: 't1', train_company: 'CR', train_number: 'G1',
            departure_station: 'Beijing South', arrival_station: 'Shanghai Hongqiao',
            departure_date: '2026-04-01', coach: '05', seat_number: '12A', price: '553.00',
        }
        const merged = mergeImportRow('train', storedTrain, {
            train_company: 'CR', train_number: 'G1', departure_station: 'Beijing South',
            arrival_station: 'Shanghai Hongqiao', departure_date: '2026-04-01',
            departure_time: '09:00',
        })
        expect(merged).toMatchObject({ coach: '05', seat_number: '12A', price: 553, departure_time: '09:00' })
    })
})
