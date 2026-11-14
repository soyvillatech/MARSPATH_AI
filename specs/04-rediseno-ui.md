# SPEC-003 — MarsPath AI: Rediseño UI Map-First

**Proyecto:** MarsPath AI  
**Tipo:** Refactorización visual exclusivamente  
**Alcance:** Frontend — UI/UX y layout  
**Dependencias:** SPEC-001 y SPEC-002 (ya implementados)  
**Prioridad:** Alta

## 1. Objetivo

Rediseñar exclusivamente la interfaz de MarsPath AI para convertirla en una experiencia **Map-First**, inspirada en la simplicidad de Google Maps.

El mapa debe ocupar el 100% del viewport del navegador, mientras que todos los controles, formularios, resultados y herramientas existentes deben aparecer como elementos flotantes sobre el mapa.

**Este SPEC no solicita desarrollar funcionalidades nuevas.**

Las funcionalidades de búsqueda, selección de origen y destino, cálculo de rutas, análisis de peligros, comparación de alternativas y gestión de capas ya están implementadas.

La tarea consiste únicamente en mejorar cómo se presentan y cómo accede el usuario a ellas.

## 2. Restricción principal

**NO MODIFICAR LA LÓGICA EXISTENTE.**

Queda prohibido modificar:

- Algoritmos de cálculo de rutas.
- Lógica de selección de origen y destino.
- APIs y endpoints.
- Backend.
- Integración NASA Mars Trek WMTS.
- Cálculos de pendientes y riesgos.
- Datos geoespaciales.
- Modelos y estructuras de datos.
- Funciones de recomendación de rutas.
- Validaciones existentes.
- Estados de negocio y reglas de funcionamiento.

Se permite modificar únicamente:

- Componentes visuales.
- CSS, Tailwind o estilos equivalentes.
- Layout.
- Posicionamiento.
- Jerarquía visual.
- Presentación de información.
- Animaciones y transiciones.
- Comportamiento visual de modales, popovers y paneles.
- Adaptación responsive.

Si un componente contiene lógica de negocio, conservarla intacta y modificar solo su representación visual.

## 3. Mapa a pantalla completa

El mapa debe ser el elemento principal de la aplicación.

### Requisitos

- Ocupar el 100% del ancho del navegador.
- Ocupar el 100% del alto visible del navegador.
- No tener márgenes exteriores.
- No estar dentro de una tarjeta.
- No estar limitado por columnas.
- No compartir espacio con un sidebar permanente.
- No tener un header que reduzca su altura.
- No producir scroll global.

El mapa debe permanecer montado mientras el usuario abre o cierra paneles.

### Estructura visual

```text
Viewport 100vw × 100dvh
│
├── Mapa NASA — Fullscreen
│
└── Capa de interfaz flotante
    ├── Buscador / Planificador
    ├── Resultados de rutas
    ├── Selector de capas
    ├── Controles del mapa
    ├── Información de peligros
    ├── Leyenda
    └── Modales y notificaciones
```

Todos los componentes deben superponerse al mapa sin modificar su tamaño.

## 4. Eliminar menú lateral izquierdo

Eliminar completamente el sidebar de navegación actual.

No reemplazarlo por otro menú lateral permanente.

Las funcionalidades que antes se encontraban en ese menú deben seguir siendo accesibles mediante controles flotantes, botones contextuales o modales.

No eliminar los componentes funcionales ni sus conexiones.

Solo eliminar la estructura visual del menú lateral.

## 5. Buscador y planificador flotante

### Ubicación

Esquina superior izquierda.

### Apariencia

- Panel compacto.
- Fondo oscuro semitransparente.
- Bordes redondeados.
- Sombra discreta.
- Tipografía legible.
- Iconos sencillos.

### Contenido

Reutilizar los componentes existentes de:

- Origen.
- Destino.
- Búsqueda.
- Selección de coordenadas.
- Botón de cálculo de rutas.

No modificar su funcionamiento.

