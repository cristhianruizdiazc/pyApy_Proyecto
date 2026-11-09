# Fase 1 del rediseño — sistema visual y estructura compartida

Fecha: 2026-11-04, America/Asuncion. Estado: **completada en su alcance local**. Guía: [plan de rediseño](rediseno-frontend-2026-11-03.md), [ADR-013](../decisions/ADR-013-frontend-redesign.md), [referencia](rediseno-fase-0-2026-11-04/REFERENCIA.md) y [matriz](rediseno-fase-0-2026-11-04/MATRIZ.md). Las fases 2–7 permanecen pendientes.

## Resultado

Se implementó la base visual del HTML principal sobre la web funcional: paleta, fuentes locales, tipografía, medidas y estructura compartida. Cabecera y pie dejaron de depender de variantes de portada y de reglas repetidas en tres hojas CSS. Se conserva la marca elegida, con navegación operable en escritorio/móvil y accesos por sesión/rol desde todas las rutas públicas e internas que usan cabecera.

Formularios, botones, errores, vacíos, éxitos, carga y diálogos heredan la base nueva. La portada, tarjetas, buscador, ficha y paneles mantienen su composición actual hasta sus fases respectivas; recibir tipografía/paleta compartidas no implica cerrar esas fases. La tarifa horaria, turnos, contratos, reservas, roles y OpenStreetMap se conservan.

## Cambios y archivos

| Acción           | Archivos                                                                                                                               | Motivo                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Crear            | `apps/web/src/tokens.css`                                                                                                              | Paleta/medidas/tipografías y alias de compatibilidad centralizados                                                              |
| Crear            | `apps/web/src/SiteLayout.jsx`, `site-layout.css`                                                                                       | Marca, cabecera, navegación, cuenta y pie con responsabilidad propia                                                            |
| Crear            | `apps/web/public/fonts/{fraunces-normal,fraunces-italic,poppins-400,poppins-500,poppins-600,poppins-700,poppins-800}.woff2`            | Copias exactas de los siete archivos del prototipo; 188.096 bytes                                                               |
| Crear            | `tests/e2e/redesign-shell.spec.js`                                                                                                     | Regresión de navegación, roles, cierre de sesión, foco, adaptación y accesibilidad                                              |
| Modificar        | `apps/web/src/App.jsx`, `main.jsx`, `apps/web/index.html`                                                                              | Componer estructura, usar marca compartida, destino de salto enfocable, fuentes locales y precargas                             |
| Modificar        | `apps/web/src/styles.css`                                                                                                              | Retirar fuente externa/imposición universal; integrar tipografía, controles, estados y diálogo; retirar cabecera/pie anteriores |
| Modificar        | `apps/web/src/marketplace.css`, `home-reference.css`                                                                                   | Retirar paleta/estructura compartida duplicada; conservar reglas de pantalla para sus fases                                     |
| Modificar        | `apps/web/src/ui.jsx`                                                                                                                  | Bloquear scroll del documento durante `Modal`, restaurando el valor anterior y el foco                                          |
| Crear/actualizar | Este informe, `design/SISTEMA-VISUAL.md`, plan, estado, README de contexto, changelog, arquitectura, pruebas, guía histórica y ADR-013 | Registrar entrega efectiva, validación y límites                                                                                |

No se eliminaron archivos. Los cambios previos ajenos a esta entrega permanecen en el árbol. Las hojas de pantalla no se reescribieron completas: solo se retiró su responsabilidad compartida reemplazada, junto con la obligación tipográfica que impedía Fraunces. `styles.css` todavía contiene geometría heredada; se retirará por pantalla en su fase, no mediante una reorganización sin validación.

Antes de editar se copiaron 15 archivos a `.local/redesign-phase1-2026-11-04/recovery/files`, con manifiesto SHA-256. Este resguardo complementa la recuperación de fase 0; no sustituye backups de datos. No se hizo commit, reset ni restauración sobre los cambios existentes.

## Arquitectura y diferencias deliberadas

