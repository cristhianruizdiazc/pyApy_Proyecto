# Historial de trabajo

## 2026-11-08 — Fase 7 del rediseño

- Cierre integrado de las fases 0–7, matriz por rol y comparativas antes/prototipo/después.
- Variantes lossless del logo tras redimensionar; favicon y tamaños por DPR. Se conserva el PNG original.
- Fila horaria adaptable para controles nativos Firefox; títulos/calendario legibles con texto al 200% en 320 px. Nueva cadena real de alternativa a cancelación y regresión de texto ampliado.
- Fase 7 del rediseño completada en su alcance local: comparación visual, recorridos por rol y correcciones de reflow en Firefox y con texto ampliado. Logo responsive transparente de 10/30/56 KB, original conservado. Lint/build/formato, 36/36 API/contratos, **241 escenarios distintos aprobados en Chrome y siete omisiones duplicadas**, más **42 aprobados en Firefox**. 95 capturas reales, 44 Axe reales sin violaciones detectadas y 24 corridas comparativas Lighthouse aceptadas con tres repeticiones por caso (40 ejecuciones contando diagnóstico, resultados reemplazados y sondas finales). Sin cambios de API/DB/dependencias ni despliegue. HTTPS de staging no ejecutado por Docker detenido; dispositivos, lectores reales y WCAG integral pendientes. [Informe y límites](phases/rediseno-fase-7-2026-11-08.md).

## 2026-11-08 — Fase 6 del rediseño

- Propietario: navegación adaptable, espacios/formularios, fotos, datos de llegada privados, redes, calendario/agenda, reservas/bloqueos y planes.
- Administración: nueve secciones operativas, tablas desplazables por teclado y formularios con el sistema visual. URLs, límites cargados, permisos y acciones conservados.
- Ayuda con pasos y FAQ; estados comunes de incorporación, sesión, acceso y 404. Retirados 68 bloques CSS exclusivos reemplazados; controles de cuenta preservados.
- Lint/build/formato, 36/36 API y 132 E2E aprobados más cuatro omisiones duplicadas. 84 capturas reales; 36 Axe reales y 26 simulados sin violaciones detectadas. Reflow 320–1920, incluidos 1080/1081.
- [Entrega e incidencias](phases/rediseno-fase-6-2026-11-08.md), contexto y resguardo actualizados. Sin cambios de esquema/API/dependencias ni despliegue. Fase 7 pendiente.

## 2026-11-08 — Fase 5 del rediseño

- Acceso/registro con hoja del sistema visual, modo en URL y retorno conservado; formulario bloqueado mientras envía y errores con foco.
- Cuenta con navegación, bienvenida, accesos y perfil de consulta; notificaciones con estado y controles contextualizados. Guardados reutiliza tarjetas/precio horario; reservas y diálogos adoptan composición personal conservando operaciones y permisos.
- Recuperación explícita tras 401 al quitar favorito, guard de envíos repetidos y foco en avisos consecutivos. Etiquetas acentuadas y localizadores ajustados; retiradas 41 reglas exclusivas antiguas y preservados consumidores de gestión.
- Lint/build y 36/36 API/contratos aprobados; ocho suites E2E con 138 escenarios distintos aprobados y cuatro omisiones de barridos duplicados. 68 capturas con API real aislada en 12 anchos, 14 Axe reales y 20 de la suite nueva simulada sin violaciones detectadas.
- [Entrega y límites](phases/rediseno-fase-5-2026-11-08.md). Resguardo y contexto actualizados. Sin cambios de esquema/API, dependencias o despliegue. Fases 6–7 pendientes.


## 2026-11-07 — Fase 4 del rediseño

- Ficha con hoja blanca y barra/anclas, galería lateral de foto completa y miniaturas, selección/visor accesible; distribución apilada hasta 980 px.
- Reserva con precio horario e intervalo/duración/personas antes de consultar; cotización, confirmación y recuperación originales preservadas. Mapa diferido, muestras, reglas, opiniones, redes, similares y retorno conservados.
- Retiradas 53 reglas exclusivas antiguas; controles/redes compartidos preservados. Flechas de galería operables desde Cerrar. Pruebas de autenticación actualizadas a la navegación/anuncios vigentes.
- Lint/build, 36/36 API/contratos y 97 escenarios E2E distintos aprobados más una omisión de barrido duplicado, combinando general y revalidación de interés. 30 capturas de aplicación con API real aislada y dos del prototipo; 12 anchos de 320 a 1920, ocho Axe reales y siete simulados sin violaciones detectadas.
- [Entrega y límites](phases/rediseno-fase-4-2026-11-07.md); contexto y guía visual actualizados. Sin cambios de DB/API ni despliegue. Fases 5–7 pendientes.


