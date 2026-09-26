# Decisiones y autorizaciones

| ID | Estado | Registro | Fuente |
| --- | --- | --- | --- |
| D-000 | CONFIRMADO | pyApy comienza sin base anterior; la Fase 0 registra el estado vacio | Aclaracion del usuario: "no existe ninguna base todavia" |
| D-001 | REQUISITO | Mantener React, React Native, Node.js, PHP, PostgreSQL, Docker y OpenStreetMap | Prompt, secciones 1 y 5 |
| D-002 | REQUISITO | Mantener tres roles y offline controlado | Prompt, secciones 7 y 33 a 36 |
| D-003 | AUTORIZADO | Instalar las extensiones que sean necesarias durante el trabajo | Peticion directa del usuario |
| D-004 | AUTORIZADO | Continuar por las fases sin volver a solicitar permiso de avance | Instruccion posterior: "si, continua, ya no preguntes nada para continuar" |
| D-005 | REGISTRADO | El prompt recibido es la fuente disponible; `notas.md` y la auditoria no se aportaron | Inspeccion del workspace |
| D-006 | AUTORIZADO | Integrar la primera versión mediante análisis de agentes, respetando stack; priorizar `apps/web` y dirección artesanal sutil | Elección y autorización expresa del usuario, 2026-09-19 |
| D-007 | ADOPTADO | Adaptación incremental de presentación a la API vigente; primera entrega portada/búsqueda/tarjetas | ADR-003 y alcance presentado/autorizado |
| D-008 | AUTORIZADO | Continuar con detalle, galería y reserva; documentar cambios y verificaciones en `.context` | Respuesta «si, autorizo» al cierre de UI 01 y reiteración de continuidad |
| D-009 | ADOPTADO | Aislar cotización y conservar cuerpo/UUID de confirmación ambigua por pestaña y usuario | ADR-004; contratos backend existentes conservados |
| D-010 | AUTORIZADO | Continuar con cuenta, favoritos, reservas propias y paneles; conservar funciones y documentar en `.context` | Respuesta «si, adelante» y reiteraciones de continuidad |
| D-011 | ADOPTADO | Presentación progresiva y filtros locales explícitos sobre registros cargados, sin simular búsqueda/paginación global | ADR-005, integración UI 03 |
| D-012 | ADOPTADO | Corregir encabezados semánticos y validar el build web con Axe en 60 estados, sin declarar certificación WCAG completa | ADR-006, auditoría `accessibility-final`, 2026-09-24 |
| D-013 | REGISTRADO | Medir Lighthouse como línea base y conservar sus déficits móviles/CLS como trabajo pendiente, sin aceptar SLO locales | ADR-007, auditoría `performance-baseline`, 2026-09-24 |

| D-014 | ADOPTADO | CI con gates reproducibles y sin deploy implicito hasta aprobar staging, secretos y rollback | ADR-010, 2026-09-25 |

La aclaración sobre el comienzo desde cero es histórica. En septiembre 2026 se incorpora la carpeta de la primera versión como referencia de integración. Esto no modifica stack, roles ni reglas de negocio.

La instruccion posterior permite continuar fases sucesivas en esta ejecucion. No autoriza sustituir el stack ni inventar servicios externos. El historial de Fase 0 describe la autorizacion pendiente en ese momento y se conserva como registro historico.

Las decisiones se registran en [decisions/](decisions/README.md). No existia un modelo previo que migrar: se implemento un esquema inicial versionado en una instancia local aislada. El estado vigente esta en PROJECT_STATE.md.
