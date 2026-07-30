# DART Accident Reporting — Design System Spec

> ⚠️ **For exact, current values use [`design-system/STYLE-GUIDE.md`](../design-system/STYLE-GUIDE.md)**
> (developer + AI‑agent reference) and the live gallery `design-system/index.html`. Both read from the
> real stylesheet `src/styles/dart-design-system.css`. This document is the *rationale / vibe* spec and
> may lag the code on specific numbers — trust the STYLE‑GUIDE when they disagree.

> **Purpose:** One source of truth for how this app looks and feels, so the vibe is defined
> **once** and applied **everywhere** — instead of screen-by-screen fixes.
> **Status:** DRAFT v1 — Abhi to tear apart. Nothing here is precious; correct it and it becomes law.

---

## 0. The vibe (read this first)

A calm, trustworthy safety tool that feels as considered as the workflow behind it. Think
**Linear / Notion / Stripe dashboard** — not a marketing site, not a government form.

Four words that decide every call:
- **Calm** — nothing shouts. Restraint over decoration.
- **Confident** — clear hierarchy; the interface already did the thinking, so the choice feels easy.
- **Tactile** — controls have depth and respond to touch (hover, press, focus).
- **Rhythmic** — consistent sizing and spacing; everything sits on a shared grid.

> Reference apps whose *feel* we're matching: **[Abhi to fill: e.g. Linear, Vercel dashboard, Stripe]**

If a change doesn't serve one of those four words, it doesn't ship.

---

## 1. Foundations (tokens)

### Color
| Role | Value | Use |
|---|---|---|
| Brand navy | `#00205B` | Primary actions, **selected** state, key headings |
| Brand blue | `#007DBA` / `#0078AE` | Links, accents, active nav underline |
| Focus | `rgba(0,32,91,0.16–0.28)` | Focus ring only |
| Surface | `#FFFFFF` | Cards, inputs |
| Sub-surface | `#F8FBFE` / `slate-50` | Grouped/reference panels (one step back from white) |
| Border (rest) | `#DBE3EC` | Input/card borders |
| Border (hover) | `#B8C4D3` | Input hover |
| Text primary | `#1E293B` (slate-800) | Values, body |
| Text label | `--color-label` (~slate-500/600) | Field labels |
| Text muted | `slate-400/500` | Helpers, placeholders, unselected |
| Success | `emerald-500/600` | Confirmations, "saved" |
| Warning | `amber-` | Holds, data-integrity flags |
| Error | `red-400` border / `red-600` text | Validation |

**Iron rule:** blue/navy = **only** primary action, focus, or selected. Never decorative.

### Type scale (hierarchy is the point)
| Token | Size / weight | Use |
|---|---|---|
| Page title | 28–32px / 600 | Screen H1 |
| Section title | 18–22px / 600 navy | Card/section heading |
| Eyebrow | 11px / 600 uppercase, tracking, muted | Section kicker ("YOUR PM INTAKE LOG") |
| Field label | 11px / 700, Title Case, `--color-label` | Above every input |
| Value / body | 14px / 400–500 slate-800 | Entered data, read-only echoes |
| Helper | 12px / 400 muted | Under-field hints |

Headings site-wide are **Title Case** (enforced via CSS `text-transform: capitalize` on h1–h6).

### Spacing & radius
- Baseline gaps: `gap-y-5` (20px) between fields, `gap-x-6` (24px) between paired columns.
- Section padding: `p-4`–`p-6`. Card radius: `rounded-2xl`. Input/control radius: `10px` (`0.625rem`).
- Content container: **`max-w-[1600px]`** sitewide (header, content, footer all aligned).

### Elevation (depth = subtle, layered — never a hard drop shadow)
| Level | Shadow | Use |
|---|---|---|
| Rest | `0 1px 2px rgba(15,23,42,0.05)` | Inputs, buttons at rest |
| Hover | `0 2px 8px -2px rgba(15,23,42,0.10)` | Input/card hover |
| Selected (navy) | `0 2px 8px -2px rgba(0,32,91,0.45)` | Selected segmented pill |
| Card float | `0 10px 28px -24px rgba(15,23,42,0.45)` | Reference/reveal panels |

