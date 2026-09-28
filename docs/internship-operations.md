# Nextora internship and certificate system

## Delivery status

Implemented inside the existing website. The landing page, lead form, fonts, logo,
navbar and footer are reused. There is no second website and no browser-only source
of certificate authority. Production has **not** been deployed or migrated by this
task: configure PostgreSQL, bootstrap a real company administrator and provision the
authorized signature before going live. No production credentials or signature were
available. Tests use disposable databases, example.test identities and a clearly
marked test signature, never actual company issuance records.

Read [the architecture audit](internship-architecture.md) for the pre-implementation
findings and design decisions. The older, unconnected recruitment demo files remain
untouched and are not imported by this feature.

## Architecture implemented

```text
Existing Vite / Tailwind website
  /internships                  Active program directory
  /internship/certificate        Student authentication and records
  /internship/certificate/:uuid   Owned internship and PDF actions
  /verify-certificate            Public certificate lookup
  /verify-certificate/:number    Direct QR destination
  /admin/internships             Authenticated company workspace
                 |
       same-origin /api/*
                 |
       Netlify Function (Node 22)
       strict validation / sessions / CSRF / roles / ownership
                 |
          PostgreSQL nc schema
       records + snapshots + private PDFs + audit + private signature
```

Local development uses the same Request/Response handler through a small Node HTTP
adapter. Vite proxies /api to it. Deployment preserves Netlify's existing static
build and adds one function. Private PDF storage is PostgreSQL bytea, so artifacts
persist across deploys and function cold starts. Regeneration appends a PDF revision;
it does not allocate another certificate number or rewrite the issuance snapshot.

The official QR origin is `https://nextoracreations.co.in`, verified against existing
repository Netlify/domain configuration. Request headers never choose the QR origin.
APP_URL is independently configured for browser same-origin checks and invitations.

## Entities and migrations

| Entity | Purpose |
|---|---|
| nc.users | Administrator/student identities, scrypt password hashes, disabled flag |
| nc.students | Private student profile linked one-to-one with an account |
| nc.programs | Configurable duration, minimum calendar months, schedule and template |
| nc.internships | Company-approved dates, student assignment, lifecycle, mentor/project |
| nc.certificates | Unique random public number, one-per-internship constraint, immutable snapshot, revocation |
| nc.certificate_pdfs | Private PDF bytes, SHA-256 digest, append-only revision history |
| nc.audit_logs | Append-only event, actor, timestamp, internship, certificate and metadata |
| nc.invitations | Hashed single-use activation/recovery tokens with 48-hour expiry |
| nc.sessions | Hashed opaque sessions, session-bound CSRF token, eight-hour expiry |
| nc.rate_limits | Atomic shared counters across function instances |
| nc.company_assets | Privately provisioned, company-controlled signature PNG |
| nc.schema_migrations | Migration checksums and application timestamps |

`001_internships.sql` creates normalized entities, foreign keys, checks, lookup indexes
and history-preserving triggers. `002_company_assets.sql` adds private signature
storage. Migrations are additive, transactional, versioned, checksum-verified and
serialized with an advisory lock. The runner never resets a database and never runs
automatically on a production build. Do not change an applied SQL file; add a new one.

Enrollment copies the program's minimum duration. Later program edits affect new
enrollments only. A program defaults to three **calendar months**: 31 January + three
months becomes 30 April, not a fixed 90-day approximation. Eligibility requires:

1. Today's UTC date is on/after both the eligible date and approved end date.
2. The approved end date itself spans the required calendar months.
3. Status is CERTIFICATE_ELIGIBLE with explicit administrator approval.
4. No revoked certificate exists for that internship.

Status transitions are enforced server-side. Completed records alone cannot issue.
Editing an unissued internship clears prior approval. Issued internships are locked.
Profile confirmation is blocked while any of that student's internships awaits
issuance with an approval, so a student cannot substitute their name after approval.
Profile edits after issuance do not change the certificate or its public record.

## API inventory

All paths below have the `/api` prefix. Errors are JSON with safe messages; private
and public verification responses use `Cache-Control: no-store`. Mutations require
the exact APP_URL Origin, JSON content type and, after sign-in, X-CSRF-Token.

