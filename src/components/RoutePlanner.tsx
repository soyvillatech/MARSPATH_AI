import { useEffect, useState } from 'react';
import { labels, type Coordinate, type Objective, type Planning } from '../features/planning';

function CoordinateInput({kind,p}:{kind:'origin'|'destination';p:Planning}){
  const current=p[kind];const [lat,setLat]=useState(''),[lon,setLon]=useState('');
  useEffect(()=>{setLat(current?String(current.lat):'');setLon(current?String(current.lon):'');},[current]);
  return <fieldset className="coordinate-editor"><legend>{kind==='origin'?'Punto de origen':'Destino'}</legend>
    <div className="coordinate-fields"><label>Latitud<input type="number" step="any" min="-90" max="90" value={lat} onChange={e=>setLat(e.target.value)}/></label><label>Longitud E<input type="number" step="any" min="-180" max="180" value={lon} onChange={e=>setLon(e.target.value)}/></label></div>
    <button className="outline-btn" disabled={!p.metadata||lat===''||lon===''} onClick={()=>p.choose({lat:Number(lat),lon:Number(lon)} as Coordinate,kind)}>Validar coordenadas</button>
    <button className="outline-btn" disabled={!p.metadata} aria-pressed={p.mode===kind} onClick={()=>p.setMode(kind)}>Seleccionar {kind==='origin'?'origen':'destino'} en el mapa</button>
  </fieldset>;
}
export function RoutePlanner({p}:{p:Planning}){
  return <section className="panel-section"><div className="section-title">CONFIGURACIÓN DE RUTA</div>
    <CoordinateInput kind="origin" p={p}/><CoordinateInput kind="destination" p={p}/>
    <button className="outline-btn" disabled={!p.metadata} onClick={async()=>{await p.choose({lat:18.43,lon:77.44},'origin');await p.choose({lat:18.45,lon:77.46},'destination');}}>Cargar ejemplo verificado en el DEM</button>
    <label className="planner-label">Objetivo<select value={p.objective} onChange={e=>p.setObjective(e.target.value as Objective)}>{(Object.keys(labels) as Objective[]).map(k=><option key={k} value={k}>{labels[k]}</option>)}</select></label>
    <label className="planner-label">Pendiente máxima experimental: {p.maxSlope}°<input type="range" min="1" max="30" value={p.maxSlope} onChange={e=>p.setMaxSlope(Number(e.target.value))}/></label>
    {p.objective==='balanced'&&<><label className="planner-label">Peso pendiente: {p.weights.slope}<input type="range" min="0" max="10" step="0.5" value={p.weights.slope} onChange={e=>p.setWeights({...p.weights,slope:Number(e.target.value)})}/></label><label className="planner-label">Peso rugosidad: {p.weights.roughness}<input type="range" min="0" max="10" step="0.5" value={p.weights.roughness} onChange={e=>p.setWeights({...p.weights,roughness:Number(e.target.value)})}/></label></>}
    <button className="calculate-btn" disabled={!p.metadata||!p.origin||!p.destination||p.busy} onClick={p.calculate}>{p.busy?'CALCULANDO…':'CALCULAR RUTAS'}</button>
    <p className="planner-message" role="status">{p.message}</p>{!p.metadata&&<button className="outline-btn" onClick={p.reload}>Reintentar carga del DEM</button>}
    <button className="outline-btn" onClick={()=>p.setMode('inspect')}>Inspeccionar terreno</button>
    {p.point&&<div className="terrain-point"><strong>Terreno seleccionado</strong><p>{p.point.lat.toFixed(6)}° N · {p.point.lon.toFixed(6)}° E</p><p>Elevación: {p.point.elevation_m.toFixed(2)} m</p><p>Pendiente derivada: {p.point.slope_deg.toFixed(2)}°</p><p>Rugosidad estimada: {p.point.roughness_m.toFixed(2)} m</p><p>Relieve respecto al entorno: {p.point.relief_m.toFixed(2)} m</p><p>Riesgo potencial: {p.point.category}</p><small>{p.point.source} · {p.point.resolution_m} m</small></div>}
  </section>;
}
export function RouteResults({p}:{p:Planning}){
  return <section className="panel-section"><div className="section-title">COMPARACIÓN DE RUTAS</div>
    {!p.routes.length&&<p className="planner-message">Selecciona puntos válidos y calcula para obtener métricas.</p>}
    {p.routes.map(r=><article key={r.id} className={`route-card ${r.id===p.selected?'selected':''}`}>
      <button onClick={()=>p.setSelected(r.id)}>{labels[r.kind]} {r.id===p.recommended?'· RECOMENDADA':''}</button>
      <dl><dt>Distancia</dt><dd>{r.metrics.distance_m.toFixed(1)} m</dd><dt>Ascenso / descenso</dt><dd>+{r.metrics.ascent_m.toFixed(1)} / −{r.metrics.descent_m.toFixed(1)} m</dd><dt>Pendiente máx. / media</dt><dd>{r.metrics.max_slope_deg.toFixed(2)}° / {r.metrics.mean_slope_deg.toFixed(2)}°</dd><dt>Recorrido con pendiente &gt;10°</dt><dd>{r.metrics.high_risk_percent.toFixed(1)} %</dd><dt>Costo de su objetivo</dt><dd>{r.cost.toFixed(2)}</dd></dl>
      <p>{r.explanation}</p><p>Óptima para: {r.optimal_for.map(k=>labels[k]).join(', ')}.</p><small>USGS/NASA · CTX DEM · 20 m</small>
      <button className="outline-btn" onClick={()=>{p.setSelected(r.id);p.centerRoute();}}>Centrar esta ruta</button>
    </article>)}
    {p.routes.length>0&&<p className="planner-message">Los costos de perfiles distintos usan pesos diferentes. Las rutas son óptimas en esta cuadrícula y modelo experimental. No se estima tiempo sin un modelo de velocidad.</p>}
  </section>;
}
