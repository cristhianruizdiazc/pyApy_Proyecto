# ADR-011 - Alcance web para pyApy v1

Fecha: 2026-10-22. Estado: **ADOPTADO**.

## Contexto

El repositorio contiene una aplicación React Native/Expo inicial, una cola offline y un APK Android de demostración. Para llevar esa aplicación a una distribución real todavía serían necesarios paridad funcional, pruebas en dispositivos físicos, firma de publicación, protección de la caché privada y seguimiento de dependencias Expo/Metro.

El usuario decidió no continuar con la aplicación móvil durante esta v1 y concentrar el trabajo y el lanzamiento en la aplicación web.

## Decisión

- pyApy v1 tendrá como producto cliente únicamente la aplicación web React responsive de `apps/web`.
- El backend Node.js, PostgreSQL, PHP administrativo, Docker y OpenStreetMap continúan dentro del alcance.
- `apps/mobile` y sus artefactos existentes se conservan como trabajo previo, sin eliminar ni reescribir, pero quedan congelados y fuera de los criterios de aceptación, release, staging y producción de v1.
- No se exige para v1 paridad React Native, instalación en dispositivos, firma para tiendas, funcionamiento offline nativo ni resolución de avisos que afecten exclusivamente al tooling móvil.
- La experiencia web en pantallas pequeñas sí permanece dentro del alcance: “web móvil” o métricas Lighthouse mobile se refieren al sitio responsive, no a React Native.
- React Native podrá retomarse después de v1 mediante una decisión nueva que reactive su alcance y vuelva a evaluar arquitectura, seguridad, dependencias, paridad y distribución.
- Esta decisión no autoriza borrar la aplicación móvil ni sustituye las garantías compartidas del backend.

## Razones

- Concentrar el esfuerzo de v1 en un canal que ya cuenta con integración funcional, pruebas E2E y despliegue en contenedores.
- Evitar que requisitos específicos de tiendas y dispositivos bloqueen la entrega web.
- Conservar el trabajo móvil existente para una evolución posterior sin presentarlo como producto listo.

## Consecuencias

- R-007 y R-022 dejan de bloquear la v1 web, pero permanecen registrados como deuda móvil diferida.
- Los gates de release web no deben depender de exportar, compilar o auditar React Native. Los controles móviles existentes pueden mantenerse como informativos mientras no impidan la entrega web.
- La Fase 25 continúa bloqueada por infraestructura remota, secretos, certificado público, alertas y backups externos; ya no por falta de dispositivo nativo.
- Documentación y planificación deben distinguir expresamente `web responsive` de `app móvil nativa`.

## Reversibilidad

La decisión puede revertirse después de v1 con autorización expresa, un alcance móvil actualizado y criterios de aceptación propios. El código conservado sirve como punto de partida, no como garantía de compatibilidad futura.
