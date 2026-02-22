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

## Run locally

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


## Offline / Install

To test the PWA behavior locally:

```bash
npm run build
npm run preview -- --host
```

Then on phone:

1. Open the preview URL in the browser.
2. Use **Add to Home Screen** to install.
3. Open once online, then enable airplane mode and reopen the app to confirm offline launch.

All ranges, settings, and stats are stored in localStorage and remain available offline on the same device/browser profile.
