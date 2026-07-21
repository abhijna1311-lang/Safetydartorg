# DART Accident Reporting — Complete UI Specification (MVP Build Spec)

> **Purpose of this document.** This is a single, self-contained specification for the DART Accident Reporting web application. A front-end developer — or an AI coding agent — should be able to read this document and rebuild the MVP **without opening the existing codebase**. Everything needed to understand the product, the workflow, the design system, every screen, every component, the data model, validation, and the build order is here.
>
> **How an agent should use this document.** Read Sections 1–4 first to build the mental model (what the product is and the 3-role workflow — this is the part most agents get wrong). Then use Section 5 (Design System) as the token source of truth, Sections 6–8 as the build reference, and Section 14 as the ordered build plan. Do not invent new design tokens; reuse the ones defined here.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [The Core Mental Model — Read This First](#2-the-core-mental-model--read-this-first)
3. [Roles, Users & Prototype Role Switcher](#3-roles-users--prototype-role-switcher)
4. [The Case Lifecycle & Workflow Engine](#4-the-case-lifecycle--workflow-engine)
5. [Design System (Token Source of Truth)](#5-design-system-token-source-of-truth)
6. [Global Layout & App Shell](#6-global-layout--app-shell)
7. [Screen Specifications](#7-screen-specifications)
8. [Component Library](#8-component-library)
9. [Data Model](#9-data-model)
10. [Validation Rules](#10-validation-rules)
11. [Interaction & Motion Patterns](#11-interaction--motion-patterns)
12. [Accessibility (WCAG 2.1 AA)](#12-accessibility-wcag-21-aa)
13. [Responsive Behavior](#13-responsive-behavior)
14. [MVP Build Order (Agent Plan)](#14-mvp-build-order-agent-plan)
15. [MVP Definition of Done](#15-mvp-definition-of-done)

---

## 1. Product Overview

**What it is.** DART Accident Reporting is an internal web application for **Dallas Area Rapid Transit (DART)** that lets transit staff file, review, and close **accident/incident cases** (bus and rail). It replaces paper forms with a guided, multi-step digital wizard and a collaborative, multi-role review workflow.

**Who uses it.** Three roles collaborate on every case:
- **Operator** — the front-line vehicle operator who reports what happened.
- **Supervisor** — the field supervisor who investigates and adds scene findings.
- **Program Manager** — the reviewer who classifies the case and closes it.

**What makes it different from a normal form.** A single case is **not** completed by one person. It is a **shared record** with **three sections** (Operator, Supervisor, Program Manager). Each role fills in and submits their own section. Sections can be **returned for correction**. The case only **closes** when the Program Manager approves.

**Design intent (the feel).** Calm, trustworthy, and legible for someone filling this out at the end of a long shift. Soft "liquid glass" surfaces, generous white space, clear section titles, one primary action per screen. Nothing should feel like a punishment to complete. Honest status over optimistic status — always show the user exactly where the case stands and what they specifically need to do next.

**Non-goals for MVP.** No real backend, no real authentication, no PDF export, no file uploads. All data is **in-memory / mock** (seeded sample cases + a mock "Workday" employee database). The prototype role switcher stands in for SSO.

---

## 2. The Core Mental Model — Read This First

> An agent that skips this section will build a single-user form and miss the entire point of the product. **Read this carefully.**

A **Case** (e.g., `AE-2026-1044`) is a shared container with **three sections**:

| Section | Owner role | What it captures |
|---|---|---|
| `operator` | Operator | The operator's first-person account: incident basics, vehicle/location, people & impact. |
| `supervisor` | Supervisor | The supervisor's field investigation: scene findings, arrival, damage/tow counts. |
| `programManager` | Program Manager | The classification decision: preventable/non-preventable, severity, close-out. |

Each section has an independent **status**:

`not-required` · `not-started` · `pending` · `in-progress` · `submitted` · `returned` · `resubmitted` · `accepted`

The **case moves through stages** as sections get submitted and reviewed:

```
initiation → operator-completion → supervisor-review → program-manager-review → closed
```

**Who can start a case.**
- An **Operator** starts at `operator-completion` (they immediately begin their own section).
- A **Supervisor or Program Manager** starts at `initiation` — they open the case and can **file on behalf of** an operator (or file for themselves if they were the one involved).

**"Filing on behalf" is central.** When a Supervisor/PM files on behalf of an operator (`is_on_behalf = true`), the operator's badge becomes a **searchable field** and the operator later completes their own section. When a Supervisor files for *themselves* (`is_on_behalf = false`), the operator section is **skipped** (`not-required`) and the case routes straight to program-manager review after the supervisor section.

**Corrections.** A reviewer can **return** a section with a note. The section owner then sees a focused **Correction Resolution** screen showing *only the fields that need fixing* plus the reviewer's note, and resubmits.

**The home screen is a personalized queue.** Every role sees a different home: "here are the cases waiting for *your* section or *your* correction." The app is fundamentally a **shared task queue**, not a form.

If you internalize one thing: **a case is a shared, multi-section record that passes between three roles, and each screen is scoped to what the current role must do next.**

---

## 3. Roles, Users & Prototype Role Switcher

### 3.1 Role configuration

Three hardcoded users stand in for real SSO identities. Store this as `ROLE_CONFIGS`.

| Role | Name | Badge | Initials | Can file on behalf? | Accent color |
|---|---|---|---|---|---|
| `Operator` | John Doe | `90001` | JD | No | `#007DBA` (blue) |
| `Supervisor` | Maria Chen | `90002` | MC | Yes | `#5C35A8` (purple) |
| `Program Manager` | David Park | `90003` | DP | Yes | `#0F7B6C` (teal) |

Each role config: `{ role, label, sublabel, initials, name, badge, canFileOnBehalf }`.

Sublabels:
- Operator: "Route operator — files reports for themselves"
- Supervisor: "Can file reports on behalf of operators"
- Program Manager: "Can file reports on behalf of operators"

### 3.2 Role context (state)

A React Context (`UserRoleProvider` / `useUserRole`) holds the current `roleConfig` and a `setRole(role)` setter. Default role on load: **Operator**.

### 3.3 Prototype role switcher (top-right chip)

Because there is no real login in the MVP, a **role switcher** lets you demo all three perspectives.

- **Trigger:** a chip in the header's top-right showing the current role's icon + name + chevron. The chip tint matches the role accent color.
- **Dropdown:** a small "Prototype" labeled panel (with a subtle pulsing indicator) listing all three roles. Selecting one calls `setRole()` and re-renders the whole app from that role's perspective.
- Closes on outside click / Escape.
- This is explicitly a **demo affordance** — style it as clearly "prototype mode," not a production account menu.

---

## 4. The Case Lifecycle & Workflow Engine

This section defines the state machine. Implement it as pure helper functions over a `WorkflowReport` object (see [Section 9](#9-data-model)).

### 4.1 Stages

```
initiation → operator-completion → supervisor-review → program-manager-review → closed
```

`STAGE_ORDER` = the array above, used to render progress.

### 4.2 Which role is assigned at each stage

`getAssignedRole(stage, initiatedBy, isOnBehalf)`:

| Stage | Assigned role |
|---|---|
| `initiation` | The initiating role (Supervisor or PM) |
| `operator-completion` | `Operator` — unless a Supervisor filed for themselves (`initiatedBy=Supervisor && isOnBehalf=false`), then `Supervisor` |
| `supervisor-review` | `Supervisor` |
| `program-manager-review` | `Program Manager` |
| `closed` | `null` (no one) |

### 4.3 Next stage on submit

`getNextStage(stage, initiatedBy, isOnBehalf)`:

- `initiation` → `operator-completion`
- `operator-completion` → `supervisor-review` (normal) **or** `program-manager-review` (if Supervisor filed for self)
- `supervisor-review` → `program-manager-review`
- `program-manager-review` → `closed`

### 4.4 Return (correction) target stage

`getReturnStage(stage, initiatedBy, isOnBehalf)`:

- `supervisor-review` → `operator-completion`
- `program-manager-review` → `supervisor-review` (normal) **or** `operator-completion` (if Supervisor filed for self)

### 4.5 Section statuses & overall status

**Section status** (per section): `not-required · not-started · pending · in-progress · submitted · returned · resubmitted · accepted`.

**Overall case status** (`getWorkflowStatus`) resolves to human-readable strings such as:
- `Rejected`, `Closed`, `All sections complete`, `Correction requested`
- `Waiting on {section labels}`, `Open sections: {section labels}`, `Draft`
- Stage fallbacks: "Initiation in progress", "In progress", "Awaiting operator completion", "Under supervisor review", "Under final review", "Closed".

**Required sections** (`getRequiredSectionKeys`):
- Supervisor filing for self → `[supervisor, programManager]`
- Everyone else → `[operator, supervisor, programManager]`

### 4.6 Handoff history (audit trail)

Every transition appends a `WorkflowHandoff` record: `{ id, fromRole, toRole, fromStage, toStage, action, note?, targetSection?, createdAt }`. Actions include: `forwarded`, `returned`, `section-submitted`, `section-resubmitted`, `section-returned`, `section-approved`, `section-reassigned`, `section-commented`, `operator-waived`, `rejected`, `closed`. This history renders the **Case Timeline**.

### 4.7 Role permissions summary

| Capability | Operator | Supervisor | Program Manager |
|---|---|---|---|
| Edit & submit own section | ✅ operator | ✅ supervisor | ✅ programManager |
| Start a new case | ✅ (own section) | ✅ (initiation, on-behalf or self) | ✅ (initiation) |
| View other sections (read-only) | ✅ | ✅ | ✅ |
| Return a section for correction | — | ✅ operator | ✅ supervisor |
| Reassign supervisor | — | — | ✅ |
| Approve & close case | — | — | ✅ |
| Reject case | — | — | ✅ |

Locked rules: once a section is submitted, only its reviewer can act on it. The operator narrative (`description_of_event`) locks after the operator section is submitted. A rejected or closed case is fully read-only for everyone.

---

## 5. Design System (Token Source of Truth)

> These are the only tokens. Do not introduce new colors/spacings unless a screen spec explicitly requires it.

### 5.1 Color palette

**Brand / blues**
| Token | Hex | Use |
|---|---|---|
| DART Blue (primary) | `#007DBA` | Primary actions, links, active states |
| DART Blue Dark | `#00205B` | Headings, important text, active stepper |
| DART Blue Navy | `#0B3466` / `#002B5C` | Nav text, section titles |
| DART Blue Light / Teal | `#00A4B5` | Accents, progress, completed stepper |
| DART Yellow | `#FFCD00` | Focus rings, highlights (ADA) |

**Role accents:** Operator `#007DBA` · Supervisor `#5C35A8` · Program Manager `#0F7B6C`.

**Semantic**
| Token | Hex | Use |
|---|---|---|
| Success | `#10B981` (emerald-500) | Approved / complete |
| Warning | `#F59E0B` (amber-500) | Correction / caution |
| Error | `#EF4444` (red-500) | Validation errors, reject |
| Info | `#007DBA` | Info banners |
| In-progress | `#06B6D4` (cyan-500) | Section in progress |

**Backgrounds**
| Token | Value | Use |
|---|---|---|
| Page background | `#F5F7FB` | App canvas |
| Card background | `#FFFFFF` | Cards, inputs |
| Glass background | `rgba(255,255,255,0.78)` + `backdrop-filter: blur(22px)` | Header/nav glass |
| Locked field | `rgba(230,244,251,0.4)` (`#E6F4FB` @ 40%) | Auto-filled/locked inputs |
| Subtle hover | `rgba(0,113,188,0.08)` | Hover tint |

**Status badge palettes (Tailwind pairs)**
- Approved/Accepted: `bg-emerald-50 text-emerald-700 border-emerald-200`
- Under review / Submitted: `bg-blue-50 text-blue-700 border-blue-200` (or indigo for "submitted")
- In progress: `bg-cyan-50 text-cyan-700 border-cyan-200`
- Needs clarification / Returned: `bg-amber-50 text-amber-700 border-amber-200`
- Completed/Closed: `bg-slate-50 text-slate-700 border-slate-200`
- Rejected: `bg-red-50 text-red-700 border-red-200`

### 5.2 Typography

- **Font family:** `'Poppins', sans-serif` (fallback: system sans stack).
- Sizes: Page title `28px` mobile / `32px` desktop · Section title `18–22px` · Card title / body / label `14px` · Helper `12px` · Caption `10–11px` · Nav overline `11px uppercase`.
- Weights: Semibold `600` (headings/labels), Medium `500` (active), Normal `400` (body).
- Headings are **sentence case** ("New accident case", "Needs your attention").
- **Date format shown to users:** `MM/DD/YYYY`. Stored internally as `YYYY-MM-DD`. Time shown/stored `HH:MM` (24-hour internally).

### 5.3 Spacing & layout widths

- Page max width: `1920px`; **content container: `1320px` centered** (the app shell width); form content up to `1200–1320px`.
- Page padding: `px-8` (32px) horizontal, `py-6/py-8` vertical; tighter on mobile (`px-4`).
- Card padding: header `px-6 py-4`, body `px-6 py-5`.
- Gaps: section `gap-6` (24px), between cards `space-y-5` (20px), between fields `space-y-4` (16px), grid `gap-4` / `gap-x-5 gap-y-4`.

### 5.4 Radius, shadows, blur

- Radius: cards `rounded-2xl` (16px) or `rounded-xl` (12px); glass surfaces `rounded-3xl` (24px); inputs/buttons `rounded-lg` (8px); pills/badges `rounded-full`.
- Card shadow: `0 2px 16px rgba(15,35,52,0.04)`.
- Glass shadow: `0 16px 40px rgba(10,31,68,0.10)`.
- Dropdown shadow: `0 8px 32px -4px rgba(0,0,0,0.12), 0 20px 48px -8px rgba(0,0,0,0.10)`.

### 5.5 Z-index stack

```
Base content       0
Sticky header      10
Dropdown menus     50
Modal backdrop     9998
Mobile drawer      9999
Toasts / portals   10000
```
Notifications and role dropdowns render via **portal** and must sit above hero content and cards.

### 5.6 Motion (see Section 11 for full patterns)

- Default transition: `transition-all duration-200`.
- Library: **`motion/react`** (Motion, formerly Framer Motion).
- Standard fade: `initial {opacity:0, y:10}` → `animate {opacity:1, y:0}` → `exit {opacity:0, y:6}`, `duration: 0.22`, ease `[0.22,1,0.36,1]`.
- Press feedback: `active:scale-[0.98]`.

---

## 6. Global Layout & App Shell

Every screen renders inside a shared shell. Composition: **Header → (Left Nav on desktop) → Role Context Bar (when in a case) → Main content → Footer.**

### 6.1 AppShell

- Centered container, max width `1320px`, background `#F5F7FB`.
- **Desktop (≥1024px):** two-column grid — persistent **LeftNavigation** sidebar + main content (`flex: 1`).
- **Mobile/tablet (<1024px):** single column; nav becomes a dismissible **left drawer** overlay. Lock body scroll when open; Escape closes; focus trap inside drawer; backdrop scrim `bg-slate-900/40 backdrop-blur-sm`.

### 6.2 DARTHeader

- Full-width, soft **glass** surface (light background + subtle shadow), sticky at top (`z-10`).
- **Left:** DART logo.
- **Center (desktop):** primary nav tabs (mirror the left nav items).
- **Right:** notification bell (with unread count badge) → **role switcher chip** → mobile hamburger toggle.
- **Notification bell** opens a **portal dropdown** (above all content) listing up to ~5 notifications. Each: icon (success/warning/comment/info), title, short body, timestamp, read state, and an action link ("View case", "Resolve correction"). Footer button: **"Mark all as read."** Sample notifications:
  - Success — "Case closed — your Bus collision case #… has been closed"
  - Warning — "Revision requested — Case #… needs additional information"
  - Comment — "New comment — Program Manager David Park commented on your Rail incident case"
  - Info — "Draft reminder — incomplete draft expires in 3 days"

### 6.3 LeftNavigation

Nav items **in this exact order** (id → label → icon → optional badge):

1. `home` → **Home** → `Home`
2. `new-report` → **New Accident Case** → `FileText`
3. `drafts` → **Draft Cases** → `Clock` → badge (count, e.g. `3`)
4. `submissions` → **Case History** → `CheckCircle`

Styling: inactive = `#007DBA @ 8%` bg, navy text `#0B2E63`; active = `#007DBA @ 12%` bg, `#002B5C` text, **3px left border `#0072B8`**; hover brightens. Badge = blue pill `#0072B8`, white text, right-aligned. Focus ring `ring-2 ring-[#FFCD00]`.

### 6.4 RoleContextBar

Appears **inside a case** (below header, above wizard content). White card, light border, `p-5`, two-column on large screens.
- **Left:** Case ID (bold, `#00205B`) · separator dot · event summary (e.g., "Bus · Collision").
- **Right:** current task label (role/status specific) + optional context note.
- Copy examples: "Case AE-2025-0010 · Bus · Collision" / "Complete Incident Basics" / "Started for you by Maria Chen (Supervisor)" / "You are completing the Supervisor section. The employee will complete their Operator section separately."

### 6.5 DARTFooter

Two columns (stacked on mobile):
- **Left:** "Questions or need help with accident cases?" → `safety@dart.org`, IT Service Desk `itservicedesk@dart.org`.
- **Right:** "© Dallas Area Rapid Transit" + links: Privacy · Terms · Accessibility.

---

## 7. Screen Specifications

The app has **four top-level views** (`home` · `new-report` · `drafts` · `submissions`) plus in-wizard workflow screens. Navigation is state-driven (no router required for MVP): `App` holds `currentView`, `reports[]`, and `activeReportId`.

### 7.1 Home (`OperatorHome`)

A **personalized, role-scoped dashboard**. Vertical stack of sections (24–32px gaps):

1. **Hero card** (role-aware, blue gradient).
   - Title: "Start a new accident case".
   - Body: "Open a shared case and complete your section. Your progress is saved automatically as you go."
   - Primary button: **"Start new case"**.
   - Intro line: "Finish case sections assigned to you, or start a case yourself when reporting directly from the field."
2. **Two metric cards** (side by side):
   - "Awaiting your action" — count of cases needing this role + sublabel ("Your section tasks" / "Supervisor action" / "Classification action").
   - "Closed this month" — count + "Last 30 days".
3. **Your queue** — "Cases waiting for your {Role} section or correction." Each queue card:
   - Case ID (bold) · title ("Operator section pending" / "Started on your behalf" / "Supervisor section pending") · owner line ("Started by: Maria Chen (Supervisor)") · a "Why you're seeing this" context line · due date · priority label (High priority / Needs review / Correction needed / Final decision) · primary action ("Continue Operator Section" / "Start Supervisor Section" / …).
4. **Continue where you left off** — "Section drafts you started and can resume." Each draft card: Case ID · **mode badge** (Bus=blue, Rail=violet, Streetcar=teal) · last saved date · current step name · **progress bar** (step/4) · event type · location · **Resume**.
5. **Recent case activity** — "Cases you've touched recently." Rows: Case ID · submitted date · mode · status · injury level.

Empty states: friendly, never a blank void. If queue is empty, say so plainly ("You're all caught up — no cases need your action right now.").

### 7.2 New Accident Case — the Wizard (`AccidentReportWizard`)

The wizard orchestrates the whole case-editing experience. It renders: **RoleContextBar → WizardStepper → StepContainer(current step) → footer nav**, and swaps in special screens (Correction Resolution, Reviewer Decision, Success) based on workflow state.

**Standard operator flow = 4 steps → Success:**
1. Incident Basics
2. Vehicle and Location
3. People and Impact
4. Review and Submit → **Success Screen**

**Supervisor / Program Manager** use **role-scoped step sets** (their section's fields only) — the stepper title reads "Your section progress · These steps apply only to your section."

**Footer navigation (persistent):**
- **Back** (secondary) — to previous step; hidden on step 1.
- **Save draft** (secondary/tertiary) — persists `WorkflowReport` with `overallStatus: 'draft'`, stays put, shows a subtle saved confirmation.
- **Next step** (primary) — advances only if step validation passes (see Section 10).
- On the final step, the primary becomes **"Submit {role} section"**.

**Auto-save:** progress saves on step change and on explicit Save draft. Show "Auto-saved" affordance near the stepper.

#### 7.2.1 WizardStepper

- **Desktop:** horizontal rail — overline "Your section progress", subtitle "These steps apply only to your section", 4 numbered circles joined by a gradient progress bar.
  - Completed: teal `#00A4B5`, checkmark, **clickable** (jump back), hover `scale-105`.
  - Current: navy `#00205B`, larger (30px), soft ring `0 0 0 3px rgba(0,164,181,0.12)`, not clickable.
  - Upcoming: white, `1px #BFDBFE` border, slate-400 number, disabled.
  - Progress track: blue-100 gradient base, active fill `linear-gradient(to right,#00A4B5,#007DBA)`, `transition width 500ms`.
- **Tablet (480–767px):** vertical list with current step highlighted.
- **Mobile (<480px):** compact header "Step X of Y · {title}" + "View all" accordion to expand steps + bottom progress bar.

Step titles: **Incident Basics · Vehicle and Location · People and Impact · Review and Submit.**

#### 7.2.2 StepContainer

Wraps each step. Header: step title (`22px`, `#00205B`) + optional "Step X of 4" pill + description + helper "Fields marked with * are required" + bottom border. Body: stacked section cards, `gap-6`.

### 7.3 Step 1 — Incident Basics (`Step1IncidentBasics`)

**Employee information appears FIRST**, before event type. Field order:

1. **On-behalf question** *(Supervisors & Program Managers only)* — labeled "(Supervisors and Program Managers only)": "Are you filing this case on behalf of an employee?" (Yes/No).
   - **No** (or Operator always): badge is **locked**, auto-filled from the logged-in Workday identity.
   - **Yes:** badge becomes a **SearchableCombobox** (placeholder "Search badge number or name…"). Selecting an employee auto-fills all their fields.
2. **Employee information** (always visible). Banner above the badge field:
   - Self: "Logged in as {Name} · {Role}".
   - On-behalf: "Filing on behalf of {Employee Name}".
   - Banner includes an **"Edit details"** button to unlock auto-filled fields for manual edits (keeps audit trail).
   - Locked badge shows a **lock icon**, background `#E6F4FB`, message "Locked — auto-filled from your Workday login for data integrity", helper "Badge #{n} — details auto-filled from Workday. You can edit if needed."
   - Auto-filled fields: badge, name, phone, address, gender, age, date of hire, status, department, division, division supervisor, division work, cost center, service years/months/days, student-employee flag.
3. **RDO (Regular Days Off):** type = Consecutive | Split; consecutive pair dropdown (e.g., "Sun/Mon"); or two split-day dropdowns.
4. **Event type** (SearchableCombobox): Collision · Assault (Verbal or Physical) · Near Miss · Derailment · Fire · Operator/Passenger Events (non-collision) · Trail a Switch · Signal Violation.
5. **Driving question** *(conditional)* — for `Assault`, `Fire`, `Operator/Passenger Events`: "Were you operating a DART vehicle?" (Yes/No).
6. **Vehicle mode** (`ModeCard` grid): Bus (Fixed route bus) · Light Rail Vehicle · Streetcar · Hi-Rail (on-rail maintenance truck) · Non-Revenue Vehicle. Grid: 2 cols mobile → 3 tablet → 5 desktop.

**Proceed rule:** requires `event_type`, `mode`, `employee_badge_number`, `employee_name`, and the driving answer if the driving question is shown.

### 7.4 Step 2 — Vehicle and Location (`Step2VehicleLocation` / `Step2CollisionInformation`)

Content **branches on event type and mode.**

**Shared (all events):** description of event (textarea, with `SmartCheckDescriptionHelper` below it), incident date (DatePicker), incident time (TimePicker).

**Bus / Non-Revenue Vehicle:**
- Vehicle info: **vehicle number** (SearchableCombobox → auto-fills fleet type/route), route number, block number, trip id, run number, pull-out date/time, end-of-line destination.
- Location: street on, cross street, city, ZIP; "Event at a bus stop?" (Yes/No) → if yes, bus stop name; "Bike lane present?".
- Bus status before / after; fleet type (auto-filled).
- **Collision-only fields** (when `event_type = Collision`): collision type, bus action at time of event, point of impact, speed, **VehicleImpactDiagram**, bus damage (+ confirm), runaway vehicle (+ operator-in-vehicle, parking brake), evacuation for life safety.

**Light Rail / Streetcar / Hi-Rail (LRV):**
- Train number (SearchableCombobox), car number, consist count + consist numbers, LRV fleet type, rail line (Red/Blue/Green/Orange), end of line.
- Location category (Station / Grade Crossing / Tunnel / other), station or grade-crossing or address of event, train status before/after.
- **Collision-only fields:** LRV collision type, train action, point of impact, speed, train damage (+ disabling damage), derailment flag, runaway train (+ operator-in-train), evacuation.

**Weather (shared, collision):** weather, road conditions, lighting, streetlights, traffic conditions, traffic controls, roadway configuration.

**Collision types:**
- Bus: with Auto · with Pedestrian · with Cyclist · with Fixed Object · with Animal · with Train.
- LRV: with Auto · with Pedestrian · with Cyclist · with Object on Track · with Animal · with Other Train.

**Reviewer reference:** for Supervisor/PM reviewing an operator submission, expose a read-only **ReferenceReportDrawer** ("open operator report") that slides in with the operator's narrative and details.

### 7.5 Step 3 — People and Impact (`Step3PeopleImpact`)

Stacked section cards. Sections appear conditionally based on collision type/mode.

- **Operator/employee injury** (always): "Was the operator injured?" (Yes/No) → if yes, body part + transported (Yes/No); other employees injured count.
- **Passenger injury** (always for revenue modes): passengers on board (count), passengers injured, passenger fatalities, transported, fled, courtesy cards, which door, passenger action.
- **Pedestrian injury** (only if `collision_type = "Collision – with Pedestrian"`): pedestrian records (type, action, fled), counts (involved, injuries, fatalities, transported, fled).
- **Other vehicle** (only if `collision_type = "Collision – with Auto"`): occupants, injuries, fatalities, transported, fled, DART-DART flag, vehicle type/action/point of impact/direction, damage (+ area), tow-away, plus optional **third vehicle** block.
- **Police** (always): "Police at scene?" (Yes/No) → police type, DART supervisor investigating.

### 7.6 Step 4 — Review and Submit (`Step4ReviewSubmit`)

1. **SmartCheckReviewBanner** — run a review pass; three states (default / issues / clear). Issue items are clickable and jump to the relevant field.
2. **SubmissionSuccessInline** — if this section is already submitted, show the emerald inline success card (see 8.x).
3. **CaseWorkflowStatusPanel** — the three section statuses (Operator, Supervisor, Program Manager) with color-coded badges, owner, and status message.
4. **Program Manager extras** (PM role only): classification fields (collision-with, classification e.g. "Preventable"/"Non-preventable", severity, action-taken notes) + **PMReviewActionBar** (Comment · Return for correction · Reassign supervisor · Reject · Approve & close).
5. **Confirmation checkbox** + **Submit {role} section** primary button.

### 7.7 Draft Cases (`MyDrafts`)

- Header "Draft cases" + role-specific subtitle.
- **Empty state:** "No draft cases yet" + icon.
- List/table of drafts (newest first): Case ID · **mode badge** · step progress ("Step 2 of 4" or bar) · last modified (relative) · event type · location · actions **Resume** + **Delete** (with confirm modal).
- Resume opens the wizard at the saved step. Delete removes the draft (and clears `activeReportId` if active).

### 7.8 Case History (`MySubmissions`)

- Header "Case history" + **FilterDropdown** (status filters: All / Closed / Active / Waiting / Correction needed / Rejected; date range) + search by Case ID.
- Rows: Case ID · submitted date & time ("Jun 12, 2026 · 2:45 PM") · mode badge · event type · location · **status badge** · "Waiting on" (which section, or "—") · **View** (eye icon → read-only `ViewReportModal`).
- Status colors: Closed=emerald, Waiting=indigo, Active=cyan, Correction needed=amber, Rejected=red.

### 7.9 Workflow screens (in-wizard)

- **CorrectionResolutionScreen** — shown when the current role's section status is `returned`. Amber header "Your {section} was returned for correction" + "Only the fields below need your attention" + metadata (reviewer, returned section, reason) + a focused editable card (only the returned fields) + **"Review and resubmit section"** primary.
- **ReviewerDecisionScreen** — Program Manager reviewing a submitted supervisor section. Read-only case summary + four action tiles: **Approve** (emerald), **Return** (amber), **Reassign** (blue), **Reject** (red). Each opens a modal for a required note, then executes and appends to handoff history.
- **CaseStatusDrawer** — right-side slide-in showing case header (ID, status, waiting-on), **CaseTimeline** (vertical handoff history), and **SectionStatusCards**. Close (X) top-right.
- **CaseTimeline** — vertical timeline of handoff events: created, section pending/in-progress/submitted/resubmitted/returned/approved, comments, closed, rejected — each with timestamp, actor role, action, optional note.
- **SuccessScreen** — full-screen after a section submission: emerald gradient header + large checkmark + role-specific message ("Your Operator Section has been submitted"), Case ID, event summary, `CaseWorkflowStatusPanel`, next-steps text, and buttons: **"Back to {role} home"** + **"View case status"**.

---

## 8. Component Library

Reusable components. Build these first (they are used everywhere).

### 8.1 GlassButton
Props: `{ variant: 'primary' | 'secondary'; onClick?; children; disabled?; className?; type? }`.
- **Primary:** blue gradient `linear-gradient(135deg,#007DBA,#00A4B5)` (or solid `#007DBA`), white text, `600`, `min-h-44px`, `rounded-lg`, hover deepens/`brightness(110%)`, `active:scale-[0.98]`, focus `ring-2 ring-[#FFCD00]`, disabled `opacity-50 cursor-not-allowed`. **One primary per content area.**
- **Secondary:** white bg, `2px #007DBA` border, `#007DBA` text, hover `bg-blue-50`.

### 8.2 StepContainer
Props: `{ stepNumber; title; description; children; showBeforeYouBegin? }`. See 7.2.2.

### 8.3 Card (inline pattern)
Props: `{ title; complete?; badge?; children }`. White, `rounded-2xl`, `border-slate-200`, completion dot (blue when complete, grey when not), optional top-right badge, padding `px-6 py-5`.

### 8.4 ModeCard
Props: `{ icon: LucideIcon; label; sublabel; selected; onClick }`.
- Selected: `2px #007DBA` border, blue shadow, icon chip `#007DBA` w/ white icon, text `#00205B`.
- Unselected: `1px` grey border, grey icon chip, hover elevates. `min-h-44px`, focus `ring` `#FFCD00`.

### 8.5 YesNoToggle
Props: `{ value: boolean|undefined; onChange; yesLabel?; noLabel? }`. Two equal-width (`flex-1`) buttons, `min-h-44px`. Active: `2px #007DBA` border, `#E6F4FB` bg, `#00205B` `600`. Inactive: `2px` grey, white, grey text, hover grey bg. Focus `ring-2 #FFCD00`.

### 8.6 SearchableCombobox
Props: `{ options: {value,label,description?}[]; value?; onChange; placeholder?; searchPlaceholder?; emptyMessage?; className?; hasError?; disabled? }`. Radix Popover + `cmdk` Command. Trigger `min-h-44px`, `2px` border, chevron rotates 180° when open. Dropdown: white, `rounded-xl`, `max-h-256px` scroll, options show label + optional description + checkmark for selected. Focus/open: `#007DBA` border + `#FFCD00` ring. Error: red border. Used for employee search, vehicle/train search, event type, route, etc.

### 8.7 CustomSelect
Props: `{ value; onChange; options:{value,label}[]; placeholder?; disabled? }`. Styled native `<select>`, `min-h-44px`, focus `ring-2 #FFCD00`.

### 8.8 DatePickerInput
Props: `{ value: 'YYYY-MM-DD'; onChange; placeholder? }`. Displays `MM/DD/YYYY`, stores `YYYY-MM-DD`. Calendar popover (month/year nav, "Today" shortcut). Selected day blue; today ringed; out-of-month days light grey. `min-h-44px`. (Uses `react-day-picker` / `date-fns`.)

### 8.9 TimePickerInput
Props: `{ value: 'HH:MM'; onChange; placeholder? }`. `HH:MM` field + popover hour/minute selectors, validated. `min-h-44px`.

### 8.10 VehicleImpactDiagram
Props: `{ markers: {x,y}[]; onChange; maxMarkers? (default 6) }`. Click to drop up to 6 markers (percent coords 0–100). Each marker a distinct color (`#007DBA`, `#E85D04`, `#7B2D8B`, `#1D8348`, `#B7950B`, `#1A5276`) + zone label (Front <33% x, Rear >66% x, Left <40% y, Right >60% y). Hover shows delete; new marker flashes (`animate-flash`). Responsive to container.

### 8.11 EmployeeInfoSection
Props: `{ data; onUpdate; isOnBehalf }`. Implements the Step-1 employee logic (self-lock vs on-behalf search, auto-fill, "Edit details", lookup states `idle|searching|found|not-found` with spinner/success/warning banners). See 7.3.

### 8.12 WizardStepper
Props: `{ currentStep: 1–4; onStepClick? }`. See 7.2.1.

### 8.13 SmartCheck components
- **SmartCheckBanner** (`{ state, issues[], onRun }`) — inline, three states (default blue "Run smart check…", issues amber list, clear emerald).
- **SmartCheckReviewBanner** — larger, Step-4 variant; issues are clickable to jump to fields.
- **SmartCheckDescriptionHelper** — under the narrative textarea; "Review my description" → suggestions (e.g., "Location not mentioned — consider adding where this occurred").
> Smart Check is a **local heuristic** for MVP (no AI backend): scan the form data for missing required fields and simple conflicts (e.g., "passenger injured but severity blank"). Present findings honestly; never fake "all clear."

### 8.14 Status & workflow display components
- **CaseWorkflowStatusPanel** — three section status cards (Operator/Supervisor/PM), each: name, status badge (pending=blue, in-progress=cyan, submitted=indigo, accepted=emerald, returned=amber, not-required=slate), owner, status message, lock icon when locked.
- **SectionStatusCard / NeedsAttentionCard** — a single colored status pill + label + owner.
- **CaseTimeline** — vertical audit trail (see 7.9).
- **CaseStatusDrawer** — right slide-in wrapper (see 7.9).
- **PMReviewActionBar** — PM action strip (Comment / Return / Reassign / Reject / Approve & close); full or compact (dropdown) layouts; each action opens a note modal.
- **ReviewerDecisionScreen / CorrectionResolutionScreen / SuccessScreen / SubmissionSuccessInline** — see 7.9 / 7.6.

### 8.15 Shell components
`DARTHeader`, `LeftNavigation`, `RoleContextBar`, `DARTFooter`, `AppShell`, `NotificationPanel`, `FilterDropdown`, `ViewReportModal`, `AddPersonModal`, `ReferenceReportDrawer`, `RequiredPill`, `SeveritySelector`. See Sections 6 & 7.

### 8.16 Icons
**Lucide React.** Common: `Lock`, `Search`, `CheckCircle2`, `AlertCircle`, `Info`, `Pencil`, `X`, `ChevronDown`, `Loader2` (with `animate-spin`), `Home`, `FileText`, `Clock`, `CheckCircle`, `Bus`. Sizes `w-4 h-4` / `w-5 h-5`.

---

## 9. Data Model

TypeScript types. Two core interfaces: `AccidentReportData` (the form payload) and `WorkflowReport` (the case wrapper).

### 9.1 WorkflowReport (case wrapper)

```ts
type WorkflowStage = 'initiation' | 'operator-completion' | 'supervisor-review'
  | 'program-manager-review' | 'closed';

type WorkflowSectionKey = 'operator' | 'supervisor' | 'programManager';

type WorkflowSectionStatus = 'not-required' | 'not-started' | 'pending'
  | 'in-progress' | 'submitted' | 'returned' | 'resubmitted' | 'accepted';

type WorkflowOverallStatus = 'draft' | 'open' | 'waiting-on-sections'
  | 'correction-requested' | 'complete' | 'closed' | 'rejected';

type WorkflowHandoffAction = 'forwarded' | 'returned' | 'closed' | 'section-submitted'
  | 'section-resubmitted' | 'section-returned' | 'section-approved'
  | 'section-reassigned' | 'section-commented' | 'operator-waived' | 'rejected';

interface WorkflowSectionState {
  key: WorkflowSectionKey;
  ownerRole: UserRole;
  label: string;
  status: WorkflowSectionStatus;
  submittedBy?: UserRole | null;
  submittedAt?: string | null;
  returnedBy?: UserRole | null;
  returnedAt?: string | null;
  correctionNote?: string | null;
  lastUpdatedAt?: string | null;
}

interface WorkflowHandoff {
  id: string;
  fromRole: UserRole;
  toRole: UserRole | null;
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  action: WorkflowHandoffAction;
  note?: string;
  targetSection?: WorkflowSectionKey;
  createdAt: string;
}

interface WorkflowReport {
  id: string;                       // e.g. 'AE-2026-1044'
  initiatedBy: UserRole;
  workflowStage: WorkflowStage;
  overallStatus?: WorkflowOverallStatus;
  sections?: Record<WorkflowSectionKey, WorkflowSectionState>;
  currentStep: number;              // 1–4
  formData: AccidentReportData;
  createdAt: string;
  lastSavedAt: string;
  dueBy?: string;                   // 'MM/DD/YYYY'
  lastSubmittedBy?: UserRole | null;
  handoffNote?: string | null;
  handoffHistory?: WorkflowHandoff[];
  closedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: UserRole | null;
}
```

### 9.2 AccidentReportData (form payload)

A large, mostly-optional flat interface grouped by step. Key fields (full list in the original type; these cover the MVP):

- **Step 1:** `event_type`, `operating_dart_vehicle`, `mode`, `is_on_behalf`, `on_behalf_employee`, and employee fields (`employee_badge_number`, `employee_name`, `employee_address`, `employee_phone`, `employee_age`, `employee_gender`, `date_of_hire`, `employee_status`, `department`, `assigned_division`, `division_work`, `cost_center`, `service_years/months/days`, `is_student_employee`), RDO fields (`regular_day_off_type`, `rdo_consecutive`, `rdo_split_1/2`).
- **Step 2 (shared):** `description_of_event`, `incident_date` (YYYY-MM-DD), `incident_time` (HH:MM).
- **Step 2 (bus):** `vehicle_number`, `trip_id`, `block_number`, `route_number`, `run_number`, `fleet_type`, `end_of_line_destination`, `employee_pullout_date/time`, `event_at_bus_stop`, `bus_stop_name`, `street_on`, `cross_street`, `city`, `zip`, `bus_status_before/after`, `has_bike_lane`, `collision_type`, `bus_damage(+_confirmed)`, `bus_action`, `point_of_impact`, `bus_speed`, `runaway_vehicle`, `operator_in_vehicle_runaway`, `parking_brake_engaged`, `evacuation_life_safety`.
- **Step 2 (LRV):** `train_number`, `car_number`, `lrv_consist_count/1..4`, `lrv_fleet_type`, `rail_line`, `location_category`, `station_applicable`, `grade_crossing_applicable`, `tunnel_location`, `address_of_event`, `train_status_before/after`, `lrv_collision_type`, `train_damage`, `disabling_damage`, `train_action`, `lrv_point_of_impact`, `train_speed`, `collision_resulted_in_derailment`, `runaway_train`, `operator_in_train_runaway`, `lrv_evacuation`, `lrv_end_of_line`.
- **Step 2 (weather):** `weather`, `road_conditions`, `lighting_conditions`, `streetlights`, `traffic_conditions`, `traffic_controls`, `roadway_configuration`.
- **Step 3:** operator (`operator_injured`, `operator_injured_body_part`, `operator_transported`, `other_employees_injured_count`); passenger (`passengers_on_board`, `passenger_fatalities`, `passengers_injured`, `passenger_action`, `which_door`, `passengers_fled`, `courtesy_cards`, `passengers_transported`); pedestrian (`pedestrians_involved`, `pedestrian_groups: PedestrianRecord[]`, `pedestrians_fled/fatalities/injuries/transported`); other vehicle (`other_vehicle_occupants/fatalities/injuries/fled/transported`, `dart_dart_collision`, `other_vehicle_type/action/point_of_impact/direction/damage/damage_area/tow_away`, `third_vehicle_involved`, `third_vehicle_collided`, `third_vehicle: ThirdVehicleData`); police (`police_at_scene`, `police_type`, `dart_supervisor_investigating`); `impact_markers: {x,y}[]`.
- **Step 4:** `confirmation_checked`.
- **PM / supervisor extras** (seen in seed data): `severity_level`, `program_manager_classification`, `program_manager_collision_with`, `action_taken`, `supervisor_*` scene fields, `operator_datetime_correct`, etc.

### 9.3 Supporting types

```ts
interface PedestrianRecord { id: string; pedestrian_type?: string; pedestrian_action?: string; fled?: boolean; }
interface ThirdVehicleData { occupants?; fatalities?; injuries?; fled?; transported?; dart_collision?; type?; action?; point_of_impact?; direction?; damage?; damage_area?; tow_away?; }
interface ImpactMarker { x: number; y: number; } // 0–100 %
```

### 9.4 Mock databases (MVP fixtures)

- **EMPLOYEE_DB**: `Record<badge, Employee>` — at minimum badges `90001` (John Doe, Operator), `90002` (Maria Chen, Supervisor), `90003` (David Park, Program Manager), each with name, phone, address, gender, hire date, department, division, cost center, service tenure. `workdayEmployeeFields(badge)` maps a DB record → `Partial<AccidentReportData>` for auto-fill.
- **VEHICLE_DB**: `Record<vehicleNumber, Vehicle>` — vehicleNumber, fleetType, currentRoute, division, status.
- **INITIAL_REPORTS**: ~8 seeded `WorkflowReport`s spanning every stage/status (in-progress, waiting-on-sections, correction-requested, submitted, closed) so all screens have realistic content on first load. Case IDs use the `AE-YYYY-NNNN` pattern.

---

## 10. Validation Rules

Strategy: validate on blur; gate each step's **Next**; final validation before submit; Smart Check is an optional mid-step pass. Errors: 12px `#EF4444` text below field, `2px red-300` border, shake animation on failed proceed. Success helper: emerald/blue with `CheckCircle2`.

### Step 1 proceed
`event_type && mode && employee_badge_number && employee_name` — plus `operating_dart_vehicle !== undefined` **if** event type ∈ {Assault, Fire, Operator/Passenger Events}. On-behalf: selected employee must exist in EMPLOYEE_DB. Self-filing: badge is locked to the logged-in badge (cannot be changed).

### Step 2 proceed
- **Non-collision:** `description_of_event && incident_date && incident_time`.
- **Collision:** the above **plus** `vehicle_number`, collision type (`collision_type` for bus / `lrv_collision_type` for rail), `street_on`, `city`, `weather`.
- Date: `YYYY-MM-DD`, not in the future. Time: `HH:MM` 24-hour (`^([01]\d|2[0-3]):([0-5]\d)$`). Description: 10–2000 chars. Vehicle number must exist in VEHICLE_DB. Impact markers: max 6 (warn if 0 on a collision).
- Conditional requireds: bus stop name if `event_at_bus_stop`; `bus_damage_confirmed` if `bus_damage`; runaway follow-ups if `runaway_vehicle`; `disabling_damage` if `train_damage`; etc.

### Step 3 proceed
`operator_injured !== undefined` (+ body part & transported if true); `passengers_on_board` provided (≥0, warn >200); `police_at_scene !== undefined`. Cross-field: injured ≤ on board; transported ≤ injured. Pedestrian section required only for "with Pedestrian"; other-vehicle section required only for "with Auto".

### Step 4 submit
`confirmation_checked === true`. Run Smart Check; surface any missing/conflicting fields as clickable issues before allowing submit.

---

## 11. Interaction & Motion Patterns

Library: **`motion/react`** + Tailwind transitions.

- **Fade in/out** (conditional sections, banners, toasts): `initial {opacity:0,y:10}` → `animate {opacity:1,y:0}` → `exit {opacity:0,y:6}`, `duration 0.22`, ease `[0.22,1,0.36,1]`. Wrap in `<AnimatePresence>`.
- **Press feedback:** `active:scale-[0.98] transition-transform duration-150` (buttons, ModeCard, YesNoToggle, clickable stepper circles).
- **Slide-in panels** (NotificationPanel, drawers, ViewReportModal): `x:'100%'→0`, spring `{damping:25, stiffness:200}`.
- **Flash highlight** (`animate-flash`, 0.7s): new impact marker, field after auto-fill, newly added list items. `@keyframes flash { 0%,100%{opacity:1} 50%{opacity:0.7; background:rgba(0,125,186,0.1)} }`.
- **Progress fill:** `transition-all duration-500 ease-out`, gradient `#00A4B5→#007DBA`.
- **Chevron rotate:** `transition-transform duration-200`, `rotate-180` when open.
- **Stagger children** (mode cards, notifications, review summary, recent list): `staggerChildren: 0.08`.
- **Shake on error** (0.4s): `@keyframes shake { 10,30,50,70,90%{translateX(-4px)} 20,40,60,80%{translateX(4px)} }`.

---

## 12. Accessibility (WCAG 2.1 AA)

- **Focus ring:** `ring-2 ring-[#FFCD00]` (DART Yellow) on **all** interactive elements — nav items, buttons, inputs, dropdowns, toggles, stepper circles. 2px meets ADA minimum while staying subtle.
- **Target size:** every interactive element `min-height: 44px` (prefer 48px for primary).
- **Contrast:** text on white ≥ 4.5:1; large text (≥18px) ≥ 3:1.
- **ARIA:** every input has an associated label; icon-only buttons have `aria-label`; stepper active step uses `aria-current="step"`; nav has `aria-label="Main navigation"`.
- **Keyboard:** drawers/dropdowns close on Escape; drawer traps focus; combobox is arrow-key navigable.
- Error color `#EF4444`; success `#10B981` / `#007DBA`.

---

## 13. Responsive Behavior

Tailwind breakpoints: `sm 640` · `md 768` · `lg 1024` · `xl 1280`.

- **Shell:** ≥1024px = sidebar + content; <1024px = single column + nav drawer.
- **Mode grid:** `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`.
- **Form grids:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- **Page titles:** `text-[28px] sm:text-[32px]`.
- **Stepper:** horizontal rail (≥768) → vertical list (480–767) → compact header + accordion (<480).
- **Touch targets** stay ≥44px on mobile.

---

## 14. MVP Build Order (Agent Plan)

Build in this order. Each phase should compile and be visually testable before moving on.

**Phase 0 — Project setup.**
Vite + React 19 + TypeScript. Tailwind CSS **v4** (`@tailwindcss/vite`). Add `motion`, `lucide-react`, Radix primitives (`popover`, `dialog`, `select`, etc.), `cmdk`, `react-day-picker`, `date-fns`, `clsx` + `tailwind-merge`. Import Poppins. Create the theme tokens from Section 5 in a `theme.css`. Scripts: `dev` = `vite`, `build` = `vite build`.

**Phase 1 — Design tokens & primitives.**
Implement `GlassButton`, `Card`, `StepContainer`, `YesNoToggle`, `ModeCard`, `CustomSelect`, `SearchableCombobox`, `DatePickerInput`, `TimePickerInput`, status badges, `RequiredPill`. Verify tokens, focus rings, 44px targets.

**Phase 2 — Types, state & fixtures.**
Define `AccidentReportData`, `WorkflowReport`, workflow helper functions (Section 4), `UserRoleProvider`/`useUserRole`, `EMPLOYEE_DB`, `VEHICLE_DB`, and `INITIAL_REPORTS` seed data. `App` holds `currentView`, `reports`, `activeReportId` with the navigation/save/delete handlers.

**Phase 3 — App shell.**
`AppShell`, `DARTHeader` (logo, tabs, notification bell + `NotificationPanel`, **role switcher chip**), `LeftNavigation` (4 items, exact labels), `DARTFooter`, `RoleContextBar`. Wire the prototype role switcher — switching role must re-render every screen from that perspective.

**Phase 4 — Home dashboard (`OperatorHome`).**
Hero, two metric cards, **Your queue**, **Continue where you left off**, **Recent case activity** — all role-scoped and driven by `reports`. Empty states.

**Phase 5 — The wizard core.**
`AccidentReportWizard` + `WizardStepper` + footer nav (Back / Save draft / Next / Submit). Auto-save. Step 1 → Step 2 → Step 3 → Step 4 for the Operator flow, with per-step validation (Section 10).

**Phase 6 — Step content.**
Step 1 (employee-first + on-behalf logic + `EmployeeInfoSection` + event type + driving question + mode), Step 2 (bus/LRV + collision branching + `VehicleImpactDiagram` + weather + `SmartCheckDescriptionHelper`), Step 3 (conditional injury/vehicle/police sections), Step 4 (`SmartCheckReviewBanner` + `CaseWorkflowStatusPanel` + confirm + submit).

**Phase 7 — Lists.**
`MyDrafts` (resume/delete) and `MySubmissions`/Case History (`FilterDropdown`, status badges, `ViewReportModal`).

**Phase 8 — Multi-role workflow.**
Supervisor & PM role-scoped step sets; `SuccessScreen` / `SubmissionSuccessInline`; `CorrectionResolutionScreen` (returned sections); `ReviewerDecisionScreen` + `PMReviewActionBar` (approve/return/reassign/reject/close); `CaseStatusDrawer` + `CaseTimeline`; handoff-history appends. This phase makes the "shared multi-section case" real.

**Phase 9 — Polish.**
Motion patterns (Section 11), responsive passes (Section 13), accessibility audit (Section 12), Smart Check heuristics, honest empty/error states.

---

## 15. MVP Definition of Done

The MVP is complete when all of the following are true:

1. **Role switching works.** Switching between Operator / Supervisor / Program Manager re-renders the home queue, permissions, and wizard step sets correctly.
2. **A full case can flow end-to-end.** Operator files (4 steps) → submits → Supervisor completes their section → submits → Program Manager reviews → approves & closes. The case appears correctly in Home, Draft Cases, and Case History at each stage.
3. **On-behalf filing works.** A Supervisor/PM can search an employee, auto-fill from `EMPLOYEE_DB`, and file on their behalf; self-filing locks the badge.
4. **Corrections work.** A reviewer can return a section with a note; the owner sees the focused Correction Resolution screen and resubmits; the timeline records it.
5. **Conditional logic is correct.** Collision vs non-collision branches Step 2; pedestrian/other-vehicle sections appear only for the matching collision types; the driving question appears only for the three event types.
6. **Validation gates each step** and blocks submit until the confirmation checkbox is checked; Smart Check surfaces real (not fake) issues.
7. **Design system is faithful:** tokens, Poppins, glass surfaces, 44px targets, `#FFCD00` focus rings, `MM/DD/YYYY` dates.
8. **Responsive & accessible:** sidebar collapses to a drawer under 1024px; keyboard + screen-reader basics pass; no contrast failures.
9. **Seeded data** makes every screen look real on first load.
10. **No console errors; `vite build` succeeds.**

---

*This spec describes the DART Accident Reporting MVP as an in-memory prototype. When a real backend, auth, and integrations are added, the workflow engine (Section 4), data model (Section 9), and validation (Section 10) are the contracts to preserve.*
