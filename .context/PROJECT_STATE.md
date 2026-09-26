# Estado de pyApy

Actualizado: 2026-09-24, America/Asuncion.

## Estado vigente

Fase 20 configurada localmente: GitHub Actions separa gates de calidad/build/contenedores de E2E, usa PostgreSQL efimero y conserva diagnosticos ante fallo. No existe job de despliegue: falta aprobar staging, secretos gestionados, monitoreo, backup integral y rollback. La primera ejecucion remota aun no se confirma. Ver [Fase 20](phases/phase-20-cicd.md) y [ADR-010](decisions/ADR-010-ci-pipeline.md).

Fase 19 cerrada para configuracion local: Compose separa imagen `production` y perfil `test`, fixture demo explicito, secretos fuera de Git y ejemplo de produccion sin credenciales. La validacion estatica de ambas variantes paso; falta el gate real de build/up/health/volumenes porque este equipo no tiene motor Docker. Ver [Fase 19](phases/phase-19-docker.md) y [ADR-009](decisions/ADR-009-container-environments.md).

Fase 18 cerrada en alcance local: WebP responsivo demo, hero bajo demanda, skeleton de ficha y mapa explicito bajaron LCP movil a 2.50/3.33 s (portada/ficha) y CLS desktop de ficha a 0.003. La revision de planes SQL demo no justifica cambios estructurales. Las cuatro corridas Lighthouse alcanzaron 1.00 en accesibilidad, best practices y SEO. No son SLO ni evidencia de carga/produccion. Ver [rendimiento UX 01](phases/performance-ux-01.md) y [ADR-008](decisions/ADR-008-demo-image-delivery.md).

Integración UI 03 completada: cuenta/favoritos/reservas y paneles de propietario/admin con identidad coherente, información progresiva, filtros sobre registros cargados, pestañas accesibles con historial y calendario con agenda. Consultas fallidas se distinguen de vacíos; llegada privada tardía no reabre diálogos cerrados. [Informe UI 03](phases/integration-ui-03.md) y [ADR-005](decisions/ADR-005-workspace-ui.md).

Revisión transversal de accesibilidad automatizada ejecutada: se corrigió la jerarquía de encabezados de tarjetas, reservas, espacios y estados vacíos, y se mantuvo un `h1` visible en autenticación móvil. Axe recorrió 60 estados de la web compilada en 1440/390 px: cero violaciones, cero overflow y cero errores de página. Lighthouse confirmó accesibilidad 1.00 en portada y detalle; su línea base también detectó rendimiento móvil 0.67/0.69 y LCP cercano a 8.2 s. [ADR-006](decisions/ADR-006-accessibility-heading-audit.md) y [ADR-007](decisions/ADR-007-performance-baseline.md).

Integración UI 02 completada: detalle con galería/visor accesible, reserva priorizada en móvil, selección conservada desde catálogo y tras autenticación, cotizaciones aisladas por propiedad/usuario y descarte de respuestas tardías. Confirmación con guards contra doble clic y reintento del mismo UUID incluso después de recarga de pestaña. Informe: [UI 02](phases/integration-ui-02.md), decisión [ADR-004](decisions/ADR-004-booking-ui-state.md).

Primera fase de integración visual implementada en `apps/web`: portada artesanal sutil, SVG inspirados en ñandutí/encaje ju, buscador progresivo sincronizado con URL, tarjetas legibles, navegación móvil y errores diferenciados. El usuario eligió priorizar la aplicación conectada frente a la maqueta HTML. Informe completo: [Integración UI 01](phases/integration-ui-01.md); identidad y recursos: [ARTESANAL](design/ARTESANAL.md).

Se analizó la versión ahora disponible en `remix-remix-pyapy---reservas-paraguay/` mediante tres agentes. Se adaptan ideas de presentación a la API actual; no se importó su Firebase/Firestore ni su modelo de precios. Los registros anteriores sobre ausencia de legado describen el comienzo del proyecto, no el workspace actual.

