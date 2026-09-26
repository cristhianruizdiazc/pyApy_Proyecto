# Evidencias de verificacion

## Cierre Fase 20 CI/CD - 2026-09-26

- Primera ejecucion local de `npm run check`: fallo antes de las pruebas por PostgreSQL local detenido (`ECONNREFUSED 127.0.0.1:55432`). Se inicio el cluster aislado con `npm run db:local` y se repitio el gate.
- Repeticion: lint aprobado, 23/23 pruebas aprobadas y build Vite exitoso.
- `npm audit --audit-level=moderate`: cero vulnerabilidades. `npm run containers:verify`: configuracion dev/test/prod, secretos externos y hardening declarados aprobados.
- `npm run mobile:check` detecto que Expo 57.0.23 no cumplia la version compatible `~57.0.25`; se actualizo `apps/mobile/package.json` y `package-lock.json`. La repeticion paso y `npm run mobile:export` genero bundles Android/iOS.
- `npm ci` posterior reinstalo 766 paquetes desde el lockfile y termino con cero vulnerabilidades. La ejecucion remota se documentara al concluir.

## Fase 20 CI/CD - 2026-09-25

- El workflow de GitHub Actions fue revisado localmente: usa `npm ci`, PostgreSQL efimero por job, lint, pruebas, build web, Expo, `npm audit`, validacion/build Docker y E2E separados.
- `npm run check` paso con 23 pruebas; `npm audit --audit-level=moderate` informo cero vulnerabilidades; el YAML paso Prettier y `npm run containers:verify` paso. El export Android/iOS completo; Expo sugirio actualizar `expo` 57.0.23 a ~57.0.25, sin convertirlo en fallo.
- La ejecucion remota no se hizo desde este entorno: no se enviaron cambios al remoto para forzarla. Los resultados de un runner GitHub y sus artefactos siguen pendientes.
- La configuracion no contiene deploy; esa omision es intencional hasta disponer de staging y rollback aprobado.

## Fase 19 Docker - 2026-09-24

- `npm run containers:verify`: aprobado en configuracion segura y desarrollo (flags demo/seed inyectados solo para el proceso).
- Compose standalone resolvio `config --quiet` y JSON con perfiles `test`/`tools`; se comprueban seis servicios, targets production/test, DB sin puerto host, hardening API/web/test y `.dockerignore`.
- `npm run lint`, `npm test` (23/23), `npm run build` y `git diff --check`: aprobados.
- `docker version` no esta disponible: no se ejecutaron build/up, health checks, volumenes ni pruebas dentro de contenedor. Es gate externo registrado en Fase 19, no resultado exitoso.

## Rendimiento UX 01 - 2026-09-24

- `npm run lint`, `npm test` (23/23) y `npm run build`: aprobados despues de las variantes WebP.
- Lighthouse local: portada mobile 0.95 / LCP 2.64 s / 442 KiB y ficha mobile 0.90 / LCP 3.24 s / 533 KiB. Antes: 0.69 / 8.20 s / 2593 KiB y 0.67 / 8.27 s / 2113 KiB.
- Desktop: portada 0.99 / LCP 0.81 s y ficha 0.95 / LCP 1.00 s. Accesibilidad, best practices y SEO: 1.00 en las cuatro corridas.
- El CLS 0.121 de ficha desktop se corrigio posteriormente con el skeleton de ruta; el resultado final y su regresion constan en el cierre siguiente.
- Evidencia y limites: [Fase 18 parcial](phases/performance-ux-01.md).

## Cierre Fase 18 - 2026-09-24

- Lighthouse final: portada mobile 0.95 / LCP 2.50 s / 443 KiB; ficha mobile 0.90 / LCP 3.33 s / 395 KiB; portada desktop 0.93 / LCP 0.79 s; ficha desktop 0.97 / LCP 1.16 s / CLS 0.003.
- El skeleton de detalle elimina el desplazamiento principal del footer. La ficha demora el mapa hasta que se pulsa `Ver mapa aproximado`, reduciendo el peso inicial y desmontandolo al ocultarlo.
- `tests/e2e/detail-reservation.spec.js --grep "mapa de ficha"`: 2 aprobadas, una por viewport desktop/mobile, sobre API y Vite aislados.
- `EXPLAIN (ANALYZE, BUFFERS)` de listado/disponibilidad en base demo: 0.062/0.024 ms, escaneo secuencial correcto para seis filas. No se aplicaron migraciones ni indices especulativos.
- `npm run lint`, `npm test` (23/23), `npm run build` y `git diff --check`: aprobados.

