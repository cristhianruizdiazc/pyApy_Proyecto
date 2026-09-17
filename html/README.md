# Vista HTML de pyApy

Entrada: [index.html](../index.html). Navegacion completa: [indice.html](indice.html).

40 documentos HTML con CSS compartido y recursos locales. No necesitan Docker, Node.js, servidor web, React ni base de datos para abrirse. No contienen scripts de aplicacion ni peticiones a la API. Se preserva la aplicacion original en apps/.

## Archivos

- ../index.html: portada y catalogo inicial.
- indice.html: enlaces a todas las pantallas.
- explorar.html y las seis fichas de propiedad: catalogo, filtros y detalle.
- reserva-*.html: ejemplos de cotizacion, sin confirmacion real.
- cuenta.html, favoritos.html, notificaciones.html, perfil.html: cuenta ilustrativa.
- propietario.html y pantallas enlazadas: propiedades, editor, calendario, ocupaciones, estadisticas y planes.
- administracion.html y pantallas enlazadas: usuarios, moderacion, resenas, planes, suscripciones, sponsors, matching y auditoria.
- styles.css: composicion responsive compartida.
- filters.css: filtros declarativos mediante :has y controles nativos.
- assets/: fotografias y SVG de iconos Lucide con su licencia.

## Alcance

Enlaces, menu movil, detalles desplegables, campos de formulario, favoritos de la pantalla y filtros de catalogo funcionan sin JavaScript. Los cambios de campos no tienen persistencia. Los filtros combinan ciudad, tipo, capacidad y presupuesto; una combinacion sin coincidencias muestra un estado vacio con acceso para restablecer los filtros.

La fecha del buscador es ilustrativa: no comprueba disponibilidad. Cada cotizacion es un ejemplo fijo de cuatro horas, no calcula cambios del formulario anterior. Guardado, pagos, autenticacion, moderacion y confirmacion de reservas se mantienen deshabilitados para no simular operaciones reales.

Las cuentas son ficticias y no usan las credenciales reales de desarrollo. Las metricas, fechas y actividades son datos ilustrativos, no un export de PostgreSQL. Los documentos incluyen noindex para evitar indexacion accidental de datos de demostracion en buscadores. El indice pedido es la navegacion interna entre pantallas.

Todas las imagenes, estilos e iconos se leen del disco. Solo el mapa regional OpenStreetMap, opcional y desplegable, necesita Internet; su atribucion esta incluida. Las fotos proceden de los assets de demostracion del proyecto, con origen registrado en scripts/fetch-demo-assets.mjs. No identifican establecimientos reales verificados.

## Verificacion

Ejecutado `node scripts/verify-static.mjs`: 40 pantallas recorridas en Chromium con la red desactivada, usando file://, a 1440, 390 y 320 px. Verificados 1754 enlaces/recursos locales, cobertura completa del indice, fotos, filtros, favoritos, menu movil, ausencia de scripts y ausencia de desborde horizontal del documento. Capturas en .local/screenshots/static.

Para trasladar la vista, mantener juntos el index.html de la raiz y la carpeta html completa. No copiar .env, .local ni node_modules. Para editar, modificar directamente HTML/CSS: no hace falta recompilar. Los filtros CSS requieren un navegador compatible con :has.
