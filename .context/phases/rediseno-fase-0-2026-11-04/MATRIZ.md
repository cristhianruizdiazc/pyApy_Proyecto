# Matriz funcional y de validación del rediseño

Fecha: 2026-11-04, America/Asuncion. Inventario de `apps/web` previo al rediseño. Guía: [plan](../rediseno-frontend-2026-11-03.md), [referencia](REFERENCIA.md). Las filas describen capacidades observadas en el código, no certifican que cada mutación haya sido ejecutada durante la fase 0.

Roles: I = invitado; C = cliente; P = propietario; A = administrador. «Autenticado» abarca C/P/A donde el permiso de servidor lo admite. Se mantienen las rutas actuales y los permisos por recurso. El destino es una ubicación prevista dentro de una ruta; no crea una función nueva.

## Inventario y destino

| ID | Ruta / componente actual | Rol | Función y condición que conservar | Ubicación prevista | Fase |
| --- | --- | --- | --- | --- | --- |
| N01 | Todas / `App` | Todos | Marca a inicio, explorar, ayuda, publicar y acceso | Cabecera y pie del prototipo, enlaces reales | 1 |
| N02 | Todas / `App` | Autenticado | Cuenta, favoritos, reservas; panel de propietario/administración según rol | Navegación de sesión y cuenta; acceso al panel correspondiente | 1 |
| N03 | Todas / `App` | Todos | Menú móvil, Escape, devolución de foco, cierre al navegar; movimiento reducido | Menú adaptable de la cabecera | 1 |
| N04 | Todas / `App`, `ui` | Todos | Carga de sesión/ruta, errores, cierre de sesión sin perder aviso de fallo | Estructura compartida y estados de sesión | 1 |
| B01 | `/` / `Home`, `SearchForm` | Todos | Hero, beneficios y carrusel inicial de espacios reales; explorar activa resultados | Hero, trust y sección espacios del HTML principal | 2 |
| B02 | `/` / `SearchForm` | Todos | Ciudad o sin preferencia; fecha opcional; fecha inválida de URL | Buscador principal | 2 |
| B03 | `/` / `SearchForm` | Todos | Turnos completo 09–09, diurno 09–17, mañana 09–13, tarde 13–17; horas personalizadas y cruce de medianoche | Buscador y ampliación de horario; resumen visible | 2 |
| B04 | `/` / `SearchForm` | Todos | Personas exactas 1–1000 o vacío; solo dígitos; error asociado y foco; conservar 18 | Campo visible de personas, sin selector de rangos | 2 |
| B05 | `/` / `SearchForm` | Todos | Presupuesto para intervalo elegido, tipo y servicios opcionales/indispensables | Campos principales y filtros avanzados | 2 |
| B06 | `/` / `SearchForm` | Todos | Requisitos estrictos de ciudad/presupuesto; preferencias distintas de requisitos | Filtros avanzados con etiquetas explícitas | 2 |
| B07 | `/` / `SearchForm` | Todos | Tipos reales Quinta, Piscina, Casa, Bungalow, Quincho y Salon | Chips equivalentes por tipo y selector completo; Salón sigue disponible | 2 |
| B08 | `/` / `Home`, `SearchForm` | Todos | URL compartible, borrador, recarga, historial y limpieza de filtros; fechas en America/Asuncion | Estado del buscador y router actual | 2 |
| B09 | `/` / `Home` | Todos | Orden por coincidencia/precio/capacidad y paginación real de servidor | Resumen y controles de resultados | 3 |
| B10 | `/` / `Home`, `PropertyCard` | Todos | Exactas primero; alternativas de zona, sobreprecio, servicios y otros intervalos con diferencias explicadas | Lista principal y bloques de alternativas identificados | 3 |
| B11 | `/` / `Home`, `PropertyCard` | Todos | Disponibilidad verificada frente a estimación sin fecha; selección acotada, alternativas truncadas y ventana temporal limitada | Resumen, avisos y tarjetas | 3 |
| B12 | `/` / `Home` | Todos | Carga, fallo con reintento, vacío real; no mostrar error como vacío; validación conserva foco | Región de resultados y estados del buscador | 2–3 |
| B13 | `/` / `Home` | Autenticado / I→ingreso | Guardar interés ante falta de coincidencias; confirmación tras ingreso, éxito/error | Estado vacío y aviso de continuación | 3, 5 |
| B14 | `/` / `Sponsors` | Todos | Campañas vigentes, enlace externo HTTPS, eventos `sponsor_impression`/`sponsor_click` | Banda de sponsors después de espacios, antes del pie | 2–3 |
| B15 | `/` y ficha / `ui`, `Detail` | Todos | Eventos existentes de selección/vista con datos y etapa vigentes | Tarjetas y entrada a ficha; sin duplicarlos por cambios visuales | 3–4 |
| M01 | `/` / `Map` | Todos | Apertura explícita y módulo/teselas diferidos; retorno a espacios sin cambiar URL | Mapa lateral al abrir en escritorio; vistas adaptables en móvil | 3 |
| M02 | `/` / `Map` | Todos | Solo exactas cargadas, coordenadas públicas, atribución OSM; marcador/tarjeta seleccionada y enlace con contexto | Contenedor de mapa del prototipo con Leaflet real | 3 |
| M03 | `/` / `Home` | Todos | Mapa indisponible con explicación en vacío/error; si ya está abierto permite volver | Control estable Ver mapa / Ver espacios | 3 |
| F01 | `/espacios/:id` / `Detail` | Todos | Acceso directo, recarga, historial, URL con selección; retorno local validado o explorar | Ficha como página real con composición visual del diálogo | 4 |
| F02 | Ficha / `PropertyGallery` | Todos | Fotos reales, fallback, ampliar, miniaturas, anterior/siguiente, flechas, Escape y foco | Galería y visor de ficha | 4 |
| F03 | Ficha / `Detail` | Todos | Tipo/ciudad, capacidad, horarios, descripción, reglas, servicios, verificación, reseñas y redes públicas | Encabezado, bloques de información y servicios | 4 |
| F04 | Ficha / `Detail` | Todos | Mapa público bajo demanda, próximas fechas ocupadas informativas, similares | Ubicación, fechas y seguir explorando | 4 |
| F05 | Ficha / `Detail` | Todos | `isDemo` identifica muestra; `isPublicSample` impide reservar y muestra aviso; no confundir ambos | Insignia de muestra y panel de demostración cuando corresponde | 3–4 |
| R01 | Ficha / `BookingPanel` | Todos | Entrada, salida opcional, desde/hasta, personas, validación y disponibilidad ocupada con reintento | Panel de reserva junto a información; adaptación móvil | 4 |
| R02 | Ficha / `BookingPanel` | I→ingreso | Autenticación conserva borrador e intervalo; ingreso no cotiza ni confirma automáticamente | Panel de reserva y retorno de acceso | 4–5 |
| R03 | Ficha / `BookingPanel` | Autenticado | Cotización real, horas iniciadas, importe/cancelación del servidor; descartar respuestas obsoletas | Resumen previo a confirmación | 4 |
| R04 | Ficha / `BookingPanel` | Autenticado | Confirmación explícita, guard contra doble envío, cuerpo/UUID estables ante ambigüedad; recuperación de pestaña | Confirmación, estado pendiente de comprobar y reintento | 4 |
| R05 | Ficha / `BookingPanel` | Autenticado | Conflicto/rechazo y sesión vencida; cambiar propiedad/usuario no cruza cotizaciones | Avisos y estado propio del panel | 4 |
| R06 | Ficha / `BookingPanel` | Autenticado | Éxito con localizador, intervalo/personas/total y enlace a mis reservas; reserva ya cancelada al recuperar | Confirmación final de reserva | 4 |
| A01 | `/ingresar` / `Auth` | I | Ingreso, registro `?mode=registro`, validación y errores; campos reales de cuenta | Pantalla de acceso derivada del sistema visual | 5 |
| A02 | `auth-return`, `AuthContinuation` | Todos | Destino local seguro; query/hash; reemplazo del formulario en historial; sin bucles | Router y aviso de continuación con foco | 5 |
| A03 | `AuthContinuation` | Autenticado | Interés/favorito pendiente: Confirmar, Ahora no, revisar ficha, error/reintento y 401; sin escritura por login | Aviso visible por encima de resultados/ficha | 5 |
| A04 | `/cuenta` / `Account` | Autenticado | Nombre/correo en datos de mi cuenta, accesos a reservas y guardados; no hay formulario actual de edición de perfil | Área personal y detalles de cuenta | 5 |
| A05 | `/cuenta` / `Account` | Autenticado | Notificaciones internas, sin leer/todas, búsqueda sobre cargadas, marcar leída y reintento | Sección notificaciones | 5 |
| A06 | `/favoritos` / `Account`, tarjetas | Autenticado | Lista real, búsqueda sobre cargadas, quitar favorito, error/vacío y enlace a explorar | Guardados con tarjetas del sistema visual | 5 |
| A07 | `/reservas` / `Reservations` | Autenticado | Orden próximas/pasadas/canceladas; filtros, buscar y mostrar más; detalle de localizador, personas, origen e importe | Mis reservas, filas y detalles progresivos | 5 |
| A08 | `/reservas` / `Account` | Usuario autorizado | Llegada privada solo con autorización del servidor; carga, cierre aborta/desestima tardías, error y mapa externo | Diálogo Llegada | 5 |
| A09 | `/reservas` / `Account` | Usuario autorizado | Cancelación con diálogo, pendiente, éxito/error y política vigente validada por servidor | Acción por reserva y diálogo de cancelación | 5 |
| A10 | `/reservas` / `Account` | Cliente de estadía terminada | Publicar reseña 1–5 y comentario, validación/error; elegibilidad final del servidor | Acción Opinar y diálogo | 5 |
| P01 | `/propietario` / `Owner` | I / C | Invitado ingresa con retorno; cliente crea perfil explícitamente con nombre comercial | Acceso y alta de anfitrión; sustituye formulario simulado | 5–6 |
| P02 | `/propietario?section=properties` | P/A | Métricas, importe reservado sin afirmar cobros, vistas/favoritos y estados publicados/borradores/suspendidos | Resumen y lista operativa de espacios | 6 |
| P03 | Propietario / `PropertyForm` | P/A autorizado | Crear/editar nombre, descripción, ciudad/zona/tipo, capacidad, precio horario, duración, apertura/cierre, cancelación, ubicación, reglas, estado y servicios | Formulario real en diálogo de espacio | 6 |
| P04 | Propietario / `MediaForm` | P/A autorizado | Ver/subir/eliminar fotos con validación y errores | Pestaña Fotos del diálogo de medios | 6 |
| P05 | Propietario / `MediaForm` | P/A autorizado | Dirección, teléfono y coordenadas exactas privadas; lectura/escritura protegida | Pestaña Datos de llegada; nunca tarjetas/mapa público | 6 |
| P06 | Propietario / `MediaForm` | P/A autorizado | Redes oficiales validadas por plataforma/dominio; guardar enlace | Pestaña Redes | 6 |
| P07 | `/propietario?section=calendar` | P/A autorizado | Mes anterior/siguiente, filtro por espacio, ocupaciones por día, agenda móvil | Calendario y agenda operativa | 6 |
| P08 | Calendario / `Calendar` | P/A autorizado | Registrar reserva particular o bloqueo; fecha/horas/personas/importe/nota según tipo; exclusión y errores reales | Diálogo Registrar ocupación | 6 |
| P09 | `/propietario?section=bookings` | P/A autorizado | Reservas pyApy/particulares/bloqueos, buscar/filtrar y cancelar con permisos | Reservas del panel y diálogo de cancelación | 6 |
| P10 | `/propietario?section=plans` | P/A | Plan/subscripción actual, estado/vencimiento, planes disponibles y solicitud manual; sin pasarela de pagos | Mi plan y tarjetas de planes | 6 |
| G01 | `/admin?section=overview` | A | Usuarios/espacios/reservas, importe reservado, trabajos de notificación, demanda por ciudad | Resumen administrativo | 6 |
| G02 | `/admin?section=users` | A | Tabla, filtro y activar/desactivar; propio administrador protegido; revocación de sesiones en servidor | Usuarios | 6 |
| G03 | `/admin?section=properties` | A | Ver ficha, verificar y publicar/suspender propiedades | Espacios y moderación | 6 |
| G04 | `/admin?section=reviews` | A | Reseñas, puntuación, visibilidad y mostrar/ocultar | Moderación de reseñas | 6 |
| G05 | `/admin?section=plans` | A | Editar mensualidad y estado de planes existentes | Planes y diálogo de edición | 6 |
| G06 | `/admin?section=subscriptions` | A | Estado/vencimiento y gestión manual de suscripción | Suscripciones y diálogo | 6 |
| G07 | `/admin?section=sponsors` | A | Crear campaña con sponsor, URL, título y período; activar/pausar; estado y fechas | Sponsors y diálogo de campaña | 6 |
| G08 | `/admin?section=weights` | A | Pesos de disponibilidad, ciudad, capacidad, presupuesto y servicios; suma 100, validación/guardado | Matching | 6 |
| G09 | `/admin?section=audit` | A | Fecha/operación y detalles de identificadores, sin exposición pública | Auditoría | 6 |
| G10 | `WorkspaceTabs`, `RecordList`, `QueryState` | C/P/A | `?section=`, pestañas/flechas/Home/End; búsqueda/estado/mostrar más en registros cargados; carga/error/reintento/vacío | Componentes operativos compartidos | 1, 5–6 |
| X01 | `/ayuda#ayuda` / `Help` | Todos | Explicación real de búsqueda/reserva/llegada, privacidad/cancelación y accesos | Ayuda y bloque Cómo funciona de portada | 2, 6 |
| X02 | `*`, `/admin`, rutas privadas | Todos | No encontrado, acceso denegado y solicitud de ingreso según sesión/rol | Estados de página completos con navegación de salida | 1, 5–6 |

