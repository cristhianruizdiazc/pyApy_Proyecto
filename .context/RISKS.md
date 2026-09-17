# Riesgos y limites

Actualizado: 2026-09-17. Ningun riesgo de produccion se considera aceptado por silencio.

| ID | Prioridad | Estado | Evidencia / pendiente |
| --- | --- | --- | --- |
| R-001 | Alta | MITIGADO | No existen notas/auditoria; se usa prompt mas aclaracion de proyecto nuevo, sin inventar contenido |
| R-002 | Alta | CORREGIDO | pyApy ejecuta PHP 8.5.10 local; XAMPP 7.2 queda fuera del proyecto |
| R-003 | Alta | PENDIENTE | Compose instalado/config validada, pero sin motor Docker/WSL; falta build y arranque real |
| R-004 | Media | CORREGIDO | PostgreSQL aislado, migraciones, roles y restore comprobados |
| R-005 | Informativa | NO APLICA | No hay legado ni MCP parcial que migrar |
| R-006 | Alta | MITIGADO | Auth/PII/IDOR/concurrencia cubiertos por pruebas; falta auditoria completa de produccion |
| R-007 | Alta | PENDIENTE | Native sin dispositivo, cache no cifrada y paridad de propietario/administracion incompleta |
| R-008 | Alta | PENDIENTE | Sin staging, TLS, secretos gestionados, alertas ni rollback probado |
| R-009 | Alta | PENDIENTE | Backup solo DB; fotos, cifrado externo, retencion y restauracion operacional pendientes |
| R-010 | Media | PENDIENTE | Matching limitado a 500 candidatos; listados privados limitados; sin carga/Lighthouse |
| R-011 | Alta | PENDIENTE | Falta recuperacion de cuenta, verificacion de correo y MFA administrativo |
| R-012 | Media | PENDIENTE | Analytics inicial sin proteccion antifraude ni pipeline/funnels completos |
| R-013 | Media | PENDIENTE | Email/push/WhatsApp/MCP no conectados; no se simulan entregas |
| R-014 | Media | PENDIENTE | Planes y precios iniciales no validados comercialmente, sin pago automatico |
| R-015 | Media | PENDIENTE | Licencias/identidad visual de lanzamiento y reemplazo de fotos demo por contenido autorizado |
| R-016 | Alta | PENDIENTE | CI definido no ejecutado remotamente; release limpia y contenedores no certificados |

La exclusion SQL, el rol restringido y las pruebas mitigan riesgos concretos, no autorizan presentar la version como 1.0. Ver BACKLOG.md.
