# ADR-012 — Búsqueda por etapas

Fecha: 2026-10-25, America/Asuncion. Estado: adoptado para implementación local, sin despliegue.

## Parte 1 — Motor y contratos

La inspección confirmó `properties.mjs`, capacidad/tipo previos, pesos administrables, ciudad/presupuesto binarios, capacidad constante, seis alternativas y selección de 500 propiedades por antigüedad. `otherDates` no verificaba otra fecha. No se encontró `notas.md` ni auditoría original externa; se consultó la auditoría de Fase 22, sin atribuirle reglas nuevas. La petición actual autoriza esta entrega; no autoriza producción.

PostgreSQL filtra, clasifica, cuenta, ordena y pagina todo el catálogo elegible. Node hidrata únicamente los IDs seleccionados (20 exactas más el máximo de alternativas). No se sustituye el límite de 500 por una carga completa en memoria. La transacción usa snapshot repeatable read, límite de consultas y timeout por sentencia; un fallo técnico produce error HTTP, nunca inventario vacío. El costo de evaluar el catálogo sigue dependiendo de su tamaño: falta carga representativa y EXPLAIN en producción.

Son obligatorios publicación, propietario activo, capacidad, tipo solicitado y `requiredAmenities`. Las reglas estructuradas existentes son capacidad, servicios, apertura/duración, estado y reservas/bloqueos. El texto libre `rules` se conserva: no se inventa un intérprete de restricciones textuales. Un requisito crítico representable como servicio debe enviarse como indispensable. Nuevas restricciones estructuradas exigirán contrato y validación autoritativa propios.

Etapas exclusivas: `exact`, `location`, `budget`, `services`, `schedule`. Cada alternativa cambia una sola condición. No se incluyen combinaciones; no se alteran personas, tipo, duración ni originales. `strictCity` y `strictBudget` deshabilitan sus ampliaciones; los servicios indispensables nunca se omiten. Los pesos existentes ordenan dentro de etapa y no habilitan propiedades inválidas. Orden: etapa, banda de radio en ubicación, orden solicitado (`match`, `price`, `capacity`), UUID ascendente. Exactas paginadas de 20; alternativas son una selección independiente que se mantiene al cambiar página. Cada propiedad aparece en una sola etapa.

Distancia Haversine desde coordenadas públicas aproximadas de la propiedad al punto de referencia de `geographic_locations` de la ciudad solicitada; no representa camino ni tiempo por carretera. Ciudad desconocida: no se amplía ubicación sin referencia. Presupuesto = precio horario × techo de horas del intervalo. Sin fechas = mínimo de horas de cada propiedad y disponibilidad `unchecked`; `available=false`, sin promesa de reserva.

`schedule` conserva duración y todos los demás criterios. Explora desplazamientos posteriores del inicio original, en pasos horarios configurables, hasta el menor de ventana y número de sondeos por propiedad. Comprueba reglas en America/Asuncion y solapamientos de reservas confirmadas de todos los tipos, incluidos bloqueos. Ofrece como máximo un intervalo por propiedad y el límite global de intervalos; no promete explorar todos los horarios posibles. Una duración incompatible no se corrige automáticamente ni se denomina “ocupado”. `search_period_valid` replica las reglas existentes y tiene prueba de paridad con `validatePeriod`. Reserva/cotización siguen recalculando precio y comprobando disponibilidad, estado activo y capacidad; GiST protege concurrencia.

Configuración inicial validada al arrancar mediante JSON `SEARCH_CONFIG` (claves desconocidas rechazadas):

| Clave               | Inicial    | Validación                                                    |
| ------------------- | ---------- | ------------------------------------------------------------- |
| radiiKm             | [15,30,50] | 1–5 radios positivos, crecientes, hasta 200 km                |
| maxOverpricePercent | 20         | 0–50 %                                                        |
| alternatives        | 6          | 1–30, total entre etapas B–E                                  |
| windowDays          | 7          | 1–30 días posteriores                                         |
| maxIntervals        | 6          | 1–30, además del máximo de alternativas                       |
| maxProbes           | 168        | 1–720 desplazamientos por propiedad                           |
| stepHours           | 1          | 1–24 horas                                                    |
| timeoutMs           | 5000       | 100–10000 ms por sentencia                                    |
| maxQueries          | 5          | 5–10 sentencias de búsqueda, excluyendo BEGIN/COMMIT/ROLLBACK |