## 2026-11-07 — Fase 3 del rediseño

- Resultados con resumen, orden/página y tarjetas con foto 4:3, tipo/muestra, datos/servicios/valoraciones existentes, favorito, estimación de API y precio horario. Alternativas por etapa, diferencias, interés y retorno conservados.
- Mapa Leaflet/OSM explícito y diferido, limitado a exactas de la página. Panel lateral desde 1181 px y alternancia lista/mapa hasta 1180; selección/teclado, foco, resize y encuadre sin recortar popup. El desplazamiento bajo un puntero estacionario no sustituye la selección del marcador.
- `SearchPropertyCard.jsx` y `results.css` separan los resultados de cuenta/similares aún pendientes. Se retira `home-reference.css` y 38 selectores exclusivos de resultados de las hojas anteriores; utilidades compartidas conservadas.
- Lint/build y 36/36 API aprobados. 108 E2E distintos aprobados más cuatro omisiones duplicadas, combinando la general con revalidación de imágenes; intentos iniciales y bloqueos del navegador documentados. 24 capturas reales en 12 anchos, cuatro Axe reales y cuatro nuevos simulados sin violaciones detectadas.
- [Cierre y evidencia](phases/rediseno-fase-3-2026-11-07.md), guía visual y continuidad actualizados. Sin cambios de DB/API/negocio, dependencias ni despliegue. Fases 4–7 pendientes.

## 2026-11-05 — Fase 2 del rediseño

- Hero con buscador integrado, beneficios, anfitriones/pasos y anclas; publicación real por sesión/rol, ayuda y sponsors conservados.
- Intervalo/duración visibles con filtros cerrados; precio por hora, presupuesto total con fecha y estimado sin ella. Conservados URL/borrador, 18 personas, 24 h inicial, horario nocturno, tipos y servicios/requisitos. Se muestran requisitos desconocidos recibidos por URL.
- `home.css` sustituye 253 selectores migrados de tres hojas; WebP del hero y foto ilustrativa de anfitriones con atribución. No hay dependencias nuevas, API, migraciones ni despliegue.
- Envío enfoca resultados y anuncia su estado/conteo. Pruebas adaptadas a destinos, muestras reservables, etiquetas y fuentes estables; historial de fallos conservado.
- Lint/build, 36/36 API y 87 E2E distintos aprobados, tres omisiones duplicadas; retorno final 20/20. 13 capturas completas reales, cinco Axe reales y ocho simulados sin violaciones detectadas en sus estados.
- [Cierre y límites](phases/rediseno-fase-2-2026-11-04.md), guía visual y continuidad actualizados. Fases 3–7 pendientes.

## 2026-11-04 — Fase 1 del rediseño

- Tokens del HTML principal y siete fuentes locales Fraunces/Poppins; retiradas carga externa e imposiciones tipográficas que impedían el diseño.
- Nuevos `SiteLayout.jsx`/`site-layout.css`: marca elegida, cabecera/menú/cuenta por rol y pie con enlaces reales. Retiradas sus reglas duplicadas de tres hojas anteriores.
- Base coherente de formularios, botones, carga/error/vacío/éxito y diálogos; salto al contenido enfocable, foco visible, Escape y recuperación al cambiar distribución; scroll de documento bloqueado durante modal.
- 36/36 API, 64/64 regresiones y 18 E2E compartidas/focalizadas aprobadas; dos barridos duplicados omitidos. 24 capturas con API aislada, 14 Axe reales y cuatro simulados sin violaciones detectadas en esos estados. Corridas iniciales y corrección del foco documentadas.
- [Cierre de fase 1](phases/rediseno-fase-1-2026-11-04.md), [guía efectiva](design/SISTEMA-VISUAL.md), resguardo previo y `.context` actualizados. Sin cambios de esquema, API, contratos o despliegue; fases 2–7 pendientes.

