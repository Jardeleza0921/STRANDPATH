# STRANDPATH

**AI-assisted academic strand guidance, assessment and student development platform** for Senior High School students.

Students create an account, complete a versioned interest/strength assessment, see explainable strand alignments, choose a strand for themselves, work through a personalised improvement plan, track progress, take a follow-up assessment, and ask a grounded AI coach for explanations. School staff get a separate, audited administration area. Assessment scoring is deterministic and never delegated to AI.

---

## 1. Current status (honest summary)

| Area | Status |
| --- | --- |
| Student accounts, sessions, remember me, forced first-password change | **Implemented and tested** |
| Initial administrator and Klight student provisioning | **Implemented and tested** (requires passwords from env) |
| Email verification tokens/OTP, reset tokens/OTP, expiry, attempt limits, reuse prevention, session revocation | **Implemented and tested** with a test mail transport |
| Real email delivery over SMTP | **Implemented, not verified** — no SMTP credentials were available. Delivery must be confirmed with the school's provider |
| Google Sign-In / Sign-Up (OAuth 2.0 + OIDC, JWKS signature verification) | **Implemented, not verified** — needs a Google client. Buttons stay disabled until configured |
| Assessment engine, versioning, results, history, comparison | **Implemented and tested** |
| Improvement plans, activities, progress, post-assessment | **Implemented and tested** |
| AI Virtual Coach / Support Agent | **Implemented, inactive** — no AI key configured; endpoints return an honest 503 |
| Administrator monitoring, pagination, questionnaires, strands, activities, tickets, audit log | **Implemented and tested** |
| Four themes, skeuomorphic design, typography, reduced motion | **Implemented**; not visually reviewed in a browser in this environment |
| Assessment methodology & validation page | **Implemented** at `/methodology` |
| Educational (psychometric) validation | **Not done** — the questionnaire is a technical draft, not a validated instrument |

No passwords, API keys or SMTP credentials are stored in this repository.

---

## 2. Stack and layout

| Layer | Implementation |
| --- | --- |
| UI | React 18 + TypeScript + Vite + Tailwind, four CSS-variable themes |
| API | Node.js `node:http`, JSON REST under `/api` |
| Database | SQLite via `node:sqlite` (WAL, foreign keys, additive migrations) |
| Auth | HTTP-only session cookie, scrypt hashes, role-based access control, hashed OTPs |
| Email | `nodemailer` over SMTP; optional development file outbox |
| Google | Authorization-code flow, local ID-token verification against Google JWKS |
| AI | Server-side OpenAI-compatible chat completions |
| Hosting | One Node process serves `dist/` and the API |

```
src/
  pages/            public, auth, student (/app), admin (/admin), Methodology
  components/       UI primitives, auth components, shells, theme switcher
  contexts/         AuthContext, ThemeContext
  hooks/            auth configuration cache
  lib/              api client, theme definitions
server/
  index.js          process entry (seed + start)
  app.js            API routes, dispatch, forced-password gate
  routes/auth.js    registration, login, remember me, OTP reset, verification, Google
  routes/admin.js   staff endpoints, audit logging, pagination
  engine.js         deterministic scoring and comparison
  content.js        questionnaire v1.0, dimensions, strand weights, activity library
  mailer.js         SMTP transport + email templates + honest status
  google.js         OAuth URLs, code exchange, ID-token verification
  db.js             schema, migrations, helpers
  seed.js           idempotent content + account provisioning
  tests/            engine, API and authentication tests
```

---

## 3. Running locally

Requirements: **Node.js 22.13+** (built-in `node:sqlite`).

```bash
npm install
cp .env.example .env      # fill in the two initial passwords
npm run seed
npm run build
npm start                 # http://localhost:8787
```

Development with hot reload:

```bash
npm run dev:api           # API on :8787
npm run dev               # Vite on :3000, proxies /api
```

`npm run seed` is idempotent: it creates content and the configured accounts only when missing. It never resets an existing password.

### Initial accounts

The seed provisions exactly the accounts requested for this deployment:

| Role | Email | Password source |
| --- | --- | --- |
| Administrator | `jjardeleza@paterostechnologicalcollege.edu.ph` | `INITIAL_ADMIN_PASSWORD` (fallback `ADMIN_PASSWORD`) |
| Student (Klight) | `jaruiorijardeleza@gmail.com` | `INITIAL_STUDENT_PASSWORD` (fallback `STUDENT_PASSWORD`) |

Both are inserted server-side with role `admin` / `student`, hashed passwords, a verified email (provisioned by the school) and `must_change_password = 1`. They must use the normal sign-in page and replace the initial password before any dashboard or API access is granted. Public registration can only create students.

