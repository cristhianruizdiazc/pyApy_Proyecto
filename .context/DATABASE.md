# PostgreSQL de pyApy

Actualizado: 2026-09-17. Esquema inicial creado desde cero; no se migro ninguna base previa.

## Instancia y roles

Cluster exclusivo: `.local/postgres`, 127.0.0.1:55432, base `pyapy`. Credenciales generadas en `.env`, fuera de Git.

| Identidad | Uso |
| --- | --- |
| pyapy_local | Administracion local, migraciones y pruebas de restore |
| pyapy_app | API; sin superusuario, creacion de roles ni bases |
| pyapy_reporter | Solo SELECT sobre administrative_property_report |

`database/permissions.sql` revoca acceso de la API a schema_migrations y UPDATE/DELETE de auditoria. La preparacion reaplica permisos tras migrar. En contenedores, pyapy_bootstrap reemplaza al administrador local.

## Migraciones aplicadas

- `001_initial.sql`: extension btree_gist, entidades, constraints, indices, catalogos y configuracion inicial.
- `002_reporting.sql`: vista administrativa agregada para PHP.

El migrador registra checksum, usa bloqueo asesor y transaccion. Alterar una migracion ya aplicada produce error; agregar una migracion nueva. No hay rollback destructivo automatico.

## Modelo

Identidad: users, sessions y owner_profiles. Catalogo: geographic_locations, amenities, properties, property_amenities, property_images, property_social_networks. Datos privados: property_private_data. Condiciones: pricing_rules y availability_rules.

Operaciones: reservations, favorites, reviews, search_intents, notifications y notification_jobs. Negocio: subscription_plans, subscriptions, sponsors y sponsor_campaigns. Control: matching_weights, analytics_events, audit_logs y schema_migrations. Consultar los SQL para nombres de columnas y relaciones exactos.

## Reservas

Reservas pyApy, particulares y bloqueos comparten reservations mediante kind. Estado confirmado/cancelado. GiST EXCLUDE combina propiedad y tstzrange con limites [inicio, fin), solo para confirmadas: permite intervalos contiguos, rechaza solapamientos de cualquier origen.

Creacion toma bloqueo de propiedad y bloqueo asesor de idempotencia. Clave UUID por usuario y hash del contenido; replay devuelve el resultado previo, contenido diferente produce conflicto. Precio entero PYG y politica de cancelacion quedan fijados al crear. Edicion de capacidad/horarios no puede invalidar compromisos vigentes.

Fechas timestamptz; reglas comerciales interpretadas en America/Asuncion. Mantenimiento acepta desde un minuto sin heredar minima comercial.

## Privacidad y auditoria

Coordenadas publicas redondeadas a tres decimales. Direccion, telefono y coordenadas exactas no aparecen en catalogo. Llegada exige reserva confirmada y autorizacion por recurso. Auditoria append-only con trigger, ademas de permisos limitados del rol API.

## Backup verificado

`npm run db:verify-restore` genero dump y checksum, restauro en base temporal nueva y comparo users, properties, reservations, audit_logs y schema_migrations; tambien comprobo exclusion GiST. No equivale a ensayo de desastre en produccion. Los archivos multimedia requieren backup separado.

Datos locales: seis propiedades ficticias mas registros auditables de pruebas E2E. Nunca copiar este dataset a produccion.
