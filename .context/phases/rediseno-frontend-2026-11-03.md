# Plan de rediseño del frontend

Fecha: 2026-11-03, America/Asuncion. Dirección adoptada en [ADR-013](../decisions/ADR-013-frontend-redesign.md). Actualización 2026-11-08: **fases 0–7 completadas en su alcance local**.

## Objetivo y guía de trabajo

Replicar lo máximo posible la estructura, composición y sistema visual de `.context/Prototipo-con-mapa-integrado.zip` sobre la web funcional de `apps/web`, preservando todas sus capacidades actuales.

Este documento será la guía de este rediseño. `.local/audit-2026-10-28/TAREAS.md` conserva valor histórico, pero deja de definir la secuencia, las restricciones de estructura y los criterios de cierre. Sus pendientes no constituyen automáticamente el alcance nuevo. Las comprobaciones de este plan se justifican por las funciones y pantallas que el rediseño afecta.

La preparación inicial de este plan y ADR-013 fue documental. Los cierres posteriores de las fases 0–7 están registrados debajo; el plan queda completado localmente.

## Alcance y límites

- **Destino:** web React responsive de `apps/web`, con sus rutas públicas, acceso, cuenta, reservas, favoritos, propietario, administración y ayuda.
- **Referencia:** HTML principal de la raíz del ZIP, su CSS, recursos y comportamiento adaptable. Capturas y ZIP anidado sirven de apoyo; no se mezclan sus variantes silenciosamente. La sección de destinos del ZIP anidado no se incorpora automáticamente al HTML principal.
- **Fidelidad:** distribución de secciones, proporciones, espaciado, tipografías, colores, imágenes de marca, tarjetas, botones, navegación y estados visuales. Las pantallas que el ZIP no diseña heredan el sistema, conservando sus funciones.
- **Excepciones decididas:** precio por hora y cálculo actual; Leaflet/OpenStreetMap real en lugar del dibujo esquemático. Se conservan horarios, turno inicial de 24 horas, cotización y confirmación reales.
- **Integración:** mantener API, contratos, roles y reglas. No convertir la aplicación en un catálogo estático ni trasladar los formularios simulados del prototipo.
- **Datos:** usar propiedades, fotos y servicios reales del entorno correspondiente; mantener la identificación de muestras. No inventar dormitorios, baños, valoraciones ni envíos de mensajes que la API no ofrece.
- **Fuera de este trabajo:** nuevas reglas tarifarias, nuevos canales de mensajería, nuevas funciones de negocio, migraciones de datos, aplicación nativa y despliegue. Cualquier necesidad adicional se registra aparte.

## Resumen de fases

| Fase | Entrega | Dependencia | Estado |
| --- | --- | --- | --- |
| 0 | Referencia visual definida, inventario funcional y punto de comparación | Ninguna | Completada (2026-11-04) |
| 1 | Sistema visual y estructura compartida de la web | 0 | Completada (2026-11-04) |
| 2 | Portada y buscador conectados con la nueva estructura | 1 | Completada (2026-11-05) |
| 3 | Resultados, tarjetas y mapa OpenStreetMap | 2 | Completada (2026-11-07) |
| 4 | Ficha, galería y reserva | 3 | Completada (2026-11-07) |
| 5 | Acceso, cuenta, favoritos y reservas personales | 4 | Completada (2026-11-08) |
| 6 | Propietario, administración y ayuda | 5 | Completada (2026-11-08) |
| 7 | Validación integrada, rendimiento y cierre documental | 6 | Completada localmente (2026-11-08) |

La secuencia es la prevista. Se comprueba cada entrega durante su fase; la fase final valida el conjunto y no sustituye las comprobaciones previas.

## Fase 0 — Fijar la referencia y proteger las funciones

**Estado (2026-11-04): completada en su alcance local de referencia, inventario y línea base.** [Informe y límites](rediseno-fase-0-2026-11-04/INFORME.md), [referencia visual fijada](rediseno-fase-0-2026-11-04/REFERENCIA.md) y [matriz funcional por ruta/rol/destino](rediseno-fase-0-2026-11-04/MATRIZ.md).

