# Fase 7 del rediseño — validación integrada y cierre

Fecha: 2026-11-08, America/Asuncion. Estado: **completada en su alcance local**. Autorización: «continua con la fase 7 del rediseño». Guía: [plan](rediseno-frontend-2026-11-03.md), [ADR-013](../decisions/ADR-013-frontend-redesign.md) y [matriz funcional inicial](rediseno-fase-0-2026-11-04/MATRIZ.md).

## Alcance y cambios

Validación conjunta de las fases 0–6, comparación con el HTML principal fijado, recorridos por rol, accesibilidad, recursos y rendimiento. Sin cambios de API, contratos, esquema, reglas, permisos ni despliegue.

El logo original de 1331 × 1181 px y 953.740 bytes se conserva. Se generan variantes WebP transparentes de 96/192/288 px, con compresión lossless después del redimensionado: 9.988/29.902/55.712 bytes. `Brand` comparte `srcSet` y tamaños de cabecera/pie para DPR 1/2/3; las dimensiones intrínsecas mantienen la proporción original. Favicon reutiliza la variante de 96 px. No se redibuja la marca.

Se añade `redesign-journey.spec.js` para cubrir una cadena que antes se comprobaba por partes: bloqueo real → alternativa SQL → ficha → retorno a la búsqueda original → ficha con intervalo sugerido → registro → cotización explícita → confirmación → reserva personal → cancelación. La capacidad ficticia de 1000 distingue el fixture sin depender del orden del catálogo ni interceptar respuestas. Las reservas/bloqueos se cancelan y el espacio vuelve a borrador al terminar.

El contraste Firefox descubre que los controles nativos de hora ensanchaban la ficha a 341 px en una ventana de 320 px. `detail.css` hace adaptable la fila horaria con `auto-fit` y un mínimo de 160 px por campo; elimina el mínimo automático de sus etiquetas. Se apilan los controles cuando no hay espacio y se mantiene la presentación en dos columnas donde caben. La sonda real pasa de 341 a 320 px sin ocultar el overflow ni alterar horarios/valores.

La ampliación de texto al 200% sobre 320 CSS px encuentra cuatro desbordamientos adicionales: propietario y administración en ambos motores. `workspace.css` permite partir el título administrativo y el mes del calendario, reduce los mínimos automáticos y adapta las abreviaturas de los días. Las fechas móviles se centran con menos padding horizontal para conservar las dos cifras ampliadas. No se añade una regla que oculte el desbordamiento del documento. Una prueba nueva en `redesign-management` comprueba ancho, títulos, días, navegación por teclado y agenda sin escrituras.

La primera ronda Lighthouse encuentra un CLS móvil de portada de 0,103: la cursiva del título llegaba después de la primera presentación y cambiaba sus líneas. `public/preload-brand.js`, servido como script propio diferido, anticipa esa fuente solo en portada/acceso y el hero responsive solo en portada, antes de React y la consulta de sesión. Respeta la base de Vite, los mismos candidatos/tamaños de `Home` y el presupuesto de las demás rutas. La sonda con cursiva anticipada baja a 0,00155; se repiten luego las doce mediciones finales con la solución completa. No se reemplaza la tipografía ni se reserva espacio arbitrario en la composición.

La revisión de Lighthouse también detecta nombres accesibles que omitían texto visible en enlaces de tarjeta y el botón de galería. Se conservan su contenido/acciones y se incorpora el texto visible al nombre. El menú de cuenta adopta el nombre nativo de su contenido, con identidad auxiliar para lectores, evitando un override sobre la etiqueta visible. `redesign-detail/results` habilitan explícitamente la regla experimental `label-content-name-mismatch`, excluida por defecto incluso al seleccionar etiquetas WCAG; `redesign-shell` comprueba propósito e identidad del nombre nativo.

## Matriz funcional de cierre

Se conservan los identificadores del inventario inicial; las filas siguientes relacionan sus grupos con las comprobaciones actuales. No se presenta cada mutación simulada como operación ejecutada en PostgreSQL.

