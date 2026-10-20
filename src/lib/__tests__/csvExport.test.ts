import { describe, expect, it } from 'vitest'
import { exportColumns, toExportCsv } from '../csvExport'
import {
    csvTemplate, flightHeaders, parseImportCsv, toDatabaseRow, trainHeaders,
} from '../csvImport'

// A fully-populated flight record shaped like the export query returns it
// (every header column present, nullables sometimes null).
const flightRow: Record<string, unknown> = {
    airline_code: 'MU',
    flight_number: '5101',
    departure_airport: 'SHA',
    stopover_airport: null,
    arrival_airport: 'PEK',
    departure_date: '2026-03-01',
    departure_time: '08:00',
    arrival_date: '2026-03-01',
    arrival_time: '10:15',
    gate: 'C12',
    seat_number: '12A',
    aircraft_type: '73H',
    aircraft_reg: 'B-1234',
    price: 1280.5,
    currency: 'CNY',
    booking_ref: 'ABC123',
    notes: 'window seat',
}

const trainRow: Record<string, unknown> = {
    train_company: 'SNCF',
    train_number: 'TGV 1234',
    train_type: 'TGV',
    departure_station: 'Paris Gare de Lyon',
    arrival_station: 'Lyon Part Dieu',
    departure_city: 'Paris',
    arrival_city: 'Lyon',
    departure_date: '2026-04-01',
    departure_time: '09:00',
    arrival_date: null,
    arrival_time: '11:00',
    coach: '05',
    seat_number: '12A',
    price: 553,
    currency: 'EUR',
    booking_ref: 'XYZ',
    notes: 'window',
}

describe('exportColumns', () => {
    it('lists exactly the import headers, with no id column', () => {
        expect(exportColumns('flight')).toBe(flightHeaders.join(','))
        expect(exportColumns('train')).toBe(trainHeaders.join(','))
    })
})

describe('toExportCsv', () => {
    it('with no rows equals the import template', () => {
        expect(toExportCsv('flight', [])).toBe(csvTemplate('flight'))
        expect(toExportCsv('train', [])).toBe(csvTemplate('train'))
    })

    it('emits the header line, one line per row, and a trailing newline', () => {
        const lines = toExportCsv('flight', [flightRow]).split('\n')
        expect(lines[0]).toBe(flightHeaders.join(','))
        expect(lines).toHaveLength(3) // header + row + trailing empty
        expect(lines[2]).toBe('')
    })

    it('serialises cells in header order', () => {
        const dataLine = toExportCsv('flight', [flightRow]).split('\n')[1]
        expect(dataLine).toBe(
            'MU,5101,SHA,,PEK,2026-03-01,08:00,2026-03-01,10:15,C12,12A,73H,B-1234,1280.5,CNY,ABC123,window seat',
        )
    })

    it('renders null and undefined as empty cells', () => {
        const cells = toExportCsv('flight', [{ ...flightRow, stopover_airport: null, gate: undefined }])
            .split('\n')[1].split(',')
        expect(cells[flightHeaders.indexOf('stopover_airport')]).toBe('')
        expect(cells[flightHeaders.indexOf('gate')]).toBe('')
    })

    it('quotes cells with commas/quotes/newlines and doubles inner quotes', () => {
        const csv = toExportCsv('flight', [{ ...flightRow, notes: 'Night, delayed "2h"\nrebooked' }])
        expect(csv).toContain('"Night, delayed ""2h""\nrebooked"')
    })

    it('exports multiple rows in order', () => {
        const csv = toExportCsv('flight', [flightRow, { ...flightRow, flight_number: '5102' }])
        const rows = parseImportCsv(csv, 'flight')
        expect(rows.map((r) => r.values.flight_number)).toEqual(['5101', '5102'])
    })

    it('round-trips: an exported flight parses back and rebuilds the record', () => {
        const rows = parseImportCsv(toExportCsv('flight', [flightRow]), 'flight')
        expect(rows).toHaveLength(1)
        expect(rows[0].valid).toBe(true)
        expect(rows[0].values).toMatchObject({
            airline_code: 'MU', flight_number: '5101', departure_airport: 'SHA',
            arrival_airport: 'PEK', departure_date: '2026-03-01', notes: 'window seat',
        })
        expect(toDatabaseRow('flight', rows[0].values)).toMatchObject({
            airline_code: 'MU', stopover_airport: null, price: 1280.5,
            currency: 'CNY', seat_number: '12A',
        })
    })

    it('round-trips a value containing commas and quotes', () => {
        const csv = toExportCsv('flight', [{ ...flightRow, notes: 'Night, delayed "2h"' }])
        expect(parseImportCsv(csv, 'flight')[0].values.notes).toBe('Night, delayed "2h"')
    })

    it('serialises train rows against the train headers', () => {
        const csv = toExportCsv('train', [trainRow])
        expect(csv.split('\n')[0]).toBe(trainHeaders.join(','))
        const rows = parseImportCsv(csv, 'train')
        expect(rows).toHaveLength(1)
        expect(rows[0].valid).toBe(true)
        expect(rows[0].values).toMatchObject({
            train_company: 'SNCF', departure_station: 'Paris Gare de Lyon',
            arrival_city: 'Lyon', arrival_date: '',
        })
    })
})
