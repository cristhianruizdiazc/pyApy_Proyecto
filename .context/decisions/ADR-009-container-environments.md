# ADR-009: perfiles de contenedor y secretos por entorno

Fecha: 2026-09-24. Estado: adoptado.

## Contexto

El Compose existente tenia servicios endurecidos, pero no separaba de forma ejecutable el runner de pruebas de la imagen runtime ni explicitaba demo/seed por entorno. El host actual no dispone de motor Docker.

## Decision

Definir etapas `production`/`test`, perfil Compose `test`, flags explicitos de demo/fixtures y un ejemplo de variables de produccion sin secretos. Validar el modelo con Compose y un script local sin requerir motor. Mantener la ejecucion real como gate obligatorio de infraestructura.

## Consecuencias

El mismo repositorio describe desarrollo, test y produccion sin insertar secretos en imagenes ni archivos versionados. El perfil test obtiene una DB interna y temporal; la imagen runtime queda sin dependencias de test. La disponibilidad de Docker Desktop/Engine no se asume ni se instala automaticamente.