- `SiteLayout` es presentación React. La sesión sigue proviniendo de TanStack Query/API; el backend mantiene identidad y permisos. El menú no ejecuta escrituras por iniciar sesión ni por abrirse.
- Escritorio: enlaces públicos, publicación, ingreso/registro o cuenta nativa con enlaces personales y panel por rol. Móvil: despliegue verde profundo con las mismas rutas, salida y acceso a registro. Cuenta/administración ya no dependen de estar fuera de la portada para estar disponibles.
- Escape cierra con devolución de foco; navegación, sesión, foco/clic exterior y cambio de distribución cierran los desplegables. Se conserva foco cuando un control queda oculto al cruzar 980/981 px.
- Cabecera `sticky` de 84/76 px frente al `fixed` del export: ocupa espacio y conserva la geometría de las pantallas todavía vigentes. El contenedor compartido reproduce 1200 px y los márgenes/breakpoints de la referencia. Se mantiene compensación de anclas mediante `scroll-padding-top`.
- Fraunces local para títulos y Poppins local para cuerpo/controles; sin Google Fonts. Se conservan logo y códigos monoespaciados. Los colores anteriores tienen alias hacia los nuevos tokens para migrar progresivamente los consumidores.
- El pie reproduce columnas, ritmo y superficie del principal, con enlaces reales. Se omiten textos ficticios que describirían todo el catálogo como demo o afirmarían disponibilidad sin verificar. Se conserva la identificación de muestras en sus consumidores.

Guía efectiva y distribución completa de CSS: [SISTEMA-VISUAL.md](../design/SISTEMA-VISUAL.md).

## Base de datos y seguridad

Sin modificaciones de esquema, migraciones, endpoints, permisos ni configuración de despliegue. El clúster local se inició para comprobar la copia ya existente. Antes de las escrituras del navegador se verificó `current_database() = pyapy_redesign_phase0_20261104`, puerto 55432. Se reutilizó exclusivamente esa base aislada y sus uploads, sin reemplazar el entorno de desarrollo habitual. Registro sin credenciales: `.local/redesign-phase1-2026-11-04/isolation-verification.json`.

La suite nueva intercepta **toda** la API y no alcanza PostgreSQL. `auth-return` también usa API simulada; `detail-reservation` y `workspace` usan la copia aislada con las interceptaciones propias de sus escenarios. `npm test` crea/elimina su base temporal separada. No se añadieron secretos ni se publicaron dumps, sesiones o datos privados.

Se elimina una petición externa de fuentes y se corrige pérdida de foco al cambiar de distribución. Los controles del servidor de CSRF, autorización e idempotencia se conservan. Esta fase no es una nueva auditoría de seguridad ni declara producción.

## Verificación

| Comprobación                                            | Resultado y alcance                                                                                                                                                                                       |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                          | Aprobado, incluido componente y suite nuevos                                                                                                                                                              |
| `npm run build`                                         | Aprobado; build de producción local React/Vite                                                                                                                                                            |
| `npm test`                                              | **36/36 aprobadas** sobre PostgreSQL temporal propio                                                                                                                                                      |
| `auth-return`, `detail-reservation`, `workspace`        | **64/64 aprobadas**, desktop y móvil emulado; autenticación simulada más reserva/paneles con API real aislada según suite                                                                                 |
| `redesign-shell`                                        | **15 aprobadas y una omisión deliberada**: el barrido de anchos se ejecuta una vez desde escritorio                                                                                                       |
| Marketplace, casos Cómo funciona e identidad responsive | **3 aprobadas y una omisión deliberada**: adaptación/teclado/movimiento se barre una vez desde escritorio                                                                                                 |
| Barrido compartido automatizado                         | 320, 360, 390, 480, 600/601, 780/781, 820, 980/981, 1024, 1180, 1440 y 1920 px; sin desbordamientos en la página de ayuda                                                                                 |
| Capturas con API real aislada                           | **24 estados/tamaños**, portada en diez anchos de 320 a 1920; ayuda, acceso, página inexistente, ficha y páginas/menús de los tres roles; sin desbordamientos ni errores JavaScript de página registrados |
| Axe con API real aislada                                | **14 análisis sin violaciones detectadas** en los estados capturados; `incomplete` conservados en JSON                                                                                                    |
| Axe de suite nueva                                      | **4 análisis sin violaciones detectadas**, ayuda con estructura cerrada/abierta, desktop y móvil; API simulada                                                                                            |
| Formato y diff                                          | Prettier de archivos afectados y `git diff --check`; resultados de cierre registrados en el directorio local                                                                                              |

