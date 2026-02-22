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

## Persistence and migration

- Main app key: `poker_range_drill_v2`
- Session key: `poker_range_drill_session_v2`
- Legacy v1 data is migrated into the v2 schema (RFI ranges preserved; facing-open initialized).

## Local development

```bash
npm install
npm run dev
npm run build
```

Open `http://localhost:5173`.
