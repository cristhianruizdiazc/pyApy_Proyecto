# Fase 5 del rediseño — acceso y área personal

Fecha: 2026-11-08, America/Asuncion. Estado: **completada en su alcance local**. Autorización: «si, autorizo», en respuesta al cierre de fase 4 y su propuesta de continuar con acceso y área personal. Guía: [plan de rediseño](rediseno-frontend-2026-11-03.md), [ADR-013](../decisions/ADR-013-frontend-redesign.md), [referencia](rediseno-fase-0-2026-11-04/REFERENCIA.md) y filas A01–A10 de la [matriz funcional](rediseno-fase-0-2026-11-04/MATRIZ.md). Alcance exclusivo de fase 5; sin despliegue.

## Resultado y arquitectura

Ingreso/registro adopta una hoja blanca de 20 px con bloque forestal, fotografía de marca ya existente, Fraunces/Poppins locales y controles reales. La composición deriva del sistema visual del prototipo, que no tiene una maqueta específica de cuenta/acceso. La imagen es decorativa; no se atribuye a una propiedad comercial. En móvil se apilan el bloque de marca compacto y el formulario. Se conserva logo, enlace de salida local y pie.

`Auth.jsx` se extrae de `App.jsx` y se carga de forma diferida con `auth.css`. Conserva endpoints/cuerpo, CSRF, limpieza de caché de sesión, destino validado y continuación explícita. El modo se refleja en `?mode=registro`, se conserva al recargar y los cambios entre ingreso/registro mantienen datos y estado de retorno sin añadir entradas al historial. Durante el envío se bloquean campos y modo, con guard síncrono contra doble envío. El fallo mantiene datos y recibe foco. Se actualizan acentos de los textos/etiquetas de acceso y área personal, junto con sus pruebas.

`Account` usa geometría propia de 1200 px, encabezado Fraunces, navegación de cuenta en pastillas, bienvenida forestal, accesos a reservas/Guardados, perfil de consulta y notificaciones en tarjetas. Nombre y correo siguen siendo solo lectura: no se inventa una edición de perfil que no existe en la API. No se solicitan contadores ni se muestran métricas ficticias. Una sesión pendiente presenta carga; un fallo al comprobarla ofrece reintento y se distingue del estado de invitado.

Guardados reutiliza `SearchPropertyCard` y sus estilos, con encabezados h2 y tarifa horaria. Se omite el bloque de estimación del buscador, porque la API de favoritos no entrega ese total; se conserva disponibilidad sin comprobar. Sus enlaces no arrastran parámetros de reserva arbitrarios de la URL de Guardados. La búsqueda y el límite sobre registros cargados siguen en `RecordList`. Quitar favorito bloquea nuevos envíos mientras está pendiente, conserva la lista ante rechazo y permite recuperación explícita después de un 401: volver a ingresar mantiene destino y acción pendiente, sin quitar nada por el solo hecho de ingresar.

Reservas conserva `ReservationBrowser`/`Reservations` y sus reglas de clasificación, filtros, búsqueda, mostrar más y acciones. La presentación personal usa tarjetas con fecha, importe/estado, detalles progresivos y acciones, con reflow móvil. No se modifica su componente ni se cambia la presentación de reservas de propietario/calendario en esta fase. Se conservan cancelación y reseña explícitas, rechazo con borrador, confirmación del servidor, localizador/personas/origen y datos de llegada autorizados. Los diálogos reciben únicamente estilos de área personal; se conserva el descarte/aborto de respuestas de llegada al cerrar.

Notificaciones conserva sin leer/todas, consulta periódica, búsqueda/paginación local y acción de marcar leída. Se distinguen visualmente sus estados; el botón describe su mensaje. Durante la escritura se bloquean repeticiones, y un fallo no elimina el aviso. Los avisos de éxito reciben foco, también en acciones consecutivas. Los errores 401 de operaciones personales ofrecen reingreso al destino local sin confirmar automáticamente la operación pendiente.

`auth-continuation.css` presenta la tarea pendiente como tarjeta sobre el destino, con nombre/foco, botones y anuncios existentes. No cambia sus permisos ni dispara una acción por montar el componente. `account.css` concentra el área personal. La limpieza afecta 25 bloques de acceso/notificación/continuación de `styles.css` y 16 de cuenta/notificación de `workspace.css`; de una regla mixta se conserva el selector de actividad de propietario. Las reglas de reservas, listas, controles y paneles que siguen teniendo consumidores se mantienen. `results.css` comparte las reglas de tarjeta con `.account-page`, con la misma prioridad de selectores; portada/resultados conservan su contexto.

