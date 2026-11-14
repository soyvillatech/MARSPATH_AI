import { useEffect, useRef, useState } from 'react';
export type Coordinate = {lat:number;lon:number};
export type Objective = 'short'|'safe'|'balanced';
export type Metadata = {provider:string;product:string;resolution_m:number;bounds:number[];coverage:{type:'Polygon';coordinates:number[][][]};elevation_range_m:number[]};
export type PointInfo = Coordinate & {elevation_m:number;slope_deg:number;roughness_m:number;relief_m:number;category:string;traversable:boolean;source:string;resolution_m:number};
export type PlannedRoute = {id:string;kind:Objective;optimal_for:Objective[];geometry:{type:'LineString';coordinates:number[][]};metrics:{distance_m:number;ascent_m:number;descent_m:number;max_slope_deg:number;mean_slope_deg:number;high_risk_percent:number};cost:number;weights:number[];explanation:string;warnings:string[];elevation_profile_m:number[]};
export type HazardData = {cells:Array<[number,number,number,number,number|null,number|null,number|null,boolean]>;source:string;resolution_m:number};
export const labels:Record<Objective,string>={short:'Menor distancia',safe:'Menor riesgo',balanced:'Equilibrada'};
async function api<T>(path:string,options?:RequestInit):Promise<T>{
  const response=await fetch(path,options);
  const text=await response.text();
  let data;try{data=JSON.parse(text);}catch{throw Error('API de terreno no disponible. Inicia el servidor local.');}
  if(!response.ok) throw Error(typeof data.detail==='string'?data.detail:'Solicitud inválida; revisa las coordenadas y restricciones.');
  return data;
}
export function usePlanning(){
  const [metadata,setMetadata]=useState<Metadata|null>(null);
  const [hazards,setHazards]=useState<HazardData|null>(null);
  const [origin,setOrigin]=useState<Coordinate|null>(null),[destination,setDestination]=useState<Coordinate|null>(null);
  const [mode,setMode]=useState<'origin'|'destination'|'inspect'>('origin');
  const [objective,setObjective]=useState<Objective>('balanced');
  const [maxSlope,setMaxSlope]=useState(15);
  const [weights,setWeights]=useState({slope:2,roughness:1});
  const [routes,setRoutes]=useState<PlannedRoute[]>([]),[recommended,setRecommended]=useState('');
  const [selected,setSelected]=useState('');
  const [overlay,setOverlay]=useState<'none'|'slope'|'roughness'|'risk'|'restricted'>('slope');
  const [point,setPoint]=useState<PointInfo|null>(null);
  const [message,setMessage]=useState('Cargando DEM oficial…'),[busy,setBusy]=useState(false);
  const [retry,setRetry]=useState(0),[focus,setFocus]=useState(0);
  const revision=useRef(0),selection=useRef(0),request=useRef<AbortController|null>(null);
  const invalidate=()=>{revision.current++;request.current?.abort();setBusy(false);setRoutes([]);setRecommended('');setSelected('');};
  useEffect(()=>{
    const controller=new AbortController();setHazards(null);
    api<Metadata>('/api/terrain/metadata',{signal:controller.signal}).then(setMetadata).catch(e=>{if(!controller.signal.aborted){setMetadata(null);setMessage(e.message);}});
    api<HazardData>(`/api/hazards?max_slope=${maxSlope}`,{signal:controller.signal}).then(data=>{setHazards(data);setMessage('DEM disponible. Selecciona origen y destino dentro del área.');}).catch(e=>{if(!controller.signal.aborted)setMessage(e.message);});
    return ()=>controller.abort();
  },[maxSlope,retry]);
  useEffect(()=>()=>{request.current?.abort();selection.current++;},[]);
  async function choose(coord:Coordinate,kind=mode){
    const seq=++selection.current;
    try{
      const info=await api<PointInfo>(`/api/terrain/point?lat=${coord.lat}&lon=${coord.lon}&max_slope=${maxSlope}`);
      if(seq!==selection.current)return;setPoint(info);
      if(kind==='inspect'){setMessage(`Elevación ${info.elevation_m.toFixed(2)} m; riesgo ${info.category}.`);return;}
      if(!info.traversable)throw Error('El punto supera la pendiente máxima; no se ha movido el marcador.');
      const other=kind==='origin'?destination:origin;
      if(other&&other.lat===coord.lat&&other.lon===coord.lon)throw Error('Origen y destino no pueden ser idénticos.');
      invalidate();
      if(kind==='origin'){setOrigin(coord);setMode(destination?'inspect':'destination');}else{setDestination(coord);setMode('inspect');}
      setMessage('Punto válido sobre el DEM; vuelve a calcular las rutas.');
    }catch(e){if(seq===selection.current)setMessage((e as Error).message);}
  }
  async function calculate(){
    if(!origin||!destination||!metadata)return;
    invalidate();const version=revision.current;const controller=new AbortController();request.current=controller;setBusy(true);setMessage('Calculando rutas sobre el DEM…');
    try{
      const result=await api<{routes:PlannedRoute[];recommended_route_id:string;message:string}>('/api/routes/calculate',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({origin,destination,objective,max_slope:maxSlope,weights,alternatives:3})});
      if(version!==revision.current)return;
      setRoutes(result.routes);setRecommended(result.recommended_route_id);setSelected(result.recommended_route_id);setMessage(result.message);setFocus(f=>f+1);
    }catch(e){if(version===revision.current&&!controller.signal.aborted)setMessage((e as Error).message);}finally{if(version===revision.current)setBusy(false);}
  }
  return {metadata,hazards,origin,destination,mode,setMode,objective,setObjective:(v:Objective)=>{invalidate();setObjective(v);},maxSlope,setMaxSlope:(v:number)=>{selection.current++;invalidate();setMaxSlope(v);},weights,setWeights:(v:typeof weights)=>{invalidate();setWeights(v);},routes,recommended,selected,setSelected,overlay,setOverlay,point,message,busy,choose,calculate,reload:()=>setRetry(v=>v+1),focus,centerRoute:()=>setFocus(f=>f+1)};
}
export type Planning = ReturnType<typeof usePlanning>;
