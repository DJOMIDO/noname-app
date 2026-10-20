// src/lib/stationGazetteer.ts
// Offline place resolver for the train route map. Trains carry no coordinates
// and the public geocoding APIs are unreliable from the browser (unreachable /
// throttled), so — exactly like the flight map's bundled airports.json — we ship
// a bundled station gazetteer (src/assets/data/stations.json) and resolve names
// against it with zero network access.
//
// The dataset is station-granular: an endpoint resolves to the actual station
// point when its name matches, and to that station's city otherwise. Names are
// the canonical French commercial spellings — SNCF « Gares de voyageurs » for the
// national network and Île-de-France Mobilités for every RER stop;
// `scripts/build-stations.mjs` regenerates the file from those open datasets plus
// a small curated seed that adds city labels for the major stations.
//
// Loaded lazily (dynamic import) so the gazetteer stays out of the main bundle
// and the PWA precache, mirroring the map chunk.

/** A resolved place. `city`/`country` come straight from the dataset row. */
export interface PlaceCoord {
    lat: number
    lng: number
    /** Station (or locality) name as stored in the dataset. */
    name: string
    city: string | null
    country: string | null
}

interface StationRow {
    name: string
    city?: string | null
    country?: string | null
    lat: number
    lng: number
}

/** Leading tokens that add no discriminating power ("Gare de X" == "X"). */
const NAME_PREFIXES = [
    'gare de ', 'gare d\'', 'gare ', 'station de ', 'station ', 'bahnhof ',
    'estacion de ', 'estación de ', 'stazione ', 'station ',
]

/**
 * Trailing tokens that add no discriminating power ("X Railway Station" == "X").
 * Longest first so " railway station" strips before " station". Legacy records
 * (and the old GeoNames-sourced gazetteer) stored many stations in this English
 * form; stripping it lets such a query still resolve to today's canonical row.
 */
const NAME_SUFFIXES = [' railway station', ' rail station', ' station', ' bahnhof', ' gare', ' terminus']

/** lower-case + strip diacritics + collapse whitespace. */
export function normalizePlace(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
}

