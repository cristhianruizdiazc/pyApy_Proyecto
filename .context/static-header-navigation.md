# Navegacion de la demostracion HTML estatica

Fecha: 2026-10-23.

Se revisaron PROMPT_MAESTRO.md, DECISIONS.md y ADR-003/ADR-011. Alcance: presentacion de la demostracion HTML, conservando las reglas de negocio y los cambios previos del repositorio.

- html/explorar.html replica la cabecera de portada con rutas relativas, marca, Inicio, Explorar activo en ambas navegaciones, ayuda, anfitrion, Paraguay, favoritos, ingreso y registro.
- index.html alinea las opciones del menu movil con esa cabecera.
- html/catalog-header.css limita la apariencia de portada a la cabecera de Explorar; html/styles.css presenta el indicador de pais y el enlace activo del menu movil.
- Ubicaciones e Indice permanecen en el menu movil y el pie de Explorar.
- Sin cambios en filtros, reservas, autenticacion, API, base de datos ni aplicaciones React/React Native.

Validacion final:

- node scripts/verify-static.mjs: PASS, 40 pantallas a 1440/390/320 px, 1863 enlaces y recursos locales, imagenes, filtros y seleccion; sin desbordamientos.
- node .local/verify-static-header.mjs: PASS a los tres anchos. Comprueba el recorrido Inicio -> Explorar, aria-current, opciones visibles, apertura con Enter y foco del primer enlace con Tab; tambien ausencia de desbordamiento con menu abierto.
- Capturas locales: .local/screenshots/static/explorar-header-{1440,390,320}.png.

Durante la edicion, una corrida que coincidio con la cabecera aun sin CSS detecto desbordamiento a 320 px; la corrida final con los estilos completos pasa. La comprobacion especifica se ajusto para leer textContent de la navegacion oculta, pues innerText no devuelve su texto en movil.
