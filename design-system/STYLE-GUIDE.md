# DART Accident Reporting — Style Guide

**One file to match the look.** Hand this to a developer *or* paste it into an AI coding agent
(GitHub Copilot, Cursor, etc.). It contains the exact tokens, classes, rules, and copy‑paste
examples needed to reproduce the prototype's styling. Every value here is pulled from the real
stylesheet — `dart-design-system.css` — so it does not drift from what ships.

- 🎨 **See it live:** open `design-system/index.html` in a browser.
- 📦 **The stylesheet:** `src/styles/dart-design-system.css` (pure CSS, no framework required).

---

## 0. For the AI agent reading this

You are matching an existing design system. Follow these rules in order:

1. **Prefer the ready-made classes.** Almost every UI element already has a `.dart-*` class that
   encodes the correct color, radius, shadow, and states. Use the class. Do **not** re-derive styles
   with raw hex values when a class exists.
2. **The fastest correct path** is to copy `dart-design-system.css` into the project and load the two
   fonts (Section 1). Then use the classes in Sections 4–6.
3. **If you cannot use the stylesheet**, reproduce a component from the exact CSS recipe given under it.
4. **Obey the Laws in Section 3** — they are non‑negotiable. The most important: blue/navy means *only*
   primary action, focus, or selected — never decoration.
5. **When unsure, copy an example verbatim** from Section 5 and change only the content.

> **Tip:** To make Copilot apply this automatically in a repo, save this file as
> `.github/copilot-instructions.md` (or `.github/instructions/dart-styles.instructions.md` with
> `applyTo: "**/*.{tsx,ts,css}"`). Copilot then loads it as context on every request in that repo.

---

## 1. Setup (do this once)

**Load two fonts**, then the stylesheet. No Tailwind is required — the classes are plain CSS.

```html
<!-- Poppins (UI font) + Material Symbols Rounded (all icons) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0&display=swap" />

<!-- The design system -->
<link rel="stylesheet" href="dart-design-system.css" />
```

In **Next.js**, load Poppins via `next/font/google` and add the Material Symbols `<link>` in the root
layout `<head>`. In `app/globals.css`, import Tailwind **first**, then this repo's `globals.css`
(which pulls in `dart-design-system.css` and registers the Tailwind token classes). Import Tailwind
only once in the whole app.

Icons render as: `<span class="material-symbols-rounded">directions_bus</span>` (any Material Symbols name).

---

## 2. Design tokens (the raw values)

These live in `:root`. Use a **class** where one exists; use these tokens only when building something new.

### Color

| Token | Value | Use |
|---|---|---|
| `--dart-brand-navy` | `#00205B` | Primary action, **selected**, key headings |
| `--dart-brand-blue` | `#0078AE` | Primary action fill (buttons) |
| `--dart-accent-blue` | `#007DBA` | Links, icons, stat numbers, highlights. **A different color from `--dart-brand-blue` — both are required; do not merge them.** |
| `--dart-brand-teal` | `#00A4B5` | Supporting glow, used sparingly |
| `--dart-focus-yellow` | `#FFCD00` | Focus rings (ADA) |
| `--dart-brand-gray` | `#A7A8AA` | Neutral brand gray |
| `--color-text-strong` | `#0F172A` | Values, key text |
| `--color-text-default` | `#334155` | Body |
| `--color-text-muted` | `#64748B` | Helpers, placeholders, metadata |
| `--color-label` | `#475569` | Field labels (older layer) |
| `--dart-surface-soft` | `#F5F7FB` | Tinted floor under cards |
| `--dart-surface-muted` | `#EEF3F7` | One step back |
| `--color-selected-bg` | `#EAF1F8` | Selected surface tint |

**Control/field system** (what the input & toggle classes actually use):

| Token | Value | Use |
|---|---|---|
| `--ctl-navy` | `#112458` | Control selection fill |
| `--ctl-navy-gradient` | `linear-gradient(135deg, #1c3570, #112458)` | Selected toggle / mode tile |
| `--ctl-accent` | `#6C1B7E` | Required asterisk **only** |
| `--ctl-ink` | `#0f2d4a` | Text inside fields |
| `--ctl-label` | `#33485f` | Field label text |
| `--ctl-field-border` | `#dbe4ee` | Input/field border (rest) |
| `--ctl-field-border-hover` | `#b7cadd` | Input/field border (hover) |
| `--color-primary-bg` | `#0078AE` | Primary button fill |
| `--color-primary-bg-hover` | `#006491` | Primary button hover |
| `--color-focus-border` | `#00205B` | Focus border |
| `--color-focus-ring` | `rgba(0,32,91,0.16)` | Focus ring |

