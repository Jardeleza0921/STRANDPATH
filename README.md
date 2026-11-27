# STRANDPATH

**A strand guidance and student development platform for Senior High School.**

Live site: **https://jardeleza0921.github.io/STRANDPATH/**

STRANDPATH helps students understand their interests and strengths, compare Senior High School strands, choose a direction, and build the skills that direction needs. It is a guidance tool: it explains possibilities and next steps, and it never decides a student's future for them.

---

## 1. Project Overview

Choosing a strand is often rushed. Students pick what friends chose, what sounds safe, or what someone else recommended, without a clear picture of their own interests and strengths.

STRANDPATH slows that decision down. A short assessment produces strand matches with visible reasoning. Students can explore every strand, compare them, and choose the one they actually want. Once a strand is chosen, STRANDPATH builds a practice programme and tracks development toward that strand's readiness criteria.

The published application is a static website. It runs entirely in the browser, stores records in that browser, and is deployed with GitHub Pages. It does not require an account server, a database server, or an API key.

## 2. Purpose and Objectives

- Help students describe their interests, strengths, and working preferences in their own words.
- Show which strands connect to those answers, and explain why.
- Let students choose any strand, including one that needs preparation.
- Turn a strand choice into a practical development plan.
- Track readiness with defined criteria instead of arbitrary percentages.
- Encourage reflection and conversation with a teacher, counsellor, or parent.

## 3. Target Users

- **Senior High School students** exploring or confirming a strand.
- **Guidance counsellors and teachers** who need a shared vocabulary for strand conversations.
- **Parents and guardians** who want to understand what a strand involves.

## 4. Key Features

- **Interest and strength assessment** with a results page that shows the dimensions behind each match.
- **Seven strand profiles**, each with subjects, skills, college fields, career areas, and things to consider.
- **Strand comparison** side by side, and a career explorer.
- **A respectful decision flow.** The top match is a recommendation, not a requirement. A student can choose any strand; if the match is low, the app shows what to develop rather than rejecting the choice.
- **Five-stage development pathways** for every strand.
- **Readiness tracking** using evidence from assessment answers, completed activities, and knowledge checks.
- **A practice programme** generated from the student's biggest gaps, with reflections and optional knowledge checks.
- **Post-assessment comparison** showing what changed, what is still developing, and what to do next.
- **Strand Assistance.** A local, rule-based helper that answers questions about strands, results, readiness, and next steps. It adapts to struggle, mastery, discouragement, and a change of strand. It is not an AI chatbot and never changes scores.
- **Progress and history** with dates, completion status, and assessment records.
- **Four colour themes** (Green, Blue, Red, Violet), each with a balanced light and dark mode.
- **Mobile navigation** with one menu button and a full-screen drawer.
- **Accessible, responsive layout** with keyboard-friendly controls and visible focus states.

## 5. How the System Works

```
ASSESS → DISCOVER → CHOOSE → DEVELOP → PRACTICE → REASSESS → PROGRESS
```

1. **Assess.** The student answers questions about interests, strengths, work style, and preferences.
2. **Discover.** Results show strand matches, the dimensions behind them, and suggested next steps.
3. **Choose.** The student reviews the recommendation and chooses a strand, or explores other options first.
4. **Develop.** The app shows the chosen strand's development pathway, current stage, and readiness evidence.
5. **Practice.** A programme of activities targets the student's biggest gaps. Activities include instructions, a reflection, and sometimes a short knowledge check.
6. **Reassess.** A follow-up assessment records how answers changed. It is optional and does not claim that an activity caused the change.
7. **Progress.** The dashboard and journey page show readiness, completed work, still-developing skills, and the next action.

**Readiness** is computed from defined checkpoints. Completed activities without a knowledge check count as participation, not mastery. The score reaches 100% only when every stage checkpoint is met and a follow-up assessment is submitted. 100% means the STRANDPATH criteria are met; it is not an admission guarantee, a grade, or proof of competence.

## 6. Available SHS Strands and Pathways

| Strand | Focus | Example pathways |
| --- | --- | --- |
| **STEM** | Science, technology, engineering, and mathematics | Engineering, Health Sciences, Computer Science, Research |
| **ABM** | Accountancy, business, and management | Accountancy, Business Administration, Entrepreneurship, Finance |
| **HUMSS** | Humanities and social sciences | Education, Communication, Psychology, Law, Public Service |
| **GAS** | General academic strand | Education, Communication, Social Science, Business |
| **TVL – ICT** | Information and communications technology | Software Development, IT Support, Data and Analytics, Cybersecurity |
| **Arts & Design** | Creative and performing arts | Visual Arts, Media Production, Design, Performing Arts |
| **Sports** | Physical education and sports science | Sports Science, Coaching, Physical Education, Sports Management |

