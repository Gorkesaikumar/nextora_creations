# Nextora internship administration — implementation and operations

## Architecture and reused components

The existing Vite/JavaScript/Tailwind website remains on Netlify. `/api/*` still
rewrites to the single `netlify/functions/internships.mjs` function, using `pg`
against Neon PostgreSQL. No permanent application server or replacement framework
was introduced. The local server is a development/test adapter only.

Reused: scrypt password hashing, opaque HttpOnly sessions, CSRF, database rate
limits, invitations, student ownership checks, calendar-month eligibility,
certificate IDs and immutable snapshots, PDF revisions, QR generation, revocation,
audit storage and checksum-validated migrations. See `admin-extension-matrix.md`
for the pre-implementation audit.

## Migration safety

**Never edit `001_internships.sql` or `002_company_assets.sql`. Never overwrite
their stored checksums.** Both files are unchanged by this implementation.
The runner intentionally refuses altered applied migrations. Once the new
migrations are deployed, treat those files as immutable too.

New migrations:

| Migration | Database changes |
|---|---|
| `003_admin_portal.sql` | Bootstrap rotation flag/display name, program slugs/details/publication, new internship states and workflow version, enrollment approvals, applications and indexes |
| `004_offer_letters.sql` | Unique immutable offers, private PDFs, hashes, verification URLs and permanent revocation |
| `005_document_templates.sql` | Template drafts/published revisions, append-only revision history, company settings and private logo asset |

Existing programs receive a deterministic `program-{UUID}` slug and retain their
publication status. Legacy `ACTIVE` programs remain public. An administrator may
edit the slug. Existing internships are version 1 and keep their established
lifecycle. All new API-created internships are version 2 and require approval
and an offer before activation. Version 1 cannot be requested through the API.

## Files

Created: `server/admin-extension.js`, `server/documents.js`, `server/templates.js`,
the three migrations above, `server/assets/NotoSerif-Regular.ttf` and
`NotoSerif-Bold.ttf`, `src/internships/admin-portal.js`,
`tests/admin-extension.js`, `tests/browser/admin-extension.spec.js`,
`docs/admin-extension-matrix.md` and this handover.

Modified: `server/api.js`, `auth.js`, `domain.js`, `pdf.js`, `service.js`,
`runtime-grants.sql`, `scripts/create-admin.js`, `scripts/test.js`, `src/internships/portal.js`,
`portal.css`, `netlify.toml`, `tests/integration.test.js`, `tests/seed-ui.js`,
`tests/browser/portal.spec.js`. The existing font OFL license applies to the
bundled Noto font families. No company signature is committed.

## Routes

Administration:

- `/admin`, `/admin/login`, `/admin/dashboard`
- `/admin/internships/programs`
- `/admin/interns`, `/admin/interns/:id`, `/admin/interns?new=1`
- `/admin/applications`, `/admin/offers`, `/admin/certificates`
- `/admin/templates`, `/admin/company-assets`, `/admin/audit-logs`
- `/admin/verification`, `/admin/settings`
- Existing `/admin/internships` and its query-based views remain available.

Public/student:

- `/internships`, `/internships/:slug`
- `/verify-offer`, `/verify-offer/:offerId`
- Existing `/verify-certificate`, `/verify-certificate/:certificateId`
- Existing `/internship/certificate`, `/internship/certificate/:id`

