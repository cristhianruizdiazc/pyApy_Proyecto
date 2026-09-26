# Fase 18: rendimiento y UX

Fecha: 2026-09-24. Alcance: primera optimizacion medida de la web conectada.

## Objetivo y analisis inicial

La linea base Lighthouse posterior a UI 03 tenia LCP movil de 8.20 s en portada y 8.27 s en ficha. La transferencia era 2593 KiB y 2113 KiB respectivamente. Lighthouse atribuia cerca de 2 MiB de ahorro potencial a fotos demo JPEG sobredimensionadas; la portada solicitaba las tres imagenes del carrusel aun cuando solo una era visible.

## Cambios realizados

- Se generaron variantes locales WebP de 640 y 1280 px para las seis fotos demo. Los JPEG originales siguen como fallback para navegadores sin WebP.
- `Photo` usa esas variantes solo para URLs demo conocidas; uploads y URLs de API conservan exactamente su flujo previo.
- La portada monta y prioriza solo la imagen activa del carrusel. Las siguientes se descargan cuando el usuario las solicita o cuando avanza el carrusel.
- Se agrego `robots.txt` valido. No implica indexacion ni despliegue publico.
- El runner de Lighthouse admite `PERFORMANCE_DEVICES=mobile`, `desktop` o ambos para evitar que un entorno con limite de ejecucion interrumpa una corrida completa.
- `scripts/optimize-demo-images.mjs` deja documentada y repetible la generacion con la dependencia `sharp` ya usada por la API. Las variantes generadas se versionan junto a los originales.

## Resultados locales

Las pruebas se hicieron sobre build Vite y API aislados, con los perfiles Lighthouse del runner. Son mediciones locales, no SLO de produccion.

| Vista | Perfil | Antes | Despues |
| --- | --- | --- | --- |
| Portada | Mobile | rendimiento 0.69; LCP 8.20 s; 2593 KiB | 0.95; LCP 2.64 s; 442 KiB |
| Ficha | Mobile | rendimiento 0.67; LCP 8.27 s; 2113 KiB | 0.90; LCP 3.24 s; 533 KiB |
| Portada | Desktop | rendimiento 0.94; LCP 1.58 s | 0.99; LCP 0.81 s |
| Ficha | Desktop | rendimiento 0.93; LCP 1.28 s; CLS 0.121 | 0.95; LCP 1.00 s; CLS 0.121 |

La ficha desktop conserva CLS 0.121. Lighthouse identifica principalmente el movimiento del footer durante la carga de la pagina; resolverlo exige disenar un skeleton que reserve el alto de contenido remoto sin esconder informacion ni asumir el alto de cada propiedad. No se maquillo la metrica con una reserva fija.

## Verificacion

- `npm run lint`: aprobado.
- `npm test`: 23 aprobadas.
- `npm run build`: aprobado.
- Lighthouse mobile y desktop: accesibilidad y best practices 1.00; SEO 1.00 tras agregar `robots.txt`.
- Informes JSON locales ignorados: `lighthouse-performance-image-optimization-final-mobile-*` y `lighthouse-performance-image-optimization-desktop-desktop-*` en `.local/audits`.

## Limites y siguiente trabajo

Esto reduce el peso de activos demo, no crea un servicio de transformacion para fotos de propietarios. Siguen pendientes perfiles de red real, carga, analisis SQL/indices a escala, code splitting adicional y cache HTTP en contenedores. Tampoco valida dispositivos nativos, Docker, staging o produccion.

## Cierre de Fase 18

Se completo el alcance de rendimiento y UX local del plan maestro. La ficha ahora reserva espacio durante la carga de ruta y datos: Lighthouse desktop bajo CLS de 0.121 a 0.003. El mapa de ficha es una carga explicita bajo demanda, por lo que su chunk de 154 KiB no forma parte de la carga inicial; la nueva regresion E2E confirma el comportamiento en desktop y mobile.

La medicion final fue: portada mobile 0.95, LCP 2.50 s, 443 KiB; ficha mobile 0.90, LCP 3.33 s, 395 KiB; portada desktop 0.93, LCP 0.79 s; ficha desktop 0.97, LCP 1.16 s, CLS 0.003 y 780 KiB. Accesibilidad, best practices y SEO fueron 1.00 en las cuatro corridas.

La revision `EXPLAIN (ANALYZE, BUFFERS)` sobre la base demo devolvio escaneo secuencial para listado y disponibilidad, apropiado para seis filas y 0.062/0.024 ms. Las migraciones ya contienen los indices parciales/publicos, de propietario, imagenes, reservas y GiST de exclusion. No se agregaron indices ni se altero el esquema sin una carga representativa. El cierre no afirma SLO de produccion, consumo de memoria de sesiones prolongadas, CDN, cache de contenedores ni capacidad bajo volumen real; esas son validaciones de preproduccion/auditoria, no defectos ocultos de esta fase local.
