# Fotografías de las primeras tres quintas reales

Se reemplazan tres fichas públicas de demostración conservando sus IDs:

| Ficha anterior | Nombre solicitado | Ciudad | Fotos originales |
| --- | --- | --- | --- |
| Quinta Tajy | La Escondida | Luque | `luque1.jpeg` a `luque8.jpeg` |
| Quinta Yvytu | La Sagrada | San Bernardino | `sanber1.jpeg` a `sanber7.jpeg` |
| Refugio Ysyry | Maria | Atyra | `atyra1.jpeg` a `atyra4.jpeg` |

La quinta foto de San Bernardino se llama `sanber5jpeg.jpeg` en la carpeta
original y se publica como `la-sagrada/5.jpeg`. Las 19 fotografías se copian
sin alterar sus bytes a `apps/web/public/properties`, en carpetas separadas
por propiedad. Los originales de `Photos` se conservan en el equipo y no es
necesario versionarlos por duplicado. La primera foto de cada grupo es la portada.

La migración `007_real_property_photos.sql` actualiza únicamente las tres fichas
del propietario público de demostración y sustituye sus imágenes ilustrativas
por galerías numeradas. Las otras tres fichas se conservan. Para Maria se agrega
Atyra al catálogo de ciudades y se usa su referencia geográfica aproximada
([OpenStreetMap](https://www.openstreetmap.org/way/133131476)); no se conoce la
dirección exacta de la quinta. Se reutiliza la ficha anterior cambiando su ciudad
para mantener seis propiedades y conservar cualquier referencia a su ID.

Los nombres, las ciudades y las fotos corresponden a lo solicitado por el usuario.
La etiqueta Demo y el bloqueo de reservas se mantienen. Precios, capacidades,
servicios, horarios y condiciones heredados siguen siendo datos de demostración,
pendientes de confirmación. La descripción lo aclara y el aviso de la ficha ya
no afirma que todas las propiedades o sus fotografías sean ficticias.

Las pruebas verifican las tres ciudades, los nuevos nombres, las galerías de
8/7/4 imágenes en orden, la existencia de los JPEG publicados y, cuando están
disponibles los originales locales, su igualdad byte por byte. También verifican
que las tres identidades anteriores desaparecen del catálogo público de muestra
y que los seis registros conservan la etiqueta y el bloqueo de reservas.

Validación local: lint, 35 pruebas y compilación web aprobados. En una base
temporal aislada se aplicaron las migraciones dos veces sin duplicar registros.
Chromium comprobó las tres fichas y recorrió todas las imágenes de sus galerías
a 1440 y 390 píxeles, incluyendo volver de la última foto a la primera, sin
errores JavaScript ni desbordamiento de la página. Las 19 respuestas de imagen
se compararon con los archivos originales y coincidieron byte por byte.
