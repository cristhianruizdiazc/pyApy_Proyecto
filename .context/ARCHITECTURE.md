# Arquitectura implementada

Actualizado: 2026-09-17. Decisiones base: [ADR-001](decisions/ADR-001-foundation.md), [ADR-002](decisions/ADR-002-security-bookings-offline.md).

## Componentes

Web React 19/Vite consume `/api/v1` mediante cliente compartido y TanStack Query. Rutas de paneles y mapas se cargan bajo demanda. Leaflet usa OpenStreetMap con atribucion y coordenadas publicas aproximadas.

React Native/Expo 57 consume la misma API por bearer. Sesion en SecureStore; catalogo, registros propios y cola en AsyncStorage por usuario. NetInfo activa reintentos; una operacion offline no confirma disponibilidad ni precio. El servidor decide al sincronizar.

Node.js 24/Express 5 es la unica autoridad de negocio. Modulos: auth, properties, bookings, management, images y worker. Consultas parametrizadas con pg, contratos Zod, transacciones y autorizacion por recurso. Hay funciones de dominio reutilizables, pero no una capa de repositorios separada para cada entidad.

PostgreSQL 16 es fuente de verdad. Exclusiones GiST, claves, checks e indices protegen invariantes. Los eventos de notificacion se guardan junto a la reserva; su entrega interna ocurre despues mediante outbox y retry.

PHP 8.5 solo genera un reporte CLI sobre una vista agregada. No autentica clientes, escribe reservas ni duplica reglas del backend.

## Seguridad y archivos

Cookie HttpOnly/SameSite para web con CSRF; token opaco hasheado en DB para mobile. Identidad y permisos leidos del servidor. Scrypt para contrasenas. Datos de llegada separados de datos publicos.

Uploads limitados, decodificados por Sharp, sin metadatos, convertidos a WebP y nombrados con UUID. La ruta de entrega vuelve a comprobar visibilidad. Almacenamiento local/volumen Docker; falta estrategia de replicas, backup de archivos y tamanos derivados.

## Entornos

Desarrollo: cluster exclusivo en .local y procesos locales; nunca reutiliza datos ajenos. Pruebas: base temporal con migraciones reales. Compose: PostgreSQL, migrador, API, web nginx no privilegiado y reporte opcional. Dockerfiles/configuracion existen, pero falta ejecucion con motor.

Produccion requiere TLS, dominio, secretos administrados, monitoreo, backups externos, rollback y pruebas de staging. No hay proveedor elegido ni despliegue realizado.

## Limites conocidos

Busqueda puntua hasta 500 candidatos y pagina de 20 en 20; la respuesta informa searchLimited. Listados privados tambien tienen limites. Debe sustituirse por consultas/paginacion escalables antes de volumen real. Rate limiting vive en memoria por proceso; no es distribuido. El worker vive en el proceso API y usa SKIP LOCKED para evitar entregas simultaneas.

No existen proveedores de email/push/WhatsApp ni integracion MCP de redes sociales. Enlaces sociales validados no equivalen a integracion autenticada.
