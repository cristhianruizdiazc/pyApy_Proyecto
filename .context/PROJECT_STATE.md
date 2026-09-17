# Estado de pyApy

Actualizado: 2026-09-17, America/Asuncion.

## Estado vigente

Version 0.1.0: implementacion funcional local de web, API y PostgreSQL, con app React Native inicial. No es pyApy 1.0, release candidate ni produccion. Las fases del prompt tienen avances y brechas registradas en [BACKLOG.md](BACKLOG.md); no se declaran completadas por compilar.

El usuario confirmo que no existia base anterior y autorizo continuar sin nuevas preguntas. No hay `notas.md` ni auditoria original; no se atribuyen requisitos a documentos inexistentes.

## Implementado

Monorepo npm, React/Vite, Express, contratos Zod, PostgreSQL, Expo/React Native y PHP administrativo. Persistencia real, sesiones y tres roles, propiedades y multimedia, busqueda/matching, favoritos, reservas concurrentes, calendario propietario, moderacion, planes manuales, sponsors, notificaciones internas, metricas iniciales y auditoria.

Base aislada en 127.0.0.1:55432. API sin superusuario, identidad independiente para migraciones y rol de lectura limitado para PHP. Datos ficticios; credenciales generadas en archivos ignorados por Git.

Web local: http://127.0.0.1:5173; instancia vigente en `.local/dev.json`. React Native exporta Android/iOS, pero no fue ejecutado en dispositivo. Cola offline implementada y probada a nivel de contrato, no validada con perdida real de conectividad nativa.

## Evidencia

- Lint sin errores ni advertencias; build web exitoso.
- 23 pruebas automatizadas aprobadas, incluida concurrencia de diez solicitudes con una sola confirmacion.
- Seis E2E web aprobadas en escritorio y viewport mobile.
- Backup restaurado en base temporal, conteos y exclusion conservados.
- Reporte PHP ejecutado con rol de solo lectura.
- npm audit: cero vulnerabilidades reportadas en la ejecucion registrada.
- Compose validado sintacticamente; motor no disponible.

## Limites de entrega

Pendientes: paridad y pruebas nativas, pruebas de carga y accesibilidad completas, integraciones externas autorizadas, endurecimiento operacional, Docker ejecutado, CI remoto, staging, rollback y produccion. Detalle en [RIESGOS](RISKS.md) y [BACKLOG](BACKLOG.md).

Los documentos de Fase 0 son historicos. Este estado reemplaza sus afirmaciones sobre workspace vacio y autorizacion pendiente.
