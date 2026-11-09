# Fase 2 del rediseño — portada y buscador

Fecha: inicio 2026-11-04; cierre 2026-11-05, America/Asuncion. Estado: **completada en su alcance local**. Guía: [plan de rediseño](rediseno-frontend-2026-11-03.md), [ADR-013](../decisions/ADR-013-frontend-redesign.md), [referencia principal](rediseno-fase-0-2026-11-04/REFERENCIA.md) y [matriz funcional](rediseno-fase-0-2026-11-04/MATRIZ.md). Alcance exclusivo: fase 2; no se inicia fase 3 ni despliegue.

## Resultado

Portada React con fotografía de fondo, título Fraunces blanco/dorado, texto, destinos procedentes del catálogo y buscador integrado en el hero. Franja de cinco beneficios, resultados existentes, sponsors, bloque de anfitriones con fotografía ilustrativa y explicación de reserva en tres pasos. No se incorpora la sección de destinos de la variante anidada del ZIP ni se inventan consultas por WhatsApp.

El buscador conserva ciudad, fecha opcional, turno inicial de 24 h (09–09), horarios personalizados, cruce de medianoche, personas exactas 1–1000 o vacío, presupuesto, seis tipos reales, servicios opcionales/indispensables, ciudad/presupuesto estrictos, orden y URL. Presenta siempre el intervalo y su duración; indica tarifa por hora y presupuesto total con fecha, y estimación sobre duración mínima sin fecha. Mantiene intervalos largos y segundos recibidos por URL hasta editar sus fechas/horas. Los requisitos desconocidos recibidos por URL también se muestran y conservan, aunque no estén en el catálogo cargado.

La navegación Anfitriones/Cómo funciona lleva a sus nuevas secciones desde cualquier ruta. La ayuda React continúa accesible desde los pasos y el pie. «Publicá tu quinta» lleva al ingreso con retorno a `/propietario` para invitados; al alta explícita de perfil para clientes; al panel para propietario/administrador. No se crean perfiles ni propiedades al hacer clic o ingresar.

## Archivos

| Acción | Archivos | Finalidad |
| --- | --- | --- |
| Crear | `apps/web/src/home.css` | Única composición de hero/buscador/beneficios/anfitriones/pasos y sus estados adaptables |
| Modificar | `apps/web/src/Home.jsx`, `SearchForm.jsx` | Composición, resumen siempre visible, funciones existentes y foco/anuncio de resultados |
| Modificar | `apps/web/src/SiteLayout.jsx`, `main.jsx` | Anclas nuevas y carga de hoja de portada |
| Modificar | `apps/web/src/styles.css`, `marketplace.css`, `home-reference.css` | Retirar 253 selectores reemplazados; conservar base compartida, controles del propietario, tarjetas y mapa |
| Crear | `apps/web/public/brand/escapada-{960,1600,2172}.webp` | Variantes del hero original, prioridad alta y dimensiones explícitas |
| Crear | `apps/web/public/brand/anfitriones.webp`, `anfitriones-credits.json` | Imagen ilustrativa lazy procedente del ZIP y atribución Matheus Bertelli/Pexels |
| Crear | `tests/e2e/redesign-home.spec.js` | Recorridos de filtros/URL/horarios, roles, sponsors, teclado, anclas, reflow y Axe; toda API interceptada |
| Modificar | `tests/e2e/search-guests.spec.js`, `search-labels.spec.js` | Sincronizar consulta inicial y adaptar teclado del selector |
| Modificar | `tests/e2e/marketplace-integration.spec.js`, `marketplace.spec.js`, `redesign-shell.spec.js`, `search-return.spec.js` | Destinos nuevos, input exacto de personas y localizadores precisos; selección de propiedad reservable |
| Modificar/crear | Informe y documentos de continuidad de `.context` | Estado, arquitectura, guía visual, evidencias, decisiones y plan |

No se eliminan archivos. Se conservan cambios previos del usuario; el resguardo anterior a la fase y los hashes están en `.local/redesign-phase2-2026-11-04/recovery/` y `recovery-manifest.json`. Los directorios/repositorios anidados ajenos al alcance se registran sin copiarlos ni modificarlos.

## Arquitectura y diferencias deliberadas

`Home` conserva consultas TanStack Query, favoritos/intereses, resultados, alternativas y coordinación con mapa. `SearchForm` sigue siendo propietario del borrador y emite los mismos parámetros validados por los contratos existentes. Los bloques de presentación nuevos son funciones locales de `Home`, sin dependencias nuevas ni otra fuente de datos.

`home.css` sustituye las reglas de las piezas migradas en las tres hojas anteriores. `home-reference.css` queda para tarjetas/resultados de fase 3; los estilos de gestión y rutas diferidas se conservan. Los tokens y la estructura compartida de fase 1 permanecen como autoridad visual.

