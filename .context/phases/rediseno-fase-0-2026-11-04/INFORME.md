# Fase 0 — Referencia e inventario del rediseño

Fecha: 2026-11-04, America/Asuncion. Estado: **completada en su alcance de referencia, inventario y línea base local**. Las fases 1–7 siguen pendientes. Esta entrega no cambia la interfaz ni cierra los defectos iniciales que documenta.

## Resultado y entregables

- [Referencia visual](REFERENCIA.md): ZIP/HTML identificados por SHA-256, composición fijada, variantes separadas, paleta/fuentes y adaptaciones deliberadas.
- [Matriz funcional](MATRIZ.md): rutas, roles, acciones, componentes, destinos y fase responsable; matriz de tamaños/estados y doce recorridos de regresión.
- [Evidencias locales](../../../.local/redesign-phase0-2026-11-04): resguardo, aislamiento, capturas, reportes y scripts auxiliares. Contienen datos locales de prueba; no se publican ni se versionan las credenciales o dumps.
- [Capturador reutilizable](../../../scripts/capture-redesign-baseline.mjs): valida el registro de aislamiento antes de iniciar sesiones, captura estados y conserva observaciones. Usa el entorno local descrito abajo.

La referencia inequívoca es el HTML principal del ZIP, con precio horario, cantidad exacta, reservas reales y OpenStreetMap bajo demanda. Cada capacidad inventariada tiene destino. Se puede comparar la implementación siguiente contra las capturas, fuentes y fallos anteriores al rediseño.

## Protección y recuperación

Antes de editar documentación se guardó el árbol sobre HEAD `d322c164e957d723dbd65a5e37b7d3f91749ea2d`:

- `recovery/status.txt`: estado completo, incluidos archivos sin seguimiento.
- `unstaged.patch` y `staged.patch`: diferencias binarias respecto al repositorio.
- `repository.bundle`: historial y referencias Git; verificación de bundle aprobada.
- `files/` y `manifest.json`: copia exacta de **50 archivos previos**, 17.603.712 bytes, con hash SHA-256 por archivo. Incluye frontend/pruebas modificados, documentación, ZIP, `Photos/` y metadatos del directorio `pyApy/` sin seguimiento.
- `restore-check/`: clon separado del bundle con las copias restauradas. **50/50 hashes coinciden**; no se restauró sobre el workspace original. Registro: `recovery/restore-verification.json`.

El resguardo local no incluye secretos ignorados, el clúster PostgreSQL, dependencias ni uploads originales. Es un punto de recuperación de código/documentos y archivos sin seguimiento, no un backup integral del equipo. La copia de datos para las comprobaciones se describe separadamente abajo.

Verificación final: los archivos previos de aplicación/pruebas coinciden con sus hashes de resguardo; únicamente cambiaron los cuatro documentos de seguimiento previstos, además de los entregables nuevos. Todos los enlaces del plan y de esta entrega resuelven. La base habitual conserva sus conteos iniciales de usuarios/propiedades/reservas (114/251/126); estos conteos son una comprobación adicional, no una comparación de cada columna. Registro: [final-verification.json](../../../.local/redesign-phase0-2026-11-04/final-verification.json). Formato del capturador, ESLint y `git diff --check` aprobados.

Para recuperar, primero clonar `repository.bundle` a un **directorio nuevo**, posicionarlo en el HEAD registrado y superponer allí `recovery/files` conservando las rutas de `manifest.json`. Verificar los hashes. Examinar ese resultado antes de decidir cualquier sustitución del workspace. No usar `reset --hard`, `clean` ni aplicar el parche encima de las copias, porque estas ya contienen los cambios previos. El índice original no fue alterado.

## Entorno y aislamiento

Node 24.21.0, npm 11.19.0, Chromium de Playwright y PostgreSQL 16 locales. Se inició el clúster existente en `127.0.0.1:55432`; no se ejecutó setup, seed ni migraciones sobre la base habitual.

