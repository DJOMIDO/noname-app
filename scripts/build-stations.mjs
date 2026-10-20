// scripts/build-stations.mjs
// Regenerates src/assets/data/stations.json — the offline train gazetteer — from
// authoritative French open data. It replaces the old GeoNames country extract,
// whose RSTN rows carried English "X Railway Station" names that leaked into the
// station picker and the map.
//
// Sources (both Opendatasoft catalogs, fetched at build time — no manual download):
//   1. SNCF « Gares de voyageurs » — every French passenger station with its
//      canonical commercial name (`nom`, e.g. "Bordeaux Saint-Jean", "Paris Gare
//      du Nord"), coordinates (`position_geographique`) and INSEE / UIC codes.
//      https://ressources.data.sncf.com  (Licence Ouverte / Open Licence 2.0)
//   2. Île-de-France Mobilités « Emplacement des gares IDF » — all RER stops
//      (`mode === "RER"`), including the RATP-operated RER A/B core that SNCF's
//      referential omits. https://data.iledefrance-mobilites.fr  (Licence Ouverte)
//
// The curated seed (stations.seed.json) is applied as an OVERLAY, not as
// first-row-wins rows: for a seed name that matches a fetched station we copy the
// seed's `city` / `country` label onto that station (so a bare city query like
// "Bordeaux" resolves to "Bordeaux Saint-Jean" and the city picker can list it),
// while the coordinates always come from the open data. Seed names with no match
// (London, Bruxelles, Beijing …) are emitted verbatim. A dedicated follow-up will
// derive the full "cities that actually have a station" set from SNCF `codeinsee`,
// replacing these hand-written labels.
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

async function fetchJson(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText} — ${url}`)
    return res.json()
}

// One row per distinct station; first writer wins (SNCF before RER).
const byName = new Map()
const order = []

function addStation(name, lat, lng) {
    const clean = (name || '').trim()
    if (!clean || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
    const key = keyOf(clean)
    const existing = byName.get(key)
    if (existing) return existing
    const row = { name: clean, city: null, country: COUNTRY, lat, lng }
    byName.set(key, row)
    order.push(row)
    return row
}

const sncf = await fetchJson(SNCF_URL)
for (const gare of sncf) {
    const pos = gare.position_geographique
    addStation(gare.nom, pos?.lat, pos?.lon)
}

const idfm = await fetchJson(IDFM_URL)
const rerRecords = idfm.filter((stop) => (stop.mode || '').toUpperCase() === 'RER')
for (const stop of rerRecords) {
    const pos = stop.geo_point_2d
    addStation(stop.nom_gares, pos?.lat, pos?.lon)
}

// Seed overlay: label matching stations with a city/country, emit the rest as-is.
// Labeled stations are emitted first so the major-city suggestions lead the picker.
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
        } else {
            const row = {
                name: entry.name,
                city: entry.city ?? null,
                country: entry.country ?? null,
                lat: entry.lat,
                lng: entry.lng,
            }
            byName.set(key, row)
            seedRows.push(row)
        }
    }
} catch {
    // No seed file — stations only.
}

const rows = [...seedRows, ...order.filter((row) => !claimed.has(row))]
writeFileSync(OUT, `${JSON.stringify(rows)}\n`)
console.log(
    `Wrote ${rows.length} rows to ${OUT} ` +
    `(SNCF ${sncf.length}, IDFM RER ${rerRecords.length}, seed-labeled ${seedRows.length})`,
)