If a password variable is absent, the account is skipped with a printed note; nothing is created with a default password. Never commit `.env`.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT`, `DB_PATH`, `NODE_ENV` | Server port, SQLite file, `production` enables Secure cookies |
| `APP_BASE_URL` | Public origin used in email links and OAuth redirects |
| `INITIAL_ADMIN_EMAIL/NAME/PASSWORD` | First administrator |
| `INITIAL_STUDENT_EMAIL/NAME/PASSWORD` | Initial Klight student account |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | Real transactional email |
| `OTP_TTL_MINUTES` | Reset/verification code lifetime (default 10) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Google sign-in |
| `AI_API_KEY` or `OPENAI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_TIMEOUT_MS` | AI coach (optional) |

Optional development tools: `EMAIL_TRANSPORT=json` writes messages to `EMAIL_OUTBOX_DIR` instead of sending. It is never used unless explicitly set.

---

## 4. Authentication and account security

* Sign-in accepts email + password, with show/hide, remember me (30 days; otherwise 12 hours), forgot password, and Google when configured. Success redirects by role: students to `/app`, staff to `/admin`.
* Passwords: scrypt with per-user salt, timing-safe comparison, length and complexity rules, HIBP-style blocking is not included.
* Sessions: 256-bit random tokens, stored SHA-256 hashed, in HTTP-only `SameSite=Lax` cookies (`Secure` in production). Sign-in rotates sessions; password change/reset revokes the others; suspension takes effect immediately.
* Provisioned accounts are gated server-side: any API call other than the password-change/verification/profile-theme allowlist returns `403 PASSWORD_CHANGE_REQUIRED`. The SPA redirects to `/change-password`.
* Rate limits: registration 10/hour/IP; login 15 attempts/15 min per IP+email; forgot 8/hour/IP and 4/hour/account; reset 12/15 min/IP; verification 20/15 min/IP; AI 30/hour/student. Limits are per process (see limitations).
* Cross-origin mutating requests are rejected, strict security headers and CSP are set, JSON bodies are capped, SQL is parameterised, and student-owned records are scoped by user id (foreign ids return 404).
* Every staff view of a student record is written to `admin_logs`.

### Email verification and password reset

`POST /api/auth/forgot` always answers neutrally. For a real active account it creates a single-use record containing:

* a 32-byte link token, stored as SHA-256;
* a six-digit OTP, stored as a scrypt hash;
* an expiry (`OTP_TTL_MINUTES`), an attempt counter (max 5), and a used-at marker.

No plaintext code is stored. Requesting a new code invalidates the previous unused one. A successful reset also verifies the email, clears the forced-change flag, revokes every session, sends a confirmation email (when SMTP is configured) and clears the session cookie. Verification emails use 60-minute links. Used, expired or over-attempted codes fail with a generic message.

**SMTP configuration:** set the five SMTP variables and `EMAIL_FROM`, restart, then request a reset and confirm receipt. If sending fails, the API reports `delivery: failed` and the UI says email is unavailable; it never pretends an email was sent. The tests inject a capture mailer and verify the token/OTP flow; real provider delivery is **not** verified here.

### Google OAuth

1. In Google Cloud Console create an OAuth 2.0 Client (Web application).
2. Authorized JavaScript origin: `APP_BASE_URL` (for local development, `http://localhost:8787`).
3. Authorized redirect URI: `APP_BASE_URL/api/auth/google/callback`.
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, restart.

Flow: a random state is bound to an HTTP-only cookie, the code is exchanged server-side, and the ID token is verified locally (RS256 signature against Google JWKS, issuer, audience, expiry, verified email). New Google users are students and require the privacy-consent checkbox on the registration page. Existing accounts are linked only when their email is already verified; a Google identity can never take over an unverified password account. Google users get a random unusable password hash and can set a password through Forgot Password.

Without credentials, `/api/auth/google/status` reports `configured: false`, the start endpoint returns `503 GOOGLE_NOT_CONFIGURED`, and the buttons are disabled with an explanation. No simulated Google login exists.

---

## 5. Themes and interface

* Four themes — Green, Blue, Red, Violet — implemented as CSS variables mapped into Tailwind. Each uses light paper/surface tones with deep panels for navigation and hierarchy (roughly 60% light, 40% dark).
* Theme choice applies instantly, persists in `localStorage` for first paint, and is stored on the student/staff profile so it follows the account. `PUT /api/auth/theme` validates the id.
* Skeuomorphic layer: layered gradients, inset highlights, soft realistic shadows, tactile pressed/hover states, inset inputs, and restrained borders.
* Typography: Plus Jakarta Sans for headings and Inter for body, with consistent scale and spacing.
* Motion: page/card rise animations, progress transitions, hover/press feedback. `prefers-reduced-motion` disables animation globally.
* Student-facing wording is intentionally encouraging ("Let's Get Started", "Your Suggested Strands", "My Improvement Plan") and repeatedly states that recommendations are guidance, not decisions.
* Accessibility: labelled inputs, visible focus rings, keyboard-operable controls, semantic tables, `aria-live` status messages, responsive layouts down to small phones.

