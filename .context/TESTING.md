# Evidencias de verificacion

## Rediseño, fase 7 — 2026-11-08

Fase 7 del rediseño completada en su alcance local: comparación visual, recorridos por rol y correcciones de reflow en Firefox y con texto ampliado. Logo responsive transparente de 10/30/56 KB, original conservado. Lint/build/formato, 36/36 API/contratos, **241 escenarios distintos aprobados en Chrome y siete omisiones duplicadas**, más **42 aprobados en Firefox**. 95 capturas reales, 44 Axe reales sin violaciones detectadas y 24 corridas comparativas Lighthouse aceptadas con tres repeticiones por caso (40 ejecuciones contando diagnóstico, resultados reemplazados y sondas finales). Sin cambios de API/DB/dependencias ni despliegue. HTTPS de staging no ejecutado por Docker detenido; dispositivos, lectores reales y WCAG integral pendientes. [Informe y límites](phases/rediseno-fase-7-2026-11-08.md).

La general deja 236 aprobados/7 omitidos; las revalidaciones de estructura/cadena (17/1), ficha/reserva/cadena (27/1) y gestión/workspace (45/1) reemplazan sus casos repetidos. Firefox: 19/19 más 16/16 y una prueba nueva de precarga; portada/estructura final en Chrome: 34/2. Los informes iniciales con fallos se conservan. Se separan API simulada, integración real aislada y consulta/capturas reales; los pesos y permisos siguen en servidor. Lighthouse alterna restauración de fase 0 y build actual con el mismo Chrome, datos/perfiles y servidor sin caché/compresión. Las medianas y las limitaciones están en el informe.

Nombres accesibles: además de la cobertura anterior, se ejecutan las seis pruebas de resultados en Firefox, elevando el total único de ese motor a 42. La regla experimental se habilita explícitamente en ficha/resultados. Ocho comprobaciones reales adicionales y dos sondas Lighthouse del build definitivo aprueban la coincidencia entre texto visible y nombre accesible. Los intentos fallidos de cuenta y la aserción de espaciado nativo se conservan; los últimos resultados por escenario quedan sin fallos en `acceptance-summary.json`. Las medianas de rendimiento preceden al último ajuste de nombres y las dos sondas posteriores se documentan por separado.

## Rediseño, fase 6 — 2026-11-08

Lint, build de producción, Prettier y diff aprobados. 36/36 API/contratos; siete suites E2E sobre build final: **132 aprobados, cero fallos y cuatro omisiones de barridos duplicados**. Suite nueva `redesign-management`: 29 aprobados y un barrido omitido, con API completamente simulada. Comprueba URL/historial/teclado, edición con rechazo, medios/privacidad/redes, ocupación con UUID, incorporación explícita, nueve secciones, acciones administrativas, límites/filtros, desplazamiento de tabla por teclado, sesión/error/reintento, ayuda y 404.

84 capturas con API real aislada; 36 Axe reales y 26 de la suite nueva simulada sin violaciones detectadas. Reflow simulado en seis rutas y real en calendario/usuarios/ayuda, en 12 anchos de 320–1920, incluidos 1080/1081; textos largos en la suite. Bloqueo de captura cancelado y propiedad en borrador, dos respuestas 200. Regresión real de edición/fotos/datos privados/redes, bloqueo/cancelación y moderación conservada. [Informe, intentos iniciales, reproducción y límites](phases/rediseno-fase-6-2026-11-08.md). Chrome instalado headless, escritorio/emulación móvil; sin certificación de otros motores, dispositivos/lectores reales, rendimiento integrado ni staging HTTPS.

## Rediseño, fase 5 — 2026-11-08

Lint/build y 36/36 API/contratos aprobados; ocho suites E2E con 138 escenarios distintos aprobados y cuatro omisiones de barridos duplicados. 68 capturas con API real aislada en 12 anchos, 14 Axe reales y 20 de la suite nueva simulada sin violaciones detectadas. Nueva suite `redesign-personal`: 25 aprobados y un barrido duplicado omitido, API completamente simulada. Las otras siete suites son `auth-return`, `workspace`, `detail-reservation`, `marketplace`, `redesign-results`, `redesign-shell` y `redesign-home`. Las pruebas y capturas reales identifican antes de escribir la copia PostgreSQL de fase 0; fixtures/propiedades se retiran de publicación y reservas se cancelan al terminar.