**Semantic** (Tailwind palette, used for state — not brand): success `emerald-500/600`,
warning `amber-`, error `red-400` border / `red-600` text, info `blue-500`.

### Tailwind classes for the tokens

`globals.css` registers the tokens with Tailwind, so you can write `bg-dart-navy` instead of
`bg-[#00205B]`. Opacity modifiers work (`bg-dart-accent-blue/10`). **In new or edited code, use these —
never a raw hex value.** Existing screens still contain hardcoded hex; leave them unless you are
already editing that line.

| Token | Tailwind name (use with `bg-`, `text-`, `border-`, `ring-`, …) |
|---|---|
| `--dart-brand-navy` `#00205B` | `dart-navy` |
| `--dart-brand-blue` `#0078AE` | `dart-blue` (hover: `dart-blue-hover`) |
| `--dart-accent-blue` `#007DBA` | `dart-accent-blue` |
| `--dart-brand-teal` `#00A4B5` | `dart-teal` |
| `--dart-brand-gray` `#A7A8AA` | `dart-gray` |
| `--dart-focus-yellow` `#FFCD00` | `dart-focus` (e.g. `focus:ring-dart-focus`) |
| `--ctl-navy` `#112458` | `dart-control-navy` |
| `--ctl-accent` `#6C1B7E` | `dart-required` |
| `--dart-surface-soft` / `-muted` | `dart-surface-soft` / `dart-surface-muted` |
| `--color-selected-bg` | `dart-selected` |
| `--color-text-strong` / `-default` / `-muted` | `dart-text-strong` / `dart-text` / `dart-text-muted` |
| `--dart-elevation-1/2/3/brand` | `shadow-dart-1` / `shadow-dart-2` / `shadow-dart-3` / `shadow-dart-brand` |

shadcn/ui components (`ui/`) use `primary`, which is mapped to `--dart-brand-blue`.

### Elevation, spacing, motion

```css
--dart-elevation-1: 0 2px 6px -2px rgba(15,23,42,.08), 0 1px 2px -1px rgba(15,23,42,.06); /* work cards */
--dart-elevation-2: 0 12px 28px -14px rgba(15,23,42,.18), 0 4px 10px -4px rgba(15,23,42,.08); /* sticky panels */
--dart-elevation-3: 0 28px 56px -24px rgba(15,23,42,.38), 0 12px 24px -10px rgba(15,23,42,.16); /* overlays */
--dart-elevation-brand: 0 14px 32px -14px rgba(0,32,91,.32), 0 4px 12px -4px rgba(0,32,91,.12); /* focused CTA */

--dart-space-sm: 0.75rem; /* 12px */   --dart-space-md: 1.25rem; /* 20px */   --dart-space-lg: 2rem; /* 32px */

--dart-motion-fast: 120ms cubic-bezier(.4,0,.2,1);
--dart-motion-base: 180ms cubic-bezier(.4,0,.2,1);
```

**Radius:** buttons `10px` · inputs/controls `11px` · cards `1rem` · hero/primary cards `1.25rem`.
**Font:** Poppins everywhere (`--font-sans`).

---

## 3. The Laws (non‑negotiable)

1. **Blue & navy mean only primary action, focus, or selected — never decoration.** If it isn't one
   of those three, it is not blue.
2. **Headings are Title Case.** Enforced in CSS (`text-transform: capitalize` on `h1`–`h6`). Source
   strings in non‑heading tags (steppers, pills) must be written Title Case.
3. **Required asterisk uses `--ctl-accent` (`#6C1B7E`) via `.dart-req` — used sparingly, nowhere else.**
4. **The Pairing Rule (kills wireframe feel):** a compact control (toggle, date, dropdown) **pairs
   horizontally** with another short field; a long field (textarea/narrative) **spans the full row**.
   Never leave a compact control alone on a full‑width band with dead air beside it. Never mix a
   compact control and a wide field in the same grid row.
5. **Read‑only data is never a fake disabled input.** Render it as a label + value on a surface
   (see `.dart-vehicle-strip`), or use `.dart-input-locked` for a source‑pulled value.
6. **Depth is subtle and layered — never a hard drop shadow.** Use the elevation tokens.
7. **Every interactive element has rest → hover → focus‑visible → active/selected.** No dead controls.
   Transitions are calm (120–180ms), never bouncy.
