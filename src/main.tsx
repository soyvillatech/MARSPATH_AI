import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertTriangle, BarChart3, ChevronDown, Circle, Compass, Crosshair, Database, Download, FlaskConical, Gauge, Layers, MapPin, Navigation, PanelRight, Play, Route, Satellite, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Target, Timer, Triangle, Wifi, Wind, Zap } from 'lucide-react';
import './styles.css';
import './real-data.css';
import { scientificSources } from './data/scientificSources';

import { MarsMap } from './components/MarsMap';
import { layers, type LayerKey } from './services/marsWmts';

type Point = { x: number; y: number; name: string; kind: 'origin' | 'target' | 'science' };
const science: Point[] = [
  { x: 28, y: 39, name: 'Delta del río', kind: 'science' }, { x: 63, y: 27, name: 'Unidad deltaica', kind: 'science' },
  { x: 75, y: 63, name: 'Borde del cráter', kind: 'science' }, { x: 44, y: 72, name: 'Depósito de olivino', kind: 'science' },
];

function App() {
  const [routeType, setRouteType] = useState('Ruta segura');
  const [activeLayer, setActiveLayer] = useState('Elevation');
  const [showScience, setShowScience] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [notice, setNotice] = useState('Listo para planificar la misión');
  const [basemap, setBasemap] = useState<LayerKey>('hirise');
  const [locate, setLocate] = useState(0);

  const runRoute = () => { setPlanning(true); setNotice('Vista de ruta simulada; pendiente de integrar un DEM'); setTimeout(() => setPlanning(false), 650); };
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Satellite size={20}/></div><div><div className="brand-name">MARSPATH <span>AI</span></div><div className="brand-sub">SISTEMA DE EXPLORACIÓN INTELIGENTE</div></div></div>
      <div className="mission-status"><span className="status-dot"/> CONTROL DE MISIÓN <span className="status-divider"/> <Wifi size={14}/> ENLACE DE DATOS EN VIVO</div>
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
        <div className="sidebar-footer"><div><span className="status-dot"/> SISTEMAS NOMINALES</div><small>v0.1.0 • CONJUNTO DE DATOS 2024.06</small></div>
      </aside>
      <main className="main-content">
        <div className="page-heading"><div><div className="eyebrow">EXPLORACIÓN / CRÁTER JEZERO</div><h1>Explorador marciano <span className="live-tag">● EN VIVO</span></h1><p>Cartografía interactiva y planificación de misión</p></div><button className="outline-btn"><Download size={15}/> Exportar informe de misión</button></div>
        <section className="map-panel">
          <div className="map-toolbar"><div className="toolbar-group"><select className="map-tool nasa-layer-select" aria-label="Mapa base NASA" value={basemap} onChange={e=>setBasemap(e.target.value as LayerKey)}>{(Object.keys(layers) as LayerKey[]).map(key=><option key={key} value={key}>{layers[key].label}</option>)}</select><button className="map-tool" onClick={() => setLocate(n => n+1)}><Crosshair size={16}/> Localizar</button></div><div className="map-coordinates">18.44° N &nbsp; • &nbsp; 77.45° E &nbsp; <span>CRÁTER JEZERO</span></div><div className="toolbar-group"><button className="map-tool">2D</button><button className="map-tool muted">3D <small>BETA</small></button></div></div>
          <MarsMap layer={basemap} routeType={routeType} showScience={showScience} showHazards={showHazards} locate={locate}/>
          <div className="map-footer"><div className="data-source"><Database size={14}/><span>MAPA BASE: <strong>NASA MARS TREK</strong></span><span className="footer-sep">|</span><span>PRODUCTO: <strong>WMTS</strong></span></div><div className="map-quality"><span className="status-dot"/> IMÁGENES ORBITALES <strong>NASA</strong></div></div>
        </section>
      </main>
      <aside className="right-panel">
        <div className="panel-tabs"><button className="tab active">PLAN DE MISIÓN</button><button className="tab">CAPAS</button></div>
        <div className="panel-scroll"><section className="panel-section"><div className="section-title"><Navigation size={16}/> CONFIGURACIÓN DE RUTA <SlidersHorizontal size={15}/></div><div className="point-input"><span className="point-icon origin-icon">A</span><div><small>PUNTO DE ORIGEN</small><strong>Campamento base Jezero</strong><em>18.444° N, 77.521° E</em></div><ChevronDown size={16}/></div><div className="connector"/><div className="point-input"><span className="point-icon target-icon">B</span><div><small>DESTINO</small><strong>Afloramiento del delta occidental</strong><em>18.462° N, 77.489° E</em></div><ChevronDown size={16}/></div><div className="route-selector-label">OBJETIVO DE RUTA</div><div className="route-options">{['Ruta segura','Ruta rápida','Ruta científica'].map(r=><button className={routeType===r?'selected':''} onClick={()=>setRouteType(r)} key={r}>{r==='Ruta segura'?<ShieldCheck size={15}/>:r==='Ruta rápida'?<Zap size={15}/>:<Sparkles size={15}/>}<span>{r}</span>{routeType===r&&<i/>}</button>)}</div><button className="calculate-btn" onClick={runRoute}>{planning?<Activity className="spin" size={17}/>:<Play size={17} fill="currentColor"/>} {planning?'CALCULANDO RUTA…':'CALCULAR RUTA'}</button></section>
        <section className="panel-section"><div className="section-title"><Layers size={16}/> CAPAS CIENTÍFICAS <span className="layer-count">MAPA BASE</span></div>{(Object.keys(layers) as LayerKey[]).map(key => <LayerRow key={key} label={layers[key].label} detail={layers[key].resolution} color="orange" active={basemap===key} onClick={()=>setBasemap(key)}/>)}<LayerRow label="Elevación / DEM" detail="Sin datos numéricos; pendiente de integrar" color="orange" active={false} onClick={()=>setNotice('MOLA es relieve visual; aún no hay un DEM numérico')}/><LayerRow label="Análisis de pendientes" detail="Simulación; sin DEM" color="purple" active={activeLayer==='Slope'} onClick={()=>setActiveLayer('Slope')}/><LayerRow label="Puntos científicos" detail="Ubicaciones de demostración" color="yellow" active={showScience} onClick={()=>setShowScience(!showScience)}/><LayerRow label="Zonas de peligro" detail="2 zonas simuladas" color="red" active={showHazards} onClick={()=>setShowHazards(!showHazards)}/></section>
        <section className="panel-section metrics"><div className="section-title"><Activity size={16}/> TELEMETRÍA DE RUTA <span className="telemetry-live">EN VIVO</span></div><div className="metric-grid"><Metric icon={<Route/>} value="4.82" unit="km" label="DISTANCIA"/><Metric icon={<Timer/>} value="02:14" unit="h" label="DURACIÓN EST."/><Metric icon={<Triangle/>} value="12.6°" unit="" label="PENDIENTE MÁX."/><Metric icon={<ShieldCheck/>} value="BAJO" unit="" label="NIVEL DE RIESGO"/></div><div className="elevation-chart"><div className="chart-label">PERFIL DE ELEVACIÓN <span>+82 m / −31 m</span></div><svg viewBox="0 0 300 56" preserveAspectRatio="none"><path d="M0 47 L20 43 L37 45 L52 32 L68 38 L86 29 L101 34 L120 23 L140 28 L158 17 L174 21 L192 14 L211 19 L226 10 L244 17 L260 8 L278 15 L300 3 L300 56 L0 56Z" fill="rgba(238,107,40,.12)"/><path d="M0 47 L20 43 L37 45 L52 32 L68 38 L86 29 L101 34 L120 23 L140 28 L158 17 L174 21 L192 14 L211 19 L226 10 L244 17 L260 8 L278 15 L300 3" fill="none" stroke="#f07d3b" strokeWidth="2"/></svg></div></section>
        <section className="provenance"><div className="provenance-title"><Database size={15}/> PROCEDENCIA DE DATOS</div><p>La cartografía se solicita a NASA Mars Trek; el mapa indica si la carga falla. La elevación, la pendiente y las métricas de ruta requieren un DEM descargado; las rutas y los peligros mostrados son simulaciones.</p><div className="provenance-links">{scientificSources.slice(0,2).map(source=><a href={source.url} target="_blank" rel="noreferrer" key={source.id}>{source.provider.toUpperCase()} <b>↗</b></a>)}</div></section></div>
      </aside>
    </div>
    <footer className="bottom-status"><span><span className="status-dot"/> {notice}</span><span>SIMULACIÓN LOCAL <b>•</b> TODOS LOS SISTEMAS NOMINALES</span><span>© 2024 MARSPATH AI</span></footer>
  </div>
}
function LayerRow({label,detail,color,active,onClick}:{label:string;detail:string;color:string;active:boolean;onClick:()=>void}) { return <button className="layer-row" onClick={onClick}><span className={`layer-swatch ${color}`}/><span className="layer-copy"><strong>{label}</strong><small>{detail}</small></span><span className={`toggle ${active?'on':''}`}><i/></span></button> }
function Metric({icon,value,unit,label}:{icon:React.ReactNode;value:string;unit:string;label:string}) { return <div className="metric"><div className="metric-icon">{icon}</div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-label">{label}</div></div> }
createRoot(document.getElementById('root')!).render(<App />);