La base de origen `pyapy` se leyó con `pg_dump`. Se creó y restauró exclusivamente **`pyapy_redesign_phase0_20261104`**; se comprobaron `current_database`, host y puerto antes de iniciar el navegador. La copia inicial tenía 114 usuarios, 251 propiedades y 126 reservas. Se copiaron también los uploads a una carpeta exclusiva. Identidad y comprobación: [isolation.json](../../../.local/redesign-phase0-2026-11-04/isolation.json).

Las cuentas demo existentes se usaron contra esa copia. Login, eventos de vista/sponsors, trabajador de notificaciones y todas las mutaciones de E2E quedaron dirigidos a la base aislada. `npm test` creó/eliminó su propia base temporal mediante el runner existente. No se ejecutaron reservas, cancelaciones, moderación, carga de archivos ni cambios de perfiles en la base habitual.

La captura usa **build de producción** servido localmente sin compresión ni caché HTTP: web `http://127.0.0.1:4171`, API aislada en `4170`, prototipo en `4172`. No se modificó `.local/dev.json` ni se sustituyó el entorno de desarrollo habitual. El runtime y sus scripts auxiliares quedan en la carpeta local; los procesos de captura se detienen al cerrar la fase. La copia aislada, el dump privado y los uploads se conservan para repetir comparaciones, sin publicarlos. Las pruebas integradas añadieron sus fixtures solo en esa copia; para repetir con los datos iniciales debe restaurarse el dump en otra base aislada y verificarla antes de escribir.

## Línea base visual y de accesibilidad

**111 capturas**: 106 en el recorrido principal y cinco complementarias de diálogos del prototipo y menú móvil. Portadas de prototipo/aplicación en los nueve tamaños del plan; resultados, filtros, mapa, ficha, galería, acceso/registro, páginas privadas/denegadas y nueve secciones administrativas en 390×844 y 1440×900. El recorrido incluye 53 capturas identificadas por rol cliente/propietario/administrador. El script conservado incorpora los selectores corregidos para reproducir también los estados complementarios.

En las **106 observaciones geométricas iniciales**: ningún desbordamiento horizontal detectado y cero errores JavaScript de página. **16 análisis Axe** de estados representativos: cero violaciones detectadas con etiquetas WCAG 2 A/AA, 2.1 A/AA y 2.2 AA; los resultados `incomplete` quedan en el JSON y no se declaran aprobados. Esto no certifica toda la accesibilidad del producto ni de la futura interfaz.

Menú móvil a 390 px: Escape lo cierra y devuelve el foco al botón. La búsqueda explícita por 18 deja actualmente foco en `BODY` y ninguna región de estado con conteo. Una cotización real aislada de Quinta Yvytu para 18 personas, 10/01/2030 de 09:00 a 17:00, devolvió 8 horas y Gs. 520.000; esta captura **no confirmó** reserva. Las confirmaciones y recuperaciones se comprobaron en los fixtures separados de `detail-reservation`.

Ejemplos revisables:

| Pantalla | Prototipo | Aplicación anterior al rediseño |
| --- | --- | --- |
| Portada móvil | [390 px](../../../.local/redesign-phase0-2026-11-04/captures/prototype-home-390.png) | [390 px](../../../.local/redesign-phase0-2026-11-04/captures/app-home-390.png) |
| Portada escritorio | [1440 px](../../../.local/redesign-phase0-2026-11-04/captures/prototype-home-1440.png) | [1440 px](../../../.local/redesign-phase0-2026-11-04/captures/app-home-1440.png) |
| Ficha | [Diálogo 1440 px](../../../.local/redesign-phase0-2026-11-04/captures/prototype-detail-1440.png) | [Ruta 1440 px](../../../.local/redesign-phase0-2026-11-04/captures/app-detail-1440.png) |
| Mapa | Integrado en portada principal | [Mapa real 1440 px](../../../.local/redesign-phase0-2026-11-04/captures/app-map-1440.png) |
| Gestión | Sin maqueta específica | [Calendario móvil](../../../.local/redesign-phase0-2026-11-04/captures/owner-propietario-calendar-390.png), [usuarios](../../../.local/redesign-phase0-2026-11-04/captures/admin-admin-users-1440.png) |

