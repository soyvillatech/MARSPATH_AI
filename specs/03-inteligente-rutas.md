# SPEC-002 — MarsPath AI: Motor inteligente de rutas marcianas

**Proyecto:** MarsPath AI  
**Dependencia:** SPEC-001 — Integración NASA Mars Trek WMTS  
**Tipo:** Ampliación funcional del MVP  
**Prioridad:** Crítica  
**Área de estudio:** Cráter Jezero, Marte

## 1. Objetivo general

Convertir MarsPath AI en una plataforma interactiva de planificación de rutas para exploración marciana.

El usuario debe poder:

1. Seleccionar dinámicamente origen y destino sobre el mapa real de Jezero.
2. Consultar elevaciones reales del terreno.
3. Calcular múltiples rutas entre ambos puntos.
4. Detectar y visualizar peligros del terreno.
5. Comparar las rutas mediante métricas objetivas.
6. Identificar automáticamente la ruta óptima según el objetivo seleccionado.
7. Comprender por qué una ruta es preferible a otra.

**Requisito fundamental:** todos los análisis presentados como reales deben derivarse de datos geográficos auténticos de NASA o USGS, nunca de números aleatorios o rutas dibujadas manualmente.

## 2. Integración con SPEC-001

Conservar la integración cartográfica definida anteriormente:

- NASA Mars Trek WMTS.
- HiRISE Jezero, 25 cm/píxel.
- CTX Jezero, 6 m/píxel.
- MOLA como mapa de contexto.
- Sistema de coordenadas marciano.
- Visualización con Leaflet o la biblioteca existente.
- Diseño original de la aplicación.

El SPEC-001 proporciona la cartografía visual.

El SPEC-002 incorpora los datos de elevación, el análisis de riesgos y el cálculo de rutas.

No reconstruir la interfaz desde cero.

## 3. Alcance geográfico del MVP

Trabajar inicialmente con una región pequeña de Jezero, aproximadamente 2 × 2 km.

El área exacta debe seleccionarse después de comprobar:

- Cobertura del DEM.
- Disponibilidad de imágenes orbitales.
- Ausencia de valores de elevación inválidos.
- Compatibilidad de coordenadas.
- Presencia de características topográficas útiles para comparar rutas.

La región de trabajo debe estar completamente cubierta por datos reales.

No habilitar el cálculo de rutas fuera de la región procesada.

Mostrar visualmente los límites del área analizable.

## 4. Fuentes de datos oficiales

### 4.1 NASA Mars Trek — imágenes

Documentación:

https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars

Capas:

**HiRISE**

`JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd`

**CTX**

`JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0`

Utilizar WMTS para mostrar imágenes sin descargar mosaicos completos.

### 4.2 USGS / NASA — elevación

Producto de referencia:

`M20_JezeroCrater_CTXDEM_20m.tif`

URL del producto:

https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif

El acceso y la integridad del archivo deben verificarse antes de utilizarlo.

Este DEM es la fuente propuesta para calcular:

- Elevaciones.
- Pendientes.
- Desniveles.
- Rugosidad topográfica estimada.
- Costos de desplazamiento.

No utilizar imágenes de relieve sombreado como sustitutos de elevaciones numéricas.

### 4.3 USGS-NASA — geología

Portal:

https://www.usgs.gov/special-topics/planetary-geologic-mapping

Utilizar unidades geológicas y puntos científicos únicamente si se obtiene un producto georreferenciado adecuado para el área de estudio.

No inventar categorías geológicas ni ubicaciones de interés.

## 5. Preparación de datos

Implementar un pipeline de procesamiento geoespacial.

Herramientas sugeridas:

- Python.
- Rasterio o GDAL.
- NumPy.
- FastAPI.

### Procedimiento

1. Obtener el DEM oficial.
2. Validar el sistema de referencia y los metadatos.
3. Seleccionar una región de aproximadamente 2 × 2 km.
4. Recortar el DEM a esa región.
5. Preservar las elevaciones originales y los valores NoData.
6. Transformar el recorte a una cuadrícula de análisis.
7. Calcular pendientes y características topográficas.
8. Generar una máscara de celdas válidas.
9. Guardar los resultados en un formato compacto.

El archivo original puede procesarse una sola vez durante la preparación del proyecto.

No debe descargarse nuevamente por cada solicitud del usuario.

### Restricciones

- No usar elevaciones ficticias.
- No reemplazar NoData por cero.
- No interpolar grandes zonas sin información.
- No confundir resolución del DEM con precisión absoluta.
- No utilizar distancias terrestres sin considerar el radio de Marte.

