# Fondo de mapa bloqueado en Render

## Causa comprobada

El navegador cargaba Leaflet y los seis marcadores del catálogo publicado, pero
las doce imágenes del fondo fallaban con `request.failure().errorText = "csp"`.
La consola identificaba la directiva `img-src 'self' data:` como causa del bloqueo
de `https://a.tile.openstreetmap.org`, `b` y `c`.

Render sirve la web desde Express, que usaba la configuración predeterminada de
Helmet. La configuración de Nginx ya permitía los subdominios de OpenStreetMap,
y Vite en desarrollo no enviaba esa misma política restrictiva. Por eso comprobar
únicamente los marcadores o la web local no detectaba el fondo vacío en Render.

Además, Helmet enviaba `Referrer-Policy: no-referrer`, que impedía identificar el
sitio ante OpenStreetMap. Su [política de uso de tiles](https://operations.osmfoundation.org/policies/tiles/)
requiere una referencia HTTP válida desde páginas web y recomienda el endpoint
canónico `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.

## Corrección

- Express permite imágenes HTTPS del host canónico de OpenStreetMap y de sus
  subdominios anteriores, conservando las demás directivas de Helmet. Se permite
  el formato anterior para los clientes que todavía tengan un bundle en caché.
- `Referrer-Policy: strict-origin-when-cross-origin` envía únicamente el origen
  del sitio a OpenStreetMap, sin las rutas ni las consultas de búsqueda.
- Leaflet utiliza el endpoint canónico y Nginx también permite ese host.
- No se desactiva CSP ni se permiten imágenes o scripts de cualquier dominio.

## Verificación local

`npm run check`: lint, 36 pruebas y compilación aprobados. La nueva prueba HTTP
comprueba la autorización de imágenes de OpenStreetMap, la política de referencia
y la conservación de las restricciones de scripts y objetos.

Se ejecutó la web compilada desde Express con `NODE_ENV=production` y una base
temporal aislada. Chromium abrió el mapa del catálogo y de La Escondida a 1440 y
390 píxeles. Con imágenes de tiles controladas para evitar depender del proveedor
externo, cargaron el fondo y los seis/un marcador(es), sin errores JavaScript ni
violaciones CSP. Las solicitudes de tiles incluían únicamente el origen en Referer.

La comprobación posterior al despliegue debe revisar el encabezado de la página
HTML, abrir el mapa y confirmar que las imágenes reales de OpenStreetMap cargan,
además de los marcadores. Evidencia local en `.local/render-map-before.json` y
`.local/local-map-verification.json`; no contiene credenciales.
