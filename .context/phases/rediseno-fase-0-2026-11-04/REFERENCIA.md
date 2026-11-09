# Referencia visual fijada

Fecha: 2026-11-04, America/Asuncion. Alcance: fase 0 del [plan](../rediseno-frontend-2026-11-03.md). Regla vigente: ADR-013 y funciones reales prevalecen frente a datos y comportamientos simulados del export.

## Fuente inmutable de comparación

- Archivo: [Prototipo-con-mapa-integrado.zip](../../Prototipo-con-mapa-integrado.zip).
- SHA-256 del ZIP: `08baefe55c8ff1e02e70443c5e7ff986238acddf3b890cd1de4c933768836ac6`.
- Entrada principal: `index.html` de la raíz, 122.694 bytes; SHA-256 `b97d98aa3ace6d3e998aec3793b86179645d5d7f746c0409032c4b11ea050efa`.
- `DESIGN-MANIFEST.json` declara `entryFile=index.html`, `entryFileRole=primary-screen`; `DESIGN-HANDOFF.md` coincide. Es una pantalla principal con CSS/JS integrados, no un lanzador de varias pantallas.
- Recursos: 20 archivos en `assets`, incluidas fuentes locales, logo, hero, fotos y créditos. Manrope está empaquetada, pero la referencia efectiva usa Fraunces/Poppins. No incorporar una fuente solo por existir en el ZIP.
- Desglose y hashes de recursos: [reference.json](../../../.local/redesign-phase0-2026-11-04/reference.json). Capturas: [carpeta local](../../../.local/redesign-phase0-2026-11-04/captures).

Si cambia el ZIP o su hash, registrar una revisión explícita antes de sustituir la referencia. Los archivos extraídos permanecen en `.local/redesign-phase0-2026-11-04/prototype` para comparar con la aplicación, sin incorporarlos como frontend funcional.

## Composición adoptada

1. Cabecera con marca, enlaces a espacios/anfitriones/cómo funciona y acciones de sesión reales.
2. Hero `#inicio`: fotografía, título y texto, buscador superpuesto y filtros/chips.
3. Franja de confianza `.trust`: beneficios con iconos y ritmo visual de la referencia.
4. Espacios `#espacios`: encabezado, filtros/categorías, tarjetas y contenedor de mapa; conservar estados y controles adicionales del producto.
5. Bloque anfitriones `#anfitriones`: imagen y CTA al flujo real de publicación.
6. Pasos `#como-funciona`, luego pie y enlaces reales.
7. Diálogo `#propertyDialog`: referencia de composición para la ficha con ruta `/espacios/:id`; no se copia su modelo de datos ni formulario de consulta.
8. Diálogo `#hostDialog`: referencia estética del alta; su formulario simulado se sustituye por ingreso/perfil/panel según rol.

Sponsors se ubica después de resultados y antes del pie; los bloques de alternativas se mantienen identificados dentro de espacios. El buscador conserva los controles extra necesarios y su resumen temporal. Cuenta y paneles heredan el sistema visual, con densidad apropiada para gestión. Destinos de cada capacidad: [MATRIZ.md](MATRIZ.md).

## Materiales divergentes

| Material | Diferencia comprobada | Tratamiento |
| --- | --- | --- |
| HTML principal | Mapa SVG esquemático; precio por noche y catálogo local de cinco objetos; dos diálogos | Fuente visual principal, con las excepciones siguientes |
| ZIP anidado `Rediseño-de-quintas-y-espacios.zip` | `index.html` de 96.240 bytes; incluye `#destinos` entre confianza y espacios | Apoyo histórico; no sumar esa sección al HTML principal |
| HTML anidado SHA-256 | `8843dcbb568770e4caee6144fbc27239a3fbf082e91933e9047880cfd93fa48b` | Identifica inequívocamente la variante |
| Captura `2026-11-02-233003` | Franja de destinos de la variante anidada | No sustituye la composición principal |
| Captura `2026-11-02-233310` | Tarjetas y mapa OSM de la aplicación existente, diferentes al SVG del export | Apoyo funcional para integración del mapa real |

## Diferencias deliberadas con el prototipo

| Pieza | Adaptación obligatoria |
| --- | --- |
| Precio y fechas | `/ hora`, duración/total del intervalo, turnos y horas reales; 24 h inicial 09–09; America/Asuncion |
| Personas | Campo exacto, incluyendo 18; no limitar a opciones 2/4/8/12/16 |
| Categorías | Chips mapeados a `kind` real: Quinta, Piscina, Casa, Bungalow, Quincho, Salon; servicios por separado. «Quinchas» se presenta como «Quinchos» para corresponder al tipo existente; Salón conserva acceso en selector |
| Mapa | Leaflet/OSM con atribución y coordenadas públicas; explícito y diferido. Lateral en escritorio solo al abrir; control adaptable en tamaños menores |
| Resultados | Datos reales del entorno, exactas/alternativas explicadas, orden/página, disponibilidad verificada o sin comprobar, interés y favoritos persistidos |
| Ficha | Página con URL, acceso directo/historial/retorno, galería, reserva real, reseñas/redes/datos públicos; sin copiar dormitorio/baño/valoración ficticia |
| Reserva y publicación | Cotización/confirmación reales e idempotentes; acceso por rol y alta de propietario explícita; no prometer envío de WhatsApp |
| Identidad y fotos | Conservar logo elegido y recursos de marca; fotos de cada propiedad y distinción demo/muestra. El stock del prototipo no acredita propiedades reales |
| Accesibilidad | Contraste, etiquetas, foco y navegación operables pueden exigir ajuste documentado; la captura del prototipo no certifica accesibilidad |

Estas adaptaciones aplican decisiones ya adoptadas. No requieren ampliar API/DB ni nuevas reglas de negocio. Si una pantalla necesita otro dato, se registra aparte antes de introducirlo.

## Sistema visual de referencia

| Grupo | Valores del HTML principal |
| --- | --- |
| Verde | `--forest #0F3B2D`, profundo `#08261D`, suave `#1C5543` |
| Fondos | Papel `#F4F5EE`, papel secundario `#EAEDE2`, blanco `#FFFFFF` |
| Texto/borde | Tinta `#12211A`, secundario `#56665A`, línea `#D5DACB` |
| Acentos/foco | Arcilla `#A64F2B` / `#C9683F`, dorado `#E4B36A`, foco `#1F6E52` |
| Fuentes | Fraunces para display; Poppins para cuerpo/controles, locales |
| Radios/sombra | 18 px / 10 px; `0 26px 60px -32px rgba(8,38,29,.45)` |
| Umbrales CSS | 360, 480, 600, 780, 980/981, 1080 y 1180/1181 px; movimiento reducido |

Esta tabla fija la fuente visual; la extracción exhaustiva de medidas/tokens y su integración corresponde a fase 1. No se aplicaron estilos nuevos en fase 0.

Comparación: mismo viewport, altura, DPR, zoom, fuentes cargadas, imágenes lazy cargadas y estados equivalentes. El catálogo ilustrativo del ZIP no se iguala inventando datos en la API: se compara geometría de módulos equivalentes y se dejan explícitas las diferencias de contenido. Las capturas de la aplicación usan la misma copia de datos que podrá reutilizarse después del cambio.