### Comportamiento visual

El panel debe poder expandirse y contraerse.

En estado compacto, mostrar solo los controles esenciales.

En estado expandido, mostrar los campos existentes.

No debe ocupar una gran parte de la pantalla de forma permanente.

## 6. Resultados de rutas flotantes

Reubicar el componente actual de resultados.

### Escritorio

Mostrar una tarjeta flotante debajo del planificador o en una zona lateral que no obstaculice innecesariamente el mapa.

### Móvil

Mostrar un bottom sheet.

### Requisitos

- Mantener las rutas y métricas existentes.
- Conservar las acciones actuales.
- Mejorar la legibilidad.
- Utilizar tarjetas compactas.
- Permitir contraer y expandir.
- Evitar tablas extensas permanentemente visibles.
- Mantener una jerarquía visual clara para la ruta recomendada.

No recalcular métricas ni alterar la selección de rutas.

## 7. Selector de capas flotante

Ubicar el selector existente en la esquina superior derecha.

Utilizar un botón con icono de capas.

Al hacer clic, abrir un popover o pequeño panel.

Conservar exactamente:

- Capas disponibles.
- Estados de activación.
- Comportamiento de selección.
- Integración con el mapa.

Solo modificar su presentación.

## 8. Herramientas y controles

Agrupar los controles actuales del mapa en una barra flotante compacta.

Ubicación preferida: lado derecho.

Evitar botones duplicados.

Los controles deben:

- Ser fácilmente identificables.
- Tener áreas de clic adecuadas.
- Mantener iconografía consistente.
- Mostrar tooltips cuando sea necesario.
- No tapar información importante del mapa.

## 9. Información de peligros

Reorganizar la visualización de peligros existente.

Los detalles deben mostrarse en tarjetas contextuales, popovers o modales.

### Requisitos

- Conservar los datos originales.
- Conservar las clasificaciones actuales.
- Conservar las acciones existentes.
- Mejorar la presentación de advertencias.
- Evitar paneles grandes siempre abiertos.

No modificar el análisis científico ni la lógica de detección de peligros.

## 10. Modales y paneles secundarios

Utilizar modales para información que no necesita estar permanentemente visible.

Ejemplos:

- Detalles completos de una ruta.
- Comparación avanzada.
- Información científica.
- Configuración existente.
- Ayuda.

Reutilizar el contenido actual.

No crear nuevas funcionalidades dentro de los modales.

Los modales deben:

- Poder cerrarse con un botón visible.
- Respetar la navegación por teclado.
- Tener dimensiones adaptables.
- Mantener el mapa visible al cerrarse.
- No reinicializar el mapa.

## 11. Diseño visual

### Estilo general

Moderno, minimalista y profesional.

Inspiración: Google Maps, adaptado a la identidad visual de MarsPath AI.

Mantener el tema oscuro y los acentos marcianos.

### Colores sugeridos

- Fondo de paneles: `#171B22`.
- Superficie secundaria: `#222832`.
- Acento naranja: `#E98A4B`.
- Texto principal: `#F5F5F5`.
- Texto secundario: `#AAB2BE`.

### Componentes

- Bordes redondeados.
- Sombras suaves.
- Espaciado consistente.
- Iconos uniformes.
- Transiciones discretas.
- Buen contraste.
- Botones con estados hover, active y focus.

Evitar elementos decorativos innecesarios.

## 12. Responsive

### Escritorio

- Mapa fullscreen.
- Planificador superior izquierdo.
- Selector de capas superior derecho.
- Herramientas flotantes.
- Resultados colapsables.

### Tablet

- Paneles más compactos.
- Espaciado adaptativo.
- Controles accesibles.

### Móvil

- Mapa fullscreen.
- Buscador compacto arriba.
- Resultados en bottom sheet.
- Controles táctiles.
- Respeto de safe areas.
- Evitar desbordamiento horizontal.

No cambiar la lógica de los componentes según el dispositivo; adaptar únicamente su presentación.

