# Preflop Range Drill

Mobile-first Vite + React + TypeScript single-page trainer for 9-max ~100bb preflop open/fold recall.

## Features

- Drill tab with random position + 169-class hand prompts.
- Difficulty setting for hand sampling:
  - **Normal** (default) boundary-biased sampling.
  - **Hard** strongly boundary-biased sampling.
  - **Uniform** equal weighting of all 169 hands.
- OPEN/FOLD checking against stored situation policy.
- Session scoreboard persisted in localStorage (`poker_range_drill_session_v1`) with **Reset session**.
- Incorrect-only feedback panel with 13x13 range grid and tested hand highlight.
- Ranges tab to view ranges, import shorthand (`77+`, `A2s+`, `ATo+`, `22-66`, etc.), and review Raise/Fold percentages.
- Stats tab for historical totals, by-position performance, and top mistakes.
- Settings tab with localStorage-backed toggles and reset controls.
- Offline-capable local-only persistence under `poker_range_drill_v1`.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Other commands:

```bash
npm run build
npm run lint
npm run format
npm run preview
```

## GitHub Pages deployment

- Deployment runs automatically via `.github/workflows/deploy.yml` when you push to `main`.
- You can also trigger deploy manually from the **Actions** tab using `workflow_dispatch`.
- In GitHub, set **Repo → Settings → Pages → Source** to **GitHub Actions**.

## Set the correct repository name

- Open `vite.config.ts` and update:

```ts
const REPO_NAME = 'poker_trainer';
```

- Change this value to your actual GitHub repository name so Vite base path and PWA paths work under `https://<user>.github.io/<repo>/`.

## Offline / Install on phone (GitHub Pages)

1. Deploy and open your GitHub Pages URL over HTTPS on your phone.
2. Use **Add to Home Screen** / **Install** in the browser.
3. Launch the app once while online.
4. Turn on airplane mode.
5. Launch again from the home screen icon to confirm offline startup.

Ranges, settings, and stats are persisted in localStorage and remain available offline on the same device/browser profile.

## VS Code

1. Open folder in VS Code.
2. Install recommended extensions:
   - `dbaeumer.vscode-eslint`
   - `esbenp.prettier-vscode`
3. Use provided tasks in **Terminal > Run Task**:
   - npm install
   - npm run dev
   - npm run build
   - npm run lint
   - npm run format
4. Optional launch config: **Launch Preflop Range Drill** (Chrome, `http://localhost:5173`).

## Persistence and reset

- App state is stored in localStorage key: `poker_range_drill_v1`.
- Session state is stored separately in localStorage key: `poker_range_drill_session_v1`.
- Settings includes:
  - **Reset session**
  - **Reset historical stats only** (keeps ranges/settings)
  - **Reset all data (ranges + stats + settings)**