Los 82 casos E2E aprobados de este alcance son casos distintos: 64 regresiones, 15 de la nueva suite y tres focalizados existentes. No incluyen staging ni toda la suite pública. Las dos omisiones son duplicaciones de barridos, no escenarios fallidos.

Se verificaron publicación con retorno por rol, cuenta/guardados/reservas, salida fallida con reintento, menú con teclado, Escape, salto al contenido, anclas, navegación y cierre por cambio de ruta, sesión y ancho. Las suites de regresión verificaron además galería/modal, errores de formularios, confirmación/idempotencia, operaciones reales de gestión y datos privados autorizados.

Incidencias de comprobación, sin ocultar corridas iniciales:

1. La primera suite nueva esperaba el título «Mi cuenta» donde la pantalla existente saluda «Hola, Prueba.»: seis fallos de localizador. Se corrigió la expectativa y se repitió la suite, sin cambiar esa pantalla.
2. Al añadir cobertura de cambio de distribución se encontró un fallo real e intermitente de foco: el navegador podía desenfocar un elemento al ocultarlo antes de entregar `matchMedia.change`. Se conserva el último foco significativo para trasladarlo al control visible; la suite final pasa para cliente, propietario y administrador.
3. La primera captura de roles reutilizó cookies de cliente para otro login, que el servidor rechazó con 403. El capturador ahora crea un contexto independiente por rol. No se alteró CSRF ni autenticación. Dos sondas de consola con texto acentuado fallaron por la codificación de la tubería PowerShell; se sustituyeron por el capturador UTF-8 guardado en archivo.
4. Los hallazgos de fase 0 siguen bajo sus fases responsables. La regresión seleccionada de sesión vencida pasó esta vez; eso no demuestra por sí solo que se haya resuelto la sensibilidad temporal histórica. Personas, alternativa sobre muestra pública y rendimiento no se declaran corregidos aquí.

## Evidencias y reproducción

Directorio local: `.local/redesign-phase1-2026-11-04/`. Contiene resguardo, identidad de base, `capture.mjs`, `visual-check.json`, capturas, resultados/trazas de intentos iniciales y salidas finales. `release-check.log` registra la ejecución focalizada final; la corrida original de 64 regresiones se conserva en `regression-results` y el resumen de esta entrega. No se confunden capturas de API real con respuestas simuladas de pruebas.

Capturas representativas: [portada 1440](../../.local/redesign-phase1-2026-11-04/captures/home-1440.png), [menú móvil](../../.local/redesign-phase1-2026-11-04/captures/menu-390.png), [ayuda móvil](../../.local/redesign-phase1-2026-11-04/captures/help-390.png). Comparación original: [capturas de fase 0](../../.local/redesign-phase0-2026-11-04/captures).

Con el runtime aislado de fase 0 iniciado y contrastado contra su base, y después de construir:

```powershell
$env:WEB_URL = 'http://127.0.0.1:4171'
npx playwright test tests/e2e/redesign-shell.spec.js
npx playwright test tests/e2e/auth-return.spec.js tests/e2e/detail-reservation.spec.js tests/e2e/workspace.spec.js
node .local/redesign-phase1-2026-11-04/capture.mjs
```

No ejecutar las suites de escritura contra la base habitual. El capturador local requiere los recursos/cuentas ficticias conservados de fase 0; no se entrega como herramienta de despliegue.

## Pendientes, riesgos y próxima fase

Sin nuevas regresiones conocidas dentro de las comprobaciones ejecutadas. Permanecen los hallazgos H01–H05 de fase 0 según su seguimiento, la migración visual de pantallas y la validación integral de fase 7. No se ejecutaron Lighthouse de cierre, Firefox/WebKit, lectores de pantalla reales, dispositivos físicos ni HTTPS de staging. El barrido a 320 px comprueba reflow equivalente; no se afirma una revisión manual completa con zoom y asistencia reales. Axe no certifica accesibilidad total.

La fase 2 aplicará la composición del HTML principal a hero, buscador, beneficios, bloque de anfitriones y explicación de uso, conservando filtros/URL/borrador, cantidad exacta, horarios, precio por hora, sponsors y publicación real. Esta entrega termina en fase 1: no implementa esa composición ni inicia un despliegue.
