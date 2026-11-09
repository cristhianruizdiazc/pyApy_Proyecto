# Fase 3 del rediseño — resultados y OpenStreetMap

Fecha: 2026-11-07, America/Asuncion. Estado: **completada en su alcance local**. Guía: [plan de rediseño](rediseno-frontend-2026-11-03.md), [ADR-013](../decisions/ADR-013-frontend-redesign.md) y [referencia fijada](rediseno-fase-0-2026-11-04/REFERENCIA.md). El usuario autoriza iniciar fase 3 si fase 2 no tiene bloqueos; se revisa su cierre del 2026-11-05 y no se encuentran pendientes de aceptación local que impidan avanzar. La medición final, lectores y validación integrada siguen para fase 7.

## Resultado

Resultados con encabezado Fraunces, resumen de coincidencias de la página y alternativas, orden y limpieza de filtros. Tarjetas blancas con borde de 18 px, fotografía 4:3, tipo/muestra, ubicación pública, capacidad, mínimo horario, servicios, valoración únicamente cuando existe, favoritos reales y enlace a ficha. Tarifa por hora, total/duración estimados y disponibilidad comprobada o sin verificar proceden de la API. Las muestras conservan su identificación y no adquieren capacidad de reservar.

Se conservan categorías y filtros del buscador de fase 2, exactas antes de alternativas, sus cuatro etapas y diferencias (distancia, sobreprecio, servicios opcionales, intervalo propuesto), límites del servidor, paginación y guardado explícito de interés. La navegación usa `detailHref`, conservando personas, intervalo alternativo y URL completa de retorno. Se conservan eventos `search_select` y sponsors. El carrusel inicial mantiene desplazamiento táctil/teclado y controles visibles de 44 px.

Leaflet/OpenStreetMap continúa diferido hasta abrirlo. El contenedor presenta título, cantidad de coincidencias cargadas y explicación del alcance. Solo representa exactas de la página, sin mezclar alternativas ni consultar todas las páginas. Desde 1181 px: dos columnas de tarjetas y mapa lateral sticky, proporción 1.62:1. Hasta 1180 px: el control alterna lista/mapa; las alternativas continúan disponibles debajo. Alternar vistas no modifica URL ni dispara otra búsqueda. Los marcadores permiten Enter/Espacio, popup con tarifa/estimación, selección relacionada con tarjeta y enlace a ficha. `ResizeObserver` actualiza Leaflet al cambiar tamaño; el conjunto de coordenadas se memoriza para que seleccionar una tarjeta no vuelva a centrar el mapa.

## Archivos

| Acción | Archivos | Propósito |
| --- | --- | --- |
| Crear | `apps/web/src/SearchPropertyCard.jsx` | Presentación de resultados y estimación compartida con popup |
| Crear | `apps/web/src/results.css` | Composición de resultados, tarjetas, alternativas, carrusel y contenedor de mapa |
| Modificar | `apps/web/src/Home.jsx`, `Map.jsx`, `main.jsx` | Integración, alcance del mapa, selección/teclado, carga de estilos |
| Modificar | `apps/web/src/styles.css`, `marketplace.css`, `site-layout.css` | Retirar 38 selectores exclusivos de resultados; conservar estilos de rutas pendientes y mover utilidad `sr-only`/anchos compartidos |
| Eliminar | `apps/web/src/home-reference.css` | Composición pendiente sustituida por `results.css`; utilidades compartidas preservadas, import retirado |
| Crear | `tests/e2e/redesign-results.spec.js` | Etapas/precios, mapa bajo demanda, filtros/página, favoritos/interés, error, muestras, reflow y Axe con API simulada |
| Modificar | `tests/e2e/progressive-search.spec.js`, `marketplace.spec.js`, `marketplace-integration.spec.js` | Seleccionar fixture reservable para H04 y volver a lista antes de abrir tarjeta tras usar mapa |
| Crear/modificar | Documentos de `.context` | Estado, arquitectura, decisión, guía visual, pruebas, riesgos e informe |

