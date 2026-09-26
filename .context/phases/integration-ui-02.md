# Integración UI 02 — detalle, galería y reserva

Fecha: 2026-09-19. Estado: implementada y verificada localmente.

## Autorización y continuidad

El usuario autorizó expresamente la fase de detalle y reserva después de cerrar [UI 01](integration-ui-01.md), y reiteró continuar y documentar todo en `.context`. Se revisaron estado, decisiones, riesgos, arquitectura, código real del detalle, cliente HTTP, API de reservas y la composición fotográfica `PropertyShowcase.tsx` de la primera versión.

Se mantiene la dirección artesanal sutil y la base conectada `apps/web`. Esta fase no modifica el modelo comercial, las tecnologías del prompt ni el esquema PostgreSQL.

## Resumen de implementación

### Galería y detalle

- `PropertyGallery.jsx`: fotografía principal y hasta dos vistas secundarias, con distribución adaptada al número de imágenes. Todas las fotos siguen accesibles en un diálogo.
- Visor con miniaturas, contador, anterior/siguiente, flechas de teclado, Escape y retorno de foco. Reutiliza `Modal` y `Photo` accesibles de la fase anterior.
- Fallback tanto para imágenes fallidas como para propiedades sin fotos, sin inventar imágenes de la propiedad.
- `detail.css`: presentación coherente con marfil/verde/terracota, bordes asimétricos, secciones ordenadas y panel de reserva. Se carga con la ruta diferida del detalle.
- En móvil, el formulario aparece antes de la información extensa. En escritorio acompaña al contenido en una columna lateral. Accesos a espacio, ubicación y reserva desde la ficha.
- Reglas adicionales desplegables; capacidad, duración, política, servicios, descripción, reseñas, redes y mapa aproximado conservados.
- Las fechas ocupadas distinguen carga, error con reintento y ausencia de intervalos. Nunca se presenta un error como disponibilidad libre.

### Selección y autenticación

- `booking-selection.js` transforma fechas entre URL/inputs/intervalos usando `America/Asuncion` y el contrato `localInterval` existente.
- Las tarjetas del catálogo y los enlaces de marcadores conservan `startsAt`, `endsAt` y `guests` al abrir una ficha.
- Una consulta de visitante lleva a ingreso/registro y vuelve a la ficha con la selección codificada en la URL. No se guarda identidad ni rol en esos parámetros.
- Fechas de entrada/salida, horas y personas son campos controlados. La salida opcional permite varios días; el intervalo nocturno usa la regla compartida existente.

### Cotización y confirmación

- Cada ficha se remonta por ID; el panel de reserva se identifica además por usuario y parámetros de selección. Cotización, confirmación y galería no se trasladan a otra propiedad.
- Cada edición invalida inmediatamente la cotización, aborta la consulta y avanza una revisión interna. Una respuesta tardía solo puede aplicarse si coincide con la revisión activa y el panel sigue montado.
- Cotización y confirmación se representan con datos del servidor: entrada, salida, personas, horas, importe y política. Una cotización incompleta no habilita confirmar.
- Guarda síncrona con `ref` para doble clic. Mientras se confirma, el formulario queda deshabilitado.
- Se envían exclusivamente `propertyId`, intervalo y personas, con UUID de idempotencia. Precio/estado/actor continúan definidos por backend.
- Ante conflicto real 409 se descarta la cotización, se refresca disponibilidad y se permite elegir otro intervalo. Los códigos de conflicto de ocupación e idempotencia tienen mensajes distintos.
- Ante red, timeout, 5xx o respuesta de éxito ilegible/incoherente, se conserva el mismo cuerpo y UUID. La interfaz muestra un resultado pendiente de comprobar, no una reserva confirmada.
- El intento pendiente se conserva en `sessionStorage` por usuario/propiedad antes de enviar. Sobrevive a recarga de la misma pestaña cuando ese almacenamiento está disponible. No contiene tokens, cookies, contactos, importe ni coordenadas privadas.
- Las escrituras no se abortan al abandonar la ficha: abortar el navegador no garantiza que PostgreSQL no haya confirmado. El resultado real actualiza cachés; la UI desmontada no recibe estados de otra propiedad.
- Confirmación final muestra importe y localizador devueltos por API. Un replay cuyo estado es cancelado se presenta como cancelado.

Decisión técnica: [ADR-004](../decisions/ADR-004-booking-ui-state.md).

## Archivos de esta fase

### Creados

- `apps/web/src/BookingPanel.jsx`
- `apps/web/src/PropertyGallery.jsx`
- `apps/web/src/booking-selection.js`
- `apps/web/src/detail.css`
- `tests/e2e/detail-reservation.spec.js`
- `scripts/verify-web-integration.mjs`

### Modificados

- `apps/web/src/Detail.jsx`: composición, aislamiento por propiedad y componentes separados.
- `apps/web/src/ui.jsx`: enlaces de tarjetas que trasladan selección desde catálogo.
- `apps/web/src/Map.jsx`: enlace de marcador que conserva selección.
- `tests/e2e/marketplace.spec.js`: texto actualizado de confirmación.

