# Decisiones y autorizaciones

| ID | Estado | Registro | Fuente |
| --- | --- | --- | --- |
| D-000 | CONFIRMADO | pyApy comienza sin base anterior; la Fase 0 registra el estado vacio | Aclaracion del usuario: "no existe ninguna base todavia" |
| D-001 | REQUISITO | Mantener React, React Native, Node.js, PHP, PostgreSQL, Docker y OpenStreetMap | Prompt, secciones 1 y 5 |
| D-002 | REQUISITO | Mantener tres roles y offline controlado | Prompt, secciones 7 y 33 a 36 |
| D-003 | AUTORIZADO | Instalar las extensiones que sean necesarias durante el trabajo | Peticion directa del usuario |
| D-004 | AUTORIZADO | Continuar por las fases sin volver a solicitar permiso de avance | Instruccion posterior: "si, continua, ya no preguntes nada para continuar" |
| D-005 | REGISTRADO | El prompt recibido es la fuente disponible; `notas.md` y la auditoria no se aportaron | Inspeccion del workspace |

La aclaracion sobre el comienzo desde cero corrige el supuesto de codigo heredado. No modifica el stack, los roles, las reglas de negocio ni la secuencia de fases.

La instruccion posterior permite continuar fases sucesivas en esta ejecucion. No autoriza sustituir el stack ni inventar servicios externos. El historial de Fase 0 describe la autorizacion pendiente en ese momento y se conserva como registro historico.

Las decisiones se registran en [decisions/](decisions/README.md). No existia un modelo previo que migrar: se implemento un esquema inicial versionado en una instancia local aislada. El estado vigente esta en PROJECT_STATE.md.
