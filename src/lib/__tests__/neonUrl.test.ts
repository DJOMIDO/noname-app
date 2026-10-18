import { describe, expect, it } from 'vitest'
import { normalizeNeonUrl } from '../neonUrl'

// Returns the derived base URL, or the rejection reason when the value cannot
// be used, so each case asserts exactly one of the two.
const normalize = (raw: string) => {
    const result = normalizeNeonUrl(raw)
    return result.ok ? result.baseUrl : result.reason
}

const BASE = 'https://ep-xxx.c-2.us-east-2.aws.neon.tech/neondb'

describe('normalizeNeonUrl', () => {
    it('accepts the database base URL as is', () => {
        expect(normalize(BASE)).toBe(BASE)
    })

    it('strips the apirest label and the rest/v1 suffix of a Data API URL', () => {
        expect(normalize('https://ep-xxx.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1')).toBe(BASE)
    })

    it('strips the neonauth label and the auth suffix of an Auth URL', () => {
        expect(normalize('https://ep-xxx.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth')).toBe(BASE)
    })

    it('drops the -pooler suffix from a pooled host', () => {
        expect(normalize('https://ep-xxx-pooler.c-2.us-east-2.aws.neon.tech/neondb')).toBe(BASE)
    })

    it('keeps a non-default port', () => {
        expect(normalize('https://ep-xxx.c-2.us-east-2.aws.neon.tech:4430/neondb'))
            .toBe('https://ep-xxx.c-2.us-east-2.aws.neon.tech:4430/neondb')
    })

    it('tolerates surrounding whitespace and trailing slashes', () => {
        expect(normalize(`  ${BASE}/  `)).toBe(BASE)
    })

    it('drops a query string, which the endpoint derivation rejects', () => {
        expect(normalize(`${BASE}?sslmode=require`)).toBe(BASE)
    })

    it('rejects empty values and example placeholders as missing', () => {
        expect(normalize('')).toBe('missing')
        expect(normalize('   ')).toBe('missing')
        expect(normalize('https://ep-your-endpoint.c-2.us-east-2.aws.neon.tech/neondb')).toBe('missing')
    })

    it('rejects connection strings and any URL that embeds credentials', () => {
        expect(normalize('postgresql://neondb_owner:pw@ep-xxx.c-2.us-east-2.aws.neon.tech/neondb'))
            .toBe('connection-string')
        expect(normalize('https://neondb_owner:pw@ep-xxx.c-2.us-east-2.aws.neon.tech/neondb'))
            .toBe('connection-string')
    })

    // Distinct from `invalid`: the URL parses fine, it just lacks the database
    // name the endpoints are derived from.
    it('reports a missing database name separately from an unparsable URL', () => {
        expect(normalize('https://ep-xxx.neonauth.c-2.us-east-2.aws.neon.tech/auth')).toBe('missing-database')
        expect(normalize('https://ep-xxx.c-2.us-east-2.aws.neon.tech/')).toBe('missing-database')
    })

    it('rejects values that are not an http(s) URL', () => {
        expect(normalize('ep-xxx.c-2.us-east-2.aws.neon.tech/neondb')).toBe('invalid')
        expect(normalize('ftp://ep-xxx.c-2.us-east-2.aws.neon.tech/neondb')).toBe('invalid')
    })
})