## Auditoría automatizada de accesibilidad — 2026-09-24

- `node scripts/verify-web-integration.mjs --audit accessibility-final`: PASS sobre el build Vite actualizado.
- 60 estados inspeccionados: portada, filtros, mapa, ingreso, registro, detalle, galería, cuenta, reservas, favoritos, propietario y administración en 1440 y 390 px.
- Resultado: 0 violaciones Axe, 0 reglas incumplidas, 0 overflow horizontal y 0 errores de página.
- La primera ejecución encontró 16 estados con `heading-order`/`page-has-heading-one`; se corrigieron encabezados de registros/estado vacío y el `h1` oculto en autenticación móvil. La repetición final eliminó todos esos hallazgos.
- El informe JSON queda en `.local/audits/axe-accessibility-final.json`; contiene datos de la demo local y no se versiona.
- Esto no cubre lector de pantalla, zoom 200 %, contraste manual, navegadores adicionales, Lighthouse ni la vista HTML estática.

## Línea base Lighthouse — 2026-09-24

- `node scripts/verify-web-integration.mjs --performance performance-baseline`: PASS técnico, sin `runtimeError`, sobre portada y detalle en desktop/mobile.
- Puntuaciones de rendimiento: portada mobile 0.69, detalle mobile 0.67, portada desktop 0.94 y detalle desktop 0.93.
- LCP aproximado: 8.20 s y 8.27 s en mobile; 1.58 s y 1.28 s en desktop. El detalle desktop registró CLS 0.121.
- Accessibility fue 1.00 en las cuatro corridas; best practices 1.00 y SEO 0.92.
- Es una línea base local con datos demo, no una aceptación de rendimiento ni un SLO. Informe en `.local/audits/performance-performance-baseline.json`.

## Integración UI 03 — 2026-09-19

- `npm run check`: PASS, lint, 23 pruebas de dominio/contratos/API y build. Lint y build finales repetidos con éxito después de ajustes de imports/pruebas.
- `node scripts/verify-web-integration.mjs` final: **41 aprobadas, 1 omitida deliberadamente**, 42 casos configurados. `.last-run.json` final: `passed`, sin fallos. La omisión sigue siendo el barrido de portada duplicado, no un caso nuevo de gestión.
- `tests/e2e/workspace.spec.js`: siete escenarios × desktop/mobile: favoritos/notificaciones, llegada privada tardía, edición/media/contacto/redes, calendario/bloqueo/cancelación, moderación/auditoría/pesos, errores/403 y responsive.
- Mutaciones de propiedad, imagen, privados, reserva, ocupación y moderación usan API/DB real. El historial de notificaciones del escenario de interfaz y los errores 503 se interceptan de forma acotada; entrega real de notificaciones sigue en tests de API.
- Responsive de cuenta, calendario y tabla de usuarios a 320/390/768/1024/1440 px sin overflow del documento. Capturas en `test-results/workspace-paneles-y-cuenta-*` y `.local/screenshots/owner-*.png`, `admin-*.png`; inspeccionadas cuenta desktop y vistas móviles de propietario/admin.
- Primera ejecución: dos timeouts de selectores exactos por etiqueta de `<select>` y límite externo de 240 s; corregidos a rol combobox, cuatro revalidaciones aprobadas. Ejecución posterior: 40 aprobadas y un timeout de captura móvil; captura a escala CSS/sin animaciones y tiempo específico de 90 s para barrido multivista, dos revalidaciones aprobadas. Suite completa final aprobada.
- Un fixture de la ejecución interrumpida fue identificado por ID/nombre/descripción: se canceló su reserva y despublicó por API, sin borrar otros registros. Detalle y auxiliar local en el informe de fase.
- Build: entrada 254,45 kB / gzip 79,95; Workspace JS 3,00 / 1,38 y CSS 9,41 / 2,17; Reservations 3,28 / 1,26; Account 7,40 / 2,68; Owner 22,42 / 6,46; Admin 12,89 / 3,86 kB.
- `git diff --check`: sin errores de whitespace. No se ejecutaron Lighthouse, WCAG integral, Docker o pruebas nativas en esta fase.

