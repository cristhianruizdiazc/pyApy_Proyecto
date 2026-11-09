# Decisiones y autorizaciones

2026-11-08: autorización expresa «continua con la fase 7 del rediseño». Se ejecuta validación integrada, comparación visual, accesibilidad, optimización de recursos y medición controlada de rendimiento; se corrigen los defectos encontrados dentro de ese alcance. Se cierra localmente el plan 0–7, sin modificar reglas/API/DB ni desplegar. No se autoriza producción ni se absorben las brechas operativas existentes. [Entrega](phases/rediseno-fase-7-2026-11-08.md).

2026-11-08: autorización expresa «si, continua» para la fase 6 propuesta al cerrar fase 5. Se extiende el sistema visual a propietario, administración, ayuda y estados complementarios; las pantallas sin maqueta específica conservan sus funciones y densidad operativa. Navegación lateral desde 1081 px y pestañas horizontales en móvil; datos privados y permisos permanecen bajo control del servidor. Alcance local de fase 6, sin despliegue ni inicio de fase 7. [Entrega](phases/rediseno-fase-6-2026-11-08.md).

2026-11-08: autorización expresa «si, autorizo» para la fase 5 propuesta al cerrar fase 4. Se implementan acceso/registro, cuenta, Guardados, reservas y notificaciones según el sistema visual; se conservan los flujos existentes y el perfil de solo consulta, sin inventar edición o recuperación de contraseña. Autorización local de fase 5; no incluye despliegue ni fase 6. [Entrega](phases/rediseno-fase-5-2026-11-08.md).


2026-11-07: autorización expresa «arranca con la fase 4 del rediseño». Se adapta la composición del diálogo a la ruta de ficha, con galería lateral/miniaturas y reserva real, manteniendo precio horario, selección, datos públicos, permisos, OSM y recuperación idempotente. Alcance local de fase 4; no autoriza despliegue ni fase 5. [Entrega](phases/rediseno-fase-4-2026-11-07.md).


2026-11-07: petición de comprobar pendientes de fase 2 y arrancar fase 3 si está cerrada. Revisado su cierre local, se implementan resultados/tarjetas y contenedor Leaflet/OpenStreetMap según el plan vigente, sin cambios de datos, reglas ni despliegue. [Entrega de fase 3](phases/rediseno-fase-3-2026-11-07.md).

2026-11-04: petición expresa de continuar la fase 2 del plan de rediseño. Se implementa portada/buscador según ADR-013 y el HTML principal, con anclas de anfitriones/pasos, presupuesto/horarios reales y publicación según sesión/rol. El alcance sigue siendo local; no autoriza despliegue ni cambios de datos/negocio. [Entrega de fase 2](phases/rediseno-fase-2-2026-11-04.md).

2026-11-03: el usuario decide replicar lo máximo posible la estructura del prototipo conservando las funcionalidades actuales, el cálculo de precios por hora y OpenStreetMap; descarta precios nocturnos y mapa esquemático. `TAREAS.md` deja de ser la guía de mejora web. Dirección registrada en [ADR-013](decisions/ADR-013-frontend-redesign.md) y nuevo [plan por fases](phases/rediseno-frontend-2026-11-03.md). Entrega inicial: planificación/documentación; los avances posteriores se registran en el estado y las fases.

2026-10-25: petición expresa de implementar las tres partes de búsqueda por etapas, pruebas/documentación y continuidad sin confirmaciones intermedias, conservando stack y sin producción. Adoptado [ADR-012](decisions/ADR-012-progressive-search.md). ADR-011 conserva congelación nativa; se adapta el consumidor activo web responsive y se conserva contrato aditivo.

