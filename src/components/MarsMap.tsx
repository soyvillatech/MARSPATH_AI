import { useEffect, useRef, useState } from 'react';
import { MapPin, Target } from 'lucide-react';
import { contains, layers, loadCapabilities, visibleTiles, type Bounds, type Capabilities, type LayerKey } from '../services/marsWmts';

type Props = { layer: LayerKey; routeType: string; showScience: boolean; showHazards: boolean; locate: number };
const route = 'M16 72 C 23 67, 22 56, 31 54 S 40 52, 43 44 S 48 33, 58 38 S 68 58, 82 30';
// Anchor the existing illustrative geometry to the two coordinates already displayed in the mission panel.
// Interior vertices, science points and hazards remain illustrative, NOT surveyed positions.
const demoCoordinate = (x: number,y: number) => [77.521 + (x-16)*(77.489-77.521)/66, 18.444+(y-72)*(18.462-18.444)/-42];
const science = [[28,39],[63,27],[75,63],[44,72]];

export function MarsMap({ layer, routeType, showScience, showHazards, locate }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [size,setSize] = useState({width: 800,height: 500});
  const [center,setCenter] = useState([77.45,18.44]);
  const [zoom,setZoom] = useState(11);
  const [caps,setCaps] = useState<Partial<Record<LayerKey,Capabilities>>>({});
  const [errors,setErrors] = useState<Partial<Record<LayerKey,string>>>({});
  const [retry,setRetry] = useState(0);
  const [tileStates,setTileStates] = useState<Record<string,'ok'|'error'>>({});
  const drag = useRef<{x:number;y:number;center:number[]} | null>(null);
  useEffect(() => { setCenter([77.45,18.44]); setZoom(11); }, [locate]);
  useEffect(() => {
    const observer = new ResizeObserver(entries => { const {width,height} = entries[0].contentRect; setSize({width,height}); });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    let active = true;
    setErrors({}); setCaps({}); setTileStates({});
    for (const key of Object.keys(layers) as LayerKey[]) {
      loadCapabilities(key,controller.signal).then(cap => { if(active) setCaps(old => ({...old,[key]:cap})); })
        .catch(() => { if(active) setErrors(old => ({...old,[key]:'No se pudo cargar la cartografía NASA para esta región'})); });
    }
    return () => { active=false; clearTimeout(timeout); controller.abort(); };
  }, [retry]);
  const ppd = 512*2**zoom/360;
  const view: Bounds = [center[0]-size.width/ppd/2,center[1]-size.height/ppd/2,center[0]+size.width/ppd/2,center[1]+size.height/ppd/2];
  let effective = layer;
  // Select exactly one background, covering the entire viewport where possible.
  if (caps[layer] && !contains(caps[layer]!.bounds, view)) {
    effective = layer === 'hirise' && caps.ctx && contains(caps.ctx.bounds,view) ? 'ctx' : 'mola';
  }
  const cap = caps[effective];
  const tiles = cap ? visibleTiles(cap,view,ppd) : [];
  const loaded = tiles.filter(t => tileStates[t.url] === 'ok').length;
  const failed = tiles.filter(t => tileStates[t.url] === 'error').length;
  const error = errors[effective] || (failed ? 'No se pudo cargar la cartografía NASA para esta región (teselas incompletas)' : '');
  const point = (lon:number,lat:number) => ({left:(lon-view[0])*ppd,top:(view[3]-lat)*ppd});
  const a = point(...demoCoordinate(0,0) as [number,number]);
  const b = point(...demoCoordinate(100,100) as [number,number]);
  const zoomBy = (delta:number) => setZoom(z => Math.max(1,Math.min(caps[layer] ? caps[layer]!.matrices.length-1 : 17,z+delta)));
  return <div className="map-stage nasa-map" ref={container} onWheel={e => zoomBy(e.deltaY < 0 ? 1 : -1)}
    onPointerDown={e => { if ((e.target as HTMLElement).closest('button,select,a')) return; drag.current={x:e.clientX,y:e.clientY,center}; e.currentTarget.setPointerCapture(e.pointerId); }}
    onPointerMove={e => { if(!drag.current) return; setCenter([Math.max(-179,Math.min(179,drag.current.center[0]-(e.clientX-drag.current.x)/ppd)),Math.max(-89,Math.min(89,drag.current.center[1]+(e.clientY-drag.current.y)/ppd))]); }}
    onPointerUp={() => { drag.current=null; }} onPointerCancel={() => { drag.current=null; }}>
    <div className="nasa-tiles" aria-label={`Cartografía NASA: ${layers[effective].label}`}>
      {tiles.map(tile => <img key={`${retry}:${tile.url}`} src={tile.url} alt="" draggable={false} style={{position:'absolute',left:tile.left,top:tile.top,width:tile.width,height:tile.height}}
        onLoad={() => setTileStates(old => ({...old,[tile.url]:'ok'}))} onError={() => setTileStates(old => ({...old,[tile.url]:'error'}))} />)}
    </div>
    <svg className="route-svg" viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Ruta ilustrativa, sin cálculo topográfico">
      <g transform={`translate(${a.left} ${a.top}) scale(${(b.left-a.left)/100} ${(b.top-a.top)/100})`}>
        <path d={route} stroke="#ff914c" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
        <path d={route} stroke="#ffe2bd" strokeWidth="1" strokeDasharray="5 7" vectorEffect="non-scaling-stroke"/>
        {showHazards && <g fill="#ff4e4533" stroke="#ff4e45" strokeWidth="1" strokeDasharray="4 4"><rect x="45" y="18" width="15" height="13" vectorEffect="non-scaling-stroke"/><rect x="30" y="76" width="20" height="10" vectorEffect="non-scaling-stroke"/></g>}
      </g>
    </svg>
    <div className="marker origin" style={point(77.521,18.444)}><MapPin size={22}/><span>ORIGEN</span></div>
    <div className="marker target" style={point(77.489,18.462)}><Target size={22}/><span>DESTINO</span></div>
    {showScience && science.map(([x,y],i) => <div key={i} className="science-marker" style={point(...demoCoordinate(x,y) as [number,number])} title="Punto científico de demostración; ubicación no verificada">✦</div>)}
    <div className="map-label label-region">CRÁTER JEZERO <small>{layers[effective].label}</small></div>
    <div className="map-label label-north">N <span>↑</span></div>
    <div className="zoom-controls"><button aria-label="Acercar mapa" onClick={() => zoomBy(1)}>+</button><button aria-label="Alejar mapa" onClick={() => zoomBy(-1)}>−</button></div>
    <div className="nasa-status" role="status">{error || (!cap ? 'Consultando NASA…' : !tiles.length ? 'Región fuera de cobertura' : loaded < tiles.length ? `Cargando teselas NASA (${loaded}/${tiles.length})…` : 'Cartografía NASA cargada')}
      {effective !== layer && <span> · Respaldo: {layers[effective].label}</span>}
      {error && <button onClick={() => setRetry(r => r+1)}>Reintentar</button>}
    </div>
    <div className="map-legend"><div className="legend-title">SUPERPOSICIONES SIMULADAS</div><div>{routeType}</div><div>Puntos científicos: {showScience ? '04' : '00'}</div><div>Zonas de peligro: {showHazards ? '02' : '00'}</div></div>
    <div className="nasa-attribution"><a href="https://trek.nasa.gov/mars/" target="_blank" rel="noreferrer">NASA / JPL · Mars Trek</a> · {layers[effective].resolution} · {center[1].toFixed(4)}° N, {center[0].toFixed(4)}° E</div>
  </div>;
}
