# Arquitectura implementada

Actualizado: 2026-09-19. Decisiones base: [ADR-001](decisions/ADR-001-foundation.md), [ADR-002](decisions/ADR-002-security-bookings-offline.md), [ADR-003](decisions/ADR-003-legacy-ui-integration.md).

## Componentes

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

Produccion requiere TLS, dominio, secretos administrados, monitoreo, backups externos, rollback y pruebas de staging. No hay proveedor elegido ni despliegue realizado.

## Limites conocidos

Busqueda puntua hasta 500 candidatos y pagina de 20 en 20; la respuesta informa searchLimited. Listados privados tambien tienen limites. Debe sustituirse por consultas/paginacion escalables antes de volumen real. Rate limiting vive en memoria por proceso; no es distribuido. El worker vive en el proceso API y usa SKIP LOCKED para evitar entregas simultaneas.

No existen proveedores de email/push/WhatsApp ni integracion MCP de redes sociales. Enlaces sociales validados no equivalen a integracion autenticada.