Hay cinco consultas como máximo: aislamiento, timeout, selección, hidratación opcional, evento agregado. No hay consultas por cada intervalo desde Node. El máximo de intervalos devueltos no es el número de sondeos. Timeout y pool compartido limitan ejecución, pero no sustituyen rate limiting distribuido ni pruebas de carga. Los parámetros pueden modificarse sin cambiar el algoritmo. Los límites se comunican en `limits`; no se devuelve una respuesta parcial ante timeout.

Migraciones versionadas `004_progressive_search.sql` (función de períodos, índice y analítica) y `005_search_intent_preferences.sql` (preferencias indispensables del interés guardado). No se alteran migraciones ya aplicadas ni pesos. Guardar el interés conserva también `requiredAmenities`, `strictCity` y `strictBudget`, además del intervalo y personas originales.

Se eligieron etapas exclusivas frente a conservar un ranking global de similitud: un puntaje alto no debe ocultar qué requisito cambia ni permitir una reserva inválida. Se descartó cargar todo el catálogo en Node; la selección se hace en DB. Consecuencia: SQL debe conservar paridad con las reglas autoritativas y medirse a escala real antes de fijar SLO.

## Parte 2 — Experiencia web y mobile

La web conserva URL/borrador, presenta exactas primero, agrupa alternativas y explica distancia/referencia, exceso, servicios faltantes, total/base y fechas. El enlace de una alternativa de horario lleva explícitamente `proposedInterval` al detalle y reserva sin cambiar la URL de búsqueda original. La etapa se conserva tras autenticación para atribución. No se presenta “0 espacios” como encabezado si hay alternativas; fallos tienen error y reintento. “Más filtros” expone ciudad/presupuesto estrictos y selección independiente de servicios opcionales/indispensables.

Se conserva el turno inicial de **24 horas**, de 09:00 a 09:00 siguiente: puede excluir propiedades con máximo menor o apertura diurna incluso si hay inventario para ocho horas. La etapa E mantiene esas 24 horas; no inventa una estancia más corta. El usuario puede seleccionar Día, Mañana, Tarde o personalizar el horario.

ADR-011 mantiene React Native congelado y fuera de v1: no se modificó `apps/mobile`, no se reactivó paridad nativa y no se afirma verificación en dispositivos. Se preservan campos y arrays compartidos; se añaden metadatos sin quitar los existentes. `otherDates` ahora contiene únicamente opciones con intervalo verificado. La web responsive es el consumidor activo adaptado. Caché/cola offline conservada no equivale a una verificación online y el servidor vuelve a validar al sincronizar. Una reactivación nativa debe presentar las diferencias y consumir `proposedInterval` antes de ofrecer estas opciones como reservables.

## Parte 3 — Pruebas, documentación y medición

Cobertura y ejecución de esta entrega: ver [informe](../phases/progressive-search-2026-10-25.md). Los escenarios API usan PostgreSQL temporal real, con catálogo superior a 500; los E2E nuevos interceptan la respuesta de búsqueda para verificar presentación y navegación, y utilizan fichas reales. No confundir esos fixtures con inventario verificado por el motor.

Se reutiliza `analytics_events`: cada GET de búsqueda exitoso registra `event=search` y `search_outcome=exact|alternatives|empty`; el clic de tarjeta registra `search_select` con `search_stage`; el servidor guarda etapa en `reserve` dentro de la transacción de confirmación. No se registran ciudad, coordenadas solicitadas, personas, presupuesto, identidad del buscador ni texto de servicios en estos eventos. No se añade proveedor ni dependencia.

Medición por ventana temporal sobre `created_at`:

- Sin exactas: búsquedas con outcome alternatives o empty / búsquedas con outcome no nulo.
- Sin alternativas útiles: outcome empty / búsquedas con outcome no nulo. Para medir sólo entre búsquedas sin exactas, usar ese denominador explícitamente.
- Selección por etapa: contar `search_select` agrupado por search_stage.
- Reservas derivadas: contar `reserve` con search_stage distinto de exact y no nulo, agrupado por etapa. El replay no inserta un nuevo evento.

Son conteos de solicitudes, clics y confirmaciones; recargas/reintentos exitosos cuentan otra búsqueda. No hay identificación de sesión de búsqueda ni atribución causal entre dispositivos. La etapa es una etiqueta validada de origen cliente, no prueba antifraude de una exposición anterior. Una reserva modificada después de seleccionar mantiene atribución de origen; no demuestra que mantuvo cada criterio original. Eventos de selección pueden perderse por red; analytics no bloquea navegación. No se publican tasas medidas ni conversiones obtenidas. Retención y protección antiabuso siguen pendientes.
