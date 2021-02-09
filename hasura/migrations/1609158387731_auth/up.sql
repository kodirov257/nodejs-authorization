CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.user_sessions (
                                    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
                                    user_agent text,
                                    ip_address text,
                                    user_id bigint NOT NULL,
                                    refresh_token character varying(1024) NOT NULL,
                                    expires_at timestamp with time zone NOT NULL,
                                    created_at timestamp with time zone DEFAULT now() NOT NULL,
                                    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE auth.user_verifications (
                                         user_id bigint NOT NULL,
                                         email_verify_token character varying(100),
                                         email_verified boolean DEFAULT false NOT NULL,
                                         phone_verify_token character varying(10),
                                         phone_verify_token_expire timestamp with time zone,
                                         phone_verified boolean DEFAULT false NOT NULL
);
CREATE TABLE auth.user_networks (
                                    user_id bigint NOT NULL,
                                    network character varying(50) NOT NULL,
                                    identity character varying(50) NOT NULL
);
CREATE TABLE auth.users (
                            id bigint NOT NULL,
                            username character varying(50),
                            email character varying(50),
                            phone character varying(15),
                            password character varying(255),
                            role character varying(50) NOT NULL,
                            status smallint NOT NULL,
                            secret_token character varying(255) NOT NULL,
                            created_at timestamp with time zone DEFAULT now() NOT NULL,
                            updated_at timestamp with time zone DEFAULT now() NOT NULL,
                            last_seen_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE OR REPLACE FUNCTION auth.check_content_length()
    RETURNS trigger AS $$
DECLARE
    DECLARE username_length INTEGER;
    DECLARE email_length INTEGER;
    DECLARE phone_length INTEGER;
    DECLARE role_length INTEGER;
    DECLARE username_regex BOOLEAN;
    DECLARE email_regex BOOLEAN;
    DECLARE phone_regex BOOLEAN;
    DECLARE role_regex BOOLEAN;
BEGIN
    IF NEW.username IS NOT NULL THEN
select length(NEW.username) INTO username_length;
IF username_length < 3 THEN
            RAISE EXCEPTION 'Username can not have less than 3 characters. Username: %. Length: %', NEW.username, username_length;
END IF;
        IF username_length > 50 THEN
            RAISE EXCEPTION 'Username can not have more than 50 characters. Username: %. Length: %', NEW.username, username_length;
END IF;
select NEW.username ~* '^[a-z0-9]+$' INTO username_regex;
IF NOT username_regex THEN
            RAISE EXCEPTION 'Username is not alphanumeric.';
END IF;
END IF;
    IF NEW.email IS NOT NULL THEN
select length(NEW.email) INTO email_length;
IF email_length < 5 THEN
            RAISE EXCEPTION 'Email can not have less than 5 characters';
END IF;
        IF email_length > 50 THEN
            RAISE EXCEPTION 'Email can not have more than 50 characters';
END IF;
select NEW.email ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$' INTO email_regex;
IF NOT email_regex THEN
            RAISE EXCEPTION 'Email does not match to the right format';
end if;
END IF;
    IF NEW.phone IS NOT NULL THEN
select length(NEW.phone) INTO phone_length;
IF phone_length > 15 THEN
            RAISE EXCEPTION 'Phone number can not have more than 15 characters';
END IF;
select NEW.phone ~ '\+?998[0-9]{9}$' INTO phone_regex;
IF NOT phone_regex THEN
            RAISE EXCEPTION 'Phone number does not match to the right format';
end if;
END IF;
    IF NEW.role IS NOT NULL THEN
select length(NEW.role) INTO role_length;
IF role_length < 3 THEN
            RAISE EXCEPTION 'Role can not have less than 3 characters.';
END IF;
        IF role_length > 50 THEN
            RAISE EXCEPTION 'Username can not have more than 50 characters.';
END IF;
select NEW.role ~* '^[a-z0-9]+$' INTO role_regex;
IF NOT role_regex THEN
            RAISE EXCEPTION 'Role is not alphanumeric.';
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE SEQUENCE auth.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE auth.users_id_seq OWNED BY auth.users.id;
ALTER TABLE ONLY auth.users ALTER COLUMN id SET DEFAULT nextval('auth.users_id_seq'::regclass);
ALTER TABLE ONLY auth.user_networks
    ADD CONSTRAINT user_networks_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY auth.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.user_verifications
    ADD CONSTRAINT user_verifications_email_verify_token_key UNIQUE (email_verify_token);
ALTER TABLE ONLY auth.user_verifications
    ADD CONSTRAINT user_verifications_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);
ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_secret_token_key UNIQUE (secret_token);
ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
CREATE TRIGGER check_content_length_trigger BEFORE INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION auth.check_content_length();
ALTER TABLE ONLY auth.user_networks
    ADD CONSTRAINT user_networks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY auth.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY auth.user_verifications
    ADD CONSTRAINT user_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;
