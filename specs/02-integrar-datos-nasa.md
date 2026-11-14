# SPEC-001: Integración de mapas reales NASA Mars Trek WMTS

**Proyecto:** MarsPath AI  
**Tipo de tarea:** Modificación de funcionalidad existente  
**Prioridad:** Alta  
**Alcance:** Exclusivamente el sistema de mapas y sus capas visuales  
**Restricción principal:** No rediseñar la aplicación ni modificar el motor de rutas.

---

## 1. Objetivo

Reemplazar el fondo cartográfico simulado del módulo **Explorador marciano** por imágenes orbitales reales del cráter Jezero, obtenidas directamente desde los servicios WMTS oficiales de NASA Mars Trek.

La integración debe funcionar bajo demanda, solicitando únicamente las teselas necesarias para visualizar la región seleccionada.

**No descargar mosaicos GeoTIFF completos.**

## 2. Estado actual

La aplicación MarsPath AI ya dispone de una interfaz funcional con:

- Menú lateral de módulos de misión.
- Explorador marciano.
- Visualizador de mapas.
- Panel de configuración de rutas.
- Selección de origen y destino.
- Capas científicas activables.
- Botón «Calcular ruta».
- Visualización de rutas.
- Indicadores y paneles de misión.

Se debe conservar todo lo anterior.

El único cambio solicitado es sustituir la representación visual ficticia del terreno por mapas reales de NASA.

## 3. Fuentes de datos autorizadas

Utilizar exclusivamente NASA Mars Trek.

Documentación oficial:

https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars

### Capa 1: HiRISE Jezero

**Nombre:** MRO HiRISE, Jezero Mosaic, Controlled

**Layer ID:**

`JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd`

**Resolución nominal:** 25 cm/píxel.

**Bounding box:**

- Longitud mínima: 77.2229331
- Latitud mínima: 18.3067994
- Longitud máxima: 77.583964
- Latitud máxima: 18.669315

**Uso:** Capa principal de imágenes de alta resolución.

### Capa 2: CTX Jezero

**Nombre:** MRO CTX, Jezero Mosaic, Controlled

**Layer ID:**

`JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0`

**Resolución nominal:** 6 m/píxel.

**Bounding box:**

- Longitud mínima: 77.1604655
- Latitud mínima: 18.2110274
- Longitud máxima: 77.6991776
- Latitud máxima: 18.7211945

**Uso:** Mapa de contexto para explorar una región más amplia.

### Capa 3: MOLA Global

**Layer ID:**

`Mars_MGS_MOLA_ClrShade_merge_global_463m`

**Resolución nominal:** 463 m/píxel.

**Uso:** Mapa de relieve global como capa de respaldo o contexto.

**Importante:** MOLA Color Hillshade es una representación visual del relieve, no un servicio de elevación numérica para A*.

## 4. Integración WMTS

Utilizar el protocolo OGC WMTS proporcionado por NASA.

La estructura documentada para las teselas es:

`https://{WMTS endpoint}/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.{extension}`

### Requisitos

1. Consultar el GetCapabilities de cada capa.
2. Obtener el endpoint real de NASA.
3. Identificar Style, TileMatrixSet y TileMatrix.
4. Obtener la extensión correcta de ResourceURL.
5. Identificar los niveles de zoom soportados.
6. Respetar TileMatrixLimits y la cobertura geográfica.
7. Solicitar las teselas dinámicamente.
8. No inventar endpoints ni asumir que todas las capas usan el mismo TileMatrixSet.

No considerar un endpoint como válido hasta comprobar que responde con una imagen real.

Si el GetCapabilities no está disponible, mostrar un error controlado y conservar el resto de la aplicación operativa.

## 5. Integración con el mapa existente

Inspeccionar primero el código actual para identificar qué biblioteca y componentes utiliza el visualizador.

Si ya utiliza Leaflet, reutilizar su instancia.

Si utiliza otro motor cartográfico, evaluar primero si admite WMTS sin reemplazarlo.

No instalar una biblioteca nueva innecesariamente.

### Requisitos cartográficos

- Centrar inicialmente el mapa en Jezero.
- Centro aproximado: latitud 18.44°, longitud 77.45° E.
- Utilizar un sistema de coordenadas compatible con la cartografía marciana.
- No asumir que los servicios NASA utilizan Web Mercator terrestre EPSG:3857.
- Configurar la proyección, origen, resoluciones y límites de las matrices según GetCapabilities.
- Conservar la correspondencia espacial entre mapa, marcadores y rutas.
- No modificar arbitrariamente las coordenadas de origen y destino existentes.

Si Leaflet requiere Proj4Leaflet u otro adaptador, incorporarlo únicamente cuando sea necesario y documentar su configuración.

## 6. Selector de capas

Integrar las tres capas en el selector actual.

| Nombre visible | Fuente |
|---|---|
| HiRISE — Alta resolución | NASA Mars Trek |
| CTX — Vista regional | NASA Mars Trek |
| MOLA — Relieve global | NASA Mars Trek |

### Comportamiento