| ID    | Estado     | Registro                                                                                                                     | Fuente                                                                     |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| D-000 | CONFIRMADO | pyApy comienza sin base anterior; la Fase 0 registra el estado vacio                                                         | Aclaracion del usuario: "no existe ninguna base todavia"                   |
| D-001 | REQUISITO  | Mantener React, React Native, Node.js, PHP, PostgreSQL, Docker y OpenStreetMap                                               | Prompt, secciones 1 y 5                                                    |
| D-002 | REQUISITO  | Mantener tres roles y offline controlado                                                                                     | Prompt, secciones 7 y 33 a 36                                              |
| D-003 | AUTORIZADO | Instalar las extensiones que sean necesarias durante el trabajo                                                              | Peticion directa del usuario                                               |
| D-004 | AUTORIZADO | Continuar por las fases sin volver a solicitar permiso de avance                                                             | Instruccion posterior: "si, continua, ya no preguntes nada para continuar" |
| D-005 | REGISTRADO | El prompt recibido es la fuente disponible; `notas.md` y la auditoria no se aportaron                                        | Inspeccion del workspace                                                   |
| D-006 | AUTORIZADO | Integrar la primera versión mediante análisis de agentes, respetando stack; priorizar `apps/web` y dirección artesanal sutil | Elección y autorización expresa del usuario, 2026-09-19                    |
| D-007 | ADOPTADO   | Adaptación incremental de presentación a la API vigente; primera entrega portada/búsqueda/tarjetas                           | ADR-003 y alcance presentado/autorizado                                    |
| D-008 | AUTORIZADO | Continuar con detalle, galería y reserva; documentar cambios y verificaciones en `.context`                                  | Respuesta «si, autorizo» al cierre de UI 01 y reiteración de continuidad   |
| D-009 | ADOPTADO   | Aislar cotización y conservar cuerpo/UUID de confirmación ambigua por pestaña y usuario                                      | ADR-004; contratos backend existentes conservados                          |
| D-010 | AUTORIZADO | Continuar con cuenta, favoritos, reservas propias y paneles; conservar funciones y documentar en `.context`                  | Respuesta «si, adelante» y reiteraciones de continuidad                    |
| D-011 | ADOPTADO   | Presentación progresiva y filtros locales explícitos sobre registros cargados, sin simular búsqueda/paginación global        | ADR-005, integración UI 03                                                 |
| D-012 | ADOPTADO   | Corregir encabezados semánticos y validar el build web con Axe en 60 estados, sin declarar certificación WCAG completa       | ADR-006, auditoría `accessibility-final`, 2026-09-24                       |
| D-013 | REGISTRADO | Medir Lighthouse como línea base y conservar sus déficits móviles/CLS como trabajo pendiente, sin aceptar SLO locales        | ADR-007, auditoría `performance-baseline`, 2026-09-24                      |

| D-014 | ADOPTADO | CI con gates reproducibles y sin deploy implicito hasta aprobar staging, secretos y rollback | ADR-010, 2026-09-25 |
| D-015 | ADOPTADO | Limitar pyApy v1 al producto web responsive; conservar React Native congelado y fuera de los criterios de release de v1 | Decisión expresa del usuario y ADR-011, 2026-10-22 |
| D-016 | ADOPTADO | Rediseño estructural basado en el prototipo, preservando funciones, precio horario y OSM; nuevo plan sustituye TAREAS.md como guía de mejora web | Decisión expresa del usuario y ADR-013, 2026-11-03 |

La aclaración sobre el comienzo desde cero es histórica. En septiembre 2026 se incorpora la carpeta de la primera versión como referencia de integración. Esto no modifica stack, roles ni reglas de negocio.

La instruccion posterior permite continuar fases sucesivas en esta ejecucion. No autoriza sustituir el stack ni inventar servicios externos. El historial de Fase 0 describe la autorizacion pendiente en ese momento y se conserva como registro historico.

Las decisiones se registran en [decisions/](decisions/README.md). No existia un modelo previo que migrar: se implemento un esquema inicial versionado en una instancia local aislada. El estado vigente esta en PROJECT_STATE.md.
