CREATE TABLE nc.document_templates (
 id uuid PRIMARY KEY,
 kind text NOT NULL CHECK(kind IN ('CERTIFICATE','OFFER')),
 name text NOT NULL,
 draft jsonb NOT NULL,
 published_config jsonb,
 active boolean NOT NULL DEFAULT false,
 revision integer NOT NULL DEFAULT 1,
 published_revision integer,
 updated_by uuid NOT NULL REFERENCES nc.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(NOT active OR (published_config IS NOT NULL AND published_revision IS NOT NULL))
);
CREATE UNIQUE INDEX one_active_document_template ON nc.document_templates(kind) WHERE active;
CREATE TABLE nc.template_revisions (
 id uuid PRIMARY KEY,
 template_id uuid NOT NULL REFERENCES nc.document_templates(id),
 revision integer NOT NULL,
 config jsonb NOT NULL,
 actor_id uuid NOT NULL REFERENCES nc.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(template_id,revision)
);
CREATE TRIGGER template_revision_history BEFORE UPDATE OR DELETE ON nc.template_revisions FOR EACH ROW EXECUTE FUNCTION nc.reject_mutation();

ALTER TABLE nc.company_assets DROP CONSTRAINT company_assets_name_check;
ALTER TABLE nc.company_assets ADD CONSTRAINT company_assets_name_check CHECK(name IN ('authorized_signature','company_logo'));
CREATE TABLE nc.company_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 company_name text NOT NULL DEFAULT 'Nextora Creations',
 founder_name text NOT NULL DEFAULT 'Gorke Sai Kumar',
 founder_title text NOT NULL DEFAULT 'Founder',
 website text NOT NULL DEFAULT 'https://nextoracreations.co.in',
 identifiers text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES nc.users(id)
);
INSERT INTO nc.company_settings(id) VALUES(true);