## 13. Experiencia de usuario

El flujo existente debe conservarse.

El usuario debe poder:

1. Abrir la aplicación y ver el mapa completo.
2. Acceder al planificador flotante.
3. Utilizar las funciones existentes de origen y destino.
4. Calcular rutas con el botón actual.
5. Consultar los resultados en un panel flotante.
6. Inspeccionar peligros sin abandonar el mapa.
7. Cambiar capas mediante un control flotante.

La mejora consiste en reducir la cantidad de elementos visibles simultáneamente y facilitar el acceso a cada función.

## 14. Arquitectura visual sugerida

```text
MarsPathApp
│
└── MapFirstLayout
    │
    ├── ExistingMapComponent
    │
    └── FloatingUI
        ├── ExistingSearchComponent
        ├── ExistingRoutePlanner
        ├── ExistingRouteResults
        ├── ExistingLayerSelector
        ├── ExistingMapControls
        ├── ExistingHazardPanel
        └── ExistingModals
```

Los nombres son conceptuales.

Inspeccionar la estructura real del proyecto antes de modificar archivos.

No duplicar componentes que ya existen.

## 15. Reglas de implementación

1. Inspeccionar el frontend actual.
2. Identificar componentes visuales y lógica asociada.
3. Eliminar el layout del sidebar.
4. Crear el contenedor de mapa fullscreen.
5. Reubicar los componentes existentes como overlays.
6. Aplicar estilos consistentes.
7. Implementar estados visuales de expansión y contracción.
8. Adaptar la interfaz a móvil y escritorio.
9. Comprobar que las funciones existentes siguen funcionando.

### Restricciones adicionales

- No reescribir componentes completos innecesariamente.
- No cambiar nombres de propiedades o contratos públicos.
- No modificar hooks de negocio.
- No cambiar servicios ni llamadas API.
- No alterar cálculos.
- No sustituir componentes funcionales por maquetas.
- No introducir datos ficticios.
- No instalar dependencias innecesarias.

## 16. Criterios de aceptación

- [ ] El mapa ocupa el 100% de la ventana.
- [ ] Se eliminó el sidebar izquierdo.
- [ ] No existe header permanente que reduzca el mapa.
- [ ] Los componentes flotan sobre el mapa.
- [ ] El buscador funciona igual que antes.
- [ ] El selector de origen y destino funciona igual que antes.
- [ ] El cálculo de rutas funciona igual que antes.
- [ ] Los resultados conservan sus datos y acciones.
- [ ] El selector de capas funciona igual que antes.
- [ ] El análisis de peligros sigue funcionando.
- [ ] Los paneles pueden expandirse y contraerse.
- [ ] La interfaz funciona en escritorio y móvil.
- [ ] No aparecen scrolls innecesarios.
- [ ] El mapa no se reinicializa al abrir paneles.
- [ ] No se modificaron servicios ni algoritmos.
- [ ] No se introdujeron regresiones funcionales.

## 17. Entregables

Al finalizar, el agente debe proporcionar:

- Resumen de los cambios visuales.
- Lista de archivos modificados.
- Componentes reutilizados.
- Capturas de escritorio y móvil, si dispone de herramientas para generarlas.
- Resultado de las pruebas de regresión.
- Confirmación de que no se modificó la lógica de negocio.

## 18. Instrucción final

**Implementa únicamente el rediseño visual de MarsPath AI.**

Transforma el layout actual en una experiencia Map-First a pantalla completa, elimina el sidebar izquierdo y convierte los componentes existentes en controles flotantes, paneles colapsables y modales.

Conserva intactas todas las funcionalidades implementadas en SPEC-001 y SPEC-002.

No agregues nuevas funcionalidades, no modifiques algoritmos y no alteres los datos.

**El resultado debe ser una interfaz intuitiva, limpia y centrada completamente en el mapa, similar en facilidad de uso a Google Maps, pero manteniendo la identidad de MarsPath AI.**