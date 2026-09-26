# Operacion, entrega y recuperacion

Esta guia diferencia lo verificado en desarrollo/CI de los requisitos pendientes para staging y produccion. pyApy no tiene proveedor, dominio, secretos administrados ni despliegue configurado.

## Estado comprobado

La [corrida final de CI](https://github.com/cristhianruizdiazc/pyApy_Proyecto/actions/runs/36256453136) aprobo instalacion desde lockfile, auditoria, lint, 23 pruebas unitarias/API, build web, compatibilidad y export mobile, validacion y build de imagenes Docker, y E2E. La configuracion Compose y las imagenes existen, pero aun no se ejecutaron `compose up`, health checks, volumenes o perfil `test` en un host Docker.

## Contenedores

Para desarrollo en un host con motor Docker:

```powershell
node scripts/prepare-compose.mjs
docker compose --env-file .local/compose.env config --quiet
docker compose --env-file .local/compose.env up --build -d
docker compose --env-file .local/compose.env --profile tools run --rm admin-report
```

Compose mantiene PostgreSQL sin puerto publicado, una API no privilegiada, web publicada solo en loopback y volumenes separados para base e imagenes. El perfil `test` no publica la base y usa uploads temporales:

```powershell
docker compose --env-file .local/compose.env --profile test run --rm test
```

Estos comandos son procedimientos previstos: registrar salida de build, salud de DB/API/web, prueba de volumenes, migracion y parada/arranque antes de afirmarlos como validados en runtime.

## Staging y produccion

Partir de `docker/compose.production.env.example` en un almacen fuera del repositorio. Antes de desplegar se requiere:

1. Proveedor, dominio y TLS configurados.
2. Secretos administrados y rotables, sin `.env` ni credenciales demo en imagenes o Git.
3. `RUN_MODE=production`, `DEMO_MODE=false`, `SEED_DEMO=false` y `WEB_ORIGIN=https://...`.
4. Imagenes verificadas e inmutables; migraciones compatibles hacia adelante.
5. Smoke tests web/API, observabilidad, alertas y limites distribuidos si hay mas de una instancia.
6. Backup consistente de PostgreSQL y archivos, restaurado en un entorno aislado.
7. Procedimiento de rollback de aplicacion compatible con el esquema. No revertir SQL destructivo a ciegas.

No agregar un job de deploy hasta que esos puntos tengan proveedor, responsables y evidencia aprobados.

## Backup y restore

```powershell
npm run db:backup
npm run db:verify-restore
```

El backup produce un dump PostgreSQL custom y checksum en `.local/backups`. La verificacion restaura en una base temporal, compara conteos y comprueba la exclusion de reservas. No sobrescribe datos en uso, pero tampoco incluye `.local/uploads`, retencion, PITR, cifrado externo ni automatizacion.

Para una recuperacion real: detener escrituras, conservar el original, restaurar DB y archivos del mismo punto en destinos nuevos, reaplicar permisos, verificar migraciones/constraints/permisos/imagenes, ejecutar smoke y cambiar trafico solo tras validar. Rotar secretos cuando el incidente lo amerite. El procedimiento detallado y sus limites estan en [`.context/OPERATIONS.md`](../.context/OPERATIONS.md).

## Seguridad operacional

- TLS termina en infraestructura aun no elegida; `TRUST_PROXY=1` solo aplica detras de un proxy confiable.
- Los logs no deben contener contrasenas, tokens, cuerpos sensibles ni PII innecesaria.
- El rate limiting actual vive en memoria: escalar requiere almacenamiento compartido.
- Fotos demo, datos ficticios y cuentas de prueba no son aptos para lanzamiento.
- Integraciones email, push, WhatsApp y MCP no estan conectadas; no marcar entregas externas como realizadas.

## Incidentes y diagnostico

Usar el request ID de la API para correlacionar logs. Para problemas locales revisar `.local/dev.out.log`, `.local/dev.err.log`, `.local/postgres.log` y `.local/dev.json`. Ante un conflicto de reserva no desactivar constraints: conservar evidencia, informar el conflicto y permitir al usuario elegir otro intervalo.

Para los riesgos pendientes y su prioridad, ver [`.context/RISKS.md`](../.context/RISKS.md). Para el alcance de CI y su evidencia, ver [Fase 20](../.context/phases/phase-20-cicd.md).
