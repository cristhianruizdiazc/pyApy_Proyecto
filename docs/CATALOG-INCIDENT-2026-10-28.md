# Catálogo público vacío — 28 de octubre de 2026

## Diagnóstico

La consulta sin filtros a `https://pyapy-proyecto.onrender.com/api/v1/properties`
respondía HTTP 200 con `items: []` y `total: 0`. El servidor entregaba la aplicación
y respondía a la búsqueda; no se trataba de tarjetas ocultas en el navegador.

La migración `003_public_demo_properties.sql` agregó Casa del Lago, Quinta Yvytu
y El Patio de Altos bajo `catalog-demo-owner@pyapy.invalid`. Esa cuenta se creó
inactiva deliberadamente para impedir su uso. El commit `3abb5cf` agregó al
buscador progresivo el filtro `JOIN users ... AND u.active`, excluyendo también
estos tres ejemplos. Este cambio explica su desaparición del catálogo sin
necesidad de eliminar registros. No se inspeccionó directamente la base alojada
ni sus registros de auditoría; no se atribuye el incidente a pérdida de datos.

## Corrección

- La migración `006_public_samples.sql` identifica únicamente los tres ejemplos
  originales de ese propietario con `is_public_sample=true` y agrega Quinta
  Tajy (Luque), Bungalow Arasá (Caacupé) y Refugio Ysyry (Pirayú), con tarifas,
  disponibilidad, servicios y fotografías ilustrativas ya incluidas en el repo.
- El buscador permite estos ejemplos públicos aun con su propietario inactivo.
  Las propiedades normales de propietarios inactivos continúan excluidas.
- La API publica `isPublicSample=true` e `isDemo=true`; las tarjetas muestran
  «Demo» y la ficha explica que no admite reservas reales. La API rechaza tanto
  cotizaciones como reservas de ejemplos, incluso si se activa su propietario.
- Los fixtures locales `is_demo=true` mantienen su filtro de entorno. No se
  cambia ninguna migración ya aplicada ni se habilita la cuenta ficticia.

## Despliegue y comprobación

Aplicar las migraciones con el procedimiento habitual del servicio y publicar
el backend y la web del mismo commit. `npm run db:migrate` omite migraciones ya
aplicadas y comprueba sus checksums. La migración nueva es transaccional.

Comprobar `/api/health`, `/api/v1/properties` sin filtros y las seis fichas.
Cada ejemplo debe incluir `isPublicSample: true`, `isDemo: true`, una imagen,
servicios y su precio. Sus fotografías deben responder HTTP 200.

Las pruebas en `tests/public-samples.test.mjs` verifican la visibilidad pública
de los seis ejemplos y el rechazo de cotizaciones y reservas, con propietario
inactivo y activo. La suite existente comprueba que los propietarios normales
desactivados siguen excluidos.

Validación local: `npm run check` aprobado (lint, 34 pruebas y build web).
La migración se ejecutó dos veces en desarrollo: la segunda ejecución no
aplicó cambios. Se revisaron las tres fichas nuevas con Chromium a 1440 y
390 píxeles, sin errores JavaScript ni desbordamiento horizontal, con imágenes
HTTP 200 y sin formulario de reserva. La prueba de base aislada valida los seis
ejemplos, incluidos los tres originales.
