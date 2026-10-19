// scripts/build-stations.mjs
// One-time importer that regenerates src/assets/data/stations.json from GeoNames
// country extracts, so the offline train gazetteer can cover every station
// instead of only the curated seed.
//
// Usage — the feature dump (19 columns, railway stations + cities) is the best
// source; fetch whichever countries you need, then pass the unzipped .txt files:
//   curl -o /tmp/FR-dump.zip https://download.geonames.org/export/dump/FR.zip
//   unzip -o /tmp/FR-dump.zip -d /tmp/geonames-dump
//   node scripts/build-stations.mjs /tmp/geonames-dump/FR.txt [more.txt ...]
//
// The curated hand-checked stations live in stations.seed.json and are always
// kept first (they win the gazetteer's first-row-wins lookup). This script
// regenerates stations.json = seed + GeoNames rows, pruned to stay small:
//   - ALL railway stations (feature code RSTN) at their exact station
//     coordinates, city left null so a station-name query pins to the station;
//   - populated places (feature class P) with population >= MIN_CITY_POPULATION
//     as city fallbacks, so a bare city query still resolves and pools by city.
// Postal-code extracts (/export/zip/, 12 columns) carry no population and no
// stations, so under the prune threshold they contribute nothing — use the
// feature dump (/export/dump/) for real coverage.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(DIR, '../src/assets/data/stations.json')
const SEED = path.resolve(DIR, '../src/assets/data/stations.seed.json')
const MIN_CITY_POPULATION = 5000

const rows = []
const seenStation = new Set()
// City-level rows collide across same-named communes (e.g. two "Valence" —
// Drôme in the southeast and Charente in the west). Keep the most populated one
// so a bare city name resolves to the dominant place, not an arbitrary row.
const cityPos = new Map() // normalized city name -> index in rows
const cityPop = new Map() // normalized city name -> population used to pick

const cityKey = (name) =>
    name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

function pushStation(name, city, country, lat, lng) {
    const key = `${name}|${lat}|${lng}`
    if (!name || seenStation.has(key)) return
    seenStation.add(key)
    rows.push({ name, city, country, lat, lng })
}

function pushCity(name, country, lat, lng, population) {
    // Prune: only keep city fallbacks at or above the population threshold. This
    // drops postal rows (population 0) and tiny localities, keeping the bundle
    // small; train endpoints are stations (RSTN), which are always kept.
    if (!name || population < MIN_CITY_POPULATION) return
    const key = cityKey(name)
    const existing = cityPos.get(key)
    if (existing === undefined) {
        cityPos.set(key, rows.length)
        cityPop.set(key, population)
        rows.push({ name, city: name, country, lat, lng })
        return
    }
    if (population > (cityPop.get(key) ?? 0)) {
        cityPop.set(key, population)
        rows[existing] = { name, city: name, country, lat, lng }
    }
}

// Keep the curated seed first so its hand-checked coordinates and city labels win
// the first-row-wins lookup; GeoNames rows only fill the gaps. The seed is read
// from its own file (not the generated output) so regeneration stays idempotent.
try {
    for (const row of JSON.parse(readFileSync(SEED, 'utf8'))) {
        pushStation(row.name, row.city ?? null, row.country ?? null, row.lat, row.lng)
    }
} catch {
    // No seed file yet — start empty.
}

for (const file of process.argv.slice(2)) {
    const text = readFileSync(file, 'utf8')
    for (const line of text.split('\n')) {
        if (!line.trim()) continue
        const c = line.split('\t')
        // GeoNames ships two layouts. The 12-column postal file (from
        // /export/zip/) has placeName + coords but no feature codes; use it as a
        // city-level fallback. The 19-column feature dump (from /export/dump/)
        // carries RSTN stations and PPL cities.
        if (c.length === 12) {
            const place = (c[2] || '').trim()
            const pLat = Number(c[9])
            const pLng = Number(c[10])
            if (place && Number.isFinite(pLat) && Number.isFinite(pLng)) {
                pushCity(place, (c[0] || '').trim(), pLat, pLng, 0)
            }
            continue
        }
        const name = (c[1] || '').trim()
        const lat = Number(c[4])
        const lng = Number(c[5])
        const featureCode = (c[7] || '').trim()
        const featureClass = (c[6] || '').trim()
        const country = (c[8] || '').trim()
        const population = Number(c[14] || 0)
        if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue

        if (featureCode === 'RSTN') {
            pushStation(name, null, country, lat, lng)
        } else if (featureClass === 'P' && population >= MIN_CITY_POPULATION) {
            pushCity(name, country, lat, lng, population)
        }
    }
}

writeFileSync(OUT, `${JSON.stringify(rows)}\n`)
console.log(`Wrote ${rows.length} rows to ${OUT}`)
