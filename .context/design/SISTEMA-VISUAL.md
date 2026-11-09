# Sistema visual — rediseño fases 1–7

Fecha: base 2026-11-04; portada 2026-11-05; resultados/mapa y ficha/reserva 2026-11-07; acceso/área personal y gestión/ayuda 2026-11-08, America/Asuncion. Implementación: `apps/web`. Fuente: HTML principal del ZIP fijado en [REFERENCIA.md](../phases/rediseno-fase-0-2026-11-04/REFERENCIA.md). Esta guía sustituye los valores compartidos históricos de [ARTESANAL.md](ARTESANAL.md); las composiciones de pantalla se completaron en las fases 2–6.

## Tokens y tipografía

La única definición de paleta y fuentes está en `apps/web/src/tokens.css`.

| Familia     | Tokens / valores                                                       | Uso                                                                         |
| ----------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Marca       | `--forest #0f3b2d`, `--forest-deep #08261d`, `--forest-soft #1c5543`   | Acciones, navegación móvil, variantes                                       |
| Superficies | `--paper #f4f5ee`, `--paper-2 #eaede2`, `--white #fff`                 | Fondo, pie, formularios y diálogos                                          |
| Lectura     | `--ink #12211a`, `--muted #56665a`, `--line #d5dacb`                   | Texto, información secundaria, bordes                                       |
| Acentos     | `--clay #a64f2b`, `--clay-bright #c9683f`, `--gold #e4b36a`            | Acentos y foco sobre verde profundo                                         |
| Foco        | `--focus #1f6e52`                                                      | Contorno visible general de 3 px; select nativo conserva su contorno propio |
| Radios      | `--radius 18px`, `--radius-sm 10px`, `--radius-pill 999px`             | Diálogos/vacíos, controles, acciones de cabecera                            |
| Sombra      | `0 26px 60px -32px rgb(8 38 29 / 45%)`                                 | Menús y diálogos                                                            |
| Espaciado   | 4, 8, 12, 16, 20, 24, 32 y 44 px                                       | `--space-1` a `--space-11` según los nombres del archivo                    |
| Medidas     | contenido 1200 px; cabecera 84/76 px; controles 48 px; objetivos 44 px | Estructura compartida                                                       |

Fraunces normal/itálica, pesos 400–700, para títulos; Poppins 400/500/600/700/800 para cuerpo y controles. Los siete WOFF2 se copian sin transformación desde `assets/fonts` del ZIP a `apps/web/public/fonts` (188.096 bytes en total). Se precargan Fraunces normal y Poppins 400/600; la cursiva se anticipa solo en portada/acceso mediante `preload-brand.js` y los demás pesos se solicitan cuando se usan. No se carga Manrope ni se consulta Google Fonts. Se elimina la imposición universal de Poppins y la cursiva de sistema del título de portada. Se conservan monospace para códigos/localizadores y el PNG original `logoElegido.png`; desde fase 7 la interfaz entrega variantes WebP transparentes de esa misma marca.

Los alias `--green`, `--light`, `--linen` y `--accent` apuntan a los nuevos tokens mientras se migran las pantallas. No duplicar sus valores en otra raíz CSS. Gestión usa Fraunces en títulos de pantalla/sección y Poppins en tablas, etiquetas y controles para mantener la lectura operativa.

## Distribución de responsabilidades

| Archivo                                   | Responsabilidad                                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `tokens.css`                              | Fuentes, colores, medidas, espaciados y alias                                                                                 |
| `styles.css`                              | Reset, tipografía, controles, botones, errores/carga/vacíos/éxito y `Modal`; todavía contiene geometría heredada de pantallas |
| `site-layout.css`                         | Única definición de cabecera, marca, navegación, cuenta y pie; sin variantes visuales por ruta                                |
| `SiteLayout.jsx`                          | `Brand`, `Header`, `Footer` y enlaces de sesión; logout real y recuperación de foco                                           |
| `home.css` | Hero, buscador, resumen, categorías, beneficios, anfitriones y pasos de fase 2; único propietario de sus reglas |
| `marketplace.css`, `results.css` | Reglas públicas que siguen vigentes y composición actual de resultados/tarjetas; `home-reference.css` retirado en fase 3 |
| `detail.css`, `workspace.css`, `help.css` | Ficha/reserva, gestión y ayuda migradas; hojas de rutas diferidas                                                                         |

`main.jsx` carga tokens, base, pantallas públicas y estructura compartida. Las hojas de rutas siguen diferidas. Ninguna nueva regla de cabecera/pie debe añadirse en CSS de portada ni de gestión. Las reglas sustituidas se retiraron al migrar cada pantalla; se mantienen los controles compartidos con consumidores.

## Navegación y adaptación