Documentación creada: este informe y ADR-004. Actualizada: `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `RISKS.md`, `TESTING.md`, `BACKLOG.md`, `CHANGELOG.md`, `README.md`, `SECURITY.md`, `OPERATIONS.md`, `design/ARTESANAL.md` y `decisions/README.md` dentro de `.context`.

No se eliminaron archivos ni se creó commit. Se conservaron los cambios de UI 01 y las carpetas preexistentes no versionadas.

## Arquitectura, base y seguridad

Frontend React/JSX, CSS y herramientas existentes; sin dependencias nuevas. React Native, Node, PHP, PostgreSQL, Docker y OSM mantienen sus responsabilidades. Sin cambios de endpoint, schema, migraciones SQL, permisos o reglas de concurrencia. El backend sigue siendo la autoridad; los guards de UI evitan estados visuales incorrectos y solicitudes repetidas, no sustituyen autorización/exclusión SQL.

La persistencia del intento web no es una cola offline, no sincroniza en segundo plano y no confirma sin servidor. Depende de `sessionStorage`: al cerrar la pestaña o borrar/bloquear almacenamiento no se garantiza recuperación del UUID. El registro es accesible al JavaScript del mismo origen y conserva fechas de viaje; requiere contemplarse en la política de privacidad/retención de lanzamiento. Se mantiene pendiente si se cierra sesión para permitir reconciliar al reingresar con el mismo usuario, sin mostrarse a otra cuenta.

La cotización no bloquea inventario ni tarifa. Se informa revalidación al confirmar y se muestra el importe final de API. Una cotización vinculante con vencimiento/precio reservado requeriría diseñar otro contrato; no se simula desde el navegador.

## Pruebas y evidencias

### Ejecuciones

1. `npm run check`: PASS, lint, 23 pruebas de contratos/dominio/API sobre PostgreSQL temporal y build.
2. Primer `npm run test:e2e` sobre instancia de desarrollo: **25 aprobadas, 2 fallidas, 1 omitida**. Las dos fallaron en autenticación; se comprobó HTTP 429 `RATE_LIMIT` (30 intentos/15 minutos). No se ocultaron ni se relajó la protección.
3. Se reutilizó autenticación en memoria por worker en los fixtures nuevos, manteniendo contexto de navegador y propiedad independientes por prueba.
4. `node scripts/verify-web-integration.mjs`: **27 aprobadas, 1 omitida deliberadamente**, suite completa. Arranca API/Vite propios con puertos libres y los detiene al terminar. Mantiene la misma base local de pruebas/demo, no una DB separada. No modifica `.local/dev.json` ni detiene la instancia del desarrollador.
5. Después de añadir guards de respuesta ilegible, `npm run lint` y `npm run build`: PASS. `node scripts/verify-web-integration.mjs tests/e2e/detail-reservation.spec.js --grep "respuesta"`: **6 aprobadas**, cubriendo edición tardía, cambio de propiedad y reintentos con respuesta rota en ambos tamaños.
6. `git diff --check`: sin errores de whitespace; avisos de normalización LF/CRLF.

### Regresiones nuevas

- Búsqueda → ficha → registro → ficha conserva fecha/hora/personas.
- Consulta retrasada y edición: el resultado anterior no restaura una cotización descartada; una respuesta vacía no habilita confirmación.
- Cambio a otra propiedad, incluso con consulta en curso: no aparece precio, confirmación o fecha de la anterior.
- Bloqueo real después de cotizar: conflicto 409 y nueva consulta para otro horario.
- Doble clic, respuesta perdida después del commit, recarga y siguiente respuesta JSON ilegible: todos los reintentos conservan cuerpo/UUID y se verifica **una sola reserva persistida**.
- Cambio real de tarifa entre cotización y confirmación: importe final devuelto por backend; campos bloqueados durante escritura.
- Galería/teclado/Escape/foco, foto fallida, error de fechas con recuperación y ausencia de desbordamiento a 320/390/768/1024/1440 px.

Se conservan las regresiones de UI 01, cliente/reserva/cancelación, propietario y administrador. Las E2E crean cuentas/eventos auditables; los fixtures nuevos cancelan ocupaciones y despublican las propiedades que crean. No limpian la base de desarrollo.

Capturas de ficha desktop/mobile inspeccionadas en `.local/screenshots/detail-*.png`. Las capturas de cinco anchos de la galería se generaron en `test-results/**/detalle-*.png`; Playwright reemplaza `test-results` en ejecuciones posteriores, incluida la última prueba focalizada.

### Build final

- Entrada JS: 254,33 kB / gzip 79,89 kB.
- Chunk diferido Detail: 17,20 kB / gzip 5,84 kB.
- CSS diferido Detail: 6,66 kB / gzip 1,80 kB.
- CSS principal: 34,95 kB / gzip 8,07 kB.
- Chunk compartido renombrado por Vite a `booking-selection-*`: 205,74 kB / gzip 63,77 kB, incluye dependencias de contratos ya existentes; no es todo código de selección nuevo.

Son tamaños de compilación, no una medición Lighthouse. Se comprobó que los puertos de las instancias temporales quedaron cerrados y que la instancia original sigue respondiendo en 5173/4100. Al cierre, una solicitud vacía a login volvió a responder 422 `VALIDATION`, no 429: la ventana temporal de rate limiting de desarrollo ya había expirado, sin reiniciar su proceso ni cambiar límites.

## Pendientes y próxima fase

- Integración UI 03: cuenta, favoritos, reservas propias y paneles, con jerarquía clara y capacidades actuales.
- Auditoría de lectores de pantalla/zoom/contraste integral, navegadores adicionales, móviles nativos y Lighthouse.
- Recuperación avanzada ante sesión expirada, múltiples pestañas/dispositivos, almacenamiento bloqueado y reconciliación fuera de la pestaña actual.
- Fotografías finales y validación cultural/artesanal pendientes de la fase anterior.
- Las brechas de operación, Docker, CI remoto, paridad nativa y producción siguen registradas.

Se cierra únicamente la fase autorizada de detalle y reserva.
