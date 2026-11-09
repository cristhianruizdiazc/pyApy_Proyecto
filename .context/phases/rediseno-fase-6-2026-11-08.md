# Fase 6 del rediseño — propietario, administración y ayuda

Fecha: 2026-11-08, America/Asuncion. Estado: **completada en su alcance local**. Autorización: «si, continua», en respuesta a la continuidad de fase 6 tras el cierre de fase 5. Guía: [plan](rediseno-frontend-2026-11-03.md), [ADR-013](../decisions/ADR-013-frontend-redesign.md) y [matriz funcional](rediseno-fase-0-2026-11-04/MATRIZ.md). Alcance exclusivo de fase 6; sin despliegue.

## Resultado y arquitectura

Propietario y administración adoptan la paleta papel/forestal, Fraunces/Poppins locales, paneles blancos y controles del sistema visual. El ZIP no contiene una maqueta específica de estas pantallas; la adaptación conserva densidad operativa, campos y columnas. Contenedor máximo de 1200 px, encabezados de 34–46 px y navegación lateral de 208 px desde 1081. Hasta 1080 se usan pestañas horizontales desplazables. No se trasladan bloques comerciales al interior de las tablas.

`WorkspaceTabs` incorpora la opción `navigation`, iconos y orientación que sigue el breakpoint. Mantiene tablist/tab/tabpanel, identificadores, selección y URL `?section=`, historial y navegación por flechas/Home/End; añade arriba/abajo a navegación principal. Las pestañas internas de medios mantienen el comportamiento horizontal predeterminado. `Modal` acepta una clase opcional; `management-dialog` limita el estilo nuevo a los formularios de gestión, con hoja blanca de 20 px, máximo 760 px y columnas que se apilan en móvil.

Propietario conserva incorporación, alta/edición de espacios, tarifas horarias y horarios, reglas, fotos, datos de llegada privados, redes, calendario, agenda, ocupaciones particulares/bloqueos, reservas/cancelación y planes. La privacidad se explica en el formulario; no se muestran datos privados en las filas públicas. La agenda y el filtro de propiedad mantienen su alcance sobre reservas cargadas y su advertencia de hasta 500. Se corrigen acentos en textos y etiquetas junto con las pruebas existentes.

Administración conserva sus nueve secciones: resumen, usuarios, espacios, reseñas, planes, suscripciones, sponsors, matching y auditoría. Métricas provienen de API; tablas mantienen columnas y acciones. La región enfocada permite desplazamiento horizontal por teclado en pantallas estrechas. Búsqueda, filtros, mostrar más y número de registros cargados siguen describiendo el alcance real; no se añade paginación del servidor. Planes, suscripciones, campañas y pesos conservan formularios, validación/rechazo y acciones explícitas.

Ayuda presenta tres pasos, cuatro preguntas frecuentes nativas y un bloque forestal de precio/privacidad/cancelación. Los textos describen funciones actuales sin detalles internos del backend. `PageState` unifica incorporación, invitado, fallo de sesión, acceso denegado y página inexistente, con salidas reales; el invitado administrativo puede ingresar conservando destino. Carga, error y vacío siguen diferenciados.

`workspace.css` concentra las reglas de gestión y mantiene controles consumidos por cuenta/reservas. Se retiran 68 bloques exclusivos reemplazados de `styles.css`; reservas, controles compartidos y otras rutas conservan sus reglas. La revisión de capturas corrigió la alineación de las flechas del calendario y el tamaño de las fotos con `picture` en las filas del propietario. No se añaden dependencias ni recursos gráficos.

## Archivos de esta fase

Creado:

- `apps/web/src/PageState.jsx` y `page-state.css`.
- `tests/e2e/redesign-management.spec.js` y `tests/e2e/fixtures/management.js`.
- Este informe.

Modificado:

