# API REST implementada

Actualizado: 2026-09-26. Esta es la referencia de contratos vigente para web y mobile; no hay especificacion OpenAPI generada todavia.

Base: `/api/v1`. Salud: `GET /api/health`. Configuracion en apps/api/src/config.mjs. Contratos exactos en packages/contracts/index.mjs y validadores junto a cada ruta; no hay OpenAPI generado todavia.

## Sesion y errores

Web: cookie HttpOnly, SameSite=Lax, Secure en produccion; operaciones mutantes autenticadas requieren X-CSRF-Token devuelto por session/login. Se rechazan origen ajeno y bearer malformado. Mobile: X-Client: mobile al autenticar, luego Authorization: Bearer token, sin cookies. Identidad y roles siempre del servidor.

Registro/login: name/email/password segun contrato; registro no acepta role. GET /auth/session, POST /auth/register, /auth/login, /auth/refresh y /auth/logout. Refresh rota la sesion; expiracion de siete dias. Sin recuperacion de contrasena ni verificacion de correo aun.

Errores JSON con code y message; validacion 422, sesion 401, permiso 403, recurso no accesible 404, conflicto 409 y limite 429. No devolver SQL, stack ni secretos. Request ID para correlacion de logs.

## Rutas

| Ambito              | Rutas principales                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Publico             | GET /catalog, /properties, /properties/:id, /properties/:id/availability, /sponsors, /media/:id            |
| Eventos             | POST /events con tipos y referencias validados                                                             |
| Cliente             | GET /favorites; PUT/DELETE /favorites/:id; POST /search-intents                                            |
| Reservas            | POST /reservations/quote y /reservations; GET /reservations; POST /reservations/:id/cancel                 |
| Llegada             | GET /reservations/:id/arrival, solo reserva confirmada propia, propietario o admin                         |
| Resenas             | POST /reviews con reservationId, rating y comment; exige estadia completada                                |
| Notificaciones      | GET /notifications; POST /notifications/:id/read                                                           |
| Propietario         | POST /owner-profile; GET /owner/properties y /owner/reservations; POST /owner/occupancies                  |
| Propiedades         | POST /properties; PUT /properties/:id; POST /properties/:id/images; DELETE /properties/:id/images/:imageId |
| Gestion privada     | GET/PUT /owner/properties/:id/private; PUT /owner/properties/:id/socials                                   |
| Negocio propietario | GET /owner/metrics, /owner/subscription; POST /owner/subscription                                          |
| Administrador       | /admin/overview, users, properties, reviews, plans, subscriptions, sponsors, weights y audit               |

Las operaciones de administrador tienen requireRole server-side; no se exponen PIN ni elevacion de rol por cliente. Despublicar se realiza con estado draft, no borrando historicos de reserva.

## Reserva

POST /reservations requiere Idempotency-Key UUID y cuerpo:

```json
{
  "propertyId": "UUID",
  "startsAt": "2030-01-01T09:00:00-03:00",
  "endsAt": "2030-01-01T13:00:00-03:00",
  "guests": 5
}
```

Ejemplo de forma, no una propiedad ni cotizacion reales. POST /owner/occupancies agrega kind owner/block y note. Nunca enviar totalAmount, actorRole o estado: el contrato los rechaza. Cotizar no bloquea inventario; confirmar revalida dentro de transaccion.

Respuesta: reservation y replayed; primera creacion 201, replay 200. Conflicto de disponibilidad BOOKING_CONFLICT; clave usada con otro contenido IDEMPOTENCY_CONFLICT. No reintentar con otra clave cuando se desconoce si la primera peticion llego.

## Busqueda y limites

Actualización 2026-10-25: parámetros `city`, `guests`, `kind`, `budget` total del período, `amenities` opcionales separados por coma, `requiredAmenities` indispensables separados por coma, `strictCity`/`strictBudget` booleanos o cadenas true/false (por defecto false), `startsAt`/`endsAt`, `sort` y `page`. Un intervalo debe ser futuro, positivo y de hasta 720 horas.

Capacidad, tipo, estado publicado, propietario activo y servicios indispensables se filtran siempre. `items` contiene exactas, `total` cuenta todas las exactas elegibles y `page` pagina de 20 en 20 en DB. `alternatives` contiene etapas `location`, `budget`, `services`; `otherDates` contiene exclusivamente etapa `schedule` con intervalos comprobados. Ambos arrays comparten el máximo de alternativas. Ninguna opción relaja dos criterios; no hay duplicados entre grupos. `searchLimited=false`: ya no hay preselección por 500 ni por antigüedad. El orden solicitado se aplica dentro de etapa y, para ubicación, dentro de banda de radio; UUID desempata. Las exactas siempre tienen prioridad.

Cada propiedad conserva sus campos previos y añade `stage`, `differences` (nombres de criterios), `distanceKm`, `distanceReference` (`type=city_reference`, `city`, `method=geographic`, `approximate=true`), `locationRadiusKm`, `estimatedHours`, `estimatedTotal`, `estimateBasis`, `budgetExcess`, `budgetExcessPercent`, `missingOptionalAmenities`, `proposedInterval` y `availabilityStatus=verified|unchecked`. Los campos no aplicables son null, cero o arrays vacíos. El total usa horas redondeadas hacia arriba; sin fecha usa mínimo de la propiedad, `estimateBasis=property_minimum_hours`, `availabilityChecked=false`, `available=false`: no confirma disponibilidad.

`proposedInterval={startsAt,endsAt}` sólo aparece en `schedule`, en ISO UTC, y el consumidor debe trasladarlo explícitamente al detalle y reserva cuando el usuario elige esa alternativa. `availabilityChecked=true` significa comprobación en el snapshot de búsqueda, sin retención de inventario. Las reservas/bloqueos y reglas pueden cambiar después; cotización y confirmación revalidan. No se etiqueta como ocupado un fallo de apertura o duración.

`limits` comunica configuración y `alternativesTruncated`, `scheduleExplorationBounded`, `combinationsIncluded=false`. La exploración es posterior, en una cuadrícula de pasos, con misma duración; nunca se afirma haber agotado todas las fechas posibles. Timeout/fallo de DB responde como error técnico, sin convertirlo en arrays vacíos. Configuración `SEARCH_CONFIG`, rangos y semántica completa en [ADR-012](decisions/ADR-012-progressive-search.md).

`bookingSchema` admite opcionalmente `searchStage=exact|location|budget|services|schedule` en cotización/reserva; no afecta tarifa ni disponibilidad. `POST /events` admite `event=search_select`, `propertyId` publicado y `searchStage` obligatorio para esa selección. Los eventos de búsqueda agregados son generados en servidor. Campos aditivos: consumidores anteriores conservan la forma de respuesta; React Native sigue congelado por ADR-011 y requiere adaptar la presentación de alternativas antes de reactivar su producto.

`POST /search-intents` conserva también `requiredAmenities`, `strictCity` y `strictBudget` en el interés guardado (migración 005), además de los valores originales ya persistidos. No utiliza ese registro como prueba de disponibilidad.
