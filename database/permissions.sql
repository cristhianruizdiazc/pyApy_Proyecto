GRANT USAGE ON SCHEMA public TO pyapy_app,pyapy_reporter;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO pyapy_app;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO pyapy_app;
REVOKE UPDATE,DELETE ON audit_logs FROM pyapy_app;
REVOKE ALL ON schema_migrations FROM pyapy_app;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM pyapy_reporter;
GRANT SELECT ON administrative_property_report TO pyapy_reporter;