New or extended APIs (all paths begin `/api`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/programs`, `/programs/:slug` | Published program list/details; closed detail pages remain readable |
| POST | `/programs/:slug/applications` | Rate-limited application; duplicate responses do not disclose enrollment |
| GET | `/verify-offer/:number` | Allowlisted public verification |
| GET | `/admin/dashboard` | Counts, recent interns/documents, upcoming completions |
| GET/POST | `/admin/programs` | List/create programs |
| PATCH | `/admin/programs/:id` | Edit/publish/unpublish/archive |
| GET/POST | `/admin/interns` | Filter/paginate or create version-2 internship |
| GET | `/admin/applications` | Paginated private applications |
| PATCH | `/admin/applications/:id` | Review/reject/accept; acceptance atomically creates the internship |
| POST | `/admin/internships/:id/offer` | Idempotent offer issuance |
| GET | `/{admin\|me}/internships/:id/offer-pdf` | Authorized PDF; `?view=1` requests inline viewing |
| POST | `/admin/internships/:id/offer-revoke` | Permanent offer revocation with reason |
| GET | `/admin/offers`, `/admin/certificates` | Paginated document metadata |
| GET/POST | `/admin/templates` | List/create controlled templates |
| PATCH | `/admin/templates/:id` | Save draft with expected revision |
| POST | `/admin/templates/:id/{activate\|deactivate\|duplicate\|reset}` | Template operation with expected revision |
| POST | `/admin/templates/preview` | Sample PDF, watermark, no signature or verification record |
| GET/PUT | `/admin/company-assets` | Asset metadata and company identity configuration |
| POST | `/admin/company-assets/upload` | Validated private PNG upload |
| GET | `/admin/audit-logs` | Paginated event search with safe metadata |

Existing login/me/logout/password/activation, internship detail/edit/status/history,
invitation, certificate issue/download/regenerate/revoke APIs remain in place.

## Authentication and bootstrap

`npm run admin:create` still reads `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The CLI
stores a salted scrypt hash, sets display name `admin`, and marks the account for
mandatory password change. Login uses the configured email. Existing accounts
are not silently overwritten by the CLI.

Login creates an opaque eight-hour session. Only a hash of the session token is
stored in PostgreSQL. Cookies are HttpOnly, SameSite=Strict and Secure in production.
Mutations require the configured application Origin and a session CSRF token.
Role checks occur server-side. A bootstrap session may inspect its account, log
out or change its password; management APIs reject it until rotation. Rotation
rejects the same password and invalidates every session. Nothing uses localStorage
for authentication.

Use the administrator bootstrap **from a trusted local terminal against Neon**.
There is no need to put `ADMIN_PASSWORD` into Netlify at all. This PowerShell
example prompts without putting the literal password in shell history:

```powershell
# DATABASE_URL must already point to the intended Neon database, using a
# privileged operator connection for migrations/bootstrap, not a VITE_* variable.
$env:ADMIN_EMAIL = Read-Host 'Administrator email'
$temporaryAdminSecret = Read-Host 'Temporary password (at least 12 characters)' -AsSecureString
$temporaryAdminPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($temporaryAdminSecret)
try {
  $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($temporaryAdminPointer)
  npm run admin:create
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($temporaryAdminPointer)
  Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Variable temporaryAdminSecret,temporaryAdminPointer -ErrorAction SilentlyContinue
}
```

Then open `https://nextoracreations.co.in/admin/login`, sign in with the temporary
password, set a different password, and sign in again to verify dashboard access.
Remove any bootstrap value previously stored in `.env`, user/system environment
or Netlify. Keep the new password in your password manager. Do not paste either
password into source, this document, screenshots, or a frontend `VITE_*` variable.

## Business workflows

Create a program, set its slug and fields, select Published and enable
applications as appropriate. Draft unpublishes it; Closed stops applications;
Archived removes it from public access. The application deadline is enforced
server-side. Positions are displayed capacity information; acceptance is a
management decision, not an automatic quota allocation.

Applications are private until reviewed. Acceptance requires authoritative
program, role and dates and creates the student/internship transactionally.
The administrator receives a private, single-use student invitation to deliver
through the company's verified contact process. No email is sent automatically.

New internship lifecycle:

```text
REGISTERED → APPROVED → OFFER_LETTER_ISSUED → ACTIVE
→ COMPLETED → CERTIFICATE_ELIGIBLE → CERTIFICATE_ISSUED
```

Rejection/termination are limited to allowed transitions.
Certificate revocation sets CERTIFICATE_REVOKED. Approved dates and minimum
calendar-month duration must have elapsed before completion/eligibility. An
ACTIVE internship cannot jump directly to certificate issuance. Issuance requires
explicit company approval and is idempotent under concurrent requests.

Offer issuance requires enrollment approval and a configured signature. It locks
the internship, generates a random 96-bit suffix (`NC-OFFER-{year}-{random}`),
snapshots company/student/template information, and stores an A4 portrait PDF plus
hash in the same transaction. An issued offer locks authoritative internship edits.
Its QR contains only the official verification URL. Revocation disables further
downloads and makes public verification show REVOKED; a revoked offer cannot be
used to activate a new internship.

Certificates remain A4 landscape with unpredictable `NC-INT` IDs, immutable
snapshots and private stored PDFs. Repeated issuance returns the same ID. PDF
regeneration retains the snapshot and creates a new revision. Templates and assets
changed later do not alter previously issued records. The document center provides
status, ID, issue date, view/download and public verification links for both types.

## Templates and assets

The template editor accepts controlled fields: title, subtitle, body, terms,
footer, Noto Sans/Noto Serif, bounded font sizes and line spacing, logo/signature/QR
positions, border and document-specific A4 orientation. Unknown placeholders,
malformed braces and markup are rejected server-side. There is no HTML/JavaScript
execution. The placeholder list is shown in the editor.

Use Live preview to render current form values, then Save draft and Activate.
Activation validates the render, serializes competing publication requests, and
appends a revision. Revision checks reject stale saves. Deactivation falls back
to the built-in default when no other template is active. Reset changes the draft;
activate it separately. A preview contains sample data, a watermark and signature/
QR placeholders; it is never an issued document.

Company Assets manages identity, logo and signature. Upload PNG files only, up to
500 KB. Logos support up to 3000 × 3000 pixels; signatures must satisfy the existing
20 × 10 through 2000 × 1000 bounds. PNGs are decoded before storage. The API returns
only asset name, size, hash and timestamp. It never returns signature bytes/base64.
Production issuance should use these private database assets; environment signature
overrides are intended for local testing only. Authorized issued PDFs necessarily
contain the signature image, so downloaded documents are not a secret store.

## Security and auditing

Queries are parameterized and request schemas are strict. New record endpoints
retain ownership checks. Public verification returns only document number, name,
program, role, dates, status and issuer. No private email, phone, address, internal
IDs, signature or snapshot object is returned. Mutation body limits are 16 KB,
except the bounded PNG upload. Login, password, public application and verification
routes have persistent database rate limits. Public verification IDs are random,
not sequential.

Audits include admin login/logout, program publication, intern creation/approval,
activation/completion, offers, certificate approval/issuance/revocation, templates,
company identity and signature updates. Tokens, passwords, database connections
and image bytes are not logged. Database triggers protect historical documents,
audit rows and published template revisions even from accidental owner writes.

`runtime-grants.sql` must be reapplied after migration. The runtime now needs
INSERT/UPDATE on private assets for the requested administrator upload feature;
student access is prevented by the API. It still cannot update user roles, own
the schema, delete issued documents, or change historical records.

## Local setup and validation

```powershell
npm ci
# Configure a local .env from .env.example; use only disposable/local credentials.
docker compose up -d db
npm run db:migrate
# Run the one-time bootstrap above against the local database if needed.
npm run dev:api
# In another terminal:
npm run dev
```

Automated tests create and destroy their own PostgreSQL 17 Docker container and do
not use the production Neon database:

```powershell
npm test
npm run test:ui
npm run build
npx netlify build --offline
```

Coverage includes login/failure/expiry/rotation, permissions/CSRF/IDOR, program
publication/application acceptance, new and legacy lifecycles, required duration,
concurrent issuance, real PDF text/dimensions/images, QR decoding, public privacy,
revocation, template injection/version conflicts/immutable snapshots, signature
protection and database runtime grants. Browser checks cover both the existing
portal and new administration, applications, previews, downloads, verification,
password rotation and mobile/tablet overflow. PDFs use a clearly marked test-only
signature. Visual artifacts are kept in ignored `tmp/`.

Validated locally on 28 September 2026: **30 backend/domain tests passed**, **8
Chrome browser tests passed**, and the Vite build plus offline Netlify function
packaging passed. The browser suite demonstrates public program publication,
application acceptance, offer issuance, completion/approval, certificate download,
and both authoritative verification routes. Actual rendered PDF QR codes were
decoded in tests. Portrait offers and landscape certificates were visually
inspected; Edge, physical Android and other native PDF viewers remain on the
production acceptance checklist below.

## Production migration and Netlify release

1. Create a Neon restore point/branch or verified backup. Use a deployment window
   and prevent management writes while updating schema and runtime grants.
2. From this checkout, set `DATABASE_URL` to the privileged Neon migration/operator
   connection. Do not print it. Run `npm run db:migrate`; only 003–005 should apply.
3. Reapply grants as the owner using your real runtime role:
   `psql "$env:DATABASE_URL" -v app_role=nextora_app -f server/runtime-grants.sql`.
   Replace `nextora_app` with the configured role. Keep the runtime connection
   separate from the owner connection.
4. Build/deploy the same commit to the existing Netlify site. Build command remains
   `npm run build`, publish directory `dist`, Node 22+, existing Netlify function.
   Fonts and logo are bundled by `included_files`; no signature belongs in `dist`.
5. Keep Netlify server variables `DATABASE_URL` (runtime Neon role),
   `APP_URL=https://nextoracreations.co.in`, `CERTIFICATE_BASE_URL` with that same
   official origin, and a strong `RATE_LIMIT_SECRET`. None are Vite variables.
   Do not add `ADMIN_PASSWORD` or a signature file to the frontend.
6. Run the CLI bootstrap locally against Neon, verify `/admin/login`, rotate the
   temporary password, sign in again, and clear bootstrap environment values.
7. Configure the authorized company signature and confirm company identity.

The schema additions preserve existing records. Do not roll back by dropping
tables or editing migration history. Prefer a corrective application release/new
migration. An older application does not understand the new approval stages or
mandatory rotation flag and may not supply the required program slug; keep
administration writes disabled if an emergency application rollback is necessary.

## Production end-to-end checklist

- Confirm HTTPS/apex redirects and direct refresh of all admin/public routes.
- Confirm unauthenticated admin APIs return 401 and student admin access returns 403.
- Bootstrap/rotate the administrator password and verify logout invalidates access.
- Publish a clearly labeled test program; confirm it appears publicly.
- Submit a test application; accept it and deliver the private invitation securely.
- Approve the intern, issue one offer and download/view its portrait PDF.
- Scan its QR and compare the authoritative offer number/name/role/dates.
- For a company-approved test internship whose required period really has elapsed,
  activate, complete, approve the certificate and issue it. Do not falsify a real
  student's dates to test eligibility.
- Download the landscape PDF, scan its QR, and verify the authoritative record.
- Repeat issuance and confirm the ID stays unchanged; test early issuance denial.
- Preview/change/activate a template and confirm old PDFs remain unchanged.
- Verify revoked test documents show REVOKED and further downloads are blocked.
- Check audit events, student ownership and absence of private fields in public JSON.
- Check PDFs in Chrome, Edge, an Android PDF viewer and a Windows PDF viewer.
- Archive the test program and retain audit/history records.

Production deployment, Neon migrations/bootstrap, real login and physical/mobile
viewer checks are separate operational steps; local test success is not evidence
that those production steps have happened.
