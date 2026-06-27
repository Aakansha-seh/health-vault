# HealthVault — The Whole Thing, Explained

A complete tour of your own app, written for someone who can read code but hasn't built a full-stack system before. Read it top to bottom once; after that it's a reference you can jump around in. Nothing here assumes you already know how the pieces fit — every term is explained the first time it shows up.

---

## 1. The 30-second mental model

HealthVault is software a **hospital** runs so its staff can manage **patient records and appointments**. It is made of two programs that run separately and talk to each other over the internet:

- A **frontend** — the part that runs in the doctor's web browser. It draws the screens, buttons, and forms. This is the React/Vite app in the `src/` folder.
- A **backend** — a program that runs on a server (not the doctor's computer). It holds the real data, checks who is allowed to do what, and talks to the database. This is the Node/Express app in the `server/` folder.

They never share memory or files directly. They communicate by sending **HTTP requests** — the same mechanism your browser uses to load any website. The frontend asks ("give me this patient's visits"), the backend answers with **JSON** (a plain-text data format). Everything else is detail on top of that one idea.

```
  Doctor's browser                     Your server                  Database
 ┌────────────────┐   HTTP request   ┌──────────────┐   SQL query  ┌──────────┐
 │  Frontend      │ ───────────────► │  Backend     │ ───────────► │PostgreSQL│
 │  (React/Vite)  │ ◄─────────────── │  (Express)   │ ◄─────────── │          │
 └────────────────┘   JSON answer    └──────────────┘   rows       └──────────┘
```

---

## 2. The single most important idea in this app

Before any technology, understand the **domain model** — the way HealthVault thinks about a hospital. Most of the codebase only makes sense once this clicks.

**A hospital is a "tenant."** The system is *multi-tenant*: many hospitals can use the same software and same database, but each hospital's data is completely walled off from every other's. Every record carries a `hospitalId`, and every database query is filtered by it. Hospital A can never see Hospital B's patients.

**There are three kinds of people**, modelled differently on purpose:

1. **Admin** — the hospital administrator. Creates logins for staff, grants permissions, reads the audit log. Full control over their hospital.
2. **Credential** — a login account for a *doctor* or a *receptionist*. The admin generates these. The word "credential" literally means "a username + password + role."
3. *(Patients are data, not users — they don't log in.)*

**The clever part — and the thing that confuses people — is that a doctor's *login* is separate from a doctor's *clinical identity*.** These are two different records:

- A **Credential** is "who is logged in" (the username `doctor.aryan`).
- A **DoctorProfile** is "the doctor as a clinical entity" — the name patients are filed under, the specialty, the visits and appointments attached to them.

Why split them? Because in a real hospital these don't map one-to-one. A receptionist (one credential) might manage scheduling for five doctors (five profiles). A locum covering for Dr. Sharma needs access to Dr. Sharma's profile without *being* Dr. Sharma. So the system connects credentials to profiles through a separate linking table called **ProfileAccess**, and each link has a permission level: **VIEW** (read-only) or **READ_WRITE** (can edit). This is the "Grant / Revoke / Read-only" UI you saw in the Credentials screen.

If a doctor only has VIEW access and needs to edit, they file a **PermissionRequest**, and an admin approves or denies it. That whole approval workflow is a first-class feature, not a bolt-on.

Hold onto this: **Hospital → (Admins, Credentials, DoctorProfiles, Patients); Credentials reach DoctorProfiles through ProfileAccess; clinical data (Visits, Appointments) hangs off DoctorProfiles and Patients.** Everything else is plumbing around this shape.

---

## 3. The technology stack — what each piece is and why it's here

You can group the tools by which half they belong to.

### Frontend tools (`src/`, runs in the browser)

- **React** — a library for building user interfaces out of reusable "components" (functions that return what the screen should look like). When data changes, React redraws only the parts that changed. Your screens (`PatientsView`, `Dashboard`, etc.) are React components.
- **Vite** — the build tool and dev server. During development it serves your app at `localhost:3000` and instantly reloads when you save a file ("hot reload"). For production it bundles everything into optimized static files. Think of Vite as the thing that turns your source code into something a browser can run.
- **axios** — a small library for making HTTP requests to the backend. All of it is wrapped in `src/services/api.js`.
- **recharts** — draws the bar/line charts on the dashboards.
- **vite-plugin-pwa** — turns the app into a **PWA** (Progressive Web App), meaning it can be "installed" on a phone/desktop like a native app and has some offline capability. That's what the `dev-dist/sw.js` "service worker" file is about — a background script the browser runs to cache the app.

Notably, there is **no CSS framework** (no Tailwind, no Material UI) and **no routing library**. Styling is done with inline styles plus a central token file; navigation is done by swapping which component is shown based on a state variable (more on both below).

### Backend tools (`server/`, runs on the server)

- **Node.js** — lets you run JavaScript outside the browser, on a server. Your backend is a JavaScript program.
- **Express** — the web-server framework. It listens for incoming HTTP requests and routes each one ("`POST /api/auth/login`") to the right piece of code. The whole backend is an Express app.
- **PostgreSQL** — the database. A relational database that stores data in tables (rows and columns) and is very good at relationships and at staying consistent. This is where the *real* data lives.
- **Prisma** — an **ORM** (Object-Relational Mapper). Instead of writing raw SQL, you describe your tables in `schema.prisma` and Prisma gives you a clean JavaScript API like `prisma.patient.findMany(...)`. It also handles **migrations** (versioned changes to the database structure).
- **jsonwebtoken (JWT)** — issues and verifies the login tokens that prove who you are on each request (Section 7).
- **bcryptjs** — hashes passwords so the database never stores them in readable form.
- **zod** — validates incoming data ("is `email` actually an email? is `password` present?") before the code trusts it.
- **helmet, cors, express-rate-limit** — security middleware (Section 8).
- **@anthropic-ai/sdk, openai, @google/generative-ai** — the AI provider libraries for generating patient summaries.
- **razorpay** — the payment gateway for paid subscriptions (Razorpay is an India-focused Stripe equivalent).
- **@azure/storage-blob** — Microsoft Azure cloud storage, where uploaded files (lab reports, scans) are kept.

---

## 4. How the two halves actually talk

Everything the frontend needs from the backend goes through one file: **`src/services/api.js`**. It creates one configured `axios` instance and exports a function per backend endpoint (`getPatients`, `addVisit`, `credentialLogin`, …). Three things it does for you automatically:

1. **Base URL** — every request is prefixed with `/api` (or whatever `VITE_API_URL` is set to). So `getPatients()` actually calls `/api/patients`.
2. **Attaches your login token** — there's an "interceptor" that, before every request leaves, reads your saved token from the browser's `localStorage` and adds it to the `Authorization` header. That's how the backend knows it's you without you re-typing your password each time.
3. **Handles auth failures globally** — if any response comes back `401 Unauthorized` (token expired/invalid), it wipes the token and reloads the app, bouncing you to the login screen. It also turns backend validation errors into readable messages.

On the backend side, `server/src/index.js` is the front door. It mounts each group of routes under a path: `/api/auth`, `/api/patients`, `/api/appointments`, and so on. So a call to `getAppointments()` in the browser becomes `GET /api/appointments`, which Express hands to `server/src/routes/appointments.js`.

That's the entire contract between the two halves: **the frontend calls named functions in `api.js`; those become HTTP calls to `/api/...`; Express routes them to a file in `server/src/routes/`.**

---

## 5. A request's full journey (two worked examples)

Tracing one request end-to-end is the fastest way to understand the system.

### Example A — Logging in

1. You type a username + password on the `LoginScreen` component and submit.
2. The component calls `credentialLogin({ username, password })` from `api.js`.
3. That sends `POST /api/auth/login` with the credentials in the request body.
4. Express routes it to `server/src/routes/auth.js`. The handler:
   - **Validates** the body with Zod (`username` and `password` must be present).
   - Looks up the credential by username in the database via Prisma.
   - Uses `bcrypt.compare()` to check the password against the stored **hash** (it never compares plain text).
   - Checks the account is `isActive` (not revoked).
   - **Signs a JWT** — a token that encodes `{ type: 'credential', credentialId, hospitalId, role }`, stamped with a secret and an expiry (12 hours).
   - Writes an **audit log** row (`CREDENTIAL_LOGIN`).
   - Returns `{ token, actor }` (with the password hash stripped out).
5. Back in the browser, `App.jsx` saves the token to `localStorage`, stores the `actor` in React state, and loads the data that user is allowed to see.

From now on, every request automatically carries that token, and the backend can trust who you are without another password check.

### Example B — Adding a visit to a patient

1. In the patient modal you fill the visit form and submit; `App.jsx`'s `handleAddVisit` calls `addVisit(patientId, data)` → `POST /api/patients/:id/visits`.
2. The token rides along in the `Authorization` header.
3. Express first runs the **auth middleware**: it verifies the token's signature and expiry, re-loads the credential from the DB to confirm it's still active, and attaches `req.actor` (who you are, your hospital, your role).
4. The route handler checks **authorization**: does this credential have `READ_WRITE` on the DoctorProfile this visit belongs to? If not → `403 Forbidden`.
5. It validates the visit data (Zod), then writes it with Prisma — and because every record is tagged with `hospitalId`, the new visit is automatically scoped to your hospital.
6. It writes an audit row (`VISIT_CREATED`) and returns the saved visit as JSON.
7. The frontend takes the returned visit and updates its in-memory list so the new visit appears immediately — no page reload.

Notice the recurring four-step backbone on the backend: **authenticate → authorize → validate → act (and audit).** Almost every protected route follows it.

---

## 6. The database, table by table

Defined in `server/prisma/schema.prisma`. Each `model` is a table. `@id` marks the primary key (a unique `cuid()` string). `@relation` lines describe how tables link. `@@index` lines are performance helpers that make lookups fast as data grows.

- **Hospital** — the tenant. Everything else points back to a hospital. Owns Admins, Credentials, DoctorProfiles, Patients, Appointments, AuditLogs.
- **Admin** — a hospital administrator login (name, email, `passwordHash`). Creates credentials and grants access.
- **Credential** — a staff login (`username`, `passwordHash`, `role` = DOCTOR or RECEPTIONIST, `isActive`). Created *by* an admin (`createdBy`). This is "who logs in."
- **DoctorProfile** — a doctor as a *clinical entity* (name, specialty, qualification, registration). Visits and appointments attach here. Separate from the login.
- **ProfileAccess** — the **junction table** linking a Credential to a DoctorProfile with a `permission` (VIEW or READ_WRITE). The `@@unique([credentialId, doctorProfileId])` line means a credential can have at most one access row per profile. This table *is* the permission system.
- **PermissionRequest** — a doctor's request to upgrade VIEW → READ_WRITE on a profile. Has a `status` (PENDING/APPROVED/DENIED) and who resolved it. Drives the admin's "Permissions" screen.
- **Patient** — a patient record (name, dob, gender, phone, allergies, chronic conditions, blood group, …). Scoped to a hospital; registered by a receptionist credential. Has many Visits and Appointments.
- **Visit** — one clinical encounter, tied to a Patient *and* a DoctorProfile. Holds chief complaint, examination, diagnosis, medications, tests, notes, and `testReports` (a JSON list of uploaded file links). Created first by the receptionist (complaint only), then completed by the doctor.
- **Appointment** — a scheduled slot (date, time, reason, status: scheduled/completed/cancelled) linking a Patient, a DoctorProfile, and a Hospital.
- **Subscription** — one per credential. `tier` = FREE or PREMIUM, plus the Razorpay IDs and billing period. Controls AI access.
- **AIUsage** — one row per AI summary generated. Used to **count** free-tier usage against the monthly limit, and for analytics.
- **AuditLog** — an append-only record of *every* significant action (logins, edits, permission changes, AI calls…). Each row says who did what, to which target, when, and from which IP. Either `adminId` or `credentialId` is set, never both. This is the hospital's tamper-evidence trail.

The relationships encode the domain rules. For instance, `ProfileAccess` has `onDelete: Cascade` on both sides — delete a credential and its access rows vanish automatically, so you never get "orphan" permissions.

---

## 7. Authentication vs. authorization (who you are vs. what you may do)

These two words sound similar and are constantly confused, so keep them separate:

- **Authentication** = *proving who you are.* Handled by JWTs.
- **Authorization** = *deciding what you're allowed to do.* Handled by roles and the ProfileAccess permission model.

### Authentication — the JWT system

When you log in, the backend gives you a **JWT** (JSON Web Token): a signed string that encodes a small payload. Two token "types" exist, because admins and staff are different tables:

- An **admin** token carries `{ type: 'admin', adminId, hospitalId, name }`.
- A **credential** token carries `{ type: 'credential', credentialId, hospitalId, role }`.

The token is signed with `JWT_SECRET`. Because it's signed, the backend can later verify it wasn't tampered with — *without* a database lookup for admins. For credential tokens it does one extra safety step: on every request it re-loads the credential from the DB to confirm it's still `isActive`. So if an admin deactivates a doctor, that doctor is locked out within seconds, even though their token hasn't expired yet. Tokens expire after 12 hours (`JWT_EXPIRES_IN`).

The middleware lives in `server/src/middleware/auth.js` and offers three guards a route can put in front of itself:
- `authenticateAdmin` — admin-only routes.
- `authenticateCredential` — staff-only routes.
- `authenticate` — either is fine (e.g. `/auth/me`, logout).
- `requireRole('DOCTOR')` / `requireRole('RECEPTIONIST')` — narrows to a specific staff role.

Whatever the guard decides, it attaches `req.actor` so the route knows who's calling and which hospital they belong to.

### Authorization — roles + per-profile permissions

Two layers:

1. **Role** (coarse): admins manage the hospital; receptionists do intake and scheduling; doctors handle clinical records.
2. **ProfileAccess** (fine): a doctor can only edit a patient if they hold `READ_WRITE` on a DoctorProfile that patient's visits are filed under. The frontend mirrors this (the "Request edit access" button appears when you only have VIEW), but the backend is the real enforcer — the UI is just a convenience.

The genius of putting `hospitalId` inside the token is that **tenant isolation comes for free**: the backend scopes every query to `req.actor.hospitalId`, so a user physically cannot address another hospital's data, even by guessing IDs.

---

## 8. The security model (what protects the data)

Security is layered; no single thing carries it.

- **Password hashing (bcrypt).** Passwords are never stored. Instead a one-way **hash** (cost factor 12) is stored; login compares the typed password's hash to the stored one. Even if the database leaked, passwords aren't readable.
- **JWT-based sessions.** No password is sent after login; the signed token proves identity. Stateless and fast.
- **Input validation (Zod).** Every endpoint validates the incoming body shape before trusting it, rejecting malformed requests with a clear `400` error. This blocks a whole class of bad/malicious input.
- **helmet.** Sets protective HTTP headers automatically.
- **CORS allow-list.** The backend only accepts browser requests from origins you list in `ALLOWED_ORIGIN`. A random website can't call your API from a user's browser.
- **Rate limiting (express-rate-limit).** Caps how many requests an IP can make in a time window — general API, stricter on auth (to slow password-guessing), and a separate cap on AI. Configured via the `RATE_LIMIT_*` env vars.
- **Tenant isolation.** Every query is filtered by `hospitalId` from the token, so cross-hospital access is impossible by construction.
- **Audit log.** Every meaningful action is recorded immutably — the accountability backstop required in healthcare.
- **Secrets in environment variables.** API keys, the JWT secret, and the database password live in a `.env` file that is git-ignored, never in the code.

What is *not* yet fully built (be honest with yourself and clients): encryption-at-rest configuration, automated backups / disaster recovery, formal compliance (HIPAA / India DPDP) and a signable data agreement, and penetration testing. These are deployment-phase items, not code you've written.

---

## 9. The feature subsystems

### AI patient summaries (`server/src/lib/ai.js`)

A unified layer over **many** AI providers. It knows about OpenAI (GPT), Anthropic (Claude), Google (Gemini), plus several "OpenAI-compatible" providers (DeepSeek, Groq, Perplexity, z.ai, Mistral) that speak the same API shape with a different address. Key design choices:

- **Only models whose API key is configured are offered to the UI** — so a doctor never picks a model that would error.
- **Free vs. premium tiers.** Each model is tagged `free` or `premium`; free-plan users only see free models.
- **Monthly limits.** Free users are capped (default 10 summaries/month, `AI_FREE_MONTHLY_LIMIT`), enforced by counting rows in the `AIUsage` table.
- **A single prompt builder** assembles the patient's demographics + last 10 visits into a structured clinical prompt, and the response is framed as *decision support only — the clinician remains responsible.*

### Subscriptions & payments (Razorpay)

Paid plans unlock premium AI models and remove the monthly cap. The flow uses **Razorpay** (an India-focused payment gateway). The frontend starts a checkout; Razorpay handles the card details; then Razorpay calls your backend's **webhook** (`/api/webhooks`) to confirm payment. That webhook route is mounted *before* the JSON body parser and reads the **raw** request body, because it must verify Razorpay's cryptographic signature (HMAC) on the exact bytes received. The `Subscription` table records the resulting tier and billing period.

> **Heads-up / known inconsistency:** your `server/.env.example` still lists **Stripe** keys (`STRIPE_*`), but the actual code uses **Razorpay**. The example file is stale — when you set up real env vars you'll want Razorpay keys, not Stripe. Worth cleaning up so future-you isn't confused.

### File uploads (Azure Blob, `/api/uploads`)

When a doctor attaches a lab report to a visit, the file does **not** pass through your server. Instead the backend issues a short-lived **SAS URL** (a temporary, permission-limited link) and the browser uploads the file straight to Azure Blob Storage. The resulting public-ish blob URL is saved in the visit's `testReports` JSON. This keeps large files off your server and is the standard cloud pattern.

### The audit trail

Almost every route, after acting, calls a `writeAudit(...)` helper that inserts an `AuditLog` row (actor, action, target, IP, hospital). The admin "Audit Log" screen reads these back. Because rows are only ever inserted (never updated/deleted), it functions as tamper-evidence.

---

## 10. The frontend in detail

### How it boots

`index.html` loads `main.jsx`, which mounts the React app into a single `<div id="root">`. There is **one** root component: `src/App.jsx`.

### Navigation without a router

Most apps use a routing library to map URLs to screens. HealthVault instead keeps a `view` variable in `App.jsx` state (`'dashboard'`, `'patients'`, `'appointments'`, …) and a `renderView()` function that returns the matching component. Clicking a sidebar item just sets `view`. Simpler, at the cost of not having shareable URLs per screen.

### State lives at the top

`App.jsx` is the brain. It holds the logged-in `actor`, and the loaded data (`patients`, `appointments`, `doctorProfiles`, `credentials`, etc.) in React state. It defines all the handler functions (`handleAddPatient`, `handleAddVisit`, `handleResolveRequest`…) that call `api.js` and then update that state. Those handlers and data are passed *down* into the view components as props. So data flows down, and actions bubble up through callbacks — the standard React pattern. When you add a patient, the handler optimistically prepends it to the list so the UI updates instantly.

### Role-driven UI

The sidebar/nav items are chosen from the actor's role (`ADMIN_VIEWS`, `DOCTOR_VIEWS`, `RECEPTIONIST_VIEWS`). The same `App.jsx` renders very different apps depending on who logged in.

### The design system

There's no CSS framework. Instead:
- **`src/constants/theme.js`** is the single source of truth for colour, type scale, spacing, radii, and shadows — exported as a `C` object you import anywhere. (This is the file the recent UI work centred on: a neutral palette with one green accent, status colours reserved for clinical meaning, tabular numerals for vitals.)
- **`src/components/layout/GlobalStyle.jsx`** injects global CSS (fonts, scrollbars, animations, the responsive breakpoints, and utility classes like `.hv-skeleton`, `.hv-row`, `.hv-table-wrap`).
- **`src/components/ui/`** holds the reusable primitives — `Button`, `Card`, `Input`, `Select`, `Badge`, `Modal`, `AnimatedNumber`, etc. Views are built from these, so a change to a primitive updates the whole app.

### PWA

`vite-plugin-pwa` generates a **service worker** (the `dev-dist/sw.js` / `dist` equivalents) that caches the app so it can load fast and work partially offline, and lets users "install" it. That's why there's an `InstallPrompt` component.

---

## 11. Folder-by-folder map

```
Health Vault/
├─ index.html              # Browser entry; loads main.jsx
├─ main.jsx                # Mounts <App/> into #root
├─ vite.config.js          # Vite + PWA build config, dev server, /api proxy
├─ package.json            # Frontend dependencies & scripts
├─ HealthVault.jsx         # LEGACY single-file early version (91 KB) — not the live app
│
├─ src/                    # ← the live frontend
│  ├─ App.jsx              # Root component: state, data loading, view switching
│  ├─ services/api.js      # All backend calls (axios) live here
│  ├─ constants/
│  │  ├─ theme.js          # Design tokens (colours, type, radii, shadows)
│  │  └─ icons.js          # Inline SVG icon paths
│  ├─ components/
│  │  ├─ layout/           # Sidebar, BottomNav, GlobalStyle
│  │  └─ ui/               # Button, Card, Input, Modal, Badge, … (primitives)
│  ├─ views/               # One folder per area:
│  │  ├─ admin/            #   AdminDashboard, CredentialsView, DoctorProfilesView,
│  │  │                    #   PermissionsView, AuditLogView
│  │  ├─ credential/       #   DoctorDashboard, AISummaryView, SubscriptionView
│  │  ├─ shared/           #   PatientsView, AppointmentsView, PatientIntakeForm
│  │  └─ auth/             #   LoginScreen, SignUpScreen, HospitalSetup
│  ├─ store/reducer.js     # (state helpers)
│  └─ utils/               # formatters, helpers, gcal (Google Calendar links), prescription
│
└─ server/                 # ← the backend
   ├─ src/
   │  ├─ index.js          # Express app: middleware + mounts every route group
   │  ├─ middleware/       # auth.js (JWT guards), rateLimit.js, errorHandler.js
   │  ├─ lib/              # prisma.js (DB client), ai.js (AI providers),
   │  │                    #   azure.js (uploads), audit.js (writeAudit)
   │  └─ routes/           # One file per resource: auth, admin, credentials,
   │                       #   doctorProfiles, profileAccess, permissionRequests,
   │                       #   patients, visits, appointments, audit, dashboard,
   │                       #   ai, subscriptions, webhooks, uploads
   └─ prisma/
      ├─ schema.prisma     # THE data model (all tables) + DB connection
      ├─ migrations/       # Versioned history of DB structure changes
      └─ seed.js           # Inserts demo data into a fresh database
```

Note the two legacy/duplicate areas: the root `HealthVault.jsx` is an old single-file prototype, and some folders under `src/views/` (e.g. `views/patients/`, `views/appointments/`, `views/clinic/`) are an earlier component set that the live `App.jsx` doesn't import — the active screens are the ones in `views/admin`, `views/credential`, and `views/shared`.

---

## 12. Configuration (the `.env` files)

Secrets and environment-specific settings live in `.env` files (git-ignored). The backend's `server/.env.example` documents what's needed:

- `DATABASE_URL` — how to reach PostgreSQL (host, user, password, db name).
- `PORT`, `NODE_ENV` — where the server runs and which mode.
- `ALLOWED_ORIGIN` — comma-separated front-end origins allowed by CORS.
- `JWT_SECRET`, `JWT_EXPIRES_IN` — the signing secret and token lifetime. **The secret must be a long random string in production.**
- AI provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, and optionally DeepSeek/Groq/etc.) — only configured providers light up in the UI.
- `AI_FREE_MONTHLY_LIMIT` — the free-tier summary cap.
- `RATE_LIMIT_*` — request caps.
- Payment keys — *currently the example shows Stripe; the code uses Razorpay* (see Section 9 note).

The frontend reads `VITE_API_URL` (defaults to `/api`) to know where the backend is.

---

## 13. How to run it locally

Two programs, two terminals.

**Backend:**
```
cd server
cp .env.example .env          # then fill in real values
npm install
npx prisma migrate dev        # create/update the database tables
npm run db:seed               # (optional) insert demo data
npm run dev                   # starts the API on http://localhost:3001
```

**Frontend (separate terminal):**
```
npm install
npm run dev                   # starts the app on http://localhost:3000
```

Useful backend scripts: `db:studio` opens Prisma Studio (a visual DB browser), `db:reset` wipes and rebuilds the DB, `db:migrate` applies schema changes.

You need a running **PostgreSQL** database for the backend to connect to (locally installed, or a cloud one whose URL you put in `DATABASE_URL`).

---

## 14. Known gaps and things to watch

- **Backups / disaster recovery / deployment rollback** aren't built yet — they're operational tasks for when you deploy.
- **Compliance** (HIPAA / India DPDP), data-residency guarantees, and a signable data-processing agreement are not in place; treat them as "designed-for, not certified."
- **Encryption at rest** depends on your database/host configuration — confirm it before claiming it.
- **AI + PHI:** patient data is sent to whichever AI provider is selected. For many hospitals, PHI leaving their boundary is a dealbreaker — know exactly what's sent and to whom.
- **Interoperability** (HL7/FHIR, talking to other hospital systems) isn't implemented.
- **The Stripe/Razorpay env mismatch** in `.env.example` (Section 9).
- **Don't develop inside a OneDrive-synced folder.** Sync lag can hand your build tools half-written files, causing phantom "it didn't change / it won't compile" problems. Move the working copy to a normal path (e.g. `C:\dev\HealthVault`) and use GitHub for backup instead.

---

## 15. Glossary

- **Frontend / client** — code running in the user's browser.
- **Backend / server / API** — code running on a server that holds data and rules.
- **HTTP request / endpoint** — a message to a specific backend address (e.g. `POST /api/patients`).
- **JSON** — the text format used to exchange data between the two halves.
- **REST API** — the style of organizing endpoints around resources (patients, visits…) with verbs (GET/POST/PATCH/DELETE).
- **ORM** — a tool (Prisma) that lets you use the database via objects/methods instead of raw SQL.
- **Migration** — a versioned change to the database structure.
- **JWT** — a signed token that proves who you are on each request.
- **Hash (bcrypt)** — a one-way scramble of a password; you can verify a guess but can't reverse it.
- **Middleware** — code that runs on a request *before* the main handler (auth checks, rate limiting, parsing).
- **Multi-tenant** — one system serving many isolated customers (here, hospitals).
- **Junction table** — a table that links two others in a many-to-many way (here, ProfileAccess).
- **Webhook** — the payment provider calling *your* server to report an event.
- **SAS URL** — a temporary, permission-limited link to upload/download a cloud file.
- **PWA / service worker** — tech that makes a web app installable and partly offline-capable.
- **Component / props / state** — React building blocks: a UI function, the data passed into it, and the data it remembers.

---

*You built a genuinely real architecture here: multi-tenant, role-and-permission gated, audited, with pluggable AI and a payment system. The shape in Section 2 is the thing to internalize — everything else is that idea, expressed in code.*
