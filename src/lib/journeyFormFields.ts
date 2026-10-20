// The optional "more details" columns for each journey type — the fields the
// merged add/edit form tucks behind its collapsible section (the essentials
// like carrier, number, route, schedule and seat stay always visible). The edit
// page uses these lists to decide whether to auto-expand the section so values
// a record already has aren't hidden behind a collapsed disclosure.

export const FLIGHT_MORE_FIELDS = [
  'stopover_airport', 'gate', 'aircraft_type', 'aircraft_reg',
  'price', 'currency', 'booking_ref', 'notes',
] as const

export const TRAIN_MORE_FIELDS = [
  'train_type', 'departure_city', 'arrival_city',
  'price', 'currency', 'booking_ref', 'notes',
] as const

// True when any of `keys` holds a non-blank value in `record` (null/undefined
// and whitespace-only strings all count as empty).
export const hasAnyValue = (
  record: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  keys.some((key) => {
    const value = record[key]
    return value !== null && value !== undefined && String(value).trim() !== ''
  })
