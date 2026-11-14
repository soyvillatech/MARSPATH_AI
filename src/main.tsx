import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertTriangle, BarChart3, ChevronDown, Circle, Compass, Crosshair, Database, Download, FlaskConical, Gauge, Layers, MapPin, Navigation, PanelRight, Play, Route, Satellite, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Target, Timer, Triangle, Wifi, Wind, Zap } from 'lucide-react';
import './styles.css';
import './real-data.css';
import { scientificSources } from './data/scientificSources';

import { usePlanning } from './features/planning';
import { RoutePlanner, RouteResults } from './components/RoutePlanner';
import { MarsMap } from './components/MarsMap';
import { layers, type LayerKey } from './services/marsWmts';

function App() {
  const p = usePlanning();
  const [basemap, setBasemap] = useState<LayerKey>('hirise');
  const [locate, setLocate] = useState(0);
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Satellite size={20}/></div><div><div className="brand-name">MARSPATH <span>AI</span></div><div className="brand-sub">SISTEMA DE EXPLORACIÓN INTELIGENTE</div></div></div>
      <div className="mission-status"><span className="status-dot"/> CONTROL DE MISIÓN <span className="status-divider"/> <Wifi size={14}/> DATOS DE MISIONES</div>
      <div className="top-actions"><button className="icon-button"><Settings size={18}/></button><div className="avatar">MP</div></div>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <div className="side-label">MÓDULOS DE MISIÓN</div>
        <nav>
          <button className="nav-item active"><Compass size={17}/> Explorador marciano <span className="nav-chevron">›</span></button>
          <button className="nav-item"><Gauge size={17}/> Análisis del terreno</button><button className="nav-item"><AlertTriangle size={17}/> Análisis de peligros</button>
          <button className="nav-item"><FlaskConical size={17}/> Explorador científico</button><button className="nav-item"><Route size={17}/> Motor de rutas inteligentes</button><button className="nav-item"><BarChart3 size={17}/> Panel de misión</button>
        </nav>
        <div className="sidebar-divider"/><div className="side-label">MISIÓN ACTIVA</div>
        <div className="mission-card"><div className="mission-card-title"><span className="tiny-dot"/> ESTUDIO DE JEZERO / 01</div><div className="mission-card-region">Cráter Jezero, Marte</div><div className="mission-card-row"><span>TIEMPO DE MISIÓN</span><strong>00:42:18</strong></div><div className="mission-progress"><span/></div><div className="mission-card-row dim"><span>MODO SIMULACIÓN</span><span className="pill">ACTIVO</span></div></div>
        <div className="sidebar-footer"><div><span className="status-dot"/> SISTEMAS NOMINALES</div><small>DEM CTX • RESOLUCIÓN 20 m</small></div>
      </aside>
      <main className="main-content">
        <div className="page-heading"><div><div className="eyebrow">EXPLORACIÓN / CRÁTER JEZERO</div><h1>Explorador marciano <span className="live-tag">● PLANIFICACIÓN</span></h1><p>Cartografía interactiva y planificación de misión</p></div><button className="outline-btn"><Download size={15}/> Exportar informe de misión</button></div>
        <section className="map-panel">
          <div className="map-toolbar"><div className="toolbar-group"><select className="map-tool nasa-layer-select" aria-label="Mapa base NASA" value={basemap} onChange={e=>setBasemap(e.target.value as LayerKey)}>{(Object.keys(layers) as LayerKey[]).map(key=><option key={key} value={key}>{layers[key].label}</option>)}</select><button className="map-tool" onClick={() => setLocate(n => n+1)}><Crosshair size={16}/> Localizar</button></div><div className="map-coordinates">18.44° N &nbsp; • &nbsp; 77.45° E &nbsp; <span>CRÁTER JEZERO</span></div><div className="toolbar-group"><button className="map-tool">2D</button><button className="map-tool muted">3D <small>BETA</small></button></div></div>
          <MarsMap layer={basemap} planning={p} locate={locate}/>
          <div className="map-footer"><div className="data-source"><Database size={14}/><span>MAPA BASE: <strong>NASA MARS TREK</strong></span><span className="footer-sep">|</span><span>PRODUCTO: <strong>WMTS</strong></span></div><div className="map-quality"><span className="status-dot"/> IMÁGENES ORBITALES <strong>NASA</strong></div></div>
        </section>
      </main>
      <aside className="right-panel">
        <div className="panel-tabs"><button className="tab active">PLAN DE MISIÓN</button><button className="tab">CAPAS</button></div>
        <div className="panel-scroll"><RoutePlanner p={p}/>
        <section className="panel-section"><div className="section-title"><Layers size={16}/> CAPAS CIENTÍFICAS</div>{(Object.keys(layers) as LayerKey[]).map(key=><LayerRow key={key} label={layers[key].label} detail={layers[key].resolution} color="orange" active={basemap===key} onClick={()=>setBasemap(key)}/>)}
        <LayerRow label="Pendientes" detail="Derivadas del DEM · 20 m" color="purple" active={p.overlay==='slope'} onClick={()=>p.setOverlay(p.overlay==='slope'?'none':'slope')}/>
        <LayerRow label="Rugosidad topográfica" detail="Desviación de altura en 3 × 3 celdas" color="yellow" active={p.overlay==='roughness'} onClick={()=>p.setOverlay(p.overlay==='roughness'?'none':'roughness')}/>
        <LayerRow label="Riesgos potenciales" detail="Pendientes y cambios locales de relieve" color="red" active={p.overlay==='risk'} onClick={()=>p.setOverlay(p.overlay==='risk'?'none':'risk')}/>
        <LayerRow label="Celdas restringidas" detail="NoData, borde de análisis y pendiente máxima" color="red" active={p.overlay==='restricted'} onClick={()=>p.setOverlay(p.overlay==='restricted'?'none':'restricted')}/>
        <p className="planner-message">Geología y puntos científicos: sin producto georreferenciado integrado.</p></section>
        <RouteResults p={p}/>
        <section className="provenance"><div className="provenance-title"><Database size={15}/> PROCEDENCIA DE DATOS</div><p>Imágenes: NASA Mars Trek. Elevaciones: DEM CTX oficial USGS/NASA de 20 m. Pendientes, rugosidad y riesgos son análisis derivados. Los umbrales de movilidad son experimentales; no detectan rocas individuales.</p><div className="provenance-links">{scientificSources.slice(0,2).map(source=><a href={source.url} target="_blank" rel="noreferrer" key={source.id}>{source.provider.toUpperCase()} <b>↗</b></a>)}</div></section></div>
      </aside>
    </div>
    <footer className="bottom-status"><span><span className="status-dot"/> {p.message}</span><span>SIMULACIÓN LOCAL <b>•</b> TODOS LOS SISTEMAS NOMINALES</span><span>© 2024 MARSPATH AI</span></footer>
  </div>
}
function LayerRow({label,detail,color,active,onClick}:{label:string;detail:string;color:string;active:boolean;onClick:()=>void}) { return <button className="layer-row" onClick={onClick}><span className={`layer-swatch ${color}`}/><span className="layer-copy"><strong>{label}</strong><small>{detail}</small></span><span className={`toggle ${active?'on':''}`}><i/></span></button> }
createRoot(document.getElementById('root')!).render(<App />);
