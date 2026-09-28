# Administration extension audit and implementation matrix

The existing Vite/JavaScript/Tailwind frontend calls a single Netlify Function via
`/api/*`; it uses pg with the nc schema in Neon PostgreSQL. Existing secure cookies,
scrypt passwords, CSRF, PostgreSQL rate limiting, certificate snapshots, PDF revisions,
QR verification and migration checksums are working foundations, not replacements.

**Production migrations 001_internships.sql and 002_company_assets.sql are frozen.**
All schema changes for this extension go into 003 or later. Never update stored
checksums to bypass migration validation. Production data must be backed up before
the operator applies the new migrations.

| Feature | Exists | Partial | Missing | Action |
|---|---|---|---|---|
| Netlify/Neon API and deployment | Yes | | | Reuse existing function and pg connection |
| Admin password hashing/session/CSRF/rate limit | Yes | | | Reuse; add forced bootstrap password rotation and auth audit |
| CLI administrator bootstrap | Yes | | | Retain ADMIN_EMAIL/ADMIN_PASSWORD, add display name admin and first-login rotation |
| /admin/login, dashboard, sidebar | | | Yes | Add branded routed workspace and preserve old /admin/internships URLs |
| Internship CRUD, dates, completion/approval | Yes | | | Reuse; add approval/offer stages without invalidating legacy records |
| Programs | | Yes | | Add slugs, publication, job details and application controls |
| Public program details and applications | | | Yes | Add slug pages, validated applications and company review/enrollment |
| Offer letters, PDF and verification | | | Yes | Add immutable offer/PDF records and official-domain verification |
| Certificates/PDF/QR/revocation | Yes | | | Reuse transactions, ownership, randomness and historical preservation |
| Template management and preview | | | Yes | Version controlled fields, validate placeholders, server PDF preview, activation |
| Signature storage | Yes | | | Extend private company assets with authenticated validated management |
| Company identity and logo management | | | Yes | Controlled configuration; snapshot assets and identity on issuance |
| Document center | | Yes | | Show both offer and certificate, download/view/verify actions |
| Audit logs | | Yes | | Add global searchable history and events for new actions |
| Search/filter/dashboard activity | | Yes | | Extend filters/counts and add recent/upcoming activity |
| Tests | Yes | | | Preserve old security coverage and add new full-lifecycle/template/asset tests |

Implementation order: additive migrations and authentication gate; program/application
extensions; versioned templates and controlled assets; offers and document snapshots;
branded routed administration/public UI; full API/browser/PDF validation and handover.

Bootstrap password is only a transient CLI input. It is never a Vite variable, source
constant or permanent Netlify environment value. After the code and migrations are
ready, use `npm run admin:create` against Neon, sign in at `/admin/login`, replace the
temporary password, verify normal access, and remove ADMIN_PASSWORD from the operator
environment. Production bootstrap/deployment is distinct from disposable test fixtures.
