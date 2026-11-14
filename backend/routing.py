import heapq
import math
import numpy as np
from .terrain import distance

WEIGHTS={'short':(0.,0.),'safe':(8.,4.),'balanced':(2.,1.)}

def astar(terrain,start,end,max_slope,weights,heuristic=True):
    allowed=terrain.analyzable & (terrain.slope<=max_slope)
    if not allowed[start] or not allowed[end]: raise ValueError('Origen o destino supera la pendiente máxima configurada')
    g={start:0.}; parent={}; heap=[(0.,0.,start)]
    while heap:
        _,cost,current=heapq.heappop(heap)
        if cost>g[current]: continue
        if current==end:
            path=[end]
            while path[-1]!=start: path.append(parent[path[-1]])
            return path[::-1],cost
        r,c=current
        for dr in (-1,0,1):
            for dc in (-1,0,1):
                if not dr and not dc: continue
                nxt=(r+dr,c+dc)
                if not (0<=nxt[0]<terrain.h and 0<=nxt[1]<terrain.w) or not allowed[nxt]: continue
                if dr and dc and (not allowed[r+dr,c] or not allowed[r,c+dc]): continue
                d=terrain.dist(current,nxt)
                edge_slope=math.degrees(math.atan2(abs(terrain.z[nxt]-terrain.z[current]),d))
                if edge_slope>max_slope: continue
                p=max(float(terrain.slope[current]),float(terrain.slope[nxt]),edge_slope)/15
                rough=(float(terrain.roughness[current])+float(terrain.roughness[nxt]))/2/10
                step=d*(1+weights[0]*p+weights[1]*rough)
                new=cost+step
                if new<g.get(nxt,float('inf')):
                    g[nxt]=new; parent[nxt]=current
                    heapq.heappush(heap,(new+(terrain.dist(nxt,end) if heuristic else 0),new,nxt))
    return None

def metrics(terrain,path,coordinates,heights):
    distances=[distance(a,b,terrain.radius) for a,b in zip(coordinates,coordinates[1:])]
    slopes=[math.degrees(math.atan2(abs(b-a),d)) if d else 0 for a,b,d in zip(heights,heights[1:],distances)]
    total=sum(distances)
    # Connector segments use the endpoint cell's estimated hazard.
    cell_slopes=[float(terrain.slope[path[0]])]+[max(float(terrain.slope[a]),float(terrain.slope[b])) for a,b in zip(path,path[1:])]+[float(terrain.slope[path[-1]])]
    return {'distance_m':total,'ascent_m':sum(max(0,b-a) for a,b in zip(heights,heights[1:])),
        'descent_m':sum(max(0,a-b) for a,b in zip(heights,heights[1:])),
        'max_slope_deg':max(slopes+cell_slopes), 'mean_slope_deg':sum(d*s for d,s in zip(distances,cell_slopes))/total if total else 0,
        'high_risk_percent':100*sum(d for d,s in zip(distances,cell_slopes) if s>10)/total if total else 0}

def calculate(terrain,origin,destination,objective='balanced',alternatives=3,max_slope=15,custom_weights=None):
    start=terrain.cell(origin['lat'],origin['lon']); end=terrain.cell(destination['lat'],destination['lon'])
    if start==end: raise ValueError('Los puntos corresponden a la misma celda de 20 m; elige celdas distintas')
    weights=dict(WEIGHTS)
    if custom_weights: weights['balanced']=(custom_weights['slope'],custom_weights['roughness'])
    order=[objective]+[key for key in weights if key!=objective]
    routes=[]; geometries={}
    for kind in order:
        result=astar(terrain,start,end,max_slope,weights[kind])
        if result is None: continue
        path,cost=result; signature=tuple(path)
        if signature in geometries:
            geometries[signature]['optimal_for'].append(kind); continue
        coordinates=[[origin['lon'],origin['lat']]]+[terrain.coord(cell) for cell in path]+[[destination['lon'],destination['lat']]]
        heights=[float(terrain.z[start])]+[float(terrain.z[cell]) for cell in path]+[float(terrain.z[end])]
        # Exact endpoints are retained. Short within-cell connectors assume the cell's DEM height.
        for coord,cell in [(coordinates[0],start),(coordinates[-1],end)]:
            cost+=distance(coord,terrain.coord(cell),terrain.radius)*(1+weights[kind][0]*terrain.slope[cell]/15+weights[kind][1]*terrain.roughness[cell]/10)
        route={'id':f'route_{kind}','kind':kind,'optimal_for':[kind], 'geometry':{'type':'LineString','coordinates':coordinates},
            'metrics':metrics(terrain,path,coordinates,heights),'cost':float(cost),'weights':list(weights[kind]),'elevation_profile_m':heights,
            'warnings':['Modelo experimental; no certificado para operaciones.','DEM de 20 m: no detecta rocas individuales.','Extremos exactos conectados al centro de su celda; altura constante dentro de la celda.'],
            'explanation':f'Mínimo costo para {kind}: d × (1 + {weights[kind][0]:g} × pendiente/15° + {weights[kind][1]:g} × rugosidad/10 m).'}
        routes.append(route); geometries[signature]=route
    if not routes: return {'status':'no_route','routes':[],'recommended_route_id':None,'message':'No existe una ruta válida con estas restricciones'}
    return {'status':'success','routes':routes[:alternatives],'recommended_route_id':routes[0]['id'],
        'data_source':terrain.metadata,'message':f'{min(len(routes),alternatives)} alternativas distintas; pueden coincidir los óptimos de varios objetivos.'}