Comprobados modo URL/recarga, tarea y selección tras ingreso sin escritura automática, destinos maliciosos, pendiente/error de acceso, consulta de perfil, notificaciones/favoritos con bloqueo y reintento, baja consecutiva con foco, 401 conservando acción/destino, reservas/filtros, llegada privada/cierre tardío, cancelación rechazada y reseña con borrador. Barrido de cuatro pantallas y textos largos en 12 anchos de 320 a 1920. Capturas reales de ingreso/registro/cuenta/Guardados/reservas y detalles/llegada/cancelación/notificaciones; la reseña y los fallos inyectados nuevos son simulados. Chrome instalado headless, escritorio/emulación móvil. [Informe, corridas iniciales y límites](phases/rediseno-fase-5-2026-11-08.md). No se certifican otros motores, lectores, dispositivos físicos, rendimiento integrado ni HTTPS de staging.


## Rediseño, fase 4 — 2026-11-07

Lint/build, 36/36 API/contratos y 97 escenarios E2E distintos aprobados más una omisión de barrido duplicado, combinando general y revalidación de interés. 30 capturas de aplicación con API real aislada y dos del prototipo; 12 anchos de 320 a 1920, ocho Axe reales y siete simulados sin violaciones detectadas. General: 95 aprobados, dos fallos del localizador del aviso previo de ingreso y una omisión; revalidación de ese recorrido completo: 2/2. No se suman repeticiones como escenarios nuevos. Siete suites: `detail-reservation`, `auth-return`, `search-return`, `search-labels`, `search-guests`, `redesign-detail` y `workspace`. Integración real en la copia PostgreSQL identificada antes de escribir; nueva suite completamente simulada, 9 aprobados y una omisión duplicada.

Comprobados acceso directo/recarga/historial, selección nocturna/24 h/18 personas, autenticación, cotización/rechazo, respuestas obsoletas, cambio de propiedad, confirmación con precio recalculado y recuperación tras respuesta perdida/malformada y recarga sin duplicar. Galería con miniaturas, teclado/foco, errores, mapa diferido, muestra y paneles existentes. Chrome instalado headless, escritorio/emulación móvil. [Informe, intentos iniciales, evidencias y límites](phases/rediseno-fase-4-2026-11-07.md). Pendientes otros motores, lectores reales, dispositivos, rendimiento integrado y HTTPS de staging.


## Rediseño, fase 3 — 2026-11-07

Revalidación final de distribución: `redesign-results` y `search-return`, 21 aprobados y un barrido duplicado omitido tras corregir los márgenes móviles, sobre el build final. Son repeticiones de escenarios incluidos en el total siguiente.

Lint/build y 36/36 API/contratos aprobados. Diez suites de regresión: **108 escenarios distintos aprobados y cuatro barridos móviles duplicados omitidos**, combinando la general (106 aprobados, cuatro omitidos y dos fallos de imágenes lazy fuera de pantalla) con revalidación 4/4 escritorio/móvil después de desplazar hasta las imágenes; no se cuentan repeticiones como casos nuevos. Nueva suite `redesign-results`: 11 aprobados y una omisión, API/teselas simuladas. Comprobadas etapas, importes, intervalos alternativos, mapa diferido/de página, selección/teclado, orden/paginación, favoritos/interés, muestras, carga/error/vacío y retorno; registro/reserva/cancelación/logout y paneles existentes con API real aislada. Chrome instalado 156.0.8078.82 headless, tras bloqueos/protocolo JSON del Chromium empaquetado registrados en el informe. 24 capturas reales lista/mapa en 12 anchos de 320 a 1920, sin desbordamientos ni errores de página; cuatro Axe reales y cuatro nuevos simulados sin violaciones detectadas. Ver [informe, corridas, archivos y límites](phases/rediseno-fase-3-2026-11-07.md). No certifica otros motores, dispositivos, lectores, rendimiento final ni HTTPS de staging.