Cabecera con logo, Explorar, Anfitriones y Cómo funciona; acciones reales de publicación, ingreso/registro o cuenta. La cuenta de escritorio usa `details/summary` nativo: cuenta, guardados, reservas, panel según rol y salida. La navegación móvil ofrece esos mismos destinos. Administrador y propietario mantienen sus accesos desde la portada y desde rutas internas; no se deriva autorización del menú.

Menú móvil hasta 980 px inclusive; escritorio desde 981 px. Contenedor de 64 px de margen total, 40 px a 780 y 32 px a 600. Cabecera de 76 px a 600 o menos. Pie 1.5/1/1 columnas, 1.2/1/1 a 980, dos columnas a 780 y una a 600. Los umbrales de 360/480/1080/1180 de otras piezas del prototipo se aplicarán al migrarlas; no se fuerzan ahora sobre las pantallas heredadas.

La cabecera es `sticky`, ocupa su espacio y permanece visible al desplazar. Es una adaptación deliberada del `fixed` del export para conservar la geometría y los destinos de desplazamiento de las rutas actuales sin sumar compensaciones por pantalla. Se conserva `scroll-padding-top` para anclas. El prototipo tiene menos acciones de sesión: los accesos adicionales mantienen las capacidades reales. Desde fase 2, Anfitriones/Cómo funciona abren `/#anfitriones` y `/#como-funciona`; Publicar conserva ingreso con retorno o panel real. La ayuda React permanece enlazada en pasos y pie.

El pie reproduce columnas, superficies y ritmo del HTML principal, con categorías conectadas al contrato real. Sus textos no presentan todo el catálogo como demo ni inventan disponibilidad. La decoración antigua de ondas/flor se retira del pie; sus archivos permanecen disponibles.

## Estados y accesibilidad

- Botones primario/secundario con 48 px de altura mínima; iconos con objetivo mínimo de 44 px. Deshabilitado conserva bloqueo de interacción y cursor apropiado.
- Formularios con Poppins, superficie blanca, borde, radio de 10 px, hover, foco visible y `aria-invalid` cuando el consumidor lo indica. Se conservan etiquetas y validaciones actuales; no se cambia la lógica de búsqueda/reserva.
- `ErrorMessage` conserva `role=alert`; `Loading` conserva `role=status`; vacíos y éxitos tienen las superficies y bordes compartidos. Carga y error no se presentan como ausencia de registros.
- Menú: Enter/Espacio abre; foco en primer enlace; Escape cierra y vuelve al botón. También cierra al salir de la cabecera, navegar, cambiar sesión o atravesar el umbral. Se recupera foco si un control desaparece al cambiar de distribución.
- Cuenta nativa: Escape cierra y devuelve foco al resumen; clic/foco exterior cierra. Los enlaces son enlaces, sin simular un widget ARIA de menú de aplicación.
- `Modal` conserva `showModal`, nombre accesible, Escape, cierre exterior y restitución del foco. Bloquea el desplazamiento del documento mientras está abierto y restaura su valor anterior al cerrar.
- Salto al contenido con destino enfocable y movimiento reducido general. El menú móvil usa foco dorado contrastado; los diálogos mantienen el foco nativo dentro de su contenido.

## Portada y buscador — fase 2

`home.css` concentra la composición migrada. Hero a todo ancho, fotografía oscurecida y título Fraunces 550 con acento dorado; texto y contenidos dentro del contenedor compartido de 1200 px. Su altura mínima de escritorio descuenta la cabecera sticky frente al fixed del export; controles adicionales pueden aumentar esa altura. Se evita copiar el `width:100%` que extiende `.hero-inner` hasta los bordes en el HTML de referencia.

Tarjeta de búsqueda blanca, radio de 20 px (16 px en móvil), sombra compartida y controles con borde/radio de 10 px y altura 48 px. Campos en seis columnas solo cuando el contenedor dispone de 1120 px; tres por debajo, dos hasta 780 px y una hasta 600 px. La etiqueta Horario/Turno reemplaza la segunda fecha del formulario ficticio, manteniendo la lógica horaria real. Categorías con chips redondeados, iconos y estado `aria-pressed`; nunca son rangos de personas ni servicios simulados.

Intervalo/duración visibles con filtros cerrados. Presupuesto total del intervalo al elegir fecha; sin fecha, se explica que el importe estimado usa la duración mínima de cada propiedad y no verifica disponibilidad. Los filtros avanzados conservan campos y requisitos server-side; cuatro columnas, dos hasta 780 px y una hasta 600 px. El envío válido mueve foco a la región de resultados y anuncia carga/error/conteo; la validación de personas mantiene foco/error asociado en el campo.

Franja de confianza: cinco columnas, tres hasta 980 px, dos hasta 600 px y una hasta 480 px. Iconos de 22 px dentro de círculos de 42 px. Bloque anfitriones: fotografía y panel verde a mitades, una columna hasta 980 px; CTA dorado de publicación real. Pasos: tres columnas y una hasta 780 px, numeración Fraunces arcilla, bordes superiores y texto explicativo de reserva real. Sponsors se conserva después de resultados, antes de anfitriones y pie.

