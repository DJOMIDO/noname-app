// scripts/build-stations.mjs
// Regenerates src/assets/data/stations.json — the offline train gazetteer — from
// authoritative French open data. It replaces the old GeoNames country extract,
// whose RSTN rows carried English "X Railway Station" names that leaked into the
// station picker and the map.
//
// Sources (all fetched at build time — no manual download):
//   1. SNCF « Gares de voyageurs » — every French passenger station with its
//      canonical commercial name (`nom`, e.g. "Bordeaux Saint-Jean", "Paris Gare
//      du Nord"), coordinates (`position_geographique`) and its INSEE commune
//      code (`codeinsee`).  https://ressources.data.sncf.com  (Licence Ouverte 2.0)
//   2. Île-de-France Mobilités « Emplacement des gares IDF » — all RER stops
//      (`mode === "RER"`), including the RATP-operated RER A/B core that SNCF's
//      referential omits. https://data.iledefrance-mobilites.fr  (Licence Ouverte)
//   3. API Découpage Administratif « communes » — INSEE code -> official commune
//      name, used to turn each station's `codeinsee` into its city label.
//      https://geo.api.gouv.fr  (Licence Ouverte / Etalab)
//
// City labels are DERIVED, not hand-written: every SNCF station gets its city
// from `codeinsee` -> commune name, so the gazetteer carries the full set of
// "cities that actually have a station" (a bare query like "Bordeaux" resolves to
// "Bordeaux Saint-Jean", and the city picker lists every such commune). Paris,
// Lyon and Marseille are keyed by MUNICIPAL ARRONDISSEMENT code in SNCF (e.g.
// Gare du Nord -> 75110, which geo.api names "Paris 10e Arrondissement"); those
// are remapped to the parent commune (75056 -> "Paris") so the big cities get a
// clean label. Stations whose `codeinsee` does not resolve — RER stops absent
// from SNCF (IDFM ships no INSEE code) and SNCF stations sitting in a delegated /
// merged commune ("commune nouvelle", whose pre-merger code is not in the bulk
// list) — fall back to a bounded reverse-geocode of their coordinates, so
// essentially every French station still ends up with a city.
//
// The curated seed (stations.seed.json) is applied as an OVERLAY, not as
// first-row-wins rows. Its French entries are name-only ordering anchors that
// keep the major stations (and their cities) leading the picker; a seed name that
// matches a fetched station inherits that station's derived city and official
// coordinates. Seed names with no match (London, Bruxelles, Beijing …) are the
// only hand-labelled rows and are emitted verbatim — they have no `codeinsee`.
//
// City fallbacks: the old build also emitted ~2000 GeoNames populated places as
// bare-city centroids. Those are intentionally dropped — this is a *train*
// gazetteer, so a city only belongs here if it has a station. Rows for cities
// without rail service were dead weight and diluted the picker.
//
// Usage:  node scripts/build-stations.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(DIR, '../src/assets/data/stations.json')
const SEED = path.resolve(DIR, '../src/assets/data/stations.seed.json')

const SNCF_URL =
    'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/gares-de-voyageurs/exports/json'
const IDFM_URL =
    'https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/emplacement-des-gares-idf/exports/json'
const COMMUNES_BASE = 'https://geo.api.gouv.fr/communes'
const COMMUNES_URL = `${COMMUNES_BASE}?fields=code,nom`

const COUNTRY = 'France'

