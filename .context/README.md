# Contexto de pyApy

Estado actualizado: 2026-10-22. Fase 24 cerrada en staging aislado; v1 enfocada exclusivamente en web por [ADR-011](decisions/ADR-011-web-first-v1.md); no producción.

## Lectura para continuar

Ultima fase cerrada: [Fase 21 Documentacion](phases/phase-21-documentation.md). La instalacion, desarrollo, operacion y recuperacion se consolidaron en el README raiz y `docs/`; staging, deploy y rollback siguen pendientes.

La decisión vigente más reciente es [ADR-011](decisions/ADR-011-web-first-v1.md): React Native se conserva congelado para después de v1 y no bloquea el release web. El último cierre de fase es [Fase 24](phases/phase-24-preproduction.md); no declara producción.

1. [Estado vigente](PROJECT_STATE.md).
2. [Backlog y cobertura de fases](BACKLOG.md).
3. [Arquitectura](ARCHITECTURE.md), [base](DATABASE.md) y [API](API.md).
4. [Seguridad](SECURITY.md), [riesgos](RISKS.md) y [pruebas](TESTING.md).
5. [Operacion](OPERATIONS.md), [decisiones](DECISIONS.md) y [cambios](CHANGELOG.md).
6. [Fase 0 historica](phases/phase-00.md), [Fase 1](phases/phase-01.md) y [avance consolidado](phases/implementation-0.1.md).
7. Última entrega: [UI 03 — cuenta y gestión](phases/integration-ui-03.md), [ADR-005](decisions/ADR-005-workspace-ui.md). Previas: [UI 02](phases/integration-ui-02.md), [ADR-004](decisions/ADR-004-booking-ui-state.md), [UI 01](phases/integration-ui-01.md), [identidad y procedencia](design/ARTESANAL.md), [ADR-003](decisions/ADR-003-legacy-ui-integration.md).

## Fuentes y autorizacion

[Prompt maestro](sources/PROMPT_MAESTRO.md), aclaracion del usuario de que no existia base, permiso para instalar herramientas necesarias e instruccion posterior de continuar sin preguntar. Esta ultima reemplaza las pausas de autorizacion entre fases; no reemplaza criterios de seguridad ni validacion.

No fueron proporcionados notas.md ni la auditoria original. No crear documentos que finjan ser esos originales. No guardar secretos en .context. Instrucciones de ejecucion en [README raiz](../README.md).

Autorizaciones de integración: prioridad `apps/web`, identidad artesanal sutil y documentación de todos los cambios aquí; después se autorizaron detalle/reserva y cuenta/gestión. Tres entregas cerradas. Próxima propuesta: validación transversal de accesibilidad, navegación y rendimiento. Ver DECISIONS.md para distinguir autorizaciones históricas y alcance actual.