- `apps/web/src/Owner.jsx`, `Admin.jsx`, `Workspace.jsx`, `workspace.css`, `Help.jsx`, `help.css`, `App.jsx`, `ui.jsx` y `styles.css`.
- `tests/e2e/workspace.spec.js`: etiquetas acentuadas correspondientes; recorridos y comprobaciones existentes conservados.
- `.context/README.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `DECISIONS.md`, `RISKS.md`, `TESTING.md`, `design/SISTEMA-VISUAL.md`, `decisions/ADR-013-frontend-redesign.md` y plan del rediseño.

20 archivos existentes modificados y cinco nuevos; ningún archivo eliminado. El árbol previo con cambios y archivos sin seguimiento se conserva. Resguardo de 20/20 archivos comprobado por SHA-256, manifiesto y entrega de 25 archivos bajo `.local/redesign-phase6-2026-11-08/`. No se crea un commit que mezcle fases anteriores.

## Base de datos y seguridad

Sin cambios de esquema, migraciones, API, contratos, consultas/payloads de negocio, roles, reglas o dependencias. El backend conserva identidad, autorización por recurso, validación de datos privados, conflictos, importes y permisos administrativos. Navegar o ingresar no ejecuta mutaciones nuevas; crear perfil y solicitar plan requieren las acciones existentes.

Antes de escrituras/capturas se verifica `current_database() = pyapy_redesign_phase0_20261104`, host 127.0.0.1 y puerto 55432. Runtime aislado: API 4170, web 4171, prototipo 4172. No se usa la aplicación habitual para escribir fixtures. `npm test` crea y elimina su base temporal propia. Las pruebas de integración existentes usan datos ficticios y sus limpiezas; la suite nueva intercepta toda la API.

Las capturas reales crean una cuenta ficticia, un espacio identificado «Quinta ficticia · fase 6», foto ilustrativa ya existente, datos de llegada ficticios y un bloqueo mediante API real. Al finalizar, se cancela el bloqueo y el espacio vuelve a borrador; ambas respuestas son 200. Quedan registros de prueba/auditoría en la copia aislada. No se alteran planes/sponsors reales para producir capturas.

## Validación

| Comprobación | Resultado |
| --- | --- |
| Lint, build de producción, Prettier y diff | Aprobados |
| `npm test` | 36/36 API/contratos, base temporal propia |
| Siete suites E2E sobre build final | **132 aprobados, cero fallos, cuatro omisiones de barridos móviles duplicados** |
| Suite nueva `redesign-management` | 29 aprobados y una omisión; API totalmente simulada |
| Reflow simulado | Seis rutas, 12 anchos de 320–1920 y textos largos, incluidos 1080/1081 |
| Capturas reales | 84: 48 de secciones/formularios/estados en 390/1440 y 36 de calendario/usuarios/ayuda en 12 anchos |
| Axe | 36 reales y 26 de la suite nueva simulada, sin violaciones detectadas en los estados comprobados |
| Capturas / limpieza | Cero errores de página y desbordamientos; bloqueo cancelado y espacio en borrador, dos respuestas 200 |

Aceptación: 156.0.8078.82, headless, escritorio 1440 × 1000 y emulación móvil 390 × 844. Los cuatro omitidos evitan repetir barridos de anchos; los recorridos funcionales se ejecutan en ambos proyectos. No se suman corridas iniciales como escenarios nuevos. Reportes locales: `acceptance-e2e.json`, `real-visual.json`, `isolation.json`, `initial-e2e.json` y `initial-new-e2e.json`.

La suite nueva comprueba navegación/URL/historial y ausencia de escrituras, edición con rechazo y conservación de campos, fotos/datos privados/redes, ocupación con UUID, incorporación explícita y solicitud de plan, nueve secciones, usuarios/reseñas/pesos, planes/suscripciones/sponsors, filtros/límites, desplazamiento interno por teclado, sesión/error/reintento, invitado sin consultas privadas, ayuda y 404. Las nuevas acciones administrativas y rechazos son simulados; no se presentan como escrituras contra PostgreSQL.

Regresión existente: retorno/autenticación/roles, selección y confirmación explícita, favoritos/reservas/cancelación, cuenta y notificaciones, estructura compartida, ficha/galería/reserva, propietario y administración. La integración real de gestión conserva edición, fotos, datos privados, redes, bloqueo/cancelación y moderación; los recorridos parcialmente interceptados siguen identificados en sus suites.

Reproducción con runtime aislado recién iniciado, identidad contrastada y build final disponible:

```powershell
node .local/redesign-phase6-2026-11-08/verify-isolation.mjs
npx playwright test --config=.local/redesign-phase6-2026-11-08/acceptance.config.mjs tests/e2e/redesign-management.spec.js tests/e2e/workspace.spec.js tests/e2e/redesign-personal.spec.js tests/e2e/auth-return.spec.js tests/e2e/redesign-shell.spec.js tests/e2e/marketplace.spec.js tests/e2e/redesign-detail.spec.js
node .local/redesign-phase6-2026-11-08/capture.mjs
```

Se detiene el runtime aislado al cerrar. Sin despliegue ni inicio de fase 7.

## Incidencias y límites

- El primer intento encontró PostgreSQL local detenido (ECONNREFUSED en 55432). Se interrumpió la corrida que no podía alcanzar el runtime; `npm test` falló inicialmente por entorno. Se inició PostgreSQL con `npm run db:local`, se contrastó la identidad aislada y se repitieron las verificaciones. Esos intentos no cuentan como aceptación ni se atribuyen al rediseño.
- Primera regresión válida: 54 aprobados y dos barridos omitidos. La suite nueva inicial dejó 23 aprobados, dos fallos del localizador del selector «Tipo» y una omisión; se usó el localizador por rol `combobox` que ya emplea la integración existente. La aceptación final ejecuta la corrección en ambos proyectos.
- Se reinició solo el runtime aislado antes de la aceptación para no acumular las cuotas de autenticación de distintas corridas. No se modificaron limitadores ni configuración de seguridad del backend.
- La copia aislada conserva el catálogo al momento de fase 0; no representa datos actuales de otro entorno. Los datos de captura se identifican como ficticios y las muestras conservan su aviso.
- Chrome instalado y emulación móvil; no se comprueban otros motores, dispositivos físicos, lectores reales o auditoría WCAG integral. Los controles Axe y reflow son parciales. No se mide rendimiento integrado ni se ejecuta staging HTTPS en esta fase; esas comprobaciones y los riesgos operativos existentes no se declaran resueltos.

## Próxima fase

Fase 7: comparación visual integrada frente a la referencia, recorridos completos y matriz por rol, controles de accesibilidad y navegadores disponibles, transferencia/LCP/CLS frente a la base de fase 0 y cierre documental. Requiere la siguiente autorización del usuario; esta entrega no la inicia ni autoriza despliegue.
