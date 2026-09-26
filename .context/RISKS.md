# Riesgos y limites

Actualizado: 2026-09-26. Ningun riesgo de produccion se considera aceptado por silencio.

| ID | Prioridad | Estado | Evidencia / pendiente |
| --- | --- | --- | --- |
| R-001 | Alta | MITIGADO | No existen notas/auditoria; se usa prompt mas aclaracion de proyecto nuevo, sin inventar contenido |
| R-002 | Alta | CORREGIDO | pyApy ejecuta PHP 8.5.10 local; XAMPP 7.2 queda fuera del proyecto |
| R-003 | Alta | MITIGADO | Config validada e imagenes construidas en runner Linux; falta `compose up`, health/smoke y persistencia de volumenes |
| R-004 | Media | CORREGIDO | PostgreSQL aislado, migraciones, roles y restore comprobados |
| R-005 | Alta | MITIGADO | Primera versión ahora presente; auth/Firebase, tarifas y contratos incompatibles no se importan. Integración de presentación sobre API actual, ADR-003; auditoría estática no certifica servidor legado |
| R-006 | Alta | MITIGADO | Auth/PII/IDOR/concurrencia cubiertos por pruebas; falta auditoria completa de produccion |
| R-007 | Alta | PENDIENTE | Native sin dispositivo, cache no cifrada y paridad de propietario/administracion incompleta |
| R-008 | Alta | PENDIENTE | Sin staging, TLS, secretos gestionados, alertas ni rollback probado |
| R-009 | Alta | PENDIENTE | Backup solo DB; fotos, cifrado externo, retencion y restauracion operacional pendientes |
| R-010 | Media | PENDIENTE | Matching limitado a 500 candidatos; listados privados limitados; sin carga ni SLO; Lighthouse local detecta LCP móvil cercano a 8.2 s |
| R-011 | Alta | PENDIENTE | Falta recuperacion de cuenta, verificacion de correo y MFA administrativo |
| R-012 | Media | PENDIENTE | Analytics inicial sin proteccion antifraude ni pipeline/funnels completos |
| R-013 | Media | PENDIENTE | Email/push/WhatsApp/MCP no conectados; no se simulan entregas |
| R-014 | Media | PENDIENTE | Planes y precios iniciales no validados comercialmente, sin pago automatico |
| R-015 | Media | PENDIENTE | Licencias/identidad visual de lanzamiento y reemplazo de fotos demo por contenido autorizado |
| R-016 | Alta | MITIGADO | CI remoto aprobado sobre `656f899`; release candidata, runtime Compose y despliegue siguen sin certificarse |
| R-017 | Media | CORREGIDO | UI 02: aislamiento por ID/usuario/selección, abort/revisión de cotizaciones, descarte al editar y guards de respuesta; E2E de respuestas tardías y cambio de propiedad en escritorio/móvil |
| R-018 | Media | MITIGADO | Filtros/historial, error de consulta vs vacío, fallback de fotos, logout móvil y Axe 60/60 sin violaciones; falta auditoría WCAG integral, contraste manual y zoom/lectores |
| R-019 | Media | PENDIENTE | Motivos SVG originales inspirados en ñandutí/encaje ju; revisión cultural y activos finales pendientes. Procedencia en design/ARTESANAL.md |
| R-020 | Media | MITIGADO | Reintento web conserva UUID/cuerpo frente a respuesta perdida o ilegible y recarga en la misma pestaña. Falta reconciliación entre pestañas/dispositivos y ante almacenamiento bloqueado/borrado; no es cola offline |
| R-021 | Media | MITIGADO | UI 03 separa fallo/carga/vacío en cuenta/calendario/admin y consulta privada; datos de llegada tardíos descartados al cerrar/cambiar contexto. Filtros indican registros cargados; límites de API y paginación real siguen pendientes |

La exclusion SQL, el rol restringido y las pruebas mitigan riesgos concretos, no autorizan presentar la version como 1.0. Ver BACKLOG.md.
