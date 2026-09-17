# API REST implementada

Base: `/api/v1`. Salud: `GET /api/health`. Configuracion en apps/api/src/config.mjs. Contratos exactos en packages/contracts/index.mjs y validadores junto a cada ruta; no hay OpenAPI generado todavia.

## Sesion y errores

Web: cookie HttpOnly, SameSite=Lax, Secure en produccion; operaciones mutantes autenticadas requieren X-CSRF-Token devuelto por session/login. Se rechazan origen ajeno y bearer malformado. Mobile: X-Client: mobile al autenticar, luego Authorization: Bearer token, sin cookies. Identidad y roles siempre del servidor.

Registro/login: name/email/password segun contrato; registro no acepta role. GET /auth/session, POST /auth/register, /auth/login, /auth/refresh y /auth/logout. Refresh rota la sesion; expiracion de siete dias. Sin recuperacion de contrasena ni verificacion de correo aun.

Errores JSON con code y message; validacion 422, sesion 401, permiso 403, recurso no accesible 404, conflicto 409 y limite 429. No devolver SQL, stack ni secretos. Request ID para correlacion de logs.

## Rutas

| Ambito | Rutas principales |
| --- | --- |
| Publico | GET /catalog, /properties, /properties/:id, /properties/:id/availability, /sponsors, /media/:id |
| Eventos | POST /events con tipos y referencias validados |
| Cliente | GET /favorites; PUT/DELETE /favorites/:id; POST /search-intents |
| Reservas | POST /reservations/quote y /reservations; GET /reservations; POST /reservations/:id/cancel |
| Llegada | GET /reservations/:id/arrival, solo reserva confirmada propia, propietario o admin |
| Resenas | POST /reviews con reservationId, rating y comment; exige estadia completada |
| Notificaciones | GET /notifications; POST /notifications/:id/read |
| Propietario | POST /owner-profile; GET /owner/properties y /owner/reservations; POST /owner/occupancies |
| Propiedades | POST /properties; PUT /properties/:id; POST /properties/:id/images; DELETE /properties/:id/images/:imageId |
| Gestion privada | GET/PUT /owner/properties/:id/private; PUT /owner/properties/:id/socials |
| Negocio propietario | GET /owner/metrics, /owner/subscription; POST /owner/subscription |
| Administrador | /admin/overview, users, properties, reviews, plans, subscriptions, sponsors, weights y audit |

Las operaciones de administrador tienen requireRole server-side; no se exponen PIN ni elevacion de rol por cliente. Despublicar se realiza con estado draft, no borrando historicos de reserva.

## Reserva

POST /reservations requiere Idempotency-Key UUID y cuerpo:

~~~json
{
  "propertyId": "UUID",
  "startsAt": "2030-01-01T09:00:00-03:00",
  "endsAt": "2030-01-01T13:00:00-03:00",
  "guests": 5
}
~~~

Ejemplo de forma, no una propiedad ni cotizacion reales. POST /owner/occupancies agrega kind owner/block y note. Nunca enviar totalAmount, actorRole o estado: el contrato los rechaza. Cotizar no bloquea inventario; confirmar revalida dentro de transaccion.

Respuesta: reservation y replayed; primera creacion 201, replay 200. Conflicto de disponibilidad BOOKING_CONFLICT; clave usada con otro contenido IDEMPOTENCY_CONFLICT. No reintentar con otra clave cuando se desconoce si la primera peticion llego.

## Busqueda y limites

Parametros city, guests, kind, budget, amenities separados por coma, startsAt/endsAt, sort y page. Capacidad/tipo son filtros; ciudad/presupuesto/servicios intervienen en exactos y alternativas. Devuelve items, alternatives, otherDates, total, page y searchLimited. Maximo 500 candidatos; paginas de 20. No interpreta otherDates como fechas alternativas ya verificadas.
