-- Run with psql as the migration owner: psql -v app_role=nextora_app -f server/runtime-grants.sql
-- Create the LOGIN role separately through your database provider; never commit passwords.
GRANT USAGE ON SCHEMA nc TO :"app_role";
GRANT SELECT ON nc.users,nc.students,nc.programs,nc.internships,nc.certificates,
  nc.certificate_pdfs,nc.audit_logs,nc.invitations,nc.sessions,nc.rate_limits,nc.company_assets TO :"app_role";
GRANT INSERT ON nc.users,nc.students,nc.programs,nc.internships,nc.certificates,
  nc.certificate_pdfs,nc.audit_logs,nc.invitations,nc.sessions,nc.rate_limits TO :"app_role";
GRANT UPDATE(password_hash,must_change_password) ON nc.users TO :"app_role";
GRANT UPDATE(full_name,phone_number,college_name,university_name,course,specialization,registration_number,updated_at)
  ON nc.students TO :"app_role";
GRANT UPDATE ON nc.programs,nc.internships,nc.invitations,nc.rate_limits TO :"app_role";
GRANT UPDATE(status,revoked_at,revoked_by,revocation_reason) ON nc.certificates TO :"app_role";
GRANT DELETE ON nc.sessions,nc.invitations,nc.rate_limits TO :"app_role";
-- No schema ownership, migrations, DDL, audit edits, PDF edits, certificate deletion,
-- user role updates, or student reassignment for the runtime role.

GRANT SELECT,INSERT,UPDATE ON nc.applications,nc.document_templates,nc.company_assets TO :"app_role";
GRANT SELECT,UPDATE ON nc.company_settings TO :"app_role";
GRANT SELECT,INSERT ON nc.offer_letters,nc.template_revisions TO :"app_role";
GRANT UPDATE(status,revoked_at,revoked_by,revocation_reason) ON nc.offer_letters TO :"app_role";
