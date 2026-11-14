# MarsPath AI — Especificación de implementación

## 1. Producto

Construir una aplicación web frontend-only para planificar Marswalks en una zona delimitada de Jezero Crater. La aplicación debe convertir datos de elevación, geología, observaciones y peligros en rutas óptimas, comparables y explicables.

El producto no debe limitarse a dibujar una línea entre dos coordenadas. La ruta debe seguir una cuadrícula de terreno, respetar las restricciones configuradas y mostrar las métricas que justifican la decisión.

## 2. Stack y límites

- React + TypeScript + Vite.
- Leaflet para el mapa 2D.
- CSS para la interfaz responsive.
- JSON y archivos locales para datos y metadatos.
- Web Worker para A* si el cálculo afecta a la interacción.
- CesiumJS únicamente como mejora opcional posterior.
- `localStorage` para misiones guardadas.

No implementar backend, base de datos, autenticación, servidor Python, API propia ni datos presentados como actuales si no existe una fuente temporal válida.

## 3. Flujo principal de usuario

1. Abrir Jezero con las capas disponibles.
2. Elegir un punto de origen en el mapa.
3. Elegir un destino.
4. Activar o desactivar capas de elevación, pendiente, riesgos, geología y ciencia.
5. Seleccionar objetivos científicos opcionales.
6. Configurar el perfil de misión:
   - Seguridad.
   - Rapidez.
   - Ciencia.
   - Equilibrado.
7. Calcular rutas.
8. Comparar las alternativas en el mapa y en el panel de métricas.
9. Seleccionar una ruta y consultar su explicación.
10. Guardar la misión o generar un reporte.

## 4. Módulos que se deben implementar

### 4.1 Mars Explorer

- Mapa Leaflet centrado en la región de estudio.
- Zoom, desplazamiento y coordenadas del cursor.
- Capas base y superposiciones científicas.
- Marcadores de origen, destino y objetivos.
- Leyenda con fuente y tipo de dato.

### 4.2 Mission Planner

- Selección de origen y destino mediante clic.
- Edición o reinicio de puntos.
- Selección de objetivos científicos.
- Configuración de velocidad, pendiente máxima y pesos de optimización.
- Estado visible: listo, calculando, ruta encontrada o sin ruta válida.

### 4.3 Terrain Analysis

Para cada celda de la cuadrícula calcular o cargar:

- Elevación.
- Pendiente local.
- Desnivel respecto a sus vecinas.
- Clase de terreno.
- Transitabilidad.

La pendiente debe derivarse de elevaciones vecinas o de un producto previamente procesado. Las imágenes orbitales no deben utilizarse como sustituto de elevación.

### 4.4 Hazard Analysis

- Mostrar peligros documentados y zonas de exclusión.
- Diferenciar datos reales, cálculos y simulaciones.
- Convertir cada peligro en una penalización o bloqueo según su severidad.
- Mostrar en la ruta los segmentos que atraviesan zonas de riesgo.

### 4.5 Smart Route Engine

Implementar A* sobre una cuadrícula de 8 vecinos. El motor debe:

- Rechazar celdas fuera de la cuadrícula.
- Rechazar celdas bloqueadas.
- Evitar movimientos diagonales que atraviesen esquinas bloqueadas.
- Aplicar coste distinto a movimientos rectos y diagonales.
- Penalizar pendientes superiores al umbral configurable.
- Penalizar peligros y zonas de exclusión.
- Aplicar bonificación limitada a objetivos científicos.
- Reconstruir la ruta completa y devolver sus métricas.
- Devolver una razón útil cuando no haya solución.

#### Coste recomendado

```text
distancia = tamañoCelda × (1 o √2)
pendiente = clamp(pendienteGrados / pendienteMáxima, 0, 1)

coste = distancia
      × (1 + pesoPendiente × pendiente²)
      + pesoRiesgo × riesgoCelda
      + costeTerreno
      + costeExclusión
      - bonificaciónCientífica
```

La bonificación científica no debe hacer que una ruta atraviese una celda no transitable. Para mantener resultados comparables, todos los perfiles deben usar la misma cuadrícula y cambiar únicamente sus pesos y objetivos.

#### Perfiles de ruta

| Perfil | Objetivo | Pesos iniciales sugeridos |
| --- | --- | --- |
| Segura | Minimizar riesgo y pendientes | Riesgo alto, pendiente alta, ciencia baja |
| Rápida | Minimizar tiempo y distancia | Distancia alta, pendiente media, riesgo obligatorio |
| Científica | Visitar objetivos de interés | Ciencia alta, riesgo medio, distancia media |
| Equilibrada | Balancear seguridad, tiempo y ciencia | Pesos configurables por el usuario |

La aplicación debe presentar estos perfiles como preferencias, no como garantías operativas para una misión real.

### 4.6 Route Comparison

