-- Optional helper: run as a Postgres superuser once
-- psql -U postgres -f db/scripts/create_database.sql

CREATE USER nsc_erms WITH PASSWORD 'change_me';
CREATE DATABASE nsc_erms OWNER nsc_erms;
GRANT ALL PRIVILEGES ON DATABASE nsc_erms TO nsc_erms;

\c nsc_erms
GRANT ALL ON SCHEMA public TO nsc_erms;
ALTER DATABASE nsc_erms SET timezone TO 'Asia/Manila';
