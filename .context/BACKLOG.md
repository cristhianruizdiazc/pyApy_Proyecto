# Backlog y cobertura de fases

Actualizado: 2026-09-26. Fase 20 cerrada con CI remoto aprobado; los estados parciales de otras fases no equivalen a produccion 1.0.

## Integración de la primera versión

1. **Entregado:** portada/buscador/tarjetas, identidad artesanal sutil y navegación sobre API actual; ver [informe UI 01](phases/integration-ui-01.md).
2. **Entregado:** detalle/galería, continuidad de selección y reserva, cotizaciones obsoletas corregidas y recuperación del intento tras respuesta perdida/ilegible. Ver [UI 02](phases/integration-ui-02.md).
3. **Entregado:** cuenta, favoritos, reservas y paneles con información progresiva, filtros de registros cargados, pestañas/URL y calendario/agenda. Ver [UI 03](phases/integration-ui-03.md).
4. **Parcialmente entregado:** auditoría Axe de 60 estados y corrección de encabezados; pendiente revisión cultural de SVG, activos finales, WCAG completa, zoom/lector y Lighthouse.
5. **Siguiente trabajo:** navegación asistida, contraste/zoom/lector, Lighthouse y cobertura de mutaciones administrativas pendientes; paginación de servidor requiere diseño de contratos aparte.

## Trazabilidad del prompt

| Fase | Evidencia actual | Brecha para cierre |
| --- | --- | --- |
| 0 Descubrimiento | Workspace nuevo y requisitos documentados | Cerrada historicamente |
| 1 Arquitectura | ADR y monorepo implementados | Validar topologia de despliegue real |
| 2 Datos | Dos migraciones, constraints, roles y restore | Revision de indices/carga y retencion |
| 3 Auth | Registro/login/refresh/logout, roles e IDOR | Recuperacion/verificacion de cuenta, MFA admin |
| 4 API | REST versionada, Zod, transacciones, logs | OpenAPI, telemetria y separacion modular al crecer |
| 5 Index | Integración UI 01, carruseles, búsqueda progresiva/URL, mapa, motivos artesanales; cinco anchos verificados; Axe sin violaciones en 60 estados | WCAG completa, Lighthouse y activos culturales/fotográficos finales |
| 6 Propiedades | Alta/edicion/despublicacion, fotos, privados | Variantes de imagen, cambios de reglas/notificaciones y ciclo de archivado |
| 7 Matching | Exactos, alternativas, pesos, SearchIntent | Eliminar limite 500 y ampliar criterios del prompt |
| 8 Reservas | Tres tipos, exclusión, idempotencia, cancelación; UI 02 prueba commit con respuesta perdida, replay, conflicto y cambio de precio | Más carga, sesiones expiradas, coordinación entre pestañas/dispositivos y almacenamiento bloqueado |
| 9 Propietario | UI 03: calendario/agenda, inventario filtrado, ocupaciones, métricas progresivas y E2E de edición/media/contacto/bloqueo/cancelación | Conversión/origen detallados y paginación completa |
| 10 Admin | UI 03: permisos, moderación, planes/sponsors/audit; filtros locales, tablas accesibles y E2E de moderación/rechazo de pesos inválidos | Filtros server-side/exportes y cobertura E2E de cada mutación |
| 11 Monetizacion | Planes configurables, solicitud/aprobacion manual | Validacion comercial, beneficios y vencimientos efectivos |
| 12 React Native | API real, auth, catalogo/mapa/favoritos/reservas | CRUD propietario, administracion/resenas y dispositivos |
| 13 Offline | Cache, cola, idempotencia, retry/conflictos | Perdida real de red, cierre forzado, multiples usuarios y cifrado |
| 14 Integraciones | Outbox/retry y notificacion interna | Email/push/WhatsApp/MCP con proveedores autorizados |
| 15 Analytics | Eventos basicos y demanda guardada | Funnels, busquedas reales agregadas y proteccion antifraude |
| 16 Seguridad | Controles y pruebas adversariales iniciales | Auditoria completa, secretos/TLS y contenedores |
| 17 Pruebas | 23 pruebas; CI final con 43 E2E aprobadas, una repeticion responsive omitida; Axe 60/60 sin violaciones | Carga, native, accesibilidad integral, recuperacion operacional y todas las mutaciones admin |
| 18 Rendimiento | Lazy routes/mapa, imagen optimizada, bundle medido; Lighthouse ejecutado: 0.67/0.69 mobile y 0.93/0.94 desktop | Optimizar LCP móvil (~8.2 s), estudiar CLS detalle desktop (0.121), perfiles, EXPLAIN ANALYZE y SLO reales |
| 19 Docker | Dockerfiles, Compose validado e imagenes construidas en runner Linux | `compose up`, health/smoke y volumenes reales |
| 20 CI/CD | Cerrada: corrida remota `36255899826`, ambos jobs aprobados | Deploy queda fuera hasta aprobar staging y rollback |
| 21 Documentacion | README, API, DB, seguridad y operacion | Actualizar al cerrar cada brecha |
| 22 Auditoria final | Registro de riesgos con estados/evidencia | No realizada como auditoria final 1.0 |
| 23 RC | Version 0.1.0 local | Clean install, paridad, Docker y todos los gates |
| 24 Staging | Sin infraestructura configurada | Despliegue, smoke/E2E, monitoreo, restore y rollback |
| 25 Produccion | No iniciada ni propuesta | Criterios finales del prompt satisfechos |

