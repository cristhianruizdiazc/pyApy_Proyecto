# pyApy

Marketplace de espacios por horas en Paraguay. Version local **0.1.0**, con datos ficticios, API y PostgreSQL reales. No es una release de produccion.

## Probar ahora

Web: http://127.0.0.1:5173. La URL y los procesos de la instancia actual se registran en `.local/dev.json`.

Las cuentas de cliente, propietario y administrador de demostracion estan en `.local/demo-accounts.json`. Sus contrasenas fueron generadas localmente; no se publican ni se versionan. Tambien se puede crear una cuenta desde la web. No usar datos personales reales en esta instalacion.

## Instalacion local

Requisitos: Node.js 24, npm y PostgreSQL 16 con `initdb`, `pg_ctl`, `createdb`, `pg_dump` y `pg_restore`. Windows usa por defecto `C:/Program Files/PostgreSQL/16/bin`; otro directorio se configura con `PG_BIN`.

Desde la raiz:

~~~powershell
npm ci
npm run setup
npm run dev
~~~

`setup` crea un cluster exclusivo en `.local/postgres`, puerto 55432, genera `.env`, aplica migraciones, separa permisos y agrega seis propiedades ficticias. Es repetible y no reemplaza credenciales existentes. No copiar `.env.example` sobre una instalacion local ya preparada. El modo automatico se niega a reutilizar otra base.

`dev` busca puertos libres a partir de 4100 (API) y 5173 (web). Para detenerlo en terminal, Ctrl+C. La instancia iniciada en segundo plano tiene sus PID y logs en `.local`; detener exclusivamente los PID de esa instancia, no todos los procesos Node del equipo. Reiniciar la API despues de editar backend.

Para detener solo el cluster de este proyecto en Windows:

~~~powershell
& 'C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe' stop -D 'C:\pyApy_Proyecto\.local\postgres' -m fast
~~~

## Que funciona

- Busqueda por fecha, ciudad, capacidad, presupuesto, tipo y servicios; ranking, alternativas, mapas OSM y favoritos.
- Registro, login, sesiones reales, tres roles y autorizacion por recurso.
- Reservas, cancelaciones, datos privados de llegada, resenas de estadias completadas y notificaciones internas.
- Panel propietario: propiedades, fotos, tarifas, horarios, calendario, reservas particulares y bloqueos.
- Panel administrador: usuarios, verificacion, moderacion, planes, solicitudes de suscripcion, sponsors, pesos de matching y auditoria.
- Aplicacion React Native con API compartida, almacenamiento seguro de sesion y cola offline revalidada por servidor.
- Informe administrativo PHP de solo lectura, migraciones, backups y pruebas automatizadas.

Las suscripciones se aprueban manualmente. No hay cobros, comision de reservas ni integraciones externas simuladas. Los precios de planes son configuracion inicial, no una oferta comercial validada.

## Estructura

| Ruta | Responsabilidad |
| --- | --- |
| `apps/api` | Express, autenticacion, dominio y PostgreSQL |
| `apps/web` | React, Vite, marketplace y paneles |
| `apps/mobile` | Expo 57 / React Native |
| `apps/admin-php` | Reporte CLI agregado, sin dominio duplicado |
| `packages/contracts` | Zod, fechas, cliente HTTP y sincronizacion |
| `database` | Migraciones, roles y permisos |
| `tests` | Unitarias, integracion y E2E |
| `.context` | Estado, decisiones, riesgos y trazabilidad |

## App nativa

~~~powershell
npm run mobile:check
npm exec --workspace=mobile -- expo start
npm run mobile:export
~~~

`EXPO_PUBLIC_API_URL` debe apuntar a la API accesible desde el dispositivo, incluyendo `/api/v1`; ver `apps/mobile/.env.example`. El emulador Android usa `10.0.2.2` para alcanzar el host. Un telefono fisico requiere la IP LAN del equipo y una API enlazada a esa interfaz; no exponerla a Internet. En produccion se exige HTTPS.

Se exportaron bundles Android/iOS y se verificaron dependencias. Todavia no se validaron instalacion nativa, gestos, reconexion real ni almacenamiento en un dispositivo. La administracion y la edicion completa de propiedades estan en la web; no se declara paridad nativa completa.

## Verificacion

~~~powershell
npm run check
npm run test:e2e
npm audit --audit-level=moderate
node scripts/verify-permissions.mjs
npm run db:verify-restore
npm run report
~~~

Las E2E requieren `npm run dev` y Chromium (`npx playwright install chromium`). `npm test` crea y elimina una base temporal propia; requiere credenciales locales de administracion y nunca limpia la base de desarrollo. Las E2E usan cuentas ficticias y dejan registros auditables de prueba.

El informe usa PHP 8.5 instalado en `.local/tools`, no el PHP 7.2 de XAMPP. Herramientas locales: `powershell -ExecutionPolicy Bypass -File scripts/install-local-tools.ps1`; los paquetes fijados se verifican con SHA-256.

## Docker

~~~powershell
node scripts/prepare-compose.mjs
docker compose --env-file .local/compose.env config --quiet
docker compose --env-file .local/compose.env up --build -d
docker compose --env-file .local/compose.env --profile tools run --rm admin-report
~~~

El generador no sobrescribe secretos. Compose enlaza la web a `127.0.0.1:8080`, no publica PostgreSQL y no carga fixtures. Motor Docker requerido: en este equipo solo se instalo Compose; no hay motor/WSL operativo. La configuracion fue validada, pero las imagenes y el arranque de contenedores no estan verificados.

Antes de produccion: resolver el [backlog](.context/BACKLOG.md), configurar TLS y dominio, establecer `RUN_MODE=production` y `WEB_ORIGIN=https://...`, definir credenciales administradas, backup de DB **y archivos**, monitoreo y rollback. No hay despliegue automatico configurado.

## Backup y recuperacion

`npm run db:backup` genera un dump PostgreSQL y checksum en `.local/backups`. `npm run db:verify-restore` ademas restaura en una base temporal aislada, compara conteos y verifica la exclusion de reservas; elimina solamente esa base temporal. No restaura sobre datos en uso.

Los dumps contienen datos privados y hashes de contrasenas: requieren proteccion, cifrado y almacenamiento fuera del equipo. El script actual no incluye fotos de `.local/uploads`, retencion, PITR ni programacion automatica. Ver [operacion y recuperacion](.context/OPERATIONS.md).

## Solucion de problemas

- Puerto ocupado: `dev` elige otro; consultar `.local/dev.json` y actualizar la URL mobile.
- Base apagada: `npm run db:local`; revisar `.local/postgres.log`. Nunca borrar el cluster para resolver un error.
- Sesion expirada: iniciar sesion nuevamente. La cola nativa conserva su clave de idempotencia al reintentar.
- Reserva rechazada con 409: otro usuario ocupo ese intervalo, o la misma clave se reutilizo con otro contenido.
- Fotos o mapa sin cargar: comprobar API, conexion a tiles OSM y logs; no equivale a disponibilidad confirmada.
- PHP: ejecutar `npm run report`, que selecciona el runtime compatible y el rol restringido.

Estado y evidencias: [.context/PROJECT_STATE.md](.context/PROJECT_STATE.md), [pruebas](.context/TESTING.md), [seguridad](.context/SECURITY.md), [riesgos](.context/RISKS.md).
