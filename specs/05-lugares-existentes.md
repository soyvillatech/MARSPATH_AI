# SPEC-005 — Agregar nombres de lugares existentes sobre el mapa de Marte

**Proyecto:** MarsPath AI  
**Tipo:** Tarea específica de mejora cartográfica  
**Alcance:** Únicamente agregar etiquetas con nombres de lugares al mapa existente.

## 1. Objetivo

Agregar directamente sobre el mapa de MarsPath AI los nombres de cráteres, regiones y puntos geográficos que ya estén disponibles en los datos del proyecto.

Las etiquetas deben funcionar de manera similar a los nombres de lugares de Google Maps: aparecer sobre el terreno, mantenerse en su ubicación correcta y adaptarse al zoom.

**No crear nuevas funcionalidades ni modificar las existentes.**

## 2. Tarea principal

Inspeccionar los datos, capas, archivos GeoJSON, configuraciones y componentes cartográficos existentes.

Identificar lugares que ya tengan:

- Nombre.
- Coordenadas geográficas.
- Tipo de lugar.
- Fuente de datos, cuando esté disponible.

Utilizar esa información para dibujar etiquetas sobre el mapa.

Priorizar nombres de cráteres, regiones y lugares científicos que ya estén registrados.

**No inventar nombres, coordenadas ni ubicaciones.**

Si no existen datos suficientes, informar qué falta en lugar de generar puntos ficticios.

## 3. Visualización

Cada lugar debe mostrar su nombre directamente sobre el mapa.

Requisitos:

- Etiquetas pequeñas, claras y legibles.
- Texto con contraste sobre las imágenes NASA.
- Posición vinculada a las coordenadas del lugar.
- Sin tarjetas permanentes.
- Sin marcadores grandes innecesarios.
- Sin duplicados.
- Sin bloquear la interacción con el mapa.

Los nombres deben aparecer como parte natural del mapa.

## 4. Comportamiento según zoom

- **Zoom lejano:** mostrar nombres principales.
- **Zoom intermedio:** mostrar nombres regionales disponibles.
- **Zoom cercano:** mostrar puntos y lugares locales existentes.

Evitar que los nombres se superpongan.

Ocultar etiquetas secundarias cuando haya demasiadas.

No mostrar información fuera de la cobertura correspondiente.

## 5. Interacción

Al hacer clic en un nombre, mostrar un popup compacto con la información disponible:

- Nombre del lugar.
- Tipo de lugar.
- Coordenadas.
- Fuente, si existe.

No inventar descripciones ni datos faltantes.

## 6. Integración

Agregar las etiquetas como una capa visual sobre el mapa existente.

Debe funcionar con:

- HiRISE.
- CTX.
- MOLA.
- Rutas existentes.
- Marcadores de origen y destino.
- Capas de peligros.

Las etiquetas no deben interferir con la selección de puntos ni con los controles flotantes.

Mantener el mapa a pantalla completa.

## 7. Restricciones

**No modificar:**

- Algoritmos de rutas.
- Backend.
- APIs existentes.
- Cálculo de peligros.
- Datos DEM.
- Integración WMTS.
- Diseño general.
- Paneles y modales.
- Navegación.
- Funcionalidades existentes.

No instalar dependencias adicionales si la biblioteca cartográfica actual permite implementar las etiquetas.

## 8. Referencia a los SPEC anteriores

Esta tarea debe ser compatible con los SPEC anteriores del proyecto.

**Si existe alguna duda sobre la arquitectura, coordenadas, capas, componentes o comportamiento del mapa, consultar primero:**

- SPEC-001: Integración de mapas NASA.
- SPEC-002: Rutas y análisis de peligros.
- SPEC-003: Interfaz Map-First.
- SPEC-004: Toponimia y anotaciones geográficas.

No volver a implementar lo que ya esté desarrollado.

No ampliar el alcance de esta tarea por información encontrada en otros SPEC.

## 9. Criterios de aceptación

- [ ] Se identificaron los lugares con nombre disponibles en el proyecto.
- [ ] Sus nombres aparecen directamente sobre el mapa.
- [ ] Las etiquetas están geográficamente alineadas.
- [ ] Se adaptan al zoom.
- [ ] No hay nombres duplicados.
- [ ] No interfieren con las rutas.
- [ ] No bloquean los clics del mapa.
- [ ] Funcionan con las capas cartográficas existentes.
- [ ] No se modificaron funcionalidades ajenas.
- [ ] No se inventaron datos.

## 10. Instrucción final al agente

Implementa exclusivamente la visualización de nombres de lugares existentes sobre el mapa de MarsPath AI.

Primero inspecciona los datos y componentes actuales. Reutiliza la información geográfica que ya esté disponible y agrega etiquetas georreferenciadas, discretas y legibles.

Si tienes dudas, consulta los SPEC anteriores antes de modificar código.

**No desarrolles nuevas funcionalidades, no rediseñes la interfaz y no alteres el funcionamiento actual.**

El resultado debe ser el mismo mapa de MarsPath AI, pero con nombres de cráteres, regiones y lugares conocidos visibles directamente sobre el terreno.