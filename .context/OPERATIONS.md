# Operacion y recuperacion

Version local 0.1.0, actualizado 2026-09-26. Este documento diferencia procedimientos locales probados de preparacion de produccion.

## Entornos Compose

`node scripts/prepare-compose.mjs` crea solo `.local/compose.env` de desarrollo y no lo sobrescribe. Para validar sin motor: `npm run containers:verify`; en Windows usa el Compose verificado de `.local/tools` si no se indica `COMPOSE_BIN`. Desarrollo puede sembrar datos unicamente con `DEMO_MODE=true` y `SEED_DEMO=true`.

El perfil `test` se ejecuta con `docker compose --env-file .local/compose.env --profile test run --rm test`; no publica PostgreSQL, crea bases temporales y usa uploads efimeros. Para staging/produccion, partir de `docker/compose.production.env.example` fuera del repo, gestionar secretos, usar HTTPS y desactivar demo/seed. Ver [Fase 19](phases/phase-19-docker.md).

## Configuracion

`DATABASE_URL`: identidad runtime limitada. `DATABASE_ADMIN_URL`: migraciones/backup locales; nunca disponible para navegadores ni app nativa. `REPORT_DATABASE_URL`: reporte agregado. `NODE_ENV`, `HOST`, `PORT`, `WEB_ORIGIN`, `DEMO_MODE`, `UPLOAD_DIR` y `TRUST_PROXY`: validados por config.mjs.

La API rechaza demo en produccion y un origen de produccion sin HTTPS. No hay valores secretos en .env.example. Compose genera contrasenas locales en .local/compose.env y exige variables; no reusar esas credenciales para infraestructura externa.

## Arranque y salud local

`npm run setup`, luego `npm run dev`. GET /api/health verifica PostgreSQL. Logs del arranque en segundo plano: .local/dev.out.log y .local/dev.err.log. PIDs/puertos en .local/dev.json. PostgreSQL: .local/postgres.log.

No hay servicio Windows ni inicio automatico al reiniciar el equipo. No detener procesos ajenos ni borrar .local para arreglar un problema. Los puertos pueden cambiar si estan ocupados.

## E2E con procesos aislados

Desde raíz: `node scripts/verify-web-integration.mjs`. Requiere instalación local preparada, PostgreSQL en marcha, datos/cuentas demo y Chromium de Playwright. Crea procesos propios API/Vite en puertos libres, espera respuesta, ejecuta Playwright y termina únicamente sus procesos. No modifica `.local/dev.json`; la web habitual conserva su URL.

Comparte la base local de demo, por lo que las pruebas dejan cuentas/eventos/reservas auditables. No es aislamiento de datos ni runner de producción. Los fixtures nuevos cancelan sus ocupaciones y despublican sus propiedades. Para un subconjunto: `node scripts/verify-web-integration.mjs tests/e2e/detail-reservation.spec.js --grep "respuesta"`.

`npm run test:e2e` sigue disponible contra la instancia indicada por `WEB_URL` o `.local/dev.json`. Repetir autenticaciones contra un proceso compartido puede alcanzar HTTP 429: respetar la ventana (30 intentos/15 minutos), no quitar el rate limiting. El runner temporal permite una ejecución reproducible sin consumir el contador de la API usada manualmente.

## Backup local probado

`npm run db:backup`: dump custom de pg_dump, sin propietarios/ACL, mas checksum SHA-256. Guardado privado en .local/backups. `npm run db:verify-restore`: crea base pyapy_restore con sufijo aleatorio, restaura, compara cinco conteos, comprueba exclusion y elimina esa base de ensayo. Solo acepta entorno local no productivo.

La comparacion de conteos presupone ausencia de escrituras concurrentes durante el ensayo. No es comparacion exhaustiva de todos los datos. Backup local no sustituye copia externa ni prueba de desastre.

## Recuperacion operacional pendiente

1. Identificar ultimo backup verificado y copia de uploads del mismo punto; registrar checksum.
2. Restaurar en base y volumen nuevos, sin sobrescribir los que contienen el incidente.
3. Crear roles mediante procedimiento de entorno, restaurar sin owner/ACL y aplicar permissions.sql.
4. Verificar migraciones, constraints, permisos, imagenes y relacion DB/archivos; ejecutar smoke/E2E.
5. Bloquear escrituras durante el cambio, conservar evidencia, rotar secretos si hubo exposicion.
6. Cambiar configuracion solamente despues de verificar; conservar destino previo hasta confirmar estabilidad.

Ese procedimiento todavia no se ejecuto con contenedores ni una infraestructura de staging. Falta automatizar backup multimedia, cifrado externo, retencion, alertas de fallo y objetivos RPO/RTO. No copiar el directorio vivo de PostgreSQL como sustituto de pg_dump o backup consistente.

## Despliegue y rollback pendiente

CI ejecuta install/lint/test/build/audit/export/E2E y build Docker; la corrida final `36256453136` aprobo ambos jobs sobre `ad97a06`. No despliega y no hay credenciales ni proveedor de despliegue configurados. Antes de liberar, fijar imagenes verificadas y migraciones compatibles, ejecutar staging y guardar un backup consistente. Rollback de aplicacion solo es seguro si el esquema sigue siendo compatible; una migracion destructiva necesita plan propio, no revertir SQL ciegamente. Ver [Fase 20](phases/phase-20-cicd.md).

TLS termina en infraestructura aun no configurada. TRUST_PROXY=1 solo es correcto con un proxy confiable y API no expuesta directamente. Rate limiting en memoria requiere almacen compartido al escalar.

## Proveedores y datos

OSM/tiles requiere conexion, atribucion y politica de uso apropiada al volumen; no cache masivo/offline implementado. Email, push, WhatsApp y MCP no estan conectados. No marcar mensajes externos como entregados.

Fotos en apps/web/public/demo vienen de URLs especificas conservadas en scripts/fetch-demo-assets.mjs. Son ilustraciones de demostracion, no fotos verificadas de establecimientos de Paraguay. Sustituir por activos autorizados y registrar licencias/atribucion antes de lanzamiento. No se ha afirmado propiedad sobre estas fotos.