| Method | Path | Access / operation |
|---|---|---|
| GET | /programs | Public active programs |
| GET | /verify/:certificateNumber | Public allowlisted VERIFIED / REVOKED / NOT_FOUND projection |
| POST | /auth/login | Email and password; establishes HttpOnly session |
| POST | /auth/activate | Single-use invitation + matching email + new password |
| GET | /auth/me | Authenticated user and session CSRF token |
| POST | /auth/logout | Revoke current session |
| POST | /auth/password | Verify current password, change it, revoke all sessions |
| GET | /me/internships | Owned, paginated records |
| GET | /me/internships/:uuid | Owned internship details and server eligibility |
| PATCH | /me/internships/:uuid/details | Confirm own permitted profile fields only |
| POST | /me/internships/:uuid/issue | Issue only if company-approved and eligible |
| GET | /me/internships/:uuid/pdf | Authenticated PDF download; ?view=1 for inline view |
| GET / POST | /admin/programs | List / create programs |
| PATCH | /admin/programs/:uuid | Edit or archive program |
| GET | /admin/summary | Six dashboard counts |
| GET / POST | /admin/internships | Search/list / create student internship |
| GET / PATCH | /admin/internships/:uuid | Review / edit unissued authoritative record |
| POST | /admin/internships/:uuid/status | Validate and perform lifecycle transition |
| POST | /admin/internships/:uuid/invite | Create private activation/recovery link |
| POST | /admin/internships/:uuid/issue | Idempotent server-side issuance |
| GET | /admin/internships/:uuid/pdf | View/download valid certificate |
| POST | /admin/internships/:uuid/regenerate | Append PDF revision from original snapshot |
| POST | /admin/internships/:uuid/revoke | Permanent revocation with private reason |
| GET | /admin/internships/:uuid/history | Audit history, 100 per page, `before` cursor |

Internship lists accept `search`, `status`, `page`; pages contain 25 records. Program
directories are capped at 200 programs. Public endpoints do not list students or
certificates. Malformed/unknown certificate IDs receive the same NOT_FOUND response.
Email, phone, registration number, college, project, approval actor, signature bytes
and revocation reasons are never part of public verification.

## Security protections

- Node crypto scrypt (N=32768, r=8, p=1) with per-password random salt; passwords
  require 12–128 characters. There are no default real administrator credentials.
- 256-bit random opaque sessions and invitation tokens; only hashes stored in DB.
  Production sessions use `__Host-`, Secure, HttpOnly, SameSite=Strict and Path=/.
- Database-backed role and ownership checks on every private request, including PDFs.
  Administrator UI is absent until authenticated; it is not advertised in public links.
- Exact Origin checks, session-bound CSRF tokens, no cross-origin API permissions,
  strict input schemas, control-character rejection and bounded 16 KB JSON bodies.
- Parameterized SQL throughout, no dynamic user-controlled column/table names.
- Shared IP and account login limits, activation limits, issuance limits and public
  verification limit of 30/minute/IP. IP keys are HMAC-hashed using RATE_LIMIT_SECRET.
  Netlify's trusted context.ip is used; request-supplied forwarded IPs are not trusted.
- Atomic transactions, row locks, one-per-internship UNIQUE constraint and 96-bit
  cryptographically random public certificate numbers (`NC-INT-year-24HEX`).
- Immutable certificate snapshot, append-only audit/PDF triggers, permanent revocation.
  Snapshots preserve the original authorized signature bytes and digest for regeneration.
- PNG signature type, byte-size, dimensions and actual image decoding checked before
  provisioning. Students cannot upload assets or access a signature-management API.
- Safe DOM text escaping, no localStorage credentials/authority, no email/name-based
  public retrieval, no private PDFs under public/ or dist/.
- Existing site security headers retained; private routes add no-store/noindex.
  Analytics is initialized only on the original homepage, not invitation/account or
  verification URLs. Invitation fragments are cleared immediately on portal entry.
- No passwords, invitation tokens or connection strings in audit metadata/error logs.
  Use a separate restricted DB runtime role; supplied grants exclude history edits,
  schema mutation, signature writes and role updates.

