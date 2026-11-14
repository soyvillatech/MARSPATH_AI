import { useEffect, useRef, useState } from 'react';
import { MapPin, Target } from 'lucide-react';
import { contains, layers, loadCapabilities, visibleTiles, type Bounds, type Capabilities, type LayerKey } from '../services/marsWmts';

import type { Planning } from '../features/planning';
import { marsPlaces } from '../data/places';

type Props = { layer: LayerKey; planning: Planning; locate: number };
export function MarsMap({ layer, planning: p, locate }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [size,setSize] = useState({width: 800,height: 500});
  const [center,setCenter] = useState([77.45,18.44]);
  const [zoom,setZoom] = useState(11);
  const [caps,setCaps] = useState<Partial<Record<LayerKey,Capabilities>>>({});
  const [errors,setErrors] = useState<Partial<Record<LayerKey,string>>>({});
  const [retry,setRetry] = useState(0);
  const [placePopup,setPlacePopup] = useState<string|null>(null);
  const [tileStates,setTileStates] = useState<Record<string,'ok'|'error'>>({});
  const drag = useRef<{x:number;y:number;center:number[];kind?:'origin'|'destination'} | null>(null);
  const hazardCanvas = useRef<HTMLCanvasElement>(null);
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
  const visiblePlaces = marsPlaces.filter(place => zoom >= place.minZoom && place.lon >= view[0] && place.lon <= view[2] && place.lat >= view[1] && place.lat <= view[3]);
  useEffect(() => {
    const coords=p.routes.find(r=>r.id===p.selected)?.geometry.coordinates;
    const box=coords?.length ? [Math.min(...coords.map(c=>c[0])),Math.min(...coords.map(c=>c[1])),Math.max(...coords.map(c=>c[0])),Math.max(...coords.map(c=>c[1]))] : p.metadata?.bounds;
    if(!box)return;
    setCenter([(box[0]+box[2])/2,(box[1]+box[3])/2]);
    const scale=Math.min(size.width/(box[2]-box[0]+0.005),size.height/(box[3]-box[1]+0.005))*0.75;
    setZoom(Math.max(1,Math.min(17,Math.floor(Math.log2(scale*360/512)))));
  },[p.focus,p.metadata]);
  useEffect(()=>{
    const canvas=hazardCanvas.current;if(!canvas)return;
    canvas.width=size.width;canvas.height=size.height;
    const ctx=canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);if(p.overlay==='none'||!p.hazards)return;
    for(const [west,south,east,north,slope,rough,relief,restricted] of p.hazards.cells){
      if(east<view[0]||west>view[2]||north<view[1]||south>view[3])continue;
      if(p.overlay==='restricted'&&!restricted)continue;
      const score=p.overlay==='roughness' ? (rough??0)*3 : p.overlay==='risk'?Math.max(slope??0,Math.abs(relief??0)*10):slope??0;
      ctx.fillStyle=slope===null?'#7c8592':p.overlay==='restricted'?'#ef4848':score<=5?'#48c980':score<=10?'#edcf4c':score<=15?'#f58a38':'#e34b4b';
      ctx.globalAlpha=p.overlay==='restricted'?0.6:0.36;
      ctx.fillRect((west-view[0])*ppd,(view[3]-north)*ppd,(east-west)*ppd+0.5,(north-south)*ppd+0.5);
    }
  },[p.hazards,p.overlay,center,zoom,size]);
  const eventCoordinate=(e:React.PointerEvent<HTMLDivElement>)=>{const box=e.currentTarget.getBoundingClientRect();return {lon:view[0]+(e.clientX-box.left)/ppd,lat:view[3]-(e.clientY-box.top)/ppd};};
  const zoomBy = (delta:number) => setZoom(z => Math.max(1,Math.min(caps[layer] ? caps[layer]!.matrices.length-1 : 17,z+delta)));
  return <div className="map-stage nasa-map" ref={container} onWheel={e => zoomBy(e.deltaY < 0 ? 1 : -1)}
    onPointerDown={e => { if ((e.target as Element).closest('button,select,a')) return; const marker=(e.target as Element).closest('[data-marker]'); drag.current={x:e.clientX,y:e.clientY,center,kind:marker?.getAttribute('data-marker') as 'origin'|'destination'|undefined}; e.currentTarget.setPointerCapture(e.pointerId); }}
    onPointerMove={e => { if(!drag.current||drag.current.kind) return; if(Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y)<4)return; setCenter([Math.max(-179,Math.min(179,drag.current.center[0]-(e.clientX-drag.current.x)/ppd)),Math.max(-89,Math.min(89,drag.current.center[1]+(e.clientY-drag.current.y)/ppd))]); }}
    onPointerUp={e => { const start=drag.current;drag.current=null;if(!start)return;const moved=Math.hypot(e.clientX-start.x,e.clientY-start.y)>=4;if(start.kind){if(moved)void p.choose(eventCoordinate(e),start.kind);else p.setMode(start.kind);}else if(!moved){void p.choose(eventCoordinate(e));} }} onPointerCancel={() => { drag.current=null; }}>
    <div className="nasa-tiles" aria-label={`Cartografía NASA: ${layers[effective].label}`}>
      {tiles.map(tile => <img key={`${retry}:${tile.url}`} src={tile.url} alt="" draggable={false} style={{position:'absolute',left:tile.left,top:tile.top,width:tile.width,height:tile.height}}
        onLoad={() => setTileStates(old => ({...old,[tile.url]:'ok'}))} onError={() => setTileStates(old => ({...old,[tile.url]:'error'}))} />)}
    </div>
    <canvas className="hazard-canvas" ref={hazardCanvas} aria-label="Indicadores topográficos derivados del DEM"/>
    <svg className="route-svg" viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Área de análisis y rutas calculadas">
      {p.metadata&&<polygon points={p.metadata.coverage.coordinates[0].map(([lon,lat])=>{const c=point(lon,lat);return `${c.left},${c.top}`;}).join(' ')} fill="none" stroke="#73d6d0" strokeWidth="2" strokeDasharray="6 4"/>}
      {[...p.routes].sort((a,b)=>Number(a.id===p.selected)-Number(b.id===p.selected)).map(r=><polyline key={r.id} points={r.geometry.coordinates.map(([lon,lat])=>{const c=point(lon,lat);return `${c.left},${c.top}`;}).join(' ')} fill="none" stroke={r.kind==='safe'?'#73d6d0':r.kind==='short'?'#ffe1a1':'#ff914c'} strokeWidth={r.id===p.selected?4:2} opacity={r.id===p.selected?1:0.65}/>) }
    </svg>
    {p.origin&&<div className={`marker origin draggable-marker ${p.mode==='origin'?'active':''}`} data-marker="origin" onPointerDown={()=>p.setMode('origin')} style={point(p.origin.lon,p.origin.lat)} title="Clic para activar y luego clic en el mapa, o arrastra para mover"><MapPin size={22}/><span>ORIGEN</span></div>}
    {p.origin&&p.routes.length>0&&<button className="origin-astronaut" style={point(p.origin.lon,p.origin.lat)} onPointerDown={e=>e.stopPropagation()} onClick={()=>p.centerRoute()} aria-label="Ver resultados de ruta"><img src="/assets/mars-astronaut.png" alt="Astronauta en el origen"/><span>Ver resultados</span></button>}
    {p.destination&&<div className={`marker target draggable-marker ${p.mode==='destination'?'active':''}`} data-marker="destination" onPointerDown={()=>p.setMode('destination')} style={point(p.destination.lon,p.destination.lat)} title="Clic para activar y luego clic en el mapa, o arrastra para mover"><Target size={22}/><span>DESTINO</span></div>}
    {visiblePlaces.map(place => { const position=point(place.lon,place.lat); return <div key={place.id} className="place-label-wrap" style={position}>
      <button className="place-label" type="button" onPointerDown={e=>e.stopPropagation()} onClick={()=>setPlacePopup(placePopup===place.id?null:place.id)} aria-label={`Ver información de ${place.name}`}><span className="place-label-dot"/>{place.name}</button>
      {placePopup===place.id&&<div className="place-popup" role="dialog"><button className="place-popup-close" onPointerDown={e=>e.stopPropagation()} onClick={()=>setPlacePopup(null)} aria-label="Cerrar">×</button><strong>{place.name}</strong><span>{place.type}</span><small>{place.lat.toFixed(2)}° N · {place.lon.toFixed(2)}° E</small>{place.source&&<small>Fuente: {place.source}</small>}</div>}
    </div>; })}
    <div className="map-label label-region">CRÁTER JEZERO <small>{layers[effective].label}</small></div>
    <div className="map-label label-north">N <span>↑</span></div>
    <div className="zoom-controls"><button aria-label="Acercar mapa" onClick={() => zoomBy(1)}>+</button><button aria-label="Alejar mapa" onClick={() => zoomBy(-1)}>−</button></div>
    <div className="nasa-status" role="status">{error || (!cap ? 'Consultando NASA…' : !tiles.length ? 'Región fuera de cobertura' : loaded < tiles.length ? `Cargando teselas NASA (${loaded}/${tiles.length})…` : 'Cartografía NASA cargada')}
      {effective !== layer && <span> · Respaldo: {layers[effective].label}</span>}
      {error && <button onClick={() => setRetry(r => r+1)}>Reintentar</button>}
    </div>
    <div className="map-legend"><div className="legend-title">ANÁLISIS DEM · 20 m</div><div>Borde cyan: área de análisis</div><div>{p.mode==='origin'?'Clic: seleccionar origen':p.mode==='destination'?'Clic: seleccionar destino':'Clic: inspeccionar terreno'}</div><div>Rutas calculadas: {p.routes.length}</div><div>{p.overlay==='slope'?'Pendiente: ≤5° · ≤10° · ≤15° · >15°':p.overlay==='roughness'?'Rugosidad: ≤1,67 · ≤3,33 · ≤5 · >5 m':p.overlay==='risk'?'Riesgo: máx(pendiente, |relieve| × 10)':p.overlay==='restricted'?'Rojo: restringido':'Capas de análisis ocultas'}</div><div>Verde · amarillo · naranja · rojo</div><div>Gris: análisis insuficiente</div></div>
    <div className="nasa-attribution"><a href="https://trek.nasa.gov/mars/" target="_blank" rel="noreferrer">NASA / JPL · Mars Trek</a> · {layers[effective].resolution} · {center[1].toFixed(4)}° N, {center[0].toFixed(4)}° E</div>
  </div>;
}