Resguardo verificado y restauración aparte de 50/50 archivos; 111 capturas, 16 análisis Axe sin violaciones detectadas en sus estados, 36/36 pruebas API/contratos y 104/110 E2E originales aprobadas. Los seis fallos iniciales y su diagnóstico están registrados; no se declaran corregidos. Cuatro corridas Lighthouse fijan transferencia/LCP/CLS. Las escrituras de navegador se ejecutaron en una copia de PostgreSQL identificada antes de iniciarlas. Sin cambios de UI ni contratos. Siguiente fase pendiente: 1.

**Trabajo**

- Identificar versión de ZIP y archivo de entrada; registrar las diferencias entre HTML principal, capturas y ZIP anidado. Usar el HTML principal como base y enumerar las excepciones necesarias.
- Inventariar rutas, secciones, acciones y estados actuales por rol: invitado, cliente, propietario y administrador. Incluir sponsors y sus eventos, intereses, reseñas, notificaciones, datos privados, planes, calendario, moderación y demás operaciones presentes.
- Relacionar cada función con su ubicación prevista en el diseño. Ninguna acción puede desaparecer por no existir en la maqueta.
- Registrar la situación del árbol de trabajo y proteger los cambios previos, incluidos los archivos aún sin seguimiento. Preparar un punto de recuperación que distinga esos cambios de los del rediseño.
- Obtener capturas de referencia del prototipo y de la aplicación con estados/datos comparables; registrar verificaciones iniciales y fallos preexistentes, sin atribuirlos al rediseño.
- Definir la matriz de páginas, estados y recorridos que se usará en las fases siguientes.

**Entregables:** composición visual de referencia, matriz función/ruta/rol/destino, capturas iniciales y registro de diferencias aceptadas por las reglas actuales.

**Cierre:** existe una referencia inequívoca, cada capacidad actual tiene destino y puede distinguirse una regresión de un problema previo.

## Fase 1 — Sistema visual y estructura compartida

**Estado (2026-11-04): completada en su alcance local.** [Informe, archivos, comprobaciones y límites](rediseno-fase-1-2026-11-04.md); [guía visual efectiva](../design/SISTEMA-VISUAL.md). Tokens y Fraunces/Poppins locales, cabecera/pie compartidos, navegación por sesión/rol y estados/controles base implementados. 36/36 pruebas API, 64/64 regresiones y 18 comprobaciones E2E compartidas/focalizadas aprobadas; dos barridos duplicados omitidos. Capturas reales aisladas y pruebas simuladas diferenciadas. Fase 2 pendiente.

**Trabajo**

- Extraer colores, tipografías, espaciados, bordes, sombras, tamaños y puntos de adaptación del prototipo.
- Integrar Fraunces/Poppins locales y conservar la marca elegida. Resolver las reglas globales que fuerzan Poppins y otros estilos que impiden reproducir el diseño.
- Organizar estilos compartidos y por pantalla para que los cambios no dependan de una acumulación de sobrescrituras. Retirar reglas reemplazadas conforme migre cada pantalla, con alcance comprobado.
- Construir cabecera, navegación, menú móvil y pie siguiendo la referencia, con variantes según sesión/rol que mantengan todos los accesos.
- Establecer presentación de formularios, botones, errores, carga, vacíos, avisos y diálogos. Incorporar foco visible, etiquetas, contraste y movimiento reducido desde esta fase.

**Entregables:** tokens y componentes compartidos; estructura de navegación funcionando en escritorio y móvil.

**Cierre:** la base visual reproduce la referencia; las rutas siguen accesibles y las pantallas aún no migradas mantienen sus controles utilizables. Comprobación de teclado, menú, marca y cambios de sesión.

## Fase 2 — Portada y buscador

**Estado (2026-11-05): completada en su alcance local.** [Informe, archivos, pruebas y límites](rediseno-fase-2-2026-11-04.md). Hero/buscador/beneficios/anfitriones/pasos conectados; resumen horario visible, precio por hora y presupuesto coherente con/sin fecha; URL, requisitos y publicación real conservados. 36/36 API, 87 escenarios E2E distintos aprobados y tres barridos duplicados omitidos (corrida general más revalidación de retorno); 13 capturas completas con API real, cinco Axe reales y ocho simulados sin violaciones detectadas. Fase 3 pendiente.

