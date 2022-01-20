SET check_function_bodies = false;
CREATE SCHEMA core;
CREATE TABLE core.logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_type character varying(25) NOT NULL,
    code integer NOT NULL,
    message character varying(255) NOT NULL,
    stacktrace text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY core.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);
