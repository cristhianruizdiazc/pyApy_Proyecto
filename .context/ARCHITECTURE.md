# Arquitectura implementada

Actualizado: 2026-11-08. Decisiones base: [ADR-001](decisions/ADR-001-foundation.md), [ADR-002](decisions/ADR-002-security-bookings-offline.md), [ADR-003](decisions/ADR-003-legacy-ui-integration.md).

## Componentes

Rediseño web, fase 7 (2026-11-08): cierre integrado local. `Brand` sirve WebP transparentes de 96/192/288 px y tamaños de cabecera/pie; el favicon reutiliza 96 px y el PNG original se conserva. `preload-brand.js` anticipa hero/cursiva solo en portada y cursiva en acceso, siguiendo la base de Vite; las fichas no descargan esos recursos por la precarga. `detail.css` adapta la fila de controles horarios nativos al espacio disponible. `workspace.css` permite partir títulos/mes y adaptar días con texto ampliado, conservando navegación/agenda y tablas con desplazamiento interno. Sin cambios de servicios, contratos, datos, roles o reglas. [Informe](phases/rediseno-fase-7-2026-11-08.md).

Rediseño web, fase 6 (2026-11-08): `WorkspaceTabs` admite navegación principal opcional con iconos, orientación vertical desde 1081 px y horizontal hasta 1080; conserva URL/paneles/teclado y las pestañas internas de medios. `workspace.css` concentra gestión, tablas, calendario/agenda y formularios; mantiene controles compartidos de cuenta. Se retiran 68 bloques exclusivos de base. `Modal` admite clase opcional para limitar estilos a gestión; `PageState` unifica presentación de incorporación, sesión fallida, acceso denegado y 404. `Help` usa pasos/FAQ nativos con capacidades actuales. Sin cambios de consultas, contratos, mutaciones o autoridad del servidor. [Informe](phases/rediseno-fase-6-2026-11-08.md).

Rediseño web, fase 5 (2026-11-08): `Auth.jsx` se extrae de `App` y se carga de forma diferida con `auth.css`; conserva APIs/CSRF/caché/destino, presenta modo desde URL y bloquea envíos repetidos. `Account` deja de heredar la geometría `workspace-page` y usa `account.css`. Reutiliza `SearchPropertyCard` en Guardados, con precio por hora y sin la estimación que solo entrega el buscador. `ReservationBrowser`/`Reservations` no cambian y conservan consumidores de gestión. `auth-continuation.css` presenta la tarea explícita pendiente; retiradas 41 reglas exclusivas de acceso/cuenta/notificaciones de base/workspace, conservando las compartidas. Perfil de consulta, datos privados por autorización, bloqueos de escrituras y recuperación tras 401 mantienen autoridad del servidor. [Informe](phases/rediseno-fase-5-2026-11-08.md).

Rediseño web, fase 4 (2026-11-07): `Detail.jsx` adapta el diálogo a la ruta existente, con galería izquierda y contenido/reserva derecha desde 981 px, apilados hasta 980. `PropertyGallery` incorpora miniaturas de selección; `Modal` admite `onKeyDown` opcional para las flechas desde todo el diálogo. `BookingPanel` solo añade resumen temporal, conservando estado/contratos/idempotencia y precio del servidor. `detail.css` reemplaza 53 reglas exclusivas de `styles.css`; redes de propietario y controles compartidos se conservan. Sin cambio de API/DB. [Informe](phases/rediseno-fase-4-2026-11-07.md).

Rediseño web, fase 3 (2026-11-07): `SearchPropertyCard.jsx` presenta los resultados de la API; cuenta/similares conservan la tarjeta de `ui.jsx` hasta sus fases. `Home` mantiene consultas/URL, favoritos/interés y coordinación con el mapa. `results.css` sustituye `home-reference.css` y 38 selectores exclusivos de resultados en las hojas anteriores; `sr-only` y anchos compartidos se conservan en base/estructura. Panel OSM lateral desde 1181 px y alternancia lista/mapa hasta 1180 px, siempre explícito/diferido y limitado a exactas de la página. `Map` permite teclado en marcadores, reutiliza la estimación de tarjeta y actualiza tamaño con `ResizeObserver`, sin recentrar por hover. Los contratos, precios, permisos y datos públicos siguen viniendo del servidor. [Informe de fase 3](phases/rediseno-fase-3-2026-11-07.md).

Rediseño web, fase 2 (2026-11-04): `Home.jsx` compone hero/buscador, beneficios, resultados existentes, sponsors, anfitriones y pasos. `SearchForm.jsx` conserva borrador/contratos y muestra siempre intervalo/duración, tarifa horaria y alcance del presupuesto con/sin fecha. `home.css` es la única definición de las piezas migradas; retirados sus selectores de `styles.css`, `marketplace.css` y `home-reference.css`, conservando controles compartidos/gestión y resultados pendientes de fase 3. Se reutiliza la cabecera/pie de fase 1; las nuevas anclas conducen a anfitriones/pasos y la ayuda sigue accesible. El envío enfoca resultados y comunica su estado/conteo; no cambian API, DB, roles, reserva ni OSM. Hero original con variantes WebP; foto de anfitriones ilustrativa del ZIP con atribución. [Informe de fase 2](phases/rediseno-fase-2-2026-11-04.md).

