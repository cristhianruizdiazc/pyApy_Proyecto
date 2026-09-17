CREATE OR REPLACE VIEW administrative_property_report AS
SELECT p.id, p.name, p.status,
 count(r.id) FILTER(WHERE r.status='confirmed' AND r.kind='pyapy') AS pyapy_reservations,
 COALESCE(sum(r.total_amount) FILTER(WHERE r.status='confirmed' AND r.kind='pyapy'),0) AS reserved_amount_pyg
FROM properties p LEFT JOIN reservations r ON r.property_id=p.id GROUP BY p.id,p.name,p.status;
