# Task: Fix left navigation app shell layout

## Goal
The current layout looks broken because the left navigation, dashboard content, section cards, and footer are not aligned inside one consistent shell.

Refactor the page into a clean app shell with:
1. Top glass header
2. Left navigation rail
3. Main content area
4. Footer aligned to the main content area

Do not redesign the visual style of the cards. Fix only layout, alignment, spacing, and responsive structure.

---

## 1. Create one centered app shell container

Create a parent frame named:

`AppShell / Page Container`

Set it to:

- Width: `100%`
- Max width: `1280 px` to `1360 px`
- Horizontal alignment: center
- Padding left and right: `32 px`
- Padding top: `24 px`
- Background: keep existing light page background

All major elements must live inside this same shell container.

---

## 2. Top header placement

Keep the existing liquid glass header style.

Place the header inside the `AppShell / Page Container`.

Header rules:

- Width: `100%`
- Height: keep current height
- Align to the same left and right edges as the body grid below
- Do not let the header be wider or narrower than the body content
- Keep DART logo, app title, notification bell, and user profile exactly as they are

---

## 3. Create body grid below header

Create a frame named:

`AppShell / Body Grid`

Place it directly under the header.

Layout:

- Display as 2-column grid or horizontal auto layout
- Column 1: left nav
- Column 2: main content
- Gap between columns: `24 px`
- Top spacing from header: `24 px`

Column sizes:

- Left nav width: `240 px`
- Main content: fill remaining width
- Main content min width: `0` so it does not overflow

Important:
The left nav and the main content must start at the same vertical Y position.

---

## 4. Left navigation rail

Move the left nav into column 1 of `AppShell / Body Grid`.

Left nav rules:

- Width: `240 px`
- Height: fit content at minimum
- Optional sticky behavior in dev notes:
  - Sticky top below header
- Do not place it as a floating independent object
- Align its top with the top of the welcome section
- Keep current visual style:
  - White glass surface
  - Rounded corners
  - Soft shadow
  - Active state for Home

Nav items:

1. Home
2. New Accident Report
3. My Drafts
4. My Submissions

Do not add Smart Assist.

---

## 5. Main content area

Create a frame named:

`Main Content`

Place it in column 2 of `AppShell / Body Grid`.

Main content rules:

- Width: fill available space
- Max width: none inside the shell
- Align left
- Vertical auto layout
- Gap between major sections: `32 px`

All dashboard sections must share the same left and right alignment:

1. Welcome message
2. Top dashboard grid
3. Needs your attention
4. Continue where you left off
5. Recent submissions
6. Footer

Do not allow sections to have different random widths.

---

## 6. Top dashboard grid alignment

Inside `Main Content`, create a frame named:

`Dashboard Quick Actions`

Layout:

- Horizontal auto layout or grid
- Width: `100%`
- Gap: `24 px`
- Left side: hero card
- Right side: metrics stack

Column sizing:

- Hero card: `2fr`
- Metrics column: `1fr`
- Metrics column width should stay consistent
- Both columns should align at the top
- Hero card and metrics stack should end on the same visual baseline where possible

Do not center this block independently. It must align with the welcome text above and the Needs your attention card below.

---

## 7. Needs your attention section

Keep the existing section design but ensure:

- Section width: `100%` of `Main Content`
- Card inside section width: `100%`
- Header, divider, and card align to the same left and right padding
- Do not let this section float wider or narrower than the dashboard grid above

---

## 8. Continue where you left off section

Keep the existing draft card layout but ensure:

- Section width: `100%`
- Draft cards sit inside a responsive grid
- On desktop: 2 cards per row inside the main content area
- Gap between cards: `24 px`
- Cards should fill the available row evenly
- Do not allow this section to shift horizontally away from the sections above

---

## 9. Recent submissions section

Keep the existing recent submissions styling but ensure:

- Section width: `100%`
- Rows align to the same content grid as other sections
- Avoid making this table/card narrower than the sections above

---

## 10. Footer alignment

Move the footer inside `Main Content`, below Recent submissions.

Footer rules:

- Width: `100%`
- Top border or divider may stay
- Left side: help/contact information
- Right side: copyright and links
- Align footer to the same left and right edges as the content sections above
- Do not align footer to the full viewport width

---

## 11. Remove broken spacing

Remove any old layout offsets caused by the previous top nav.

Specifically:

- Remove empty horizontal nav row spacing
- Remove extra left padding added to main content manually
- Remove any absolute X positioning used to place sections
- Use the body grid to control alignment instead

---

## 12. Responsive behavior

### Large desktop

- Use full `AppShell / Page Container`
- Left nav: `240 px`
- Main content fills remaining space

### Tablet

- Left nav collapses to `72 px`
- Main content fills remaining space
- Nav labels can hide if needed
- Icons remain visible

### Mobile

- Hide permanent left nav
- Use hamburger menu in the top header
- Drawer opens from left
- Main content becomes full width
- Dashboard quick actions stack:
  1. Hero card
  2. Metrics cards
  3. Needs your attention
  4. Continue where you left off
  5. Recent submissions
  6. Footer

---

## 13. Acceptance criteria

1. Header, left nav, main content, and footer are all aligned inside one shell container.
2. Left nav no longer feels like a floating island.
3. Main content uses all available space to the right of the nav.
4. Welcome message, hero card, Needs your attention, Continue where you left off, Recent submissions, and footer all share the same left and right edges.
5. No section is randomly centered or narrower than the others.
6. The page feels like one cohesive enterprise app layout.
7. No Smart Assist item is added to the nav.
8. Existing card visual styles are preserved.