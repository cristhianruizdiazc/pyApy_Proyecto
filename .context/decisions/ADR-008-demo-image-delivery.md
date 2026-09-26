# ADR-008: entrega responsiva de imagenes demo

Fecha: 2026-09-24. Estado: adoptado para la optimizacion parcial de Fase 18.

## Contexto

La medicion Lighthouse local mostro que los JPEG demo eran el mayor costo movil y que el carrusel descargaba imagenes no visibles. No existe aun un CDN ni transformacion de uploads autorizada.

## Decision

Versionar WebP locales de 640 y 1280 px junto a los JPEG demo; seleccionar con `picture` y conservar JPEG como fallback. Aplicar la seleccion solo a rutas `/demo/*` conocidas. Montar una sola imagen activa del hero.

## Consecuencias

La portada y las tarjetas demo bajan transferencia y LCP sin modificar contratos ni el tratamiento de multimedia subida por propietarios. Hay activos derivados adicionales y un script reproducible que usa `sharp`, ya dependencia directa de la API. Uploads, CDN, cache de produccion y reglas de variantes requieren una decision posterior.
