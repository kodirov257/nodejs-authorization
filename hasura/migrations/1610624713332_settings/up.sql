CREATE TABLE IF NOT EXISTS core.settings (
    key character varying(50) NOT NULL,
    value jsonb NOT NULL,
    component character varying(255)
);
ALTER TABLE ONLY core.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);