- El hero usa el contenedor compartido de 1200 px y márgenes adaptables: el export principal fuerza `width:100%` en `.hero-inner`, estirando su contenido hasta los bordes. Se conserva la alineación con la cabecera y los bloques restantes en la implementación.
- La cabecera sigue siendo sticky y ocupa espacio. El padding superior del hero descuenta esa altura frente al `fixed` del export. El contenido extra real (turno, resumen y categorías) puede aumentar la altura: no se recortan controles para igualar una captura.
- Las categorías conservan su comportamiento de envío con el borrador actual y se presentan debajo de la tarjeta de búsqueda dentro del hero. El resto de filtros/tarjetas/mapa se mantiene hasta fase 3.
- Precio por hora, personas exactas y flujo de reserva real sustituyen noche, rangos de huéspedes y consulta ficticia del prototipo. La ausencia de fecha sigue significando disponibilidad sin verificar.
- Destinos del hero salen del catálogo disponible; no se publicitan ciudades fijas como si tuvieran oferta. La foto de anfitriones se identifica como ilustrativa y no pertenece a una ficha real.

## Base de datos y seguridad

Sin cambios de esquema, migraciones, API, contratos, reglas de negocio, permisos o secretos. Se verifica PostgreSQL en `127.0.0.1:55432`, `current_database() = pyapy_redesign_phase0_20261104`, antes de la integración/capturas reales. `npm test` crea y elimina su propia base temporal. La suite nueva intercepta toda la API, incluidos login/eventos; su cobertura por roles no demuestra por sí sola integración real de autenticación.

Se conservan validación server-side, límites de capacidad, protección de muestras públicas, cálculo de precios y permisos. Sponsors conserva eventos de impresión/clic; los clics de la prueba nueva usan un destino interceptado. No se cambia el mapa OSM ni se carga automáticamente.

El lanzamiento adicional del servidor local encontró `EADDRINUSE`: ya estaba disponible el runtime aislado anterior. Se comprobó su identidad de DB y se reutilizó; no se detuvieron procesos ajenos ni se cambió el entorno habitual.

## Verificación

| Comprobación | Resultado y alcance |
| --- | --- |
| Lint y build | Aprobados sobre el código final; React/Vite local, sin dependencias nuevas |
| API/contratos | 36/36 aprobadas en PostgreSQL temporal creado/eliminado por `npm test` |
| E2E distintos | 87 aprobados y tres omisiones de barridos duplicados en móvil, combinando la corrida de 90 casos y la revalidación focalizada final de retorno; no se suman repeticiones como casos nuevos |
| Desglose de la corrida de 90 | 86 aprobados, tres omitidos y un fallo móvil de comparación de scroll; la precondición de fuentes se estabiliza y la suite de retorno final aprueba 20/20 (diez escenarios repetidos dos veces) |
| Suite nueva de portada | 17 aprobadas y un barrido duplicado omitido; API completamente simulada, incluidos eventos/login |
| Escenarios conservados | 18 personas hasta cotización; 24 h inicial; horario 20–02; intervalo largo con segundos; ciudad/presupuesto estrictos; servicios; tipos; URL/historial; categorías; publicación por cuatro estados de sesión; sponsors; mapas y retorno |
| Reflow y teclado | Barrido automatizado a 320, 360, 390, 430, 480, 600/601, 780/781, 820, 980/981, 1024, 1180, 1366, 1440 y 1920 px; filtros abiertos/cerrados, controles sin desbordamiento y objetivos ≥44 px |
| Capturas con API real | 13 estados completos: portada en diez anchos de 320 a 1920, filtros expandidos en 390/1440 y búsqueda nocturna en 1440; sin desbordamientos ni errores de página registrados. Cinco PNG adicionales de hero/anfitriones/prototipo: 18 artefactos en total |
| Axe con API real aislada | Cinco análisis sin violaciones detectadas, portada/filtros/búsqueda; `incomplete` conservados en JSON |
| Axe con API simulada | Ocho análisis sin violaciones detectadas: cuatro de portada y cuatro de estructura compartida, escritorio/móvil |
| Búsqueda real | HTTP 200, `guests=18`, 2030-01-10 20:00 → 2030-01-11 02:00 de Paraguay (23:00Z → 05:00Z); foco en `#results` y conteo final comprobados |
| Formato/diff/resguardo | Prettier y `git diff --check`; 72 archivos del resguardo con hashes verificados, sin alteraciones ajenas al alcance |

