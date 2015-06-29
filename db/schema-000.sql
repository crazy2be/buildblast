BEGIN;

CREATE OR REPLACE FUNCTION make_plpgsql()
RETURNS VOID
LANGUAGE SQL
AS $$
CREATE LANGUAGE plpgsql;
$$;

SELECT
    CASE
    WHEN EXISTS(
        SELECT 1
        FROM pg_catalog.pg_language
        WHERE lanname='plpgsql'
    )
    THEN NULL
    ELSE make_plpgsql() END;

DROP FUNCTION make_plpgsql();

-- Millisecond precision; UTC.
CREATE DOMAIN t_timestamp AS timestamp(3) with time zone;

-- Globally unique identifier for entities which can be created by client or server.
CREATE DOMAIN t_guid AS bytea;

-- Autoincrementing identifier for entities which can only be created by the server.
-- Use t_id for foreign key and other references, and use "bigserial" to declare primary
-- key columns.
CREATE DOMAIN t_id AS bigint;

-- URLs.
CREATE DOMAIN t_url AS varchar(1000);

-- Names: for people, organizations, MIME types, etc.
CREATE DOMAIN t_name AS varchar(250);
CREATE DOMAIN t_email AS varchar(250);

-- Hashed password
CREATE DOMAIN t_password AS varchar(250);

-- Random hash value, used for sessions and similar things.
CREATE DOMAIN t_hash_key AS varchar(250);

-- Track changes to the schema.
CREATE TABLE schema_tracker (
    schema_version integer NOT NULL PRIMARY KEY,
    description text NOT NULL,
    deployed_at t_timestamp NOT NULL DEFAULT now()
);

-- System configuration items.  Each database stores settings specific to an instance of the
-- web-app, so that the personality of the web-app server is determined completely by the
-- database to which it connects.
CREATE TABLE system_config (
    -- This check constraint ensures we only have one row in the table.
    id integer NOT NULL PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    created_at t_timestamp NOT NULL DEFAULT now(),
    modified_at t_timestamp NOT NULL DEFAULT now()
);

CREATE FUNCTION system_config_stamp_time() RETURNS trigger AS $system_config_stamp_time$
    BEGIN
        NEW.modified_at := now();
        RETURN NEW;
    END;
$system_config_stamp_time$ LANGUAGE plpgsql;

CREATE TRIGGER system_config_modified
    BEFORE UPDATE ON system_config FOR EACH ROW
    EXECUTE PROCEDURE system_config_stamp_time();

-- DOIT: Write the objects for the user accounts

CREATE TABLE account (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    created_at t_timestamp NOT NULL DEFAULT now(),

    username t_name NULL,
    email_address t_email NOT NULL,
    password t_password NOT NULL,

    email_confirmed boolean NOT NULL DEFAULT false
);

CREATE INDEX account_username ON account (username);
CREATE INDEX account_email_address ON account (email_address);

CREATE TABLE account_session (
    key t_hash_key NOT NULL PRIMARY KEY,
    account_id t_id NOT NULL REFERENCES account ON UPDATE CASCADE ON DELETE CASCADE,
    login_time t_timestamp NOT NULL DEFAULT now(),
    last_seen_at t_timestamp NOT NULL DEFAULT now()
);

CREATE INDEX account_session_account_id ON account_session (account_id);

CREATE TABLE email_confirmation (
    key t_hash_key NOT NULL PRIMARY KEY,
    account_id t_id NOT NULL REFERENCES account ON UPDATE CASCADE ON DELETE CASCADE,
    created_at t_timestamp NOT NULL DEFAULT now()
);

CREATE INDEX email_confirmation_account_id ON email_confirmation (account_id);

INSERT INTO schema_tracker (schema_version, description) VALUES
    (0, 'Initial schema.');

COMMIT;