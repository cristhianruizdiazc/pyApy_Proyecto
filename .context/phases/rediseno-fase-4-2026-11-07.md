# Fase 4 del rediseño — ficha, galería y reserva

Fecha: 2026-11-07, America/Asuncion. Estado: **completada en su alcance local**. Autorización: «arranca con la fase 4 del rediseño». Guía: [plan](rediseno-frontend-2026-11-03.md), [ADR-013](../decisions/ADR-013-frontend-redesign.md) y [referencia fijada](rediseno-fase-0-2026-11-04/REFERENCIA.md). Alcance exclusivo de fase 4; no incluye despliegue.

## Resultado y arquitectura

`/espacios/:id` adapta el diálogo de la referencia a una página con URL: hoja blanca de 20 px, barra de ficha y anclas, galería sobre fondo papel a la izquierda e información/reserva a la derecha. Desde 981 px se muestran dos columnas; hasta 980 px se apilan. Se conservan acceso directo, recarga, historial, enlace compartible, selección del buscador y retorno validado a resultados. Similares mantiene sus enlaces y la tarjeta existente, sin ampliar el componente compartido de resultados.

Galería con foto principal completa, pie descriptivo y miniaturas seleccionables con `aria-pressed`. Conserva todas las imágenes, ampliación, navegación circular, sustituto de imagen fallida, cierre con Escape y restitución de foco. `Modal` recibe un `onKeyDown` opcional: las flechas de la galería funcionan desde cualquier control del diálogo, incluido Cerrar. Otros diálogos conservan su comportamiento.

Información basada en la API: capacidad, mínimo y horario, descripción, servicios, ubicación pública aproximada, reglas, cancelación, reseñas y redes. El mapa Leaflet/OSM sigue explícito y diferido, con atribución y coordenadas públicas. Las muestras no reciben formulario de reserva. No se inventan dormitorios, baños, valoraciones o formularios de WhatsApp.

`BookingPanel` conserva la máquina de estados, contratos, invalidación/aborto de cotizaciones obsoletas, autenticación con selección, validación del resultado, confirmación idempotente y recuperación de respuesta ambigua con el cuerpo/UUID original. La presentación incorpora intervalo, duración y personas antes de consultar. Este resumen no calcula ni decide precio o disponibilidad: el total cotizado y confirmado sigue procediendo del servidor. Se conservan fechas de varios días, horas nocturnas y America/Asuncion.

`detail.css` concentra las piezas de ficha/galería/reserva. Se retiran 53 reglas exclusivas de esas piezas de `styles.css`, incluidas variantes responsive y selectores de galería antigua sin consumidor. `sr-only`, controles, `form-row`, `description`, localizador y estilos de redes usados por propietario permanecen compartidos. No se acumulan nuevas variantes sobre las reglas sustituidas.

## Archivos de esta fase

Creado:

- `tests/e2e/redesign-detail.spec.js`.
- `.context/phases/rediseno-fase-4-2026-11-07.md`.

Modificado:

- `apps/web/src/Detail.jsx`, `PropertyGallery.jsx`, `BookingPanel.jsx`, `detail.css`, `styles.css` y `ui.jsx`.
- `tests/e2e/auth-return.spec.js`: anuncios de éxito limitados al componente de continuación y publicación desde su enlace vigente.
- `.context/README.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `DECISIONS.md`, `RISKS.md`, `TESTING.md`, `design/SISTEMA-VISUAL.md`, `decisions/ADR-013-frontend-redesign.md` y el plan de rediseño.

No se elimina ningún archivo en esta fase. Los cambios y archivos sin seguimiento anteriores se conservan; no se crea un commit que los mezcle. Resguardo previo por archivo y manifiestos de entrega en `.local/redesign-phase4-2026-11-07/`.

## Base de datos y seguridad

Sin cambios de esquema, migraciones, contratos, APIs, roles o reglas tarifarias. Sin nuevas dependencias. El backend conserva permisos, precio y disponibilidad definitivos. El rediseño no publica información privada ni habilita reservas de muestras.

Antes de escrituras se verifica `current_database() = pyapy_redesign_phase0_20261104`, host 127.0.0.1 y puerto 55432. Se reutiliza el runtime aislado de fase 0 en 4170/4171; las pruebas crean cuentas y propiedades ficticias allí. Las propiedades de integración se retiran de publicación al terminar y sus reservas confirmadas se cancelan. `npm test` usa una base temporal propia. No se dirige ninguna prueba de escritura a la aplicación habitual.

## Validación

| Comprobación | Resultado |
| --- | --- |
| Lint y build de producción | Aprobados |
| `npm test` | 36/36 API/contratos, incluida exclusión concurrente, idempotencia y reservas de muestras rechazadas |
| Siete suites E2E | **97 escenarios distintos aprobados y una omisión duplicada**; general 95 aprobados/dos fallos de localizador/una omisión, más revalidación 2/2 del recorrido completo de interés |
| Suite nueva `redesign-detail` | 9 aprobados, una omisión duplicada; API/teselas simuladas |
| Reflow | 12 anchos entre 320 y 1920, incluidos 980/981, con nombre largo; sin desbordamientos |
| Capturas con API real aislada | 30 de aplicación (24 fichas + galería/mapa/cotización en 390/1440) y dos del prototipo, sin errores de página ni desbordamientos |
| Axe | Ocho análisis reales y siete simulados, sin violaciones detectadas en esos estados |
| Formato/diff y resguardo | Prettier y `git diff --check`; copia previa y manifiesto de entrega con hashes |

Aceptación en Chrome instalado 156.0.8078.82 headless, escritorio y emulación móvil. No se suman repeticiones como escenarios nuevos. La nueva suite ejecuta el barrido de anchos una sola vez. La general usa `final-e2e.json`; `interest-e2e.json` conserva la revalidación 2/2. `initial-e2e.json` y `initial-new-e2e.json` conservan los intentos previos; `real-visual.json`, las capturas/análisis reales. Evidencias y resguardo: `.local/redesign-phase4-2026-11-07/`.

Reproducción, con runtime aislado activo y build construido:

```powershell
npx playwright test --config=.local/redesign-phase4-2026-11-07/final.config.mjs tests/e2e/detail-reservation.spec.js tests/e2e/auth-return.spec.js tests/e2e/search-return.spec.js tests/e2e/search-labels.spec.js tests/e2e/search-guests.spec.js tests/e2e/redesign-detail.spec.js tests/e2e/workspace.spec.js
node .local/redesign-phase4-2026-11-07/capture.mjs
```

El runtime de prueba se detiene al terminar. No se realiza despliegue ni se inicia fase 5.

La suite nueva intercepta todas las llamadas API y teselas. Comprueba miniaturas/ampliación, foco y flechas desde Cerrar, imagen fallida, reflow 320–1920 y umbral 980/981 con nombre largo, selección nocturna/18 personas/recarga, total del servidor, edición que invalida cotización, mapa explícito, reglas/reseñas/redes, error/reintento y muestra sin reserva. No acredita integración real por sí sola.

La integración existente de detalle cubre registro conservando selección, consultas obsoletas, cambio de propiedad, conflicto real posterior a cotización, respuesta perdida/malformada y recarga con el mismo UUID/cuerpo sin duplicación, importe recalculado y controles bloqueados durante envío. Retorno, etiquetas/personas, autenticación y paneles se comprueban con sus suites existentes.

## Incidencias registradas

- Primera regresión: 63 aprobados y 11 fallos en `auth-return`, debidos a localizadores anteriores a fases 2–3: Anfitriones ya es un ancla y el anuncio de conteo convive con el de éxito. Se actualizan los localizadores al control y anuncio correspondientes, conservando las expectativas de permisos y escrituras. Una traza de timeout registra además error de transferencia/ZIP; no se presenta como evidencia aprobada.
- Primera suite nueva: siete aprobados, dos fallos de flechas al abrir la galería y una omisión duplicada. El foco inicial estaba en Cerrar, fuera del contenedor que recibía las flechas. Se traslada el manejador al diálogo; no se debilita la comprobación.
- Durante la revalidación, la primera corrección de localizadores fue demasiado amplia y restringió también el aviso previo de ingreso al componente de continuación. Se conserva el localizador original de ese aviso y se revalida el recorrido completo.
- La copia aislada conserva las fotos/datos de su creación en fase 0; sus muestras tienen una foto. Las capturas reales no se atribuyen al catálogo actual de otro entorno. Las variantes con varias fotos y fallos usan datos controlados en la suite nueva; se identifican como simuladas.

## Diferencias deliberadas y pendientes

El prototipo es un diálogo con desplazamiento interno; la entrega es una ruta completa, con galería lateral sticky y desplazamiento del documento para soportar acceso directo y los controles reales. La reserva tiene más campos/estados que la consulta ficticia y aumenta la altura. Se usa tarifa por hora, intervalo/total real, selección exacta de personas y mapa OSM bajo demanda. Las imágenes conservan proporción, sin reemplazarlas por stock del prototipo.

Pendientes de fase 7: comparación y rendimiento globales, lectores reales, otros motores, dispositivos físicos, auditoría WCAG integral y validación HTTPS de staging. Axe y emulación/reflow parciales no certifican todo lo anterior. Los riesgos operativos existentes siguen vigentes.

## Próxima fase

Fase 5: presentación de ingreso/registro, cuenta, favoritos, reservas y notificaciones personales; conservar retorno validado, selección/tarea y confirmación explícita, cancelación, reseñas, datos de llegada autorizados, sesión vencida, errores y recuperación. Requiere la siguiente autorización del usuario; esta entrega no la inicia.