El JSON [baseline.json](../../../.local/redesign-phase0-2026-11-04/baseline.json) identifica URL, viewport, archivo, encabezados, fuentes, comprobaciones y estados simulados. No se exige igualdad de fotografías/precios con el catálogo ficticio del prototipo. Las imágenes pendientes de decodificar fuera de la zona visible del carrusel se registran como `undecodedImages`, no como imágenes rotas: `/demo/retreat.jpg` y `/demo/garden.jpg` respondieron 200 con contenido JPEG real.

## Comprobaciones iniciales

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| `npm run lint` | Aprobado | Código preexistente; capturador nuevo revisado adicionalmente con ESLint |
| `npm run build` | Aprobado | Build web Vite 8.3.5; sin cambios de UI |
| `npm test` | **36/36 aprobadas** | API/contratos con PostgreSQL temporal propio |
| Etiquetas/personas/mapa/retorno/autenticación | **72/76 aprobadas, 4 fallidas** | Desktop y móvil emulado; API simulada por esas suites |
| `detail-reservation` | **16/16 aprobadas** | Reserva, selección y recuperación sobre API aislada; algunas respuestas interceptadas según escenario |
| `workspace` | **14/14 aprobadas** | Paneles/acciones con fixtures en API aislada y estados interceptados propios de la suite |
| `progressive-search` | **2/4 aprobadas, 2 fallidas** | Respuestas de búsqueda interceptadas y catálogo/ficha reales en el caso de alternativas |
| Rerun diagnóstico desktop de dos casos | **1 aprobada, 1 fallida** | No reemplaza ni vuelve verde la corrida original |
| Sonda de personas con consulta inicial ya resuelta | Aprobada | `0` muestra error, conserva foco y no emite otra búsqueda; API simulada |
| Restauración del resguardo en directorio aparte | **50/50 hashes coinciden** | Verificación real de recuperación de archivos |

Las dos tandas originales suman **104 E2E aprobadas y 6 fallidas de 110**. No se ejecutó la totalidad de `marketplace`/`marketplace-integration` ni staging TLS. Resultados originales: [primera tanda](../../../.local/redesign-phase0-2026-11-04/e2e-results.json), [reserva/paneles/etapas](../../../.local/redesign-phase0-2026-11-04/integrated-e2e-results.json), [rerun diagnóstico](../../../.local/redesign-phase0-2026-11-04/focused-e2e-results.json). Las pruebas y los componentes existentes se conservaron sin corregir estos fallos durante la fase de línea base.

## Hallazgos anteriores al rediseño

| ID | Evidencia y conclusión | Continuidad |
| --- | --- | --- |
| H01 | Buscar 18 deja foco en `BODY` y no anuncia conteo. Observado con API real aislada; no deriva de CSS nuevo | Resolver al migrar buscador/resultados, fases 2–3; validar lector según disponibilidad |
| H02 | `search-guests` falla al contar solicitudes: registra la consulta inicial tardía como si naciera del envío inválido. Se reprodujo también en rerun; esperando la respuesta inicial, el mismo input inválido no añade solicitudes | Sincronizar esa prueba al adaptarla en fase 2; conservar validación actual |
| H03 | Caso de sesión vencida en reservas no encontró Email en ambos proyectos durante primera tanda. El rerun desktop pasó sin cambiar código; causa exacta de la sensibilidad temporal aún no establecida | Conservar traza del fallo y revisar sesión/transiciones al migrar fase 5; no declararlo resuelto por el rerun |
| H04 | Prueba de alternativas toma `items[0]`, actualmente Quinta Tajy `isPublicSample=true`; espera inputs de reserva donde el producto debe mostrar demostración sin reserva. URL sí conserva intervalo propuesto | Elegir fixture reservable al adaptar fases 3–4; no habilitar reservas de muestras públicas |
| H05 | Lighthouse local muestra transferencia alta y LCP móvil elevado; valores debajo. No es una regresión del rediseño | Optimizar recursos al implementar y contrastar en fase 7 con mismas condiciones |

Además, hay localizadores que ya no reflejan el input de personas (`spinbutton` frente a textbox) en `marketplace-integration`. Esto se detectó leyendo la suite, no ejecutándola, y no se cuenta como fallo observado. El popup nativo de fecha en headless y los otros límites de la auditoría histórica se conservan como contexto, sin atribuirles una nueva validación.

