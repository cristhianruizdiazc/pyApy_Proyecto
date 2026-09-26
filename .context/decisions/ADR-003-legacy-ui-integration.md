# ADR-003 — Integración incremental de la primera UI

Fecha: 2026-09-19. Estado: adoptado para la primera fase autorizada por el usuario.

## Contexto

Después de la implementación inicial apareció `remix-remix-pyapy---reservas-paraguay/`, una primera versión con React/TypeScript/Vite/Tailwind y Firebase/Firestore. La aplicación vigente usa React/JSX/Vite/CSS, React Router, TanStack Query, Node, PostgreSQL y Leaflet/OSM. Existen además páginas HTML estáticas independientes.

El usuario pidió conservar el stack del prompt, integrar ambas experiencias, priorizar la web conectada y dar una identidad paraguaya artesanal sutil.

## Opciones

1. Sustituir la app vigente por la antigua: arrastra diferencias de auth, persistencia, precios y autoridad de negocio.
2. Ejecutar ambas aplicaciones funcionales lado a lado: duplica experiencia, sesiones y contratos.
3. Adaptar incrementalmente ideas/componentes de presentación sobre la app/API actuales.

## Decisión

Elegir la tercera opción. Conservar `apps/web` como destino conectado. La primera entrega integra identidad, portada, buscador y tarjetas; las siguientes abordan detalle/reserva y luego gestión.

Sin arrastrar Firebase, Google Maps, Tailwind ni los servicios/tipos del legado. Las necesidades visuales se resuelven mediante componentes JSX, CSS propio, SVG locales y `/api/v1`. PostgreSQL/Node mantienen decisiones de negocio, y React Native/PHP/Docker conservan su papel.

## Consecuencias

- Permite reutilizar experiencia sin reescritura global ni migración de datos.
- Exige conciliar cada capacidad con el contrato actual: tarifa horaria, estados y permisos reales.
- La UI antigua permanece como referencia; no queda certificada por las pruebas del proyecto principal.
- HTML estático sigue siendo una demostración separada; la nueva identidad se ve en la URL de Vite.
- `marketplace.css` concentra la capa visual de la entrega. Los componentes compartidos requieren regresiones de las demás pantallas.
- Recursos artesanales originales, con procedencia y limitaciones registradas en `../design/ARTESANAL.md`.

Evidencia y archivos: [Integración UI 01](../phases/integration-ui-01.md).