## 2026-11-04 — Fase 0 del rediseño

- Fijada la referencia principal del ZIP por SHA-256, separadas capturas/variante anidada y documentadas las adaptaciones de precio horario, OpenStreetMap, reserva y funciones reales.
- Inventario por ruta/rol/acción/destino y matriz de tamaños, estados y recorridos en [entrega de fase 0](phases/rediseno-fase-0-2026-11-04/INFORME.md).
- Resguardados los cambios previos y archivos sin seguimiento; bundle Git verificado y 50/50 archivos restaurados con hashes coincidentes en directorio aparte.
- 111 capturas locales, 16 controles Axe sin violaciones detectadas en esos estados, cuatro corridas Lighthouse, 36/36 pruebas API y 104/110 E2E originales aprobadas. Seis fallos anteriores al rediseño conservados con diagnóstico y seguimiento; no se presentan como corregidos.
- Base y uploads de prueba aislados antes de iniciar sesiones/eventos/escrituras. Añadido capturador local reutilizable; sin cambios en componentes, estilos, contratos ni pruebas existentes. Plan y estado actualizados: fase 0 completada, fases 1–7 pendientes.

## 2026-11-03 — Plan de rediseño del frontend

- Registrada la dirección elegida por el usuario: replicar lo máximo posible la estructura del prototipo preservando funciones, cálculo horario y OpenStreetMap. Descartados precio nocturno y mapa esquemático.
- Creado [plan de ocho fases](phases/rediseno-frontend-2026-11-03.md), desde referencia e inventario hasta validación integrada; todas las fases están pendientes de implementación.
- Adoptado [ADR-013](decisions/ADR-013-frontend-redesign.md). TAREAS.md deja de ser la guía de mejora web y se conserva como evidencia histórica; no se copian automáticamente sus pendientes.
- Actualizados índices de contexto, decisiones y estado. Esta entrega modifica únicamente documentación; no cambia la aplicación ni declara verificaciones funcionales ejecutadas.

## 2026-10-30 — T08: continuar la tarea después de ingresar

- Ingreso y registro conservan un destino local validado y reemplazan el formulario en el historial. Búsqueda/ficha mantienen filtros, selección de reserva y contexto de T07; cuenta, reservas, guardados y publicación vuelven a su destino.
- Interés y favorito muestran una confirmación pendiente con foco, opción de descarte y resultado/error visibles. Revisar la ficha conserva el favorito pendiente. Sin escrituras ni consultas de reserva automáticas por ingresar; se preserva también la acción de quitar favorito tras una sesión vencida.
- Publicación respeta roles: panel para owner/admin, alta explícita para client. Consultas privadas vencidas ofrecen reingreso sin bucles y la cotización conserva el borrador. Sin cambios en contratos, permisos del servidor ni idempotencia de reserva.
- La continuación tiene precedencia sobre la posición recordada de T07 para mantener visible el aviso. Se conservó la restauración normal al comparar fichas.
- T08 marcada como completada en TAREAS.md. **76/76 pruebas Playwright aprobadas**, lint, build, formato y diff comprobados. Evidencia en `.local/t08/QA.md`; Chromium con API simulada. Autenticación/persistencia real en entorno aislado sigue en T13; otros motores/dispositivos y lectores en T14.

## 2026-10-30 — T07: retorno a resultados con contexto

- Tarjetas y mapa trasladan la URL completa de búsqueda en `returnTo`. La ficha muestra «Volver a resultados» con origen válido, también en error; las fichas similares y el retorno de ingreso de reserva conservan el contexto.
- Validación de origen limitada a la raíz local; acceso directo o destino inválido ofrecen «Explorar espacios». Los enlaces funcionan al recargar, compartir y abrir una pestaña nueva.
- Restauración de posición por URL en memoria después de renderizar resultados; no persiste entre recargas. Conservados filtros, selección de reserva, contratos y cambios previos.
- Cobertura reproducible en `tests/e2e/search-return.spec.js`; alcance y evidencia en `.local/t07/QA.md`. Chromium con API simulada; backend real y otros navegadores/dispositivos siguen en T13/T14.
- T07 marcada como completada en TAREAS.md. 42/42 pruebas aprobadas (10 de retorno y 32 de regresión), lint, build, formato y diff comprobados.

