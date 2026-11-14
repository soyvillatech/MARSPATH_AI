# Integración NASA Mars Trek WMTS

Se sustituyó la imagen CSS estirada por un visualizador de teselas con desplazamiento, zoom, selector de fondo, recentrado y estados de carga/error. No se añadieron dependencias ni se implementó un algoritmo de rutas. Se conservó el diseño existente.

## Fuentes verificadas

Documentación: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars

Se consultaron GetCapabilities de los tres productos en `https://trek.nasa.gov/tiles/Mars/EQ/{producto}/1.0.0/WMTSCapabilities.xml`. Cada respuesta indica el estilo, plantilla ResourceURL, matrices, CRS, origen y cobertura. Las capacidades incluyen CORS `Access-Control-Allow-Origin: *`.

| Producto | Formato | Matrices disponibles |
| --- | --- | --- |
| JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd | PNG | 0–17 |
| JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0 | PNG | 0–13 |
| Mars_MGS_MOLA_ClrShade_merge_global_463m | JPEG | 0–7 |

Teselas comprobadas: HTTP 200, Content-Type de imagen y firma binaria PNG/JPEG válida:

- https://trek.nasa.gov/tiles/Mars/EQ/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd/1.0.0//default/default028mm/10/407/1464.png (43 254 bytes).
- https://trek.nasa.gov/tiles/Mars/EQ/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/1.0.0//default/default028mm/10/407/1464.png (55 445 bytes).
- https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0//default/default028mm/7/50/183.jpg (63 039 bytes).

La doble barra procede de ResourceURL y responde correctamente. El cliente usa la plantilla publicada, incluida su extensión. Una primera comprobación de MOLA en nivel 10 devolvió 404: MOLA solo publica hasta el nivel 7. El cliente selecciona exclusivamente matrices declaradas.

## Coordenadas y cobertura

Los servicios EQ declaran `urn:ogc:def:crs:EPSG::104905`, origen `(-180, 90)` y matrices globales de relación 2:1. Se usa longitud/latitud equirectangular en grados, sin Web Mercator terrestre. Para cada matriz la resolución angular es `360 / (MatrixWidth × TileWidth)`; las capacidades se validan para esa geometría concreta. Otras geometrías se rechazan con un error controlado.

La selección respeta la caja de cobertura y TileMatrixLimits si aparecen. HiRISE utiliza CTX de respaldo si este cubre la vista completa; fuera de esa cobertura se utiliza MOLA. Se informa del cambio. Solo se presenta un fondo. Un fallo del servicio se informa y permite reintentar, sin sustituirlo por terreno ficticio.

La posición y escala visual se mantienen al cambiar de capa. Si MOLA no ofrece suficiente detalle, se amplía su última matriz disponible; eso no añade resolución científica. Las teselas se piden como imágenes visibles, utilizando caché HTTP; se retiran las obsoletas y las respuestas se registran por URL. Las consultas de capacidades se cancelan al desmontar, con un límite de espera de 20 segundos.

## Superposiciones existentes

El origen conserva `(77.521 E, 18.444 N)` y el destino `(77.489 E, 18.462 N)`. Antes estaban dibujados en porcentajes de pantalla; ahora su posición depende de la misma transformación geográfica que las teselas.

La curva original se mantiene como ilustración anclada a esos extremos. Sus vértices interiores, los cuatro puntos científicos y las dos zonas de peligro no tienen coordenadas científicas verificadas: se transforman con esos mismos anclajes para conservar la demostración durante zoom y desplazamiento. La leyenda los identifica como simulación. No sirven para navegación real. Las métricas previas siguen siendo simuladas; MOLA sombreado no proporciona un DEM numérico.

## Archivos

- `src/services/marsWmts.ts`: catálogo, lectura de capacidades y selección de teselas.
- `src/components/MarsMap.tsx`: visualizador y superposiciones.
- `src/main.tsx`: conexiones del selector, recentrado y descripción de simulación.
- `src/real-data.css`: estilos limitados al mapa.
- `src/data/scientificSources.ts`: eliminación de URL JPG fija incorrecta.
- `tests/mars-wmts.test.ts`: cobertura, índices, límites y ampliación.

## Verificación y ejecución

`node --experimental-strip-types --test tests/mars-wmts.test.ts`: cinco pruebas aprobadas (Node 24).

`npm.cmd run build`: compilación de producción aprobada.

`npm.cmd run dev`: abrir la URL local que muestre Vite. Cambiar entre las tres capas desde el selector del mapa, arrastrar, ampliar/reducir y usar Localizar. Los marcadores deben conservar sus coordenadas; al salir de cobertura se anuncia el respaldo. Bloquear el dominio NASA en las herramientas del navegador y recargar permite comprobar el estado de error y Reintentar.

Pendiente: verificación visual y de consola en un navegador. El servicio de automatización del navegador no estuvo disponible durante esta tarea; las comprobaciones HTTP y las pruebas del adaptador no sustituyen esa revisión. No se han descargado GeoTIFF ni incorporado mosaicos al repositorio.