## 6. Selección dinámica de origen y destino

Modificar el módulo existente de configuración de rutas.

### Métodos de selección

**Método A: selección sobre el mapa**

- Clic para establecer origen.
- Segundo clic para establecer destino.
- Permitir arrastrar ambos marcadores.
- Actualizar coordenadas automáticamente.

**Método B: entrada manual**

- Latitud.
- Longitud.
- Botón para localizar el punto.

**Método C: puntos predefinidos**

Ofrecer puntos de demostración únicamente cuando sus coordenadas hayan sido verificadas dentro del área cubierta.

### Validaciones

- Los puntos deben estar dentro del DEM.
- Los puntos deben corresponder a celdas válidas.
- No permitir origen y destino idénticos.
- Advertir si el punto está en una zona clasificada como no transitable.
- No mover silenciosamente un punto elegido por el usuario.

Al cambiar origen o destino, invalidar las rutas anteriores y permitir un nuevo cálculo.

## 7. Análisis de peligros del terreno

Implementar un módulo que derive peligros de datos reales.

### Peligro 1: pendientes pronunciadas

**Fuente:** DEM oficial.

Calcular la pendiente mediante diferencias de elevación y distancia horizontal.

Clasificación inicial configurable:

| Pendiente | Clasificación |
|---|---|
| 0–5° | Baja |
| Mayor de 5° hasta 10° | Moderada |
| Mayor de 10° hasta 15° | Alta |
| Mayor de 15° | Muy alta |

Estos valores son umbrales experimentales del MVP, no límites certificados de movilidad de Perseverance.

### Peligro 2: terreno topográficamente irregular

**Fuente:** DEM oficial.

Calcular una medida local de variación del relieve.

Ejemplos:

- Desviación estándar de elevaciones.
- Variación de pendientes.
- Diferencias de altura entre celdas vecinas.

Etiquetar el resultado como **rugosidad topográfica estimada**.

No afirmar que el DEM de 20 metros permite detectar rocas individuales.

### Peligro 3: depresiones y cambios bruscos de relieve

**Fuente:** DEM oficial.

Detectar:

- Cambios pronunciados de pendiente.
- Depresiones topográficas.
- Bordes de relieve relevantes a la resolución disponible.

Presentarlos como indicadores de riesgo potencial, no como grietas o precipicios confirmados.

### Peligro 4: materiales o unidades geológicas

**Fuente:** mapas geológicos USGS-NASA.

Cuando exista una capa georreferenciada compatible:

- Identificar las unidades geológicas.
- Mostrar su clasificación original.
- Registrar la fuente y la leyenda.
- Permitir inspeccionar cada unidad.

No atribuir automáticamente un nivel de peligro a una unidad geológica sin una regla justificada.

### Peligro 5: rocas y obstáculos pequeños

No implementar detección automática de rocas en la primera versión.

HiRISE puede aportar contexto visual de alta resolución, pero identificar obstáculos requiere un procedimiento de análisis de imágenes adicional y validado.

No afirmar que un terreno está libre de rocas por no detectarlas.

## 8. Motor de rutas A*

Implementar un motor de búsqueda sobre la cuadrícula derivada del DEM.

### Grafo

- Cada celda válida representa un nodo.
- Conectividad de 8 vecinos.
- Distancias calculadas en metros marcianos.
- Movimientos diagonales controlados para evitar atravesar esquinas bloqueadas.
- Celdas NoData no transitables.
- Restricciones configurables de pendiente.

### Costo de movimiento

Definir una función:

`C = d × (1 + αP + βR) + γG`

Donde:

- `d`: distancia horizontal recorrida.
- `P`: penalización por pendiente.
- `R`: penalización por rugosidad topográfica.
- `G`: penalización geológica, únicamente si existen datos suficientes.
- `α`, `β`, `γ`: pesos configurables y no negativos.

Normalizar las penalizaciones para que las unidades sean consistentes.

Aplicar una función de costo no negativa.

Usar una heurística admisible para A* y verificar que el algoritmo devuelve la ruta de menor costo para la configuración seleccionada.

## 9. Generación de múltiples rutas

El sistema debe producir hasta tres rutas alternativas cuando sean viables.

### Ruta A — Menor distancia

Priorizar la distancia recorrida.

No ignorar restricciones absolutas de transitabilidad.

### Ruta B — Menor exposición al riesgo

Penalizar fuertemente pendientes pronunciadas y rugosidad elevada.