Each strand has a five-stage pathway: **Foundation → Developing → Building Competence → Advanced Practice → Target Readiness**. Stages contain strand-specific practice modules and measurable checkpoints.

## 7. Technology Used

- **React 18** with **TypeScript**
- **Vite 5** for development and production builds
- **React Router 6** (hash routing)
- **Tailwind CSS 3** with custom theme tokens
- **lucide-react** icons
- **Node.js test scripts** for the guidance and development models
- **GitHub Actions** and **GitHub Pages** for deployment

The application has no runtime server dependency, no external database, and no third-party API calls. Fonts are loaded from Google Fonts.

## 8. System Architecture

```
Browser
├── React pages and components        presentation, themes, navigation
├── shared/content.js                 strands, dimensions, activity library
├── shared/engine.js                  assessment scoring and strand matching
├── src/development/                  pathways, readiness, next action
├── src/guidance/                     rule-based Strand Assistance
└── src/lib/local/                    request handlers + localStorage store
```

- **Routing.** `HashRouter` keeps deep links working on GitHub Pages, where the server cannot rewrite paths. `dist/404.html` covers direct path requests.
- **Storage.** Accounts, assessments, plans, reflections, and support requests are stored in the browser's `localStorage`. Passwords are hashed with PBKDF2 before storage. Data stays on that device and is not synced.
- **Scoring.** The assessment engine in `shared/engine.js` is shared by the browser build and the optional Node API so both produce the same results.
- **Development model.** `src/development/` maps assessment evidence and completed activities to stage progress, readiness criteria, and a next action.
- **Guidance.** `src/guidance/` matches a student's question to a topic and builds answers from the same local data. It does not call a language model.

The repository also contains an optional Node/SQLite server (`server/`) used for local experiments with shared accounts and an administrator area. **The GitHub Pages site does not use it, and it is not required to run or deploy the application.**

## 9. Installation and Local Development

Requirements: **Node.js 22.13 or newer** and npm.

```bash
git clone https://github.com/Jardeleza0921/STRANDPATH.git
cd STRANDPATH
npm ci
npm run dev
```

Open the URL printed by Vite (by default `http://localhost:3000`).

Other commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create the production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | TypeScript check |
| `npm run test:guidance` | Guidance engine checks |
| `npm run test:development` | Development pathway checks |

No environment variables or secrets are required for the static application.

## 10. GitHub Pages Deployment

Deployment is automatic. A push to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which:

1. installs dependencies with `npm ci`;
2. runs the type check and both model test suites;
3. builds with the repository base path (`VITE_BASE_PATH=/<repository>/`);
4. copies `index.html` to `404.html` and adds `.nojekyll`;
5. uploads the build and deploys it to GitHub Pages.

The workflow uses the official GitHub Pages actions and a short-lived OIDC token. It needs no deployment keys, paid hosting, or external service.

**Repository setup:** under **Settings → Pages**, set **Source** to **GitHub Actions**. The site is then available at `https://<user>.github.io/<repository>/`.

For a user site or a custom domain at the domain root, build with `VITE_BASE_PATH=/`. Details and troubleshooting are in [`docs/STATIC_DEPLOYMENT.md`](docs/STATIC_DEPLOYMENT.md).

## 11. Project Limitations

- **Data is per browser.** Accounts and records live in `localStorage` on one device. Clearing site data, using private mode, or switching browser removes them, and there is no server copy to restore.
- **No central accounts or staff dashboard in the published app.** Multi-device accounts, email verification, password reset by email, and administrator oversight are not part of the static build.
- **Not a validated psychometric instrument.** The questionnaire and readiness criteria are a transparent technical draft, not a scientifically validated test.
- **Guidance is rule-based.** Strand Assistance uses a fixed knowledge base and local context. It is not generative AI and cannot answer arbitrary questions.
- **Activity completion is self-reported.** Knowledge checks are short self-administered quizzes.
- **Readiness is not a guarantee.** A high score does not promise admission, a grade, or success in a strand or career.
- **No offline support.** The app needs the site to load; there is no service worker or offline cache.

## 12. Author and Ownership

Designed and maintained by **Jardeleza0921**.

The source code, content, and design in this repository are the project owner's work.

© 2026 STRANDPATH. All rights reserved.
