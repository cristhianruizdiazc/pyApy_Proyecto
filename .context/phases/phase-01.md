# Fase 1: arquitectura inicial

Estado: decisiones iniciales adoptadas e implementadas localmente. Falta validar arquitectura de despliegue real; no equivale a arquitectura de produccion certificada.

La instruccion posterior del usuario autoriza avanzar sin nuevas preguntas. Requisitos: prompt maestro y aclaracion de proyecto nuevo; notas y auditoria siguen sin existir.

Se implementaron npm workspaces, React/Vite, React Native/Expo, Node.js/Express, PostgreSQL, PHP administrativo y Dockerfiles/Compose. Backend dueno exclusivo del dominio; contratos Zod compartidos. Decisiones y consecuencias en ADR-001 y ADR-002.

Estructura: apps/api, apps/web, apps/mobile, apps/admin-php, packages/contracts, database/migrations, scripts, tests. Configuracion por variables de entorno; secretos excluidos de Git.

Las migraciones y fases funcionales ya tienen avances; consultar implementation-0.1.md y BACKLOG.md. No se requiere volver a pedir autorizacion de avance.
