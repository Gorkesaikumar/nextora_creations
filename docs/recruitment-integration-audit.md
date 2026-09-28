# RECRUITMENT + INTERNSHIP INTEGRATION AUDIT & ARCHITECTURE

## 1. Existing Architecture
- **Framework**: Vite 8.1.5 (Static HTML + ES Modules + Tailwind CSS)
- **Next.js Version**: N/A (Project is Vite-based SPA with static HTML entry `index.html`)
- **Router**: Single Page Application (SPA) routing using HTML5 History API (`window.location.pathname`) with Netlify wild-card redirect (`/*` -> `/index.html` with status 200)
- **Language**: JavaScript (ES Module, ES2020+)
- **Styling**: Tailwind CSS v3.4.19 with PostCSS & Autoprefixer. Google Fonts (`Hanken Grotesk`, `JetBrains Mono`, `Inter`, `Material Symbols Outlined`). Color system defined in `tailwind.config.js`: `cyan-accent` (#00AEEF), `primary` (#111111), `on-primary` (#ffffff), `surface` (#FFFFFF), `surface-dim` (#FAFAFA), `on-surface-variant` (#6B7280), `outline` (#ECECEC).
- **Deployment**: Netlify static site hosting (`publish = "dist"`, `command = "npm run build"`, security headers & cache controls in `netlify.toml`).
- **Authentication**: None in base landing site. Introducing secure Admin authentication with salt+hash password tokens, session storage, and route authorization guards.
- **Database**: No external backend DB currently integrated. Creating a clean Data Abstraction Layer (`RepositoryPattern` & `ServicesLayer`) backed by persistent local storage / JSON seed datasets + full export/import capabilities.
- **Storage**: Browser LocalStorage / IndexedDB with automated initial seed data for demo/production readiness.
- **Email**: Reusing Google Apps Script webhook integration pattern present in `src/main.js` & `google_sheets_script.js` for dispatching transactional notifications (Application Confirmation, Interview Call, Offer Letter, Certificate Issued).
- **PDF**: Client-side high-resolution PDF renderer (`jspdf` / Canvas PDF generator) for Offer Letters and A4 Landscape Certificates of Completion.
- **Forms & Validation**: Modular multi-step form state management with strict client-side & server-side transition state machine rules.

## 2. Existing Components That Can Be Reused
- **Navigation Bar (`nav`)**: Sticky top glassmorphism navbar, logo, section links, action CTA buttons, and responsive mobile menu modal overlay (`#mobileMenuToggle`, `#mobileMenu`).
- **Design System & Aesthetics**: Grid containers, typography classes (`font-headline`, `font-mono`, `font-body`), button classes (`magnetic-btn`), card layouts, color variables, borders (`border-outline`), backdrop blur filters, and GSAP ScrollTrigger fade animations.
- **Footer**: Full width dark footer with branding, contact details, quick links, and copyright statement.
- **Modal System**: `#projectModal` overlay pattern for form dialogs, accessible escape key listeners, focus trap, and background scroll locking.
- **Form Handling Pattern**: Fetch-based form submission with loading spinners, disable state, error handling, and success notifications.

## 3. Existing APIs & Integrations
- `https://script.google.com/macros/s/AKfycbwj8ewoi-zyYufafUrlxkU8wVqbrZDXkSQn_DSIssFbDsmXub-CB6lNxGxHbTXpAlJ-TQ/exec` (Google Apps Script endpoint for lead capture).

## 4. Existing Routes
- `/` (Home landing page with Hero, Who We Are, Projects, Capabilities, Technology, Why Nextora, Process, About Founder, Contact form).

## 5. Identified Risks & Mitigations
- **SPA Deep Linking on Refresh**: Netlify requires `/* -> /index.html` 200 rewrite rule (already configured in `netlify.toml`). The client router will parse `window.location.pathname` seamlessly.
- **Data Persistence**: Without a heavy external backend database, data will be lost if cleared unless backed up. *Mitigation*: Build a robust repository abstraction layer (`ApplicationService`, `OpportunityService`, `InterviewService`, `OfferService`, `InternService`, `CertificateService`, `AuditService`) with seed persistence, JSON database sync, and Excel export/import functionality.
- **Security & Authorization**: Admin routes must not be open to unauthorized users. *Mitigation*: Server/client session token verification, hashed credentials check, secure random verification tokens for public links, and data sanitization.
- **PDF & QR Code Generation**: Ensure client-side PDF generation is sharp, pixel-perfect, printable, and downloadable without external server dependency.

## 6. Proposed Architecture & Integration Plan
- **Router Engine**: A lightweight History API client router (`src/router.js`) that handles view rendering for:
  - `/` (Home Landing Page)
  - `/careers` (Public Careers & Opportunities Directory)
  - `/careers/:id` (Opportunity Details View)
  - `/careers/:id/apply` (Multi-Step Application Form)
  - `/application/track` (Public Candidate Application Tracker)
  - `/offer/:token` (Secure Candidate Offer Acceptance Portal)
  - `/certificate/verify` & `/certificate/verify/:token` (Public Certificate Verification Portal)
  - `/admin/recruitment` (Admin Portal with Dashboard, Opportunities, Applications, Interviews, Offers, Interns, Evaluations, Certificates, Reports, Settings, Audit Logs)
- **Centralized Workflow Engine**: Enforces strict candidate lifecycle state transitions: `APPLIED` -> `UNDER_REVIEW` -> `SHORTLISTED` -> `INTERVIEW_SCHEDULED` -> `INTERVIEW_COMPLETED` -> `SELECTED` -> `OFFER_ISSUED` -> `OFFER_ACCEPTED` -> `INTERNSHIP_ACTIVE` -> `INTERNSHIP_COMPLETED` -> `CERTIFICATE_ISSUED`.
- **Document Versioning & Eligibility Engine**: Immutable versions for Offers and Certificates, strict pre-issuance validation via `CertificateEligibilityService`.