| Inventario | Destino y comprobación | Evidencia |
| --- | --- | --- |
| N01–N04 | Cabecera/pie, enlaces por sesión/rol, menú, Escape/foco, salto al contenido y diálogos | `redesign-shell`; contraste Chrome/Firefox y capturas reales |
| B01–B15 | Personas exactas/18, turno de 24 h/nocturno, requisitos, URL/historial, exactas/alternativas, orden/página, interés, favoritos, sponsors y eventos | `search-guests`, `search-labels`, `redesign-home/results`, `auth-return`; `marketplace-integration` combina API real y fallos inyectados |
| M01–M03 | Mapa explícito/diferido, filtros intactos, alcance de página, selección/teclado, atribución y retorno | `search-map/return`, `redesign-results`, mapa real en capturas; teselas de la suite de resultados simuladas |
| F01–F05 | Ficha con ruta, galería/miniaturas/teclado/foco/fallback, mapa aproximado y datos públicos, muestras sin reserva | `redesign-detail` simulado en ambos motores, `detail-reservation` sobre API aislada y capturas reales |
| R01–R06 | Selección/retorno, cotización/confirmación explícitas, rechazo, sesión vencida, respuestas obsoletas, ambigüedad/replay, importes y localizador | `detail-reservation`, `auth-return`, `marketplace`; nueva cadena `redesign-journey` totalmente real y 36 pruebas API/contratos |
| A01–A10 | Ingreso/registro, perfil de consulta, notificaciones, favoritos/interés, reservas, llegada privada/cierre tardío, cancelación y reseña | `redesign-personal` simulado; `workspace/marketplace` con integración aislada e intercepciones señaladas por caso |
| P01–P10 | Incorporación explícita, propiedades/formularios, fotos/privados/redes, calendario/agenda, reservas/bloqueos y planes | `redesign-management` simulado; `workspace` ejecuta edición/medios/privados/redes/bloqueo/cancelación reales; consultas/capturas por rol |
| G01–G10 | Nueve secciones administrativas, moderación, planes/suscripciones/sponsors/pesos, auditoría, filtros/límites y navegación | `redesign-management` simulado; `workspace` ejecuta verificación/suspensión reales; permisos de API y capturas de consulta |
| X01–X02 | Ayuda, incorporación, sesión fallida, invitado/denegado y 404 con salidas operables | `redesign-management/shell/personal`, `auth-return`, capturas reales |

Aceptación funcional: 16 suites de Chrome sobre el build anterior al ajuste de recursos, **235 aprobados y siete omisiones**, sin fallos ni retries. Tras optimizar logo, estructura compartida y nueva cadena: **17 aprobados y una omisión**. Tras la corrección horaria: ficha/reservas/cadena, **27 aprobados y una omisión**. Son **237 escenarios distintos aprobados y siete omisiones distintas** al combinar las corridas; los casos repetidos no se suman como cobertura nueva. Firefox: cinco suites, **19/19 aprobados** tras corregir el desbordamiento.

Tras corregir la ampliación de texto, gestión/workspace en Chrome suma **45 aprobados y una omisión**, y gestión en Firefox **16/16 aprobados**. El total acumulado en ese punto es **239 escenarios distintos aprobados en Chrome y siete omisiones distintas**, más **35 escenarios aprobados en Firefox**. No se suman repeticiones como escenarios nuevos. Los informes adicionales son `management-e2e.json` y `firefox-management-e2e.json`.

La precarga final se revalida con **34 aprobados y dos omisiones** en portada/estructura Chrome y **una prueba nueva aprobada en Firefox**. La prueba retiene la respuesta de sesión, comprueba que la imagen ya se solicita, que React reutiliza una sola descarga y que no se anticipa en ayuda. Al cerrar la precarga se acumulan **241 escenarios distintos en Chrome, siete omisiones distintas y 36 en Firefox**. Informes: `preload-e2e.json` y `firefox-preload-e2e.json`. Seis sondas reales adicionales de portada/ficha/acceso en ambos motores confirman la precarga por ruta y Axe sin violaciones; sustituyen sus observaciones anteriores, manteniendo 44 estados Axe únicos.

`npm test`: **36/36 API/contratos** aprobados, incluidos concurrencia, idempotencia, autorización, datos privados, precio y búsqueda SQL. Lint del conjunto y de las adiciones posteriores, build de producción y formato de los trece archivos de código/prueba afectados aprobados. La lectura final de PostgreSQL comprueba seis fixtures nuevos en borrador, doce ocupaciones asociadas y cero confirmadas; `cleanup.json` también comprueba que el PNG original coincide con la restauración de fase 0.

