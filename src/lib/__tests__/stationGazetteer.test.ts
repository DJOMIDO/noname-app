import { describe, expect, it } from 'vitest'
import { normalizePlace, resolvePlace, resolvePlaces } from '../stationGazetteer'

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
        expect(place!.lat).toBeCloseTo(43.611, 3)
        expect(place!.lng).toBeCloseTo(1.4528, 3)
        expect(place!.city).toBe('Toulouse')
        expect(place!.country).toBe('France')
    })

    it('ignores a leading "Gare de" prefix', async () => {
        const place = await resolvePlace('Gare de Carcassonne')
        expect(place!.city).toBe('Carcassonne')
        expect(place!.lat).toBeCloseTo(43.2098, 3)
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
        // Stop-words and word order differ from the stored "Gare de Paris-Nord";
        // the token-set tier must pick the Nord station, not degrade to "paris"
        // (which the curated Gare de Lyon owns) and collapse every Paris stop.
        const place = await resolvePlace('Paris Gare du Nord')
        expect(place).not.toBeNull()
        expect(place!.city).toBe('Paris')
        expect(place!.name).toMatch(/Nord/)
    })

    it('expands "St" to "Saint" so abbreviated station names match', async () => {
        // "Paris St Lazare" must reach the stored "Gare de Paris-Saint-Lazare",
        // not degrade to the bare city (which the curated Gare de Lyon owns).
        const place = await resolvePlace('Paris St Lazare')
        expect(place).not.toBeNull()
        expect(place!.name).toMatch(/Saint-Lazare/)
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
