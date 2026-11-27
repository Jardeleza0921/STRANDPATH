# STRANDPATH

**Strand guidance, assessment and student development for Senior High School students — now a static, GitHub Pages-ready web application with an integrated Strand Assistance guide.**

Students create a local account, complete a versioned interest/strength assessment, read explainable strand alignments, choose a strand for themselves, work through an improvement plan, track progress, take a follow-up assessment, and ask **Strand Assistance** about strands, college programmes, careers, skills and their own results.

Everything the student uses runs in the browser. There is **no AI provider, no AI API key, no Node.js production server, no database, and no paid hosting** required for the student application.

---

## 1. What changed in this revision

| Before | Now |
| --- | --- |
| `AI Virtual Coach` chat powered by an OpenAI-compatible API | **Strand Assistance**: a deterministic, local guidance engine with a structured knowledge base |
| `AI_API_KEY` / `OPENAI_API_KEY`, model and base-URL settings | Removed from the student application and from the optional server; no provider credentials anywhere |
| AI support agent chat | Support help topics plus support requests stored in the student's browser |
| Node + SQLite required for every student feature | Student application is a static Vite build deployed to GitHub Pages |
| BrowserRouter (nested refresh needs server rewrites) | **HashRouter in the static build**, so deep links survive refresh on GitHub Pages |
| AI messages in `ai_messages` | Removed from the schema and code |

The optional Node/SQLite backend is retained for schools that need shared accounts, email verification, Google sign-in, cross-device records or the administrator dashboard. It is now opt-in and is not part of the static deployment.

---

## 2. Status (honest)

| Area | Status |
| --- | --- |
| Static student build (register, sign in, assessment, results, programme, progress, support, Strand Assistance) | **Implemented**; typecheck, production build and guidance self-test pass |
| Strand Assistance knowledge base and engine | **Implemented and tested** — 158 assertions over 12 topics, 11 FAQ entries and every supported example question |
| Local account storage (PBKDF2-hashed passwords, localStorage records) | **Implemented**; not a secure multi-user authentication system (see §7) |
| GitHub Pages workflow | **Implemented**; the first real Pages deployment must be run from GitHub Actions |
| Email verification, password reset by email, Google sign-in | **Not available in the static build**; available in the optional backend |
| Administrator dashboard, cross-device records, staff roles | **Not available in the static build**; available in the optional backend |
| Educational (psychometric) validation | **Not done** — the questionnaire is a technical draft, not a validated instrument |
| Automated UI end-to-end tests | Not added; the build, typecheck, engine self-test and API tests are the automated coverage |

No passwords, API keys or SMTP credentials are stored in this repository.

---

## 3. Quick start (static application)

Requirements: **Node.js 20+** (the CI workflow uses Node 22).

```bash
npm ci
npm run dev          # http://localhost:3000
```

Production build and local preview:

```bash
npm run build        # static output in dist/
npm run preview      # serves dist/ through the optional Node server
```

The static build needs **no environment variables**. Open the site, create a student account, and take the pre-assessment.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Static production build (`dist/`) |
| `npm run typecheck` | `tsc --noEmit` over the TypeScript application |
| `npm run test:guidance` | Runs every supported Strand Assistance topic and assessment integration |
| `npm run test:development` | Runs the pathway, readiness, progression and strand-change self-test |
| `npm test` | Optional backend API, auth and engine tests (30 tests) |
| `npm run lint` | ESLint |
| `npm run dev:api` / `npm start` | Optional Node API on port 8787 |
| `npm run seed` | Seed the optional SQLite backend |

---

## 4. Deploying to GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run **Actions → Deploy STRANDPATH to GitHub Pages → Run workflow**).
4. The site appears at `https://<user>.github.io/<repository>/`.

The workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) installs with `npm ci`, runs the typecheck, the guidance and development self-tests, builds with `VITE_BASE_PATH=/<repository>/`, copies `index.html` to `404.html`, adds `.nojekyll`, and deploys `dist/` using the official Pages actions. No secrets are needed.

Why refreshing a nested page works: the static build uses `HashRouter`, so the server only ever serves `index.html`. A URL such as `/#/app/assistance` is resolved entirely in the browser and a refresh cannot produce a 404. The trade-off is the `#` in the address bar; a custom 404 redirect trick is unnecessary.

**Custom domain or user site:** set `VITE_BASE_PATH` to `/` (default) if the site is served from the domain root, and keep `base` in sync. See [`docs/STATIC_DEPLOYMENT.md`](docs/STATIC_DEPLOYMENT.md) for details and troubleshooting.

---

## 5. Strand Assistance (the replacement for the Virtual Coach)

Strand Assistance is a first-class part of the student dashboard at `/app/assistance` (old `/app/coach` links redirect there). It looks like STRANDPATH, not an embedded third-party chatbot.

**How it works**