The drawn authorized signature is a controlled company asset; this does not claim a
PKI digital signature on the PDF. Authenticity is checked through the official live
verification record. Previously downloaded copies cannot be recalled; revocation is
visible at the QR destination and prevents new downloads.

## Local development

Prerequisites: Node >=22.15, npm, Docker Desktop. The optional browser suite uses a
locally installed Chrome. The test runner creates and removes its own PostgreSQL 17
container; it never accepts your existing production database as a test target.

```powershell
npm ci
Copy-Item .env.example .env
docker compose up -d db
npm run db:migrate
```

Edit the ignored `.env`. Set ADMIN_EMAIL and a new, strong ADMIN_PASSWORD. Then:

```powershell
npm run admin:create
```

Remove ADMIN_PASSWORD after bootstrap. To provision the company-authorized signature,
save it outside public/, for example `private/authorized-signature.png`. Set
CERTIFICATE_SIGNATURE_PATH to that path and ADMIN_EMAIL to the company admin. Then:

```powershell
npm run certificate:signature
```

Clear CERTIFICATE_SIGNATURE_PATH after provisioning so issuance uses the database
asset. Do not use the test signature fixture for real certificates. A missing
signature blocks issuance cleanly; the rest of management and verification still works.

Start these in separate terminals:

```powershell
npm run dev:api
npm run dev
```

Use `http://localhost:5173`, matching APP_URL exactly. Vite proxies API traffic to
127.0.0.1:8888. If you change the frontend origin/port, update APP_URL too. Keep this
local API listener bound to loopback; production uses Netlify Functions.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| DATABASE_URL | Yes | Private PostgreSQL connection, runtime role in production |
| APP_URL | Yes in production | Exact browser origin, production `https://nextoracreations.co.in` |
| RATE_LIMIT_SECRET | Yes in production | At least 32 characters of independently generated random secret |
| CERTIFICATE_BASE_URL | Default provided | Must be `https://nextoracreations.co.in` |
| CERTIFICATE_SIGNATURE_PATH | Provisioning/local only | Private PNG read by provisioning CLI or local override |
| CERTIFICATE_SIGNATURE_BASE64 | Optional | Small operator-managed override; prefer DB storage in production |
| ADMIN_EMAIL | Provisioning only | Company account to create or attribute signature provisioning to |
| ADMIN_PASSWORD | Bootstrap only | New admin password; remove immediately afterwards |
| API_PORT | Local only | API listener, default 8888; update Vite proxy if changed |
| NODE_ENV | Production | Set `production`; Netlify's NETLIFY=true also enables secure mode |

Never use a VITE_ prefix for these values; Vite-prefixed secrets become browser data.
No CERTIFICATE_STORAGE_PATH is needed because PDFs live transactionally in PostgreSQL.
No CERTIFICATE_SIGNING_SECRET is required for random DB-backed certificate identifiers.
No new email subscription is introduced: the existing Apps Script only captures
contact leads. Administrators deliver invitation links through a verified private
channel. Automated certificate email remains optional and is not implemented.

## Production deployment commands and procedure

1. Provision a durable PostgreSQL database with TLS, backups, restricted network
   access and a migration-owner credential. Keep staging/preview and production data
   separate. Configure its region close to the Netlify function region.
2. Back up the existing database before applying migrations. With PostgreSQL tools
   installed and DATABASE_URL set privately to the migration-owner connection:

   ```powershell
   pg_dump --dbname="$env:DATABASE_URL" --format=custom --file=nextora-before-internships.dump
   pg_restore --list nextora-before-internships.dump
   npm ci
   npm run db:migrate
   npm run admin:create
   npm run certificate:signature
   ```

   Store the backup encrypted outside the repository. Rehearse restoration into a
   separate database with `pg_restore --dbname=<restore-target> --no-owner <backup>`.
   Do not restore over the live database or reset data merely to install this feature.
