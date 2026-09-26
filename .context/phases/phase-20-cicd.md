# Fase 20: CI/CD

Fecha de configuracion: 2026-09-25. Fecha de cierre: 2026-09-26. Estado: **CERRADA**.

## Alcance entregado

Se actualizo `.github/workflows/ci.yml` para ejecutar GitHub Actions ante `push`, pull request y disparo manual. La configuracion separa los gates rapidos y de artefacto de las pruebas E2E, cada uno con PostgreSQL 16 efimero propio.

El job `verify` instala exclusivamente desde `package-lock.json`, audita dependencias en severidad moderada o mayor, ejecuta lint, pruebas unitarias/API, build web, chequeo y export de Expo, y valida/construye las imagenes Docker. El job `e2e`, dependiente del anterior, migra/siembra una base CI, inicia API y web y ejecuta Playwright. Si falla, publica log de desarrollo y resultados E2E cuando existan.

## Seguridad y despliegue

El workflow declara permisos minimos de solo lectura, cancela ejecuciones antiguas para la misma rama/PR y solo utiliza la contrasena efimera del PostgreSQL de CI. No recibe, almacena ni imprime secretos de entornos reales.

No se implemento un deploy: no hay proveedor, entorno staging, secretos administrados, rollback probado ni autorizacion para elegirlos. Esta ausencia es deliberada y evita desplegar produccion automaticamente sin estrategia de recuperacion. Ver [ADR-010](../decisions/ADR-010-ci-pipeline.md).

## 1. Resumen

La fase queda cerrada con CI real en GitHub Actions. El workflow ejecuta instalacion desde lockfile, auditoria, lint, pruebas unitarias/API, build web, compatibilidad y export mobile, validacion y build Docker, y una suite E2E separada con PostgreSQL efimero.

Durante el cierre se corrigieron dos defectos que el gate detecto: Expo estaba fuera de la version compatible y una prueba de fallback solo interrumpia JPG aunque la aplicacion ya servia WebP responsivo. La segunda corrida remota aprobo ambos jobs.

## 2. Archivos

Modificados especificamente durante el cierre:

- `.github/workflows/ci.yml`: acciones oficiales con runtime Node 24 y gates remotos.
- `apps/mobile/package.json` y `package-lock.json`: Expo `~57.0.25` compatible.
- `tests/e2e/marketplace-integration.spec.js`: simulacion de fallo para JPG, JPEG y WebP.
- `.context/PROJECT_STATE.md`, `BACKLOG.md`, `CHANGELOG.md`, `TESTING.md`, `RISKS.md`, `OPERATIONS.md`, `ARCHITECTURE.md`, `README.md` y este informe.

No se eliminaron archivos. El primer push tambien publico el trabajo acumulado y ya validado de integracion UI, rendimiento y Fase 19 que permanecia sin commit. Los directorios locales de referencia `pyApy/` y `remix-remix-pyapy---reservas-paraguay/` no se incorporaron.

## 3. Arquitectura

Se mantiene la separacion de dos jobs: `verify` produce los gates de calidad/artefacto y `e2e` solo comienza si el primero pasa. Cada job usa su propio PostgreSQL 16 efimero. No se agrego despliegue: staging, secretos gestionados, observabilidad, backup integral y rollback deben definirse antes de CD.

## 4. Base de datos

No hubo cambios de esquema ni migraciones. Las migraciones existentes se aplicaron correctamente sobre PostgreSQL efimero en ambos jobs remotos. Los conflictos de reserva esperados por las pruebas siguieron protegidos por la exclusion PostgreSQL.

## 5. Seguridad

El workflow conserva `contents: read`, no usa secretos de produccion y limita las credenciales visibles a una clave efimera exclusiva del servicio PostgreSQL del runner. Se revisaron las rutas preparadas para commit y no se detectaron archivos de entorno, claves privadas ni firmas conocidas de credenciales.

## 6. Pruebas y evidencia

- Prettier proceso el YAML del workflow sin cambios; `npm run containers:verify` aprobo la configuracion Compose endurecida y `git diff --check` no reporto errores de whitespace.
- `npm run check`: lint aprobado, 23 pruebas aprobadas y build Vite exitoso.
- `npm audit --audit-level=moderate`: cero vulnerabilidades reportadas.
- En el cierre del 2026-09-26, `npm run mobile:check` detecto como error la incompatibilidad de `expo` 57.0.23 con la version esperada `~57.0.25`. Se actualizo la dependencia y el lockfile; la comprobacion paso y el export Android/iOS completo.
- `npm ci` reinstalo 766 paquetes exclusivamente desde el lockfile actualizado y `npm audit --audit-level=moderate` informo cero vulnerabilidades.
- La primera ejecucion de `npm run check` del cierre fallo porque PostgreSQL local estaba detenido (`ECONNREFUSED 127.0.0.1:55432`). Tras iniciar el cluster aislado con `npm run db:local`, lint, 23 pruebas y build web pasaron. No se atribuye ese fallo de entorno al codigo.
- La primera corrida remota (`36255276776`, commit `c021c83`) aprobo por completo `verify`, incluido el build Docker real en Linux. E2E obtuvo 41 aprobadas, una omitida y dos fallos del mismo escenario: la simulacion solo abortaba JPG y las fuentes WebP nuevas seguian cargando. Se amplio la regresion para interceptar JPG/JPEG/WebP en ambos viewports.
- La regresion focalizada corregida paso localmente en desktop y mobile (2/2) sobre una instancia aislada de API, Vite y PostgreSQL.
- Las advertencias del runner sobre runtimes Node 20 de las acciones se corrigieron con `actions/checkout@v5`, `actions/setup-node@v5` y `actions/upload-artifact@v6`, versiones Node 24 compatibles con el runner hospedado.
- Segunda corrida remota `36255899826`, commit `656f899`: `verify` aprobado sin advertencias/errores y `e2e` aprobado con 43 pruebas, una repeticion responsive omitida deliberadamente y cero fallos. Evidencia: https://github.com/cristhianruizdiazc/pyApy_Proyecto/actions/runs/36255899826.

## 7. Pendientes

1. Ejecutar `compose up`, health checks, persistencia de volumenes y perfil `test` en un host con Docker; CI ya comprobo el build de imagenes, no esos flujos de runtime.
2. Disenar y aprobar staging, registro de imagenes, secretos, smoke checks, observabilidad, backup integral y rollback antes de agregar deploy.
3. Mantener las acciones y la imagen `ubuntu-latest` bajo actualizacion controlada.

## 8. Riesgos

CI reduce el riesgo de integrar cambios que no instalan, compilan o superan pruebas. No certifica produccion, carga, dispositivos nativos, recuperacion operacional ni despliegue. Esas brechas permanecen en `RISKS.md` y `BACKLOG.md`.

## 9. `.context`

El estado, pruebas, riesgos, operaciones, arquitectura, backlog y changelog quedaron sincronizados con las dos corridas remotas y la correccion intermedia.

## 10. Proxima fase

La Fase 21 documentara instalacion, arquitectura, backend, frontend, React Native, PostgreSQL, APIs, autenticacion, roles, reservas, offline, Docker, produccion, backup/restore y troubleshooting; tambien reconciliara el README principal con el estado real. No se inicia sin autorizacion.

## 11. STOP

Fase 20 cerrada. Esperar autorizacion expresa para avanzar a la Fase 21.