Puede recorrer una distancia mayor.

### Ruta C — Equilibrada

Balancear distancia, pendiente y rugosidad.

Utilizar pesos intermedios documentados.

### Requisitos

- Calcular rutas con el algoritmo, no dibujarlas manualmente.
- Evitar mostrar rutas idénticas como alternativas diferentes.
- Detectar cuando no exista una ruta válida.
- No garantizar siempre tres alternativas.
- Permitir visualizar las rutas simultáneamente.
- Resaltar la alternativa recomendada.

Si se requieren rutas geométricamente diferentes, utilizar un método de generación de alternativas como K-shortest paths o penalización controlada de rutas anteriores.

## 10. Selección de ruta óptima

La palabra «óptima» debe referirse a una función objetivo explícita.

No existe necesariamente una única ruta óptima para todos los criterios.

### Modo ruta rápida

Seleccionar la ruta de menor distancia, o de menor tiempo estimado si existe un modelo de velocidad fundamentado.

### Modo ruta segura

Seleccionar la ruta con menor costo de riesgo según los pesos y restricciones configurados.

### Modo ruta equilibrada

Seleccionar la ruta con menor costo combinado.

### Explicación de la recomendación

Mostrar un texto generado a partir de métricas calculadas, por ejemplo:

«Esta ruta se recomienda porque reduce la exposición a pendientes pronunciadas, aunque incrementa la distancia recorrida».

No utilizar métricas inventadas.

## 11. Comparación de rutas

Agregar al panel derecho una sección de comparación.

Para cada ruta mostrar:

- Distancia total en metros.
- Desnivel positivo acumulado.
- Desnivel negativo acumulado.
- Pendiente máxima estimada.
- Pendiente media.
- Porcentaje de recorrido en zonas de riesgo alto.
- Costo total de la función objetivo.
- Fuente y resolución del DEM utilizado.

Mostrar el tiempo estimado únicamente si se dispone de un modelo de velocidad explícito.

No inventar velocidades del rover.

## 12. Visualización de peligros

Añadir capas superpuestas al mapa real:

- Mapa de pendientes.
- Rugosidad topográfica.
- Celdas restringidas.
- Zonas de riesgo potencial.
- Rutas alternativas.
- Puntos científicos verificados.

### Colores propuestos

- Verde: riesgo topográfico bajo.
- Amarillo: riesgo moderado.
- Naranja: riesgo alto.
- Rojo: riesgo muy alto.
- Gris: información insuficiente.

Al seleccionar una zona, mostrar:

- Coordenadas.
- Elevación, si está disponible.
- Pendiente estimada.
- Categoría de riesgo.
- Fuente de datos.
- Resolución del análisis.

Distinguir siempre datos medidos de indicadores derivados.

## 13. Interfaz de usuario

Conservar la apariencia actual de MarsPath AI.

### Panel de configuración de ruta

Agregar:

- Botón «Seleccionar origen en el mapa».
- Botón «Seleccionar destino en el mapa».
- Campos de coordenadas editables.
- Selector de objetivo.
- Botón «Calcular rutas».

### Panel de resultados

Agregar:

- Tres tarjetas de rutas, cuando existan.
- Identificación de ruta recomendada.
- Comparación de métricas.
- Explicación de la recomendación.
- Botón para centrar la ruta seleccionada.

### Capas científicas

Integrar:

- HiRISE.
- CTX.
- MOLA.
- Pendientes.
- Rugosidad.
- Riesgos topográficos.
- Unidades geológicas, si están disponibles.

No rediseñar sidebar, header ni paneles existentes.

## 14. Backend API

Implementar endpoints sugeridos:

### GET /api/terrain/metadata

Devuelve:

- Fuente del DEM.
- Resolución.
- Cobertura geográfica.
- Sistema de coordenadas.
- Fecha o versión del producto, cuando esté disponible.

### GET /api/terrain/point

Parámetros:

`lat`, `lon`

Devuelve elevación y métricas del terreno en una ubicación válida.

### GET /api/hazards

Devuelve zonas de riesgo calculadas dentro de un área solicitada.

Utilizar GeoJSON o una representación raster compacta.

### POST /api/routes/calculate

Entrada:

```json
{
  "origin": {
    "lat": 18.44,
    "lon": 77.45
  },
  "destination": {
    "lat": 18.445,
    "lon": 77.455
  },
  "objective": "balanced",
  "alternatives": 3
}
```

Las coordenadas son ejemplos de formato, no puntos de misión validados.

Salida:

