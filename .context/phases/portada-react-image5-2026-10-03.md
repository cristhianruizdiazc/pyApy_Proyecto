# Portada React basada en image5 — 2026-10-03

El usuario indicó que la portada visible en `http://localhost:5173/` conservaba el diseño anterior. La entrega previa había aplicado la composición completa al `index.html` estático de la raíz, mientras que la aplicación React solo incorporaba el logo y los cambios funcionales de personas. Esta entrega traslada el rediseño a la aplicación que sirve Vite, en `apps/web`.

## Diseño y funcionamiento

- `image5.png` es la referencia principal: cabecera compacta, fotografía panorámica, título con «más cerca» manuscrito, buscador superpuesto, cinco beneficios, cuatro tarjetas visibles y pie con ondas verdes y flor lineal.
- Se conserva `logoElegido.png` sin modificar y se omite por completo «Paraguay también se disfruta así».
- Se reutiliza la fotografía reconstruida en la [entrega anterior](modificaciones-pyapy-2026-10-03.md), copiándola a `apps/web/public/brand/escapada-atardecer.png`. No es una extracción idéntica de los píxeles de la referencia.
- Las tarjetas mantienen nombres, ciudades, capacidades, servicios, fotos y precios por hora del catálogo. Las valoraciones solo se muestran cuando existen datos reales. No se inventan reseñas ni tarifas por día.
- La búsqueda muestra ciudad, fecha, turno, personas y presupuesto. Las categorías, servicios, horas personalizadas y cantidad exacta permanecen disponibles en «Más filtros». El turno inicial corresponde a 24 horas; sin fecha no se envía un intervalo a la API. Los intervalos de URL conservan su duración original.
- Se mantienen favoritos, mapa, navegación a detalles, selección de personas y reservas. El carrusel usa tarjetas únicas y admite botones y teclado. La cabecera de las páginas de gestión conserva sus enlaces y distribución anteriores.
- Los estilos de la nueva composición se limitan a la portada, con adaptación para tablet y móvil.

## Verificación

- `npm run lint` y `npm run build`.
- Playwright: 15 pruebas aprobadas y 1 omitida en `marketplace-integration.spec.js` y `marketplace.spec.js`, escritorio y móvil, contra PostgreSQL y API locales. Se verifican cantidades exactas, historial de filtros, recuperación de errores, imágenes fallidas, movimiento reducido, favoritos, reserva/cancelación y paneles autorizados. Una prueba de identidad se ejecuta únicamente en escritorio por configuración de la suite.
- Capturas a 1037, 1440, 768, 390 y 320 px, sin desbordamiento horizontal ni errores de JavaScript: `.local/screenshots/reference/home-<ancho>.png`.
- La revisión a 1037 px confirma que el buscador comienza en x=109, y=258 y mide aproximadamente 819 × 61 px, siguiendo las proporciones de image5.

Vista local: `http://localhost:5173/`. Las capturas y los datos locales de pruebas no se incluyen en Git. Tampoco se incluyen los cambios previos del usuario en mobile, package-lock ni documentos de otras fases.
