import { describe, expect, it } from 'vitest'
import { basemapLabelLayerIds } from '../mapLabels'

describe('basemapLabelLayerIds', () => {
    it('collects every basemap symbol layer', () => {
        const ids = basemapLabelLayerIds([
            { id: 'place_country', type: 'symbol' },
            { id: 'water_name', type: 'symbol' },
            { id: 'poi', type: 'symbol' },
            { id: 'transport_label', type: 'symbol' },
        ])
        expect(ids).toEqual(['place_country', 'water_name', 'poi', 'transport_label'])
    })

    it('never hides our own IATA airport labels', () => {
        const ids = basemapLabelLayerIds([
            { id: 'airport-label', type: 'symbol' },
            { id: 'place_city', type: 'symbol' },
        ])
        expect(ids).toEqual(['place_city'])
    })

    it('ignores non-symbol layers', () => {
        const ids = basemapLabelLayerIds([
            { id: 'boundary_country', type: 'line' },
            { id: 'route-line', type: 'line' },
            { id: 'airport-dot', type: 'circle' },
            { id: 'water', type: 'fill' },
        ])
        expect(ids).toEqual([])
    })

    it('tolerates layers without a type and empty styles', () => {
        expect(basemapLabelLayerIds([{ id: 'mystery' }])).toEqual([])
        expect(basemapLabelLayerIds([])).toEqual([])
    })
})