Mostrar las rutas encontradas simultáneamente, con colores y una leyenda. Para cada alternativa mostrar:

- Distancia total.
- Duración estimada.
- Desnivel positivo y negativo.
- Pendiente máxima y media.
- Riesgo acumulado.
- Número de objetivos visitados.
- Tramos críticos.
- Perfil utilizado.

La recomendación debe explicar el motivo, por ejemplo: “La ruta segura es 8 % más larga, pero evita dos zonas de alta pendiente y reduce el riesgo acumulado en 41 %”.

### 4.7 Scientific Explorer

- Unidades geológicas de USGS.
- Puntos científicos en JSON.
- Imágenes de Perseverance con metadatos disponibles.
- Referencias de rutas históricas de rovers como contexto.
- Ficha de fuente al seleccionar cada elemento.

### 4.8 Mission Dashboard y Report

El panel debe resumir el estado de la misión, los parámetros y la ruta elegida. El reporte debe incluir fuentes, supuestos, métricas, objetivos, riesgos y una advertencia de que los resultados son una simulación de planificación.

## 5. Modelo de datos

Crear tipos explícitos en `src/types/`:

```ts
type GridCell = {
  row: number;
  col: number;
  elevationM: number;
  slopeDeg: number;
  risk: number;
  traversable: boolean;
  scientificValue?: number;
};

type RouteProfile = 'safe' | 'fast' | 'science' | 'balanced';

type RouteMetrics = {
  distanceM: number;
  durationMin: number;
  ascentM: number;
  descentM: number;
  maxSlopeDeg: number;
  averageSlopeDeg: number;
  riskScore: number;
  scienceStops: string[];
};

type RouteResult = {
  profile: RouteProfile;
  cells: Array<{ row: number; col: number }>;
  metrics: RouteMetrics;
  explanation: string[];
};
```

Archivos mínimos:

- `public/data/terrain-grid.json` o una cuadrícula binaria preparada.
- `public/data/terrain-metadata.json`.
- `public/data/science-points.json`.
- `public/data/hazards.json`.
- `public/data/mission.json`.

Cada dataset debe indicar fuente, producto, misión, resolución, cobertura, fecha o versión, sistema de coordenadas y si es real, calculado o simulado.

## 6. Estructura recomendada

```text
src/
  algorithms/
    astar.ts
    slope.ts
    terrainCost.ts
    routeMetrics.ts
    routeProfiles.ts
  components/
    MarsMap/
    MissionPlanner/
    LayerControl/
    RoutePanel/
    RouteComparison/
    MissionDashboard/
    MissionReport/
  features/
    explorer/
    terrain/
    hazards/
    science/
    navigation/
  services/
    dataLoader.ts
    demLoader.ts
    routeService.ts
  types/
    terrain.ts
    route.ts
    mission.ts
    science.ts
```

## 7. Criterios de aceptación del MVP

- El usuario puede elegir origen y destino en el mapa.
- El sistema calcula al menos una ruta válida sobre la cuadrícula.
- Las celdas bloqueadas nunca forman parte de una ruta.
- La ruta cambia al modificar el perfil o los pesos.
- Se pueden mostrar al menos tres alternativas: segura, rápida y científica.
- Las alternativas tienen métricas comparables.
- La ruta científica puede visitar varios objetivos mediante tramos consecutivos.
- La interfaz identifica los segmentos de mayor pendiente y riesgo.
- El usuario puede entender por qué se recomienda una ruta.
- Los metadatos y fuentes son visibles.
- Si no hay solución, se muestra un mensaje accionable.
- La misión se puede guardar y recuperar desde `localStorage`.
- El mapa y la planificación funcionan sin backend.

## 8. Orden de entrega

1. Definir tipos y datos de prueba pequeños.
2. Implementar el mapa y la selección de puntos.
3. Cargar la cuadrícula y pintar pendiente/transitabilidad.
4. Implementar A* y pruebas unitarias de vecinos, bloqueos y diagonales.
5. Añadir perfiles y métricas.
6. Dibujar y comparar varias rutas.
7. Añadir objetivos científicos y ruta por tramos.
8. Añadir guardado, explicación y reporte.
9. Sustituir datos de prueba por el dataset documentado de Jezero.
10. Añadir 3D solo después de validar el flujo 2D.

## 9. Resultado de la demostración

La demostración debe mostrar una misión completa:

1. Se seleccionan origen, destino y dos objetivos científicos.
2. Se activan pendiente, riesgos y geología.
3. Se calculan las rutas segura, rápida y científica.
4. Se comparan sus métricas.
5. Se selecciona la ruta equilibrada o segura.
6. Se explica qué obstáculos evita, qué ciencia permite realizar y qué supuestos utiliza.

El éxito del proyecto se mide por la calidad de esa decisión de navegación y por la trazabilidad de los datos, no por la cantidad de capas o por una visualización 3D aislada.