8. **Cards float on a tinted floor.** Put white cards on `#F6F8FB` / `--dart-surface-soft`, not on
   white — white‑on‑white kills depth.

---

## 4. Class reference (what to reach for)

| You want… | Use | Notes |
|---|---|---|
| Page background with depth | `dart-canvas` | On the full‑page root (`min-h-screen`) |
| Page title (28px) | `dart-h1` | Also `dart-h2` 22px, `dart-h3` 16px, `dart-h4` 14px — all navy/600 |
| Section kicker | `dart-eyebrow` | 11px uppercase, muted |
| Field label | `dart-field-label` | 12.5px/600, Title Case, above every input |
| Body / caption text | `dart-body` / `dart-caption` | 14px / 12px |
| IDs, dates, money line up | `dart-tabular` | Tabular figures — add to any number text |
| Required marker | `dart-req` | `<span class="dart-req">*</span>` |
| Text input / textarea | `dart-input-base` | 44px min height. Compact 40px = `dart-input-compact` |
| Read‑only source value | `dart-input-locked` | Blue‑tinted, on top of `dart-input-base` |
| Yes/No & 2–4 short options | `dart-seg` + `dart-seg-btn` (+ `dart-seg-btn--on`) | The signature control. Content‑sized, never full‑width |
| Pivotal icon choice (vehicle mode) | `dart-mode-card` (+ `--on`) | With `dart-mode-tile` / `dart-mode-badge` |
| Primary / secondary / ghost button | `dart-btn dart-btn--primary` / `--secondary` / `--ghost` | Canonical button |
| Card | `dart-card` + a variant | `--surface` (default work), `--primary` (focal), `--floating` (reveal glow), `--reference` (flat read‑only), `--alert-warn/-info/-danger` |
| Card header / body | `dart-card-header` / `dart-card-body` | Inside a `dart-card` |
| Read‑only data row | `dart-vehicle-strip` + `dart-vehicle-item` | Labelled values with icon tiles |
| Shadow utility | `dart-elev-1/2/3/brand` | Apply elevation directly |
| Press feedback | `dart-press` | Scales to 0.985 on `:active` |
| Text link | `dart-action-link` | Blue → navy on hover |

---

## 5. Copy‑paste examples

> React/JSX shown (target is Next.js). The **same classes work in plain HTML** — just use `class=`.

### Field with label, required marker, helper

```tsx
<div>
  <label className="dart-field-label">Employee Badge Number <span className="dart-req">*</span></label>
  <input className="dart-input-base" placeholder="e.g. 90001" />
  <p className="mt-1.5 text-xs text-slate-500">Six digits, printed on the badge.</p>
</div>
```

**Error state** (this app applies it with a wrapper ring, via the shared `FormField` component):

```tsx
<div className="rounded-[11px] ring-2 ring-red-400/70">
  <input className="dart-input-base" />
</div>
<p className="mt-1.5 text-xs font-medium text-red-600">Employee Badge Number is required.</p>
```

### Segmented Yes/No toggle (the signature control)

```tsx
<div className="dart-seg" role="group">
  <button type="button" className="dart-seg-btn dart-seg-btn--on">Yes</button>
  <button type="button" className="dart-seg-btn">No</button>
</div>
```

Selected segment gets `dart-seg-btn--on` (navy gradient + white text). Keep the track **content‑sized**
— never stretch it full‑width.

### Selection card (vehicle mode)

```tsx
<button type="button" className="dart-mode-card dart-mode-card--on">
  <span className="dart-mode-badge"><span className="material-symbols-rounded">check</span></span>
  <span className="dart-mode-tile dart-mode-tile--on"><span className="material-symbols-rounded">directions_bus</span></span>
  <span className="dart-mode-title">Bus</span>
</button>
```

Selected = add `--on` to the card **and** `dart-mode-tile--on` to the tile; show the badge.

### Buttons

```tsx
<button className="dart-btn dart-btn--primary">Continue</button>
<button className="dart-btn dart-btn--secondary">Save as draft</button>
<button className="dart-btn dart-btn--ghost">View more</button>
```

### Section card on the tinted floor

```tsx
<div className="dart-canvas min-h-screen">
  <div className="mx-auto max-w-[1600px] p-6">
    <div className="dart-card dart-card--surface p-6">
      <p className="dart-eyebrow">Incident Basics</p>
      <h2 className="dart-h3">Type Of Event</h2>
      {/* fields… */}
    </div>
  </div>
</div>
```

