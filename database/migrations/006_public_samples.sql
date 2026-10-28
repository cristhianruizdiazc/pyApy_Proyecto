-- Public examples are distinct from development fixtures (is_demo). They remain
-- visible with an inactive owner, but cannot be quoted or booked in any mode.
ALTER TABLE properties ADD COLUMN is_public_sample boolean NOT NULL DEFAULT false;

-- Restore the three hosted examples hidden by the active-owner search filter.
-- Keep the owner inactive: there is no usable account behind these listings.
UPDATE properties p SET is_public_sample=true
FROM users u, geographic_locations g
WHERE p.owner_id=u.id AND p.city_id=g.id
  AND u.email='catalog-demo-owner@pyapy.invalid'
  AND (g.city,p.name) IN (
    ('Aregua','Casa del Lago'),
    ('San Bernardino','Quinta Yvytu'),
    ('Altos','El Patio de Altos')
  );

WITH samples(city,name,description,kind,capacity,price,image,amenities) AS (
  VALUES
    ('Luque','Quinta Tajy','Quinta ficticia de demostración en Luque, con piscina, parrilla y jardín para compartir en grupo. Las fotografías y los precios son ilustrativos. No existe una propiedad comercial verificada ni se aceptan reservas reales.','Quinta',30,75000,'palms','{pool,grill,parking,wifi}'::text[]),
    ('Caacupe','Bungalow Arasá','Bungalow ficticio de demostración en Caacupé, pensado como ejemplo de una escapada tranquila en pareja o en familia. Las fotografías y los precios son ilustrativos. No existe una propiedad comercial verificada ni se aceptan reservas reales.','Bungalow',6,45000,'cabin','{wifi,kitchen,pets,parking}'::text[]),
    ('Pirayu','Refugio Ysyry','Casa ficticia de demostración en Pirayú, con piscina y parrilla como ejemplo de un descanso al aire libre. Las fotografías y los precios son ilustrativos. No existe una propiedad comercial verificada ni se aceptan reservas reales.','Casa',10,55000,'retreat','{pool,grill,kitchen,parking}'::text[])
), inserted AS (
  INSERT INTO properties(owner_id,city_id,name,description,zone,kind,capacity,latitude,longitude,rules,status,is_public_sample)
  SELECT u.id,g.id,s.name,s.description,'Ubicación ilustrativa cerca del centro',s.kind,s.capacity,g.latitude,g.longitude,
    'Ficha ficticia de demostración. No admite visitas ni reservas reales.','published',true
  FROM samples s
  JOIN geographic_locations g ON g.city=s.city
  JOIN users u ON u.email='catalog-demo-owner@pyapy.invalid'
  WHERE NOT EXISTS (
    SELECT 1 FROM properties p WHERE p.owner_id=u.id AND p.city_id=g.id AND p.name=s.name
  )
  RETURNING id,city_id,name
), listings AS (
  SELECT p.id,s.* FROM inserted p
  JOIN geographic_locations g ON g.id=p.city_id
  JOIN samples s ON s.city=g.city AND s.name=p.name
), prices AS (
  INSERT INTO pricing_rules(property_id,price_per_hour)
  SELECT id,price FROM listings
), availability AS (
  INSERT INTO availability_rules(property_id,min_hours,max_hours)
  SELECT id,4,48 FROM listings
), images AS (
  INSERT INTO property_images(property_id,path,alt)
  SELECT id,'/demo/'||image||'.jpg','Fotografía ilustrativa de '||name||' en '||city FROM listings
)
INSERT INTO property_amenities(property_id,amenity_code)
SELECT id,a.amenity FROM listings CROSS JOIN LATERAL unnest(amenities) AS a(amenity);