## Rendimiento inicial

Cuatro corridas Lighthouse 13.5.0, una por combinación página/dispositivo, con contextos nuevos y configuración guardada. Portada `/` y ficha reservable de Quinta Yvytu; API real aislada, build de producción local, sin CDN/compresión. Móvil: 412×823, DPR 1,75, latencia simulada 150 ms, CPU ×4 y perfil de red Lighthouse; escritorio: 1440×1000, DPR 1, latencia 40 ms, 10.240 kbps y CPU ×1. Esta matriz de rendimiento es distinta de la matriz visual 390×844/1440×900.

| Página / perfil | Performance | LCP | CLS | Transferencia total |
| --- | --- | --- | --- | --- |
| Portada móvil | 0,59 | 22.044,846 ms | 0 | 4.287.984 bytes |
| Ficha móvil | 0,63 | 10.435,734 ms | 0 | 1.671.631 bytes |
| Portada escritorio | 0,79 | 3.779,992 ms | 0,019255 | 4.795.146 bytes |
| Ficha escritorio | 0,88 | 2.170,203 ms | 0,004525 | 1.926.423 bytes |

Resumen y configuración: [performance-summary.json](../../../.local/redesign-phase0-2026-11-04/performance-summary.json). Reportes Lighthouse completos en `.local/audits/lighthouse-redesign-phase0-20261104-*.json`. Las cuatro corridas terminaron sin `runtimeError`; accessibility/best-practices/SEO puntuaron 1,00, lo que no equivale a certificación manual. Es una línea base de una muestra por caso, no una mediana ni un SLO. En fase 7 repetir el mismo perfil, servidor y contenido, y usar varias corridas antes de atribuir una mejora.

## Reproducción y límites

El entorno fue preparado por los scripts locales `prepare.mjs` y `serve.mjs`, conservados junto a `isolation.json`. `prepare.mjs` se niega a recrear una copia ya existente; no se debe saltar esa protección. Verificar nombre de base y credenciales en los archivos privados locales sin copiarlas a documentación. El capturador comprueba el registro y requiere que el runtime que sirve 4171 efectivamente apunte a esa misma base. Tras un reinicio, el responsable debe contrastarlo con la configuración y con `current_database` antes de activar escrituras.

Con la copia aislada verificada y el build listo:

```powershell
node .local/redesign-phase0-2026-11-04/serve.mjs
# En otra terminal:
node scripts/capture-redesign-baseline.mjs
$env:WEB_URL = 'http://127.0.0.1:4171'
npx playwright test tests/e2e/search-labels.spec.js tests/e2e/search-guests.spec.js tests/e2e/search-map.spec.js tests/e2e/search-return.spec.js tests/e2e/auth-return.spec.js
npx playwright test tests/e2e/detail-reservation.spec.js tests/e2e/workspace.spec.js tests/e2e/progressive-search.spec.js
node .local/redesign-phase0-2026-11-04/performance.mjs redesign-phase0-20261104-recheck
```

La reproducción vuelve a escribir capturas/reportes del capturador y los artefactos que las suites existentes guardan en `.local/t*`; conservar una copia si se necesita mantener una corrida como inmutable. Se conservan los JSON originales de ambas tandas y se copian a `integration-failures` las trazas disponibles de la segunda. El rerun tiene su propio directorio `focused-test-results`. Las trazas temporales de la primera tanda fueron reemplazadas por Playwright al iniciar la segunda: sus errores y resultados siguen en el JSON, pero no se afirma conservar aquellas trazas.

No se probaron Firefox/WebKit, dispositivos físicos, lectores reales, participantes ni HTTPS de staging. No se comprobó cada mutación administrativa durante la fase 0: el inventario se sustenta en código, capturas por sección y las pruebas indicadas. No se aplicaron optimizaciones, cambios de permisos, migraciones, despliegues ni fases posteriores. No queda una decisión de producto pendiente que impida iniciar la fase 1; los hallazgos iniciales tienen seguimiento y no se marcaron resueltos.
