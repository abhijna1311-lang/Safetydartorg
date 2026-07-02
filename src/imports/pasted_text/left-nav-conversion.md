# Task: Convert primary navigation from top nav to left side navigation

## Goal

Update the Accident Reporting application so the primary navigation appears as a left side navigation instead of the horizontal top nav. Keep the existing top glass header for DART branding, notifications, and user profile.

Do not add Smart Assist to the navigation at this time.

---

## 1. Preserve the top glass header

Keep the current top header exactly as the app identity and utility bar.

Header should continue to include:

1. DART logo
2. “DART Accident Reporting”
3. Notification bell with badge
4. User profile pill with avatar, name, and role

Remove the current horizontal navigation items from below or inside the header:

1. Home
2. New Accident Report
3. My Drafts
4. My Submissions

The header should remain clean, calm, and aligned with the liquid glass style already used in the application.

---

## 2. Create a left navigation rail

Create a new component named:

`AppShell / Left Navigation`

Desktop width:

1. Expanded width: `240 px`
2. Optional collapsed width for future use: `72 px`
3. Position: left side of the main content area, below the top header
4. Height: full remaining viewport height

Visual style:

1. Background: glass white surface matching the top header
2. Fill: `rgba(255, 255, 255, 0.78)`
3. Stroke: `1 px #D8E4F6` at `55%` opacity
4. Background blur: `18 px` to `22 px`
5. Shadow: `0 12 32 rgba(10, 31, 68, 0.08)`
6. Border radius: `20 px` on desktop if the nav floats inside the page margin
7. If fixed to the edge, use `0 px` radius on the left edge and `20 px` radius on the right edge

---

## 3. Navigation items

Use this exact nav order:

1. Home
2. New Accident Report
3. My Drafts
4. My Submissions

Do not add Smart Assist.

Each navigation item should include:

1. Icon on the left
2. Label text
3. Optional count badge only if the data already exists

Suggested icons:

1. Home: dashboard or home icon
2. New Accident Report: document plus icon
3. My Drafts: clock or draft document icon
4. My Submissions: check circle or submitted document icon

---

## 4. Nav item states

### Default state

1. Text color: `#0B2E63`
2. Icon color: `#46607F`
3. Background: transparent

### Hover state

1. Background: `rgba(0, 113, 188, 0.08)`
2. Text color: `#003B73`
3. Icon color: `#0072B8`

### Active state

1. Background: soft blue tint
   1. `rgba(0, 113, 188, 0.12)`
   2. `rgba(0, 70, 140, 0.08)`
2. Text color: `#002B5C`
3. Icon color: `#0072B8`
4. Add a subtle `3 px` vertical active indicator on the left side of the nav item
   1. Color: `#0072B8`
   2. Radius: `999 px`
5. Do not use an underline for the left navigation active state

---

## 5. App shell layout

Create an `AppShell` layout with three main areas:

1. Top header
2. Left navigation
3. Main content

Desktop layout:

1. Top header spans the available page width
2. Left nav sits below the header
3. Main content sits to the right of the left nav
4. Gap between left nav and main content: `24 px`
5. Main content should use the remaining available width

Suggested desktop spacing:

1. Page padding: `32 px`
2. Left nav width: `240 px`
3. Main content: fill remaining space
4. Gap between nav and content: `24 px`

Do not let the left nav make dashboard content feel cramped. Let the dashboard, forms, tables, and cards expand naturally inside the remaining space.

---

## 6. Main content adjustment

After moving navigation to the left:

1. Remove the old horizontal nav row completely
2. Move page content up so there is no empty gap where the horizontal nav used to be
3. Align the top of the main content with the top of the left nav
4. Keep existing content hierarchy and layout unless spacing needs minor adjustment

Preserve the existing dashboard sections:

1. Welcome message
2. Report a New Accident Event hero card
3. Metrics cards
4. Needs your attention
5. Continue where you left off
6. Recent submissions

Do not redesign these sections as part of this task.

---

## 7. Mobile and tablet behavior

### Tablet

At medium width:

1. Collapse the left nav to an icon only rail at `72 px` if needed
2. Keep active state visible with icon color and vertical indicator
3. Show labels only if there is enough width

### Mobile

Do not use a permanent left sidebar on mobile.

Use a hamburger menu in the top header that opens the left navigation as a slide in drawer.

Mobile drawer behavior:

1. Drawer opens from the left
2. Width: `300 px` or `85%` of screen width
3. Uses the same nav item styling as desktop
4. Includes close button
5. Closes when user selects a nav item
6. Closes when user taps outside the drawer
7. Closes on Escape key

Do not use bottom navigation for this app because form screens may also need sticky bottom actions.

---

## 8. Accessibility

1. Each nav item must be keyboard focusable
2. Active nav item should use `aria-current="page"` in implementation notes
3. Collapsed icons need accessible labels
4. Mobile drawer must trap focus while open
5. Active state should not rely on color alone
6. Keep the left active indicator and bold label for active state clarity

---

## 9. Acceptance criteria

1. Top header remains the DART identity and utility bar
2. Horizontal top nav is removed
3. Left navigation includes only:
   1. Home
   2. New Accident Report
   3. My Drafts
   4. My Submissions
4. Smart Assist is not shown in the navigation
5. Active state is clear but calm
6. Dashboard and form content do not become cramped
7. Mobile uses a drawer instead of a permanent sidebar
8. Layout still feels aligned with the existing liquid glass visual system