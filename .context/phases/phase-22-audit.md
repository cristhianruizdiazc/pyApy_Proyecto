# Fase 22: Auditoría final

Fecha de cierre: 2026-09-27. Estado: **CERRADA con brechas de producción explícitas**.

## 1. Alcance y criterio

Se comparó el estado documentado antes de la auditoría con el estado comprobado después de los gates actuales. Cada hallazgo se clasifica como `CORREGIDO`, `MITIGADO`, `ACEPTADO`, `PENDIENTE` o `NO APLICA`, con evidencia localizada. La existencia de pendientes no permite declarar pyApy 1.0 ni producción lista.

No existe `notas.md` ni una auditoría original externa en el workspace; esa ausencia se conserva como riesgo de trazabilidad y no se reemplaza inventando requisitos.

## 2. Evidencia ejecutada

- `npm run check`: PASS — lint, 23 pruebas API/dominio y build web.
- `npm run mobile:check`: PASS — dependencias Expo/React Native compatibles.
- `npm run containers:verify`: PASS — configuración de entornos, secretos externos y hardening declarada válida.
- `npm audit --audit-level=moderate`: PASS — 0 vulnerabilidades reportadas.
- `npm run db:verify-restore`: PASS — restauración aislada, conteos y constraint de concurrencia verificados.
- `npx prettier --check` sobre documentación: PASS.
- `git diff --check`: PASS.
- Evidencia histórica conservada: CI remoto aprobado, 43 E2E aprobadas con una repetición responsive omitida deliberadamente, Axe 60/60 sin violaciones y Lighthouse local documentado.

## 3. Comparación antes/después

| Área                 | Antes de la implementación documentada                                   | Estado auditado                                                                                             | Resultado                  |
| -------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------- |
| Arquitectura         | Responsabilidades y stack sin consolidación operativa                    | React/Vite, Expo/RN, Node/Express, PHP de reporte, PostgreSQL, Dockerfiles/Compose y contratos documentados | MITIGADO                   |
| Persistencia         | Sin evidencia de aislamiento, permisos o restore                         | Cluster local aislado, migraciones, roles, exclusión GiST, backup/restore verificado                        | CORREGIDO en alcance local |
| Seguridad de dominio | Riesgo de confiar en cliente para rol, precio, disponibilidad y reservas | Auth, autorización por recurso, CSRF/bearer, precio server-side, idempotencia y concurrencia probados       | MITIGADO                   |
| Web y API            | Integración parcial y estados UI inconsistentes                          | API versionada, web conectada, pruebas de errores, selección/reserva y paneles documentados                 | MITIGADO                   |
| Mobile/offline       | Sin paridad nativa ni pérdida de red validada en dispositivo             | API bearer, cache/cola/retry/conflictos de contrato; sin prueba física ni paridad completa                  | PENDIENTE                  |
| Operación            | Sin evidencia de staging, producción o rollback                          | CI aprobado y Compose validado estáticamente; runtime/staging/rollback no ejecutados                        | PENDIENTE                  |
| Documentación        | Información dispersa y afirmaciones de capacidad no verificadas          | README, guías y contexto reconciliados con límites explícitos                                               | CORREGIDO                  |

## 4. Matriz final de riesgos

| ID    | Estado    | Evidencia de auditoría y límite restante                                                                                                                             |
| ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-001 | MITIGADO  | No existen `notas.md` ni auditoría original; se documentó la ausencia sin inventar contenido.                                                                        |
| R-002 | CORREGIDO | PHP local usa runtime compatible y no depende del XAMPP 7.2.                                                                                                         |
| R-003 | MITIGADO  | Compose/configuración e imágenes CI validadas; falta `compose up`, health checks y persistencia real en host Docker.                                                 |
| R-004 | CORREGIDO | PostgreSQL aislado, migraciones, roles y restore verificados.                                                                                                        |
| R-005 | MITIGADO  | La implementación vigente usa API/PostgreSQL y no importa Firebase/Firestore legado; falta certificar cualquier servidor legado externo inexistente en el workspace. |
| R-006 | MITIGADO  | Auth, PII, IDOR, concurrencia y contratos probados; falta auditoría adversarial completa de producción.                                                              |
| R-007 | PENDIENTE | No hay validación en dispositivo nativo; cache privada no cifrada y paridad móvil incompleta.                                                                        |
| R-008 | PENDIENTE | No existen staging, TLS operativo, secretos gestionados, alertas ni rollback probado.                                                                                |
| R-009 | PENDIENTE | Backup verificado solo para PostgreSQL; faltan uploads, retención, cifrado externo y restauración operacional completa.                                              |
| R-010 | PENDIENTE | Matching/listados tienen límites documentados; no hay carga ni SLO y Lighthouse móvil mostró LCP cercano a 8.2 s en la línea base.                                   |
| R-011 | PENDIENTE | Falta recuperación de cuenta, verificación de correo y MFA administrativo.                                                                                           |
| R-012 | PENDIENTE | Analytics inicial funciona; faltan funnels completos, agregación operativa y antifraude.                                                                             |
| R-013 | PENDIENTE | No hay proveedores autorizados conectados para email, push, WhatsApp o MCP.                                                                                          |
| R-014 | PENDIENTE | Planes/precios son configuración inicial; falta validación comercial y pagos automáticos.                                                                            |
| R-015 | PENDIENTE | Faltan revisión de licencias/identidad final y activos fotográficos autorizados de lanzamiento.                                                                      |
| R-016 | MITIGADO  | CI remoto aprobado; release candidata, runtime Compose y despliegue aún no certificados.                                                                             |
| R-017 | CORREGIDO | Aislamiento de selección/cotización, abort/revisión y respuestas tardías cubiertos por UI/E2E documentados.                                                          |
| R-018 | MITIGADO  | Estados UI, filtros, fallback y Axe 60/60 cubiertos; falta WCAG integral, contraste manual, zoom y lectores.                                                         |
| R-019 | PENDIENTE | Procedencia de recursos documentada; revisión cultural y activos finales pendientes.                                                                                 |
| R-020 | MITIGADO  | UUID/cuerpo se conservan ante respuesta perdida o ilegible; faltan reconciliación entre pestañas/dispositivos y almacenamiento bloqueado.                            |
| R-021 | MITIGADO  | Estados de carga/error/vacío y llegada tardía cubiertos; faltan paginación server-side y límites escalables.                                                         |

No se clasificó ningún riesgo como `ACEPTADO` por silencio. No hay riesgos `NO APLICA` dentro de la matriz vigente.

## 5. Conclusión

La auditoría final queda cerrada con evidencia suficiente para el alcance local y con las brechas de producción visibles. El sistema no cumple todavía los criterios de pyApy 1.0 porque permanecen pendientes nativo, operación, staging, backups integrales, carga, ciclo de cuenta, integraciones externas y otros riesgos enumerados arriba.

La siguiente fase es la Fase 23 — Release Candidate. Requiere autorización expresa y deberá conservar esta matriz como entrada; no debe interpretar este cierre como autorización automática para producción.
