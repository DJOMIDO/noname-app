import { describe, expect, it } from 'vitest'
import {
    normalizePlace,
    resolvePlace,
    resolvePlaces,
    searchCities,
    searchStations,
} from '../stationGazetteer'

describe('normalizePlace', () => {
    it('lower-cases, strips diacritics and collapses whitespace', () => {
        expect(normalizePlace('  München   Hbf ')).toBe('munchen hbf')
        expect(normalizePlace('Zürich HB')).toBe('zurich hb')
    })
})

describe('resolvePlace', () => {
    it('resolves a city name to the station point, not a city centroid', async () => {
        const place = await resolvePlace('Toulouse')
        expect(place).not.toBeNull()
        // The bundled row is the Matabiau station, so we get station coords.
        expect(place!.lat).toBeCloseTo(43.6112, 3)
        expect(place!.lng).toBeCloseTo(1.4536, 3)
        expect(place!.city).toBe('Toulouse')
        expect(place!.country).toBe('France')
    })

    it('ignores a leading "Gare de" prefix', async () => {
        const place = await resolvePlace('Gare de Carcassonne')
        expect(place!.city).toBe('Carcassonne')
        expect(place!.lat).toBeCloseTo(43.218, 3)
    })

    it('tolerates hyphen/space differences via the compact key', async () => {
        const place = await resolvePlace('Toulouse Matabiau')
        expect(place!.city).toBe('Toulouse')
    })

    it('tolerates missing diacritics in the query', async () => {
        const place = await resolvePlace('Zurich HB')
        expect(place!.city).toBe('Zurich')
    })

    it('matches a full station name by significant tokens, not the bare city', async () => {
        // A legacy/variant spelling ("Gare de Paris-Nord") differs in stop-words
        // and word order from the stored SNCF name "Paris Gare du Nord"; the
        // token-set tier must pick the Nord station, not degrade to "paris".
        const place = await resolvePlace('Gare de Paris-Nord')
        expect(place).not.toBeNull()
        expect(place!.city).toBe('Paris')
        expect(place!.name).toMatch(/Nord/)
    })

    it('expands "St" to "Saint" so abbreviated station names match', async () => {
        // "Paris St Lazare" must reach the stored "Paris Saint-Lazare",
        // not degrade to the bare city.
        const place = await resolvePlace('Paris St Lazare')
        expect(place).not.toBeNull()
        expect(place!.name).toMatch(/Saint-Lazare/)
    })

    it('derives a city for a French station beyond the hand-written seed', async () => {
        // Grenoble has no seed anchor; its city now comes from the SNCF codeinsee
        // -> commune join, so a bare city query resolves where it previously could
        // not (the seed only ever labelled ~16 cities).
        const place = await resolvePlace('Grenoble')
        expect(place).not.toBeNull()
        expect(place!.city).toBe('Grenoble')
        expect(place!.country).toBe('France')
    })

    it('resolves a bare city name to its central station, not a named sibling', async () => {
        // Regression guard: siblings sharing a derived city — "Dijon Porte Neuve",
        // "Pringy" (merged into Annecy), "Valence d'Agen" — must NOT steal the bare
        // city key. The eponymous central station (name === city) wins it, so a plain
        // city query lands on the city's own station rather than an arbitrary sibling.
        expect((await resolvePlace('Dijon'))!.name).toBe('Dijon')
        expect((await resolvePlace('Annecy'))!.name).toBe('Annecy')
        expect((await resolvePlace('Valence'))!.name).toBe('Valence')
    })

    it('labels a RATP-only RER stop via the reverse-geocode fallback', async () => {
        // Châtelet-Les Halles is RATP-operated and absent from SNCF, so IDFM ships
        // no INSEE code for it; the build reverse-geocodes its coordinates, so the
        // city is filled rather than left null.
        const place = await resolvePlace('Châtelet-Les Halles')
        expect(place).not.toBeNull()
        expect(place!.city).toBe('Paris')
    })

    it('returns null for an unknown name', async () => {
        expect(await resolvePlace('Nowhere-at-all')).toBeNull()
    })

    it('returns null for a blank query without touching the index', async () => {
        expect(await resolvePlace('   ')).toBeNull()
    })
})

describe('resolvePlaces', () => {
    it('keys results by the original query and de-duplicates repeats', async () => {
        const results = await resolvePlaces(['Caen', 'Caen', 'Annecy', 'Nowhere'])
        expect(results.get('Caen')).not.toBeNull()
        expect(results.get('Annecy')).not.toBeNull()
        expect(results.get('Nowhere')).toBeNull()
        expect(results.has('Caen')).toBe(true)
    })

    it('returns an empty map for no usable queries', async () => {
        const results = await resolvePlaces(['  ', ''])
        expect(results.size).toBe(0)
    })
})

describe('searchStations', () => {
    it('suggests canonical station names, filling the exact dataset name', async () => {
        const options = await searchStations('toulouse')
        const matabiau = options.find(o => o.value === 'Toulouse Matabiau')
        expect(matabiau).toBeDefined()
        // Label carries city + country so same-name stations are distinguishable.
        expect(matabiau!.label).toContain('Toulouse')
        expect(matabiau!.label).toContain('France')
    })

    it('matches on city and country, tolerating missing diacritics', async () => {
        const byCity = await searchStations('zurich')
        expect(byCity.length).toBeGreaterThan(0)
        const byCountry = await searchStations('france')
        expect(byCountry.length).toBeGreaterThan(0)
    })

    it('resolves a picked value to the same coordinates (exact-tier hit)', async () => {
        const [option] = await searchStations('toulouse')
        const place = await resolvePlace(option.value)
        expect(place).not.toBeNull()
        expect(place!.name).toBe(option.value)
    })

    it('caps results at the limit and returns nothing for a blank query', async () => {
        expect((await searchStations('gare', 5)).length).toBeLessThanOrEqual(5)
        expect(await searchStations('   ')).toEqual([])
    })
})

describe('searchCities', () => {
    it('suggests distinct cities with a country-qualified label', async () => {
        const options = await searchCities('toulouse')
        const toulouse = options.find(o => o.value === 'Toulouse')
        expect(toulouse).toBeDefined()
        expect(toulouse!.label).toBe('Toulouse · France')
    })

    it('lists a city present only via the derived commune set', async () => {
        // Grenoble is not a hand-written seed city; it is suggested now that every
        // French station carries its derived commune (~2500 cities, not ~16).
        const options = await searchCities('grenoble')
        expect(options.some(o => o.value === 'Grenoble')).toBe(true)
    })

    it('never repeats a city and returns nothing for a blank query', async () => {
        const options = await searchCities('a', 12)
        const values = options.map(o => o.value)
        expect(new Set(values).size).toBe(values.length)
        expect(await searchCities('')).toEqual([])
    })

    it('resolves a picked city to a station coordinate', async () => {
        const [option] = await searchCities('toulouse')
        const place = await resolvePlace(option.value)
        expect(place).not.toBeNull()
        expect(place!.city).toBe(option.value)
    })
})
