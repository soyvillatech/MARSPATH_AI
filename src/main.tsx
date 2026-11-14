import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, Database, Download, Info, Layers, Menu, Satellite, Settings, Trash2, X } from 'lucide-react';
import './styles.css';


import './real-data.css';
import { usePlanning } from './features/planning';
import { RoutePlanner, RouteResults } from './components/RoutePlanner';
import { MarsMap } from './components/MarsMap';
import { layers, type LayerKey } from './services/marsWmts';

function App() {
  const p = usePlanning();
  const [basemap, setBasemap] = useState<LayerKey>('hirise');
  const [locate, setLocate] = useState(0);
  const [plannerOpen, setPlannerOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const selectedRoute = p.routes.find(route => route.id === p.selected);
  const exportRoute = () => { if (!selectedRoute) return; const blob = new Blob([JSON.stringify({ type:'Feature', properties:{ id:selectedRoute.id, kind:selectedRoute.kind, metrics:selectedRoute.metrics }, geometry:selectedRoute.geometry }, null, 2)], {type:'application/geo+json'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=`marspath-${selectedRoute.id}.geojson`; link.click(); URL.revokeObjectURL(url); };
  return <div className="map-first-app">
    <MarsMap layer={basemap} planning={p} locate={locate}/>
    <div className="map-ui" aria-label="MarsPath AI controls">
      <div className="floating-brand"><div className="brand-mark"><Satellite size={18}/></div><span>MARSPATH <b>AI</b></span></div>
      <section className={`floating-card planner-card ${plannerOpen ? 'is-open' : 'is-collapsed'}`}>
        <button className="floating-card-header" onClick={() => setPlannerOpen(v => !v)} aria-expanded={plannerOpen}><span><Menu size={16}/> ROUTE PLANNER</span><ChevronDown size={17}/></button>
        {plannerOpen && <div className="floating-card-body"><RoutePlanner p={p}/><div className="planner-tools"><button className="secondary-tool" onClick={p.resetPlanning}><Trash2 size={14}/> Clear</button>{selectedRoute&&<><button className="secondary-tool" onClick={()=>setDetailsOpen(true)}><Info size={14}/> Details</button><button className="secondary-tool" onClick={exportRoute}><Download size={14}/> GeoJSON</button></>}</div></div>}
      </section>
      <div className="map-actions"><button className="floating-icon" aria-label="Centrar mapa" title="Centrar mapa" onClick={() => setLocate(n => n + 1)}>◎</button><button className={`floating-icon ${layersOpen ? 'active' : ''}`} aria-label="Capas" title="Capas" onClick={() => setLayersOpen(v => !v)}><Layers size={18}/></button><button className="floating-icon" aria-label="Configuración" title="Configuración"><Settings size={18}/></button></div>
      {layersOpen && <section className="floating-card layers-popover"><div className="floating-card-header"><span><Layers size={16}/> CAPAS</span><button className="close-button" onClick={() => setLayersOpen(false)} aria-label="Cerrar capas"><X size={15}/></button></div><div className="floating-card-body layer-list">{(Object.keys(layers) as LayerKey[]).map(key=><LayerRow key={key} label={layers[key].label} detail={layers[key].resolution} color="orange" active={basemap===key} onClick={()=>setBasemap(key)}/>) }<LayerRow label="Pendientes" detail="Derivadas del DEM · 20 m" color="purple" active={p.overlay==='slope'} onClick={()=>p.setOverlay(p.overlay==='slope'?'none':'slope')}/><LayerRow label="Rugosidad topográfica" detail="Desviación local" color="yellow" active={p.overlay==='roughness'} onClick={()=>p.setOverlay(p.overlay==='roughness'?'none':'roughness')}/><LayerRow label="Riesgos potenciales" detail="Pendientes y relieve" color="red" active={p.overlay==='risk'} onClick={()=>p.setOverlay(p.overlay==='risk'?'none':'risk')}/><LayerRow label="Celdas restringidas" detail="NoData y pendiente máxima" color="red" active={p.overlay==='restricted'} onClick={()=>p.setOverlay(p.overlay==='restricted'?'none':'restricted')}/></div></section>}
      {p.routes.length > 0 && <section className={`floating-card results-card ${resultsOpen ? 'is-open' : 'is-collapsed'}`}><button className="floating-card-header" onClick={() => setResultsOpen(v => !v)} aria-expanded={resultsOpen}><span><Database size={16}/> RESULTADOS · {p.routes.length}</span><ChevronDown size={17}/></button>{resultsOpen && <div className="floating-card-body"><RouteResults p={p}/></div>}</section>}
      {detailsOpen && selectedRoute && <div className="details-modal-backdrop" onClick={()=>setDetailsOpen(false)}><section className="details-modal" role="dialog" aria-modal="true" aria-label="Detalles de ruta" onClick={e=>e.stopPropagation()}><button className="close-button details-close" onClick={()=>setDetailsOpen(false)} aria-label="Cerrar"><X size={18}/></button><div className="section-title"><Info size={16}/> DETALLES DE RUTA</div><h2>{selectedRoute.kind === 'safe' ? 'Ruta segura' : selectedRoute.kind === 'short' ? 'Ruta más corta' : 'Ruta equilibrada'}</h2><p>{selectedRoute.explanation}</p><dl className="details-grid"><dt>Distancia</dt><dd>{selectedRoute.metrics.distance_m.toFixed(1)} m</dd><dt>Pendiente máxima</dt><dd>{selectedRoute.metrics.max_slope_deg.toFixed(2)}°</dd><dt>Pendiente media</dt><dd>{selectedRoute.metrics.mean_slope_deg.toFixed(2)}°</dd><dt>Riesgo &gt;10°</dt><dd>{selectedRoute.metrics.high_risk_percent.toFixed(1)} %</dd><dt>Ascenso / descenso</dt><dd>+{selectedRoute.metrics.ascent_m.toFixed(1)} / −{selectedRoute.metrics.descent_m.toFixed(1)} m</dd></dl><button className="calculate-btn" onClick={()=>{setDetailsOpen(false);p.centerRoute();}}>Centrar ruta</button></section></div>}
      <div className="map-attribution"><span className="status-dot"/> NASA MARS TREK · WMTS</div>
    </div>
  </div>;
}
function LayerRow({label,detail,color,active,onClick}:{label:string;detail:string;color:string;active:boolean;onClick:()=>void}) { return <button className="layer-row" onClick={onClick}><span className={`layer-swatch ${color}`}/><span className="layer-copy"><strong>{label}</strong><small>{detail}</small></span><span className={`toggle ${active?'on':''}`}><i/></span></button> }
createRoot(document.getElementById('root')!).render(<App />);