/** lower-case + strip diacritics + collapse whitespace (mirrors stationGazetteer.normalizePlace). */
const norm = (value) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Dedup key: `norm` plus removal of spaces/hyphens/apostrophes (mirrors the
 * resolver's `compact`). SNCF and IDFM name the same IDF station differently
 * ("Achères Grand Cormier" vs "Achères-Grand-Cormier"); keying on the compact
 * form collapses those variants, and since SNCF is ingested first its commercial
 * spelling wins as the canonical name.
 */
const keyOf = (value) => norm(value).replace(/[\s\-']/g, '')

/**
 * Paris, Lyon and Marseille are split into municipal arrondissements, each with
 * its own INSEE code that SNCF uses for stations inside them (Gare du Nord ->
 * 75110). geo.api names those "Paris 10e Arrondissement"; remap to the parent
 * commune so the city label is the clean "Paris" / "Lyon" / "Marseille". Every
 * other commune code maps to itself.
 */
const ARRONDISSEMENT_PARENTS = [
    { pattern: /^751(0[1-9]|1[0-9]|20)$/, parent: '75056' }, // Paris 1er–20e
    { pattern: /^6938[1-9]$/, parent: '69123' },             // Lyon 1er–9e
    { pattern: /^132(0[1-9]|1[0-6])$/, parent: '13055' },    // Marseille 1er–16e
]

function parentCommune(code) {
    if (!code) return null
    for (const { pattern, parent } of ARRONDISSEMENT_PARENTS) {
        if (pattern.test(code)) return parent
    }
    return code
}

async function fetchJson(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText} — ${url}`)
    return res.json()
}

/**
 * Fill in the city for French rows whose `codeinsee` did not resolve: RER-only
 * stops (IDFM ships no INSEE code) and SNCF stations in a delegated / merged
 * commune. geo.api's lat/lon lookup returns the CURRENT commune ("Grand
 * Bourgtheroulde", "Paris"), folding both cases onto a clean city name. Bounded
 * concurrency; runs once at build time (stations.json is committed, so there is
 * no runtime cost). A single failed lookup leaves that row's city null rather
 * than aborting the whole build.
 */
async function reverseGeocodeCities(rows, concurrency = 8) {
    const pending = rows.filter((row) => row.country === COUNTRY && !row.city)
    let resolved = 0
    for (let i = 0; i < pending.length; i += concurrency) {
        const batch = pending.slice(i, i + concurrency)
        await Promise.all(
            batch.map(async (row) => {
                const url = `${COMMUNES_BASE}?lat=${row.lat}&lon=${row.lng}&fields=code,nom`
                try {
                    const hits = await fetchJson(url)
                    const city = hits?.[0]?.nom
                    if (city) {
                        row.city = city
                        resolved += 1
                    }
                } catch {
                    // Leave city=null; a flaky lookup must not fail the build.
                }
            }),
        )
    }
    console.log(`Reverse-geocoded ${resolved}/${pending.length} city labels`)
    return resolved
}

// One row per distinct station; first writer wins (SNCF before RER).
const byName = new Map()
const order = []

function addStation(name, lat, lng, city = null) {
    const clean = (name || '').trim()
    if (!clean || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
    const key = keyOf(clean)
    const existing = byName.get(key)
    if (existing) return existing // first writer wins (SNCF before RER), so its city holds
    const row = { name: clean, city, country: COUNTRY, lat, lng }
    byName.set(key, row)
    order.push(row)
    return row
}

const [sncf, idfm, communes] = await Promise.all([
    fetchJson(SNCF_URL),
    fetchJson(IDFM_URL),
    fetchJson(COMMUNES_URL),
])

const communeNameByCode = new Map(communes.map((c) => [c.code, c.nom]))
/** INSEE commune code -> official city name (arrondissements folded to parent). */
const cityOf = (codeinsee) => communeNameByCode.get(parentCommune(codeinsee)) ?? null
console.log(`Loaded ${communeNameByCode.size} communes for city labels`)

for (const gare of sncf) {
    const pos = gare.position_geographique
    addStation(gare.nom, pos?.lat, pos?.lon, cityOf(gare.codeinsee))
}

const rerRecords = idfm.filter((stop) => (stop.mode || '').toUpperCase() === 'RER')
for (const stop of rerRecords) {
    const pos = stop.geo_point_2d
    // RER stops carry no `codeinsee`; keep city=null (still resolve by name).
    addStation(stop.nom_gares, pos?.lat, pos?.lon)
}

// Seed overlay: matched (French) entries are name-only ordering anchors emitted
// first so the major stations/cities lead the picker — they inherit the station's
// derived city. Unmatched (international) entries are the only hand-labelled rows
// and are emitted as-is.
const seedRows = []
const claimed = new Set()
try {
    for (const entry of JSON.parse(readFileSync(SEED, 'utf8'))) {
        const key = keyOf(entry.name)
        const match = byName.get(key)
        if (match) {
            match.city = entry.city ?? match.city
            if (entry.country) match.country = entry.country
            seedRows.push(match)
            claimed.add(match)
        } else if (Number.isFinite(entry.lat) && Number.isFinite(entry.lng)) {
            // Unmatched seed row carrying its own coordinates (the international
            // stations, which have no SNCF `codeinsee` source).
            const row = {
                name: entry.name,
                city: entry.city ?? null,
                country: entry.country ?? null,
                lat: entry.lat,
                lng: entry.lng,
            }
            byName.set(key, row)
            seedRows.push(row)
        } else {
            // A name-only French anchor whose SNCF spelling drifted: skip rather
            // than emit a coordinate-less row — it only loses its priority slot.
            console.warn(`Seed anchor "${entry.name}" matched no station; skipped`)
        }
    }
} catch {
    // No seed file — stations only.
}

const rows = [...seedRows, ...order.filter((row) => !claimed.has(row))]
await reverseGeocodeCities(rows)
writeFileSync(OUT, `${JSON.stringify(rows)}\n`)
const labeled = rows.filter((row) => row.city).length
console.log(
    `Wrote ${rows.length} rows to ${OUT} — ${labeled} with a city ` +
    `(SNCF ${sncf.length}, IDFM RER ${rerRecords.length}, communes ${communeNameByCode.size}, seed ${seedRows.length})`,
)
