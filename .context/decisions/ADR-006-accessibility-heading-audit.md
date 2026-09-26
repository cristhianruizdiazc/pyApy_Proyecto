# ADR-006 — Auditoría automatizada de accesibilidad del frontend

- **Fecha:** 2026-09-24
- **Estado:** ADOPTADO para la integración web local; no es certificación WCAG 1.0.

## Contexto

La integración UI 01-03 ya cubría varios comportamientos accesibles, pero la auditoría automatizada prevista en el backlog no se había ejecutado. El repositorio ya contenía `@axe-core/playwright` y `scripts/audit-frontend.mjs`, capaz de recorrer las rutas públicas, autenticación, detalle, cuenta, propietario y administración en 1440 y 390 px.

La primera ejecución real necesitó iniciar el PostgreSQL aislado documentado en `.local/postgres`. Después encontró 16 estados con las reglas `heading-order` y `page-has-heading-one`, sin overflow ni errores de página.

## Decisión

Corregir la semántica en la aplicación React vigente, sin cambiar contratos, API, datos ni diseño visual:

- Los títulos de tarjetas, reservas, espacios y estados vacíos pasan a usar `h2` cuando son descendientes directos del título de página.
- La pantalla de autenticación conserva un único `h1` visible en móvil; el texto decorativo de la imagen deja de ser un encabezado.
- Se mantienen los estilos existentes mediante selectores actualizados.
- La auditoría se ejecuta contra el build Vite (`node scripts/verify-web-integration.mjs --audit <label>`), para comprobar el artefacto que se serviría en producción local.

## Evidencia

La ejecución final `accessibility-final` recorrió 60 estados, 30 por viewport, y obtuvo:

- 0 estados con violaciones Axe.
- 0 reglas incumplidas.
- 0 desbordamientos horizontales.
- 0 errores de página.

## Consecuencias y límites

La brecha automatizada de encabezados queda corregida y se conserva un informe JSON local ignorado por Git. Esto no cierra por sí solo la fase 5 ni la fase 17: siguen pendientes contraste calculado/manual, lector de pantalla, zoom 200 %, navegación con tecnologías asistivas, navegadores adicionales, Lighthouse, validación cultural de activos y pruebas nativas.

La auditoría comparte la base local de demo durante el recorrido autenticado; no es una prueba de producción ni una certificación WCAG completa. Docker, CI remoto, carga, staging y recuperación operacional permanecen fuera de esta decisión.