## 2026-10-30 — T06: acceso único al mapa

- Unificado el acceso de portada/resultados en «Ver mapa / Ver espacios», visible antes del contenido, con altura mínima de 44 px y separación propia. Eliminados el botón duplicado, la fila de altura cero y la dependencia de hover que provocaban superposición.
- El cambio de vista conserva filtros, URL y resultados y mantiene la carga diferida. Vacío/error muestran la causa de indisponibilidad; el retorno a espacios sigue disponible si el mapa ya estaba abierto.
- Pruebas reproducibles de geometría a 360/390/768/1440 px, teclado, toque emulado, recuperación y carga diferida en `tests/e2e/search-map.spec.js`. Evidencia local y alcance en `.local/t06/QA.md`; TAREAS.md actualizado. API y teselas simuladas, sin escrituras en datos habituales.
- 32/32 pruebas aprobadas: 18 de mapa y 14 de regresión de etiquetas/personas; lint, build, formato y diff aprobados.

## 2026-10-30 — Buscador compacto

- Alineación de etiquetas y valores del buscador: separación uniforme de 6 px, etiquetas con línea de 20 px, controles de 32 px y centrado interno de los selectores `base-select`. Eliminadas diferencias entre Horario, Personas y el resto. Inspección visual y geometría a 1440 px: cinco controles con la misma coordenada vertical y altura; verificación responsive y build.
- Personas ahora acepta únicamente dígitos (también al pegar), sin signos, decimales ni exponentes. Campo de texto con `inputMode="numeric"` y flechas arriba/abajo bloqueadas, sin controles nativos de incremento. Se conserva validación 1–1000, vacío opcional, foco de error y continuidad de URL/ficha/cotización. 14/14 pruebas de personas/etiquetas aprobadas en Chromium escritorio/móvil emulado con API simulada; lint, build y formato aprobados.
- Ajuste visual posterior solicitado: campos sin bordes redondeados ni fondos individuales; líneas verticales entre campos de una misma fila y horizontales en móvil. Placeholder «Sin cantidad» con `var(--ink)` y opacidad 1, igual a los valores de la fila. Verificados 16 escenarios responsive adicionales con API simulada, build, formato y diff.
- A pedido del usuario, los cinco campos y Buscar comparten una fila cuando el contenedor dispone de al menos 1080 px (aproximadamente 1368 px de ventana con el ancho actual). Se mantienen tres/dos/una columnas en espacios menores, controles de 14 px y etiquetas accesibles existentes.
- Distribución con anchos distintos por campo, menos separación vertical y botón ajustado al contenido. «Día completo (24 h)» conserva el turno de 24 horas; el horario personalizado muestra su intervalo completo, incluidos segundos cuando existen.
- Chromium con API interceptada: 32 escenarios responsive de portada/resultados aprobados, incluidos ciudad larga, horario con segundos y presupuesto de mil millones; 12/12 pruebas existentes de etiquetas/personas aprobadas. Lint, build, formato y diff comprobados.
- Panel principal de 175,4 a 91,7 px a 1440 px; 176 a 92 px a 1920 px. Inspección visual a 390/1368/1440 px y comprobación de reflow equivalente a reducción de viewport por zoom. Evidencias locales en `.local/compact-search/QA.md`; otros motores/dispositivos y backend real siguen pendientes.

## 2026-10-26 - Lanzador de Windows

- Detectada copia del BAT en el Escritorio: buscaba `node_modules` junto a esa copia y fallaba aunque el proyecto tuviera Vite instalado.
- Convertido el BAT del Escritorio en un acceso al lanzador de `C:\pyApy_Proyecto`.
- El lanzador del proyecto comprueba dependencias principales de web/API y ejecuta `npm ci --include=dev` si faltan; detiene el arranque si la reparacion falla. Conservados requisitos de Node 24 y configuracion PostgreSQL.
- Documentado el comportamiento en `docs/DEVELOPMENT.md`.
- Verificacion desde el BAT del Escritorio: instalacion automatica de 769 paquetes, PostgreSQL listo, Vite y API iniciados; web y `/api/health` respondieron HTTP 200. npm informo 10 vulnerabilidades (1 moderada y 9 altas), sin aplicar actualizaciones ajenas al arreglo.

