#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
\getenv app_password APP_DB_PASSWORD
\getenv report_password REPORT_DB_PASSWORD
CREATE ROLE pyapy_app LOGIN PASSWORD :'app_password';
CREATE ROLE pyapy_reporter LOGIN PASSWORD :'report_password';
ALTER ROLE pyapy_reporter SET default_transaction_read_only=on;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SQL