Hero: `/brand/escapada-{960,1600,2172}.webp`, derivados del recurso original, con `srcSet`, prioridad alta y dimensiones explícitas; en móvil el panorama requiere la variante mayor por el recorte vertical. Anfitriones: `/brand/anfitriones.webp`, lazy, fuente del ZIP y atribución en `/brand/anfitriones-credits.json`. Se identifican como imágenes ilustrativas; las fichas conservan sus fotos reales y avisos de muestra.

## Resultados, tarjetas y mapa — fase 3

`results.css` concentra las piezas migradas y reemplaza `home-reference.css`. Resultados alineados con el contenedor compartido de 1200 px, márgenes de 32/20/16 px por lado según ancho. Padding vertical de la sección de 56–88 y 76–112 px. Encabezado Fraunces 550 de 32–49.6 px, resumen de exactas cargadas/alternativas y disponibilidad, controles de orden/limpieza y vista.

Tarjetas blancas, radio 18 px y borde `--line`, fotografía 4:3, tipo y muestra en badge, ubicación pública, título Fraunces 24 px/600, capacidad/mínimo horario, servicios reales y valoración solo si existe. Cuerpo 20/22/22 px y separación 9 px; servicios como etiquetas de 12 px. Favoritos con objetivo de 44 px y estado arcilla. Tarifa horaria, total/duración de API y aviso de verificación separados de diferencias por etapa. Tres columnas, dos hasta 980 px y una hasta 600 px; carrusel de tres/dos/una parcial con controles siempre visibles de 44 px.

Mapa lateral al abrirlo desde 1181 px, proporción tarjetas:mapa 1.62:1, dos columnas de tarjetas y gap 26 px. Panel blanco con borde/radio 18 px, cabecera/conteo de página, mapa OSM y pie que explica alcance. Sticky bajo cabecera, altura hasta 720 px y mínimo 540 px. Hasta 1180 px alterna lista y mapa en el mismo espacio, sin modificar filtros/URL; panel hasta 860 px de ancho y 480 px de alto en móvil. Las alternativas permanecen debajo, con encabezados Fraunces y separación de 44 px.

Marcadores operables con Enter/Espacio y foco dorado; tarjeta enfocada/hover resalta marcador. Popup conserva enlace a ficha, precio por hora y estimación/aviso que muestra la tarjeta. Atribución OSM permanece visible; solo se usan coordenadas públicas de exactas de la página. No se traslada el mapa esquemático, ni se inventan datos de alojamiento o valoraciones.

## Ficha, galería y reserva — fase 4

`detail.css` concentra la pantalla. Hoja blanca de radio 20 px, borde/sombra compartidos y barra con anclas. Dos columnas iguales desde 981 px; galería sobre papel secundario, padding 24 px, foto completa 4:3, pie y miniaturas de tres columnas con selección verde. El visor conserva diálogo nativo, teclado, foco y sustituto de imagen fallida. Galería sticky bajo cabecera; página con desplazamiento normal, como adaptación del diálogo de referencia a una ruta compartible. Hasta 980 px se apila, con foto 16:9 y miniaturas en fila; hasta 480 px foto 4:3 y padding 16 px.

Contenido con padding 30/34/36 px, título Fraunces 30–41.6 px, etiqueta arcilla, servicios como chips y encabezados de bloque Poppins 11 px con espaciado. Mapa aproximado OSM explícito de 300 px; reglas/reseñas/redes reales. Panel de reserva sobre papel, radio 14 px, padding 20/16 px, tarifa horaria, intervalo/duración/personas visibles, controles blancos de 48 px, resumen y estados de confirmación/recuperación. Los campos/avisos reales aumentan la altura respecto de la consulta simulada. Sin cálculo local de total.

Se retiran 53 reglas exclusivas de ficha/reserva de la base; estilos de redes utilizados por propietario y controles compartidos se conservan. Las tarjetas de similares mantienen su componente existente y navegación. [Informe de fase 4](../phases/rediseno-fase-4-2026-11-07.md).

## Acceso y área personal — fase 5

`auth.css`: contenedor de 1120 px, hoja blanca de radio 20 px y dos mitades; fotografía decorativa existente de marca con velo forestal, título Fraunces de 36–54 px y acento dorado, contenido y formulario con padding 44 px. Hasta 980 px se apilan; bloque de marca compacto y controles con 16 px de texto hasta 600. Selector de modo con `aria-pressed`, controles de 48 px, pendiente deshabilitado y error con foco. Logo y salida local arriba; pie compartido.

