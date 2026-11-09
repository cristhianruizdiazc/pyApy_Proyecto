# Contexto de pyApy

Estado actualizado: 2026-11-08. Fases 0–7 del rediseño web completadas localmente. Fase 24 cerrada en staging aislado; v1 enfocada exclusivamente en web por [ADR-011](decisions/ADR-011-web-first-v1.md); no producción.

## Lectura para continuar

Guía vigente para el rediseño web: [plan por fases](phases/rediseno-frontend-2026-11-03.md) y [ADR-013](decisions/ADR-013-frontend-redesign.md). El usuario eligió máxima fidelidad estructural al prototipo con funciones actuales, precio por hora y OpenStreetMap. `.local/audit-2026-10-28/TAREAS.md` queda como registro histórico y deja de guiar las mejoras web. **Fases 0–7 completadas entre el 4 y el 8 de noviembre de 2026:** [fase 0: recuperación y referencia](phases/rediseno-fase-0-2026-11-04/INFORME.md), [matriz funcional](phases/rediseno-fase-0-2026-11-04/MATRIZ.md), [fase 1: sistema visual y estructura compartida](phases/rediseno-fase-1-2026-11-04.md), [fase 2: portada y buscador](phases/rediseno-fase-2-2026-11-04.md), [fase 3: resultados y OpenStreetMap](phases/rediseno-fase-3-2026-11-07.md), [fase 4: ficha, galería y reserva](phases/rediseno-fase-4-2026-11-07.md), [fase 5: acceso y área personal](phases/rediseno-fase-5-2026-11-08.md), [fase 6: propietario, administración y ayuda](phases/rediseno-fase-6-2026-11-08.md), [fase 7: validación integrada y cierre](phases/rediseno-fase-7-2026-11-08.md), [guía visual efectiva](design/SISTEMA-VISUAL.md). Entrega local validada; sin despliegue.

Entrega funcional anterior al rediseño (2026-10-25): [búsqueda por etapas](phases/progressive-search-2026-10-25.md), decisión [ADR-012](decisions/ADR-012-progressive-search.md). Mantiene ADR-011 y no autoriza producción.

Documentación operativa: [Fase 21 Documentacion](phases/phase-21-documentation.md). La instalacion, desarrollo, operacion y recuperacion se consolidaron en el README raiz y `docs/`; staging, deploy y rollback siguen pendientes.

La decisión vigente más reciente es [ADR-013](decisions/ADR-013-frontend-redesign.md), sobre el rediseño web. [ADR-011](decisions/ADR-011-web-first-v1.md) mantiene React Native congelado para después de v1 y fuera de los criterios de release web. El último cierre de fase de preproducción es [Fase 24](phases/phase-24-preproduction.md); no declara producción.

1. [Estado vigente](PROJECT_STATE.md).
2. [Backlog y cobertura de fases](BACKLOG.md).
3. [Arquitectura](ARCHITECTURE.md), [base](DATABASE.md) y [API](API.md).
4. [Seguridad](SECURITY.md), [riesgos](RISKS.md) y [pruebas](TESTING.md).
5. [Operacion](OPERATIONS.md), [decisiones](DECISIONS.md) y [cambios](CHANGELOG.md).
6. [Fase 0 historica](phases/phase-00.md), [Fase 1](phases/phase-01.md) y [avance consolidado](phases/implementation-0.1.md).
7. Entrega histórica: [UI 03 — cuenta y gestión](phases/integration-ui-03.md), [ADR-005](decisions/ADR-005-workspace-ui.md). Previas: [UI 02](phases/integration-ui-02.md), [ADR-004](decisions/ADR-004-booking-ui-state.md), [UI 01](phases/integration-ui-01.md), [identidad y procedencia](design/ARTESANAL.md), [ADR-003](decisions/ADR-003-legacy-ui-integration.md).

## Fuentes y autorizacion

[Prompt maestro](sources/PROMPT_MAESTRO.md), aclaracion del usuario de que no existia base, permiso para instalar herramientas necesarias e instruccion posterior de continuar sin preguntar. Esta ultima reemplaza las pausas de autorizacion entre fases; no reemplaza criterios de seguridad ni validacion.

No fueron proporcionados notas.md ni la auditoria original. No crear documentos que finjan ser esos originales. No guardar secretos en .context. Instrucciones de ejecucion en [README raiz](../README.md).

Autorizaciones de integración: prioridad `apps/web`, identidad artesanal sutil y documentación de todos los cambios aquí; después se autorizaron detalle/reserva y cuenta/gestión. Tres entregas cerradas. Próxima propuesta: validación transversal de accesibilidad, navegación y rendimiento. Ver DECISIONS.md para distinguir autorizaciones históricas y alcance actual.
