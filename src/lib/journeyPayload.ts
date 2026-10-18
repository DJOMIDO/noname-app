// Normalises a detail/edit form into an UPDATE payload.
//
// The edit forms bind every column as a string and load DB nulls as '' (see
// assign() in FlightDetails/TrainDetails). Postgres rejects '' for the
// date/time/numeric columns, so echoing an untouched-but-empty optional field
// back as '' fails with e.g. `invalid input syntax for type time: ""` — even
// when the user only edited an unrelated field, because the whole form is
// submitted on save. This mirrors the insert path (AddFlight/AddTrain), which
// already maps every optional value with `|| null`.
//
// `requiredKeys` are NOT NULL columns: kept as-is so clearing one surfaces a
// real constraint error instead of silently writing null. `numericKeys` are
// numeric columns: '' -> null, otherwise coerced to a number.
export function buildUpdatePayload<T extends object>(
    form: T,
    options: { requiredKeys?: readonly (keyof T)[]; numericKeys?: readonly (keyof T)[] } = {},
): Record<string, string | number | null> {
    const required = new Set<PropertyKey>(options.requiredKeys ?? [])
    const numeric = new Set<PropertyKey>(options.numericKeys ?? [])
    const payload: Record<string, string | number | null> = {}

    for (const [key, raw] of Object.entries(form)) {
        const value = raw === null || raw === undefined ? '' : String(raw)
        if (numeric.has(key)) {
            payload[key] = value === '' ? null : Number(value)
        } else if (required.has(key)) {
            payload[key] = value
        } else {
            payload[key] = value === '' ? null : value
        }
    }

    return payload
}