## Rediseño, fase 2 — cierre 2026-11-05

Lint/build y 36/36 API/contratos aprobados. Siete suites públicas/compartidas: 87 escenarios distintos aprobados y tres barridos móviles duplicados omitidos, combinando la corrida de 90 (86 aprobados, tres omitidos, un fallo de scroll) con la revalidación de retorno 20/20 tras esperar las fuentes antes de medir. No se suman repeticiones como casos nuevos. 17 anchos de 320 a 1920, filtros abiertos/cerrados, 18 personas, turno inicial 24 h, horarios nocturnos, URL/requisitos/historial, publicación por rol y sponsors. Nueva suite completamente simulada; integración/capturas en `pyapy_redesign_phase0_20261104`, identidad contrastada. 13 capturas completas reales sin desbordamientos ni errores de página, cinco Axe reales y ocho Axe simulados sin violaciones detectadas. [Informe, intentos iniciales, archivos y límites](phases/rediseno-fase-2-2026-11-04.md). Pendientes lectores reales, estabilidad/rendimiento final, otros motores y HTTPS de staging.

## Rediseño, fase 1 — 2026-11-04

Lint/build aprobados; 36/36 API/contratos en PostgreSQL temporal propio. `auth-return`, `detail-reservation` y `workspace`: 64/64 desktop/móvil. Suite nueva `redesign-shell`: 15 aprobadas y una omisión duplicada; Cómo funciona/identidad responsive existentes: tres aprobadas y una omisión duplicada. Regresión de foco al cambiar de distribución corregida y revalidada para tres roles. Suite nueva y auth-return interceptan toda la API; reserva/paneles usan `pyapy_redesign_phase0_20261104`, identidad verificada antes de escribir. 24 capturas reales aisladas de 320 a 1920 px sin desbordamientos/errores de página y 14 Axe sin violaciones detectadas; otros cuatro Axe usan API simulada. Resultados iniciales, localizadores corregidos, límites y seguimiento de fallos históricos: [informe](phases/rediseno-fase-1-2026-11-04.md). No se afirman comprobados staging, lectores reales, otros motores o rendimiento final.

## Búsqueda por etapas — 2026-10-25

`npm run check` aprobado: lint, 32 pruebas sobre PostgreSQL temporal real y build. E2E nuevos: 4/4 aprobados en escritorio y web móvil, incluidos en los **53 aprobados y una omisión existente** de la ejecución web final con `--grep-invert 'staging entrega'`. El intento general previo tuvo dos fallos del escenario TLS de staging (`cookie.secure=true` sobre desarrollo HTTP); no se modifica la protección ni se afirma validar TLS. Informe final, alcance, reejecución e incidencias: [búsqueda por etapas](phases/progressive-search-2026-10-25.md). `git diff --check` aprobado. No se ejecutaron pruebas nativas ni despliegue de producción.

## Fase 24 preproduccion aislada - 2026-10-22

- Compose staging: build y despliegue aprobados; DB/API/gateway saludables y web activa en `https://localhost:8443`.
- `npm run staging:smoke`: PASS para TLS, shell web, health con DB, auth privada y request ID.
- `tests/e2e/staging.spec.js --project=desktop`: 1/1; registro ficticio, cookie segura, sesion y logout.
- Perfil Docker aislado: 23/23 pruebas; incluye seguridad adversarial y diez reservas simultaneas con una unica confirmacion.
- Backup DB de 52,808 bytes y backup del volumen uploads; restore temporal: 2 migraciones y 1 constraint de exclusion.
- Rollback a imagenes locales RC anteriores y regreso a candidatas: health y smoke PASS en ambos despliegues.
- Probe externo: `ok=true`, HTTP 200, 74 ms. No se probo entrega a un sistema de alertas remoto.
- `npm run check`: primer intento fallo porque PostgreSQL local estaba apagado; tras `npm run db:local`, lint, 23/23 y build aprobaron.

## Revalidación Release Candidate — 2026-10-22