- Questions are normalised, matched to intents with keyword/phrase rules, and linked to knowledge-base entities (strands, programmes, careers) using aliases.
- Responses are assembled from pre-written explanations plus the student's **real** latest assessment, selected strand, profile and improvement programme.
- Conversation context is kept for the session (for example, `Compare STEM` followed by `ICT` completes the comparison).
- It never computes or changes an official score. Scoring stays in `shared/engine.js`.
- Questions outside the knowledge base get an explicit "I could not match that / I will not guess" answer with supported topics.
- Every explanation shows its sources: the assessment id/date/algorithm version and/or the local knowledge base.

**Supported topics** include: which strand fits; why a recommendation was made (dimension evidence, gaps, alternatives); comparing two strands; college programmes after a strand; careers for a strand, programme or career name; skills to develop; undecided students; alternative options; TVL specialisations; the improvement plan; next steps; assessment mechanics; data storage; and school-offering limits. The exact list lives in `src/guidance/knowledge/`.

**Knowledge base** (`src/guidance/knowledge/`)

| File | Contents |
| --- | --- |
| `strands.ts` | The eight SHS strand records, aliases, tracks and the caveat that schools differ |
| `programs.ts` | 21 college programme entries: typical preparation, skills, careers, notes |
| `careers.ts` | 21 career entries: strands, programmes, skills, day-to-day work, a first step |
| `faqs.ts` | Structured answers for undecided students, TVL, STEM vs ICT, maths concerns, HUMSS, college vs work, privacy and emotional support |

To add a programme or career, append an entry to the relevant file and add a test question to `src/guidance/selftest.ts`. Nothing is generated at runtime and no network request is made.

**Limits stated to students:** recommendations are guidance, not a psychological assessment, an admission guarantee or a career prediction. School offerings, admission rules and deadlines must be confirmed with the school. The assistant does not answer medical, legal or personal-safety questions; it redirects to a trusted adult or counsellor.

Full technical notes: [`docs/STRAND_ASSISTANCE.md`](docs/STRAND_ASSISTANCE.md).

---

## 5A. Development progression, readiness and strand choice

A student's result is a starting point, not a limit. After the pre-assessment they can choose any strand — including one that needs significant preparation — and “My Development Journey” builds the path from their current evidence.

