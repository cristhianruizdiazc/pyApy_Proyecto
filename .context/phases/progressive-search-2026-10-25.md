# Búsqueda por etapas — entrega local

Fecha: 2026-10-25. Decisión y contratos: [ADR-012](../decisions/ADR-012-progressive-search.md).

## Parte 1

Motor SQL con requisitos obligatorios y etapas exclusivas, paginación de exactas sin límite de candidatos por antigüedad, presupuesto por período, radios geográficos y fechas concretas verificadas. Configuración validada y límites de ejecución/consultas. Migraciones 004 y 005 aplicadas en la base local de desarrollo y en bases temporales de pruebas; intereses guardados conservan preferencias indispensables. Se conserva administración de pesos, precios y exclusión concurrente de reservas.

## Parte 2

Web responsive con filtros indispensables, agrupación/diferencias, estimaciones explícitas, errores separados y traslado del intervalo seleccionado hasta el formulario de reserva. Turno inicial de 24 horas conservado. React Native congelado por ADR-011, con contrato aditivo conservado; sin exportación ni validación nativa en esta entrega.

## Parte 3

`npm run check` final aprobado: lint, **32/32 pruebas** de contratos/dominio/API sobre PostgreSQL temporal real y build Vite. Casos nuevos: paridad de apertura/duración SQL con validación autoritativa, catálogo de 530 propiedades, paginación de 25 exactas, capacidad/indispensables/tipo, orden/deduplicación, radios inclusivos, sobreprecio 20 %, redondeo de horas, ausencia de fecha, bloqueos/horarios alternativos, traslado al formulario y reserva real, conflicto posterior, propietario deshabilitado, atribución de reserva y preferencias del interés guardado. Sin dependencias añadidas.

`node scripts/verify-web-integration.mjs tests/e2e/progressive-search.spec.js`: **4/4 aprobados** en escritorio 1440 px y web móvil 390 px. Se prueba presentación y traslado explícito del intervalo al detalle/formulario sin sobrescribir búsqueda, errores técnicos y persistencia de controles en URL. La disponibilidad del fixture interceptado se prueba por separado en la suite API real; el navegador no la certifica.

La primera ejecución sin filtrar de `node scripts/verify-web-integration.mjs` terminó con **53 aprobados, 1 omitido y 2 fallidos**. Los dos fallos corresponden exclusivamente a `staging.spec.js` exigiendo cookie Secure sobre el runner de desarrollo HTTP. No se debilita esa prueba ni se afirma validar TLS/staging en esta entrega. Ejecución final del alcance web HTTP: `node scripts/verify-web-integration.mjs --grep-invert 'staging entrega'`, **53 aprobados, 1 omitido, cero fallos**, en 4,2 minutos. La omisión existente es el barrido responsive duplicado. Los cuatro E2E nuevos están incluidos en esos 53, no son adicionales.

`git diff --check`: aprobado. Prettier aplicado a archivos modificados de implementación/documentación. Se preservaron los cambios ajenos preexistentes de `home-reference.css`, `styles.css` y la carpeta no versionada `pyApy/`. No se modificó lockfile ni se añadieron dependencias. Los procesos temporales de E2E se cerraron mediante el runner; PostgreSQL local queda disponible.

Incidencias iniciales corregidas: expectativa antigua de proximidad para ciudad desconocida (22/23), formato de offset del mismo instante PostgreSQL frente a UTC (28/29), texto nuevo mal codificado (primeros E2E 2/4). No se presentan esos intentos como verificaciones aprobadas.

Pendientes de alcance: prueba de carga a escala real, WCAG integral/lector/zoom, reactivación y adaptación de React Native, atribución analítica causal/antifraude, búsqueda de horarios anteriores al solicitado o fuera de la cuadrícula de pasos. No se incluyen combinaciones de relajaciones ni interpretación automática de reglas en texto libre. No se publicó ni desplegó a producción.
