# Backlog y cobertura de fases

Actualizado: 2026-09-17. El usuario autorizo continuidad sin preguntas. Estados parciales no equivalen a cierre de fase ni a produccion 1.0.

## Trazabilidad del prompt

| Fase | Evidencia actual | Brecha para cierre |
| --- | --- | --- |
| 0 Descubrimiento | Workspace nuevo y requisitos documentados | Cerrada historicamente |
| 1 Arquitectura | ADR y monorepo implementados | Validar topologia de despliegue real |
| 2 Datos | Dos migraciones, constraints, roles y restore | Revision de indices/carga y retencion |
| 3 Auth | Registro/login/refresh/logout, roles e IDOR | Recuperacion/verificacion de cuenta, MFA admin |
| 4 API | REST versionada, Zod, transacciones, logs | OpenAPI, telemetria y separacion modular al crecer |
| 5 Index | Fotos, carrusel, matching, mapa, responsive | WCAG completa, Lighthouse y mas viewports |
| 6 Propiedades | Alta/edicion/despublicacion, fotos, privados | Variantes de imagen, cambios de reglas/notificaciones y ciclo de archivado |
| 7 Matching | Exactos, alternativas, pesos, SearchIntent | Eliminar limite 500 y ampliar criterios del prompt |
| 8 Reservas | Tres tipos, exclusion, idempotencia, cancelacion | Mas carga, zonas horarias y pruebas de interrupcion |
| 9 Propietario | Calendario, inventario, ocupaciones, metricas | Conversion/origen detallados y paginacion completa |
| 10 Admin | Permisos, moderacion, planes/sponsors/audit | Filtros/exportes y cobertura E2E de cada mutacion |
| 11 Monetizacion | Planes configurables, solicitud/aprobacion manual | Validacion comercial, beneficios y vencimientos efectivos |
| 12 React Native | API real, auth, catalogo/mapa/favoritos/reservas | CRUD propietario, administracion/resenas y dispositivos |
| 13 Offline | Cache, cola, idempotencia, retry/conflictos | Perdida real de red, cierre forzado, multiples usuarios y cifrado |
| 14 Integraciones | Outbox/retry y notificacion interna | Email/push/WhatsApp/MCP con proveedores autorizados |
| 15 Analytics | Eventos basicos y demanda guardada | Funnels, busquedas reales agregadas y proteccion antifraude |
| 16 Seguridad | Controles y pruebas adversariales iniciales | Auditoria completa, secretos/TLS y contenedores |
| 17 Pruebas | 23 pruebas y 6 E2E aprobadas | Carga, native, accesibilidad, recuperacion operacional |
| 18 Rendimiento | Lazy routes/mapa, imagen optimizada, bundle medido | Lighthouse, perfiles, EXPLAIN ANALYZE y SLO reales |
| 19 Docker | Dockerfiles, Compose validado | Motor y build/up/smoke/volumenes reales |
| 20 CI/CD | GitHub Actions definido | Repositorio remoto, ejecucion y estrategia deploy/rollback |
| 21 Documentacion | README, API, DB, seguridad y operacion | Actualizar al cerrar cada brecha |
| 22 Auditoria final | Registro de riesgos con estados/evidencia | No realizada como auditoria final 1.0 |
| 23 RC | Version 0.1.0 local | Clean install, paridad, Docker y todos los gates |
| 24 Staging | Sin infraestructura configurada | Despliegue, smoke/E2E, monitoreo, restore y rollback |
| 25 Produccion | No iniciada ni propuesta | Criterios finales del prompt satisfechos |

## Prioridad siguiente

1. Pruebas nativas reales y resolver paridad funcional; minimizar o cifrar cache privada.
2. Ejecutar contenedores en entorno con Docker, validar permisos/health checks/volumenes e instalacion limpia.
3. Completar lifecycle de cuenta, paginacion y contratos OpenAPI; revisar monetizacion sin inventar reglas comerciales.
4. Medir rendimiento/carga/accesibilidad y revisar todos los requisitos detallados, no solo titulos de fases.
5. Resolver identidad/activos finales e integraciones externas con cuentas autorizadas.
6. Preparar staging y ensayar backup integral, recuperacion y rollback antes de considerar una RC.

## Otros requisitos conservados

Canvas/HTML editable (seccion 39): no existia implementacion equivalente heredada; alcance funcional no resuelto, no se introduce un editor de HTML inseguro ni se declara satisfecho por formularios. MCP parcial tampoco existia. OSM no ofrece mapas offline aqui. SEO/SSR, condiciones legales, privacidad, soporte operativo y politicas comerciales necesitan trabajo de lanzamiento.

No instalar plugins de cuentas externas sin una necesidad y autorizacion especifica. Las extensiones del editor necesarias ya fueron instaladas.
