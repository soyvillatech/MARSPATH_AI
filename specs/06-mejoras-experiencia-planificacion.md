# SPEC-006 — Mejoras de experiencia para planificación de rutas

## Objetivo

Mejorar la interacción de MarsPath AI sin sobrecargar la interfaz ni alterar los algoritmos existentes.

## Funcionalidades

- Mostrar claramente cuándo se está seleccionando origen o destino.
- Permitir limpiar la planificación actual sin recargar la aplicación.
- Mostrar los detalles de la ruta seleccionada en un modal centrado.
- Exportar la ruta seleccionada en formato GeoJSON.
- Mantener el mapa y las métricas existentes sin recalcular innecesariamente.

## Restricciones

- No modificar el algoritmo de rutas ni el backend.
- No cambiar las métricas, geometrías ni reglas de recomendación.
- Reutilizar el estado y los datos ya disponibles en `usePlanning`.
- Mantener la experiencia Map-First y responsive.

## Criterios de aceptación

- El usuario identifica el modo activo de selección.
- Puede reiniciar origen, destino y resultados desde un control visible.
- Puede consultar el detalle de la ruta seleccionada sin abandonar el mapa.
- Puede descargar la ruta seleccionada como GeoJSON válido.
- La interfaz sigue compilando y las rutas existentes conservan su funcionamiento.
