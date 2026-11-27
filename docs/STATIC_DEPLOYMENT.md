# Static deployment on GitHub Pages

The student application is a Vite + React + TypeScript single-page application. It makes no API calls in the default build: the same request shapes are answered by `src/lib/local/backend.ts` from browser storage. That is what allows it to run on GitHub Pages with no server, database, email service or AI key.

## Build

```bash
npm ci
npm run typecheck
npm run test:guidance
npm run test:development
VITE_BASE_PATH=/<repository>/ npm run build
cp dist/index.html dist/404.html
touch dist/.nojekyll
```

`dist/` is the complete site. It contains no secrets and no server code.

## GitHub Pages workflow

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on pushes to `main` and on manual dispatch:

1. checkout, Node 22, `npm ci`;
2. `npm run typecheck`, `npm run test:guidance` and `npm run test:development`;
3. `npm run build` with `VITE_BASE_PATH=/${{ github.event.repository.name }}/`;
4. copy `index.html` to `404.html` and add `.nojekyll`;
5. upload `dist/` as a Pages artifact and deploy it with `actions/deploy-pages`.

In the repository, set **Settings → Pages → Source** to **GitHub Actions**. The first deployment creates the Pages environment; approve it if the environment requires approval.

## Base path

- Project site (`https://user.github.io/repo/`): `VITE_BASE_PATH=/repo/`.
- User/organisation site (`https://user.github.io/`) or custom domain at the root: `VITE_BASE_PATH=/` (the default).

The workflow derives the repository name automatically. If a build is made without the variable, assets are requested from `/assets/…`, which 404s on a project site — always set it for project pages.

## Routing and refresh

The static build uses `HashRouter` (see `src/lib/mode.ts`). Every route is a fragment (`/#/app/results`), so GitHub Pages only serves `index.html`; refreshing a nested route cannot produce a 404. The build still copies `index.html` to `404.html` so a direct hit on a path without a hash (a mistyped or shared link) loads the application instead of GitHub's 404 page.

The optional server build (`VITE_API_MODE=server`) uses `BrowserRouter`, because that deployment serves the SPA for every path.

## Caching

GitHub Pages serves hashed files from `dist/assets/` with long cache lifetimes and `index.html` with a short one. No extra configuration is needed. After a deployment, a hard refresh may be required if a browser cached the previous `index.html`.

## Data expectations

- Each browser profile has its own accounts and records. There is no cross-device sync.
- Clearing site data deletes everything stored there.
- The app exposes export (Profile) and account deletion (Settings).
- Support requests are private local notes in the static build; they are not delivered to the school.
- Administrator, staff, email-verification and Google-sign-in features are not routed in the static build and their APIs return a clear "needs the optional server" error.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Blank page, assets 404 | Wrong base path | Rebuild with `VITE_BASE_PATH=/<repository>/` |
| 404 on refresh of `/app/...` | A `BrowserRouter` build was deployed | Use the default static build (hash routing) |
| "Strand Assistance could not open" | Local storage unavailable (private mode, disabled storage) | Use a normal window; records cannot persist in private mode |
| Account disappears | Different browser/device or site data cleared | Expected in a static build; export records beforehand |
| Pages deployment skipped | Pages source not set to GitHub Actions, or environment approval pending | Set the source and approve the environment |

## Optional backend build

If the school needs verified accounts, shared records, staff oversight or email, deploy the Node/SQLite backend and build the client against it:

```bash
VITE_API_MODE=server npm run build
npm start
```

That build uses `BrowserRouter` and the `/api/*` routes. See the main README §8 and the deployment files (`Dockerfile`, `render.yaml`, `railway.json`, `netlify.toml`). Do not point the static GitHub Pages build at a backend: it intentionally has no API base URL.
