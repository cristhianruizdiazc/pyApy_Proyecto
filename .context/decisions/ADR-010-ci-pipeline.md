# ADR-010: CI reproducible sin despliegue implicito

Fecha: 2026-09-25. Estado: adoptado para el repositorio.

## Contexto

La fase 20 exige gates de instalacion, calidad, pruebas, compilacion y seguridad. El repositorio tiene remoto GitHub, pero no cuenta con proveedor de despliegue, entorno staging, secretos administrados, observabilidad ni un rollback ensayado.

## Decision

GitHub Actions ejecuta en cada `push`, `pull_request` y ejecucion manual dos jobs:

1. `verify`: `npm ci`, auditoria de dependencias, lint, pruebas unitarias/API sobre PostgreSQL efimero, build web, comprobacion/export Expo y validacion/build de imagenes Docker.
2. `e2e`: PostgreSQL efimero independiente, migraciones, fixtures demo de CI, Chromium y Playwright.

Las ejecuciones concurrentes de la misma rama o pull request se cancelan para no consumir capacidad con resultados obsoletos. El token del workflow solo puede leer contenidos. Los datos de PostgreSQL usan una clave efimera visible y exclusiva del runner; no representa un secreto de infraestructura.

No se define un job de deploy. Un despliegue solo se incorporara despues de aprobar proveedor, identidad/secretos, imagen inmutable, staging, smoke tests, backup consistente de base y archivos, monitoreo y procedimiento de rollback compatible con migraciones.

## Consecuencias

Los cambios no llegan a produccion por una accion de GitHub. La corrida final `36255899826` aprobo los jobs `verify` y `e2e`; su evidencia y el fallo corregido de la corrida anterior constan en el informe de fase. El build de imagen no reemplaza el gate de `docker compose up`, health checks y volumenes en un host con motor Docker.
