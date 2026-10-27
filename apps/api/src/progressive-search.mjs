import { searchConfig } from "./search-config.mjs";

// Filter, rank, count and paginate in PostgreSQL. Only hydrate selected properties.
export async function selectSearch(db, input, demo) {
  const q = {
    ...input,
    demo,
    required: [...new Set(input.requiredAmenities.split(",").filter(Boolean))],
    wanted: [...new Set(input.amenities.split(",").filter(Boolean))],
  };
  if (!q.city) delete q.city;
  const result = await db.query(
    `
WITH input AS (SELECT $1::jsonb q,$2::jsonb c),
base AS (
 SELECT p.id,p.capacity,p.city_id,g.city,pr.price_per_hour,a.*,
 q,c, (q->>'startsAt')::timestamptz s,(q->>'endsAt')::timestamptz e,
 ARRAY(SELECT amenity_code FROM property_amenities WHERE property_id=p.id) services,
 (NOT (q ? 'city') OR lower(g.city)=lower(q->>'city')) city_ok,
 (SELECT 6371*2*asin(sqrt(least(1.0,power(sin(radians((p.latitude-ref.latitude)::float8)/2),2)+cos(radians(p.latitude::float8))*cos(radians(ref.latitude::float8))*power(sin(radians((p.longitude-ref.longitude)::float8)/2),2))))
 FROM geographic_locations ref WHERE lower(ref.city)=lower(q->>'city')) distance
 FROM properties p JOIN users u ON u.id=p.owner_id AND u.active
 JOIN geographic_locations g ON g.id=p.city_id JOIN pricing_rules pr ON pr.property_id=p.id
 JOIN availability_rules a ON a.property_id=p.id CROSS JOIN input
 WHERE p.status='published' AND p.capacity>=(q->>'guests')::int
 AND (NOT (q ? 'kind') OR p.kind=q->>'kind') AND ((q->>'demo')::boolean OR NOT p.is_demo)
), facts AS (
 SELECT *,ceil(COALESCE(extract(epoch FROM(e-s))/3600,min_hours))*price_per_hour total,
 ARRAY(SELECT jsonb_array_elements_text(q->'wanted') EXCEPT SELECT unnest(services)) missing,
 s IS NULL OR (search_period_valid(s,e,min_hours,max_hours,open_hour,close_hour) AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.property_id=base.id AND status='confirmed' AND tstzrange(r.starts_at,r.ends_at,'[)') && tstzrange(s,e,'[)'))) period_ok
 FROM base WHERE services @> ARRAY(SELECT jsonb_array_elements_text(q->'required'))
), criteria AS (
 SELECT *,NOT(q ? 'budget') OR total<=(q->>'budget')::numeric budget_ok FROM facts
), classified AS (
 SELECT *,CASE
 WHEN period_ok AND city_ok AND budget_ok AND cardinality(missing)=0 THEN 'exact'
 WHEN period_ok AND NOT city_ok AND budget_ok AND cardinality(missing)=0 AND NOT(q->>'strictCity')::boolean AND distance<=(c->'radiiKm'->>-1)::float8 THEN 'location'
 WHEN period_ok AND city_ok AND NOT budget_ok AND cardinality(missing)=0 AND NOT(q->>'strictBudget')::boolean AND total<=(q->>'budget')::numeric*(1+(c->>'maxOverpricePercent')::numeric/100) THEN 'budget'
 WHEN period_ok AND city_ok AND budget_ok AND cardinality(missing)>0 THEN 'services'
 WHEN NOT period_ok AND city_ok AND budget_ok AND cardinality(missing)=0 AND s IS NOT NULL THEN 'schedule'
 END stage FROM criteria
), verified AS (
 SELECT classified.*,alt.alt_s,alt.alt_e FROM classified
 LEFT JOIN LATERAL (
 SELECT s+i*(c->>'stepHours')::int*interval '1 hour' alt_s,e+i*(c->>'stepHours')::int*interval '1 hour' alt_e
 FROM generate_series(1,least((c->>'maxProbes')::int,24*(c->>'windowDays')::int/(c->>'stepHours')::int)) i
 WHERE stage='schedule' AND search_period_valid(s+i*(c->>'stepHours')::int*interval '1 hour',e+i*(c->>'stepHours')::int*interval '1 hour',min_hours,max_hours,open_hour,close_hour)
 AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.property_id=classified.id AND status='confirmed' AND tstzrange(r.starts_at,r.ends_at,'[)') && tstzrange(s+i*(c->>'stepHours')::int*interval '1 hour',e+i*(c->>'stepHours')::int*interval '1 hour','[)'))
 ORDER BY i LIMIT 1
 ) alt ON stage='schedule'
 WHERE stage IS NOT NULL
), scored AS (
 SELECT *,COALESCE((SELECT sum(weight*CASE criterion WHEN 'availability' THEN 1 WHEN 'capacity' THEN 1 WHEN 'city' THEN city_ok::int WHEN 'budget' THEN budget_ok::int WHEN 'amenities' THEN CASE WHEN jsonb_array_length(q->'wanted')=0 THEN 1 ELSE 1-cardinality(missing)::numeric/jsonb_array_length(q->'wanted') END ELSE 0 END)/NULLIF(sum(weight),0)*100 FROM matching_weights),0) score
 FROM verified WHERE stage<>'schedule' OR alt_s IS NOT NULL
), ranked AS (
 SELECT *,row_number() OVER (PARTITION BY stage='exact' ORDER BY
 CASE stage WHEN 'exact' THEN 0 WHEN 'location' THEN 1 WHEN 'budget' THEN 2 WHEN 'services' THEN 3 ELSE 4 END,
 CASE WHEN stage='location' THEN (SELECT min(v::float8) FROM jsonb_array_elements_text(c->'radiiKm') v WHERE distance<=v::float8) END,
 CASE WHEN q->>'sort'='price' THEN total WHEN q->>'sort'='capacity' THEN capacity ELSE -score END,id) position
 FROM scored
)
SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'stage',stage,'total',total,'missing',missing,'distance',distance,'score',score,'startsAt',alt_s,'endsAt',alt_e) ORDER BY stage='exact' DESC,position) FILTER(WHERE (stage='exact' AND position BETWEEN (($1::jsonb->>'page')::int-1)*20+1 AND ($1::jsonb->>'page')::int*20) OR (stage<>'exact' AND position<=($2::jsonb->>'alternatives')::int)), '[]') selected,
 count(*) FILTER(WHERE stage='exact')::int total,
 count(*) FILTER(WHERE stage<>'exact')::int alternative_total
FROM ranked`,
    [JSON.stringify(q), JSON.stringify(searchConfig)],
  );
  return result.rows[0];
}
