# ADR-004 — Aislamiento de cotización y recuperación de confirmación web

Fecha: 2026-09-19. Estado: adoptado en integración UI 02 autorizada.

## Contexto

`Detail.jsx` retenía estado al cambiar el parámetro de ruta. Editar inputs borraba la cotización visible, pero una respuesta pendiente podía restaurarla. El contrato vigente genera precio y reserva en backend; cotizar no garantiza inventario/precio posterior. El UUID de idempotencia permite recuperar un resultado de escritura cuya respuesta se perdió.

## Opciones

1. Limpiar estado con efectos al cambiar propiedad y confiar solo en deshabilitar botones: deja carreras entre edición/respuesta y doble clic antes del rerender.
2. Aislar componentes por identidad, cancelar/revisar lecturas y conservar operaciones de escritura ambiguas con UUID estable.
3. Crear otro backend/contrato de cotización vinculante y migrar el dominio: excede el alcance de integración visual y modifica decisiones estructurales.

## Decisión

Elegir la segunda opción:

- `DetailPage` por ID; `BookingPanel` por ID/usuario/selección URL.
- Revisión incremental más AbortController para consultas; cada edición invalida la cotización.
- Snapshot `{input, result, key}` de cotización; confirmación usa exclusivamente ese input y UUID.
- Guarda síncrona de envío mediante ref y formulario congelado durante escritura.
- Comprobar forma/identidad básica de la respuesta antes de mostrar éxito o eliminar el intento.
- Reintento manual de resultado ambiguo con mismo cuerpo/UUID, guardado por usuario/propiedad en sessionStorage de la pestaña.
- No abortar escrituras por navegación; puede haber commit ya realizado.

## Consecuencias

- Corrige cotizaciones cruzadas/obsoletas y reduce duplicados de transporte, respaldado por la idempotencia y exclusión PostgreSQL existentes.
- No impone nuevos precios, estados o permisos desde el frontend.
- El UUID pendiente sobrevive a recarga en la misma pestaña si sessionStorage está disponible. No cubre cierre/borrado/bloqueo del almacenamiento ni coordinación entre pestañas/dispositivos.
- Guarda identificadores, fechas y personas, nunca credenciales ni precio; requiere política de retención para lanzamiento.
- Un rechazo 4xx definitivo permite editar/recotizar; ante resultado anterior incierto se conserva el intento hasta respuesta concluyente. Conflictos de ocupación/idempotencia no se reintentan automáticamente.
- Un replay cancelado no se etiqueta como nueva confirmación. Importes finales siguen siendo los del backend.

Pruebas y limitaciones: [UI 02](../phases/integration-ui-02.md).
