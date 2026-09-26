# ADR-005 — Presentación progresiva de cuenta y gestión

Fecha: 2026-09-19. Estado: adoptado en UI 03 autorizada.

## Contexto

Cuenta, propietario y administración ya tenían operaciones reales. Su presentación concentraba métricas, identificadores y listas extensas, con estados de error que podían acabar dibujando vacíos. El usuario pidió integrar la identidad artesanal y reducir información innecesaria visible, conservando tecnologías/capacidades.

## Decisión

- Extraer `WorkspaceTabs`, `QueryState`, `RecordList` y las reservas compartidas.
- Usar `?section=` para navegación de propietario/admin, con validación de claves conocidas.
- Mostrar tres métricas principales; actividad adicional y detalles técnicos bajo desplegables.
- Aplicar búsqueda, filtro y lotes **solo sobre registros cargados**, indicando ese alcance. No simular paginación completa del backend.
- Mantener campos, endpoints y acciones existentes, agrupando los formularios y separando fotos/contacto/redes.
- Separar calendario mensual compacto y agenda legible para móvil.
- Conservar tablas semánticas desplazables en vez de esconder columnas funcionales.

## Razones y consecuencias

Evita duplicar negocio o migrar datos para una mejora visual. La lista de reservas se reutiliza en cliente, propietario y agenda sin arrastrar la pantalla completa de cuenta. Carga/error/éxito coherentes impiden afirmar que no hay datos cuando la consulta falló.

La UI depende de los límites de API actuales; «Mostrar más» amplía la presentación del lote cargado, no ejecuta una búsqueda global. La autorización sigue siendo server-side. Las claves de consultas privadas incluyen usuario y el contenido de secciones administrativas se remonta al cambiar contexto.

Evidencia, archivos y pendientes: [UI 03](../phases/integration-ui-03.md).
