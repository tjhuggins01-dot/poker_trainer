# Preflop Range Drill

Mobile-first Vite + React + TypeScript trainer for 9-max ~100bb preflop decisions.

## What’s new in this version

- Two drill types:
  - **Open First In (RFI)**
  - **Facing an Open**
- **SB RFI now supports Raise + Limp + Fold** (fold implied by hands not in raise/limp).
- **Facing-open defaults** added for common matchups:
  - BTN vs CO
  - BTN vs HJ
  - CO vs HJ
  - SB vs BTN
  - BB vs BTN
- **Position Focus** on Drill page (persisted per drill type).
- **Historical + session stats** improvements:
  - overall totals
  - RFI by hero position
  - Facing-open by hero and by matchup
  - top missed spots
  - session average response time

## RFI vs Facing-open drills

### RFI
Prompt includes hero position + hand class.

- Non-SB actions: **RAISE / FOLD**
- SB actions: **RAISE / LIMP / FOLD**

Correctness uses stored RFI policy for that position.

### Facing an Open
Prompt includes villain open position, hero position, and hand class.

Actions: **FOLD / CALL / 3BET**

Correctness:
- if hand in 3bet set → 3BET
- else if hand in call set → CALL
- else FOLD

## Ranges editor

Ranges tab supports both modes:

- **RFI**: choose hero position (UTG..SB)
- **Facing Open**: choose supported hero-vs-villain matchup

Each view shows:
- 13x13 grid
- per-action percentages over 169 hand classes
- shorthand import boxes

Overlap validation:
- SB RFI raise/limp overlap is rejected.
- Facing-open call/3bet overlap is rejected.

## Presets

Use **Settings → Apply preset to all ranges** to populate both:
- all RFI ranges (including SB limp)
- all facing-open default matchups

Preset profiles:
- **Version 1** tighter
- **Version 2** wider

## Data contract (formats + stack buckets)

The drill resolver now requires **format + effective stack** when looking up policies.

- Situation keys are stack-aware:
  - `RFI_{format}_{stack}BB_{hero}`
  - `FACING_OPEN_{format}_{stack}BB_{hero}_VS_{villain}`
  - `THREE_BET_{format}_{stack}BB_{hero}_VS_{villain}`
- Missing spots are treated as unavailable UI choices (disabled options / read-only views), rather than runtime crashes.

Range data is organized by format/stack under `src/lib/data/{format}/{stack}/`.
Current baseline data lives in:

- `src/lib/data/cash6max/100/rfi.ts`
- `src/lib/data/cash6max/100/facingOpen.ts`
- `src/lib/data/cash6max/100/threeBet.ts`
- registered via `src/lib/data/catalog.ts`

### Adding a new format (e.g. MTT) with minimal core changes

1. Add stack folder(s): `src/lib/data/<newFormat>/<stack>/...` with `rfi`, `facingOpen`, and `threeBet` exports.
2. Register those bundles in `src/lib/data/catalog.ts`.
3. Ensure the format/stack IDs are present in `src/lib/constants.ts`.

That workflow is intentionally “**add data + register format/stack**” instead of rewriting resolver logic.


## Architecture (current)

- `src/features/*` contains page-level UI by feature:
  - `src/features/drill/DrillPage.tsx`
  - `src/features/ranges/RangesPage.tsx`
  - `src/features/stats/StatsPage.tsx`
  - `src/features/settings/SettingsPage.tsx`
- `src/domain/*` contains domain services and pure logic:
  - `src/domain/policy/*` for policy mapping/resolution
  - `src/domain/presets/applyPreset.ts` for preset application flows (`applyPresetToAllRanges`, `applyPresetToSpot`)
  - `src/domain/storage/*` for default data and key builders
- `src/lib/*` contains shared types, constants, parser, and static data catalogs.

### Where to add future drill/policy data

1. Add new policy data files under `src/lib/data/<format>/<stack>/` (for example `rfi.ts`, `facingOpen.ts`, `threeBet.ts`, or future drill families).
2. Register the new dataset in `src/lib/data/catalog.ts` so resolvers/services can load it.
3. If a new drill family needs preset support, extend `src/domain/presets/applyPreset.ts` and wire the UI action in the relevant feature page.

## Persistence and migration

- Main app key: `poker_range_drill_v2`
- Session key: `poker_range_drill_session_v2`
- Legacy v1 data is migrated into the v2 schema (RFI ranges preserved; facing-open initialized).


## Mobile visual regression checklist

Run this quick pass after UI/theme changes at narrow widths (320px and 375px):

- Toggle **Settings → Theme** through `system`, `light`, and `dark`; verify text contrast is readable on cards, tabs, and buttons.
- On **Drill**, verify action buttons remain at least thumb-friendly height and status text stays readable.
- Trigger an incorrect answer and confirm the feedback 13x13 hand grid shows all 13 columns without horizontal clipping.
- On **Ranges**, verify the 13x13 grid fully fits the content area, including the final column, in both RFI and Facing Open modes.
- Confirm tabs are still fully visible and active state is distinct in dark mode.

## Local development

```bash
npm install
npm run dev
npm run build
```

Open `http://localhost:5173`.
