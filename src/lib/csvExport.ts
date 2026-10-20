// CSV export — the mirror image of csvImport. Rows are serialised against the
// exact same header set the importer parses, so an exported file round-trips
// straight back through `parseImportCsv` (export → edit → re-import merges onto
// the original records via the natural key). Pure and DOM-free for testability;
// the download itself lives in the component.
import { flightHeaders, trainHeaders, type JourneyType } from '@/lib/csvImport'
import type { Flight, Train } from '@/types/journeys'

// Row types derived from the very header tuples we serialise, so vue-tsc
// rejects reading a column the export query never fetched.
export type FlightExportRow = Pick<Flight, typeof flightHeaders[number]>
export type TrainExportRow = Pick<Train, typeof trainHeaders[number]>
export type ExportRow = FlightExportRow | TrainExportRow

// Column list for the export read: every editable header, no `id`/timestamps.
// Narrow-column rule honoured — the query names exactly what it consumes.
export const exportColumns = (type: JourneyType): string =>
  (type === 'flight' ? flightHeaders : trainHeaders).join(',')

// RFC 4180 escaping: quote a cell when it holds a comma, quote, CR or LF, and
// double any embedded quote. `null`/`undefined` become an empty cell so the
// importer's "blank keeps the stored value" merge stays lossless.
const escapeCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Serialise stored rows to a CSV string. With zero rows the output equals
// `csvTemplate(type)` (header line + trailing newline).
export const toExportCsv = (
  type: JourneyType,
  rows: readonly Record<string, unknown>[],
): string => {
  const headers = type === 'flight' ? flightHeaders : trainHeaders
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(','))
  }
  return `${lines.join('\n')}\n`
}
