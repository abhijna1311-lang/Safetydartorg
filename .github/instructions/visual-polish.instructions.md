---
description: "Anti-wireframe visual polish rules for the DART Accident Reporting app. Adapted from taste-skill (redesign + high-end/minimalist), tuned for a calm, trustworthy safety tool — NOT a flashy marketing site."
applyTo: "src/**/*.{tsx,ts,css}"
---

# Visual polish — DART safety app

This is a **safety-critical, data-entry workflow tool** used by transit operators,
supervisors, and program managers — often after a long shift. Polish means
**calm depth, clear hierarchy, and confident restraint**. It does NOT mean
marketing-site theatrics.

## Design direction: premium-calm, not flashy
- Reach for the **soft / minimalist** end of taste (Linear / Notion / high-end SaaS),
  never brutalist, never high-variance, never scroll-jacking.
- **Do NOT add**: parallax, magnetic hover, GSAP scroll animations, broken/asymmetric
  grids, elements bleeding off-screen, grain that looks dirty, or motion that competes
  with the task. These erode trust in a safety tool.
- One accent family only. Blue/navy communicates **primary action, focus, selected** —
  nothing else. Teal (`#00A4B5`) is a supporting glow, used sparingly.

## Use the existing system — never invent tokens
The app already has a mature system in `src/styles/globals.css`. Always reuse it:
- **Canvas**: `.dart-canvas` for full-page backgrounds (ambient, not flat). Never leave a
  screen on flat `bg-white` or a single solid `bg-[#F5F7FB]` — that reads as wireframe.
- **Cards**: `.dart-card` + one modifier (`--surface`, `--primary`, `--floating`,
  `--reference`, alert variants). Cards exist only when elevation communicates hierarchy.
- **Typography**: `.dart-h1`–`.dart-h4`, `.dart-eyebrow`, `.dart-body`, `.dart-caption`.
- **Elevation**: `.dart-elev-1/2/3/brand` — apply depth intentionally, not everywhere.
- **Motion**: `--dart-motion-fast/base`; `.dart-press` for tactile click feedback.
- **Spacing**: prefer `--dart-space-sm/md/lg`.

## The anti-wireframe checklist (what makes it feel unfinished)
When a screen feels like a wireframe, it is usually missing these. Fix in this order:

1. **Flat canvas** → apply `.dart-canvas` (soft layered gradient) at the page root.
2. **Shivering numbers** → wrap IDs, dates, counts, money in `.dart-tabular`
   (tabular figures) so data columns stay aligned and stop jittering.
3. **Dead surfaces** → white cards with no light source. Use `--surface`/`--primary`
   modifiers which carry an inner top highlight + navy-tinted shadow.
4. **No press feedback** → interactive rows/buttons/cards need `.dart-press` and a
   hover shift (background, border, or shadow — pick one, not all three).
5. **Missing focus rings** → every interactive element needs a visible
   `:focus-visible` ring (`.dart-focus-ring`). Accessibility, not optional.
6. **Orphaned words / ragged headings** → the type scale already applies
   `text-wrap: balance` (headings) and `pretty` (body). Keep using those classes.
7. **Flat inputs** → use `.dart-input-base` / `.dart-input-compact`; they carry a
   subtle inner depth and a proper focus ring.
8. **Missing states** → provide real empty, loading (skeleton, not spinner), and inline
   error states. Never `window.alert()`.

## Copy discipline (trust through detail)
- Sentence case for headings. `MM/DD/YYYY` for dates.
- No exclamation marks in success messages. Be confident, not loud.
- No "Oops!" — be direct: "Connection failed. Please try again."
- No AI clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Delve".
- Never use `—` (em dash) in UI copy; use a period or restructure.

## Rules of engagement
- Work with the existing stack (React + Tailwind v4 + the `dart-*` CSS system). No new
  UI libraries, no framework changes.
- Small, reversible, reviewable changes. Do not rewrite screens from scratch.
- The builder is the taste gate. When a change alters *feel* (not just correctness),
  show it and let her react before rolling it across every screen.