Se conserva `ui.jsx` y su tarjeta para cuenta/similares, pendientes de fases 4–5. No se rehacen esas pantallas. Los cambios locales previos se resguardaron antes de editar: 98 archivos con hashes verificados, manifiesto y estado Git en `.local/redesign-phase3-2026-11-07/recovery/` y `recovery-manifest.json`. El registro de selectores retirados permite separar esta migración de los cambios previos de fases 1–2.

## Arquitectura, datos y seguridad

Se añade un componente de presentación para resultados sin mover reglas al cliente. `Home` sigue siendo propietario de consultas/favoritos/interés y vista; el servidor sigue decidiendo disponibilidad, precio, permisos y reserva. No cambian esquema, migraciones, endpoints, contratos, sesiones, roles ni dependencias. No hay despliegue.

Antes de capturas e integración se verifica `current_database() = pyapy_redesign_phase0_20261104`, host local y puerto 55432. Se reutiliza el runtime aislado de fase 0 en 4170/4171, sin dirigir las pruebas de escritura a la aplicación habitual 4100/5173. Las pruebas nuevas interceptan todas las llamadas API y teselas: no acreditan integración real por sí solas. `npm test` usa una base temporal propia.

## Pruebas y evidencia

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` y `npm run build` | Aprobados; lint final repetido tras adaptar pruebas de imágenes |
| `npm test` | 36/36 API/contratos, base temporal propia |
| Diez suites E2E | 108 escenarios distintos aprobados y cuatro barridos móviles duplicados omitidos, combinando la general con revalidación de imágenes |
| Desglose de la general | 106 aprobados, cuatro omitidos y dos fallos móviles por esperar imágenes lazy fuera de pantalla |
| Revalidación de imágenes | 4/4 escritorio/móvil, dos escenarios; se desplaza hasta la imagen antes de comprobar carga/fallback. No se cuentan las repeticiones desktop como escenarios nuevos |
| Revalidación final de distribución | 21 aprobados y un barrido duplicado omitido en `redesign-results`/`search-return`, tras corregir la prioridad de las reglas de margen móvil. Reflujo/mapa/retorno comprobados sobre el build final; son repeticiones de escenarios ya contados |
| Suite nueva de resultados | 11 aprobados y un barrido duplicado omitido; API y teselas simuladas |
| Reflow nuevo | 12 anchos de 320 a 1920 px, incluidos ambos lados del umbral 1180/1181; lista/mapa sin desbordamiento, panel lateral sin solapamiento |
| Capturas reales | 24 estados lista/mapa en 12 anchos; cuatro secciones completas y dos vistas del prototipo. API real aislada, sin errores de página ni desbordamientos |
| Axe | Cuatro análisis con API real y cuatro nuevos con API simulada, lista/mapa en 390/1440, sin violaciones detectadas; además pasan los análisis compartidos de portada/estructura de la regresión |
| Formato/diff | Prettier y `git diff --check` aprobados; resguardo inicial y entrega por fase con hashes |

Las diez suites son `redesign-results`, `redesign-home`, `redesign-shell`, `search-guests`, `search-labels`, `search-map`, `search-return`, `marketplace-integration`, `progressive-search` y `marketplace`. Las tres últimas usan el backend aislado según el escenario; las demás interceptan API. Marketplace comprueba registro, favorito persistido, cotización/reserva/cancelación y salida, además de paneles por rol. El escenario de alternativas verifica la selección del intervalo propuesto en una ficha reservable. No se ejecuta toda la suite de reservas/paneles ni TLS de staging en esta fase.

Aceptación en **Chrome 156.0.8078.82 headless**, escritorio y emulación móvil. La corrida general está en `verified-e2e.log`; su JSON fue sustituido por el runner al revalidar imágenes, por lo que se conserva el registro de línea como evidencia de sus 112 casos/resultados. `lazy-images-e2e.json` y `lazy-images-e2e.log` conservan la revalidación 4/4; `layout-e2e.json`/`.log`, la revalidación final 21/1. Los informes visuales son `real-visual.json` y `mock-visual.json`; `capture-final-aligned.log` registra el último encuadre de capturas. No se suman las corridas exploratorias como aceptación.

Reproducción con el runtime aislado de fase 0 activo y el build construido:

```powershell
$env:WEB_URL = 'http://127.0.0.1:4171'
npx playwright test --config=.local/redesign-phase3-2026-11-07/playwright.config.mjs tests/e2e/redesign-results.spec.js tests/e2e/redesign-home.spec.js tests/e2e/redesign-shell.spec.js tests/e2e/search-guests.spec.js tests/e2e/search-labels.spec.js tests/e2e/search-map.spec.js tests/e2e/search-return.spec.js tests/e2e/marketplace-integration.spec.js tests/e2e/progressive-search.spec.js tests/e2e/marketplace.spec.js
node .local/redesign-phase3-2026-11-07/capture.mjs
```

La configuración local hereda la configuración raíz, fija los directorios absolutos de pruebas/artefactos, usa `channel: "chrome"` y escribe JSON directamente a archivo. El runtime de prueba se detiene al terminar; la aplicación habitual no se detiene.

Evidencias: `.local/redesign-phase3-2026-11-07/`, con resguardo, identidad de DB, registros, capturador reproducible, capturas y reportes JSON. La comparación usa el HTML principal del ZIP; las diferencias deliberadas son mapa OSM explícito/diferido, tarifa horaria y funciones/datos reales. No se copian dormitorios, baños, reseñas ni disponibilidad ficticios del prototipo.

## Incidencias y límites

- Primera corrida focalizada: 38 aprobados, un barrido duplicado omitido y un fallo de la prueba nueva de hover. La ampliación mostró además que desplazar una tarjeta bajo un puntero estacionario podía sobrescribir la selección del marcador. Se cambia la sincronización por puntero a movimiento efectivo, conservando foco/teclado y evitando hover táctil; la prueba comprueba una entrada nueva del puntero. No se debilita la expectativa de selección.
- La inspección real encontró un popup recortado cuando se abría durante la animación inicial de encuadre. Se aplica el encuadre de resultados sin animación y se limita el ancho del contenido del popup en móvil. El capturador final comprueba sus límites respecto del panel en 390/1440 px.
- La suite histórica de marketplace esperaba «Cerrar sesión» siempre expuesto, aunque desde fase 1 está dentro de cuenta/menú. Se abre el control real correspondiente antes de comprobar y ejecutar la salida; no se modifica autenticación ni sesión.
- La general final detectó dos expectativas de imagen anticipadas en móvil: los resultados más altos quedan fuera del viewport inicial y `loading="lazy"` todavía no solicita sus fotos. Se desplaza hasta tarjeta/imagen antes de comprobar carga o fallback; se conserva lazy loading y se revalidan ambos escenarios en ambos proyectos (4/4).
- La comparación final corrigió la especificidad de los márgenes de resultados: las reglas de 780/600 px deben tener la misma prioridad que la regla base para aplicar 20/16 px por lado, en lugar de conservar 32 px. Se repiten reflow/mapa y toda la suite de retorno sobre el build final (21 aprobados y un barrido duplicado omitido).
- Una corrida ampliada con Chromium empaquetado quedó detenida en el proceso de pruebas, sin informe final, y se interrumpió conservando `test-results/`. Una contraprueba Vite dejó 10 aprobados, un barrido omitido y un fallo `SyntaxError: Unterminated string in JSON at position 65536`. No se atribuye ese error de protocolo a la aplicación ni se cuenta esa ejecución como aprobada. La aceptación se repite secuencialmente con Chrome instalado, build de producción y reporte JSON directo a archivo.
- H04 de fase 0: el escenario original elegía una muestra pública y esperaba un formulario de reserva. La prueba ahora elige una propiedad reservable del catálogo real; se preserva la prohibición de reservar muestras.
- No se ejecutan dispositivos físicos, otros motores, lector de pantalla real, auditoría WCAG integral, carga representativa, Lighthouse equivalente ni HTTPS de staging. La fase 7 conserva esa validación integrada/rendimiento; los riesgos operativos existentes siguen vigentes.

## Próxima fase

Fase 4 pendiente: ficha `/espacios/:id`, galería y composición del panel de reserva, conservando acceso directo, historial/retorno, horarios/personas, cotización real, confirmación idempotente y recuperación de respuesta ambigua. Esta entrega no la inicia.