- HiRISE será la capa preferida cuando exista cobertura.
- CTX permitirá visualizar una región más amplia.
- MOLA servirá como mapa de contexto.
- El usuario podrá cambiar de capa sin reiniciar la página.
- Conservar la posición y el zoom cuando sea compatible.
- Evitar mostrar simultáneamente dos fondos opacos.
- Mantener los controles de capas científicas existentes.

Si una región carece de imágenes HiRISE, utilizar CTX como respaldo cuando exista cobertura.

## 7. Mantener el sistema de rutas

**No modificar el algoritmo de rutas actual.**

Conservar:

- Selección de origen.
- Selección de destino.
- Ruta segura.
- Ruta rápida.
- Ruta científica.
- Botón «Calcular ruta».
- Marcadores.
- Puntos científicos.
- Zonas de peligro.
- Paneles de información.

Las rutas y marcadores deben seguir siendo visibles encima del mapa real.

Si las rutas actuales son simuladas, mantener su estado de simulación. No presentarlas como rutas calculadas a partir de elevaciones reales.

No utilizar los colores de las imágenes HiRISE o CTX como si fueran valores de elevación.

## 8. Diseño e interfaz

Preservar el diseño original de MarsPath AI.

No modificar:

- Sidebar.
- Header.
- Paleta de colores.
- Tipografías.
- Panel derecho de misión.
- Botones existentes.
- Iconografía.
- Estructura de navegación.
- Componentes ajenos al mapa.

Mantener el estilo oscuro con acentos naranjas.

El mapa debe adaptarse al contenedor existente sin alterar sus dimensiones.

Añadir únicamente los indicadores mínimos necesarios para informar sobre la carga de datos.

## 9. Rendimiento

- Cargar teselas bajo demanda.
- Reutilizar la caché HTTP del navegador.
- Cancelar o ignorar solicitudes obsoletas al cambiar de capa.
- Evitar solicitudes fuera de cobertura.
- Evitar recargar el mapa completo al cambiar un marcador.
- Mostrar un indicador discreto mientras se cargan las teselas.
- No almacenar mosaicos completos en el repositorio.

## 10. Manejo de errores

Contemplar:

- Servicio NASA temporalmente no disponible.
- Error HTTP.
- Tesela inexistente.
- Región fuera de cobertura.
- Nivel de zoom no disponible.
- Error de CORS.
- GetCapabilities inválido o inaccesible.

Mostrar un mensaje como:

«No se pudo cargar la cartografía NASA para esta región».

Nunca sustituir silenciosamente una imagen real por un mapa ficticio etiquetado como NASA.

## 11. Criterios de aceptación

La implementación se considera terminada cuando:

- [ ] Se visualizan teselas reales de NASA Mars Trek.
- [ ] HiRISE funciona dentro de su cobertura.
- [ ] CTX funciona dentro de su cobertura.
- [ ] MOLA puede utilizarse como mapa de contexto.
- [ ] El mapa está centrado en Jezero.
- [ ] El selector de capas funciona.
- [ ] Los marcadores conservan su posición geográfica.
- [ ] Las rutas existentes aparecen correctamente superpuestas.
- [ ] No se descargan GeoTIFF completos.
- [ ] No se modificó el algoritmo de rutas.
- [ ] No se rediseñó la interfaz.
- [ ] Los errores de carga se gestionan correctamente.
- [ ] La consola no muestra errores críticos.

## 12. Instrucciones para el agente de programación

Antes de escribir código:

1. Inspecciona la estructura del proyecto.
2. Identifica el componente que dibuja el mapa.
3. Identifica la biblioteca cartográfica existente.
4. Identifica cómo se representan rutas, marcadores y capas.
5. Consulta la documentación WMTS oficial de NASA.
6. Determina qué archivos requieren modificaciones.

Después:

1. Implementa un cliente o adaptador WMTS reutilizable.
2. Configura las capas HiRISE, CTX y MOLA.
3. Integra las capas en el visualizador existente.
4. Conecta el selector de capas.
5. Verifica la alineación geográfica.
6. Ejecuta las pruebas disponibles.
7. Comprueba que las funciones anteriores siguen operativas.

**No reescribas componentes completos si basta con cambios localizados.**

**No cambies el motor de rutas, el backend ni los módulos ajenos al mapa.**

Al finalizar, entrega un resumen que indique:

- Archivos modificados.
- Dependencias añadidas, si las hubo.
- Endpoints WMTS realmente verificados.
- Capas que funcionan.
- Problemas pendientes.
- Cómo ejecutar y comprobar la integración.

## 13. Resultado esperado

MarsPath AI debe mantener exactamente su experiencia actual, pero el fondo del Explorador marciano debe mostrar imágenes orbitales reales de Jezero proporcionadas por NASA Mars Trek.

La integración debe quedar preparada para incorporar posteriormente análisis de elevación y rutas científicamente fundamentadas, sin implementarlos en esta tarea.

**Restricción final: cambia únicamente los mapas y las conexiones necesarias para mostrarlos. Todo lo demás debe permanecer intacto.**