### Read‑only data strip (source‑pulled values)

```tsx
<div className="dart-vehicle-strip">
  <div className="dart-vehicle-item">
    <span className="dart-vehicle-icon"><span className="material-symbols-rounded">route</span></span>
    <span className="dart-vehicle-text">
      <span className="dart-vehicle-label">Route</span>
      <span className="dart-vehicle-value dart-tabular">019</span>
    </span>
  </div>
  {/* repeat .dart-vehicle-item per value */}
</div>
```

---

## 6. Layout & rhythm

- **Container:** `max-w-[1600px]` sitewide (header, content, footer aligned).
- **Field gaps:** ~20px vertical between fields; ~24px horizontal between paired columns.
- **Grids for short fields:** `md:grid-cols-2 xl:grid-cols-3` (3‑up only when ≥3 short fields). Natural
  pairs (date/time, before/after) stay 2‑up. Four tight fields (street/cross/city/zip) → `xl:grid-cols-4`.
- **Textareas / narratives:** full row (`col-span` full). See the Pairing Rule (Law 4).
- **Group related fields** onto a sub‑surface panel with an `dart-eyebrow` label, so the form reads as
  composed sections, not a flat wall.

---

## 7. Exact CSS recipes (if you can't use the stylesheet)

**Text input — `.dart-input-base`**
```css
width: 100%; min-height: 44px; padding: 12px 14px;
border: 1.5px solid #dbe4ee; border-radius: 11px; background: #fff;
color: #0f2d4a; font: 500 14.5px/1.4 'Poppins', sans-serif;
box-shadow: 0 1px 2px rgba(15,45,74,.04);
transition: border-color .18s, box-shadow .18s, background-color .18s, transform .18s;
/* hover  */ border-color: #b7cadd; box-shadow: 0 2px 7px rgba(15,45,74,.08);
/* focus  */ border-color: #112458; box-shadow: 0 0 0 3px rgba(17,36,88,.15), 0 8px 20px -6px rgba(17,36,88,.24); transform: translateY(-1px);
```

**Segmented toggle — `.dart-seg` / `.dart-seg-btn`**
```css
.dart-seg { display:inline-grid; grid-auto-flow:column; grid-auto-columns:1fr; gap:6px; padding:5px;
  border-radius:13px; background:#eef3f8; border:1.5px solid #e3eaf2; box-shadow: inset 0 1px 2px rgba(15,45,74,.05); }
.dart-seg-btn { padding:11px 14px; border-radius:9px; border:1.5px solid transparent; background:transparent;
  color:#5c7085; font:600 14px 'Poppins',sans-serif; cursor:pointer; }
.dart-seg-btn--on { background:linear-gradient(135deg,#1c3570,#112458); color:#fff;
  box-shadow:0 8px 16px -6px rgba(17,36,88,.5), inset 0 1px 0 rgba(255,255,255,.2); }
```

**Primary button — `.dart-btn--primary`**
```css
display:inline-flex; align-items:center; justify-content:center; gap:.5rem; min-height:44px;
padding:.75rem 1.5rem; border-radius:10px; border:1.5px solid #0078AE; background:#0078AE;
color:#fff; font:600 14px 'Poppins',sans-serif; cursor:pointer;
box-shadow:0 1px 2px rgba(15,23,42,.12);
/* hover */ background:#006491; border-color:#006491;
/* active */ transform:scale(.98);
```

**Work card — `.dart-card.dart-card--surface`**
```css
background:linear-gradient(180deg,#fff 0%,#FBFDFF 100%); border:1px solid #E2E8F0; border-radius:1rem;
box-shadow: 0 1px 2px rgba(15,23,42,.05), 0 10px 28px -14px rgba(15,23,42,.22), inset 0 1px 0 rgba(255,255,255,.85);
```

**Ambient canvas — `.dart-canvas`**
```css
background-color:#E7EDF5;
background-image:
  radial-gradient(1150px 620px at 8% -6%, rgba(0,120,174,.10), transparent 60%),
  radial-gradient(1000px 560px at 102% 2%, rgba(0,32,91,.075), transparent 55%),
  radial-gradient(1200px 900px at 50% 118%, rgba(0,164,181,.06), transparent 62%);
background-attachment:fixed;
```

> For anything not listed here, open `src/styles/dart-design-system.css` — it is the complete,
> authoritative source, and `design-system/index.html` renders every class live.
