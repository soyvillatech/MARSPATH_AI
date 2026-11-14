import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, Database, Layers, Menu, Satellite, Settings, X } from 'lucide-react';
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
  return <div className="map-first-app">
    <MarsMap layer={basemap} planning={p} locate={locate}/>
    <div className="map-ui" aria-label="Controles de MarsPath AI">
      <div className="floating-brand"><div className="brand-mark"><Satellite size={18}/></div><span>MARSPATH <b>AI</b></span></div>
      <section className={`floating-card planner-card ${plannerOpen ? 'is-open' : 'is-collapsed'}`}>
        <button className="floating-card-header" onClick={() => setPlannerOpen(v => !v)} aria-expanded={plannerOpen}><span><Menu size={16}/> PLANIFICADOR</span><ChevronDown size={17}/></button>
        {plannerOpen && <div className="floating-card-body"><RoutePlanner p={p}/></div>}
      </section>
      <div className="map-actions"><button className="floating-icon" aria-label="Centrar mapa" title="Centrar mapa" onClick={() => setLocate(n => n + 1)}>◎</button><button className={`floating-icon ${layersOpen ? 'active' : ''}`} aria-label="Capas" title="Capas" onClick={() => setLayersOpen(v => !v)}><Layers size={18}/></button><button className="floating-icon" aria-label="Configuración" title="Configuración"><Settings size={18}/></button></div>
      {layersOpen && <section className="floating-card layers-popover"><div className="floating-card-header"><span><Layers size={16}/> CAPAS</span><button className="close-button" onClick={() => setLayersOpen(false)} aria-label="Cerrar capas"><X size={15}/></button></div><div className="floating-card-body layer-list">{(Object.keys(layers) as LayerKey[]).map(key=><LayerRow key={key} label={layers[key].label} detail={layers[key].resolution} color="orange" active={basemap===key} onClick={()=>setBasemap(key)}/>) }<LayerRow label="Pendientes" detail="Derivadas del DEM · 20 m" color="purple" active={p.overlay==='slope'} onClick={()=>p.setOverlay(p.overlay==='slope'?'none':'slope')}/><LayerRow label="Rugosidad topográfica" detail="Desviación local" color="yellow" active={p.overlay==='roughness'} onClick={()=>p.setOverlay(p.overlay==='roughness'?'none':'roughness')}/><LayerRow label="Riesgos potenciales" detail="Pendientes y relieve" color="red" active={p.overlay==='risk'} onClick={()=>p.setOverlay(p.overlay==='risk'?'none':'risk')}/><LayerRow label="Celdas restringidas" detail="NoData y pendiente máxima" color="red" active={p.overlay==='restricted'} onClick={()=>p.setOverlay(p.overlay==='restricted'?'none':'restricted')}/></div></section>}
      <section className={`floating-card results-card ${resultsOpen ? 'is-open' : 'is-collapsed'}`}><button className="floating-card-header" onClick={() => setResultsOpen(v => !v)} aria-expanded={resultsOpen}><span><Database size={16}/> RESULTADOS {p.routes.length ? `· ${p.routes.length}` : ''}</span><ChevronDown size={17}/></button>{resultsOpen && <div className="floating-card-body"><RouteResults p={p}/></div>}</section>
      <div className="map-attribution"><span className="status-dot"/> NASA MARS TREK · WMTS</div>
    </div>
  </div>;
}
function LayerRow({label,detail,color,active,onClick}:{label:string;detail:string;color:string;active:boolean;onClick:()=>void}) { return <button className="layer-row" onClick={onClick}><span className={`layer-swatch ${color}`}/><span className="layer-copy"><strong>{label}</strong><small>{detail}</small></span><span className={`toggle ${active?'on':''}`}><i/></span></button> }
createRoot(document.getElementById('root')!).render(<App />);