## Archivos de esta fase

Creado:

- `apps/web/src/Auth.jsx`, `auth.css`, `account.css` y `auth-continuation.css`.
- `tests/e2e/redesign-personal.spec.js` y `tests/e2e/fixtures/personal-area.js`.
- `.context/phases/rediseno-fase-5-2026-11-08.md`.

Modificado:

- `apps/web/src/App.jsx`, `Account.jsx`, `AuthContinuation.jsx`, `SearchPropertyCard.jsx`, `styles.css`, `workspace.css` y `results.css`.
- `tests/e2e/auth-return.spec.js`, `detail-reservation.spec.js`, `marketplace.spec.js`, `redesign-home.spec.js` y `workspace.spec.js`: etiquetas corregidas; el barrido de cuenta/paneles espera el contenido principal en lugar de una clase de composición antigua.
- `.context/README.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `DECISIONS.md`, `RISKS.md`, `TESTING.md`, `design/SISTEMA-VISUAL.md`, `decisions/ADR-013-frontend-redesign.md` y el plan del rediseño.

No se elimina ningún archivo. Los cambios y archivos sin seguimiento de fases anteriores se conservan. Copia previa, manifiesto y entrega por archivo con hashes en `.local/redesign-phase5-2026-11-08/`; no se hace un commit mezclando trabajo anterior.

## Base de datos y seguridad

Sin cambios de esquema, migraciones, APIs, contratos, roles, políticas de cancelación/precio o dependencias. El servidor sigue validando identidad, permiso por recurso, elegibilidad de reseña, cancelación y acceso privado. No se introducen enlaces de retorno externos ni se guardan credenciales. El rediseño no añade edición de perfil, recuperación de contraseña o canales de aviso que la aplicación no tiene.

Antes de pruebas de escritura y capturas se verifica `current_database() = pyapy_redesign_phase0_20261104`, host 127.0.0.1 y puerto 55432. Runtime aislado de fase 0: API 4170, web 4171 y prototipo 4172. Las pruebas usan cuentas/propiedades ficticias allí; no escriben en la aplicación habitual. `npm test` crea y elimina su base temporal propia.

Las capturas reales crean una cuenta, una propiedad y su foto ilustrativa, datos de llegada ficticios y dos reservas mediante la API existente. Favoritos, confirmación, cancelación, entrega interna de notificaciones y marcado de lectura proceden del servidor real. Al terminar, las reservas se cancelan y la propiedad vuelve a borrador; el resultado de limpieza queda en el reporte. Los escenarios de estadía terminada/reseña y fallos inyectados de la suite nueva son simulados y no se presentan como escritura real de una reseña. Las pruebas API comprueban sus permisos/reglas por separado.

## Validación

| Comprobación | Resultado |
| --- | --- |
| Lint, build de producción, Prettier y `git diff --check` | Aprobados |
| `npm test` | 36/36 API/contratos, base temporal propia |
| Ocho suites E2E, aceptación sobre build final | **138 aprobados, cero fallos y cuatro omisiones de barridos duplicados** |
| Suite nueva `redesign-personal` | 25 aprobados y un barrido duplicado omitido; API completamente simulada |
| Reflow nuevo | Cuenta, Guardados, reservas y registro en 12 anchos de 320–1920, incluidos 980/981 y textos largos, sin desbordamiento |
| Capturas reales | 68: cinco pantallas en 12 anchos + detalles/llegada/cancelación/notificaciones en 390/1440 |
| Axe | 14 reales y 20 de la suite nueva simulada, sin violaciones detectadas en sus estados |
| Captura final / limpieza de fixtures | Sin errores de página ni desbordamientos; reservas canceladas y propiedad en borrador, tres respuestas 200 |

Aceptación: Chrome 156.0.8078.82 headless, escritorio y emulación móvil. Las cuatro omisiones evitan repetir barridos de anchos en móvil; los recorridos funcionales sí se ejecutan en ambos proyectos. No se suman intentos previos ni revalidaciones como escenarios nuevos. Reportes: `acceptance-e2e.json`, `real-visual.json`, `initial-e2e.json`, `personal-e2e.json`, `rate-limited-e2e.json` y `rate-limit-evidence.json`, bajo `.local/redesign-phase5-2026-11-08/`.

Reproducción con runtime aislado recién iniciado (para no acumular la cuota de autenticación), identidad comprobada y build construido:

```powershell
node .local/redesign-phase5-2026-11-08/verify-isolation.mjs
npx playwright test --config=.local/redesign-phase5-2026-11-08/acceptance.config.mjs tests/e2e/auth-return.spec.js tests/e2e/workspace.spec.js tests/e2e/detail-reservation.spec.js tests/e2e/marketplace.spec.js tests/e2e/redesign-results.spec.js tests/e2e/redesign-shell.spec.js tests/e2e/redesign-home.spec.js tests/e2e/redesign-personal.spec.js
node .local/redesign-phase5-2026-11-08/capture.mjs
```

Se detiene el runtime aislado al terminar. Sin despliegue ni inicio de fase 6.

Nueva suite completamente simulada: modos/retornos y ausencia de escrituras al cambiar/ingresar, bloqueo de envío, foco/error de acceso, datos de consulta, notificaciones, Guardados, sesión vencida al quitar, cancelación con rechazo, llegada privada, reseña con borrador y reintento, errores frente a vacíos y fallo de sesión. Barrido de cuatro pantallas en 12 anchos de 320 a 1920 px, con nombre/correo/mensaje/nombre de propiedad largos; otras pruebas cubren emulación móvil. Axe en estados representativos, incluida cancelación/reseña rechazada y llegada.

Regresión existente: autenticación/continuación y destinos maliciosos, portada y publicación por rol, resultados/mapa, estructura compartida, selección/cotización/confirmación/recuperación, favoritos/reserva/cancelación con API real, datos de llegada y paneles por rol. Se conserva la identificación de escenarios simulados y de los parcialmente interceptados.

## Incidencias y límites

- La primera regresión dejó 94 aprobados, dos omisiones de barridos duplicados y dos fallos del localizador `.workspace-page` en el barrido de cuenta/paneles. El área personal dejó de usar esa clase para evitar heredar reglas de gestión; la prueba ahora espera el landmark `main` y conserva sus comprobaciones de navegación, anchos y estados. No se vuelve a introducir una cascada de estilos antigua para satisfacer ese localizador.
- La primera suite nueva dejó 25 aprobados y una omisión duplicada. Después se completaron las etiquetas acentuadas y el aviso de disponibilidad de Guardados. La revisión de foco añadió reinicio del aviso antes de cada operación para que también se anuncie y enfoque un segundo éxito con el mismo texto; se comprueba con dos bajas consecutivas. No se suman revalidaciones como escenarios nuevos.
- La corrida ampliada acumuló el límite de 30 intentos de autenticación en 15 minutos del mismo runtime: 114 aprobados, 24 fallos de preparación/ingreso y 4 omisiones. Se registra el aviso de rate limit y se repite la aceptación sobre el build final después de reiniciar únicamente el runtime aislado; no se cambia el limitador ni la configuración de seguridad del backend. Evidencia: `rate-limited-e2e.json` y `rate-limit-evidence.json`.
- La copia aislada conserva el catálogo existente al crearla en fase 0; no representa el catálogo actualizado de otro entorno. La propiedad/foto de captura se identifica como prueba y las demás propiedades de muestra conservan su aviso.
- Chrome instalado, headless, escritorio y emulación móvil. No se comprueban otros motores, dispositivos físicos, lectores reales, auditoría WCAG integral, rendimiento integrado o HTTPS de staging. Axe/reflow parciales no certifican esos controles. La validación integrada de fase 7 y los riesgos operativos existentes siguen pendientes.

## Próxima fase

Fase 6: propietario, administración y ayuda/estados complementarios. Adaptar formularios, fotos, datos privados, redes, calendario, ocupaciones, reservas/bloqueos y planes; administración de usuarios, moderación, métricas, sponsors, pesos y auditoría. Conservar `?section=`, permisos del servidor, límites de registros cargados, agenda móvil y acciones actuales. Requiere la siguiente autorización del usuario; esta entrega no la inicia.
