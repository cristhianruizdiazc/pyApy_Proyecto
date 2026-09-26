# Desarrollo local de pyApy

Esta guia describe la aplicacion conectada, no la vista estatica de `index.html`. pyApy 0.1.0 es un entorno de demostracion con datos ficticios; no debe recibir datos personales ni exponerse a Internet.

## Componentes y responsabilidades

| Componente | Ruta                 | Funcion                                                    |
| ---------- | -------------------- | ---------------------------------------------------------- |
| Web        | `apps/web`           | React/Vite: marketplace, cuentas y paneles web             |
| API        | `apps/api`           | Express: autenticacion, autorizacion y reglas de negocio   |
| Mobile     | `apps/mobile`        | Expo/React Native: usa la misma API con bearer             |
| Contratos  | `packages/contracts` | Zod, fechas, cliente HTTP y sincronizacion compartida      |
| Base       | `database`           | Migraciones, permisos y datos demo                         |
| PHP        | `apps/admin-php`     | Reporte CLI de solo lectura; no contiene reglas de negocio |

La web solicita; la API decide. PostgreSQL es la fuente de verdad. La arquitectura detallada esta en [`.context/ARCHITECTURE.md`](../.context/ARCHITECTURE.md) y los contratos HTTP en [`.context/API.md`](../.context/API.md).

## Requisitos

- Node.js 24 y npm.
- PostgreSQL 16 con `initdb`, `pg_ctl`, `createdb`, `pg_dump` y `pg_restore`. En Windows se espera `C:/Program Files/PostgreSQL/16/bin`; definir `PG_BIN` si esta en otra ruta.
- Chromium de Playwright solo para E2E: `npx playwright install chromium`.
- PHP 8.5 para el reporte opcional. El proyecto prepara su runtime local; no usa el PHP 7.2 de XAMPP.

Docker es opcional para desarrollo. El motor Docker no esta disponible en este equipo; las imagenes se construyen en CI, pero el arranque Compose aun debe validarse en un host con motor.

## Primera instalacion

Desde la raiz del repositorio:

```powershell
npm ci
npm run setup
npm run dev
```

`setup` crea un cluster aislado en `.local/postgres`, en `127.0.0.1:55432`; genera `.env` local, aplica migraciones, reaplica permisos y siembra datos ficticios. No sobrescribe un `.env` existente ni reutiliza una base externa. `dev` reserva puertos libres desde 4100 para la API y 5173 para Vite; consultar `.local/dev.json` para las URLs reales.

No versionar `.env`, `.local`, `uploads`, backups, logs ni cuentas demo. Las credenciales se generan localmente y estan ignoradas por Git.

## Configuracion

`.env.example` documenta valores no secretos. Las variables que controla la API son:

| Variable                   | Uso                                                    |
| -------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`             | Conexion de la API con privilegios limitados           |
| `DATABASE_ADMIN_URL`       | Migraciones y backup locales; nunca para web ni mobile |
| `REPORT_DATABASE_URL`      | Vista agregada para el reporte PHP                     |
| `NODE_ENV`, `HOST`, `PORT` | Runtime de la API                                      |
| `WEB_ORIGIN`               | Origen web permitido para CORS/CSRF                    |
| `DEMO_MODE`                | Datos demo; debe ser `false` en produccion             |
| `UPLOAD_DIR`               | Almacenamiento local de imagenes                       |
| `TRUST_PROXY`              | Solo `1` detras de un proxy confiable                  |

En produccion, la API se niega a iniciar si `DEMO_MODE=true` o si `WEB_ORIGIN` no usa HTTPS. La configuracion de mobile se mantiene separada en `apps/mobile/.env.example`: `EXPO_PUBLIC_API_URL` debe incluir `/api/v1` y ser alcanzable por el emulador o dispositivo.

## Clientes

### Web

Abrir la URL indicada por `npm run dev`. React usa `/api/v1` mediante el cliente compartido; las rutas de mapa y paneles se cargan bajo demanda. La vista HTML estatica se abre con `index.html`, no autentica ni modifica datos y no sustituye esta aplicacion.

### React Native

```powershell
npm run mobile:check
npm exec --workspace=mobile -- expo start
npm run mobile:export
```

El emulador Android accede al host con `10.0.2.2`; un telefono necesita una IP LAN y una API enlazada a esa interfaz, sin exponerla a Internet. La sesion se guarda en SecureStore; la cache y cola de operaciones se separan por usuario. No hay validacion completa en dispositivo ni paridad total de propietario/administracion.

### Roles, autenticacion y reservas

Los unicos roles estructurales son cliente, propietario y administrador. El registro publico no acepta rol; sesion, permisos y propiedad de recursos se derivan en servidor. La web usa cookie HttpOnly y CSRF; mobile usa bearer, nunca cookies. No hay recuperacion de cuenta, verificacion de email ni MFA administrativo.

Una reserva requiere fecha, intervalo, capacidad y un `Idempotency-Key` UUID. La cotizacion no bloquea inventario: la API recalcula precio, revalida disponibilidad y PostgreSQL rechaza solapamientos antes de confirmar. La cola offline nunca confirma precio ni disponibilidad localmente; al sincronizar, el servidor acepta, rechaza o devuelve conflicto. Consultar [API](../.context/API.md), [base](../.context/DATABASE.md) y [seguridad](../.context/SECURITY.md).

## Verificacion

```powershell
npm run check
npm run test:e2e
npm audit --audit-level=moderate
node scripts/verify-permissions.mjs
npm run db:verify-restore
npm run report
```

`npm test` crea una base temporal y no limpia la base de desarrollo. `npm run test:e2e` usa la instancia indicada por `WEB_URL` o `.local/dev.json`; para un runner aislado usar `node scripts/verify-web-integration.mjs`. Los resultados comprobados y limites estan en [`.context/TESTING.md`](../.context/TESTING.md).

## Problemas frecuentes

- Base detenida: ejecutar `npm run db:local` y revisar `.local/postgres.log`; no borrar el cluster para resolver errores.
- Puerto ocupado: consultar `.local/dev.json`; `dev` elige otro puerto disponible.
- Error 409 al reservar: el intervalo fue ocupado o la clave de idempotencia se reutilizo con contenido distinto.
- Error 429 en E2E contra una instancia compartida: esperar la ventana de rate limiting; usar el runner aislado en vez de reducir la proteccion.
- Mapa o fotos sin cargar: revisar API, conexion y logs. Eso no confirma disponibilidad ni autoriza una reserva.
- Sesion mobile: volver a iniciar sesion si expira; la cola conserva la clave de idempotencia, no una confirmacion local.
