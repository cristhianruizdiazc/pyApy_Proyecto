CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
  name text NOT NULL, password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client','owner','admin')),
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE owner_profiles (user_id uuid PRIMARY KEY REFERENCES users(id), commercial_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE geographic_locations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), city text NOT NULL UNIQUE, department text NOT NULL, latitude numeric(8,3) NOT NULL, longitude numeric(8,3) NOT NULL);
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id),
  city_id uuid NOT NULL REFERENCES geographic_locations(id), name text NOT NULL, description text NOT NULL,
  zone text NOT NULL, kind text NOT NULL CHECK (kind IN ('Quinta','Piscina','Casa','Bungalow','Quincho','Salon')),
  capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 1000),
  latitude numeric(8,3) NOT NULL, longitude numeric(8,3) NOT NULL,
  rules text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','suspended')),
  verified boolean NOT NULL DEFAULT false, is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX properties_public ON properties(city_id,capacity) WHERE status='published';
CREATE INDEX properties_owner ON properties(owner_id);
CREATE TABLE property_private_data (property_id uuid PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE, address text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', latitude numeric(10,7), longitude numeric(10,7));
CREATE TABLE pricing_rules (property_id uuid PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE, price_per_hour integer NOT NULL CHECK(price_per_hour BETWEEN 1000 AND 100000000), currency text NOT NULL DEFAULT 'PYG' CHECK(currency='PYG'));
CREATE TABLE availability_rules (property_id uuid PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE, min_hours integer NOT NULL CHECK(min_hours>=1), max_hours integer NOT NULL CHECK(max_hours>=min_hours AND max_hours<=720), open_hour integer NOT NULL DEFAULT 0 CHECK(open_hour BETWEEN 0 AND 23), close_hour integer NOT NULL DEFAULT 24 CHECK(close_hour BETWEEN 1 AND 24), cancellation_hours integer NOT NULL DEFAULT 24 CHECK(cancellation_hours>=0));
CREATE TABLE amenities (code text PRIMARY KEY, label text NOT NULL);
CREATE TABLE property_amenities (property_id uuid REFERENCES properties(id) ON DELETE CASCADE, amenity_code text REFERENCES amenities(code), PRIMARY KEY(property_id,amenity_code));
CREATE TABLE property_images (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE, path text NOT NULL, alt text NOT NULL, position integer NOT NULL DEFAULT 0);
CREATE INDEX property_images_property ON property_images(property_id);
CREATE TABLE property_social_networks (property_id uuid REFERENCES properties(id) ON DELETE CASCADE, platform text CHECK(platform IN ('instagram','facebook','tiktok','youtube')), url text NOT NULL, PRIMARY KEY(property_id,platform));
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid NOT NULL REFERENCES users(id), kind text NOT NULL CHECK(kind IN ('pyapy','owner','block')),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
  guests integer NOT NULL CHECK(guests>=1), total_amount bigint NOT NULL CHECK(total_amount>=0),
  status text NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
  locator text NOT NULL UNIQUE, note text NOT NULL DEFAULT '',
  idempotency_key uuid NOT NULL, request_hash text NOT NULL,
  cancellation_hours integer NOT NULL CHECK(cancellation_hours>=0),
  created_at timestamptz NOT NULL DEFAULT now(), cancelled_at timestamptz,
  UNIQUE(user_id,idempotency_key),
  EXCLUDE USING gist(property_id WITH =, tstzrange(starts_at,ends_at,'[)') WITH &&) WHERE(status='confirmed')
);
CREATE INDEX reservations_user ON reservations(user_id,starts_at);
CREATE TABLE favorites (user_id uuid REFERENCES users(id) ON DELETE CASCADE, property_id uuid REFERENCES properties(id) ON DELETE CASCADE, PRIMARY KEY(user_id,property_id));
CREATE TABLE search_intents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL, city text, guests integer, budget bigint, starts_at timestamptz, ends_at timestamptz, requested_amenities text[] NOT NULL DEFAULT '{}', results_count integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reservation_id uuid NOT NULL UNIQUE REFERENCES reservations(id), user_id uuid NOT NULL REFERENCES users(id), property_id uuid NOT NULL REFERENCES properties(id), rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), comment text NOT NULL, visible boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX reviews_property ON reviews(property_id);
CREATE TABLE notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), reservation_id uuid REFERENCES reservations(id), message text NOT NULL, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX notifications_user ON notifications(user_id,created_at);
CREATE TABLE notification_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), reservation_id uuid NOT NULL REFERENCES reservations(id), message text NOT NULL, attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz, dead_at timestamptz);
CREATE TABLE subscription_plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, monthly_price integer NOT NULL CHECK(monthly_price>=0), active boolean NOT NULL DEFAULT true);
CREATE TABLE subscriptions (owner_id uuid PRIMARY KEY REFERENCES users(id), plan_id uuid NOT NULL REFERENCES subscription_plans(id), status text NOT NULL CHECK(status IN ('pending','active','expired')), ends_at timestamptz);
CREATE TABLE sponsors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, url text NOT NULL);
CREATE TABLE sponsor_campaigns (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sponsor_id uuid NOT NULL REFERENCES sponsors(id), title text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at), active boolean NOT NULL DEFAULT true);
CREATE TABLE analytics_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, event text NOT NULL CHECK(event IN ('view','favorite','search','reserve','cancel','sponsor_click','sponsor_impression')), property_id uuid REFERENCES properties(id) ON DELETE SET NULL, campaign_id uuid REFERENCES sponsor_campaigns(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX analytics_property ON analytics_events(property_id,event,created_at);
CREATE TABLE audit_logs (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid REFERENCES users(id), action text NOT NULL, resource_id uuid, created_at timestamptz NOT NULL DEFAULT now());
CREATE FUNCTION prevent_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append only'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
CREATE TABLE matching_weights (criterion text PRIMARY KEY CHECK(criterion IN ('availability','city','capacity','budget','amenities')), weight integer NOT NULL CHECK(weight BETWEEN 0 AND 100));
INSERT INTO matching_weights VALUES ('availability',35),('city',20),('capacity',15),('budget',15),('amenities',15);
INSERT INTO amenities VALUES ('pool','Piscina'),('grill','Parrilla'),('wifi','Wi-Fi'),('parking','Estacionamiento'),('pets','Acepta mascotas'),('air','Aire acondicionado'),('kitchen','Cocina'),('accessible','Acceso adaptado');
INSERT INTO subscription_plans(name,monthly_price) VALUES ('Activo',30000),('Verificado',50000),('VIP',100000);
INSERT INTO geographic_locations(city,department,latitude,longitude) VALUES ('San Bernardino','Cordillera',-25.308,-57.296),('Aregua','Central',-25.312,-57.386),('Luque','Central',-25.270,-57.488),('Altos','Cordillera',-25.262,-57.251),('Caacupe','Cordillera',-25.386,-57.142),('Pirayu','Paraguari',-25.485,-57.230);