**Trabajo**

- Replicar hero, composición del buscador, beneficios, bloque para anfitriones, explicación de uso y disposición general del HTML principal.
- Adaptar el buscador a las capacidades existentes: ciudad, fecha, turno/horario, cantidad exacta de personas, presupuesto y filtros avanzados. Mantener visibles el intervalo elegido y la unidad de precio.
- Conservar URL y borrador, tipos de propiedad, servicios opcionales/indispensables y requisitos de ciudad/presupuesto. Las categorías se relacionan con los valores reales del contrato.
- Conectar «Publicá tu quinta» con el flujo real correspondiente a sesión y rol. Adaptar los textos comerciales a las capacidades que funcionan hoy.
- Conservar sponsors y accesos existentes dentro de la nueva composición.

**Entregable:** portada funcional con la nueva estructura y buscador conectado a la API actual.

**Cierre:** búsquedas representativas, incluida cantidad exacta de 18 personas y horarios personalizados, generan los mismos parámetros y conservan su selección. No se cambia el turno inicial de 24 horas ni la interpretación temporal de America/Asuncion.

## Fase 3 — Resultados y OpenStreetMap

**Estado (2026-11-07): completada en su alcance local.** [Informe, archivos y evidencia](rediseno-fase-3-2026-11-07.md). Tarjetas con precio horario/estimación, etapas y favoritos conservados; mapa real diferido con alcance de página, lateral desde 1181 px y alternancia hasta 1180 px.

**Trabajo**

- Reproducir tarjetas, categorías, resumen, orden y distribución de resultados con datos del servidor.
- Mantener exactas primero, alternativas por etapa con sus diferencias explicadas, paginación y guardado de interés; distinguir carga, error, vacío y disponibilidad sin comprobar.
- Integrar el mapa Leaflet/OpenStreetMap actual en un contenedor con el aspecto del prototipo, conservando atribución, coordenadas públicas y enlaces a fichas.
- En escritorio, mostrar la composición de tarjetas y mapa lateral cuando se active el mapa; en móvil/tablet, adaptar el control de vistas sin cruces ni pérdida de filtros. Se conserva por defecto la apertura explícita y la carga diferida del mapa real. Esta es una diferencia deliberada frente al mapa siempre visible del prototipo de escritorio.
- Mantener relación tarjeta/marcador, selección y presentación de intervalos alternativos. No ampliar inadvertidamente el alcance del mapa a resultados que la API no ha proporcionado.
- Conservar favoritos reales, eventos existentes de búsqueda/selección y retorno desde la ficha.

**Entregable:** resultados y mapa integrados con la nueva presentación.

**Cierre:** ningún filtro cambia al alternar vistas; precios y avisos son coherentes entre tarjeta, mapa y API. Funcionan exactas, alternativas, error, vacío, orden y paginación; el mapa conserva su carga bajo demanda.

## Fase 4 — Ficha y reserva

**Estado (2026-11-07): completada en su alcance local.** [Informe, archivos y evidencia](rediseno-fase-4-2026-11-07.md). Composición galería/contenido y reserva según el prototipo, miniaturas/visor accesible y resumen del intervalo; acceso/retorno, cotización y recuperación idempotente conservados. Lint/build, 36/36 API/contratos y 97 escenarios E2E distintos aprobados más una omisión de barrido duplicado, combinando general y revalidación de interés. 30 capturas de aplicación con API real aislada y dos del prototipo; 12 anchos de 320 a 1920, ocho Axe reales y siete simulados sin violaciones detectadas. Fases 5–7 pendientes.

**Trabajo**

- Trasladar composición de galería, información, servicios, ubicación y panel de acción del prototipo a la ficha real.
- Mantener la ruta `/espacios/:id`, acceso directo, recarga, historial, ficha compartible y retorno a resultados. La composición del diálogo de referencia se adapta a esa ruta sin introducir una segunda ficha aislada.
- Reutilizar selección y lógica actuales de `BookingPanel`: horarios, personas, cotización, confirmación, invalidación de respuestas obsoletas y recuperación de confirmación ambigua con el mismo cuerpo/UUID.
- Mantener reglas, disponibilidad, reseñas y operaciones actuales de la ficha. Ofrecer mapa real sin revelar datos privados de llegada.
- Sustituir «por noche» y el formulario simulado de consulta por precio horario, resumen del intervalo y acciones reales de reserva.

