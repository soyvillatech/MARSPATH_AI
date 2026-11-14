import hashlib
import math
import json
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import transform

ROOT = Path(__file__).resolve().parents[1] / 'data' / 'terrain'

def distance(a,b,radius):
    lon1,lat1,lon2,lat2 = map(math.radians,[*a,*b])
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 2*radius*math.asin(math.sqrt(max(0,min(h,1))))

class Terrain:
    def __init__(self, root=ROOT):
        self.metadata=json.loads((root/'source.json').read_text(encoding='utf-8'))
        with rasterio.open(root/'jezero-2km.tif') as src:
            self.crs=src.crs; self.affine=src.transform
            band=src.read(1,masked=True)
            if hashlib.sha256(band.data.tobytes()).hexdigest()!=self.metadata['sample_sha256']:
                raise ValueError('Integridad del recorte DEM inválida')
            self.z=band.filled(np.nan).astype(float)
            self.valid=~np.ma.getmaskarray(band)&np.isfinite(self.z)
            self.h,self.w=self.z.shape
            rows,cols=np.indices(self.z.shape)
            xs,ys=rasterio.transform.xy(self.affine,rows.ravel(),cols.ravel())
            lon,lat=transform(self.crs,self.metadata['geographic_crs'],list(xs),list(ys))
            self.lon=np.array(lon).reshape(self.z.shape); self.lat=np.array(lat).reshape(self.z.shape)
            corners=[(src.bounds.left,src.bounds.bottom),(src.bounds.right,src.bounds.bottom),(src.bounds.right,src.bounds.top),(src.bounds.left,src.bounds.top)]
            lo,la=transform(self.crs,self.metadata['geographic_crs'],*[list(x) for x in zip(*corners)])
            self.polygon=[list(p) for p in zip(lo,la)]; self.polygon.append(self.polygon[0])
        self.radius=self.metadata['mars_radius_m']
        self._distances={}
        self.slope=np.full(self.z.shape,np.nan); self.roughness=np.full(self.z.shape,np.nan); self.relief=np.full(self.z.shape,np.nan)
        for r in range(1,self.h-1):
            for c in range(1,self.w-1):
                block=self.z[r-1:r+2,c-1:c+2]
                if not self.valid[r-1:r+2,c-1:c+2].all(): continue
                dx=self.dist((r,c-1),(r,c+1)); dy=self.dist((r-1,c),(r+1,c))
                gx=(self.z[r,c+1]-self.z[r,c-1])/dx; gy=(self.z[r+1,c]-self.z[r-1,c])/dy
                self.slope[r,c]=np.degrees(np.arctan(np.hypot(gx,gy)))
                self.roughness[r,c]=np.std(block)
                self.relief[r,c]=self.z[r,c]-np.mean(block)
        self.analyzable=self.valid & np.isfinite(self.slope)
        self.metadata.update(rows=self.h,cols=self.w,coverage={'type':'Polygon','coordinates':[self.polygon]},
            bounds=[min(lo),min(la),max(lo),max(la)], elevation_range_m=[float(np.nanmin(self.z)),float(np.nanmax(self.z))],
            analysis='Slope: central differences using Mars great-circle distances; roughness: 3×3 height standard deviation; relief: height minus 3×3 mean.',
            geology_available=False,science_points_available=False)

    def coord(self,cell): return [float(self.lon[cell]),float(self.lat[cell])]
    def dist(self,a,b):
        key=(min(a,b),max(a,b))
        if key not in self._distances:
            if len(self._distances)>250000: self._distances.clear()
            self._distances[key]=distance(self.coord(a),self.coord(b),self.radius)
        return self._distances[key]
    def cell(self,lat,lon):
        if not np.isfinite([lat,lon]).all(): raise ValueError('Coordenadas no finitas')
        x,y=transform(self.metadata['geographic_crs'],self.crs,[lon],[lat])
        r,c=rasterio.transform.rowcol(self.affine,x[0],y[0]); r,c=int(r),int(c)
        if not (0<=r<self.h and 0<=c<self.w): raise ValueError('Punto fuera del DEM de 2 × 2 km')
        if not self.analyzable[r,c]: raise ValueError('Celda sin elevación o sin vecinos suficientes para analizar pendiente')
        return r,c
    def info(self,lat,lon,max_slope=15):
        cell=self.cell(lat,lon); slope=float(self.slope[cell])
        return dict(lat=lat,lon=lon,elevation_m=float(self.z[cell]),slope_deg=slope,roughness_m=float(self.roughness[cell]),relief_m=float(self.relief[cell]),
            category='baja' if slope<=5 else 'moderada' if slope<=10 else 'alta' if slope<=15 else 'muy alta',
            traversable=slope<=max_slope,cell=list(cell),cell_center=self.coord(cell),resolution_m=20,source=self.metadata['product'])

    def hazards(self,max_slope=15):
        cells=[]
        for r in range(self.h):
            for c in range(self.w):
                x0=self.affine.c+self.affine.a*c; y0=self.affine.f+self.affine.e*r
                x1=x0+self.affine.a; y1=y0+self.affine.e
                lo,la=transform(self.crs,self.metadata['geographic_crs'],[x0,x1],[y0,y1])
                valid=bool(self.analyzable[r,c])
                cells.append([lo[0],la[1],lo[1],la[0],float(self.slope[r,c]) if valid else None,
                    float(self.roughness[r,c]) if valid else None,float(self.relief[r,c]) if valid else None,
                    bool(not valid or self.slope[r,c]>max_slope)])
        return {'columns':['west','south','east','north','slope_deg','roughness_m','relief_m','restricted'], 'cells':cells,'source':self.metadata['product'],'resolution_m':20}
