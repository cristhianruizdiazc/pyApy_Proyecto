# Integración UI 03 — cuenta y paneles

Fecha: 2026-09-19. Estado: implementada y verificada localmente.

## Autorización y alcance

El usuario autorizó continuar con cuenta, favoritos, reservas propias y paneles de propietario/administrador después de [UI 02](integration-ui-02.md), y reiteró continuar durante la ejecución. Se conserva la obligación de documentar los cambios en `.context` y el stack de `sources/PROMPT_MAESTRO.md`.

Se revisaron estado, arquitectura, riesgos, decisiones, fase anterior, código de las tres pantallas, estilos, consultas/mutaciones administrativas y pruebas existentes. La integración mantiene las capacidades actuales de la API y la identidad artesanal definida en UI 01.

## Implementación

### Componentes compartidos

- `Workspace.jsx`: `QueryState` separa carga, error con reintento y éxito; nunca dibuja un vacío/indicador cero como sustituto de una consulta fallida.
- `WorkspaceTabs`: pestañas con nombre, estado, relación tab/panel, foco roving y teclas izquierda/derecha/Home/End. Los paneles principales reflejan la sección en `?section=...`, permitiendo enlaces e historial.
- `RecordList`: búsqueda local insensible a mayúsculas/tildes, filtro por estado, limpieza y «Mostrar más». Indica coincidencias y **registros cargados**. No es paginación de servidor ni aumenta los límites de API.
- `workspace.css`: superficies claras, marfil/verde, tipografía legible, tres métricas principales, tablas con desplazamiento contenido, formularios por secciones y adaptación móvil. Se carga junto a las rutas operativas, sin biblioteca visual nueva.
- `Reservations.jsx`: presentación compartida entre cliente, propietario y agenda. La lista se separa de `Account.jsx`, evitando importar toda la cuenta desde propietario.

### Cuenta, favoritos y reservas

- Navegación explícita entre Mi cuenta, Mis reservas y Guardados.
- Cuenta con bienvenida breve; datos de perfil bajo un desplegable y notificaciones «Sin leer»/«Todas», búsqueda y presentación por lotes de ocho.
- Favoritos filtrables por nombre/ciudad; eliminación conectada a la API existente.
- Reservas ordenadas con próximas/en curso primero, luego finalizadas y canceladas; búsqueda por espacio/localizador/nota y filtro de grupo.
- Nombre, fecha, estado, importe y origen visibles. Localizador, personas, política y notas bajo «Ver detalles». Acciones de llegada, cancelación y reseña conservadas.
- «Finalizada» es una etiqueta derivada de fecha para la presentación; no cambia el estado persistido `confirmed`/`cancelled`. «Sin importe» identifica los bloqueos del propietario.
- Cancelación y reseña muestran confirmación de operación e invalidan cachés relacionadas.
- La consulta de llegada privada tiene carga/error propios y AbortController/revisión. Cerrar el diálogo, cambiar vista o desmontar por usuario impide que una respuesta tardía lo reabra o muestre datos de otro contexto.

### Propietario

- Tres métricas principales en Espacios: cantidad de propiedades, reservas pyApy confirmadas e importe reservado. Visitas/guardados y aclaración de que no son cobros bajo «Ver actividad».
- Las otras pestañas dan prioridad a su tarea y no repiten todas las métricas.
- Consultas privadas con claves por usuario y habilitación según la sección activa. Error de calendario no se presenta como calendario libre.
- Lista de espacios con búsqueda, filtro publicado/borrador/suspendido y lotes de doce.
- Editor organizado en «Sobre tu espacio», «Tarifa y horarios» y «Ubicación y servicios». Conserva inputs y payload del CRUD vigente.
- Fotos/contacto separados en pestañas Fotos, Datos de llegada y Redes. Datos privados se consultan al abrir su pestaña; un error no muestra un formulario vacío que pueda sobrescribirlos. Upload, eliminación, contacto y enlaces oficiales permanecen conectados.
- Calendario mensual con selección de día y agenda. En móvil, un contador reemplaza los textos minúsculos dentro de cada celda; la agenda muestra la información completa cargada del día.
- Acción «Registrar ocupación» en la agenda; mantiene reserva particular/bloqueo, nota, horarios, UUID y validación del servidor. Se deshabilitan campos durante envío.
- Reservas compartidas con filtros y cancelación. Planes conservan solicitud/aprobación manual y precios de backend.