Informe completo: [UI 03](phases/integration-ui-03.md).

## Integración UI 02 — 2026-09-19

- `npm run check`: PASS, 23 pruebas de dominio/contratos/API, lint y build. Después de ajustes finales de UI/fixtures/guards se repitieron `npm run lint` y `npm run build`, ambos aprobados.
- Primer `npm run test:e2e`: 25 aprobadas, 2 fallidas en autenticación, 1 omitida. Se confirmó HTTP 429 `RATE_LIMIT` (30 intentos/15 minutos) en la instancia compartida. Se redujeron logins mediante fixture de autenticación por worker, solo en memoria.
- `node scripts/verify-web-integration.mjs`: suite completa, **27 aprobadas y 1 omitida deliberadamente**. API/Vite propios y temporales, PostgreSQL local compartido con desarrollo; sin modificar límites ni `.local/dev.json`.
- Tras incorporar validación de respuestas de éxito ilegibles: `node scripts/verify-web-integration.mjs tests/e2e/detail-reservation.spec.js --grep "respuesta"`: **6 aprobadas**. Son repeticiones dirigidas, no seis escenarios nuevos adicionales al total de la suite.
- Nuevas regresiones: selección catálogo/ficha/registro, cotizaciones tardías al editar/cambiar propiedad, cotización vacía, conflicto real posterior a cotización, doble clic, pérdida de respuesta después del commit, recarga, siguiente JSON inválido y replay con un solo registro; tarifa recalculada y formulario congelado durante envío.
- Galería con flechas/Escape/retorno de foco/foto fallida; fechas ocupadas con error/reintento sin falsa disponibilidad. Barrido de ficha a 320/390/768/1024/1440 px sin desbordamiento.
- Capturas desktop/mobile inspeccionadas en `.local/screenshots/detail-*.png`. Capturas temporales de cinco anchos generadas en `test-results`, reemplazadas al ejecutar pruebas focalizadas después.
- Build final: entrada JS 254,33 kB / gzip 79,89 kB; Detail diferido 17,20 kB / gzip 5,84 kB y CSS Detail 6,66 kB / gzip 1,80 kB. Sin Lighthouse.
- Confirmado cierre de los procesos temporales y disponibilidad de la instancia original 5173/4100. `git diff --check` sin errores de whitespace.
- Al cierre, login de la instancia original respondió 422 `VALIDATION` a cuerpo vacío, sin 429: expiró la ventana de límite temporal. No se reinició ese proceso ni se modificó su protección.

Alcance, fallos previos, efectos en fixtures y limitaciones: [UI 02](phases/integration-ui-02.md).

## Integración UI 01 — 2026-09-19

- `npm run check`: PASS. ESLint sin errores/advertencias, 23 pruebas de contratos/dominio/API aprobadas sobre PostgreSQL temporal y build Vite exitoso.
- `npm run test:e2e`: 13 aprobadas y 1 omitida deliberadamente (barrido responsive ejecutado una sola vez en desktop). API local real para flujos de negocio; 503 y fotos rotas interceptados únicamente en sus casos específicos.
- `git diff --check`: sin errores de whitespace; avisos de normalización LF/CRLF.
- Nuevas regresiones en `tests/e2e/marketplace-integration.spec.js`: URL/historial/limpieza, horario nocturno paraguayo, categoría preservando borrador, fallo/reintento sin falso vacío, imagen fallida y enlace, menú/Escape/foco, reduced motion y desbordamiento a 320/390/768/1024/1440 px.
- Suite existente conserva búsqueda/mapa/detalle, alta/favorito/cotización/reserva/cancelación y paneles. Se agrega logout visible y funcional tras cancelar en desktop y mobile.
- Capturas de portada desktop/mobile inspeccionadas visualmente en `.local/screenshots`. Barrido de cinco anchos en `test-results/**/artesanal-*.png`.
- Entrada JS: 254,24 kB / gzip 79,89 kB; CSS principal 34,95 kB / gzip 8,07 kB. Incremento frente a entrada JS histórica: 8,21 kB / 2,81 kB gzip. No se midieron Lighthouse ni latencias de producción.
- No ejecutados en esta fase: auditoría WCAG completa, lectores, zoom 200 %, dispositivos nativos, Docker, backups/restauración o despliegue. Sus resultados anteriores no se presentan como nuevas comprobaciones.

