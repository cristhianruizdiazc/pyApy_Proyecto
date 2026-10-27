-- Same duration/opening rules as validatePeriod; reservations remain authoritative.
CREATE FUNCTION search_period_valid(s timestamptz, e timestamptz, minimum integer, maximum integer, opening integer, closing integer)
RETURNS boolean LANGUAGE sql STABLE AS $$
 WITH local AS (SELECT s AT TIME ZONE 'America/Asuncion' a, e AT TIME ZONE 'America/Asuncion' b),
 bounds AS (SELECT *, date_trunc('day',a) - CASE WHEN closing<=opening AND extract(hour FROM a)<closing THEN interval '1 day' ELSE interval '0' END d FROM local)
 SELECT s>now() AND extract(epoch FROM (e-s))/3600 BETWEEN minimum AND maximum
 AND ((opening=0 AND closing=24) OR (a>=d+opening*interval '1 hour' AND b<=d+closing*interval '1 hour'+CASE WHEN closing<=opening THEN interval '1 day' ELSE interval '0' END)) FROM bounds
$$;
ALTER TABLE analytics_events ADD COLUMN search_stage text CHECK(search_stage IN ('exact','location','budget','services','schedule'));
ALTER TABLE analytics_events ADD COLUMN search_outcome text CHECK(search_outcome IN ('exact','alternatives','empty'));
ALTER TABLE analytics_events DROP CONSTRAINT analytics_events_event_check;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_check CHECK(event IN ('view','favorite','search','reserve','cancel','sponsor_click','sponsor_impression','search_select'));
CREATE INDEX properties_search_active ON properties(capacity,kind,id) WHERE status='published';
