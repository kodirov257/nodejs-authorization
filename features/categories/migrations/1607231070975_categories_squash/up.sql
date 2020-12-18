
CREATE TABLE "public"."categories"("id" bigserial NOT NULL, "parent_id" bigint NOT NULL, "sort" integer NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "addins" json NOT NULL, PRIMARY KEY ("id") );
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_categories_updated_at"
BEFORE UPDATE ON "public"."categories"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_categories_updated_at" ON "public"."categories"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

alter table "public"."categories"
           add constraint "categories_parent_id_fkey"
           foreign key ("parent_id")
           references "public"."categories"
           ("id") on update restrict on delete restrict;


CREATE TABLE "public"."category_locales"("category_id" bigint NOT NULL, "code" character varying(6) NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "addins" json NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("category_id","code") , FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("code") REFERENCES "public"."locales"("value") ON UPDATE restrict ON DELETE restrict);
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_category_locales_updated_at"
BEFORE UPDATE ON "public"."category_locales"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_category_locales_updated_at" ON "public"."category_locales"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';


CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE OR REPLACE FUNCTION slugify("value" TEXT)
RETURNS TEXT AS $$
  -- removes accents (diacritic signs) from a given string --
  WITH "unaccented" AS (
    SELECT unaccent("value") AS "value"
  ),
  -- lowercases the string
  "lowercase" AS (
    SELECT lower("value") AS "value"
    FROM "unaccented"
  ),
  -- replaces anything that's not a letter, number, hyphen('-'), or underscore('_') with a hyphen('-')
  "hyphenated" AS (
    SELECT regexp_replace("value", '[^a-z0-9\\-_]+', '-', 'gi') AS "value"
    FROM "lowercase"
  ),
  -- trims hyphens('-') if they exist on the head or tail of the string
  "trimmed" AS (
    SELECT regexp_replace(regexp_replace("value", '\\-+$', ''), '^\\-', '') AS "value"
    FROM "hyphenated"
  )
  SELECT "value" FROM "trimmed";
$$ LANGUAGE SQL STRICT IMMUTABLE;

CREATE FUNCTION public.set_slug_from_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.slug := slugify(NEW.name);
  RETURN NEW;
END
$$;

ALTER TABLE "public"."category_locales" ADD COLUMN "slug" text NULL;


CREATE TRIGGER "trg_slug_insert_category_locales"
BEFORE INSERT ON "category_locales"
FOR EACH ROW
WHEN (NEW.name IS NOT NULL AND NEW.slug IS NULL)
EXECUTE PROCEDURE set_slug_from_name();
