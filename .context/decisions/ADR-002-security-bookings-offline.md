# ADR-002: sesiones, reservas y sincronizacion

Estado: adoptado. Fecha: 2026-09-16.

## Contexto y opciones

Web y mobile necesitan la misma autorizacion. JWT sin revocacion inmediata complica bajas y cambios de rol; se eligen sesiones opacas aleatorias, guardando solamente el hash del token en PostgreSQL. Web usa cookie HttpOnly y control CSRF/origen; mobile guarda el token en SecureStore. Passwords usan scrypt con sal individual y limites de entrada.

## Reservas

Una tabla de ocupaciones unifica reservas pyApy, particulares y bloqueos. Una exclusion GiST sobre property_id y tstzrange [inicio, fin) para estados confirmados impide solapamientos aunque dos solicitudes lleguen simultaneamente. Intervalos contiguos si son validos. Se usa btree_gist.

Cada escritura comprueba propietario o cliente autenticado. Precios, origen, localizador y estado se calculan en backend. Claves de idempotencia por actor rechazan reutilizacion con diferente contenido. Propiedad y operacion se bloquean dentro de la transaccion; cancelacion, auditoria y notificacion se confirman juntas. La entrega de notificaciones ocurre posteriormente con reintentos.

No se mantienen tablas separadas ownerBookings/blocks porque impedirian una unica exclusion sin mecanismos adicionales. La columna kind representa esas entidades sin duplicar datos ni perder sus reglas.

## Offline

Mobile almacena catalogo y operaciones por usuario. Las solicitudes offline tienen estados pending/syncing/synced/failed/conflict; nunca muestran confirmacion definitiva antes de respuesta del servidor. Cada reintento conserva su clave de idempotencia. Un conflicto informa al cliente y permite nuevas fechas. Cierre de sesion elimina cache privada y cola local de ese usuario.

## Consecuencias y referencias

Sesiones revocables requieren consultar PostgreSQL. GiST agrega un indice, pero proporciona una garantia verificable en la base. Los caches no son autoridad para precio o disponibilidad.

Referencia: https://www.postgresql.org/docs/16/rangetypes.html (consultada 2026-09-16). Probar exclusion con peticiones simultaneas y diferentes tipos de ocupacion, no solamente mediante mocks.
