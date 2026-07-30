# Developer Handoff — DART Accident Reporting

This repo is a **high-fidelity prototype** of the DART Accident Reporting flow. The design
system, styling, and interactions are real and ready to reuse — you should **not** rebuild the
look from scratch. Your job is to stand it up in **Next.js** and wire the real backend.

## The golden rule

- **The Vercel link is the living spec.** It redeploys on every push, so it is *always current*.
  Build to match what you see there.
- **This repo is the reference implementation.** The exact colors, components, and interactions
  are already coded here — copy them, don't re-derive them.
- **`design-system/index.html` is the visual contract for the CSS.** Open it in any browser to see
  every token and component rendered from the real stylesheet, and copy a class name straight from
  the page. It always matches the code because it loads the same file the app does.

## Do this first: get the styling foundation in place

The visual layer is **stable** and will not keep changing. Set it up once, and every later screen
change becomes "drop content into an already-styled shell" — you never re-style. Order matters:

**1. Scaffold Next.js (App Router + TypeScript + Tailwind v4).**
```
npx create-next-app@latest   # App Router: yes · TypeScript: yes · Tailwind: yes
```
> ⚠️ This project uses **Tailwind v4** (CSS-based config, no `tailwind.config.js`). Make sure the
> scaffold is v4, not v3 — the tokens and utility classes below assume v4.

**2. Bring the global stylesheet over — the whole thing, not just the colors.**
The app's look is **not only** CSS variables. It's a layer of load-bearing custom classes
(`.dart-card`, `.dart-input-base`, `.dart-canvas`, `.dart-seg`, `.dart-mode-card`,
`.dart-vehicle-strip`, `.dart-btn`, …) that the components depend on. The whole design system now
lives in **one framework-agnostic file** — copy it as-is:

| Source (this repo) | What it is |
|---|---|
| `src/styles/dart-design-system.css` | **The design system — the one file that matters most.** All `--dart-*` / `--ctl-*` tokens + every `.dart-*` class + the `.dart-btn` buttons. Pure CSS, no Tailwind required — works in Next.js, Vite, or a plain `.html`. |
| `src/styles/globals.css` | Thin Tailwind glue: imports the design system + registers the `font-sans` utility. Keep it if you use Tailwind; otherwise you can skip it and load `dart-design-system.css` directly. |
| `src/styles/default_theme.css` | shadcn/ui base theme variables |
| `src/styles/fonts.css` | Poppins `@import` |
| `tw-animate-css` | animation utilities (npm install it) |

> **Edit tokens & `.dart-*` classes only in `dart-design-system.css`** — it is the single source of
> truth, so the prototype and your copy can never silently drift apart.

**3. Load the fonts.** Two families:
- **Poppins** (UI font) — use `next/font/google` in `app/layout.tsx` (idiomatic), or keep the
  Google Fonts `@import`.
- **Material Symbols Rounded** (all icons render via this) — add the stylesheet `<link>` in the
  root layout `<head>` (see `index.html` for the exact URL with `FILL,GRAD@24,400,1,0`).

**4. Copy the component library.** Everything in `src/app/components/ui/` is **standard shadcn/ui**
on Radix — the same primitives Next.js expects. Copy the folder verbatim (plus `ui/utils.ts`, the
`cn()` helper). See the Next.js gotchas below for the one required change.

**5. Copy the feature screens as they stabilize** (`src/app/components/*`). These consume the
`ui/` primitives + `.dart-*` classes, so once steps 2–4 are done they look correct immediately.

## Where the styling lives (the map)

| You want… | Look here |
|---|---|
| See every token & component live | **`design-system/index.html`** — open in a browser |
| Copy exact styles (dev) or feed an AI agent to match the look | **`design-system/STYLE-GUIDE.md`** |
| Colors, spacing, shadows, motion tokens | `src/styles/dart-design-system.css` → `:root` (`--dart-*`, `--ctl-*`) |
| Card / input / toggle / button / canvas styles | `src/styles/dart-design-system.css` → the `.dart-*` classes |
| Buttons, dialogs, selects, etc. | `src/app/components/ui/` (shadcn/ui) |
| The design rules & rationale | `guidelines/DESIGN-SYSTEM.md`, `COMPONENTS.md`, `INTERACTIONS.md` |
| Validation rules & required-field UX | `guidelines/VALIDATION.md` |
| Data shapes | `guidelines/DATA-MODELS.md`, `src/app/types/` |

## Next.js gotchas (the only real friction)

- **`"use client"`** — this is a Vite app, so no file has it yet. In the App Router, any component
  that uses hooks, state, `motion`/framer, or Radix interactivity must start with `"use client"`.
  That's most of `ui/` and all interactive screens. Add it at the top when you port each file.
- **`figma:asset/` import** — one file (`DARTHeader.tsx`) imports the DART logo via a custom Vite
  resolver: `import dartLogo from 'figma:asset/….png'`. Move that PNG (in `src/assets/`) into
  `public/` and swap to a normal path/`next/image`. This scheme won't resolve in Next.
- **Navigation is state-driven, not URL-routed.** Screens are switched by state in
  `src/app/App.tsx` (react-router is a dependency but the flow is a state machine). Fastest path:
  render the existing screen-switcher inside one client page so it works day one; refactor into
  App Router routes later if you want real URLs per step.
- **Workflow actions are client-side stubs.** Handlers that would POST to a workflow engine are
  marked with `TODO` and currently mutate local state. Wire these to the real API — that's the
  intended backend seam, not a bug.

## Working with an evolving prototype

The designer is **still iterating** while you build. That's fine — here's how to avoid rework:

- **The foundation (tokens + `ui/` + `globals.css`) is frozen.** Set it up once; it won't churn.
- **What changes is screen layout, copy, and flow logic** — never the color system or components.
  So changes land as "this field moved / this section restructured," which you drop into the
  already-styled shell.
- **Build against the Vercel link, not a snapshot.** It's always current. When a screen changes,
  diff the link + `git pull` to see exactly what moved.
- **Changes arrive in batched, named drops** (e.g. "Design update, Jul 30: Step 3 people list
  restructured") so you port in chunks, not chasing hourly edits.
- **Screens still in heavy flux** (e.g. the multi-role review workflow) will be flagged — build
  those last so you don't port a half-finished flow twice.

## Run the prototype locally

```
pnpm install
pnpm dev      # local prototype
pnpm build    # production build (Vite)
```
> Note: `pnpm build` prints a chunk-size warning to stderr; it's harmless. Look for `✓ built in`.
