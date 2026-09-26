# ADR-007 — Línea base de rendimiento web

- **Fecha:** 2026-09-24
- **Estado:** REGISTRADO como línea base; no se aceptan SLO de producción todavía.

## Contexto

La fase transversal debía medir Lighthouse sobre la web compilada. El runner existente analiza portada y detalle en desktop y mobile, pero no había una ejecución documentada después de UI 03.

## Decisión

Ejecutar `node scripts/verify-web-integration.mjs --performance performance-baseline` sobre el build local, registrar las métricas sin modificar todavía la experiencia visual ni inventar objetivos comerciales, y usar los resultados para priorizar optimización posterior.

## Evidencia

| Dispositivo | Vista | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | portada | 0.69 | 1.00 | 1.00 | 0.92 | 8.20 s | 0.002 |
| Mobile | detalle | 0.67 | 1.00 | 1.00 | 0.92 | 8.27 s | 0.000 |
| Desktop | portada | 0.94 | 1.00 | 1.00 | 0.92 | 1.58 s | 0.001 |
| Desktop | detalle | 0.93 | 1.00 | 1.00 | 0.92 | 1.28 s | 0.121 |

## Consecuencias y límites

La accesibilidad automatizada queda confirmada también por Lighthouse, pero el rendimiento móvil es una brecha prioritaria y el CLS de detalle desktop merece investigación. Los valores son una corrida local con datos demo y no representan usuarios reales, red de producción, cachés, dispositivos físicos ni SLO final. Faltan perfiles de red/carga, optimización de imágenes/recursos críticos, medición repetida y EXPLAIN ANALYZE antes de cerrar la fase 18.
