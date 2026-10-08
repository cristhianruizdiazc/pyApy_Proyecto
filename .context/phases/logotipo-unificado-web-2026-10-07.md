# Logotipo unificado en toda la web — 2026-10-07

Solicitud: extender `logoElegido.png` a las otras pantallas de pyApy y publicar los cambios en GitHub.

## Cambios

- Se reemplazaron las 78 marcas de texto con flecha de las cabeceras y pies de las 39 pantallas de `html/`, más la marca del pie de `index.html`.
- Las imágenes usan el recurso existente `html/assets/logoElegido.png`, con texto alternativo `pyApy`, enlace de regreso al inicio y tamaño de 65 × 64 px sin recorte ni deformación. La portada conserva su logo elegido.
- `html/styles.css` define el tamaño común. Se conserva la navegación de cada página.
- Las 40 páginas HTML y la aplicación React usan el logo elegido como icono de pestaña. React ya tenía este logo en su cabecera común, pie y formulario de acceso; las pantallas de detalle, cuenta y gestión lo heredan.
- Las dos copias del logo, para HTML y React, tienen el mismo SHA-256. No se modifica la imagen original.

## Verificación

- `node scripts/verify-static.mjs`: 40 páginas locales a 1440, 390 y 320 px sin conexión, sin imágenes rotas ni desbordamiento. 1852 enlaces y recursos locales verificados; navegación, filtros y selección de personas aprobados.
- `npm run build`: compilación React aprobada.
- Revisión visual de capturas en `.local/screenshots/static/` y comprobación de que no quedan marcas HTML de texto con flecha ni el icono de casa como favicon.

Se incluyen únicamente los cambios de identidad web de esta entrega; las modificaciones previas del usuario en mobile, package-lock y documentación de otras fases permanecen fuera del commit.