---

## 6. Assessment design and algorithm (`strandpath-fit-1.0.0`)

**Questionnaire v1.0**: 20 items across Interests, Strengths, Work style, Talents, Preferences and Readiness, with single-choice, limited multi-select and five-point scale items. Options contribute 0–3 points to ten dimensions:

`Scientific & Investigation`, `Analysis & Problem Solving`, `Numbers & Data`, `Technology & Systems`, `Creativity & Design`, `Communication & Language`, `People & Community`, `Business & Organisation`, `Hands-on & Practical`, `Persistence & Self-direction`.

1. Validate every answer against the stored version (known option codes, cardinality, maximum choices, all items present).
2. `raw(d) = Σ optionPoints(d) × itemWeight`.
3. `max(d) = Σ itemWeight × bestAttainable(d)`; for a multi-select limited to *k*, this uses the *k* highest option values — a conservative upper bound.
4. `scaled(d) = clamp(raw / max, 0, 1)`.
5. `alignment = 100 × Σ scaled(d) × strandWeight(d)`, with each strand vector required to sum to 1.0.
6. Bands: ≥60 strong, ≥48 good, ≥38 some, otherwise "worth exploring". Ranking is deterministic with a strand-code tie-break; close results raise a warning.
7. Strengths = top three dimensions; development areas = lowest two, framed as practice areas.

All item weights are 1.0 because no pilot data justifies otherwise. Active questionnaire versions are immutable; changes require a cloned draft. Each assessment stores its questionnaire version, algorithm version, answers, scores and recommendations, so old results stay explainable. The full method, worked example, validation matrix and testing examples are in `/methodology`.

**The questionnaire has not been pilot-tested, reliability-tested or expert-validated.** The application records it as `technical-draft` and says so in the UI. Do not describe results as validated.

---

## 7. Student workflow

Dashboard → pre-assessment (autosave, resume, validation, review) → results with evidence and gaps → strand exploration/comparison/careers → student chooses a strand → improvement plan generated from the chosen strand and lowest dimensions → activities with reflections and optional knowledge checks → progress → follow-up assessment with stored comparison → history.

Students can export their data and delete their account. Support requests and AI conversations are private to the student. There are no public profiles, social features or student-to-student messaging.

---

## 8. Administration

Staff sign in through the same page and land on `/admin`. Guidance reviewers get read-only student records, recent submissions and support triage; administrators also manage accounts, questionnaire versions, strands and weights, activities, analytics, AI/system settings and the audit log.

Overview statistics come from live SQL: totals, active/suspended, verified/unverified emails, new registrations in 7/30 days, pre/post participation, plan participation, completed activities, open/high-priority tickets, selection and completion rates, recent registrations, submissions and audit entries. The student list uses server-side search, status filter and pagination (25 per page, indexed/limited queries) instead of loading every record.

---

## 9. Database

Tables: `users`, `sessions`, `profiles`, `questionnaires`, `questions`, `question_options`, `strands`, `assessments`, `assessment_scores`, `recommendations`, `activities`, `programs`, `program_activities`, `ai_messages`, `support_tickets`, `support_messages`, `admin_logs`, `settings`, `email_tokens`, `notifications`, `meta`.

Recent additions: `users.email_verified_at`, `users.must_change_password`, `users.google_sub` (unique), `profiles.theme`, `email_tokens` (purpose, hashed token/OTP, expiry, attempts, used_at), `notifications` (read state). Migrations are additive and run automatically at startup. Back up the SQLite file and its `-wal` sidecar (or use `sqlite3 .backup`) while the process is stopped.

---

## 10. Testing

```bash
npm test          # 31 tests
npm run typecheck # tsc --noEmit
npm run build     # production SPA
npm run lint      # 0 errors expected
```

Covered automatically:

* **Engine** — determinism, full ranking, bounds, normalisation, multi-select maxima, technology- vs people-oriented profiles, invalid/missing answers, comparison.
* **Application API** — registration/consent, login/logout, profile persistence, assessment save/resume/submit, incomplete and cross-student access, selection/programme/activity completion, post-assessment comparison, ticket ownership, AI unavailable state, RBAC, audit logging, immutable questionnaire and draft cloning, cross-origin refusal.
* **Authentication** — provisioning idempotence and no plaintext storage, forced initial password change and role isolation, verification email and single-use token, remember-me cookie lifetimes, neutral forgot-password response, OTP reset with session revocation, used/expired/attempt-limited codes, reset-link flow, account theme persistence, same-origin proxy headers, Google not-configured behaviour.