**Entregable:** ficha y flujo de reserva completos con la nueva presentación.

**Cierre:** funcionan acceso directo, edición, autenticación con selección conservada, cotización, rechazo, confirmación y recuperación. Cambiar de propiedad no cruza datos; los reintentos no duplican reservas y los importes siguen viniendo del servidor.

## Fase 5 — Acceso y área personal

**Estado (2026-11-08): completada en su alcance local.** [Informe, archivos y evidencia](rediseno-fase-5-2026-11-08.md). Acceso/registro, perfil de consulta, Guardados, reservas/diálogos y notificaciones según el sistema visual, con tareas/selección/retornos conservados y escrituras explícitas. Lint/build y 36/36 API/contratos aprobados; ocho suites E2E con 138 escenarios distintos aprobados y cuatro omisiones de barridos duplicados. 68 capturas con API real aislada en 12 anchos, 14 Axe reales y 20 de la suite nueva simulada sin violaciones detectadas. Fases 6–7 pendientes.

**Trabajo**

- Extender el sistema visual a ingreso/registro, cuenta, favoritos, reservas y notificaciones personales.
- Conservar retorno después de ingresar, validación de destinos locales y confirmación explícita de acciones pendientes.
- Mantener perfil, acciones de reservas, cancelación con sus reglas vigentes, datos privados autorizados y reseñas donde correspondan.
- Conservar estados de sesión vencida, permisos insuficientes, error y recuperación, sin presentar un error de consulta como ausencia de datos.

**Entregable:** experiencia personal coherente con la portada y la ficha.

**Cierre:** los recorridos de invitado a usuario autenticado conservan tarea y selección; funcionan favoritos, cuenta y reservas, y ningún cambio visual modifica permisos ni dispara escrituras por el solo hecho de ingresar.

## Fase 6 — Gestión y pantallas complementarias

**Estado (2026-11-08): completada en su alcance local.** [Informe, archivos, pruebas y límites](rediseno-fase-6-2026-11-08.md). Propietario, nueve secciones de administración, ayuda y estados complementarios con navegación y formularios adaptables. URLs, acciones, privacidad y límites cargados conservados. Lint/build/formato, 36/36 API y 132 E2E aprobados más cuatro omisiones duplicadas. 84 capturas reales, 36 Axe reales y 26 simulados sin violaciones detectadas. Reflow 320–1920, incluidos 1080/1081. Sin cambios de API/DB ni despliegue. Fase 7 pendiente.

**Trabajo**

- Adaptar propietario: alta de perfil, propiedades, edición, fotos, datos privados, redes, calendario, reservas/bloqueos y planes existentes.
- Adaptar administración: secciones presentes de métricas, usuarios, propiedades/moderación, reseñas, planes, suscripciones, sponsors, pesos y auditoría.
- Mantener formularios y columnas operativas, pestañas con `?section=`, agenda móvil, filtros sobre registros cargados y sus límites explícitos.
- Aplicar el mismo lenguaje a ayuda, acceso denegado y página no encontrada.
- No trasladar la estética comercial de la portada de una forma que dificulte leer tablas o completar operaciones de gestión.

**Entregable:** cobertura visual de todas las rutas actuales, incluidas las que carecen de maqueta específica.

**Cierre:** la matriz de la fase 0 queda cubierta por rol; todas las acciones siguen disponibles y las comprobaciones de permisos permanecen en el servidor. Tablas y formularios son operables en móvil y con teclado.

## Fase 7 — Validación integrada y cierre

**Estado (2026-11-08): completada en su alcance local.** [Informe, matriz, mediciones y límites](rediseno-fase-7-2026-11-08.md). 36/36 API, 241 E2E distintos en Chrome y siete omisiones duplicadas, más 42 en Firefox; 95 capturas, 44 Axe reales sin violaciones detectadas y 24 mediciones comparativas Lighthouse aceptadas con tres repeticiones por caso. Logo optimizado; reflow horario y texto ampliado corregidos. Recuperación y entrega revisable por hashes. HTTPS no ejecutado por Docker detenido; accesibilidad/dispositivos físicos y riesgos operativos declarados. Sin despliegue.

