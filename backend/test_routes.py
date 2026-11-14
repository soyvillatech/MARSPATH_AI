"""Synthetic arrays below are algorithm test fixtures, never application datasets."""
import hashlib
import json
import math
from pathlib import Path
from types import SimpleNamespace
import numpy as np
import pytest
import rasterio
from fastapi.testclient import TestClient
from .app import app
from .terrain import Terrain,distance,ROOT
from .routing import astar,calculate

@pytest.fixture(scope='module')
def dem(): return Terrain()

def fixture_grid(z,blocked=()):
    h,w=z.shape
    valid=np.ones((h,w),dtype=bool)
    for cell in blocked: valid[cell]=False
    return SimpleNamespace(h=h,w=w,z=z,analyzable=valid,slope=np.zeros((h,w)),roughness=np.zeros((h,w)),dist=lambda a,b:20*math.hypot(a[0]-b[0],a[1]-b[1]))

def test_mars_distances():
    assert distance([0,0],[1,0],3396190)==pytest.approx(3396190*math.pi/180)

def test_nodata_and_corner_cutting():
    grid=fixture_grid(np.zeros((3,3)),[(0,1),(1,0)])
    assert astar(grid,(0,0),(2,2),15,(0,0)) is None

def test_astar_matches_dijkstra_on_independent_cost_profiles():
    grid=fixture_grid(np.zeros((8,8)),[(r,3) for r in range(6)])
    grid.slope[3:6,4:7]=12;grid.roughness[5:7,1:3]=3
    for weights in [(0,0),(8,4),(2,1)]:
        path,cost=astar(grid,(0,0),(7,7),15,weights)
        _,oracle=astar(grid,(0,0),(7,7),15,weights,heuristic=False)
        assert cost==pytest.approx(oracle)
        assert all(grid.analyzable[cell] for cell in path)

def test_edge_slope_constraint():
    z=np.zeros((3,3));z[2,:]=100
    assert astar(fixture_grid(z),(0,0),(2,2),15,(0,0)) is None

def test_native_dem_integrity_and_resolution(dem):
    with rasterio.open(ROOT/'jezero-2km.tif') as src:
        assert src.res==(20,20)
        assert src.shape==(100,100)
        assert hashlib.sha256(src.read(1).tobytes()).hexdigest()==dem.metadata['sample_sha256']
        assert np.array_equal(src.read(1),dem.z)
    assert dem.valid.all()
    assert dem.info(18.44,77.45)['elevation_m']==pytest.approx(-2568.739501953125)

def test_slope_units_and_geographic_alignment(dem):
    cell=dem.cell(18.44,77.45);r,c=cell
    gx=(dem.z[r,c+1]-dem.z[r,c-1])/dem.dist((r,c-1),(r,c+1))
    gy=(dem.z[r+1,c]-dem.z[r-1,c])/dem.dist((r-1,c),(r+1,c))
    assert dem.slope[cell]==pytest.approx(math.degrees(math.atan(math.hypot(gx,gy))))
    for cell in [(1,1),(50,50),(98,98)]:
        lon,lat=dem.coord(cell);assert dem.cell(lat,lon)==cell
    assert dem.dist((50,50),(50,51))==pytest.approx(20,abs=.01)

def test_points_outside_and_insufficient_data(dem):
    with pytest.raises(ValueError): dem.cell(0,0)
    lon,lat=dem.coord((0,0))
    with pytest.raises(ValueError):dem.cell(lat,lon)

def test_routes_and_metrics(dem):
    origin={'lat':18.43,'lon':77.44};destination={'lat':18.45,'lon':77.46}
    result=calculate(dem,origin,destination)
    assert result['status']=='success'
    assert len(result['routes'])==len({json.dumps(r['geometry']) for r in result['routes']})
    assert result['recommended_route_id']==result['routes'][0]['id']
    for route in result['routes']:
        coords=route['geometry']['coordinates'];heights=route['elevation_profile_m']
        assert coords[0]==[77.44,18.43] and coords[-1]==[77.46,18.45]
        assert route['metrics']['distance_m']==pytest.approx(sum(distance(a,b,dem.radius) for a,b in zip(coords,coords[1:])))
        assert route['metrics']['ascent_m']-route['metrics']['descent_m']==pytest.approx(heights[-1]-heights[0])
        assert all(dem.slope[dem.cell(lat,lon)]<=15 for lon,lat in coords)

def test_http_contract_and_errors():
    with TestClient(app) as client:
        assert client.get('/api/terrain/metadata').status_code==200
        assert client.get('/api/terrain/point?lat=0&lon=0').status_code==422
        assert client.get('/api/terrain/point?lat=nan&lon=77.45').status_code==422
        point=client.get('/api/terrain/point?lat=18.44&lon=77.45').json()
        assert point['resolution_m']==20
        hazards=client.get('/api/hazards').json();assert len(hazards['cells'])==10000
        assert hazards['cells'][0][-1] is True
        request={'origin':{'lat':18.43,'lon':77.44},'destination':{'lat':18.45,'lon':77.46},'objective':'balanced'}
        response=client.post('/api/routes/calculate',json=request)
        assert response.status_code==200,response.text
        assert response.json()['routes']
        request['destination']=request['origin']
        assert client.post('/api/routes/calculate',json=request).status_code==422
        request['weights']={'slope':-1,'roughness':1}
        assert client.post('/api/routes/calculate',json=request).status_code==422

def test_missing_dem_returns_503(monkeypatch):
    import backend.app as module
    module.terrain.cache_clear()
    def missing(): raise FileNotFoundError()
    monkeypatch.setattr(module,'Terrain',missing)
    try:
        with TestClient(app) as client:
            assert client.get('/api/terrain/metadata').status_code==503
    finally:module.terrain.cache_clear()

def test_http_no_path_is_not_empty_success(monkeypatch):
    import backend.app as module
    monkeypatch.setattr(module,'calculate',lambda *args,**kwargs: {'status':'no_route','routes':[],'message':'No existe ruta'})
    with TestClient(app) as client:
        response=client.post('/api/routes/calculate',json={'origin':{'lat':18.43,'lon':77.44},'destination':{'lat':18.45,'lon':77.46}})
        assert response.status_code==409
        assert response.json()['detail']=='No existe ruta'

def test_restricted_endpoint_is_rejected():
    grid=fixture_grid(np.zeros((3,3)))
    grid.slope[0,0]=20
    with pytest.raises(ValueError): astar(grid,(0,0),(2,2),15,(8,4))
