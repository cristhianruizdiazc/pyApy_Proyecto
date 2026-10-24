-- Public sample listings for the hosted prototype. Their descriptions mark
-- them as fictional and their owner account is inactive and cannot log in.
INSERT INTO users(email,name,password_hash,role,active)
VALUES (
  'catalog-demo-owner@pyapy.invalid',
  'Propietario de demostración',
  'scrypt$3fd713ad4770479bbd27249f36a973ac$ac79eb1996957cf12fde70e842bdfb49131aa46ad3873a33a02d1e11156b217d71a98d46de25fc9d33198857f320031bf55e8148749ac730cfd4e0a17dc287c0',
  'owner',
  false
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO owner_profiles(user_id,commercial_name)
SELECT id,'Anfitriones de demostración'
FROM users
WHERE email='catalog-demo-owner@pyapy.invalid'
ON CONFLICT (user_id) DO NOTHING;

WITH samples(city,name,description,kind,capacity,price,image,amenities) AS (
  VALUES
    ('Aregua','Casa del Lago','Propiedad ficticia de demostración en Aregua. La fotografía es ilustrativa; este alojamiento no está verificado ni disponible para reservas reales.','Casa',12,85000,'house','{pool,wifi,kitchen,air}'::text[]),
    ('San Bernardino','Quinta Yvytu','Quinta ficticia de demostración en San Bernardino. La fotografía es ilustrativa; este alojamiento no está verificado ni disponible para reservas reales.','Quinta',25,65000,'pool','{pool,grill,parking,pets}'::text[]),
    ('Altos','El Patio de Altos','Quincho ficticio de demostración en Altos. La fotografía es ilustrativa; este alojamiento no está verificado ni disponible para reservas reales.','Quincho',40,50000,'garden','{grill,parking,accessible}'::text[])
)
INSERT INTO properties(owner_id,city_id,name,description,zone,kind,capacity,latitude,longitude,rules,status,is_demo)
SELECT u.id,g.id,s.name,s.description,'Alrededores del centro',s.kind,s.capacity,g.latitude,g.longitude,
  'Ficha ilustrativa. Consultar disponibilidad antes de planificar una visita.','published',false
FROM samples s
JOIN geographic_locations g ON g.city=s.city
JOIN users u ON u.email='catalog-demo-owner@pyapy.invalid'
WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.name=s.name AND p.city_id=g.id);

WITH samples(city,name,price,image,amenities) AS (
  VALUES
    ('Aregua','Casa del Lago',85000,'house','{pool,wifi,kitchen,air}'::text[]),
    ('San Bernardino','Quinta Yvytu',65000,'pool','{pool,grill,parking,pets}'::text[]),
    ('Altos','El Patio de Altos',50000,'garden','{grill,parking,accessible}'::text[])
), listings AS (
  SELECT p.id,s.price,s.image,s.amenities,s.name,s.city
  FROM samples s
  JOIN geographic_locations g ON g.city=s.city
  JOIN properties p ON p.city_id=g.id AND p.name=s.name
)
INSERT INTO pricing_rules(property_id,price_per_hour)
SELECT id,price FROM listings
ON CONFLICT (property_id) DO NOTHING;

WITH samples(city,name,price,image,amenities) AS (
  VALUES
    ('Aregua','Casa del Lago',85000,'house','{pool,wifi,kitchen,air}'::text[]),
    ('San Bernardino','Quinta Yvytu',65000,'pool','{pool,grill,parking,pets}'::text[]),
    ('Altos','El Patio de Altos',50000,'garden','{grill,parking,accessible}'::text[])
), listings AS (
  SELECT p.id,s.image,s.amenities,s.name,s.city
  FROM samples s
  JOIN geographic_locations g ON g.city=s.city
  JOIN properties p ON p.city_id=g.id AND p.name=s.name
)
INSERT INTO availability_rules(property_id,min_hours,max_hours)
SELECT id,4,48 FROM listings
ON CONFLICT (property_id) DO NOTHING;

WITH samples(city,name,price,image,amenities) AS (
  VALUES
    ('Aregua','Casa del Lago',85000,'house','{pool,wifi,kitchen,air}'::text[]),
    ('San Bernardino','Quinta Yvytu',65000,'pool','{pool,grill,parking,pets}'::text[]),
    ('Altos','El Patio de Altos',50000,'garden','{grill,parking,accessible}'::text[])
), listings AS (
  SELECT p.id,s.image,s.amenities,s.name,s.city
  FROM samples s
  JOIN geographic_locations g ON g.city=s.city
  JOIN properties p ON p.city_id=g.id AND p.name=s.name
)
INSERT INTO property_images(property_id,path,alt)
SELECT id,'/demo/'||image||'.jpg','Fotografía ilustrativa de '||lower(name)||' en '||city
FROM listings
WHERE NOT EXISTS (SELECT 1 FROM property_images i WHERE i.property_id=listings.id);

WITH samples(city,name,price,image,amenities) AS (
  VALUES
    ('Aregua','Casa del Lago',85000,'house','{pool,wifi,kitchen,air}'::text[]),
    ('San Bernardino','Quinta Yvytu',65000,'pool','{pool,grill,parking,pets}'::text[]),
    ('Altos','El Patio de Altos',50000,'garden','{grill,parking,accessible}'::text[])
), listings AS (
  SELECT p.id,s.amenities
  FROM samples s
  JOIN geographic_locations g ON g.city=s.city
  JOIN properties p ON p.city_id=g.id AND p.name=s.name
)
INSERT INTO property_amenities(property_id,amenity_code)
SELECT id,a.amenity
FROM listings CROSS JOIN LATERAL unnest(amenities) AS a(amenity)
ON CONFLICT (property_id,amenity_code) DO NOTHING;