Las siete suites de la corrida de 90 son `marketplace-integration`, `redesign-home`, `redesign-shell`, `search-guests`, `search-labels`, `search-map` y `search-return`. La primera usa el catálogo real aislado con interceptaciones para sus errores; las otras interceptan API según su escenario. La verificación visual usa la API real. No se ejecuta toda la suite de reservas/gestión ni TLS de staging en esta fase; su evidencia anterior se conserva como histórica.

Evidencias locales: `.local/redesign-phase2-2026-11-04/`, con resguardo, identidad de base, inventario de recursos/selectores, capturador, capturas, trazas y registros de corridas. La comparación visual no exige que nombres, ciudades y fotos reales coincidan con objetos ficticios del prototipo.

Capturas: [hero escritorio](../../.local/redesign-phase2-2026-11-04/captures/hero-1440.png), [hero móvil](../../.local/redesign-phase2-2026-11-04/captures/hero-390.png), [anfitriones](../../.local/redesign-phase2-2026-11-04/captures/hosts-1440.png). Registros: `e2e-results.json`, `verified-e2e.log`, `return-results.json`, `return-final.log` y `visual-check.json`. Los intentos anteriores se conservan aparte; no se describen como aprobados.

Reproducción tras verificar/iniciar el runtime aislado de fase 0 y construir el proyecto:

```powershell
$env:WEB_URL = 'http://127.0.0.1:4171'
npx playwright test tests/e2e/redesign-home.spec.js tests/e2e/search-guests.spec.js tests/e2e/search-labels.spec.js tests/e2e/marketplace-integration.spec.js tests/e2e/search-map.spec.js tests/e2e/search-return.spec.js tests/e2e/redesign-shell.spec.js
node .local/redesign-phase2-2026-11-04/capture.mjs
```

Los WebP pesan 73.472/171.936/277.650 bytes frente a 2.578.565 bytes del PNG original: la variante mayor reduce sus bytes aproximadamente un 89 %. En móvil se pide la mayor por el recorte vertical de una fotografía panorámica. Esto mide archivos, no una mejora certificada de LCP. La foto de anfitriones pesa 257.868 bytes y carga bajo demanda.

## Incidencias y seguimiento

- Primera corrida focalizada: 27 aprobadas, cuatro fallos y un barrido móvil duplicado omitido. Dos fallos eran un `getByLabel` exacto sobre select cuyo texto incluye opciones; dos esperaban un turno distinto tras dos flechas. Se corrigieron los localizadores por rol y se usa Home → ArrowDown → Enter para probar el teclado nativo de forma explícita.
- La regresión ampliada encontró pruebas que elegían una muestra pública y esperaban inputs de reserva; se selecciona una propiedad reservable por la respuesta real, sin habilitar reservas de muestras. También se acotan el título principal por nivel y el enlace de retorno a `main` para evitar coincidencias con los pasos/pie.
- Esa primera corrida ampliada terminó con 82 aprobados, cinco fallos de estas expectativas y tres omisiones. La siguiente dejó un único fallo móvil de scroll: referencia 1765 px frente a retorno 1726 px. En la traza, Poppins 500/700/800 y Fraunces itálica terminan unos dos segundos después de medir la referencia, durante la transición a la ficha diferida. Tres repeticiones inmediatas sin cambios pasaron; se añade `document.fonts.ready` antes de medir, manteniendo la comparación exacta de píxeles. Revalidación final completa de retorno: 20/20. No se cambia `useResultsScroll` ni se amplía tolerancia; la estabilidad de fuentes/LCP sigue para fase 7.
- H01 de fase 0: al enviar una búsqueda se enfoca la región de resultados y se incorpora `role=status` con carga, fallo o conteo. Se comprueba el comportamiento DOM; lectores de pantalla reales pendientes.
- H02: la prueba espera la respuesta inicial y el fin de `aria-busy` antes de contar solicitudes, sin permitir envíos inválidos.
- H03 sigue para fase 5. H04 del escenario de alternativas original sigue para fases 3–4; seleccionar una ficha reservable en otra prueba no cierra ese hallazgo. H05 solo recibe reducción de recursos; requiere mediciones equivalentes en fase 7.

## Pendientes y próxima fase

Pendientes fases 3–7: composición de resultados/tarjetas/mapa, ficha/reserva, área personal, gestión y validación integrada. Esta fase no certifica producción, rendimiento final, HTTPS de staging, otros motores, lectores de pantalla ni dispositivos físicos. Axe y reflow no equivalen a certificación WCAG completa.

La fase 3 reproducirá encabezado/categorías/tarjetas y distribución de resultados/mapa con datos reales, manteniendo exactas/alternativas, diferencias explicadas, orden, paginación, interés, favoritos y OpenStreetMap explícito/diferido. La entrega se detiene en fase 2.