Los cinco informes E2E se conservan separados: `acceptance-e2e.json`, `shell-journey-e2e.json`, `detail-e2e.json`, `initial-firefox-e2e.json` y `firefox-e2e.json`. La primera corrida Firefox tuvo 18 aprobados y un fallo; su captura, contexto y traza quedan en `firefox-artifacts`, sin sustituirlos por el resultado final. No se aumenta el timeout ni se omite la prueba que encontró el defecto.

Seguimiento de los hallazgos iniciales de fase 0:

| Hallazgo | Estado al cierre local |
| --- | --- |
| H01: foco y anuncio de resultados | Comprobados en las suites actuales; lector de pantalla real pendiente |
| H02: consulta inicial tardía contada como envío inválido | Prueba sincronizada en fase 2; aceptación de personas aprobada en escritorio y móvil |
| H03: intermitencia histórica al vencer sesión | No reproducida en esta aceptación de escritorio/móvil. Se conservan el fallo histórico y la incertidumbre sobre su causa; no se afirma eliminarla por un rerun |
| H04: alternativa elegía una muestra no reservable | Fixture reservable conservado y prueba de alternativa real añadida; las muestras siguen sin reserva |
| H05: transferencia y LCP altos | Recursos optimizados y comparación controlada repetida documentada debajo; sin promesa de SLO o producción |

## Aislamiento y recuperación

Antes de pruebas se contrastan `current_database() = pyapy_redesign_phase0_20261104`, host `127.0.0.1` y puerto `55432`. API 4170, web compilada 4171 y prototipo 4172. Los datos y escrituras de integración permanecen en esa copia; `npm test` crea/elimina su propia base temporal.

Resguardo inicial: 108 archivos existentes modificados o sin seguimiento, 19.042.744 bytes, copiados y comprobados por SHA-256. Manifiesto, estado Git y diff binario en `.local/redesign-phase7-2026-11-08/recovery/`. Se conserva el árbol previo y no se mezcla en un commit. Los artefactos locales contienen evidencia y datos ficticios, sin publicar credenciales ni dumps.

Cierre de nombres accesibles: las corridas `names-final-e2e.json` y `firefox-names-final-e2e.json` conservaron tres fallos de cuenta en escritorio por motor; `names-native-e2e.json` y su equivalente Firefox comprobaron la corrección de las cinco pruebas de ficha, pero la nueva aserción de cuenta era demasiado estricta con el espacio antes de los dos puntos. Se ajusta únicamente esa normalización, manteniendo etiqueta e identidad obligatorias: `names-account-e2e.json` aprueba 6/6 y Firefox 3/3. Los tres intentos y sus trazas se conservan. La aceptación final combina el último resultado por archivo/título/proyecto, sin sumar reruns: **241 aprobados/7 omitidos en Chrome y 42 aprobados en Firefox, cero fallos pendientes**.

Ocho comprobaciones reales adicionales de portada/ficha en ambos motores y 390/1440, sin violaciones de la regla experimental: `accessible-names.json`. Galería conserva Escape y devolución del foco. Son comprobaciones complementarias a los 44 estados Axe por etiquetas, no otros ocho estados visuales únicos. Los informes finales de nombres se agregan en `acceptance-summary.json`; los fallos iniciales no se eliminan.

## Comparación visual y accesibilidad

Evidencia en `.local/redesign-phase7-2026-11-08/`: **95 capturas únicas**, geometría, fuentes, reflow y recursos en `real-visual.json`. Chrome 156.0.8078.82 y Firefox 155.0, headless. Comparativas antes/prototipo/después: [390 px](../../.local/redesign-phase7-2026-11-08/comparison-home-390.png) y [1440 px](../../.local/redesign-phase7-2026-11-08/comparison-home-1440.png).

Portada/prototipo en los nueve viewports de referencia con sus alturas; aplicación además a 320 px. Resultados y ficha se capturan en los diez tamaños; galería, mapa, acceso, ayuda, menú móvil y áreas por rol en 390/1440. Firefox contrasta 390/1440 y ambos motores amplían texto al 200% en seis rutas a 320 px. La suite reutilizada recorre también los breakpoints intermedios. **44 análisis Axe reales**, sin violaciones detectadas; los `incomplete` permanecen registrados y no se declaran aprobados. Cero errores de página, desbordamientos del documento o recortes de texto detectados por las sondas revisadas tras las correcciones.