- `npm ci --ignore-scripts`: PASS; 768 paquetes instalados.
- `npm run setup`: PASS; PostgreSQL aislado iniciado, migraciones/permisos reaplicados y fixtures sin duplicación.
- `npm run check`: PASS; lint, 23/23 pruebas y build Vite 8.3.5.
- `node scripts/verify-web-integration.mjs`: PASS; 45 E2E aprobadas y una repetición responsive omitida deliberadamente.
- `npm run mobile:check` y `npm run mobile:export`: PASS; dependencias Expo 57 compatibles y bundles Android/iOS generados.
- Permisos, reporte PHP y `npm run db:verify-restore`: PASS.
- Compose: imágenes productivas construidas; DB/API saludables; web HTTP 200; API interna HTTP 200; perfil test 23/23; DB y uploads persistieron tras reinicio.
- Auditoría: corregidos avisos de Vite, sharp, shell-quote e ip-address. Permanecen 16 altos transitivos en Expo/Metro sin versión compatible corregida publicada. No se aplicó el downgrade mayor sugerido por `--force`.
- No ejecutado: instalación física nativa y firma release; `adb` no está disponible.

## Release Candidate — 2026-09-27

- `npm ci --ignore-scripts`: PASS; 768 paquetes añadidos, 773 auditados y cero vulnerabilidades.
- `npm run setup`: PASS; PostgreSQL local listo, migraciones idempotentes, permisos reaplicados y fixtures existentes sin duplicación.
- `npm run check`: PASS; lint, 23/23 pruebas y build web posteriores a la instalación limpia.
- `npm run mobile:check`: PASS; `npm run mobile:export`: bundles Android/iOS generados en `apps/mobile/dist`.
- `node scripts/verify-web-integration.mjs`: PASS; 43 E2E aprobadas y una omitida deliberadamente.
- `npm run containers:verify`: PASS estático. Docker runtime no ejecutado porque `docker` no está disponible en este equipo.

## APK móvil de demostración offline - 2026-09-27

- `EXPO_PUBLIC_OFFLINE_DEMO=true npx expo prebuild --platform android --no-install`: configuración nativa Android generada con `com.pyapy.mobile`.
- `EXPO_PUBLIC_OFFLINE_DEMO=true .\\gradlew.bat :app:assembleDebug --no-daemon`: aprobado; produjo `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` (144,847,990 bytes; SHA-256 `25C82073901D8D3AE6951AC7C6D451E26C966D60D868C8B2F6691CC7D81FDD4B`).
- El APK incorpora el catálogo demostrativo y las imágenes `pool.jpg`, `house.jpg` y `retreat.jpg`; no requiere API ni base de datos durante la demostración.
- `aapt dump badging`: confirmó aplicación `com.pyapy.mobile`, actividad iniciable y SDK mínimo 24 (Android 7.0). `apksigner verify --verbose`: firma v2 válida con certificado `Android Debug`.
- Verificación final: `npm run lint`, `npm run mobile:check`, Prettier y `git diff --check` aprobados.
- No había dispositivo ADB conectado para instalarlo. El APK fue generado y firmado con la clave de depuración; falta la verificación visual e instalación en un teléfono físico.

## Ajustes visuales y calendario movil - 2026-09-26

- `npm run lint`: aprobado sin errores ni advertencias.
- `npm run mobile:check`: dependencias compatibles con Expo 57.
- `npm run mobile:export`: bundles Android/iOS generados; incluye solo Poppins 400, 500, 600, 700 y 800, Feather y la fotografia local del hero.
- `npm audit --audit-level=moderate`: cero vulnerabilidades reportadas. Falta la inspeccion visual interactiva en el emulador tras ejecutar la app.

## Hero móvil con imagen local - 2026-09-26

- `npm run mobile:export`: aprobado para Android e iOS. Metro incorporó explícitamente `apps/web/public/demo/pool.jpg` (484 KB) como asset local compartido con la web.
- Prettier y `git diff --check`: aprobados. La comprobación visual nativa requiere recargar Expo en el emulador; no depende de Internet para mostrar el hero.

## Fase 21 Documentacion - 2026-09-26