```json
{
  "status": "success",
  "recommended_route_id": "route_2",
  "routes": [],
  "data_source": {
    "provider": "USGS/NASA",
    "product": "M20_JezeroCrater_CTXDEM_20m",
    "resolution_m": 20
  }
}
```

Cada elemento de `routes` debe contener:

- ID.
- Geometría GeoJSON.
- Tipo de ruta.
- Métricas.
- Costo.
- Advertencias.
- Justificación de recomendación.

No devolver rutas vacías con estado de éxito cuando no exista solución.

## 15. Validación científica

Implementar pruebas para verificar:

1. La elevación procede del DEM original.
2. Las pendientes están calculadas en unidades correctas.
3. La resolución espacial se respeta.
4. Las distancias utilizan coordenadas y dimensiones de Marte.
5. A* evita las celdas restringidas.
6. El algoritmo encuentra una ruta óptima para el costo configurado.
7. Las rutas alternativas no son copias de la misma geometría.
8. Las métricas coinciden con las rutas calculadas.
9. Los peligros visualizados corresponden a datos procesados.
10. Los marcadores y las rutas se alinean con WMTS.
11. Los valores NoData no generan caminos falsos.
12. Las solicitudes fuera de cobertura producen errores claros.

## 16. Estados del sistema

Distinguir claramente:

**Datos reales disponibles:** imágenes y elevaciones oficiales cargadas.

**Análisis derivado:** pendientes y riesgos calculados a partir de esos datos.

**Simulación:** parámetros experimentales del modelo de movilidad.

**Datos no disponibles:** análisis que no puede ejecutarse por falta de información.

Nunca presentar una simulación como observación confirmada por NASA.

## 17. Restricciones de implementación

- No reconstruir el proyecto.
- No eliminar componentes existentes.
- No sustituir datos reales por números aleatorios.
- No dibujar rutas predefinidas.
- No utilizar servicios cartográficos externos.
- No introducir obstáculos ficticios.
- No descargar mosaicos completos en el navegador.
- No utilizar imágenes WMTS como matrices numéricas de elevación.
- No modificar funcionalidades ajenas a la planificación de rutas.
- No afirmar que las rutas están certificadas para operaciones reales de NASA.

## 18. Orden de implementación

### Fase 1 — Cartografía

Completar SPEC-001 y verificar HiRISE, CTX y MOLA.

### Fase 2 — Elevaciones

Procesar el recorte DEM y habilitar consultas de elevación.

### Fase 3 — Selección dinámica

Permitir seleccionar y modificar origen y destino.

### Fase 4 — Riesgos

Calcular pendientes, rugosidad y zonas restringidas.

### Fase 5 — Motor A*

Calcular rutas reales sobre la cuadrícula.

### Fase 6 — Alternativas

Generar y comparar varias rutas.

### Fase 7 — Recomendación

Seleccionar la ruta óptima según el objetivo.

### Fase 8 — Validación

Ejecutar pruebas geoespaciales, algorítmicas y de interfaz.

## 19. Criterios de aceptación del MVP

- [ ] El mapa muestra imágenes reales de NASA.
- [ ] El usuario puede seleccionar origen y destino.
- [ ] Los puntos se validan contra el área disponible.
- [ ] Las elevaciones proceden de un DEM oficial.
- [ ] Las pendientes se calculan a partir del DEM.
- [ ] Se identifican riesgos topográficos reales o derivados.
- [ ] A* calcula rutas dinámicamente.
- [ ] Se muestran alternativas cuando existen.
- [ ] La ruta recomendada minimiza la función objetivo elegida.
- [ ] Se muestran distancias, pendientes y desniveles calculados.
- [ ] Los peligros pueden visualizarse sobre el mapa.
- [ ] Cada análisis identifica su fuente de datos.
- [ ] La interfaz original permanece intacta.
- [ ] No se muestran datos simulados como si fueran observaciones reales.

## 20. Instrucción final al agente

Implementa SPEC-002 como extensión de SPEC-001 dentro del código existente de MarsPath AI.

Inspecciona primero el proyecto y reutiliza los componentes actuales.

Prioriza una demostración funcional y científicamente trazable en una región pequeña de Jezero.

No amplíes la cobertura geográfica hasta que las rutas, las elevaciones y los riesgos estén validados.

Si falta algún dato oficial, identifica exactamente qué funcionalidad queda bloqueada. No sustituyas esa información por valores inventados.

**Resultado esperado: una aplicación capaz de planificar, comparar y explicar rutas marcianas sobre datos reales de NASA y USGS.**