-- Run with psql as the migration owner: psql -v app_role=nextora_app -f server/runtime-grants.sql
-- Create the LOGIN role separately through your database provider; never commit passwords.
GRANT USAGE ON SCHEMA nc TO :"app_role";
GRANT SELECT ON nc.users,nc.students,nc.programs,nc.internships,nc.certificates,
  nc.certificate_pdfs,nc.audit_logs,nc.invitations,nc.sessions,nc.rate_limits,nc.company_assets TO :"app_role";
GRANT INSERT ON nc.users,nc.students,nc.programs,nc.internships,nc.certificates,
  nc.certificate_pdfs,nc.audit_logs,nc.invitations,nc.sessions,nc.rate_limits TO :"app_role";
GRANT UPDATE(password_hash) ON nc.users TO :"app_role";
GRANT UPDATE(full_name,phone_number,college_name,university_name,course,specialization,registration_number,updated_at)
  ON nc.students TO :"app_role";
GRANT UPDATE ON nc.programs,nc.internships,nc.invitations,nc.rate_limits TO :"app_role";
GRANT UPDATE(status,revoked_at,revoked_by,revocation_reason) ON nc.certificates TO :"app_role";
GRANT DELETE ON nc.sessions,nc.invitations,nc.rate_limits TO :"app_role";
-- No schema ownership, migrations, DDL, audit edits, PDF edits, certificate deletion,
-- signature writes, user role updates, or student reassignment for the runtime role.