## Prioridad siguiente

La siguiente fase del roadmap es la **Fase 21 - Documentacion**. Requiere autorizacion expresa antes de iniciarse y debe reconciliar las guias de instalacion, arquitectura, operacion y troubleshooting con el estado comprobado en CI.

Fase 19 cerrada para configuracion: Dockerfiles production/test, Compose con perfil test, verificacion estatica e imagenes construidas en CI. El gate de runtime sigue pendiente; no se declara certificado hasta ejecutar `compose up`, health/smoke y volumenes. Ver [Fase 19](phases/phase-19-docker.md).

Fase 20 cerrada: Actions instala con lockfile, audita dependencias, valida lint/pruebas/builds/contenedores y despues ejecuta E2E con una base efimera independiente. La corrida final aprobo ambos jobs. No incluye deploy, porque staging y rollback no estan definidos. Ver [Fase 20](phases/phase-20-cicd.md).

Fase 18 cerrada para el entorno local: WebP responsivo, hero bajo demanda, skeleton de ficha y mapa diferido. Lighthouse final: 0.95/0.90 mobile, 0.93/0.97 desktop; CLS de ficha 0.003. EXPLAIN demo no amerita indice nuevo. Quedan SLO/carga/CDN/cache/produccion para fases de preproduccion y auditoria; ver [rendimiento UX 01](phases/performance-ux-01.md).

1. Pruebas nativas reales y resolver paridad funcional; minimizar o cifrar cache privada.
2. Ejecutar contenedores en entorno con Docker, validar permisos/health checks/volumenes e instalacion limpia.
3. Completar lifecycle de cuenta, paginacion y contratos OpenAPI; revisar monetizacion sin inventar reglas comerciales.
4. Medir rendimiento/carga/accesibilidad y revisar todos los requisitos detallados, no solo titulos de fases.
5. Resolver identidad/activos finales e integraciones externas con cuentas autorizadas.
6. Preparar staging y ensayar backup integral, recuperacion y rollback antes de considerar una RC.

## Otros requisitos conservados

Canvas/HTML editable (sección 39): inicialmente no había implementación heredada. La primera versión ahora disponible contiene croquis y editor SVG con acoplamientos/contextos inconsistentes; deben inspeccionarse y desacoplarse antes de definir integración o reserva por sectores. No se declara satisfecho este requisito por formularios. No se identificó MCP parcial reutilizable. OSM no ofrece mapas offline aquí. SEO/SSR, condiciones legales, privacidad, soporte operativo y políticas comerciales necesitan trabajo de lanzamiento.

No instalar plugins de cuentas externas sin una necesidad y autorizacion especifica. Las extensiones del editor necesarias ya fueron instaladas.
