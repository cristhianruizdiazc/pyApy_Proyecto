# Fase 19: Docker y entornos

Fecha: 2026-09-24. Estado: cerrada para configuracion y validacion estatica local; ejecucion de imagenes pendiente de un motor Docker externo a este equipo.

## Alcance

Se revisaron Dockerfiles, Compose, secretos, perfiles y procedimientos de desarrollo, testing, staging y produccion. `docker` no esta instalado ni disponible en `PATH`; el binario local de Compose si esta disponible y valida el modelo sin requerir motor.

## Cambios

- La imagen API tiene etapas explicitas `production` y `test`. API/migrador seleccionan la primera y el perfil de pruebas selecciona la segunda; una compilacion sin target tambien termina en `production`.
- Compose declara entorno dev con `DEMO_MODE`/`SEED_DEMO` parametrizados y credenciales generadas solo en `.local/compose.env`. El migrador siembra solo cuando ambos flags lo autorizan y no persiste cuentas demo dentro del contenedor.
- Se agrego perfil `test`: PostgreSQL interno sin puerto publicado, contenedor de pruebas de solo lectura, `tmpfs` para uploads temporales y una excepcion acotada que permite al runner usar hostname `db` solo con `PYAPY_CONTAINER_TEST=true`.
- Se agrego ejemplo sin secretos para staging/produccion: `docker/compose.production.env.example`. Produccion exige HTTPS, `DEMO_MODE=false` y no siembra fixtures.
- `npm run containers:verify` resuelve Compose con perfiles `test` y `tools`, revisa etapas Docker, aislamiento de DB, loopback web, read-only, capabilities, no-new-privileges y exclusiones de secretos en `.dockerignore`.

## Entornos preparados

| Entorno | Comando previsto | Protecciones |
| --- | --- | --- |
| Desarrollo | `node scripts/prepare-compose.mjs` seguido de `docker compose --env-file .local/compose.env up --build -d` | Secretos aleatorios locales, demo y seed explicitos, web en loopback |
| Testing | `docker compose --env-file .local/compose.env --profile test run --rm test` | DB sin puerto host, base temporal por prueba, imagen con deps de test, tmpfs |
| Staging | Copiar el ejemplo a un almacen fuera del repo, sustituir secretos y usar `RUN_MODE=production`/HTTPS | Sin demo, sin fixtures, secretos no versionados |
| Produccion | Misma imagen `production`, con infraestructura TLS, secretos administrados y backup externo | API y web no privilegiadas; no hay despliegue automatico |

## Verificacion

- `npm run containers:verify`: aprobado para config segura y para desarrollo con `DEMO_MODE=true`, `SEED_DEMO=true` inyectados solo en el proceso de validacion.
- `npm run lint`, `npm test` (23/23), `npm run build` y `git diff --check`: aprobados.
- Compose local resolvio correctamente con `docker-compose.exe ... config --quiet` y formato JSON.
- No se imprimieron ni versionaron secretos. `prepare-compose` no sobrescribe el archivo existente.

## Gate de runtime y limites

No fue posible ejecutar `docker build`, `up`, health checks de contenedor, volumenes ni el perfil test: el motor Docker/WSL no existe en este equipo y no se instalo Docker Desktop sin una solicitud expresa de administracion del host. Este no es un fallo de configuracion ni se reemplaza por una afirmacion ficticia.

Antes de RC/preproduccion, ejecutar los comandos anteriores en un host con motor Docker y registrar build, health checks, migracion, smoke web/API, reporte PHP, pruebas del perfil `test`, persistencia de volumenes y parada/arranque. TLS, secretos administrados, backups de uploads, monitoreo y rollback siguen siendo trabajo de staging/produccion.