La primera captura tuvo cuatro fallos de reflow con texto ampliado. Se conservan `initial-real-visual.json` y las cuatro capturas `initial-*-text200-*`. Se repiten doce estados afectados y se actualizan las observaciones finales por nombre; no se cuenta la repetición como nuevas capturas. El JSON final identifica la revalidación. Menú y galería comprueban Escape y devolución del foco; las suites cubren pestañas, tablas, etiquetas, anuncios, error y selección.

La comparación confirma Fraunces/Poppins y colores de referencia. A 1440 px, el título principal tiene 760 px de ancho, 78,4 px de fuente y unos 239,9 px de alto tanto en prototipo como en Chrome; Firefox difiere por redondeo subpíxel. Se conservan las excepciones ya registradas: cabecera sticky ocupando 84 px frente a fixed; contenedor de 1200 px y margen de 120 px frente al buscador de referencia extendido a 1440; formulario de 220,2 px frente a 164 px por el resumen/avisos horarios reales; categorías y acciones reales; mapa OSM explícito/diferido, ficha con ruta y áreas sin maqueta específica. Las fotos/nombres/importes del catálogo real de prueba no se igualan a los ficticios del prototipo. No quedan diferencias importantes observadas sin explicación en este alcance.

Se comprueban logo, hero y anfitriones en DPR 1/2/3 de ambos motores: imágenes decodificadas, variantes responsivas, prioridad alta del hero y lazy del pie/anfitriones. En móvil el logo elige 96/192 px para DPR 1/2; DPR 3 usa 192 en cabecera y 288 en pie. El hero conserva 2172 px por su recorte vertical. Ninguna de las seis sondas de portada carga el módulo de mapa antes de pedirlo. Fuentes locales y atribución OSM conservadas.

## Rendimiento integrado

Para aislar el cambio de navegador desde la fase 0 (Chromium 153), se recompila su restauración verificada en una carpeta aparte. Se comparan versión anterior y actual con el mismo Chrome instalado, API/catálogo/propiedad, perfiles Lighthouse 13.5.0, servidor local sin compresión/caché y tres repeticiones por caso. El servidor de comparación anterior usa 4173 y reenvía a la misma API aislada; los perfiles y condiciones de red/CPU se conservan. No se ejecuta Lighthouse mientras estén activas las suites o capturas.


Resultados aceptados: **24/24 corridas sin runtimeError**, tres por versión/página/perfil. Se ejecutaron 40 en total: ronda inicial de 24, sonda de cursiva de dos, revalidación de recursos de doce y dos sondas posteriores al ajuste de nombres accesibles; las doce mediciones finales sustituyen las doce iniciales de la versión rediseñada. Se conserva la ronda inicial en initial-performance-summary.json. Medianas independientes de cada métrica; bytes de transferencia total sin compresión/caché.

| Página / perfil | LCP antes → después | CLS antes → después | KiB antes → después | Performance antes → después |
| --- | --- | --- | --- | --- |
| Portada móvil | 27.41 → 7.61 s | 0.0000 → 0.0015 | 5118 → 1462 | 0.59 → 0.66 |
| Ficha móvil | 15.16 → 5.66 s | 0.0001 → 0.0002 | 2564 → 818 | 0.64 → 0.69 |
| Portada escritorio | 4.76 → 1.30 s | 0.0191 → 0.0143 | 5614 → 1835 | 0.72 → 0.96 |
| Ficha escritorio | 2.91 → 1.15 s | 0.0015 → 0.0003 | 2813 → 1048 | 0.83 → 0.97 |

Resumen y configuraciones en `performance-summary.json`; reportes completos de control `.local/audits/lighthouse-redesign-phase7-before-{1,2,3}-{mobile,desktop}-{home,detail}.json` y finales `.local/audits/lighthouse-redesign-phase7-final-after-{1,2,3}-{mobile,desktop}-{home,detail}.json`. La restauración de fase 0 conserva **50/50 hashes**, comprobados otra vez antes de recompilarla. La muestra histórica de fase 0 usa Chromium 153 y se conserva como referencia histórica; la tabla compara ambas versiones con Chrome 156 para evitar atribuir al diseño el cambio de navegador.

