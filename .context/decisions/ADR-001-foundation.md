# ADR-001: arquitectura inicial

Estado: adoptado bajo autorizacion de continuidad del usuario. Fecha: 2026-09-16.

## Contexto

Proyecto nuevo, sin notas.md ni auditoria previa. El prompt maestro conservado en sources es la especificacion disponible. No se inventa un contrato anterior. Stack obligatorio: React, React Native, Node.js, PHP, PostgreSQL, Docker, OpenStreetMap.

## Opciones y decision

Un monolito modular Node.js con Express y PostgreSQL minimiza transacciones distribuidas y permite separar rutas, servicios, seguridad y persistencia. Se descartan microservicios por complejidad inicial. npm workspaces comparte validacion y cliente API entre React/Vite y React Native/Expo. JavaScript ESM mantiene un unico lenguaje y contratos Zod validan las fronteras.

PHP 8.5 ejecutara un informe administrativo CLI de solo lectura sobre PostgreSQL, con usuario dedicado en despliegue. No recibe trafico publico ni decide precios o reservas. El administrador opera mediante la API Node.js.

Las APIs viven bajo /api/v1. Imagenes cargadas se decodifican y reescriben con sharp en almacenamiento local persistente, con limites de bytes y pixeles. No se confia en nombres de archivos ni MIME declarado. El almacenamiento local requiere volumen y backup; un proveedor de objetos sera una evolucion posterior documentada.

React mantiene una experiencia de marketplace con busqueda, detalle, reservas y paneles. OpenStreetMap usa Leaflet con atribucion; las ubicaciones publicas son aproximadas y los datos exactos se almacenan aparte.

Docker Compose separa web, API, PostgreSQL, migrador y PHP administrativo. El worker de notificaciones corre dentro de la API y usa SKIP LOCKED; su extraccion a un proceso dedicado queda como evolucion operacional. Desarrollo local utiliza una instancia PostgreSQL aislada sin tocar bases existentes. Produccion requiere TLS, secretos y configuracion de infraestructura reales.

## Consecuencias

El esquema inicial no necesita migracion de datos heredados. Cada modificacion posterior sera una migracion versionada. Las integraciones email/push/WhatsApp y un despliegue externo permanecen pendientes hasta disponer de proveedores y credenciales; las notificaciones internas si pueden funcionar localmente.