## Matriz visual

Referencia: 360×800, 390×844, 430×932, 600×960, 820×1180, 1024×768, 1366×768, 1440×900 y 1920×1080; DPR 1 para comparar geometría. Capturas de portada completa del prototipo y de la aplicación en los nueve tamaños. Estados de resultados, filtros, mapa, ficha, galería, acceso/registro, carga/error/vacío y páginas por rol en 390×844 y 1440×900. Las alturas forman parte de la referencia, incluida su diferencia con las pruebas existentes a 1440×1000.

Al migrar cada pantalla: comprobar también 320 px/reflow, zoom 200/400%, DPR 2/3 para recursos y continuidad en 359/360/361, 479/480/481, 599/600/601, 779/780/781, 979/980/981, 1079/1080/1081 y 1179/1180/1181/1182 según el componente afectado. Estos barridos son criterios posteriores; no se declaran ejecutados por la captura de nueve tamaños.

Cada componente afectado debe cubrir inicial, hover/foco, seleccionado, deshabilitado, carga, error, vacío, éxito y sesión vencida cuando correspondan. Las capturas de error/carga/vacío interceptadas se identifican como simuladas. API real y API simulada nunca se contabilizan como la misma comprobación.

## Recorridos de regresión y criterio

| ID | Recorrido | Cobertura que reutilizar | Fases de comprobación |
| --- | --- | --- | --- |
| V01 | Buscar 18 → URL → recarga → ficha → selección | `search-guests`, `search-labels`, integración real de marketplace | 2–4, 7 |
| V02 | Completo/diurno/personalizado → cruce medianoche → resumen/cotización | `search-labels`, `marketplace-integration`, `detail-reservation`, pruebas de contratos | 2, 4, 7 |
| V03 | Requisitos estrictos → exactas/alternativas → diferencias → paginación | `progressive-search` E2E y API; no relajar capacidad | 2–3, 7 |
| V04 | Abrir/cerrar mapa → marcador → ficha → volver | `search-map`, `search-return`; URL intacta y sin descarga antes de abrir | 3–4, 7 |
| V05 | Comparar fichas → volver → atrás/adelante → nueva pestaña/directo | `search-return`, router y origen local seguro | 3–4, 7 |
| V06 | Favorito/interés/reserva/cuenta/publicación → login/registro → continuar | `auth-return`; confirmación explícita, roles y 401 | 4–6, 7 |
| V07 | Cotización → confirmar → doble clic/timeout → mismo UUID → mis reservas | `detail-reservation`, `marketplace`, API/idempotencia | 4–5, 7 |
| V08 | Reservas → llegada → cerrar antes de respuesta; cancelar/reseñar | `workspace`, `detail-reservation`, API de autorización y reloj controlado | 5, 7 |
| V09 | Propietario → alta/edición/medios/privados/redes/calendario/ocupación/planes | `workspace`, `marketplace`, API de propiedad/recursos | 6–7 |
| V10 | Admin → nueve secciones → mutaciones permitidas y denegadas | `workspace`, `marketplace`, API de administración | 6–7 |
| V11 | Teclado → menú → Escape/foco; galería; pestañas; errores y anuncios | `marketplace-integration`, Axe y revisión manual por fase | 1–7 |
| V12 | Hero/fuentes/logo → variante elegida → transferencia/LCP/CLS | Base de rendimiento y comparación bajo condiciones idénticas | 1–4, 7 |

Las pruebas originales pueden contener localizadores obsoletos. Un fallo se registra antes de adaptarlo y se diferencia de un defecto de producto. Ninguna mutación de estas suites se ejecuta contra la base habitual: deben apuntar al entorno aislado verificado. TLS de staging se valida en HTTPS; lectores reales, dispositivos físicos y otros navegadores se declaran según disponibilidad.

## Límites de datos observados

El inventario no amplía contratos: no hay dormitorios/baños estructurados ni mensajería WhatsApp real en la API; la pantalla de cuenta muestra datos, sin edición de perfil. Los filtros de gestión actúan sobre registros ya cargados y los límites del servidor siguen vigentes (por ejemplo, 200 usuarios y reservas personales, 500 reservas de propietario). No presentar «mostrar más» como paginación total de servidor. Las seis muestras públicas y las propiedades demo reservables son casos diferentes.
