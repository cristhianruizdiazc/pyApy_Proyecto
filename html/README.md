# Vista HTML de pyApy

Entrada: [index.html](../index.html). Navegacion completa: [indice.html](indice.html).

40 documentos HTML con CSS compartido, un script local y recursos locales. No necesitan Docker, Node.js, servidor web, React ni base de datos para abrirse. No hacen peticiones a la API. Se preserva la aplicación original en apps/.

## Archivos

- ../index.html: portada y catalogo inicial.
- indice.html: enlaces a todas las pantallas.
- explorar.html y las seis fichas de propiedad: catalogo, filtros y detalle.
- reserva-*.html: ejemplos de cotizacion, sin confirmacion real.
- cuenta.html, favoritos.html, notificaciones.html, perfil.html: cuenta ilustrativa.
- propietario.html y pantallas enlazadas: propiedades, editor, calendario, ocupaciones, estadisticas y planes.
- administracion.html y pantallas enlazadas: usuarios, moderacion, resenas, planes, suscripciones, sponsors, matching y auditoria.
- styles.css: composicion responsive compartida.
- filters.css: presentación compartida del buscador y los estados vacíos.
- home.css: portada basada en image5.png, con logoElegido.png y fotografía sin textos incrustados.
- selection.js: filtros y transporte de fecha, horario y personas entre páginas mediante parámetros del enlace.
- assets/: fotografias y SVG de iconos Lucide con su licencia.

## Alcance

Enlaces, menú móvil, detalles desplegables, campos de formulario y favoritos de la pantalla usan controles nativos. Los filtros requieren el script local `selection.js` y combinan ciudad, tipo, capacidad y presupuesto; una combinación sin coincidencias muestra un estado vacío con acceso para restablecer los filtros. La selección se conserva en los enlaces hacia la ficha y el resumen; no se almacena en una base de datos.

La fecha del buscador es ilustrativa: no comprueba disponibilidad. Cada cotización conserva la cantidad exacta de personas y calcula un importe ilustrativo según la tarifa por hora y el horario elegido, incluyendo cruces de medianoche. Se puede editar la cantidad dentro de la capacidad del lugar. Guardado, pagos, autenticación, moderación y confirmación de reservas se mantienen deshabilitados para no simular operaciones reales.

Las cuentas son ficticias y no usan las credenciales reales de desarrollo. Las metricas, fechas y actividades son datos ilustrativos, no un export de PostgreSQL. Los documentos incluyen noindex para evitar indexacion accidental de datos de demostracion en buscadores. El indice pedido es la navegacion interna entre pantallas.

Todas las imagenes, estilos e iconos se leen del disco. Solo el mapa regional OpenStreetMap, opcional y desplegable, necesita Internet; su atribucion esta incluida. Las fotos proceden de los assets de demostracion del proyecto, con origen registrado en scripts/fetch-demo-assets.mjs. No identifican establecimientos reales verificados.

## Verificacion

Ejecutado `node scripts/verify-static.mjs`: 40 pantallas recorridas en Chromium con la red desactivada, usando file://, a 1440, 390 y 320 px. Verificados 1773 enlaces/recursos locales, cobertura completa del índice, fotos, filtros, favoritos, menú móvil y ausencia de desborde horizontal. Incluye el recorrido búsqueda → ficha → reserva → ficha, edición exacta de personas, límites de capacidad y actualización del importe. Capturas en .local/screenshots/static.

Para trasladar la vista, mantener juntos el index.html de la raíz y la carpeta html completa. No copiar .env, .local ni node_modules. Para editar, modificar directamente HTML/CSS/JS: no hace falta recompilar. Usar un navegador moderno con JavaScript habilitado para los filtros y la conservación de la selección.
