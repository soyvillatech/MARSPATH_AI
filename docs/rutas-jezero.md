# Rutas sobre el DEM oficial de Jezero

SPEC-002 amplía el antiguo alcance frontend-only: un servidor FastAPI local procesa exclusivamente el recorte preparado, sin solicitudes externas durante el cálculo. Las imágenes NASA WMTS siguen llegando directamente al navegador.

## Arranque en Windows

Requisitos: Node, Python y uv. En este equipo se usó Python 3.14.5.

```powershell
uv venv .venv
uv pip install --python .venv/Scripts/python.exe -r backend/requirements.txt
npm.cmd run api
```

En otra terminal:

```powershell
npm.cmd run dev
```

Vite reenvía `/api` a `127.0.0.1:8000`. Abrir la dirección de Vite y pulsar «Cargar ejemplo verificado en el DEM», después «Calcular rutas». Las capas analíticas y el contorno cyan se muestran sobre WMTS; las coordenadas también pueden introducirse manualmente, seleccionarse por clic o cambiarse arrastrando los marcadores. Un clic en modo inspección consulta el terreno.

Ejemplo validado: origen `(18.43 N, 77.44 E)` y destino `(18.45 N, 77.46 E)`. Son ubicaciones de prueba dentro del DEM, no lugares científicos catalogados.

El recorte `data/terrain/jezero-2km.tif` ocupa unos 41 KB y puede versionarse junto a `source.json`. No es el mosaico completo. Si falta o se decide regenerarlo explícitamente:

```powershell
npm.cmd run terrain:prepare
```

El script consulta el GeoTIFF oficial por rangos HTTP, conserva los valores originales, verifica una segunda lectura del recorte y guarda la huella SHA-256 de las muestras. El servidor verifica esa huella al cargar. No descarga datos por cada usuario o cálculo.

## Procedencia y coordenadas

- Fuente: https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif
- Producto USGS/NASA CTX DEM, resolución nominal 20 m; la resolución no equivale a precisión absoluta.
- Archivo fuente comprobado: HTTP 200, `image/tiff`, 90 345 300 bytes, rangos disponibles. Last-Modified observado: 2022-11-10.
- CRS original: Jezero Crater Projection, equirectangular, paralelo estándar 18.4663°, esfera Mars 2000 de radio 3 396 190 m. No se utiliza el radio de la Tierra.
- Ventana nativa: columna 1222, fila 2469, 100 × 100 celdas. No se interpola ni se sustituye NoData por cero.
- Cobertura: 77.4321373067 a 77.4677101582 E; 18.4233753293 a 18.4571165390 N.
- Elevación: −2603.854736 a −2546.108154 m, conservando el datum vertical del producto, sin reinterpretarlo como nivel del mar terrestre.
- Las 10 000 celdas tienen elevación válida. El anillo exterior se excluye del análisis por falta de vecinos para las diferencias centrales.

## Modelo y significado de óptimo

La pendiente se calcula con diferencias centrales de alturas y distancias de círculo máximo marciano. La rugosidad es la desviación estándar de las alturas de la ventana 3 × 3; incluye variaciones por inclinación. El indicador de relieve es la diferencia entre la altura de la celda y la media del entorno (negativo: depresión relativa).

El costo de una arista es `d × (1 + α P + β R)`, donde `P` es la mayor pendiente entre ambas celdas y la arista, dividida entre 15°, y `R` es la rugosidad media dividida entre 10 m. Pesos no negativos: distancia `(0,0)`, riesgo `(8,4)`, equilibrio `(2,1)` por defecto, editable. No hay penalización geológica sin datos georreferenciados.

A* usa distancias marcianas como heurística admisible. Bloquea NoData, bordes sin análisis y pendientes superiores al máximo, incluidas las pendientes entre celdas. Las diagonales no atraviesan esquinas bloqueadas. Cada búsqueda minimiza su función sobre la misma cuadrícula. La búsqueda del objetivo solicitado se realiza primero y su resultado es la recomendación. Las geometrías idénticas se unifican indicando todos los objetivos para los cuales resultan óptimas; no se garantizan tres rutas distintas.

La geometría conserva exactamente las coordenadas solicitadas. Los extremos se conectan a los centros de sus respectivas celdas con elevación constante dentro de la celda; estas conexiones se incluyen en distancia, costo y métricas y constituyen una aproximación subpíxel declarada. Dos puntos en la misma celda se rechazan. No se desplaza silenciosamente un marcador inválido.

Los umbrales bajo ≤5°, moderado ≤10°, alto ≤15° y muy alto >15° son experimentales. El porcentaje de recorrido de riesgo alto usa la longitud de segmentos cuya pendiente de celda supera 10°. La pendiente media se pondera por distancia; la máxima incluye pendientes de celda y de arista. Ascenso y descenso se acumulan desde las elevaciones muestreadas. Costos de perfiles diferentes no deben compararse como una única unidad física.

Las capas de rugosidad usan cortes experimentales de 1.67, 3.33 y 5 m. El mapa de riesgo potencial usa `max(pendiente en grados, abs(relieve local en m) × 10)`, con los mismos cortes 5/10/15. Este indicador visual no agrega un costo oculto al algoritmo. No identifica grietas ni rocas y no certifica transitabilidad humana o de rovers.

## Contrato API

Contrato OpenAPI generado desde los modelos de FastAPI en `/openapi.json`; documentación interactiva en `http://127.0.0.1:8000/docs`. Sin autenticación, enlazado solo a localhost.

| Ruta | Respuesta |
| --- | --- |
| `GET /api/terrain/metadata` | Fuente, hash, CRS, resolución, cobertura y procesamiento |
| `GET /api/terrain/point?lat=18.44&lon=77.45&max_slope=15` | Elevación, pendiente, rugosidad, relieve, categoría y transitabilidad |
| `GET /api/hazards?max_slope=15` | Cuadrícula compacta de toda el área fija 2 × 2 km, columnas descritas en respuesta |
| `POST /api/routes/calculate` | Rutas GeoJSON, métricas, pesos, costos, advertencias y recomendación |

Ejemplo POST:

```json
{"origin":{"lat":18.43,"lon":77.44},"destination":{"lat":18.45,"lon":77.46},"objective":"balanced","alternatives":3,"max_slope":15,"weights":{"slope":2,"roughness":1}}
```

Objetivos: `short`, `safe`, `balanced`. Hasta tres alternativas. Pendiente máxima >0 y ≤45°; la interfaz ofrece 1–30°. Pesos configurables 0–100 para el modo equilibrado. Coordenadas no finitas, fuera de cobertura, celdas no analizables, extremos restringidos o en la misma celda: HTTP 422. Sin camino: 409. DEM ausente o hash inválido: 503. Nunca se devuelve éxito sin rutas. Cambiar puntos, objetivo o parámetros invalida resultados previos y se ignoran respuestas obsoletas.

## Verificación

```powershell
npm.cmd run test:terrain
node --experimental-strip-types --test tests/mars-wmts.test.ts
npm.cmd run build
```

Pruebas: integridad del recorte, resolución, altura de control, distancias marcianas, pendientes, coordenadas, NoData, diagonales, restricciones por arista, A* contra Dijkstra, geometrías distintas, métricas, API y datos ausentes. Los pequeños terrenos sintéticos de pruebas nunca se utilizan como datos de la aplicación.

Pendientes de datos: unidades geológicas y puntos científicos requieren un producto georreferenciado; aparecen como no disponibles. No se ofrece duración sin un modelo de velocidad. La revisión visual completa de la interfaz requiere un navegador disponible; las pruebas HTTP/algorítmicas y la compilación no sustituyen esa revisión.
