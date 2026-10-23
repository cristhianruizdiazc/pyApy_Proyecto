# Fase 24: Preproduccion

Fecha: 2026-10-22, America/Asuncion. Estado: **CERRADA EN STAGING AISLADO; NO AUTORIZA PRODUCCION**.

## Resumen

Se desplego un staging Docker separado (`pyapy-staging`) en el host disponible, con API en modo produccion, PostgreSQL y uploads persistentes, TLS terminado por Caddy y exposicion exclusiva en loopback. No se usaron datos personales reales. El entorno remoto/publico no existe porque no fueron proporcionados dominio, host, registro, gestor de secretos ni canal de alertas; esta limitacion no se reemplaza con una afirmacion de despliegue publico.

## Archivos, arquitectura y base

- Creados: `docker-compose.staging.yml`, `docker/Caddyfile.staging`, `scripts/staging-smoke.mjs`, `scripts/staging-monitor.mjs`, `tests/e2e/staging.spec.js`, `docs/STAGING.md` y este informe.
- Modificados: `package.json`, `playwright.config.js` y documentos del baul `.context`.
- Eliminados: ninguno.

El gateway TLS es el unico puerto publicado (`127.0.0.1:8443`); web, API y PostgreSQL permanecen en la red interna. API y migraciones ejecutan `NODE_ENV=production`, `DEMO_MODE=false` y origen HTTPS. Las imagenes son seleccionables por `STAGING_API_IMAGE` y `STAGING_WEB_IMAGE` para rollback. No hubo cambio de esquema: se aplicaron las dos migraciones existentes.

## Seguridad y pruebas

Se comprobaron TLS, HSTS, cookie `Secure`/`HttpOnly`/`SameSite=Lax`, ruta privada sin sesion, request ID, base no publicada y fixtures deshabilitados. Caddy usa CA interna solo en loopback; la excepcion de confianza esta acotada por los scripts a loopback.

| Gate                   | Resultado                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| Build/despliegue       | PASS: DB/API saludables, web y gateway activos                                            |
| Smoke TLS              | PASS: web, health con DB, auth y request ID                                               |
| E2E staging            | PASS: web, registro ficticio, atributos de cookie, sesion y logout                        |
| Concurrencia/seguridad | PASS: 23/23 en Docker aislado; diez solicitudes incompatibles confirmaron exactamente una |
| Backup DB/uploads      | PASS: dump de 52,808 bytes y archivo integral del volumen uploads                         |
| Restore                | PASS: base aislada con 2 migraciones y 1 constraint de exclusion                          |
| Rollback               | PASS: retorno a imagenes RC anteriores y vuelta a candidatas, con health/smoke            |
| Monitoreo              | PASS de contrato: probe externo `ok=true`, HTTP 200 y 74 ms                               |
| Gate general           | PASS tras iniciar PostgreSQL local: lint, 23/23 pruebas y build Vite                      |

El primer `npm run check` fallo por `ECONNREFUSED` con la base local apagada; tras `npm run db:local`, la repeticion aprobo. El primer despliegue detecto y corrigio el origen HTTP heredado en migraciones y la capacidad requerida por el binario oficial de Caddy.

## Pendientes, riesgos y proxima fase

Para staging remoto faltan dominio, host, CA publica, registro por digest, gestor de secretos, backup cifrado fuera del host, retencion, receptor de alertas y dispositivo nativo fisico. Siguen pendientes MFA/recuperacion de cuenta y 16 avisos upstream Expo/Metro. El staging aislado no demuestra latencia de Internet, alta disponibilidad ni respuesta humana a alertas.

La Fase 25 solo puede proponerse despues de resolver los pendientes de lanzamiento y repetir los gates en infraestructura remota autorizada. No se inicia ni se propone produccion como parte de este cierre.
