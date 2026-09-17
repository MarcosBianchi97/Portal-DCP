# CLAUDE.md

Este archivo le da indicaciones a Claude Code (claude.ai/code) para trabajar con el código de este repositorio.

## Qué es esto

Sitio web institucional estático de **Defensa Civil de Santiago del Estero** (Argentina). Es una sola página HTML, sin herramientas de build, sin gestor de paquetes y sin framework — HTML/CSS/JS plano, con un reskin de Bootstrap 5 que aplica la identidad navy/rojo del organismo.

## Cómo correrlo

El repositorio no tiene configuración de build ni de servidor de desarrollo. Se puede abrir `index.html` directamente en el navegador, o servir la carpeta con cualquier servidor de archivos estáticos (por ejemplo `python3 -m http.server`) desde la raíz del proyecto para que resuelvan bien las rutas relativas a `css/`, `js/`, `img/` y `data/`. No existen comandos de instalación, build, lint ni tests.

## Estructura

- `index.html` — todo el sitio, una sola página con secciones ancladas en este orden: `#inicio` (hero), `#balance` (Estadísticas), Noticias (sin ancla propia), `#alertas`, `#institucional`, `#prevencion` (Servicios), `#contacto`. El navbar y el footer siguen ese mismo orden. Este orden fue definido explícitamente por el cliente y no responde a una convención técnica — respetarlo al agregar o mover secciones.
- `css/style.css` — reskin de Bootstrap 5 mediante variables CSS personalizadas (ver más abajo), más estilos de componentes por sección.
- `js/script.js` — solo maneja el botón de "volver arriba". Un comentario en el archivo aclara que el menú móvil, el scrollspy del navbar y el carrusel de noticias los maneja Bootstrap con sus propios atributos de datos (`data-bs-toggle`, `data-bs-spy`, `data-bs-ride`), no JS propio.
- `js/balance.js` — hace fetch de `data/datos.json` y arma la sección "Balance": tres totales anuales (`relevamientos`, `familias_asistidas`, `reportes`) y un gráfico de barras con Chart.js, intercambiable mediante el `<select>` `#stat-metric`.
- `data/datos.json` — el único archivo de datos del proyecto. Está organizado por año (actualmente `"2026"`), con un array de 12 objetos mensuales con los campos `mes`, `relevamientos`, `familias_asistidas`, `reportes`. El propio campo `_instrucciones` del archivo indica que estos son **valores de ejemplo/placeholder** a reemplazar por los datos reales — no tratar estos números como datos reales, y no renombrar los campos (`balance.js` los lee por su nombre exacto).
- `img/` — logo y mapa de referencia.

## Dependencias externas (todas vía CDN, sin copias locales)

- Bootstrap 5.3.3 (CSS + JS bundle, incluye Popper)
- Chart.js 4.4.4
- Google Fonts: Barlow Condensed (títulos/display), Source Sans 3 (texto de cuerpo), IBM Plex Mono (etiquetas/eyebrows/acentos monoespaciados)

## Sistema de diseño (`:root` en css/style.css)

Las variables propias de Bootstrap se sobrescriben mediante custom properties en vez de recompilar Sass:
- `--navy-900`…`--navy-500`: paleta institucional principal (de navy oscuro a más claro).
- `--red-alert` / `--red-alert-dark`: color de acento/peligro/emergencia, mapeado a `--bs-danger`. `--bs-primary` se mapea por separado a `--navy-700`.
- `--alert-green/yellow/orange/red`: los cuatro colores de la escala de alertas en la sección "Alertas", independientes del color danger de Bootstrap.
- Dos familias tipográficas: `--font-display` (Barlow Condensed, títulos) y `--font-mono` (IBM Plex Mono, usada en eyebrows, etiquetas de estadísticas, códigos de nivel de alerta y líneas de contacto).

Al editar estilos, conviene extender estas variables en lugar de hardcodear colores nuevos, y mantener la identidad institucional navy/rojo consistente en todas las secciones.

## Modelo de contenido / convenciones de edición

- **Para actualizar los números de "Balance"**: editar únicamente `data/datos.json` — nunca modificar `js/balance.js` para cambios de datos (esto se aclara explícitamente en un comentario al inicio de ese archivo). Mantener los 12 meses presentes y no cambiar el nombre de los campos.
- El carrusel de noticias (carrusel de Bootstrap, `#newsCarousel`) actualmente tiene contenido de ejemplo, con divs placeholder `[ Espacio para imagen ... ]` donde deberían ir las fotos reales de los operativos.
- Todo el copy de la página está en español (Argentina, `lang="es"`), escrito con la voz institucional de un organismo de defensa civil (enfoque en prevención, mitigación y respuesta). Mantener el copy nuevo consistente con ese tono e idioma.
- Los íconos son SVGs inline (estilo Feather, basados en trazo, dimensionados con la clase `.icon`) en vez de una librería o fuente de íconos — seguir el mismo patrón (viewBox 0 0 24 24, `stroke="currentColor"`, `fill="none"`) al agregar íconos nuevos.