Rediseño web, fase 1 (2026-11-04): `SiteLayout.jsx` compone marca, cabecera, navegación por sesión/rol y pie, separado de las pantallas. `tokens.css` concentra paleta/medidas y Fraunces/Poppins servidas localmente. `styles.css` mantiene base/controles/estados y geometría de pantallas pendientes; `site-layout.css` es la única definición de estructura compartida. Se retiraron sus variantes de `marketplace.css` y `home-reference.css`; estas conservan la composición pública hasta fases 2–3. Rutas diferidas mantienen sus hojas propias. La sesión, permisos, contratos y autoridad del backend no cambian. [Guía de estilos efectiva](design/SISTEMA-VISUAL.md), [informe y adaptación sticky](phases/rediseno-fase-1-2026-11-04.md).

Web React 19/Vite consume `/api/v1` mediante cliente compartido y TanStack Query. Rutas de paneles y mapas se cargan bajo demanda. Leaflet usa OpenStreetMap con atribucion y coordenadas publicas aproximadas.

Integración UI 01: `SearchForm.jsx` mantiene el borrador de búsqueda, reconstruido desde URL, y utiliza los esquemas/fechas compartidos. `Home.jsx` mantiene consultas, favoritos y coordinación mapa/lista. `marketplace.css` se carga después del CSS base para identidad y experiencia pública; SVG locales en `public/brand`. El legado Firebase/Firestore es referencia de UX, no parte del runtime de la aplicación vigente. Ver informe de [integración](phases/integration-ui-01.md).

UI 02: `Detail.jsx` compone ficha, `PropertyGallery.jsx` y `BookingPanel.jsx`, con CSS diferido propio. `booking-selection.js` traslada fecha/horario/personas desde catálogo/mapa y autenticación. Consultas de precio cancelables/revisionadas; intentos de escritura con UUID estable y recuperación manual mediante sessionStorage por usuario/propiedad. No es cola offline ni garantía de precio reservado. Decisión y límites: [ADR-004](decisions/ADR-004-booking-ui-state.md).

UI 03: `Workspace.jsx` comparte pestañas accesibles, estados de consulta y listas filtradas sobre datos cargados; `Reservations.jsx` comparte filas/orden/filtros entre cliente y propietario. `workspace.css` acompaña las rutas diferidas. Owner/Admin sincronizan sección con URL, sus consultas privadas incluyen usuario y se habilitan según sección. La llegada privada de cuenta se solicita bajo demanda con cancelación/revisión de respuesta. No se agregan endpoints ni paginación server-side. [ADR-005](decisions/ADR-005-workspace-ui.md).

React Native/Expo 57 consume la misma API por bearer. Sesion en SecureStore; catalogo, registros propios y cola en AsyncStorage por usuario. NetInfo activa reintentos; una operacion offline no confirma disponibilidad ni precio. El servidor decide al sincronizar.

Node.js 24/Express 5 es la unica autoridad de negocio. Modulos: auth, properties, bookings, management, images y worker. Consultas parametrizadas con pg, contratos Zod, transacciones y autorizacion por recurso. Hay funciones de dominio reutilizables, pero no una capa de repositorios separada para cada entidad.

PostgreSQL 16 es fuente de verdad. Exclusiones GiST, claves, checks e indices protegen invariantes. Los eventos de notificacion se guardan junto a la reserva; su entrega interna ocurre despues mediante outbox y retry.

PHP 8.5 solo genera un reporte CLI sobre una vista agregada. No autentica clientes, escribe reservas ni duplica reglas del backend.

## Seguridad y archivos

Cookie HttpOnly/SameSite para web con CSRF; token opaco hasheado en DB para mobile. Identidad y permisos leidos del servidor. Scrypt para contrasenas. Datos de llegada separados de datos publicos.

Uploads limitados, decodificados por Sharp, sin metadatos, convertidos a WebP y nombrados con UUID. La ruta de entrega vuelve a comprobar visibilidad. Almacenamiento local/volumen Docker; falta estrategia de replicas, backup de archivos y tamanos derivados.

## Entornos

Desarrollo: cluster exclusivo en .local y procesos locales; nunca reutiliza datos ajenos. Pruebas: base temporal con migraciones reales. Compose: PostgreSQL, migrador, API, web nginx no privilegiado y reporte opcional. Dockerfiles/configuracion existen y las imagenes construyen en CI Linux; falta ejecutar el stack completo, health checks y volumenes con motor Docker.

CI construye las imagenes y ejecuta gates sobre PostgreSQL efimero; la corrida final aprobada es `36256453136`. Produccion requiere TLS, dominio, secretos administrados, monitoreo, backups externos, rollback y pruebas de staging. No hay proveedor elegido ni despliegue realizado.

## Limites conocidos

Búsqueda actualizada el 2026-10-25: selección/clasificación/paginación en PostgreSQL sin recorte de 500 candidatos, con hidratación únicamente de la página y alternativas seleccionadas. Etapas exclusivas y fechas verificadas, límites configurados, pesos administrables conservados y contrato aditivo; ver [ADR-012](decisions/ADR-012-progressive-search.md). Falta medir carga representativa. Listados privados conservan sus límites. Rate limiting vive en memoria por proceso; no es distribuido. El worker vive en el proceso API y usa SKIP LOCKED para evitar entregas simultáneas.

No existen proveedores de email/push/WhatsApp ni integracion MCP de redes sociales. Enlaces sociales validados no equivalen a integracion autenticada.

La revisión de fase 7 alinea nombres accesibles con el texto visible de tarjetas/galería y usa contenido nativo más identidad auxiliar en el menú de cuenta. La regla experimental de coincidencia de etiquetas queda habilitada explícitamente en las regresiones de resultados/ficha; ocho comprobaciones reales adicionales sin violaciones detectadas.