Peticion posterior del usuario: visualizar todo mediante HTML/CSS sin Docker. Se agrego una vista estatica independiente con entrada `index.html` y 39 documentos en `html/`, todos enlazados desde `html/indice.html`. Fotos, iconos y CSS locales; no requiere servidor. Los flujos de escritura/autenticacion son solo ilustrativos y no consultan PostgreSQL. La aplicacion original se conserva.

Version 0.1.0: implementacion funcional local de web, API y PostgreSQL, con app React Native inicial. No es pyApy 1.0, release candidate ni produccion. Las fases del prompt tienen avances y brechas registradas en [BACKLOG.md](BACKLOG.md); no se declaran completadas por compilar.

Al inicio el usuario confirmó que no existía base anterior y autorizó continuidad. Para la integración UI autorizó expresamente portada/búsqueda, detalle/reserva y cuenta/paneles. No se localizaron `notas.md` ni la auditoría original; no se atribuyen requisitos a documentos inexistentes.

## Implementado

Monorepo npm, React/Vite, Express, contratos Zod, PostgreSQL, Expo/React Native y PHP administrativo. Persistencia real, sesiones y tres roles, propiedades y multimedia, busqueda/matching, favoritos, reservas concurrentes, calendario propietario, moderacion, planes manuales, sponsors, notificaciones internas, metricas iniciales y auditoria.

Base aislada en 127.0.0.1:55432. API sin superusuario, identidad independiente para migraciones y rol de lectura limitado para PHP. Datos ficticios; credenciales generadas en archivos ignorados por Git.

Web local: http://127.0.0.1:5173; instancia vigente en `.local/dev.json`. React Native exporta Android/iOS, pero no fue ejecutado en dispositivo. Cola offline implementada y probada a nivel de contrato, no validada con perdida real de conectividad nativa.

## Evidencia

- Lint sin errores ni advertencias; build web exitoso tras la corrección de encabezados.
- Auditoría Axe final: 60 estados, 0 reglas incumplidas, 0 desbordamientos y 0 errores de página.
- Lighthouse: accesibilidad 1.00 en las cuatro corridas; rendimiento 0.67/0.69 móvil y 0.93/0.94 desktop. El detalle desktop registró CLS 0.121. Es línea base, no SLO.
- 23 pruebas automatizadas aprobadas, incluida concurrencia de diez solicitudes con una sola confirmacion.
- UI 03: `npm run check` aprobado (23 pruebas); suite E2E final con **41 aprobadas y una repetición responsive omitida**, lint/build finales aprobados. Responsive de portada/ficha/cuenta/paneles verificado a 320/390/768/1024/1440 px. Fallos intermedios y correcciones en TESTING.md.
- Backup restaurado en base temporal, conteos y exclusion conservados.
- Reporte PHP ejecutado con rol de solo lectura.
- npm audit: cero vulnerabilidades reportadas en la ejecucion registrada.
- Compose validado sintacticamente; motor no disponible.

## Limites de entrega

Entregadas las tres fases autorizadas de integración visual y el primer cierre automatizado de accesibilidad de la web conectada. Lighthouse ya tiene línea base, pero queda optimización móvil/CLS, validación cultural, WCAG integral, lector/zoom, revisión de navegación asistida, paginación real de servidor y recuperación de confirmaciones fuera de la pestaña actual. Base y API mantienen sus contratos; la integración no equivale a producción 1.0.

Pendientes: primera ejecucion CI remota, paridad y pruebas nativas, pruebas de carga y accesibilidad completas, integraciones externas autorizadas, endurecimiento operacional, Docker ejecutado, staging, rollback y produccion. Detalle en [RIESGOS](RISKS.md) y [BACKLOG](BACKLOG.md).

Los documentos de Fase 0 son historicos. Este estado reemplaza sus afirmaciones sobre workspace vacio y autorizacion pendiente.