`account.css`: contenedor de 1200 px, título Fraunces de 32–46 px y pastillas de navegación activas en verde. Bienvenida forestal con CTA dorado, tarjetas de accesos, datos de cuenta en detalle de consulta y notificaciones blancas con borde izquierdo verde (neutro al leer). Guardados comparte la tarjeta de resultados, tres/dos/una columnas a 980/600, sin estimación no suministrada. Reservas en tarjetas de radio 18 px con fecha sobre papel secundario, importe/estado, detalle progresivo y acciones; grid adapta de tres a dos columnas hasta 980 y acciones/importe a ancho completo hasta 600. Diálogos personales con radio 20 px y estilos limitados a su contenido.

`auth-continuation.css`: tarjeta blanca de radio 14 px, borde forestal lateral, aviso y acciones existentes por encima del destino. El foco y la confirmación explícita se conservan. Se retiran 41 reglas exclusivas de base/workspace, sin migrar la geometría de propietario/administración. [Informe de fase 5](../phases/rediseno-fase-5-2026-11-08.md).

Evidencias y límites en los informes de [fase 1](../phases/rediseno-fase-1-2026-11-04.md), [fase 2](../phases/rediseno-fase-2-2026-11-04.md) y [fase 3](../phases/rediseno-fase-3-2026-11-07.md). Gestión/ayuda completadas en fase 6 y validación integrada local cerrada en fase 7; auditoría WCAG integral pendiente.

## Propietario, administración, ayuda y estados — fase 6

`workspace.css`: página de 1200 px como máximo y márgenes laterales de 32 px, encabezado Fraunces de 34–46 px. Navegación principal lateral de 208 px con separación de 28 px desde 1081; hasta 1080 se sitúa arriba como pestañas horizontales con desplazamiento interno. Selección forestal/blanca y controles de al menos 48 px. El tablist informa orientación y conserva flechas, Home/End, URL y paneles; las pestañas internas de medios continúan horizontales.

Métricas en tarjetas blancas, actividad sobre papel y panel blanco bordeado. Filas de espacios con fotografías cuadradas de 100 px (68 × 82 px hasta 600); calendario con flechas/selector alineados, cuadrícula y agenda del día apilada en móvil. Reservas y planes conservan sus controles y datos reales. Tablas con cabeceras forestales sobre papel, bordes y región enfocada de desplazamiento horizontal; el documento conserva su ancho. No se ocultan columnas operativas.

`management-dialog`: hoja blanca de radio 20 px, máximo 760 px, campos agrupados sobre papel y columnas que se apilan hasta 600. Estilos limitados a gestión mediante la clase opcional de `Modal`. Formularios de propiedad, medios/datos privados/redes, ocupación, cancelación, planes/suscripciones y sponsors mantienen todos sus controles. Eliminados 68 bloques exclusivos de gestión de la base; filtros, reservas y controles compartidos de cuenta siguen presentes.

`help.css`: pasos en tres tarjetas blancas, FAQ con `details/summary` nativos y cierre forestal con acento dorado; apilado móvil. `PageState`/`page-state.css`: tarjeta blanca, icono forestal y título Fraunces para incorporación, sesión fallida, acceso denegado y 404, con acciones reales. [Informe, evidencia y límites](../phases/rediseno-fase-6-2026-11-08.md).

## Cierre integrado — fase 7

Marca: WebP lossless después del redimensionado, 96/192/288 px y 9.988/29.902/55.712 bytes. `srcSet` y tamaños reales de cabecera/pie; favicon de 96 px. Se conserva transparencia, proporción y archivo PNG original, sin redibujar. Hero prioritario, cursiva anticipada en portada/acceso y hero anticipado solo en portada mediante `preload-brand.js`; fuentes locales y lazy de anfitriones/pie revalidados en DPR 1/2/3; mapa sin descargar antes de pedirlo.

Reserva: la fila de horas usa `auto-fit` con mínimo de 160 px por control; se apila cuando los editores nativos no caben, incluido Firefox. Gestión: títulos/mes y abreviaturas de días admiten salto con texto ampliado; fechas móviles centradas y padding horizontal de 2 px para conservar ambas cifras. El calendario mantiene agenda y teclado.

Comparativas reales/prototipo, geometría y excepciones: [informe de fase 7](../phases/rediseno-fase-7-2026-11-08.md). 95 capturas, 44 Axe reales sin violaciones detectadas y 24 mediciones Lighthouse. Chrome/Firefox headless, reflow a 320 px y ampliación de texto al 200%; no certifica zoom nativo, lectores, dispositivos físicos o WCAG integral.

La revisión de fase 7 alinea nombres accesibles con el texto visible de tarjetas/galería y usa contenido nativo más identidad auxiliar en el menú de cuenta. La regla experimental de coincidencia de etiquetas queda habilitada explícitamente en las regresiones de resultados/ficha; ocho comprobaciones reales adicionales sin violaciones detectadas.
