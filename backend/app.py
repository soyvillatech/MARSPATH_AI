from functools import lru_cache
from typing import Literal
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict
from .terrain import Terrain
from .routing import calculate

app=FastAPI(title='MarsPath Terrain API',version='1.0.0',description='Local planning on an official 20 m Jezero DEM. Experimental mobility thresholds.')

@lru_cache(maxsize=1)
def terrain():
    try: return Terrain()
    except (FileNotFoundError,ValueError) as exc: raise HTTPException(503,'DEM no disponible o inválido. Ejecuta scripts/prepare_terrain.py') from exc

class Coordinate(BaseModel):
    model_config=ConfigDict(extra='forbid',allow_inf_nan=False)
    lat:float=Field(ge=-90,le=90)
    lon:float=Field(ge=-180,le=180)
class Weights(BaseModel):
    model_config=ConfigDict(extra='forbid',allow_inf_nan=False)
    slope:float=Field(default=2,ge=0,le=100)
    roughness:float=Field(default=1,ge=0,le=100)
class RouteRequest(BaseModel):
    model_config=ConfigDict(extra='forbid',allow_inf_nan=False)
    origin:Coordinate
    destination:Coordinate
    objective:Literal['short','safe','balanced']='balanced'
    alternatives:int=Field(default=3,ge=1,le=3)
    max_slope:float=Field(default=15,gt=0,le=45)
    weights:Weights=Field(default_factory=Weights)

@app.get('/api/terrain/metadata')
def metadata(): return terrain().metadata

@app.get('/api/terrain/point')
def point(lat:float,lon:float,max_slope:float=Query(15,gt=0,le=45)):
    try: return terrain().info(lat,lon,max_slope)
    except ValueError as exc: raise HTTPException(422,str(exc)) from exc

@lru_cache(maxsize=8)
def cached_hazards(max_slope): return terrain().hazards(max_slope)

@app.get('/api/hazards')
def hazards(max_slope:float=Query(15,gt=0,le=45)): return cached_hazards(max_slope)

@app.post('/api/routes/calculate')
def routes(request:RouteRequest):
    try:
        result=calculate(terrain(),request.origin.model_dump(),request.destination.model_dump(),request.objective,request.alternatives,request.max_slope,request.weights.model_dump())
        if result['status']=='no_route': raise HTTPException(409,result['message'])
        return result
    except ValueError as exc: raise HTTPException(422,str(exc)) from exc