3. Create a separate database LOGIN role through the provider's secure admin console.
   Apply the supplied least-privilege grants with psql, as the migration owner:

   ```powershell
   psql --dbname="$env:DATABASE_URL" -v app_role=nextora_app -f server/runtime-grants.sql
   ```

   Do not grant schema ownership or superuser. Set production DATABASE_URL to this
   runtime role using the provider's TLS-verified connection format. Keep the owner
   credential solely for migrations and operator provisioning.
4. Set function-runtime environment variables in the existing Netlify site:
   DATABASE_URL, APP_URL, RATE_LIMIT_SECRET, CERTIFICATE_BASE_URL, NODE_ENV. Set the
   build runtime to Node 22 or newer. Leave signature path/base64 overrides unset
   after provisioning the private DB asset. Do not set ADMIN_PASSWORD in Netlify.
   Deploy previews must use their own APP_URL and separate test database.
5. Validate locally, then deploy the existing site's prepared build through its
   normal deployment workflow:

   ```powershell
   npm test
   npm run test:ui
   npm run build
   npm run build:functions
   npx netlify deploy --build --prod
   ```

   The final command publishes to the linked production site; review the site target
   and configuration before executing it. This task did not execute that command.
   Migrations are deliberately separate from the Netlify build. Netlify bundles the
   company logo and licensed fonts from included_files; the signature stays in DB.
6. Run `npm run db:maintenance` periodically through your existing secure operations
   scheduler to clear expired sessions, invitations and rate counters. This preserves
   all internship, certificate, PDF and audit records. No scheduler was created here.
7. Monitor function errors, database capacity and audit activity. Backups must include
   private PDF bytes, company signature and issuance snapshots. For rollback, deploy
   the previous frontend/function version and retain the additive schema/history.

## Workflows

**Administrator:** Visit `/admin/internships`, sign in, create and activate a program,
then create a student internship with approved dates. Share the one-time private
invitation with the verified student. Activate the internship; after successful work
and duration completion, mark it COMPLETED. Review student details and explicitly
approve certificate eligibility. Generate/download/view the certificate. Review audit
history, regenerate the original PDF, or permanently revoke it with a reason when needed.

**Student:** Activate the company invitation with the registered email and a new
password. Sign in at `/internship/certificate`, open the owned record and confirm name
and academic details. Dates, program, role, approval and status are company-controlled.
After approval, get the certificate and view/download its PDF. A copied internship ID
never grants access to another person's private record. Password recovery uses a new
company-issued private invitation after identity verification.

**Employer:** Scan the QR or enter a certificate number at `/verify-certificate`.
The API returns VERIFIED, REVOKED or NOT_FOUND. Compare name, role, program and dates
with the supplied PDF. No account is needed; student contact/academic/internal data
and the PDF itself are not public.

**Issuance transaction:** Lock owned/company record and profile → return existing
valid certificate if already issued → reject revoked/ineligible record → snapshot
approved details and authorized signature → random ID and official HTTPS URL → embed
logo, vector text, signature and QR into A4 landscape PDF → insert certificate, PDF,
hash, status and audit event → commit together. Failure rolls back all issuance data.

## Verification performed

`npm test` covers calendar/leap/month-end boundaries; impossible dates; explicit
approval; short/future internships; one-time email-bound invitations; secure cookies;
unauthorized admin access; CSRF and Origin rejection; cross-student record/PDF/issue
denial; input authority-field rejection; profile locks; missing signature rollback;
five simultaneous issuance requests; database uniqueness/FKs; public redaction;
unknown IDs; Netlify function URL routing; PDF magic bytes, A4 geometry, vector text,
logo/signature/QR assets; decoding the QR from the rendered actual PDF; immutable
history/snapshots; regeneration; private DB signature provisioning path; revocation;
program duration changes; shared rate limits; password-change and logout invalidation.

`npm run test:ui` drives Chrome through the live local API: homepage preservation,
direct route refresh, published programs, all three verification outcomes, service
failure, admin sign-in, program creation, enrollment, lifecycle/approval/issuance,
student ownership and PDF download, admin denial for students, and 375/768px layouts.
Screenshots under ignored tmp/ were visually reviewed together with the rendered PDF.
PDF fixtures clearly say TEST FIXTURE ONLY / NOT AN AUTHORIZED SIGNATURE.

