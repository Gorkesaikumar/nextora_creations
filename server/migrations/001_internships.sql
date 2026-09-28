CREATE SCHEMA IF NOT EXISTS nc;
REVOKE ALL ON SCHEMA nc FROM PUBLIC;

CREATE TABLE nc.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text,
  role text NOT NULL CHECK (role IN ('ADMIN','STUDENT')),
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE nc.students (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES nc.users(id),
  full_name text NOT NULL,
  phone_number text NOT NULL DEFAULT '',
  college_name text NOT NULL DEFAULT '',
  university_name text NOT NULL DEFAULT '',
  course text NOT NULL DEFAULT '',
  specialization text NOT NULL DEFAULT '',
  registration_number text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE nc.programs (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  department text NOT NULL,
  duration_months integer NOT NULL DEFAULT 3 CHECK (duration_months BETWEEN 1 AND 60),
  minimum_duration_months integer NOT NULL DEFAULT 3 CHECK (minimum_duration_months BETWEEN 1 AND 60),
  start_date date,
  end_date date,
  certificate_template text NOT NULL DEFAULT 'nextora-v1' CHECK (certificate_template = 'nextora-v1'),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT','ACTIVE','ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (duration_months >= minimum_duration_months),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE TABLE nc.internships (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES nc.students(id),
  program_id uuid NOT NULL REFERENCES nc.programs(id),
  role text NOT NULL,
  department text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  minimum_duration_months integer NOT NULL CHECK (minimum_duration_months BETWEEN 1 AND 60),
  mentor text NOT NULL DEFAULT '',
  project text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'INVITED' CHECK (status IN
    ('INVITED','REGISTERED','ACTIVE','COMPLETED','CERTIFICATE_ELIGIBLE','CERTIFICATE_ISSUED','REJECTED','TERMINATED','CERTIFICATE_REVOKED')),
  admin_approved boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES nc.users(id),
  approved_at timestamptz,
  details_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT admin_approved OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND status IN ('CERTIFICATE_ELIGIBLE','CERTIFICATE_ISSUED','CERTIFICATE_REVOKED')))
);
CREATE INDEX internships_student_idx ON nc.internships(student_id);
CREATE INDEX internships_status_idx ON nc.internships(status);
CREATE INDEX internships_program_idx ON nc.internships(program_id);

CREATE TABLE nc.certificates (
  id uuid PRIMARY KEY,
  certificate_number text NOT NULL UNIQUE,
  internship_id uuid NOT NULL UNIQUE REFERENCES nc.internships(id),
  student_id uuid NOT NULL REFERENCES nc.students(id),
  snapshot jsonb NOT NULL,
  verification_url text NOT NULL,
  issued_at timestamptz NOT NULL,
  issued_by uuid NOT NULL REFERENCES nc.users(id),
  status text NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID','REVOKED')),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES nc.users(id),
  revocation_reason text,
  CHECK ((status = 'VALID' AND revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
    OR (status = 'REVOKED' AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND length(revocation_reason) > 0))
);
CREATE TABLE nc.certificate_pdfs (
  id uuid PRIMARY KEY,
  certificate_id uuid NOT NULL REFERENCES nc.certificates(id),
  revision integer NOT NULL CHECK (revision > 0),
  pdf bytea NOT NULL,
  sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES nc.users(id),
  UNIQUE(certificate_id,revision)
);
CREATE TABLE nc.audit_logs (
  id uuid PRIMARY KEY,
  event text NOT NULL,
  actor_id uuid REFERENCES nc.users(id),
  internship_id uuid REFERENCES nc.internships(id),
  certificate_id uuid REFERENCES nc.certificates(id),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_internship_idx ON nc.audit_logs(internship_id,created_at);
CREATE TABLE nc.invitations (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES nc.users(id),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invitations_user_idx ON nc.invitations(user_id);
CREATE TABLE nc.sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES nc.users(id),
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON nc.sessions(user_id);
CREATE TABLE nc.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX rate_limits_expiry_idx ON nc.rate_limits(expires_at);

CREATE FUNCTION nc.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Historical record is immutable'; END;
$$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON nc.audit_logs FOR EACH ROW EXECUTE FUNCTION nc.reject_mutation();
CREATE TRIGGER pdf_append_only BEFORE UPDATE OR DELETE ON nc.certificate_pdfs FOR EACH ROW EXECUTE FUNCTION nc.reject_mutation();
CREATE FUNCTION nc.guard_certificate() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Certificates cannot be deleted'; END IF;
  IF OLD.status = 'REVOKED' OR
     (to_jsonb(NEW) - ARRAY['status','revoked_at','revoked_by','revocation_reason']) IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['status','revoked_at','revoked_by','revocation_reason'])
  THEN RAISE EXCEPTION 'Certificate history is immutable'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER certificate_history BEFORE UPDATE OR DELETE ON nc.certificates FOR EACH ROW EXECUTE FUNCTION nc.guard_certificate();
