# Integración UI 01 — portada conectada e identidad artesanal

Fecha: 2026-09-19. Estado: primera entrega implementada y verificada localmente.

## Autorización y alcance

El usuario pidió un grupo de agentes para analizar e integrar la primera versión ubicada en `remix-remix-pyapy---reservas-paraguay`, respetar íntegramente las tecnologías de `sources/PROMPT_MAESTRO.md` y diseñar una experiencia minimalista con referencias al ñandutí y al encaje ju. Eligió primero la aplicación conectada y la dirección «Artesanal sutil». Autorizó expresamente esta primera fase y solicitó documentar todos los cambios en `.context`.

Esta entrega comprende identidad compartida, portada, búsqueda, tarjetas, navegación y regresiones relacionadas. No equivale al cierre de todas las fases del prompt ni a una release de producción. Siguiente fase propuesta: detalle y reserva; después, cuenta y paneles.

## Análisis del grupo de agentes

Tres agentes revisaron, respectivamente, frontend actual, primera versión y arquitectura/contratos. Sus conclusiones se contrastaron con el código durante la implementación.

| Superficie | Hallazgo | Decisión |
| --- | --- | --- |
| `apps/web` | React/Vite, Router, Query, CSS propio y Leaflet; funcionalidades conectadas | Base funcional de integración |
| Aplicación antigua | React/TypeScript/Vite/Tailwind, Express y Firebase/Firestore; el nombre de carpeta no indica uso de Remix | Recuperar intenciones de diseño y adaptar presentación |
| `index.html` + `html/` | Presentación estática independiente, sin persistencia | Mantener su propósito de demostración |
| API vigente | `/api/v1`, precio por hora, sesión cookie/CSRF, permisos y reservas server-side | Autoridad única sobre operaciones reales |

Referencias concretas de la primera versión: `src/components/Search/MainSearchHero.tsx`, `SearchResultsSection.tsx`, `Property/PropertyCard.tsx` y `PropertyShowcase.tsx`. Se retomaron búsqueda por necesidad, jerarquía fotográfica y alternativas explicadas. Se implementaron sobre los componentes y contratos vigentes, sin importar módulos del legado.

Hallazgos estáticos del legado: contratos de respuesta de reserva/cancelación desalineados con sus consumidores, Hooks posteriores a retornos condicionales, autenticación de desarrollo en formularios y mezcla de precios por turnos/día. El agente identificó riesgos de exposición de propiedades completas en matching y autorización insuficiente en creación de propiedades. No se ejecutó ni se certificó el backend antiguo; esos hallazgos no son fallos atribuidos a la API vigente.

La referencia «Ñandutí» del legado era una paleta, sin recursos textiles reutilizables. Los SVG de esta entrega son nuevos. No se migraron registros, fotografías remotas adicionales, contactos ni sponsors del legado.

## Implementación

### Identidad y portada

- Paleta marfil, verde profundo y terracota; fotografía protagonista y espacios amplios.
- Hero dividido en texto y fotografía, con composición vertical en teléfonos.
- Mensaje principal «Un lugar. Tu gente. Un buen plan.» y enlace al buscador.
- Motivo radial inspirado en ñandutí junto al borde; cenefa geométrica inspirada en encaje ju en ubicaciones y footer.
- Carrusel de fotografías con pausa/reproducción y selección manual; arranque sin reproducción automática cuando se solicita movimiento reducido. También responde a cambios de esa preferencia.
- Carrusel horizontal de propiedades conservado, con controles y flechas de teclado al enfocar la región.
- Estilos de esta entrega en `marketplace.css`, importados después de `styles.css`: tokens/componentes compartidos y reglas acotadas a `.marketplace-home`. Las pantallas operativas siguen usando su estructura existente.

### Buscador

- Extraído a `SearchForm.jsx`, con ciudad, fecha y personas como campos principales.
- Horario siempre visible; presupuesto, tipo completo y comodidades desplegables.
- Estado controlado inicializado desde la URL; `key={params.toString()}` reinicia el formulario al cambiar búsqueda, limpiar filtros o navegar por historial.
- Las categorías aplican el borrador actual: no descartan cambios de ciudad, personas o fecha todavía no enviados.
- Fechas interpretadas con `America/Asuncion`; intervalos enviados mediante `localInterval` y validados con esquemas compartidos existentes.
- Horarios nocturnos muestran el día de salida; intervalos URL de varios días se conservan hasta editar fecha/horas.
- Permite buscar hoy con inicio futuro. Validación comprensible ante intervalos/criterios inválidos.
- Preserva orden aceptado y elimina la página al aplicar criterios o cambiar orden.
- Error de consulta separado de vacío, con reintento y limpieza; alternativas y otras fechas con explicaciones. `searchLimited` tiene mensaje visible.

### Tarjetas, mapa y navegación

