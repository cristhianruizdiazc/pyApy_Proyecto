# Seguridad implementada y pendiente

Actualizado: 2026-09-17. Es una revision local, no certificacion de seguridad para produccion.

## Controles implementados

- Scrypt con salt aleatoria; tokens opacos aleatorios almacenados como hash, expiracion y rotacion.
- Cookie HttpOnly/SameSite y Secure en produccion; validacion CSRF y origen; bearer estricto para nativo.
- Tres roles derivados de DB, estado activo verificado por peticion y autorizacion por propiedad/reserva.
- Contratos strict para entradas sensibles, consultas parametrizadas y errores sin detalles SQL.
- Precios/estado server-side, transacciones, exclusion de reservas e idempotencia persistida.
- Coordenadas publicas aproximadas; datos privados separados y llegada autorizada.
- Upload maximo 5 MB, limite de pixeles, decodificacion real, WebP sin metadatos, UUID y visibilidad comprobada al servir.
- Helmet, limites de cuerpo y tasa, request ID, logs sin cuerpos ni tokens, auditoria append-only.
- API con rol PostgreSQL no privilegiado; PHP limitado a vista agregada.
- Sesion nativa en SecureStore; cache privada por usuario, limpieza al cerrar sesion y cola sin confirmacion offline.
- .env, credenciales demo, dumps, uploads y logs excluidos de Git.

## Evidencia

23 pruebas incluyen abuso de rol/precio, CSRF, origen, bearer malformado, IDOR, inyeccion SQL de busqueda, contenido de imagen falso, PII, cancelacion, revocacion, concurrencia e idempotencia. Ver tests/api.test.mjs y TESTING.md. Verificacion independiente de permisos con scripts/verify-permissions.mjs.

npm audit reporto cero vulnerabilidades. Override xcode/uuid 11.1.1 elimina dependencia vulnerable; generacion de UUID y export Expo verificadas. Eso no demuestra ausencia de vulnerabilidades desconocidas.

PHP 8.5.10 instalado localmente y usado por reporte. XAMPP/PHP 7.2 del equipo no se modifico ni se usa en pyApy.

## Pendientes antes de produccion

Recuperacion/verificacion de cuenta, MFA administrativo, politica de retencion/borrado, pruebas completas de XSS/rate limiting, secretos administrados, TLS, revision de CSP, pruebas de contenedores y red, rate limiting compartido y proteccion antiabuso de analytics.

AsyncStorage no cifra cache/cola nativa; aunque no guarda tokens, puede contener registros propios y notas. Definir minimizacion/cifrado y validar limpieza en dispositivo. .gitignore no cifra discos ni backups; ACL de Windows y almacenamiento externo requieren tratamiento operacional.

Las imagenes/ubicaciones demo son ilustrativas. No usar esta base para informacion real ni exponer la instancia local a Internet.
