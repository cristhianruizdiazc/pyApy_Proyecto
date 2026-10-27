-- Preserve indispensable preferences when the customer explicitly saves a search.
ALTER TABLE search_intents ADD COLUMN required_amenities text[] NOT NULL DEFAULT '{}';
ALTER TABLE search_intents ADD COLUMN strict_city boolean NOT NULL DEFAULT false;
ALTER TABLE search_intents ADD COLUMN strict_budget boolean NOT NULL DEFAULT false;