## 2026-10-25 — Búsqueda por etapas

- Selección, conteo y paginación SQL sin recorte previo de 500; requisitos indispensables y etapas de una sola diferencia.
- Configuración validada de radios, sobreprecio, alternativas, exploración y consultas; fechas realmente comprobadas, bloqueos y reglas respetados.
- Web responsive con agrupación, diferencias y traslado explícito del intervalo; turno inicial de 24 horas conservado. React Native congelado por ADR-011.
- Migraciones 004/005, preferencias del interés guardado y analytics agregados sin PII de búsqueda. Documentación y evidencia en [informe](phases/progressive-search-2026-10-25.md) y [ADR-012](decisions/ADR-012-progressive-search.md).

## 2026-10-22 - Alcance web para v1

- Decisión del usuario: no continuar el desarrollo de la aplicación React Native durante esta v1 y concentrar producto, pruebas y lanzamiento en la web responsive.
- Se conserva `apps/mobile` y su evidencia histórica, sin eliminación; queda congelada como base posible para una etapa posterior.
- Paridad nativa, dispositivos, firma de tiendas, caché móvil y advisories Expo/Metro dejan de bloquear v1 web, pero no se consideran resueltos.
- Fase 25 continúa condicionada por infraestructura web remota, CA pública, secretos, alertas y backup externo.
- Decisión formalizada en [ADR-011](decisions/ADR-011-web-first-v1.md) y sincronizada con estado, backlog y riesgos.

## 2026-10-22 - Fase 24 preproduccion aislada

- Desplegado `pyapy-staging` con API en modo produccion, TLS local, DB/uploads persistentes y servicios internos no publicados.
- Aprobados smoke, E2E de sesion/cookie segura, 23/23 pruebas de concurrencia/seguridad y probe de monitoreo.
- Generados backups de PostgreSQL y uploads; restore aislado confirmo dos migraciones y el constraint de exclusion.
- Ensayado rollback real a las imagenes RC anteriores y retorno a candidatas, con health y smoke en ambos sentidos.
- Documentada la brecha externa: sin host/dominio, CA publica, secretos gestionados, alertas remotas ni dispositivo nativo no se propone produccion.

## 2026-10-22 - Revalidación y cierre de Fase 23

- Actualizados parches de Vite, sharp, Expo y expo-crypto; fijados shell-quote e ip-address corregidos.
- Aprobados instalación limpia, setup, lint, 23 pruebas, build web, 45 E2E, export Android/iOS, permisos, reporte PHP y restore aislado.
- Iniciado Docker Desktop y comprobados build, runtime saludable, web/API, 23 pruebas en contenedor y persistencia de DB/uploads.
- Dockerfiles endurecidos con reintentos y descarga serializada para tolerar resets del registro npm.
- Registrados 16 advisories altos upstream de Expo/Metro sin parche compatible; no se aplicó un downgrade mayor destructivo.
- Fase 23 cerrada como candidata técnica local, sin declarar staging ni producción.

## 2026-09-27 - Candidata técnica Fase 23

- Instalación limpia con `npm ci --ignore-scripts`, migraciones y fixtures ficticios verificados.
- `npm run check`, mobile check, exportación Android/iOS y auditoría de dependencias aprobados.
- E2E oficial aislada: 43 pruebas aprobadas y una repetición responsive omitida deliberadamente.
- Docker runtime e instalación física nativa quedan pendientes por limitaciones del entorno; no se declara release de producción.

## 2026-09-27 - Fase 22 Auditoria final

- Creada la matriz formal antes/despues con los 21 riesgos clasificados y evidencia por estado.
- Reejecutados `npm run check`, compatibilidad Expo, verificacion de contenedores, auditoria de dependencias y restauracion aislada de PostgreSQL.
- Confirmadas las brechas de produccion: Docker runtime, staging, dispositivos nativos, recuperacion de cuenta, MFA, backup de archivos, carga e integraciones externas.
- Fase 22 cerrada sin declarar pyApy 1.0 ni produccion lista.

## 2026-09-27 - APK móvil de demostración offline

