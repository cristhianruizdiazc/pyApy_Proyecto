# Historial de trabajo

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