A manual smoke run previously covered the whole journey end to end against a fresh database. Real SMTP delivery, Google OAuth round-trip and AI replies cannot be tested here because no credentials exist.

---

## 11. Deployment

**GitHub Pages cannot host this application.** Pages serves static files only: no Node process, no SQLite writes, no sessions, no SMTP, no AI or admin APIs. Publishing the SPA there would load a shell whose `/api/*` calls all fail, so it is not a valid deployment target. Use a Node/container host with a persistent volume.

Single Node process, no server-side build. Every option below uses the same image/config.

### Docker (any host)

```bash
cp .env.example .env        # passwords, APP_BASE_URL, SMTP/Google/AI as needed
npm run build               # optional; the image builds it too
docker compose up -d --build
```

The container listens on 8787, stores SQLite at `/data`, runs as the unprivileged `node` user, and has a health check against `/api/health`. The named volume `strandpath-data` must be backed up.

```bash
docker compose logs -f
docker compose exec app node -e "fetch('http://127.0.0.1:8787/api/health').then(r=>r.text()).then(console.log)"
```

For plain HTTP local use, `NODE_ENV=development` is the compose default so cookies are not `Secure`. Set `NODE_ENV=production` behind HTTPS. `APP_BASE_URL` must be the public HTTPS origin for email links and Google OAuth.

### Render (Blueprint)

1. Push this repository (already done).
2. In Render choose **New → Blueprint**, connect `Jardeleza0921/STRANDPATH`; Render reads [`render.yaml`](render.yaml).
3. Enter the secret values it prompts for: `INITIAL_ADMIN_PASSWORD`, `INITIAL_STUDENT_PASSWORD`, and optionally SMTP, Google and AI credentials. Set `APP_BASE_URL` to the Render URL after the first deploy.
4. The blueprint mounts a 1 GB persistent disk at `/data` and sets `NODE_ENV=production`. Persistent disks require a paid instance type.
5. First boot seeds the questionnaire, strands, activities and the two accounts. Check `/api/health`, then sign in and change the passwords.

One-click Blueprint link: `https://render.com/deploy?repo=https://github.com/Jardeleza0921/STRANDPATH`

### Railway

Create a project from the GitHub repo; [`railway.json`](railway.json) selects the Dockerfile and health check. Add a volume mounted at `/data`, then set the same environment variables. Railway provides `PORT`, which the server reads.

### VPS with a reverse proxy

```bash
git clone https://github.com/Jardeleza0921/STRANDPATH.git /srv/strandpath
cd /srv/strandpath && cp .env.example .env
# edit .env: NODE_ENV=production, APP_BASE_URL, passwords, SMTP
docker compose up -d --build
```

Put Caddy/nginx in front for TLS, preserving `Host` and `X-Forwarded-Proto`. Caddy example:

```
strandpath.example.edu.ph {
  reverse_proxy 127.0.0.1:8787
}
```

Without Docker, use the systemd unit below after `npm ci && npm run build`, with `DB_PATH` on persistent storage:

```ini
[Service]
WorkingDirectory=/srv/strandpath
EnvironmentFile=/srv/strandpath/.env
ExecStart=/usr/bin/node server/index.js
Restart=always
User=strandpath
```

### Operational notes

* Persist and back up the SQLite file and its `-wal` sidecar (`sqlite3 .backup` or stop the process first).
* `npm run seed` runs at startup; it is idempotent and never resets existing passwords.
* Set `APP_BASE_URL` to the final public origin before testing email or Google.
* Freebuff/Cloudflare Sites also cannot run this build as-is (Node server + filesystem database); a Workers/D1 port would be a separate rewrite.

---

## 12. Known limitations

* Educational validation is incomplete (no pilot, reliability or expert panel); the instrument is labelled a technical draft.
* Real SMTP delivery and Google OAuth are unverified without credentials. SMTP failures are reported, never simulated.
* Google accounts without a password can sign in only with Google until they set a password via Forgot Password.
* Email verification is encouraged and shown as a banner, but unverified students can still use the app (their access is not hard-blocked).
* Rate limiting and the WebSocket-free session store are process-local; horizontal scaling needs a shared store. SQLite suits a single school/server; larger deployments should move to PostgreSQL.
* No MFA, email-address change, self-service account recovery without email, outbound email notifications, automated retention job, or social login providers beyond Google.
* AI is disabled until a server-side key is added, and AI output must be reviewed before use with minors.
* The four themes were not visually inspected through a browser in this environment; verify on the target devices, including reduced-motion and small screens.
* Retained `/mobile`, `/cover` and `/design-system` pages are visual prototypes, separate from the working application.