Results: 23 passing backend/domain checks and five passing Chrome workflows.
The API suite runs with the supplied restricted PostgreSQL role, including tests
denying signature writes, role promotion, history deletion and schema creation.

Production Vite build, function packaging and `npx netlify build --offline` all passed
using the repository's production Netlify configuration. The function package
was inspected for the company logo and both embedded font files. Production HTTPS,
the actual managed DB, runtime secret configuration and the real signature require
the deployment checklist below; local results do not claim those external checks.

Dependency audit: `npm audit --omit=dev` reports one existing high-severity package,
`xlsx@0.18.5`, introduced before this task and unused by the new module. npm reports
no registry fix for that version line. Full audit also reports inherited toolchain
advisories. These are not silently removed/upgraded across the user's unfinished
recruitment work. Do not enable spreadsheet imports using that old package without
replacing it or using an upstream-supported release. New runtime dependencies are
pg, zod, pdf-lib and @pdf-lib/fontkit; the existing qrcode dependency is reused.

The bundled Noto Sans font supports Latin names and its included character set.
Unsupported glyphs or excessively long unprintable certificate strings fail before
issuance, rather than silently producing a damaged PDF. Add and test an appropriately
licensed font if additional writing systems are needed.

## Production verification checklist

- [ ] Verify encrypted backup and restore rehearsal before migrations.
- [ ] Apply both migrations with owner credential; runtime grants with separate role.
- [ ] Provision real admin, remove bootstrap password, install authorized signature.
- [ ] Verify HTTPS apex redirect and correct APP_URL; confirm previews use isolated DBs.
- [ ] Confirm `/api/programs` returns JSON rather than index.html; no DB errors leak.
- [ ] Confirm anonymous admin APIs return 401 and student attempts return 403/404.
- [ ] Check Secure/HttpOnly/SameSite cookies and cross-origin/CSRF rejection.
- [ ] On staging, test incomplete/unapproved internships, simultaneous issue clicks,
      profile corrections, signature failure and PDF regeneration.
- [ ] Decode/scan an authorized issued certificate QR on mobile and verify official
      HTTPS domain, exact ID, approved name, role, dates and current status.
- [ ] Confirm public responses exclude email, phone, college, registration, signature,
      internal project/notes and revocation reason.
- [ ] Confirm valid PDFs persist after redeploy; revoked PDFs stop downloading and QR
      verification changes to REVOKED. Retain all history and original copies.
- [ ] Check 375px mobile and tablet forms, menu, tables, keyboard focus and zoom.
- [ ] Verify function includes fonts/logo, DB storage capacity, backup coverage,
      expiration cleanup and error monitoring.

## Files created and modified

Created:

- `.env.example`, `compose.yaml`, `playwright.config.js`
- `server/db.js`, `server/domain.js`, `server/auth.js`, `server/service.js`,
  `server/pdf.js`, `server/api.js`, `server/local.js`, `server/runtime-grants.sql`
- `server/migrations/001_internships.sql`, `server/migrations/002_company_assets.sql`
- `server/assets/NotoSans-Regular.ttf`, `NotoSans-Bold.ttf`, `OFL.txt`
- `netlify/functions/internships.mjs`
- `src/internships/portal.js`, `src/internships/portal.css`
- `scripts/migrate.js`, `scripts/create-admin.js`, `scripts/configure-signature.js`,
  `scripts/maintenance.js`, `scripts/test.js`
- `tests/domain.test.js`, `tests/integration.test.js`, `tests/fixtures.js`,
  `tests/seed-ui.js`, `tests/browser/portal.spec.js`
- `docs/internship-architecture.md`, `docs/internship-operations.md`

Modified: `.gitignore`, `index.html`, `src/main.js`, `vite.config.js`, `netlify.toml`,
`package.json`, `package-lock.json`. Existing uncommitted recruitment files and
dependency additions were preserved. No production data, deployment, commits or
remote repository state were changed.

Implementation references: [Netlify Functions API](https://docs.netlify.com/build/functions/api/),
[Netlify function configuration](https://docs.netlify.com/build/functions/configuration/),
[node-postgres parameterized queries](https://node-postgres.com/features/queries).
