# Preproduccion (staging)

Esta guia separa dos destinos: el ensayo local reproducible y el staging remoto. El primero permite validar la operacion sin afirmar que existe infraestructura publica; el segundo exige un host y secretos administrados por el operador.

## Ensayo local aislado

1. Generar `.local/compose.env` con `node scripts/prepare-compose.mjs` si aun no existe.
2. Levantar el stack con `docker compose --env-file .local/compose.env -f docker-compose.yml -f docker-compose.staging.yml up -d --build`.
3. Ejecutar `STAGING_ALLOW_LOCAL_TLS=true npm run staging:smoke` (PowerShell: `$env:STAGING_ALLOW_LOCAL_TLS='true'; npm run staging:smoke`).
4. Ejecutar el probe con `npm run staging:monitor` usando la misma variable. El resultado NDJSON queda ignorado en `.local/`.
5. Ejecutar el E2E especifico con `WEB_URL=https://localhost:8443` y `npx playwright test tests/e2e/staging.spec.js --project=desktop`; Playwright confia exclusivamente en el certificado local cuando `STAGING_ALLOW_LOCAL_TLS=true`.

Caddy termina TLS con una CA local dentro del volumen `caddy_data`; no se debe exportar ni reutilizar esa CA. La API corre con `NODE_ENV=production`, `DEMO_MODE=false`, cookies `Secure`, base y uploads persistentes, y no publica PostgreSQL ni la API al host.

## Staging remoto

Antes del primer despliegue, el operador debe proporcionar dominio, host, registro inmutable, gestor de secretos, almacenamiento cifrado para backups y destino de alertas. El dominio debe usar un certificado de una CA publica; `tls internal` es solo para el ensayo loopback y debe sustituirse en la configuracion remota.

Usar tags o digest inmutables para API y web mediante `STAGING_API_IMAGE` y `STAGING_WEB_IMAGE`. Conservar el manifiesto anterior. El despliegue es: backup integral, pull del manifiesto candidato, migracion compatible hacia adelante, arranque, smoke y E2E. Si un gate falla, volver a declarar ambas variables con los digests anteriores y ejecutar Compose con `--no-build`; restaurar base solo cuando la migracion no sea retrocompatible y siguiendo un incidente aprobado.

## Backups y restauracion

El backup debe cubrir PostgreSQL y el volumen de uploads, cifrarse fuera del host y aplicar una retencion aprobada. `npm run db:verify-restore` sirve para una base local; en staging la restauracion se hace en una instancia aislada y se comparan conteos, migraciones, constraint de exclusion y archivos por checksum. Nunca restaurar encima del staging activo.

## Monitoreo y alertas

Programar `npm run staging:monitor` cada minuto desde un sistema externo al host. Alertar tras tres fallos consecutivos, por HTTP no exitoso o latencia acordada. Centralizar logs JSON de API/Caddy por request ID y alertar por reinicios, espacio de disco, fallos de backup, expiracion TLS, errores 5xx y saturacion de PostgreSQL. El probe local demuestra el contrato, no la entrega de una alerta externa.

## Rollback

Antes de promover, registrar manifiesto/digests, version de esquema y checksums del backup. Probar el retorno al manifiesto anterior y repetir health/smoke. No declarar rollback probado por cambiar una etiqueta en documentacion: debe quedar evidencia de comandos, tiempos y resultado en el informe de fase.
