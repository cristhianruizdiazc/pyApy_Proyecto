# Identidad artesanal — primera entrega

Fecha: 2026-09-19. Dirección elegida por el usuario: **Artesanal sutil**, primero sobre la web conectada.

## Sistema visual

| Token | Valor | Uso |
| --- | --- | --- |
| `--paper` | `#fcfaf6` | Fondo general |
| `--linen` | `#f5f0e6` | Hero y sección de ubicaciones |
| `--green` | `#194b3b` | Marca, texto principal del hero y acciones |
| `--accent` | `#a84332` | Acentos, selección y foco |
| `--muted` | `#59675d` | Información secundaria |
| `--line` | `#dedfd5` | Separadores y contornos |

Se conservan DM Sans/Manrope existentes. Su carga sigue dependiendo de Google Fonts con fallback sans-serif; no se incorporaron nuevas fuentes ni proveedores.

Tarjetas: foto grande, tipo/capacidad, nombre, ciudad, precio por hora y una indicación de disponibilidad o duración mínima. Servicios/reglas extensas se consultan en detalle. Controles de favorito de 44 px; resultados en una columna a 480 px o menos.

## Recursos y procedencia

| Recurso | Origen | Tratamiento |
| --- | --- | --- |
| `apps/web/public/brand/nanduti.svg` | Dibujo SVG original creado durante esta integración; sin trazado/copias de una obra externa | Trama radial de hilos inspirada en ñandutí |
| `apps/web/public/brand/encaje-ju.svg` | Dibujo SVG original creado durante esta integración; sin descarga externa | Cenefa de malla geométrica inspirada en encaje ju |
| `apps/web/public/demo/*.jpg` | Fotos demo preexistentes; procedencia en `scripts/fetch-demo-assets.mjs` | Ilustrativas, sin atribuirlas a propiedades reales paraguayas |
| Lucide | Dependencia ya presente | Iconografía funcional |

Los motivos son aproximaciones visuales diferenciadas, no reproducciones artesanales certificadas. No se atribuye autoría a artesanos ni aprobación cultural inexistente. Se recomienda revisión por una persona conocedora de ambas técnicas antes del lanzamiento de identidad definitivo. No se añade aquí una licencia general que modifique los derechos del proyecto.

## Reglas de aplicación

- Decoración acotada a bordes y separadores, sin interferir con inputs/precios/mapas.
- Recursos locales como fondos CSS decorativos: sin foco ni contenido adicional para lectores de pantalla.
- Fotografía y acción principal prevalecen sobre insignias y adornos.
- Movimiento reducido desactiva animaciones CSS y reproducción automática inicial del hero.
- Mostrar el horario elegido incluso cuando los filtros avanzados están plegados.
- No mostrar precio por día/turno ni disponibilidad definitiva tomada del legado: usar contratos actuales.

Implementación: `apps/web/src/marketplace.css`, posterior al CSS base. Cambios futuros de componentes compartidos deben verificar detalle, favoritos y paneles además de portada.

## Extensión al detalle — UI 02

`detail.css` se carga con la ficha. La galería muestra una fotografía principal y hasta dos secundarias; el visor conserva acceso a todas. El panel de reserva usa fondo claro y resumen marfil, con fechas/horas/personas y precio del servidor. En móvil aparece antes del contenido extenso; el mapa y las reglas permanecen disponibles mediante accesos/secciones. Se reutilizan el footer y los recursos artesanales de UI 01, sin añadir motivos competidores ni fotografías nuevas.

## Extensión a cuenta y gestión — UI 03

`workspace.css` aplica superficies marfil/blanco, controles legibles y métricas resumidas. La decoración artesanal queda en la identidad compartida/footer; las áreas de trabajo priorizan contenido. Identificadores, notas y actividad secundaria se despliegan a demanda. Calendario móvil con contadores y agenda legible; tablas administrativas conservan desplazamiento horizontal para acceder a todas las columnas. Filtros y «Mostrar más» indican que operan sobre registros cargados.
