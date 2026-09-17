# Operacion y recuperacion

Version local 0.1.0, 2026-09-17. Este documento diferencia procedimientos locales probados de preparacion de produccion.

## Configuracion

`DATABASE_URL`: identidad runtime limitada. `DATABASE_ADMIN_URL`: migraciones/backup locales; nunca disponible para navegadores ni app nativa. `REPORT_DATABASE_URL`: reporte agregado. `NODE_ENV`, `HOST`, `PORT`, `WEB_ORIGIN`, `DEMO_MODE`, `UPLOAD_DIR` y `TRUST_PROXY`: validados por config.mjs.

La API rechaza demo en produccion y un origen de produccion sin HTTPS. No hay valores secretos en .env.example. Compose genera contrasenas locales en .local/compose.env y exige variables; no reusar esas credenciales para infraestructura externa.

## Arranque y salud local

`npm run setup`, luego `npm run dev`. GET /api/health verifica PostgreSQL. Logs del arranque en segundo plano: .local/dev.out.log y .local/dev.err.log. PIDs/puertos en .local/dev.json. PostgreSQL: .local/postgres.log.

No hay servicio Windows ni inicio automatico al reiniciar el equipo. No detener procesos ajenos ni borrar .local para arreglar un problema. Los puertos pueden cambiar si estan ocupados.

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

CI definido hace install/lint/test/build/audit/export/E2E y build Docker; no despliega. No hay repositorio remoto ni credenciales configurados. Antes de liberar, fijar imagenes verificadas y migraciones compatibles, ejecutar staging y guardar un backup consistente. Rollback de aplicacion solo es seguro si el esquema sigue siendo compatible; una migracion destructiva necesita plan propio, no revertir SQL ciegamente.

TLS termina en infraestructura aun no configurada. TRUST_PROXY=1 solo es correcto con un proxy confiable y API no expuesta directamente. Rate limiting en memoria requiere almacen compartido al escalar.

## Proveedores y datos

OSM/tiles requiere conexion, atribucion y politica de uso apropiada al volumen; no cache masivo/offline implementado. Email, push, WhatsApp y MCP no estan conectados. No marcar mensajes externos como entregados.

Fotos en apps/web/public/demo vienen de URLs especificas conservadas en scripts/fetch-demo-assets.mjs. Son ilustraciones de demostracion, no fotos verificadas de establecimientos de Paraguay. Sustituir por activos autorizados y registrar licencias/atribucion antes de lanzamiento. No se ha afirmado propiedad sobre estas fotos.