- Incorporado un modo de demostración compilable mediante `EXPO_PUBLIC_OFFLINE_DEMO=true`: catálogo ilustrativo y tres fotografías locales incluidos en el APK, sin llamadas a API ni base de datos.
- Definido el identificador Android `com.pyapy.mobile` y generado localmente `android/app/build/outputs/apk/debug/app-debug.apk` para instalación directa.
- El artefacto está firmado con la clave de depuración de Android: sirve para una demostración en teléfono, pero no para publicar en Play Store ni como distribución de producción.

## 2026-09-26 - Ajustes visuales y calendario movil

- Aplicada Poppins a la interfaz movil con cinco pesos empaquetados y jerarquia tipografica ajustada.
- Reemplazada la digitacion de fecha por el calendario nativo en busqueda y reserva, con fecha minima de hoy y formato visible en espanol.
- Campos de texto y selector de fecha usan radio de 10 px; el hero mantiene su fotografia local y fija el mensaje anterior como superposicion inferior.
- Agregadas dependencias Expo compatibles para fuentes y fecha, con lockfile y plugins nativos sincronizados.

## 2026-09-26 - Hero móvil con imagen local

- La portada de Expo ahora empaqueta la misma foto demo `pool.jpg` del hero web, en vez de solicitarla por HTTP a la API.
- El hero conserva el encuadre `cover`, texto legible y una etiqueta accesible; la fotografía queda disponible aunque el emulador no tenga Internet.

## 2026-09-26 - Fase 21 Documentacion

- Consolidada la guia de desarrollo en `docs/DEVELOPMENT.md` y la guia de operacion/entrega en `docs/OPERATIONS.md`.
- README raiz actualizado con las guias y evidencia CI; corregida la afirmacion obsoleta sobre build Docker.
- Sincronizados arquitectura, base, API, seguridad, operaciones, backlog, estado y contexto con la evidencia de Fase 20.
- No se declaro staging, despliegue, backup integral ni produccion como implementados.
- Validacion documental aprobada: 13 documentos sin enlaces locales rotos, Prettier y `npm run check` (23 pruebas y build web).

## 2026-09-26 - Cierre de Fase 20 iniciado

- Corregida la incompatibilidad detectada por el gate mobile: Expo actualizado de 57.0.23 a `~57.0.25`, con lockfile regenerado.
- Validados lint, 23 pruebas, build web, auditoria sin vulnerabilidades, configuracion de contenedores, compatibilidad y export Android/iOS.
- Verificada instalacion limpia de 766 paquetes mediante `npm ci`; en ese punto la corrida remota era el ultimo gate pendiente.
- Primera corrida remota: job principal aprobado con Docker; E2E expuso que una regresion de imagen rota no interceptaba las variantes WebP (41 aprobadas, una omitida, dos fallos equivalentes).
- Ajustada la intercepcion a JPG/JPEG/WebP y actualizadas las acciones oficiales a runtimes Node 24 para eliminar advertencias de deprecacion.
- Segunda corrida remota `36255899826` sobre `656f899`: `verify` y `e2e` aprobados; 23 pruebas unitarias/API y 43 E2E aprobadas, una repeticion responsive omitida.
- Fase 20 cerrada y `.context` sincronizado. No se agrego deploy; staging y rollback continuan pendientes.

## 2026-09-25 - Fase 20 CI/CD

- Reorganizado GitHub Actions en gates de calidad/build/contenedores y E2E con PostgreSQL efimero independiente.
- Incluidos instalacion con lockfile, auditoria de dependencias, lint, pruebas, builds web/movil, Compose/Docker y diagnosticos de fallo E2E.
- No se configuro despliegue ni se enviaron cambios al remoto; staging, secretos administrados y rollback siguen pendientes.
- Detalle: [Fase 20](phases/phase-20-cicd.md), [ADR-010](decisions/ADR-010-ci-pipeline.md).

## 2026-09-24 - Fase 19 Docker y entornos

- Separadas las etapas Docker production/test y agregado perfil Compose de pruebas aisladas.
- Parametrizados demo/seed, ejemplo de produccion sin secretos y verificador estatico de Compose/hardening.
- Configuracion validada sin motor; build/up/smoke/volumenes quedan como gate obligatorio en host Docker.
- Detalle: [Fase 19](phases/phase-19-docker.md), [ADR-009](decisions/ADR-009-container-environments.md).

