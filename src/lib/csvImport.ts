export type JourneyType = 'flight' | 'train'

export type FlightImportRow = {
  airline_code: string
  flight_number: string
  departure_airport: string
  stopover_airport: string | null
  arrival_airport: string
  departure_date: string
  departure_time: string | null
  arrival_date: string | null
  arrival_time: string | null
  gate: string | null
  seat_number: string | null
  aircraft_type: string | null
  aircraft_reg: string | null
  price: number | null
  currency: string | null
  booking_ref: string | null
  notes: string | null
}

export type TrainImportRow = {
  train_company: string
  train_number: string
  train_type: string | null
  departure_station: string
  arrival_station: string
  departure_city: string | null
  arrival_city: string | null
  departure_date: string
  departure_time: string | null
  arrival_date: string | null
  arrival_time: string | null
  coach: string | null
  seat_number: string | null
  price: number | null
  currency: string | null
  booking_ref: string | null
  notes: string | null
}

export type ImportRow = {
  rowNumber: number
  values: Record<string, string>
  errors: string[]
  valid: boolean
}

export const flightHeaders = [
  'airline_code', 'flight_number', 'departure_airport', 'stopover_airport',
  'arrival_airport', 'departure_date', 'departure_time', 'arrival_date',
  'arrival_time', 'gate', 'seat_number', 'aircraft_type', 'aircraft_reg',
  'price', 'currency', 'booking_ref', 'notes',
] as const

export const trainHeaders = [
  'train_company', 'train_number', 'train_type', 'departure_station',
  'arrival_station', 'departure_city', 'arrival_city', 'departure_date',
  'departure_time', 'arrival_date', 'arrival_time', 'coach', 'seat_number',
  'price', 'currency', 'booking_ref', 'notes',
] as const

const requiredFields: Record<JourneyType, readonly string[]> = {
  flight: ['airline_code', 'flight_number', 'departure_airport', 'arrival_airport', 'departure_date'],
  train: ['train_company', 'train_number', 'departure_station', 'arrival_station', 'departure_date'],
}

// Fields that identify "the same journey" when re-importing. There is no DB
// unique constraint and the CSV carries no id, so a completed second import is
// matched onto the record the first partial one created via this natural key.
const identityFields: Record<JourneyType, readonly string[]> = {
  flight: ['airline_code', 'flight_number', 'departure_date', 'departure_airport', 'arrival_airport'],
  train: ['train_company', 'train_number', 'departure_date', 'departure_station', 'arrival_station'],
}

const parseCsvLine = (line: string): string[] => {
  const values: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      values.push(value.trim())
      value = ''
    } else {
      value += character
    }
  }

  if (quoted) {
    throw new Error('CSV contains an unclosed quoted field.')
  }

  values.push(value.trim())
  return values
}

const parseCsv = (content: string): string[][] => {
  const rows: string[][] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    const nextCharacter = content[index + 1]

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '""'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
      current += character
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (current.trim() || rows.length > 0) {
        rows.push(parseCsvLine(current))
      }
      current = ''
      if (character === '\r' && nextCharacter === '\n') index += 1
    } else {
      current += character
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field.')
  if (current.trim()) rows.push(parseCsvLine(current))
  return rows
}

const isDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

const isTime = (value: string) => /^\d{2}:\d{2}(:\d{2})?$/.test(value)

const validateValues = (type: JourneyType, values: Record<string, string>): string[] => {
  const errors: string[] = []

  for (const field of requiredFields[type]) {
    if (!values[field]) errors.push(`${field} is required`)
  }

  for (const field of ['departure_date', 'arrival_date']) {
    if (values[field] && !isDate(values[field])) errors.push(`${field} must use YYYY-MM-DD`)
  }
  for (const field of ['departure_time', 'arrival_time']) {
    if (values[field] && !isTime(values[field])) errors.push(`${field} must use HH:mm`)
  }
  if (values.price && (!Number.isFinite(Number(values.price)) || Number(values.price) < 0)) {
    errors.push('price must be a non-negative number')
  }

  return errors
}