- Título semántico, tipografía legible, precio por hora y duración mínima; estado disponible solo cuando la API indica `availabilityChecked`.
- Resultados en una columna hasta 480 px; favoritos y controles de 44 px.
- Fallback accesible de imagen fallida; el estado se reinicia al cambiar la URL de imagen.
- Marcador seleccionado resalta y desplaza a su tarjeta; tarjeta enfocable/hover mantiene selección de marcador. Implementado desde los callbacks de `Home.jsx`, conservando `Map.jsx`.
- Menú móvil con estado expandido, controles asociados, Escape y retorno de foco; cierre al navegar.
- Publicación accesible desde menú móvil y cierre de sesión visible en todos los tamaños, con estado pendiente/error.
- Diálogos compartidos con nombre accesible y retorno de foco.

## Archivos de aplicación y pruebas

### Creados

- `apps/web/src/SearchForm.jsx`
- `apps/web/src/marketplace.css`
- `apps/web/public/brand/nanduti.svg`
- `apps/web/public/brand/encaje-ju.svg`
- `tests/e2e/marketplace-integration.spec.js`

### Modificados

- `apps/web/src/Home.jsx`: integración del buscador, hero, estados y coordinación mapa/tarjeta.
- `apps/web/src/App.jsx`: navegación, logout y footer.
- `apps/web/src/ui.jsx`: tarjetas, fotos y diálogo accesible.
- `apps/web/src/main.jsx`: carga de estilos de identidad.
- `tests/e2e/marketplace.spec.js`: regresión de logout tras reserva/cancelación en escritorio y móvil.

### Documentación de esta entrega

Este informe, `design/ARTESANAL.md`, `decisions/ADR-003-legacy-ui-integration.md`, `decisions/README.md`, `README.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `RISKS.md`, `TESTING.md`, `BACKLOG.md` y `CHANGELOG.md`, todos bajo `.context`.

No se eliminaron archivos. Las carpetas no versionadas preexistentes `pyApy/` y `remix-remix-pyapy---reservas-paraguay/` se conservaron. No se creó commit.

## Arquitectura, base y seguridad

React, React Native, Node.js, PHP, PostgreSQL, Docker y OpenStreetMap conservados. Sin nuevas dependencias, cambios de API/contratos, migraciones SQL ni modificaciones de autenticación o permisos del backend. La creación de reservas sigue requiriendo cotización/revalidación, sesión, CSRF e idempotencia actuales.

Las E2E operaron contra la instancia local con datos ficticios: crean cuentas, reservas y eventos auditables; las propiedades temporales se despublican al finalizar. Las pruebas de API usaron una base PostgreSQL temporal aislada que el runner elimina. No se hizo migración de datos del legado.

## Verificación ejecutada

| Comando/revisión | Resultado |
| --- | --- |
| Prettier, solo archivos JS/JSX/CSS tocados | Aplicado |
| `npm run check` | PASS: lint sin errores/advertencias, 23 pruebas aprobadas y build web |
| `npm run test:e2e` | 13 aprobadas, 1 omitida deliberadamente: el barrido de anchos se ejecuta una vez desde el proyecto desktop |
| `git diff --check` | Sin errores de whitespace; avisos de normalización LF/CRLF de Git |
| Inspección visual | Capturas completas de portada desktop y móvil revisadas |

Cobertura nueva: historial/filtros, horario nocturno paraguayo, preservación del borrador al seleccionar categoría, limpieza, error 503/reintento, fallback de fotos, menú/Escape/foco, movimiento reducido, logout y ausencia de desbordamiento a 320/390/768/1024/1440 px. Conservados los flujos E2E reales de búsqueda, mapa, detalle, registro, favorito, cotización, reserva/cancelación y paneles autorizados.

Capturas: `.local/screenshots/home-desktop.png`, `home-mobile.png`, detalle/paneles de la suite existente; los cinco anchos se guardan como `artesanal-<ancho>.png` dentro de `test-results` mediante `info.outputPath`. Son artefactos locales ignorados, no documentos con credenciales.

Build Vite: entrada JS 254,24 kB (gzip 79,89 kB); CSS principal 34,95 kB (gzip 8,07 kB). La evidencia histórica registra entrada JS 246,03 kB (gzip 77,08 kB): esta entrega aumenta aproximadamente 8,21 kB / 2,81 kB gzip. Comparación de compilaciones, no mejora de rendimiento demostrada ni medición Lighthouse.

## Pendientes y siguiente fase

- Integrar composición de galería/detalle y aislar cotizaciones por propiedad y criterios. El riesgo de cotización obsoleta observado en el análisis no fue corregido en esta fase de portada.
- Después, cuenta y paneles; métricas solo con significado y fuentes actuales.
- Auditoría WCAG integral, lector de pantalla, contraste calculado de todas las superficies, zoom 200 %, navegadores/dispositivos adicionales y Lighthouse.
- Los SVG son interpretaciones digitales; falta revisión cultural/artesanal para identidad final. Fotos actuales siguen siendo fixtures, no establecimientos paraguayos verificados.
- Croquis/editor SVG del legado identificado: inspeccionar/desacoplar antes de decidir alcance; no ofrece aún reserva por sectores compatible con el dominio actual.
- Mantener riesgos operacionales, offline nativo y paridad ya documentados.

La siguiente fase requiere el cierre/autorización correspondiente; esta entrega no declara integración completa de todas las pantallas.