## 2026-09-24 - Rendimiento UX 01

- Agregadas variantes WebP 640/1280 para fotos demo, con JPEG como fallback y script reproducible.
- El hero solo monta la imagen activa; tarjetas y ubicaciones demo seleccionan fuentes responsivas.
- LCP movil local bajo de aproximadamente 8.2 s a 2.64 s en portada y 3.24 s en ficha; el cierre posterior redujo CLS desktop de ficha a 0.003.
- Agregado `robots.txt`; SEO de Lighthouse subio a 1.00 en las corridas locales.
- Alcance, evidencia y limites: [performance UX 01](phases/performance-ux-01.md), [ADR-008](decisions/ADR-008-demo-image-delivery.md).
- Cierre local de Fase 18: skeleton de ficha reduce CLS desktop de 0.121 a 0.003; el mapa se carga bajo demanda y su prueba E2E pasa en desktop/mobile. Revision SQL sin cambios de esquema por muestra no representativa.

## 2026-09-24 — Auditoría automatizada de accesibilidad

- Ejecutado Axe sobre 60 estados del build web en desktop/mobile.
- Corregida la jerarquía de encabezados de tarjetas, reservas, espacios y estados vacíos.
- Autenticación conserva un `h1` visible en móvil; el título sobre la imagen pasó a texto decorativo.
- Resultado final: 0 violaciones Axe, 0 overflow y 0 errores de página.
- Documentados alcance y límites en [ADR-006](decisions/ADR-006-accessibility-heading-audit.md); siguen pendientes WCAG integral, lector, zoom y Lighthouse.
- Lighthouse dejó línea base: rendimiento 0.67/0.69 en mobile, 0.93/0.94 en desktop y LCP mobile de aproximadamente 8.2 s; se registra como deuda, no como aprobación.
- Evidencia y decisión en [ADR-007](decisions/ADR-007-performance-baseline.md).

## 2026-09-19 — Integración UI 03, cuenta y gestión

- Cuenta con navegación propia, datos de perfil desplegables, avisos sin leer/todos y búsqueda de guardados/reservas.
- Extraídos Workspace y Reservations: pestañas accesibles, estados de consulta, filtros locales y presentación gradual de registros cargados.
- Propietario con tres métricas principales, actividad secundaria, formularios agrupados, fotos/contacto/redes separados y calendario compacto con agenda.
- Administración con sección en URL, tablas agrupadas/desplazables, filtros y auditoría con identificadores desplegables; capacidades actuales conservadas.
- Llegada privada con carga/error y descarte de respuestas tardías; consultas privadas identificadas por usuario y habilitadas según sección.
- Lint/build y 23 pruebas aprobados; E2E final: 41 aprobadas y una repetición omitida. Corregidos selectores de pruebas y timeout de captura; no se relajaron aserciones de negocio.
- Fixture exacto de ejecución interrumpida cancelado/despublicado por API, conservando auditoría. Sin cambios de esquema/backend/dependencias.
- Detalles, evidencia y pendientes: [UI 03](phases/integration-ui-03.md).

## 2026-09-19 — Integración UI 02, detalle y reserva

- Galería adaptable a fotos disponibles, visor accesible con miniaturas/flechas/Escape/foco y fallback; detalle con identidad artesanal y reserva prioritaria en móvil.
- Selección fecha/horario/personas trasladada desde tarjetas/mapa y conservada al ingresar/registrarse.
- Panel extraído, estado aislado por propiedad/usuario/URL, cancelación/revisión de consultas; cotizaciones tardías o incompletas no habilitan confirmar.
- Guarda síncrona contra doble clic, inputs bloqueados durante envío, cuerpo/UUID estable, recuperación por pestaña y usuario ante resultado ambiguo o JSON ilegible.
- Confirmación basada en respuesta de API, conflicto 409 recuperable, precio revalidado, datos de ocupación con error/reintento separado del vacío.
- Suite completa: 27 E2E aprobadas y una repetición omitida. Seis regresiones focalizadas aprobadas tras último guard; 23 pruebas de dominio/API y lint/build aprobados.
- Corregido exceso de login de fixtures; runner opcional de procesos aislados sin relajar rate limiting. Primer fallo HTTP 429 registrado.
- Sin cambios de backend, base, dependencias ni tecnologías; informe y archivos en [UI 02](phases/integration-ui-02.md).

