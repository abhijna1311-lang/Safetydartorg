# Plan — Step 2 section-card reskin (surface depth + completion-dot color)

> **Type:** Reskin only (presentation). **Do NOT change logic, state, props, handlers, conditionals, field wiring, or copy.**
> **Executor has no prior context — everything needed is in this file.**

---

## 1. Intent

On the operator **Step 2 (Vehicle & Location / Collision Information)** surface, the section
cards are flat, hardcoded white cards (`bg-white … shadow-sm`) — the "dead surface: white
card with no light source" anti-pattern the design instructions call out. Two changes, both
pure className swaps:

- **A.** Replace the hardcoded card wrapper with the design-system surface card
  (`dart-card dart-card--surface`), which carries real elevation + an inner top highlight.
- **B.** Normalize the section "complete" dot to emerald (success) everywhere on the surface;
  two sections use the reserved brand blue `#007DBA` for status, which violates
  "blue = only primary action / focus / selected" and contradicts the emerald used by the
  sibling sections on the same surface.

No behavior changes. The `complete`/`isComplete` logic, all handlers, and all fields stay exactly as-is.

---

## 2. Governing contract (re-verified)

- `.github/instructions/visual-polish.instructions.md` (active, `applyTo src/**`):
  - "Cards: `.dart-card` + one modifier (`--surface`, `--primary`, …)."
  - Anti-wireframe #3: "**Dead surfaces** → white cards with no light source. Use `--surface`/`--primary` modifiers which carry an inner top highlight + navy-tinted shadow."
  - "One accent family only. Blue/navy communicates **primary action, focus, selected** — nothing else."
- `guidelines/DESIGN-SYSTEM.md`: elevation is subtle/layered; **success = emerald-500/600**.
- Token definitions in `src/styles/globals.css`:
  - `.dart-card` (~L195): `background:#fff; border:1px solid #E2E8F0; border-radius:1rem;`
  - `.dart-card--surface` (~L202): gradient bg + `--dart-elevation-1` + `inset 0 1px 0 rgba(255,255,255,0.7)`.

`rounded-2xl` (1rem) and `border-slate-200` (#E2E8F0) already match `.dart-card`, so the swap
preserves geometry and only **adds** the light source. No new values are invented.

---

## 3. Reusable primitives (use these exactly — do not invent)

- Target card classes: **`dart-card dart-card--surface`** (already defined in globals.css).
- Target complete color: **`bg-emerald-500`** — the exemplar already used by
  `BusCollisionSection` (dot) and `LRVCollisionSection` (dot) on this same surface.

---

## 4. Traced surface (scope IN)

`AccidentReportWizard.tsx` (~L1141) renders `Step2VehicleLocation`, whose operator-completion
branch renders: `BusCollisionSection` **or** `LRVCollisionSection` (by mode) **or**
`BasicIncidentSection` (non-collision), plus `WeatherSection` (always).

### Change A — card surface (4 edits, className swap only)

In each file below, find the section-card wrapper `<div>` whose className is **exactly**:

```
bg-white rounded-2xl border border-slate-200 shadow-sm
```

and replace that className string with **exactly**:

```
dart-card dart-card--surface
```

| # | File | Line (approx) |
| --- | --- | --- |
| A1 | `src/app/components/steps/sections/BusCollisionSection.tsx` | 88 |
| A2 | `src/app/components/steps/sections/LRVCollisionSection.tsx` | 75 |
| A3 | `src/app/components/steps/sections/BasicIncidentSection.tsx` | 59 |
| A4 | `src/app/components/steps/sections/WeatherSection.tsx` | 57 |

Leave the inner header row (`flex items-center gap-3 px-6 py-4 border-b border-slate-100`) and
the body (`px-6 py-5 …`) untouched.

### Change B — completion dot color (2 edits, only the blue ones)

In the completion-dot `<div>`, replace **`bg-[#007DBA]`** with **`bg-emerald-500`**. The full
current expression is:

```
${<complete flag> ? 'bg-[#007DBA]' : 'bg-slate-300'}
```
→
```
${<complete flag> ? 'bg-emerald-500' : 'bg-slate-300'}
```

| # | File | Line (approx) | Complete flag (do not change) |
| --- | --- | --- | --- |
| B1 | `src/app/components/steps/sections/BasicIncidentSection.tsx` | 61 | `complete` |
| B2 | `src/app/components/steps/sections/WeatherSection.tsx` | 59 | `isComplete` |

**Do NOT touch** the dots in `BusCollisionSection` (L90) and `LRVCollisionSection` (L77) — they
already use `bg-emerald-500`.

---

## 5. Scope OUT — do not touch

- **Same pattern on other surfaces (Step 3 + intake):** `PoliceSection` (L26/L28),
  `PassengerInjurySection` (L35/L37), `PedestrianInjurySection` (L50/L52),
  `BusVehicleLocationSection` (L56/L58), and the Step 2 **initiation-stage** `IntakeCard`.
  These are outside the audited Step 2 operator surface. Do **not** change them here.
- **No logic:** do not alter any `onUpdate`/`onChange`, props, `complete`/`isComplete`
  computation, conditionals, `motion.div` animations, grid classes, `inputCls`, or copy.

---

## 6. Verification

1. `pnpm build` → expect `✓ built in Xs`, no `error TS`.
2. Grep must return **0** matches:
   - `bg-white rounded-2xl border border-slate-200 shadow-sm` within the four Step 2 files (A1–A4).
   - `bg-[#007DBA]` within `BasicIncidentSection.tsx` and `WeatherSection.tsx`.
3. Visual (Step 2): section cards show soft elevation + faint top highlight (not flat white);
   the "complete" dot is emerald on **every** Step 2 section.
4. Regression: the diff contains only className strings on the four card wrappers and the two
   dot expressions — no handler, prop, or conditional changes.

---

## 7. Documentation to record (for the executor / DESIGN-SYSTEM.md)

If `guidelines/DESIGN-SYSTEM.md` is treated as current law: note that wizard section cards use
`.dart-card--surface` and that a completed-section indicator is **emerald** (never brand blue),
so new sections follow suit.

---

## 8. Follow-up (NOT in this plan)

- **Consistency plan:** extend the identical card + dot reskin to the Step 3 sections
  (`PoliceSection`, `PassengerInjurySection`, `PedestrianInjurySection`) and
  `BusVehicleLocationSection`, so the whole wizard reads the same. Recommended next, but
  requires its own scoped approval.
- **Optional refactor (structure, not reskin):** the local `Card` header markup is duplicated
  across ~8 section files; consolidating into one shared primitive would prevent future drift.
  Out of scope for a reskin.
