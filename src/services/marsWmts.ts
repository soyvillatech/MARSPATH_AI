export const layers = {
  hirise: { id: 'JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd', label: 'HiRISE — Alta resolución', resolution: '25 cm/píxel nominales' },
  ctx: { id: 'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0', label: 'CTX — Vista regional', resolution: '6 m/píxel nominales' },
  mola: { id: 'Mars_MGS_MOLA_ClrShade_merge_global_463m', label: 'MOLA — Relieve global', resolution: '463 m/píxel nominales; relieve visual' },
};
export type LayerKey = keyof typeof layers;
export type Bounds = [number, number, number, number];
export type Matrix = { id: string; width: number; height: number; tileWidth: number; tileHeight: number; origin: number[]; scale: number; limits?: number[] };
export type Capabilities = { template: string; style: string; set: string; bounds: Bounds; matrices: Matrix[] };
export const capabilitiesUrl = (key: LayerKey) => `https://trek.nasa.gov/tiles/Mars/EQ/${layers[key].id}/1.0.0/WMTSCapabilities.xml`;
const elements = (node: Element | Document, name: string) => Array.from(node.getElementsByTagNameNS('*', name));
const value = (node: Element, name: string) => elements(node, name)[0]?.textContent?.trim() ?? '';
const numbers = (text: string) => text.split(/\s+/).map(Number);

export function parseCapabilities(xml: string): Capabilities {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (elements(doc, 'parsererror').length) throw Error('GetCapabilities inválido');
  const layer = elements(doc, 'Layer')[0];
  if (!layer) throw Error('Falta la capa WMTS');
  const link = elements(layer, 'TileMatrixSetLink')[0];
  const setId = value(link, 'TileMatrixSet');
  const set = elements(doc, 'TileMatrixSet').find(el => value(el, 'Identifier') === setId);
  // NASA EQ declares longitude/latitude in degrees, not terrestrial Web Mercator.
  if (!set || value(set, 'SupportedCRS') !== 'urn:ogc:def:crs:EPSG::104905') throw Error('Proyección WMTS no compatible');
  const resource = elements(layer, 'ResourceURL').find(el => el.getAttribute('resourceType') === 'tile');
  const template = resource?.getAttribute('template') ?? '';
  if (!template.startsWith('https://trek.nasa.gov/tiles/')) throw Error('Endpoint NASA inválido');
  const box = elements(layer, 'BoundingBox')[0] ?? elements(layer, 'WGS84BoundingBox')[0];
  const bounds = [...numbers(value(box, 'LowerCorner')), ...numbers(value(box, 'UpperCorner'))] as Bounds;
  if (bounds.length !== 4 || !bounds.every(Number.isFinite)) throw Error('Cobertura inválida');
  const matrices = elements(set, 'TileMatrix').map(el => {
    const id = value(el, 'Identifier');
    const limits = elements(link, 'TileMatrixLimits').find(l => value(l, 'TileMatrix') === id);
    return { id, width: Number(value(el, 'MatrixWidth')), height: Number(value(el, 'MatrixHeight')),
      tileWidth: Number(value(el, 'TileWidth')), tileHeight: Number(value(el, 'TileHeight')),
      scale: Number(value(el, 'ScaleDenominator')), origin: numbers(value(el, 'TopLeftCorner')),
      limits: limits ? ['MinTileRow', 'MaxTileRow', 'MinTileCol', 'MaxTileCol'].map(k => Number(value(limits, k))) : undefined };
  }).sort((a,b) => b.scale - a.scale);
  // Explicitly support the verified global EQ matrix geometry only. Fail closed if NASA changes it.
  if (!matrices.length || matrices.some(m => m.origin[0] !== -180 || m.origin[1] !== 90 || m.width !== 2*m.height || m.tileWidth !== m.tileHeight || !Number.isInteger(m.height) || m.height < 1 || !(m.scale > 0) || !(m.tileWidth > 0))) throw Error('Geometría de matrices no compatible');
  const style = elements(layer, 'Style').find(el => el.getAttribute('isDefault') === 'true') ?? elements(layer, 'Style')[0];
  return { template, style: value(style, 'Identifier'), set: setId, bounds, matrices };
}

export async function loadCapabilities(key: LayerKey, signal: AbortSignal) {
  const response = await fetch(capabilitiesUrl(key), { signal });
  if (!response.ok) throw Error(`NASA HTTP ${response.status}`);
  return parseCapabilities(await response.text());
}
export const contains = (outer: Bounds, inner: Bounds) => outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3];
export function visibleTiles(cap: Capabilities, view: Bounds, pixelsPerDegree: number) {
  const m = cap.matrices.reduce((best, item) => Math.abs(Math.log2(item.width*item.tileWidth/360/pixelsPerDegree)) < Math.abs(Math.log2(best.width*best.tileWidth/360/pixelsPerDegree)) ? item : best);
  const dx = 360/m.width, dy = 180/m.height;
  const west = Math.max(view[0], cap.bounds[0]), east = Math.min(view[2], cap.bounds[2]);
  const south = Math.max(view[1], cap.bounds[1]), north = Math.min(view[3], cap.bounds[3]);
  if (west >= east || south >= north) return [];
  const [r0,r1,c0,c1] = m.limits ?? [0,m.height-1,0,m.width-1];
  const tiles = [];
  for (let row = Math.max(r0, Math.floor((90-north)/dy)); row <= Math.min(r1, Math.ceil((90-south)/dy)-1); row++) {
    for (let col = Math.max(c0, Math.floor((west+180)/dx)); col <= Math.min(c1, Math.ceil((east+180)/dx)-1); col++) {
      const params: Record<string,string> = { Style: cap.style, TileMatrixSet: cap.set, TileMatrix: m.id, TileRow: String(row), TileCol: String(col) };
      tiles.push({ url: cap.template.replace(/\{(\w+)\}/g, (_, key: string) => params[key]), left: (-180+col*dx-view[0])*pixelsPerDegree, top: (view[3]-90+row*dy)*pixelsPerDegree, width: dx*pixelsPerDegree, height: dy*pixelsPerDegree });
    }
  }
  return tiles;
}
