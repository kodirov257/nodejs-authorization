SET check_function_bodies = false;
CREATE SCHEMA auth;
CREATE TABLE auth.profiles (
    user_id uuid NOT NULL,
    first_name character varying(50),
    middle_name character varying(50),
    last_name character varying(50),
    date_of_birth date,
    gender smallint,
    avatar character varying(255)
);
CREATE TABLE auth.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_agent text,
    ip_address text,
    refresh_token character varying(1024) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE auth.user_verifications (
    user_id uuid NOT NULL,
    email_verify_token character varying(100),
    email_verified boolean DEFAULT false NOT NULL,
    phone_verify_token character varying(10),
    phone_verify_token_expire timestamp with time zone,
    phone_verified boolean DEFAULT false NOT NULL
);
CREATE TABLE auth.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
ALTER TABLE ONLY auth.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY auth.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.user_verifications
    ADD CONSTRAINT user_verifications_email_verify_token_key UNIQUE (email_verify_token);
ALTER TABLE ONLY auth.user_verifications
    ADD CONSTRAINT user_verifications_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY auth.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY auth.user_verifications
    ADD CONSTRAINT user_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE CASCADE;
