# Fase 23: Release Candidate

Fecha de revalidación: 2026-10-22, America/Asuncion. Estado: **CERRADA CON RIESGO UPSTREAM EXPLÍCITO**.

## 1. Identificación

Se revalidó la candidata local `0.1.0` sobre Node 24.21.0, PostgreSQL 16 y Docker Desktop 4.92.0. Se utilizaron únicamente datos ficticios. Este cierre técnico no equivale a staging, producción 1.0 ni publicación móvil.

## 2. Gates ejecutados

| Gate                         | Resultado       | Evidencia                                                                                                            |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| Instalación limpia           | PASS            | `npm ci --ignore-scripts`: 768 paquetes instalados.                                                                  |
| Setup/migraciones            | PASS            | PostgreSQL aislado iniciado; migraciones, permisos y fixtures idempotentes.                                          |
| Backend/base                 | PASS            | `npm run check`: lint, 23/23 pruebas y build web.                                                                    |
| Web E2E                      | PASS            | Runner aislado: 45 aprobadas y una repetición responsive omitida deliberadamente.                                    |
| Mobile técnico               | PASS            | Compatibilidad Expo 57 y exportación Android/iOS.                                                                    |
| Base/operación               | PASS            | Permisos mínimos, reporte PHP y backup/restore aislado verificados.                                                  |
| Compose estático             | PASS            | Entornos, secretos externos y hardening declarados válidos.                                                          |
| Docker runtime               | PASS            | Imágenes web/API/migración construidas; DB y API saludables; web HTTP 200; API interna HTTP 200.                     |
| Docker test                  | PASS            | Imagen `test` construida y 23/23 pruebas aprobadas dentro de Compose.                                                |
| Volúmenes                    | PASS            | Tras reinicio se conservaron las dos migraciones y un marcador temporal en uploads.                                  |
| Dependencias runtime web/API | PASS            | Builds productivos informan cero vulnerabilidades en sus dependencias instaladas.                                    |
| Auditoría workspace          | RIESGO UPSTREAM | 16 avisos altos en tooling Expo/Metro por `braces` y `node-forge`; no existe versión corregida publicada compatible. |

## 3. Correcciones realizadas durante el gate

- `vite` 8.3.0 → 8.3.5 y `sharp` 0.35.4 → 0.35.5.
- Expo 57.0.25 → 57.0.31 y `expo-crypto` 57.0.3 → 57.0.4.
- Overrides de `shell-quote` 1.12.0 e `ip-address` 10.7.4 eliminaron el aviso crítico y el moderado.
- Los Dockerfiles usan reintentos, timeout ampliado y descarga serializada en el target de pruebas para tolerar resets del registro npm.

No se ejecutó `npm audit fix --force`: propone bajar a Expo 44/React Native 0.72, cambio mayor incompatible con la aplicación actual. El riesgo restante se registra como pendiente y debe revisarse al publicar parches de Expo/Metro.

## 4. Artefactos y límites

- Web: `apps/web/dist/`.
- Bundles Expo: `apps/mobile/dist/`.
- Imágenes locales: `pyapy-web`, `pyapy-api`, `pyapy-migrate` y `pyapy-test`.
- Compose operativo en `http://127.0.0.1:8088` durante la validación.

No hay dispositivo ADB disponible, firma release ni artefacto apto para Play Store/App Store. La instalación física sigue pendiente para preproducción.

## 5. Cierre

La Fase 23 queda cerrada como candidata técnica local reproducible. La Fase 24 no debe considerarse iniciada hasta disponer de staging, TLS, secretos gestionados, monitoreo y rollback, y debe tratar explícitamente el riesgo upstream móvil.