Informe detallado y alcance: [Integración UI 01](phases/integration-ui-01.md).

## Vista HTML sin servidor

`node scripts/verify-static.mjs`: PASS. 40 pantallas a 1440, 390 y 320 px abiertas por file:// con la red desactivada. 1754 enlaces/recursos locales validos y todas las pantallas incluidas en el indice. Fotos presentes, un h1 por pagina, cero scripts de aplicacion, filtros CSS de ciudad/tipo/capacidad/precio, menu movil y checkbox de favorito verificados. Sin desborde horizontal del documento. Capturas inspeccionadas en .local/screenshots/static.

Estas pruebas solo validan la vista HTML, no sustituyen las pruebas de backend ni afirman que los formularios estaticos persistan datos. No se levanto un servidor para esta vista. El mapa externo es opcional y requiere conexion.

Fecha: 2026-09-17. Windows/PowerShell, C:\pyApy_Proyecto. Las pruebas no constituyen aceptacion de produccion.

## Ejecutado

| Comprobacion | Resultado |
| --- | --- |
| npm run setup repetido | Migraciones vigentes, permisos reaplicados, fixtures sin duplicar |
| npm run lint | Exit 0, sin advertencias |
| npm test | 23 aprobadas, cero fallos, base temporal real PostgreSQL |
| npm run build | Exit 0, Vite 8.3; entrada JS 246.03 kB / gzip 77.08 kB |
| npm run test:e2e | Seis aprobadas: escritorio 1440x1000 y mobile 390x844 |
| npm audit --audit-level=moderate | Cero vulnerabilidades reportadas |
| expo install --check | Dependencias compatibles tras ajustar AsyncStorage |
| expo-doctor | 21 de 21 comprobaciones aprobadas |
| expo export Android/iOS | Bundles generados; no equivale a instalar una app nativa |
| scripts/verify-permissions.mjs | API no superusuario; auditoria/migraciones protegidas; reporte sin acceso a usuarios |
| npm run report | PHP 8.5/PDO consulto correctamente vista agregada |
| npm run db:verify-restore | Backup restaurado, conteos y constraint GiST conservados |
| Compose config --quiet | Configuracion valida; no hay motor para ejecutar contenedores |

Las medidas de bundle son de compilacion, no Lighthouse ni latencia de usuarios.

## Cobertura

Unitarias: Zod, horario nocturno Paraguay, ranking, cola offline y cliente HTTP con timeout. Integracion: auth/CSRF, permisos/IDOR, PII, concurrencia (una confirmacion de diez), replay, intervalos contiguos, precio, cancelacion, fotos, resenas, outbox, auditoria y edicion compatible con compromisos previos.

E2E: fotos, busqueda, mapa, ausencia de desborde, registro real, favorito, cotizacion, reserva/cancelacion, panel propietario/calendario y administrador. Capturas en .local/screenshots; inspeccionadas visualmente en escritorio y mobile. Una ejecucion anterior fallo por selectores ambiguos/fotos fuera de viewport; los selectores se corrigieron y la suite completa se repitio con exito.

## No ejecutado

Instalacion limpia aislada de release, Docker build/up, CI remoto, carga prolongada, Lighthouse, cobertura integral WCAG/teclado/lectores, emuladores/telefonos nativos, perdida real de red nativa, APK/IPA firmados, entrega externa email/push/WhatsApp, staging, monitoreo/alertas y rollback de despliegue.

## Herramientas instaladas

ESLint VS Code 3.0.34, Prettier 12.4.0, Containers 2.5.1. PHP 8.5.10 y Compose 5.5.1 locales con SHA-256 verificado; Chromium de Playwright. No se reemplazo XAMPP, no se instalaron servicios Windows ni se modificaron bases de otros proyectos.

## Fuente historica

Workspace inicialmente vacio, sin Git. El adjunto original tiene SHA-256 2C071AD446F88CF802ABC84A46E4C7C0E63A13DEBAA95FEC173996A0130EDBBF. Copia textual en sources/PROMPT_MAESTRO.md, finales de linea normalizados. Fase 0 conserva su inventario historico; los resultados actuales reemplazan el estado inicial sin aplicacion.