export const parseImportCsv = (content: string, type: JourneyType): ImportRow[] => {
  const rows = parseCsv(content.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('CSV must contain a header row and at least one data row.')

  const headers = rows[0].map((header) => header.trim())
  const expectedHeaders = type === 'flight' ? flightHeaders : trainHeaders
  const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header))
  const unknownHeaders = headers.filter((header) => !expectedHeaders.includes(header as never))

  if (missingHeaders.length > 0) {
    throw new Error(`Missing columns: ${missingHeaders.join(', ')}`)
  }
  if (unknownHeaders.length > 0) {
    throw new Error(`Unknown columns: ${unknownHeaders.join(', ')}`)
  }

  return rows.slice(1).map((cells, rowIndex) => {
    const values = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
    const errors = validateValues(type, values)
    return { rowNumber: rowIndex + 2, values, errors, valid: errors.length === 0 }
  }).filter((row) => Object.values(row.values).some(Boolean))
}

const nullable = (value: string) => value || null
const numeric = (value: string) => value ? Number(value) : null

export const toDatabaseRow = (type: JourneyType, values: Record<string, string>) => {
  if (type === 'flight') {
    return {
      airline_code: values.airline_code,
      flight_number: values.flight_number,
      departure_airport: values.departure_airport,
      stopover_airport: nullable(values.stopover_airport),
      arrival_airport: values.arrival_airport,
      departure_date: values.departure_date,
      departure_time: nullable(values.departure_time),
      arrival_date: nullable(values.arrival_date),
      arrival_time: nullable(values.arrival_time),
      gate: nullable(values.gate),
      seat_number: nullable(values.seat_number),
      aircraft_type: nullable(values.aircraft_type),
      aircraft_reg: nullable(values.aircraft_reg),
      price: numeric(values.price),
      currency: nullable(values.currency),
      booking_ref: nullable(values.booking_ref),
      notes: nullable(values.notes),
    } satisfies Omit<FlightImportRow, 'user_id'>
  }

  return {
    train_company: values.train_company,
    train_number: values.train_number,
    train_type: nullable(values.train_type),
    departure_station: values.departure_station,
    arrival_station: values.arrival_station,
    departure_city: nullable(values.departure_city),
    arrival_city: nullable(values.arrival_city),
    departure_date: values.departure_date,
    departure_time: nullable(values.departure_time),
    arrival_date: nullable(values.arrival_date),
    arrival_time: nullable(values.arrival_time),
    coach: nullable(values.coach),
    seat_number: nullable(values.seat_number),
    price: numeric(values.price),
    currency: nullable(values.currency),
    booking_ref: nullable(values.booking_ref),
    notes: nullable(values.notes),
  } satisfies Omit<TrainImportRow, 'user_id'>
}

export type ExistingJourneyRow = { id: string } & Record<string, string | null>

// Narrow column list (id + natural key) for scanning a user's stored records
// when classifying each imported row as new vs. update.
export const importIdentityColumns = (type: JourneyType): string =>
  ['id', ...identityFields[type]].join(',')

// Full editable column list, used to read a matched record before merging.
export const importMergeColumns = (type: JourneyType): string =>
  ['id', ...(type === 'flight' ? flightHeaders : trainHeaders)].join(',')

const normalizeKeyPart = (value: unknown): string =>
  (value === null || value === undefined ? '' : String(value)).trim().toUpperCase()

// Case- and space-insensitive natural key. A CSV row and a stored record are
// keyed the same way, so `mu5101` matches `MU5101` and `PVG ` matches `PVG`.
export const journeyIdentity = (type: JourneyType, values: Record<string, unknown>): string =>
  identityFields[type].map((field) => normalizeKeyPart(values[field])).join('|')

const existingToText = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value)

// Merge semantics for a matched record: a non-empty CSV cell overrides the
// stored value, a blank CSV cell keeps it. Lets a user complete a partial
// import without wiping fields they happened to leave empty this time.
export const mergeImportRow = (
  type: JourneyType,
  existing: Record<string, unknown>,
  values: Record<string, string>,
) => {
  const headers = type === 'flight' ? flightHeaders : trainHeaders
  const merged: Record<string, string> = {}
  for (const field of headers) {
    const csvValue = values[field] ?? ''
    merged[field] = csvValue !== '' ? csvValue : existingToText(existing[field])
  }
  return toDatabaseRow(type, merged)
}

export const csvTemplate = (type: JourneyType) => {
  const headers = type === 'flight' ? flightHeaders : trainHeaders
  return `${headers.join(',')}\n`
}