---

## 2. Controls (exact specs)

### Text input / textarea (`.dart-input-base`)
- 1.5px border `#DBE3EC`, radius 10px, white, rest shadow (level Rest).
- **Hover:** border `#B8C4D3` + shadow level Hover.
- **Focus:** navy border + focus ring (`0 0 0 3px focus`) + rest shadow.
- **Error:** border `red-400`; message below in `red-600`, 12px.
- Min height 44px. Placeholder = muted.

### Segmented control (Yes/No, and any 2–4 short options) — THE signature control
- **Track:** `inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1`. Content-sized — **never `flex-1`/full-width.**
- **Item:** `px-5 py-2 rounded-lg text-sm`.
- **Selected:** `bg-[#00205B] text-white font-semibold` + selected shadow.
- **Unselected:** `text-slate-500 hover:text-slate-900 hover:bg-white/70`.
- Used for: operator availability, filing on-behalf, student, day-off, all PM/supervisor Yes/No.

### Dropdown (`CustomSelect`)
- Matches input styling (border, radius, shadow, hover, focus, error). Lock state shows a lock icon.
- Width = its content's row, **not** forced full-width unless it's the only field in the row.

### Selectable cards (Vehicle mode, mode/role pickers)
- Reserved for **pivotal, few-option, icon-worthy** choices only. Selected = navy fill, subtle glow, hover lift.

### Buttons
- **Primary:** navy/blue fill, white text (Initiate, Continue, Approve).
- **Secondary:** white, border, slate text (Save as draft).
- **Tertiary/link:** text-only blue (View more, Go to step).
- All: hover state + focus ring + `dart-press` on click.

### Read-only data
- **Never** an disabled-looking input. Render as **label + value text** on the sub-surface. (Depth via the panel, not a fake field.)

---

## 3. Layout & rhythm (the part that was missing)

### The pairing rule
> **Compact control → pair it. Long text → give it the row.**
- A segmented toggle, date, or dropdown is short → it **pairs horizontally** with the next short field (2-up, `sm:grid-cols-2`).
- A textarea/statement/narrative is long → it **spans the full row** (`col-span` full).
- Never leave a compact control alone on a full-width band with dead air beside it.

### Grid density
- Short-field groups: `md:grid-cols-2 xl:grid-cols-3` (3-up at wide) **only when there are ≥3 fields.**
- 2-field natural pairs (date/time, before/after) stay 2-up.
- 4 tight fields (street/cross/city/zip) → `xl:grid-cols-4`.
- Textareas: full row (`xl:col-span-3` inside a 3-col grid).

### Grouping / surfaces
- Related fields group onto a **sub-surface panel** (`bg-white/70` or `slate-50`, `rounded-lg`, `border`, `p-4`) with an **eyebrow** label — like the PM "Case context" and "Your PM intake log" panels. This creates layering so the form reads as composed sections, not a flat wall.

---

## 4. States & interaction

- Everything interactive has: **rest → hover → focus-visible → active/selected**. No dead controls.
- Transitions: `transition-all duration-200` (150–200ms). Calm, not bouncy.
- Validation: enable the action button; on click, surface a **top banner** + **red field outlines + inline messages**; errors clear live as fields fill. (No silently-disabled buttons.)
- Selected/answered groups may gain a faint tinted surface to show "done."

---

## 5. How we work now (process)

1. This doc is the spec. I build against it; you review the **system/flow**, not each field.
2. When something feels off, point to the **rule** it breaks (rhythm? hierarchy? state?) — faster than re-describing.
3. New patterns get added here first, then applied — so nothing drifts.

---

### Open questions for Abhi
1. Which 1–2 reference apps nail the *feel* you want? (fills the vibe section)
2. Segmented-selected: **navy fill** (current) or **white raised pill on navy text** (softer, more iOS)?
3. Availability toggle: keep it **compact** like the rest, or **emphasized** (bigger) because it changes the workflow?