### Administración

- Encabezado y pestañas vinculadas a URL; contenido de sección separado y remontado al cambiar de sección, para no arrastrar editores/errores anteriores.
- Resumen con tres cifras principales; importe reservado y estado de notificaciones internas en bloques secundarios. Avisos fallidos siguen visibles.
- Búsqueda/estado y lotes de quince en registros cargados. Datos de cuenta/email y espacio/ciudad agrupados en celdas para reducir columnas.
- Tablas con caption, encabezados de columna y región enfocable/desplazable en móvil.
- Auditoría mantiene operación/fecha visibles y actor/recurso bajo «Identificadores».
- Operaciones existentes de usuarios, moderación, reseñas, planes, suscripciones, sponsors y matching conservadas. Guarda síncrona contra doble envío e invalidación de datos afectados tras guardar.
- Consultas segmentadas por usuario/sección. La autorización sigue en servidor; la UI no convierte pestañas o roles locales en permisos.

Decisión y límites de filtrado: [ADR-005](../decisions/ADR-005-workspace-ui.md).

## Archivos

### Creados

- `apps/web/src/Workspace.jsx`
- `apps/web/src/Reservations.jsx`
- `apps/web/src/workspace.css`
- `tests/e2e/workspace.spec.js`

### Modificados

- `apps/web/src/Account.jsx`
- `apps/web/src/Owner.jsx`
- `apps/web/src/Admin.jsx`

### Documentación

