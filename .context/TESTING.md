# Evidencias de verificacion

## Vista HTML sin servidor

`node scripts/verify-static.mjs`: PASS. 40 pantallas a 1440, 390 y 320 px abiertas por file:// con la red desactivada. 1754 enlaces/recursos locales validos y todas las pantallas incluidas en el indice. Fotos presentes, un h1 por pagina, cero scripts de aplicacion, filtros CSS de ciudad/tipo/capacidad/precio, menu movil y checkbox de favorito verificados. Sin desborde horizontal del documento. Capturas inspeccionadas en .local/screenshots/static.

Estas pruebas solo validan la vista HTML, no sustituyen las pruebas de backend ni afirman que los formularios estaticos persistan datos. No se levanto un servidor para esta vista. El mapa externo es opcional y requiere conexion.

Fecha: 2026-09-17. Windows/PowerShell, C:\pyApy_Proyecto. Las pruebas no constituyen aceptacion de produccion.

## Ejecutado

| Comprobacion | Resultado |
| --- | --- |
| npm run setup repetido | Migraciones vigentes, permisos reaplicados, fixtures sin duplicar |
| npm run lint | Exit 0, sin advertencias |
| npm test | 23 aprobadas, cero fallos, base temporal real PostgreSQL |
| npm run build | Exit 0, Vite 8.3; entrada JS 246.03 kB / gzip 77.08 kB |
| npm run test:e2e | Seis aprobadas: escritorio 1440x1000 y mobile 390x844 |
| npm audit --audit-level=moderate | Cero vulnerabilidades reportadas |
| expo install --check | Dependencias compatibles tras ajustar AsyncStorage |
| expo-doctor | 21 de 21 comprobaciones aprobadas |
| expo export Android/iOS | Bundles generados; no equivale a instalar una app nativa |
| scripts/verify-permissions.mjs | API no superusuario; auditoria/migraciones protegidas; reporte sin acceso a usuarios |
| npm run report | PHP 8.5/PDO consulto correctamente vista agregada |
| npm run db:verify-restore | Backup restaurado, conteos y constraint GiST conservados |
| Compose config --quiet | Configuracion valida; no hay motor para ejecutar contenedores |

Las medidas de bundle son de compilacion, no Lighthouse ni latencia de usuarios.

## Cobertura

Unitarias: Zod, horario nocturno Paraguay, ranking, cola offline y cliente HTTP con timeout. Integracion: auth/CSRF, permisos/IDOR, PII, concurrencia (una confirmacion de diez), replay, intervalos contiguos, precio, cancelacion, fotos, resenas, outbox, auditoria y edicion compatible con compromisos previos.

E2E: fotos, busqueda, mapa, ausencia de desborde, registro real, favorito, cotizacion, reserva/cancelacion, panel propietario/calendario y administrador. Capturas en .local/screenshots; inspeccionadas visualmente en escritorio y mobile. Una ejecucion anterior fallo por selectores ambiguos/fotos fuera de viewport; los selectores se corrigieron y la suite completa se repitio con exito.

## No ejecutado

Instalacion limpia aislada de release, Docker build/up, CI remoto, carga prolongada, Lighthouse, cobertura integral WCAG/teclado/lectores, emuladores/telefonos nativos, perdida real de red nativa, APK/IPA firmados, entrega externa email/push/WhatsApp, staging, monitoreo/alertas y rollback de despliegue.

## Herramientas instaladas

ESLint VS Code 3.0.34, Prettier 12.4.0, Containers 2.5.1. PHP 8.5.10 y Compose 5.5.1 locales con SHA-256 verificado; Chromium de Playwright. No se reemplazo XAMPP, no se instalaron servicios Windows ni se modificaron bases de otros proyectos.

## Fuente historica

Workspace inicialmente vacio, sin Git. El adjunto original tiene SHA-256 2C071AD446F88CF802ABC84A46E4C7C0E63A13DEBAA95FEC173996A0130EDBBF. Copia textual en sources/PROMPT_MAESTRO.md, finales de linea normalizados. Fase 0 conserva su inventario historico; los resultados actuales reemplazan el estado inicial sin aplicacion.
