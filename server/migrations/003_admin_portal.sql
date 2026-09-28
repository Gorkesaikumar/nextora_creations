ALTER TABLE nc.users ADD COLUMN display_name text NOT NULL DEFAULT '';
ALTER TABLE nc.users ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;

ALTER TABLE nc.programs ADD COLUMN slug text;
UPDATE nc.programs SET slug='program-' || id::text WHERE slug IS NULL;
ALTER TABLE nc.programs ALTER COLUMN slug SET NOT NULL;
ALTER TABLE nc.programs ADD CONSTRAINT programs_slug_unique UNIQUE(slug);
ALTER TABLE nc.programs ADD COLUMN role text NOT NULL DEFAULT 'Intern';
ALTER TABLE nc.programs ADD COLUMN responsibilities text NOT NULL DEFAULT '';
ALTER TABLE nc.programs ADD COLUMN skills text NOT NULL DEFAULT '';
ALTER TABLE nc.programs ADD COLUMN eligibility text NOT NULL DEFAULT '';
ALTER TABLE nc.programs ADD COLUMN application_deadline date;
ALTER TABLE nc.programs ADD COLUMN internship_type text NOT NULL DEFAULT 'INTERNSHIP';
ALTER TABLE nc.programs ADD COLUMN location text NOT NULL DEFAULT '';
ALTER TABLE nc.programs ADD COLUMN work_mode text NOT NULL DEFAULT 'REMOTE' CHECK(work_mode IN ('REMOTE','HYBRID','ONSITE'));
ALTER TABLE nc.programs ADD COLUMN positions integer NOT NULL DEFAULT 1 CHECK(positions BETWEEN 1 AND 10000);
ALTER TABLE nc.programs ADD COLUMN applications_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE nc.programs DROP CONSTRAINT programs_status_check;
-- ACTIVE remains accepted for existing integrations; new administration uses PUBLISHED.
ALTER TABLE nc.programs ADD CONSTRAINT programs_status_check CHECK(status IN ('DRAFT','ACTIVE','PUBLISHED','CLOSED','ARCHIVED'));

ALTER TABLE nc.internships ADD COLUMN workflow_version integer NOT NULL DEFAULT 1 CHECK(workflow_version IN (1,2));
ALTER TABLE nc.internships ADD COLUMN enrollment_approved_by uuid REFERENCES nc.users(id);
ALTER TABLE nc.internships ADD COLUMN enrollment_approved_at timestamptz;
ALTER TABLE nc.internships ADD COLUMN work_mode text NOT NULL DEFAULT 'REMOTE' CHECK(work_mode IN ('REMOTE','HYBRID','ONSITE'));
ALTER TABLE nc.internships DROP CONSTRAINT internships_status_check;
ALTER TABLE nc.internships ADD CONSTRAINT internships_status_check CHECK(status IN
 ('INVITED','REGISTERED','APPROVED','OFFER_LETTER_ISSUED','ACTIVE','COMPLETED','CERTIFICATE_ELIGIBLE','CERTIFICATE_ISSUED','REJECTED','TERMINATED','CERTIFICATE_REVOKED'));

CREATE TABLE nc.applications (
 id uuid PRIMARY KEY,
 program_id uuid NOT NULL REFERENCES nc.programs(id),
 email text NOT NULL CHECK(email=lower(email)),
 profile jsonb NOT NULL,
 motivation text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED','UNDER_REVIEW','ACCEPTED','REJECTED')),
 internship_id uuid UNIQUE REFERENCES nc.internships(id),
 reviewed_by uuid REFERENCES nc.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(program_id,email),
 CHECK ((status='ACCEPTED') = (internship_id IS NOT NULL))
);
CREATE INDEX applications_status_idx ON nc.applications(status,created_at);
CREATE INDEX students_college_idx ON nc.students(college_name);
CREATE INDEX internships_dates_idx ON nc.internships(start_date,end_date);
CREATE INDEX audit_events_idx ON nc.audit_logs(event,created_at);