Este informe y `decisions/ADR-005-workspace-ui.md`; actualización de `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `RISKS.md`, `BACKLOG.md`, `CHANGELOG.md`, `TESTING.md`, `README.md`, `SECURITY.md`, `design/ARTESANAL.md` y `decisions/README.md`, todos dentro de `.context`.

Se creó además el auxiliar local ignorado `.local/cleanup-ui03-fixture.mjs` para reconciliar exclusivamente el fixture identificado de la ejecución interrumpida; detalle abajo. No se eliminaron archivos de aplicación, no se alteraron las carpetas de referencia preexistentes y no se creó commit.

## Arquitectura y datos

Se conserva React/JSX/CSS, Router, Query y los contratos/API actuales. React Native, Node, PHP, PostgreSQL, Docker y OpenStreetMap siguen con sus responsabilidades. Sin dependencias, endpoints, migraciones, roles ni reglas comerciales nuevos.

El filtrado opera solamente sobre respuestas ya autorizadas/cargadas: reservas cliente hasta 200, calendario propietario hasta 500 y varias listas administrativas hasta 200 según endpoint. La UI no promete que esos listados representen todo el histórico. No se eliminaron registros para conseguir minimalismo.

Las métricas reflejan agregados existentes; «importe reservado» no es ingreso cobrado. Las fechas de notificaciones/reservas y el día inicial del calendario se muestran en Paraguay. Los formularios administrativos de fechas conservan su implementación previa; una revisión completa de semántica de fechas queda pendiente.

## Pruebas

### Resultado final

| Comprobación | Resultado |
| --- | --- |
| `npm run check` | PASS: lint, 23 pruebas de dominio/contratos/API y build |
| `npm run lint` tras ajustes | PASS |
| `npm run build` final | PASS |
| `node scripts/verify-web-integration.mjs` final | **41 aprobadas, 1 omitida deliberadamente**, 42 casos configurados |
| `git diff --check` | Sin errores de whitespace; avisos LF/CRLF |
| Capturas | Cuenta escritorio, calendario móvil/320 px y administración móvil revisadas |

La omisión es la repetición móvil del barrido de portada que ya ejecuta sus anchos desde desktop. Ninguna prueba nueva de UI 03 se omite.

### Cobertura nueva

Siete escenarios ejecutados en escritorio y móvil:

1. Favoritos: filtrar/quitar; notificaciones: marcar leída y recuperarla en Todas.
2. Llegada privada real: no pública en la lista; cierre durante respuesta tardía, reapertura controlada y filtro de reservas.
3. Propietario: edición real de capacidad, contacto privado, subida/eliminación real de imagen y enlace oficial.
4. Pestañas por teclado/historial, agenda, creación real de bloqueo y cancelación desde reservas.
5. Administración: filtro, verificación/suspensión/publicación real de un espacio de prueba, auditoría desplegable y rechazo server-side de pesos que no suman 100.
6. Error de favoritos/calendario/resumen sin falso vacío o cero; acceso administrativo de cliente rechazado por UI y por HTTP 403 real.
7. Responsive y navegación de cuenta/calendario/usuarios a 320/390/768/1024/1440 px, sin desbordamiento del documento.

Notificaciones de ese escenario se interceptan para obtener un historial determinista; su entrega/persistencia real continúa cubierta por pruebas de API. Errores 503 se simulan solo en los casos de recuperación. Mutaciones de propietario, moderación, reserva, bloqueo, archivos y datos privados usan API/PostgreSQL reales.

### Fallos encontrados y resueltos

- La primera suite agotó dos esperas de 45 segundos al usar `getByLabel(..., exact: true)` con etiquetas que contenían `<select>` y sus opciones. Los controles sí tenían nombre accesible correcto. Se corrigieron los selectores a `getByRole('combobox', {name, exact:true})`. Reejecución dirigida: cuatro aprobadas.
- Esa primera ejecución alcanzó además el límite de 240 segundos de la herramienta durante la parte móvil; no se presenta como suite completa aprobada.
- La siguiente suite obtuvo 40 aprobadas y un timeout en la captura final móvil. Se redujo el coste de captura a píxeles CSS, se desactivaron animaciones en capturas y se asignaron 90 segundos solo al escenario que recorre tres áreas y varios tamaños. Los asserts se conservaron. Reejecución dirigida: dos aprobadas; ejecución completa final: 41 aprobadas.

### Datos de prueba y limpieza

Los fixtures crean cuentas/propiedades/reservas auditables. Al terminar cancelan sus ocupaciones y despublican sus espacios; no vacían la base. La ejecución interrumpida dejó publicado `Gestión E2E 07250c57`, ID `702a75b9-5d5c-4182-a935-bf2876671c3b`. El auxiliar local verificó ID, nombre, descripción y entorno demo, canceló su única reserva confirmada y lo despublicó por API. No borró auditoría ni otros datos. Al cierre, la consulta pública no devolvió fixtures publicados de UI 03.

Autenticación de fixtures reutilizada en memoria por worker. El runner temporal conserva límites de seguridad, comparte la DB demo y detiene sus propios procesos; no reemplaza la instancia de desarrollo ni su metadata.

### Artefactos y tamaños

- `.local/screenshots/owner-*.png` y `admin-*.png`, suite previa conservada.
- `test-results/workspace-paneles-y-cuenta-*/{client,owner,admin}-<ancho>.png`, más `.last-run.json` final con estado `passed`.
- Entrada JS: 254,45 kB / gzip 79,95 kB.
- Workspace JS/CSS: 3,00 / 9,41 kB; gzip 1,38 / 2,17 kB.
- Reservations: 3,28 kB / gzip 1,26 kB.
- Account: 7,40 kB / gzip 2,68 kB; Owner: 22,42 / 6,46 kB; Admin: 12,89 / 3,86 kB.

Los tamaños son del build Vite, no mediciones Lighthouse ni aceptación de rendimiento real.

## Seguridad, límites y siguientes pasos

- Consultas privadas por usuario/contexto; llegada tardía descartada al cerrar/cambiar vista. Las respuestas y mutaciones continúan protegidas por el backend actual.
- Los datos privados se solicitan al abrir su sección; permanecen en la caché de Query autorizada durante la sesión. No se añadieron persistencia privada, tokens en navegador ni exportaciones.
- Tablas administrativas en móvil conservan desplazamiento horizontal para todas sus columnas; se evita reducirlas a texto ilegible.
- La paginación real de servidor, auditoría WCAG/lectores/zoom, cobertura E2E de **cada** mutación administrativa, semántica completa de fechas administrativas y performance siguen pendientes.
- Se mantienen los límites de recuperación offline, paridad React Native, activos culturales/fotográficos, Docker, CI y operación ya documentados.

Se cierra la tercera fase autorizada de integración visual. Propuesta siguiente: revisión transversal de accesibilidad, navegación y rendimiento del frontend integrado, sin iniciar otra fase automáticamente.