Móvil: 412 × 823, DPR 1,75, CPU ×4 y perfil de red Lighthouse (150 ms). Escritorio: 1440 × 1000, DPR 1, CPU ×1, 40 ms/10.240 kbps. Navegador nuevo por corrida; se alternó el orden antes/después en la ronda inicial. Tras corregir la carga tardía de la cursiva, se repitieron las doce mediciones de la versión final, conservando como control las doce mediciones de la versión anterior cuyo código y datos de referencia no cambiaron. API/datos/propiedad idénticos; sin suites/capturadores activos durante la medición. Son condiciones locales, sin CDN ni compresión, y no representan producción ni una prueba de carga.

Las medianas anteriores corresponden al cierre de recursos, antes del último ajuste de atributos/nombre nativo. Se ejecutan dos sondas móviles adicionales sobre el build definitivo (`post-aria`): portada 7,30 s/CLS 0,00155 y ficha 5,50 s/CLS 0; la regla de coincidencia de nombres aprueba en ambas y no hay runtimeError. No se presentan estas sondas como nuevas medianas de tres repeticiones.

## Archivos y entrega

Código: `apps/web/index.html`, `SiteLayout.jsx`, `detail.css`, `workspace.css`, nuevo `public/preload-brand.js`, `SearchPropertyCard.jsx`, `PropertyGallery.jsx` y tres nuevos `public/brand/logo-*.webp`. Pruebas: nueva `redesign-journey.spec.js` y ampliadas `redesign-management.spec.js`, `redesign-home.spec.js`, `redesign-detail.spec.js`, `redesign-results.spec.js` y `redesign-shell.spec.js`. Seguimiento actualizado: README, estado, arquitectura, pruebas, riesgos, cambios, decisiones, ADR-013, plan y sistema visual dentro de `.context`.

Entrega local revisable y manifiesto por SHA-256 en `.local/redesign-phase7-2026-11-08/delivery/` y `delivery-manifest.json`; resguardo inicial verificado por separado. No se crea un commit que mezcle cambios anteriores. Se detienen los dos runtimes de evidencia al terminar.

## Reproducción

Con PostgreSQL local y la copia de fase 0 disponibles, comprobar identidad antes de ejecutar escrituras. No recrear la copia ni restaurar encima de la base habitual.

```powershell
node .local/redesign-phase7-2026-11-08/verify-isolation.mjs
npm run build
node .local/redesign-phase0-2026-11-04/serve.mjs
# En otra terminal, con la misma identidad aislada:
npx playwright test --config=.local/redesign-phase7-2026-11-08/acceptance.config.mjs
# Para repetir rendimiento, levantar también serve-baseline.mjs y no ejecutar E2E/capturas a la vez:
node .local/redesign-phase7-2026-11-08/final-performance.mjs
```

La configuración de aceptación descubre también las tres pruebas añadidas: la suite actual tiene 248 posiciones (241 recorridos y siete barridos duplicados omitidos). La aceptación registrada aquí combina la corrida general y las revalidaciones justificadas; no se presenta como una única corrida posterior a todos los cambios. Las repeticiones escriben reportes con los mismos nombres: conservar una copia si se necesita mantener evidencia histórica. El cierre no vuelve a ejecutar el capturador con `flag: wx` sobre su archivo inicial ya existente; ese archivo protege la primera observación.

## Límites

- Docker Desktop no tiene el daemon activo: `docker info` no alcanza `dockerDesktopLinuxEngine`. La prueba de cookies Secure/TLS de `staging.spec.js` requiere HTTPS y no se ejecuta sobre HTTP local.
- La emulación de anchura de 320 CSS px equivale al reflow de una ventana de 1280 px al 400%; no certifica zoom nativo. El aumento de texto al 200% se registra separadamente.
- Axe, Chrome/Firefox headless y emulación móvil no certifican WCAG integral, lector real, Safari/WebKit ni dispositivos físicos.
- LCP móvil permanece alto en el perfil lento: 7,61 s en portada y 5,66 s en ficha, aunque mejora respecto al control. Requiere optimización posterior; no se declara un objetivo de rendimiento satisfecho.
- Las mediciones locales comparan estas versiones; no son SLO, datos de usuarios reales ni evidencia de producción.

## Cierre

Fases 0–7 del rediseño completadas localmente con las excepciones funcionales explicadas. No quedan regresiones conocidas en los recorridos comprobados. Las pruebas no ejecutadas y los límites de validación permanecen explícitos; el cierre no declara producción, staging HTTPS revalidado ni accesibilidad integral.