/** normalizePlace plus removal of spaces/hyphens/apostrophes, for fuzzy tolerance. */
function compact(value: string): string {
    return expandAbbreviations(normalizePlace(value)).replace(/[\s\-']/g, '')
}

/**
 * Expand common French station-name abbreviations to their full form so an
 * abbreviated query matches the dataset ("Paris St Lazare" == the stored
 * "Paris Saint-Lazare"). Applied within compact/token-set keys, where word
 * boundaries survive, and never to normalizePlace itself.
 */
function expandAbbreviations(value: string): string {
    return value.replace(/\b(st|ste)\b/g, m => (m === 'ste' ? 'sainte' : 'saint'))
}

function stripPrefix(value: string): string {
    const norm = normalizePlace(value)
    for (const prefix of NAME_PREFIXES) {
        if (norm.startsWith(prefix)) return norm.slice(prefix.length)
    }
    return norm
}

function stripSuffix(value: string): string {
    const norm = normalizePlace(value)
    for (const suffix of NAME_SUFFIXES) {
        if (norm.endsWith(suffix) && norm.length > suffix.length) {
            return norm.slice(0, -suffix.length).trim()
        }
    }
    return norm
}

/** Strip a leading prefix then a trailing suffix ("Gare de X Station" -> "X"). */
function stripAffixes(value: string): string {
    return stripSuffix(stripPrefix(value))
}

/**
 * Generic words that carry no discriminating power in a station name. Removed
 * (along with spaces/hyphens/apostrophes) before building the token-set key, so
 * "Paris Gare du Nord" and "Gare de Paris-Nord" collapse to the same {paris,nord}
 * set and match regardless of word order.
 */
const STOP_WORDS = new Set([
    'gare', 'de', 'du', 'des', 'd', 'l', 'la', 'le', 'les', 'station', 'railway',
    'bahnhof', 'stazione', 'estacion', 'sur', 'au', 'aux', 'a', 'et', 'the', 'of',
])

/**
 * Order-insensitive key of a name's significant tokens, or '' when fewer than two
 * remain (single-token names are handled by the exact/prefix tiers, and a lone
 * token would collide far too often to be a useful set key).
 */
function tokenSetKey(value: string): string {
    const tokens = normalizePlace(value)
        .split(/[\s\-']+/)
        .map(expandAbbreviations)
        .filter(t => t && !STOP_WORDS.has(t))
    if (tokens.length < 2) return ''
    return [...new Set(tokens)].sort().join('|')
}

interface GazetteerIndex {
    /** Exact / affix-stripped / compact spellings -> row. */
    exact: Map<string, StationRow>
    /** Significant-token-set key -> row, for order-insensitive station names. */
    tokenSet: Map<string, StationRow>
}

let rowsPromise: Promise<StationRow[]> | null = null

/** Loads (once) the raw gazetteer rows, shared by the resolver and the pickers. */
function loadRows(): Promise<StationRow[]> {
    if (!rowsPromise) {
        rowsPromise = import('@/assets/data/stations.json')
            .then(mod => (mod.default ?? mod) as StationRow[])
    }
    return rowsPromise
}

let indexPromise: Promise<GazetteerIndex> | null = null

/** Builds (once) the lookup index: several spellings per row, first row wins. */
function loadIndex(): Promise<GazetteerIndex> {
    if (!indexPromise) {
        indexPromise = loadRows().then(rows => {
            const exact = new Map<string, StationRow>()
            const tokenSet = new Map<string, StationRow>()
            const put = (key: string, row: StationRow) => {
                if (key && !exact.has(key)) exact.set(key, row)
            }
            // Index in priority order so the first-row-wins rule prefers the most
            // precise point for a shared key (e.g. "Grenoble"): hand-curated
            // stations (city set, city !== name) beat GeoNames railway stations
            // (city === null), which beat city centroids (city === name). Without
            // this a bare city name resolves to the locality centroid instead of
            // its station, offsetting the dot by ~1km.
            const isCurated = (r: StationRow) => r.city != null && r.city !== r.name
            const isStation = (r: StationRow) => r.city == null
            const ordered = [
                ...rows.filter(isCurated),
                ...rows.filter(isStation),
                ...rows.filter(r => !isCurated(r) && !isStation(r)),
            ]
            for (const row of ordered) {
                for (const key of [
                    normalizePlace(row.name),
                    stripPrefix(row.name),
                    stripSuffix(row.name),
                    stripAffixes(row.name),
                    compact(row.name),
                    compact(stripPrefix(row.name)),
                    compact(stripSuffix(row.name)),
                    compact(stripAffixes(row.name)),
                ]) {
                    put(key, row)
                }
                if (row.city) {
                    put(normalizePlace(row.city), row)
                    put(compact(row.city), row)
                }
                const setKey = tokenSetKey(row.name)
                if (setKey && !tokenSet.has(setKey)) tokenSet.set(setKey, row)
            }
            return { exact, tokenSet }
        })
    }
    return indexPromise
}

/** Resolve one station/city name against the bundled gazetteer; null if unknown. */
export async function resolvePlace(query: string): Promise<PlaceCoord | null> {
    const name = query?.trim()
    if (!name) return null
    const index = await loadIndex()
    const row = lookup(index, name)
    if (!row) return null
    return {
        lat: row.lat,
        lng: row.lng,
        name: row.name,
        city: row.city ?? null,
        country: row.country ?? null,
    }
}

/**
 * Tiered index lookup. (1) Exact / affix-stripped / compact spellings of the
 * full name. (2) An order-insensitive significant-token set, so a variant
 * spelling ("Gare de Paris-Nord") matches its canonical row ("Paris Gare du
 * Nord") instead of degrading to the bare city. (3) Graceful degradation:
 * longest token prefix first, so an unmatched multi-token name falls back to its
 * leading city ("Valence TGV Rhône-Alpes Sud" -> "valence tgv" -> "valence").
 */
function lookup(index: GazetteerIndex, name: string): StationRow | undefined {
    const { exact, tokenSet } = index
    for (const key of [
        normalizePlace(name), compact(name),
        stripAffixes(name), compact(stripAffixes(name)),
        stripPrefix(name), compact(stripPrefix(name)),
        stripSuffix(name), compact(stripSuffix(name)),
    ]) {
        const hit = exact.get(key)
        if (hit) return hit
    }
    const setKey = tokenSetKey(name)
    if (setKey) {
        const hit = tokenSet.get(setKey)
        if (hit) return hit
    }
    for (const base of [stripAffixes(name), stripPrefix(name), stripSuffix(name), normalizePlace(name)]) {
        const tokens = base.split(' ')
        for (let i = tokens.length; i >= 1; i -= 1) {
            const prefix = tokens.slice(0, i).join(' ')
            const hit = exact.get(prefix) ?? exact.get(compact(prefix))
            if (hit) return hit
        }
    }
    return undefined
}

/**
 * Resolve many names. Keyed by the ORIGINAL query so callers (trainRoutes) can
 * look results up without re-normalizing. Fully offline and synchronous once the
 * dataset chunk is loaded, so there is no rate limiting and nothing to cache.
 */
export async function resolvePlaces(
    queries: readonly string[],
): Promise<Map<string, PlaceCoord | null>> {
    const results = new Map<string, PlaceCoord | null>()
    const unique = [...new Set(queries.map(q => q?.trim()).filter((q): q is string => Boolean(q)))]
    await Promise.all(
        unique.map(async query => {
            results.set(query, await resolvePlace(query))
        }),
    )
    return results
}

/** A pickable suggestion: `label` shown in the dropdown, `value` filled on pick. */
export interface SelectorOption {
    label: string
    value: string
}

/**
 * Search station names for the add/edit picker. Matches name, city and country
 * (diacritic- and case-insensitive) and returns up to `limit` options whose
 * `value` is the canonical dataset name — filling it guarantees an exact hit in
 * the resolver's first tier. Free text remains allowed, so stations outside the
 * bundled coverage still work through the fuzzy tiers.
 */
export async function searchStations(query: string, limit = 12): Promise<SelectorOption[]> {
    const q = normalizePlace(query)
    if (!q) return []
    const rows = await loadRows()
    const out: SelectorOption[] = []
    for (const row of rows) {
        const haystack = normalizePlace(
            [row.name, row.city ?? '', row.country ?? ''].join(' '),
        )
        if (!haystack.includes(q)) continue
        const parts = [row.name, row.city, row.country].filter((p): p is string => Boolean(p))
        out.push({ label: parts.join(' · '), value: row.name })
        if (out.length >= limit) break
    }
    return out
}

/**
 * Search distinct city names for the add/edit picker. Cities are drawn from the
 * gazetteer rows that carry one (curated seed rows); the `value` is the plain
 * city name, which the resolver maps to that city's station coordinate.
 */
export async function searchCities(query: string, limit = 12): Promise<SelectorOption[]> {
    const q = normalizePlace(query)
    if (!q) return []
    const rows = await loadRows()
    const seen = new Set<string>()
    const out: SelectorOption[] = []
    for (const row of rows) {
        if (!row.city) continue
        const key = normalizePlace(row.city)
        if (seen.has(key) || !key.includes(q)) continue
        seen.add(key)
        out.push({
            label: row.country ? `${row.city} · ${row.country}` : row.city,
            value: row.city,
        })
        if (out.length >= limit) break
    }
    return out
}