- Enlaces locales revisados en README, guias `docs/` y 10 documentos de contexto: 13 documentos, cero enlaces rotos.
- Prettier aprobo README, ambas guias y los documentos Markdown modificados; `git diff --check` no encontro whitespace invalido.
- `npm run check`: lint aprobado, 23/23 pruebas aprobadas y build Vite exitoso. No se ejecutaron runtime Docker, dispositivos nativos, carga, staging ni despliegue.

## Cierre Fase 20 CI/CD - 2026-09-26

- Primera ejecucion local de `npm run check`: fallo antes de las pruebas por PostgreSQL local detenido (`ECONNREFUSED 127.0.0.1:55432`). Se inicio el cluster aislado con `npm run db:local` y se repitio el gate.
- Repeticion: lint aprobado, 23/23 pruebas aprobadas y build Vite exitoso.
- `npm audit --audit-level=moderate`: cero vulnerabilidades. `npm run containers:verify`: configuracion dev/test/prod, secretos externos y hardening declarados aprobados.
- `npm run mobile:check` detecto que Expo 57.0.23 no cumplia la version compatible `~57.0.25`; se actualizo `apps/mobile/package.json` y `package-lock.json`. La repeticion paso y `npm run mobile:export` genero bundles Android/iOS.
- `npm ci` posterior reinstalo 766 paquetes desde el lockfile y termino con cero vulnerabilidades. La ejecucion remota se documentara al concluir.
- Primera corrida GitHub Actions `36255276776` sobre `c021c83`: `verify` aprobado, incluido build real de imagenes Docker en Linux. E2E: 41 aprobadas, una omitida y dos fallos (desktop/mobile) en la misma prueba de imagen rota.
- Causa del fallo remoto: la prueba abortaba `*.jpg`, pero el navegador elegia las variantes WebP responsivas. La aplicacion funcionaba; el escenario ya no simulaba el fallo completo. Se cambio la intercepcion para JPG/JPEG/WebP y se prepara una segunda corrida.
- `node scripts/verify-web-integration.mjs tests/e2e/marketplace-integration.spec.js --grep "imagen fallida"`: 2/2 aprobadas, desktop y mobile, despues de la correccion.
- El runner advirtio que `checkout@v4`, `setup-node@v4` y `upload-artifact@v4` usaban runtime Node 20. Se actualizaron a las versiones compatibles con Node 24 (`v5`, `v5`, `v6`).
- Segunda corrida GitHub Actions `36255899826` sobre `656f899`: `verify` aprobado sin advertencias/errores; instalacion/auditoria, lint, 23/23 pruebas, build web, compatibilidad/export Android+iOS, validacion y build Docker aprobados.
- En la misma corrida, `e2e` aprobo 43 pruebas, omitio deliberadamente una repeticion responsive y no tuvo fallos. Ambos jobs concluyeron `success`.

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

| Comprobacion                     | Resultado                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| npm run setup repetido           | Migraciones vigentes, permisos reaplicados, fixtures sin duplicar                    |
| npm run lint                     | Exit 0, sin advertencias                                                             |
| npm test                         | 23 aprobadas, cero fallos, base temporal real PostgreSQL                             |
| npm run build                    | Exit 0, Vite 8.3; entrada JS 246.03 kB / gzip 77.08 kB                               |
| npm run test:e2e                 | Seis aprobadas: escritorio 1440x1000 y mobile 390x844                                |
| npm audit --audit-level=moderate | Cero vulnerabilidades reportadas                                                     |
| expo install --check             | Dependencias compatibles tras ajustar AsyncStorage                                   |
| expo-doctor                      | 21 de 21 comprobaciones aprobadas                                                    |
| expo export Android/iOS          | Bundles generados; no equivale a instalar una app nativa                             |
| scripts/verify-permissions.mjs   | API no superusuario; auditoria/migraciones protegidas; reporte sin acceso a usuarios |
| npm run report                   | PHP 8.5/PDO consulto correctamente vista agregada                                    |
| npm run db:verify-restore        | Backup restaurado, conteos y constraint GiST conservados                             |
| Compose config --quiet           | Configuracion valida; no hay motor para ejecutar contenedores                        |

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
