# Preflop Range Drill

Mobile-first Vite + React + TypeScript single-page trainer for 9-max ~100bb preflop open/fold recall.

## Features

- Drill tab with random position + random 169-class hand prompts.
- OPEN/FOLD checking against stored situation policy.
- Incorrect-only feedback panel with 13x13 range grid and tested hand highlight.
- Ranges tab to view ranges and import shorthand (`77+`, `A2s+`, `ATo+`, `22-66`, etc.).
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
- Settings includes:
  - **Reset stats only** (keeps ranges/settings)
  - **Reset all data (ranges + stats + settings)**
