"""Read a small native-resolution window once; never resample or fill missing heights."""
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform
from rasterio.windows import Window

SOURCE = 'https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif'
OUT = Path(__file__).resolve().parents[1] / 'data' / 'terrain'

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', GDAL_HTTP_TIMEOUT='60'):
        with rasterio.open(SOURCE) as src:
            print(json.dumps({'crs': src.crs.to_wkt(), 'bounds': list(src.bounds), 'resolution': src.res, 'nodata': src.nodata, 'shape': src.shape}), flush=True)
            # Geographic CRS is constructed from the source Mars datum, not WGS84.
            # GDAL exports source ellipsoid parameters in its PROJ dictionary.
            params = src.crs.to_dict()
            radius = float(params.get('R', params.get('a', 0)))
            if not 3300000 < radius < 3500000:
                raise ValueError(f'Radio marciano no verificado: {params}')
            geographic = CRS.from_dict(proj='longlat', a=radius, b=radius)
            x,y = transform(geographic, src.crs, [77.45],[18.44])
            row,col = src.index(x[0],y[0])
            width = round(2000 / abs(src.res[0])); height = round(2000 / abs(src.res[1]))
            win = Window(col-width//2, row-height//2, width,height)
            if win.col_off < 0 or win.row_off < 0 or win.col_off+width > src.width or win.row_off+height > src.height:
                raise ValueError('Recorte fuera de cobertura')
            grid = src.read(1,window=win,masked=True)
            if np.ma.getmaskarray(grid).any() or not np.isfinite(grid.data).all():
                raise ValueError('La región propuesta contiene NoData; seleccionar otra región explícitamente')
            if not np.allclose(src.res,[20,20]):
                raise ValueError('Resolución distinta de 20 m')
            profile = src.profile.copy()
            profile.update(width=width,height=height,transform=src.window_transform(win),driver='GTiff')
            with rasterio.open(OUT/'jezero-2km.tif','w',**profile) as dst:
                dst.write(grid.filled(src.nodata),1)
            # Independent second window read verifies preservation of original numeric samples.
            assert np.array_equal(grid.data,src.read(1,window=win))
            metadata = {'provider':'USGS/NASA','product':'M20_JezeroCrater_CTXDEM_20m', 'source_url':SOURCE,
                'resolution_m':20,'mars_radius_m':radius,'source_crs':src.crs.to_wkt(), 'geographic_crs':geographic.to_wkt(),
                'source_nodata':src.nodata,'source_window':[int(win.col_off),int(win.row_off),width,height],
                'source_transform':list(src.transform)[:6], 'prepared_at':datetime.now(timezone.utc).isoformat(),
                'source_last_modified':'2022-11-10T20:44:38Z',
                'sample_sha256':hashlib.sha256(grid.data.tobytes()).hexdigest(), 'valid_cells':int(grid.count()),
                'processing':'Native 20 m window, no interpolation or elevation resampling. Cell centers used for routing.'}
            (OUT/'source.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
            print(json.dumps({'saved':str(OUT),'shape':grid.shape,'range':[float(grid.min()),float(grid.max())],'valid':int(grid.count())}),flush=True)

if __name__ == '__main__': main()
