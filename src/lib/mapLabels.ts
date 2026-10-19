/**
 * Basemap label layer filtering for the route map.
 *
 * OpenFreeMap spreads place names over dozens of symbol layers (`place_*`,
 * `water_name_*`, `poi_*`, transport shields…) and the exact ids differ
 * between the positron and dark styles. Instead of keeping a per-style
 * whitelist, every basemap `symbol` layer counts as a label — except the
 * layers we add ourselves: the IATA codes are our own data annotation, not
 * basemap place names, so the toggle must never hide them.
 */

/** Minimal shape of a MapLibre style layer: only what the filter needs. */
export interface StyleLayerLike {
    id: string
    type?: string
}

/** Symbol layers owned by the route map, excluded from label toggling. */
const OWN_SYMBOL_LAYERS = ['airport-label']

/** Ids of all basemap text layers in the given style, in paint order. */
export function basemapLabelLayerIds(layers: StyleLayerLike[]): string[] {
    return layers
        .filter(layer => layer.type === 'symbol' && !OWN_SYMBOL_LAYERS.includes(layer.id))
        .map(layer => layer.id)
}