## 2026-09-19 — Integración UI 01, artesanal sutil

- Tres agentes analizaron frontend actual, primera versión y compatibilidad de arquitectura/contratos.
- Destino autorizado: `apps/web`, con React/CSS/API vigente; conservados PostgreSQL, Node, PHP, React Native, Docker y OSM.
- Hero editorial/fotográfico, paleta marfil/verde/terracota, SVG nuevos inspirados en ñandutí y encaje ju, responsive y controles de reproducción accesibles.
- Buscador extraído con borrador controlado, filtros progresivos, horario visible y sincronización URL/historial; categorías conservan el borrador y se restablece paginación al cambiar criterios/orden.
- Tarjetas legibles, selección desde mapa, fallback real de imágenes, menú móvil/Escape/foco y logout visible con errores manejados; diálogo con nombre accesible.
- Separados carga, fallo de consulta, vacío y alternativas; reintento y aviso del límite de búsqueda.
- 23 pruebas y 13 E2E aprobadas, una repetición responsive omitida; lint/build y cinco anchos verificados. Capturas revisadas. Sin cambios de base/API/dependencias.
- Documentados alcance, archivos, procedencia, ADR, evidencia y pendientes en [integration-ui-01](phases/integration-ui-01.md).

## Vista HTML solicitada por el usuario

- Creado index.html en raiz y 39 pantallas HTML adicionales con indice de navegacion completo.
- Recursos locales, CSS responsive y filtros sin JavaScript; no requiere Docker ni servidor para visualizar.
- Portada, catalogo, seis fichas y ejemplos de reserva, cliente, propietario y administrador.
- Datos ficticios y acciones de backend deshabilitadas; sin exportar credenciales ni informacion de la base.
- Verificadas las 40 pantallas a 1440/390/320 px usando file:// con red desactivada, 1754 enlaces/recursos y filtros CSS.
- README actualizado con acceso directo. Se conserva la aplicacion React/API original.

## 2026-09-17 - Implementacion local 0.1.0

- Autorizacion de continuidad recibida; arquitectura y contratos compartidos implementados desde cero.
- PostgreSQL aislado, dos migraciones, API sin superusuario, PHP con acceso agregado y secretos locales ignorados.
- Marketplace React, cuentas y paneles, propiedades/imagenes/mapas, matching, reservas/calendario y administracion.
- Exclusion real de reservas, idempotencia, precio server-side, cancelacion, llegada privada y proteccion de compromisos ante edicion.
- React Native con API real, SecureStore, cache y cola offline; export Android/iOS verificado, sin pruebas de dispositivo.
- Outbox y notificaciones internas, planes manuales, sponsors y analytics iniciales; sin integraciones externas ficticias.
- 23 pruebas y seis E2E aprobadas; lint/build/audit, permisos, PHP y backup/restore comprobados.
- Extensiones ESLint, Prettier y Containers instaladas; PHP 8.5 y Compose locales verificados por checksum.
- Dockerfiles y CI creados; Compose validado, motor Docker y ejecucion CI pendientes.
- README y contexto actualizados con brechas explicitas. No se declara release candidate ni produccion 1.0.

## 2026-09-16 - Fase 0

- Leido el prompt maestro completo y revisadas sus restricciones de fases.
- Inspeccionado el workspace, incluidos archivos ocultos: vacio antes de este trabajo.
- Confirmado con el usuario que no existe una base anterior.
- Comprobadas herramientas locales, versiones y extensiones de VS Code.
- Detectado PHP 7.2.32 sin soporte y documentada la disponibilidad limitada de Docker y PostgreSQL.
- Creada exclusivamente documentacion dentro de `.context`, incluida copia del prompt original.
- Registrados inventario, arquitectura inexistente, APIs, base, seguridad, riesgos y propuesta de Fase 1.
- No se modificaron ni eliminaron archivos previos. No se creo codigo de aplicacion, repositorio Git, esquema, credenciales o despliegue.
- No se instalaron extensiones ni dependencias: la fase documental no requirio nuevas herramientas.
