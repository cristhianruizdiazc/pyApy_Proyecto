# Fase 20: CI/CD

Fecha: 2026-09-25. Cierre iniciado: 2026-09-26. Estado: validacion local completada; primera ejecucion remota en preparacion.

## Alcance entregado

Se actualizo `.github/workflows/ci.yml` para ejecutar GitHub Actions ante `push`, pull request y disparo manual. La configuracion separa los gates rapidos y de artefacto de las pruebas E2E, cada uno con PostgreSQL 16 efimero propio.

El job `verify` instala exclusivamente desde `package-lock.json`, audita dependencias en severidad moderada o mayor, ejecuta lint, pruebas unitarias/API, build web, chequeo y export de Expo, y valida/construye las imagenes Docker. El job `e2e`, dependiente del anterior, migra/siembra una base CI, inicia API y web y ejecuta Playwright. Si falla, publica log de desarrollo y resultados E2E cuando existan.

## Seguridad y despliegue

El workflow declara permisos minimos de solo lectura, cancela ejecuciones antiguas para la misma rama/PR y solo utiliza la contrasena efimera del PostgreSQL de CI. No recibe, almacena ni imprime secretos de entornos reales.

No se implemento un deploy: no hay proveedor, entorno staging, secretos administrados, rollback probado ni autorizacion para elegirlos. Esta ausencia es deliberada y evita desplegar produccion automaticamente sin estrategia de recuperacion. Ver [ADR-010](../decisions/ADR-010-ci-pipeline.md).

## Verificacion local

- Prettier proceso el YAML del workflow sin cambios; `npm run containers:verify` aprobo la configuracion Compose endurecida y `git diff --check` no reporto errores de whitespace.
- `npm run check`: lint aprobado, 23 pruebas aprobadas y build Vite exitoso.
- `npm audit --audit-level=moderate`: cero vulnerabilidades reportadas.
- En el cierre del 2026-09-26, `npm run mobile:check` detecto como error la incompatibilidad de `expo` 57.0.23 con la version esperada `~57.0.25`. Se actualizo la dependencia y el lockfile; la comprobacion paso y el export Android/iOS completo.
- `npm ci` reinstalo 766 paquetes exclusivamente desde el lockfile actualizado y `npm audit --audit-level=moderate` informo cero vulnerabilidades.
- La primera ejecucion de `npm run check` del cierre fallo porque PostgreSQL local estaba detenido (`ECONNREFUSED 127.0.0.1:55432`). Tras iniciar el cluster aislado con `npm run db:local`, lint, 23 pruebas y build web pasaron. No se atribuye ese fallo de entorno al codigo.
- La primera corrida remota (`36255276776`, commit `c021c83`) aprobo por completo `verify`, incluido el build Docker real en Linux. E2E obtuvo 41 aprobadas, una omitida y dos fallos del mismo escenario: la simulacion solo abortaba JPG y las fuentes WebP nuevas seguian cargando. Se amplio la regresion para interceptar JPG/JPEG/WebP en ambos viewports.
- La regresion focalizada corregida paso localmente en desktop y mobile (2/2) sobre una instancia aislada de API, Vite y PostgreSQL.
- Las advertencias del runner sobre runtimes Node 20 de las acciones se corrigieron con `actions/checkout@v5`, `actions/setup-node@v5` y `actions/upload-artifact@v6`, versiones Node 24 compatibles con el runner hospedado.
- GitHub Actions no puede ejecutarse desde este entorno sin enviar cambios al remoto, accion que no se realiza en esta fase. La E2E remota queda pendiente de la primera corrida.

## Pendientes

1. Confirmar primera corrida en GitHub y resolver cualquier diferencia del runner Linux.
2. Ejecutar contenedores reales en un host con Docker y registrar build, health checks, volumenes y perfil test.
3. Disenar y aprobar staging, registro de imagenes, secretos, smoke checks, observabilidad, backup integral y rollback antes de agregar deploy.