**Trabajo**

- Comparar capturas del prototipo y la implementación con viewport, datos y estado equivalentes. Corregir diferencias de geometría, tipografía, espaciado y recursos, dejando explícitas las excepciones funcionales y el mapa OSM.
- Recorrer búsqueda → alternativas → ficha → retorno → ingreso → cotización → confirmación → reserva personal; incluir rechazo, sesión vencida, respuesta ambigua y cancelación. Validar también gestión por rol según la matriz.
- Reutilizar y adaptar las pruebas existentes de marketplace, etiquetas/personas, búsqueda por etapas, mapa, retorno, autenticación, reserva y paneles. Añadir cobertura solo para riesgos nuevos o capacidades sin comprobación suficiente.
- Separar evidencia con API simulada de integración real. Ejecutar escrituras de prueba con cuentas/datos ficticios en una base aislada; identificarla y comprobar el aislamiento antes de escribir.
- Ejecutar lint, build, pruebas pertinentes y controles de formato/diff. Las pruebas TLS de staging se ejecutan en su entorno HTTPS, sin confundir fallos de entorno con fallos del rediseño.
- Revisar teclado, foco, contraste, etiquetas, anuncios, zoom/reflow, menús y galería; ejecutar Axe en estados representativos y contrastar navegadores disponibles. Registrar cualquier límite de dispositivos o asistencia que no se haya podido comprobar.
- Optimizar hero, logo, fuentes e imágenes; comprobar variantes, prioridad de carga, estabilidad visual y carga diferida. Comparar transferencia, LCP y CLS con la base de fase 0 bajo condiciones repetibles.
- Completar la guía visual efectiva, arquitectura donde cambie presentación, changelog, evidencias y estado del plan. Conservar un punto de recuperación revisable de la entrega.

**Entregables:** comparación antes/después, matriz funcional por rol, resultados de pruebas y mediciones, guía visual vigente y entrega local revisable.

**Cierre:** todas las fases cumplen su aceptación; no quedan regresiones funcionales conocidas ni diferencias visuales importantes sin explicación. Cada limitación de validación se declara expresamente; un control no ejecutado no se marca aprobado.

## Matriz visual y funcional común

- **Anchos de comparación del prototipo:** 360, 390, 430, 600, 820, 1024, 1366, 1440 y 1920 px, con sus alturas de referencia; comprobar además continuidad alrededor de los cambios de distribución. Verificar 320 px o reflow equivalente para conservar el alcance responsive de la web.
- **Estados por componente cuando correspondan:** inicial, hover/foco, seleccionado, deshabilitado, carga, error, vacío, éxito y sesión vencida.
- **Funciones que deben conservarse:** catálogo y filtros completos; horarios/personas/precio; exactas/alternativas; mapa; favoritos/intereses; URLs e historial; autenticación y roles; cotización/confirmación/cancelación; gestión y acceso autorizado a datos privados.
- **Comparación visual:** utilizar contenido controlado para juzgar proporciones, sin exigir que fotos, nombres o importes de propiedades reales coincidan con el catálogo ficticio del ZIP.

## Seguimiento y control de alcance

Cada fase actualiza su fila y registra archivos afectados, comprobaciones, capturas, diferencias deliberadas y asuntos pendientes. Estados: pendiente, en curso y completada; no cerrar por el solo hecho de compilar.

Antes de cambiar componentes compartidos, identificar las rutas afectadas. Verificar durante esa fase sus consumidores; reservar la repetición general para el cierre o para cambios que justifiquen ampliarla.

Si reproducir una pieza exige un nuevo dato o regla, usar primero el equivalente real disponible. Una ampliación de API/DB o de funciones se registra por separado y no se incorpora como supuesto oculto de este rediseño.

El resultado esperado es una web reconocible como el prototipo, con las funciones actuales completas y las excepciones acordadas de precio horario y OpenStreetMap.
