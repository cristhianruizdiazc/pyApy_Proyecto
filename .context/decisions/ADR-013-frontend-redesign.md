# ADR-013 — Rediseño web basado en el prototipo

Fecha: 2026-11-03, America/Asuncion. Actualizado: 2026-11-08. Estado: **ADOPTADO; fases 0–7 completadas en su alcance local**.

## Contexto

El usuario pidió evaluar `.context/Prototipo-con-mapa-integrado.zip` y después decidió replicar lo máximo posible su estructura preservando las funcionalidades actuales. Descartó expresamente los precios por noche y el mapa esquemático; confirmó continuar con OpenStreetMap. Solicitó un plan por fases e indicó que `.local/audit-2026-10-28/TAREAS.md` deja de ser la guía de mejora web.

## Opciones

1. Sustituir el frontend por el HTML y comportamiento de demostración: pierde integración, reservas y continuidad.
2. Mantener la estructura actual y aplicar cambios cosméticos: no satisface la fidelidad estructural solicitada.
3. Reproducir la estructura y el sistema visual del prototipo en `apps/web`, integrando las capacidades reales existentes.

## Decisión

- Adoptar la tercera opción. El nuevo [plan de rediseño](../phases/rediseno-frontend-2026-11-03.md) organiza este trabajo por fases y registra su estado.
- Conservar React/Vite, React Router, TanStack Query, CSS propio y la API vigente. No se necesita reemplazar backend, contratos ni persistencia para ejecutar este alcance visual.
- Conservar tarifas por hora, cálculo y validación autoritativos, selección horaria y turno inicial de 24 horas de ADR-012.
- Conservar Leaflet/OpenStreetMap, atribución, coordenadas públicas aproximadas y separación de datos privados de llegada. Se descarta el mapa esquemático del prototipo.
- Conservar búsqueda por etapas, requisitos indispensables, alternativas explicadas, paginación, favoritos, intereses, navegación con contexto, autenticación, tres roles, reserva e idempotencia, cuenta y gestión.
- Adoptar la estructura y el sistema visual del prototipo con las adaptaciones necesarias para esas funciones. Los textos nocturnos, datos fijos y formularios simulados se reemplazan por sus equivalentes reales.
- `TAREAS.md` deja de gobernar la secuencia, alcance y criterios de cierre de las mejoras web. Se conserva como registro histórico; sus tareas pendientes no se trasladan automáticamente al nuevo plan. Las capacidades implementadas y la evidencia previa siguen siendo útiles para detectar regresiones.
- Este rediseño reemplaza la limitación de trabajar únicamente sobre ajustes visuales menores de la auditoría anterior. Actualiza la dirección de presentación de ADR-003 y la guía visual en lo necesario; conserva sus decisiones de integración con la aplicación real y las garantías de ADR-002/004/005/012.
- Se mantiene ADR-011: web responsive para v1 y aplicación nativa congelada.
- La [fase 3](../phases/rediseno-fase-3-2026-11-07.md), autorizada tras revisar el cierre de fase 2, adapta resultados/tarjetas/alternativas y el contenedor del mapa real. Se conservan su apertura explícita/diferida y alcance de exactas de la página; lateral desde 1181 px y alternancia de vistas hasta 1180 px. Los campos reales y avisos de estimación/muestras amplían el contenido ilustrativo del prototipo, sin inventar datos ni modificar reglas/API/DB.

- La [fase 4](../phases/rediseno-fase-4-2026-11-07.md), autorizada expresamente, adapta el diálogo a la ruta de ficha: galería izquierda/contenido y reserva derecha desde 981 px; apilados hasta 980. Se conserva el desplazamiento del documento y galería sticky, sin duplicar la ficha ni reemplazar el flujo de reserva por la consulta ficticia. Resumen horario, precio del servidor, muestras, mapa y recuperación idempotente conservados. Sin cambios de API/DB ni despliegue.

- La [fase 5](../phases/rediseno-fase-5-2026-11-08.md), autorizada al cerrar fase 4, extiende el sistema a acceso y área personal, que no tienen una maqueta específica en el ZIP. Extrae el acceso diferido, reutiliza las tarjetas en Guardados y separa geometría personal de gestión, conservando consulta de perfil, contratos, CSRF, retornos validados, selección, acciones explícitas, datos privados por autorización y errores/reintentos. Sin cambios de API/DB ni despliegue.

- La [fase 7](../phases/rediseno-fase-7-2026-11-08.md), autorizada expresamente, cierra comparación visual, recorridos por rol, contraste Chrome/Firefox y rendimiento controlado. Optimiza entrega del logo original y corrige reflow de controles nativos/títulos/calendario sin cambios de dominio. Se preservan evidencias iniciales y se declaran límites de HTTPS, dispositivos y accesibilidad; sin despliegue.

## Razones

La estructura visual puede cambiar sin reemplazar las funciones y garantías del producto. Una nueva planificación explícita evita que las restricciones de una auditoría de ajustes menores impidan el rediseño solicitado o que el HTML de demostración sustituya comportamientos reales.

- La [fase 6](../phases/rediseno-fase-6-2026-11-08.md), autorizada al cerrar fase 5, completa propietario, administración, ayuda y estados comunes con el sistema visual. Navegación lateral/adaptable y formularios/tablas conservan URL, acciones, límites de registros y autoridad del servidor. Sin cambios de API/DB ni despliegue; fase 7 pendiente.

## Consecuencias y límites

- La fidelidad se evalúa mediante comparación visual con datos y estados equivalentes. Se documentan las diferencias necesarias para horarios, precio por hora, funciones adicionales y cartografía real.
- El HTML principal de la raíz del ZIP es la referencia visual fijada en fase 0; las diferencias con capturas y el ZIP anidado están registradas en su informe y no se mezclan sus variantes.
- Cuenta, acceso y paneles necesitan una extensión coherente del sistema visual porque el ZIP no especifica todas sus pantallas.
- Esta decisión registra la dirección expresamente elegida. La entrega inicial fue documental. La [fase 1](../phases/rediseno-fase-1-2026-11-04.md) implementa tokens/fuentes/controles y estructura compartida; cabecera sticky ocupa espacio para conservar las pantallas vigentes y los accesos reales se adaptan según sesión/rol. No incorpora cambios de negocio ni despliegue. Las composiciones de pantalla continúan según las fases 2–7.
- La [fase 2](../phases/rediseno-fase-2-2026-11-04.md), solicitada el 2026-11-04, aplica la composición de portada y buscador, anfitriones/pasos y sus anclas. Conserva filtros/URL, cálculo horario y publicación real; ajusta el contenedor del hero para alinearlo con la estructura compartida y mantiene controles adicionales aunque aumenten su altura. Resultados/tarjetas/mapa siguen para fase 3. No hay cambios de negocio ni despliegue.