- **Five stages per strand:** Foundation, Developing, Building Competence, Advanced Practice, Target Readiness. Each stage names the dimensions it asks for, a checkpoint, and strand-specific practice modules (mathematics foundations for STEM, financial literacy for ABM, digital literacy and programming for ICT, and so on).
- **Two measurements:** current readiness (today's alignment with the chosen strand) and pathway evidence (what has actually been demonstrated). They are shown separately because ambition and current match are different things.
- **Evidence, not attendance:** a completed activity counts through its knowledge-check score; an unchecked activity records participation at 45% only. Assessment scores are never raised because an activity was completed.
- **Honest progress:** 100% requires every stage checkpoint and a submitted follow-up assessment. The page lists what is met, what remains, and what 100% does *not* mean.
- **Starting at your level:** plan generation targets the chosen strand's biggest gaps, skips dimensions at 80%+, and skips foundation activities for dimensions already at 70%+.
- **Changing strands:** completed records are kept, transferable evidence is reused, and the plan is rebuilt around the new strand's requirements.

Strand Assistance reads the same model (stage, readiness, weakest/strongest dimensions, next action, transferable skills) and adapts: a stuck student gets a smaller step and a different approach on repeat; a strong student is offered a harder constraint instead of beginner content; discouraged students get a realistic next step and a pointer to a person.

Full model notes: [`docs/DEVELOPMENT_PROGRESSION.md`](docs/DEVELOPMENT_PROGRESSION.md).

---

## 6. Assessment engine (unchanged, now shared)

Questionnaire v1.0 has 20 items contributing points to ten dimensions. The deterministic algorithm `strandpath-fit-1.0.0` is in [`shared/engine.js`](shared/engine.js) and is used by **both** the static build and the optional server, so there is one implementation of scoring.

1. Validate every answer against the questionnaire version.
2. `raw(d) = Σ optionPoints(d) × itemWeight`.
3. `max(d) = Σ itemWeight × bestAttainable(d)` (for limited multi-select, the *k* highest options).
4. `scaled(d) = clamp(raw / max, 0, 1)`.
5. `alignment = 100 × Σ scaled(d) × strandWeight(d)`.
6. Bands: ≥60 strong, ≥48 good, ≥38 some, otherwise "worth exploring"; ties break by strand code.
7. Strengths are the highest dimensions; development areas the lowest, framed as practice.

Each submitted assessment stores its questionnaire version, algorithm version, answers and computed result, so old results remain explainable. The questionnaire is labelled `technical-draft`: it has not been pilot-tested, reliability-tested or expert-validated. Do not describe results as validated.

---

## 7. Student data and privacy in the static build

- Accounts, profiles, answers, results, programmes and support requests live in this browser's `localStorage` under one versioned key.
- Passwords are stored as salted **PBKDF2-SHA256** hashes (150,000 iterations), never plain text. The salt and hash are in local storage, so this protects against casual inspection, not against someone with control of the device or the browser profile.
- **This is not secure multi-user authentication and not a school record system.** It cannot verify identity, recover a forgotten password, enforce staff access or share records across devices.
- Clearing site data, private browsing, changing browser or device, or storage eviction deletes the records. The UI says this on the registration, settings, support and Strand Assistance screens.
- Students can export a JSON copy from **Profile → Export my records**, and delete the account and its records from **Settings**.
- The assistant runs locally. No question, answer, profile or result is sent to any AI service.
- Do not publish personal data in JSON/CSV files in the repository. The knowledge base contains only generic programme and career descriptions.

For a school that needs verified accounts, cross-device records and staff oversight, run the optional backend and build with `VITE_API_MODE=server`. Nothing in the static build pretends those guarantees exist.

---

## 8. Optional Node/SQLite backend

The backend remains in [`server/`](server/) for the features that genuinely require one: shared accounts, email verification and password reset, Google sign-in, staff roles, the audited administrator dashboard, cross-device records and centralized support tickets.

```bash
cp .env.example .env     # initial passwords and optional SMTP/Google values
npm run seed
VITE_API_MODE=server npm run build
npm start                # http://localhost:8787 serves dist/ and /api
```

With `VITE_API_MODE=server` the client uses the same fetch client as before and the full admin area is routed in. The database schema no longer includes `ai_messages`; the AI endpoints, provider configuration and AI UI have been removed.

Deployment notes for Docker, Render, Railway, Netlify and a VPS are kept in the repository (`Dockerfile`, `render.yaml`, `railway.json`, `netlify.toml`) but are **optional** and not needed for GitHub Pages. Remove `AI_*` variables from any existing deployment configuration.

---

## 9. Project structure

```
src/
  pages/                 public site, auth, student app (/app), admin (/admin)
  pages/app/Assistance.tsx   Strand Assistance interface
  guidance/              engine, knowledge base, types, self-test
  lib/local/             browser storage, local password hashing, student API
  lib/api.ts             routes to the local backend (static) or fetch (server)
  lib/mode.ts            VITE_API_MODE and router strategy
  data/                  public strand and questionnaire content
shared/
  content.js             questionnaire, strands, activity library
  engine.js              deterministic scoring and comparison
server/                  OPTIONAL Node/SQLite backend and tests
scripts/check-guidance.mjs   bundles and runs the guidance self-test
.github/workflows/deploy.yml GitHub Pages build and deployment
docs/                    static deployment and Strand Assistance notes
```

---

## 10. Verification performed

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passes |
| `npm run test:guidance` | 199 checks pass (topics, shortcuts, FAQ reachability, assessment grounding, follow-up context, adaptive struggle/challenge/readiness/switch answers, unsupported detection) |
| `npm run test:development` | 253 checks pass (all seven pathways, low-match choice, evidence rules, mastery skipping, 100% gate, plan next action, strand changes) |
| `npm run build` | Passes; static `dist/` produced |
| `npm test` (optional backend) | 30 tests pass |
| Production guidance bundle | Contains no AI provider code or API keys |
| Browser smoke test (Chromium, 1440×900 and 390×844) | Register → 20-item assessment → submitted results → grounded Strand Assistance answers → unsupported-question fallback; no console errors and no horizontal overflow |
| GitHub Actions deployment | Not executed from this environment; the workflow is ready and requires Pages to be enabled |

Not verified here: real GitHub Pages hosting, browsers other than Chromium, physical devices, and the optional backend's SMTP/Google flows without credentials. The mobile and desktop checks used responsive viewport resizing, not real phones.

---

## 11. Known limitations

- Static records are per browser and per device; there is no recovery if site data is cleared.
- Local accounts are not verified identities and the static build has no staff or administrator area.
- Email confirmation, password reset email, Google sign-in and centralized support need the optional backend.
- The questionnaire is a technical draft; results are structured guidance, not a validated assessment.
- The knowledge base is intentionally finite. It covers strands, common college programmes, careers and the documented questions; it does not know a specific school's offerings, deadlines, tuition or scholarships.
- Pathway stage targets and evidence caps are transparent design choices, not validated psychometric cut-offs. Readiness is a planning aid, not a qualification.
- The four colour themes each have a light and dark appearance, saved per browser. Theme colours follow the account only where the optional backend is used.
- localStorage is small (a few megabytes). The app stores only text records; exporting before clearing data is recommended.
- `/mobile`, `/cover` and `/design-system` remain visual prototype pages, separate from the working application.
