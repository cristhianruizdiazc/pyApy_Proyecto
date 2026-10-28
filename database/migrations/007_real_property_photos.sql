-- Replace three hosted demo identities without deleting their IDs or history.
-- Names, cities and photographs come from the owner; operating data remains demo.
-- Atyra uses an approximate city reference, not the property's private address.
-- Reference: https://www.openstreetmap.org/way/133131476
INSERT INTO geographic_locations(city,department,latitude,longitude)
VALUES ('Atyra','Cordillera',-25.282,-57.172)
ON CONFLICT (city) DO NOTHING;

WITH replacements(old_name,name,city) AS (
  VALUES
    ('Quinta Tajy','La Escondida','Luque'),
    ('Quinta Yvytu','La Sagrada','San Bernardino'),
    ('Refugio Ysyry','Maria','Atyra')
)
UPDATE properties p
SET name=r.name,city_id=g.id,latitude=g.latitude,longitude=g.longitude,
    kind='Quinta',zone='Dirección pendiente de confirmar',
    description=r.name||' es una quinta en '||r.city||'. Las fotografías corresponden a la propiedad y fueron proporcionadas para este proyecto. Esta ficha permanece en modo demostración: las tarifas, la capacidad, los servicios y la disponibilidad están pendientes de confirmación. No admite reservas reales.',
    rules='Ficha en preparación. Tarifas, capacidad, servicios, horarios y condiciones sujetos a confirmación. No admite reservas reales.',
    verified=false,updated_at=now()
FROM replacements r
JOIN geographic_locations g ON g.city=r.city
JOIN users u ON u.email='catalog-demo-owner@pyapy.invalid'
WHERE p.owner_id=u.id AND p.name=r.old_name AND p.is_public_sample;

-- Replace only the images belonging to these three hosted sample records.
DELETE FROM property_images i
USING properties p, users u
WHERE i.property_id=p.id AND p.owner_id=u.id
  AND u.email='catalog-demo-owner@pyapy.invalid'
  AND p.is_public_sample AND p.name IN ('La Escondida','La Sagrada','Maria');

WITH galleries(name,folder,count) AS (
  VALUES ('La Escondida','la-escondida',8),('La Sagrada','la-sagrada',7),('Maria','maria',4)
)
INSERT INTO property_images(property_id,path,alt,position)
SELECT p.id,'/properties/'||g.folder||'/'||n||'.jpeg',
       g.name||', fotografía '||n,n-1
FROM galleries g
JOIN properties p ON p.name=g.name AND p.is_public_sample
JOIN users u ON u.id=p.owner_id AND u.email='catalog-demo-owner@pyapy.invalid'
CROSS JOIN LATERAL generate_series(1,g.count) n;
