# Internship system: pre-implementation audit and plan

## Existing architecture (28 September 2026)

The deployed entry point is `index.html` with `src/main.js`: static HTML, ES modules,
Vite 8, Tailwind 3, GSAP and Lenis. There is no framework router, server, database,
session middleware, admin dashboard, email sender or private file storage. Netlify
publishes `dist`, redirects to the HTTPS apex `https://nextoracreations.co.in`, and
falls back to index.html. The contact form writes leads to Google Apps Script; that
script has no authenticated transactional email capability.

The actual brand is white / #111111 / #00AEEF, Hanken Grotesk, Inter and JetBrains
Mono, as implemented in Tailwind and HTML. DESIGN.md contains older contradictory
colors and is not the source of truth. Existing public/logo.webp and root logo.png
are company assets. The founder is Gorke Sai Kumar. No authorized signature asset
was found. Certificate issuance must fail closed until one is configured.

Uncommitted src/data, src/services, docs/recruitment-integration-audit.md and package
changes predate this task. They contain unconnected localStorage demo recruitment
data, sequential certificate numbers and browser PDF proposals. Preserve them;
never import them into the authoritative system or migrate their demo certificates.

## Reuse

Reuse the exact website shell, contact details, logo, form typography, responsive
spacing, existing QR dependency, Vite build and Netlify deployment. Keep the landing
page and lead form working. No new paid email service is needed.

## Additions and database changes

Add a private PostgreSQL schema with users, student profiles, programs, internships,
hashed invitation tokens, hashed sessions, rate-limit counters, immutable certificate
snapshots, stored PDF bytes/revisions, and append-only audit logs. Use UUIDs, foreign
keys, checks, indexes, one certificate per internship and unique random public IDs.
Versioned additive migrations run explicitly, never on build and never reset data.
Programs default to three calendar months (not an approximation of 90 days).
Copy requirements onto enrollment so program edits do not change agreed eligibility.

## Backend changes

Add one same-origin Netlify Function with a Web Request/Response API, and a local
Node adapter. PostgreSQL transactions and row locks protect approval, issuance,
revocation and regeneration. Server-created accounts use scrypt passwords and opaque
HttpOnly sessions. Admin bootstrap is a private CLI operation. Students activate via
single-use expiring invitations given privately by the company. Public registration
cannot create an internship. PDFs are generated with vector text and QR on the server
and stored transactionally in PostgreSQL; no ephemeral serverless filesystem storage.

## Frontend changes

Register a small route module that renders only on /internships, /internship/certificate (including
record detail), /verify-certificate (including direct IDs), and /admin/internships.
Reuse the current navbar/footer; add public footer and mobile navigation links.
Provide accessible forms, explicit error/empty/loading states, responsive record
lists, student confirmation, and an authenticated admin workspace.

## Security considerations

Validate all inputs with strict schemas; use parameterized SQL and role/ownership
checks on every private endpoint. No localStorage credentials or authority. Use
same-origin enforcement plus a session-bound CSRF token for mutations, secure cookies,
database-backed rate limits, generic authentication errors, bounded bodies and no-store
responses. Only server-approved completed records meeting both actual end date and
calendar duration may issue. An official HTTPS origin is configured independently of
request Host headers. Signature input is operator-controlled PNG, size/dimension
validated and never public. Public verification uses an explicit minimal projection.
Historical snapshots and audit events cannot be edited/deleted by the runtime DB role.

## Implementation sequence

1. Add schema, migration runner, DB adapter and validation/domain rules.
2. Add authentication, invitation lifecycle and secure same-origin API.
3. Add admin program/internship workflow and student profile confirmation.
4. Add transactional issuance, server PDF/QR, stored revisions and revocation.
5. Integrate frontend routes into the existing shell.
6. Test permissions, eligibility/date boundaries, database integrity, PDFs, public
   redaction, duplicate issuance and mobile layouts; run production/function builds.
7. Document environment, backup/migration/restore, account bootstrap and live checks.

Production provisioning requires a PostgreSQL database, an authorized signature and
operator secrets. No production database or deployment will be assumed to exist.

References: [Netlify Functions API](https://docs.netlify.com/build/functions/api/),
[parameterized PostgreSQL queries](https://node-postgres.com/features/queries),
[PGlite test database](https://pglite.dev/docs/api).
