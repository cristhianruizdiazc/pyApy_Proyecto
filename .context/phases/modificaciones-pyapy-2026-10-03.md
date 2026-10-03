# Modificaciones PYAPY — 2026-10-03

Solicitud: aplicar `.context/modificaciones PYAPY/modificaciones PYAPY.md`, analizar image1–image6 y ajustar la portada `index.html` a image5, usando el logo elegido y eliminando «Paraguay también se disfruta así».

## Cambios

- Portada HTML con navegación, fotografía panorámica al atardecer, título de la referencia, buscador superpuesto, beneficios, cuatro tarjetas visibles y pie con ondas verdes. Se mantienen las propiedades y tarifas reales del catálogo de demostración, sin inventar valoraciones o cambiar precios por hora a precios por día. Las otras tarjetas se pueden recorrer horizontalmente; el enlace al catálogo conserva acceso a todos los espacios.
- Logo original copiado sin modificaciones a `html/assets/logoElegido.png` y `apps/web/public/brand/logoElegido.png`.
- Opciones: cantidad de personas, en pareja, más de 3, 5, 10, 20 y 30. Los umbrales estrictos son 2, 4, 6, 11, 21 y 31; se filtra por la capacidad mínima necesaria.
- Las seis fichas y sus resúmenes HTML aceptan cantidades enteras editables, desde 1 hasta la capacidad de la propiedad. Fecha, horario y personas viajan en los enlaces, sin almacenamiento persistente. El resumen se recalcula según las horas iniciadas y permite regresar con la selección editada.
- `html/selection.js` funciona localmente con file://. Es necesario para resolver el transporte de valores entre documentos; se actualizaron los README para describir esta dependencia. No consulta disponibilidad ni crea reservas reales.
- React incorpora los mismos grupos, conserva el campo de cantidad exacta y usa el logo elegido. El panel de reserva comunica el máximo de personas. Su selección, cotización y confirmación siguen usando los flujos existentes de la API.
- No se incluyeron en esta entrega las modificaciones previas del usuario en mobile, package-lock o documentos de otras fases.

## Recurso visual

La fotografía `html/assets/escapada-atardecer.png` se preparó con la herramienta integrada imagegen, tomando image5 como referencia. Se reconstruyó el fondo sin textos ni interfaz; no es una extracción idéntica de los píxeles de la referencia. Se preserva el archivo logoElegido original.

Prompt usado:

> Use case: precise-object-edit. Reference is a website screenshot. Extract and reconstruct ONLY the wide photographic hero background from the top of this screenshot as a clean website background image. Preserve exactly the sunset lake, pool in foreground, tropical plants, wooden pavilion with string lights and furniture on right, Paraguayan flag at far right. Remove ALL typography and UI, including white headline on left, script phrase 'Paraguay también se disfruta así' on right, search form and header. Reconstruct the natural photographic background behind removed letters. Output just the panorama photo edge to edge in a wide landscape 3:1 composition, no white margins, no website UI, no logos, no text. Match the reference scene and photographic lighting closely.

## Validación

- `node scripts/verify-static.mjs`: 40 pantallas, 1773 enlaces y recursos locales; 1440, 390 y 320 px sin conexión. Filtros, traslado de selección, edición, límites de capacidad y cálculo del importe.
- `npm run lint` y comprobación directa de `html/selection.js` con ESLint.
- `npm run build`.
- `node --test tests/client.test.mjs tests/domain.test.mjs`: 6 pruebas aprobadas.
- Playwright para marketplace y detalle/reserva, en escritorio y móvil: 25 pruebas aprobadas con PostgreSQL y API locales. Una prueba de identidad se omite en móvil por diseño de la suite y se ejecuta en escritorio.

Capturas de la portada: `.local/screenshots/static/index-1440.png` y `index-390.png`.
