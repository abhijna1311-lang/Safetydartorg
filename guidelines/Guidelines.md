# System guidelines

Use these rules when generating code or UI for the **DART Accident Reporting** application.

Keep outputs clean, accessible and easy to maintain.

* Prefer responsive layouts using flexbox and grid
* Avoid absolute positioning except for small badges or overlays
* Keep components small and reusable
* Move shared helpers into their own files
* Follow existing styles in the project and do not invent new tokens if a suitable one already exists

---

# Design system guidelines

## Layout and navigation

* The app has a **top banner** with the DART logo on the left and the user profile and notifications on the right  
  This banner uses a soft liquid glass style with a light background and subtle shadow
* Primary navigation sits **below** the banner with these items in this order  
  `Home`, `New Accident Report`, `My Drafts`, `My Submissions`
* Content should be centered in a max width container so it looks good on large monitors and still works on tablet and mobile
* Use generous white space and clear section titles so operators can scan quickly after a long shift

## Typography and copy

* Use the existing project text styles for headings, body, labels and helper text
* Headings are sentence case for example `New Accident Report`, `Needs your attention`
* Date format is `MM/DD/YYYY` in the interface for example `11/20/2025`
* Keep microcopy short and direct for example `Continue report`, `Use Smart Assist`

---

## Buttons

Buttons are key actions in this tool and must feel consistent.

### Primary button

* Used for the main action in a section or screen  
  Examples: `Start New Report`, `Continue report`, `Use Smart Assist`
* Filled with the brand blue gradient used on the hero card  
  On hover the gradient deepens slightly
* One primary button per main content area

### Secondary button

* Used for supporting actions such as `Skip and fill form manually`
* Outlined with the primary blue and transparent background

### Tertiary button or link

* Used for light weight actions such as `View all drafts`, `Mark all as read`
* Styled as text or subtle link with no strong background

---

## Cards and sections

* Use rounded cards for key sections such as
  * Hero card: **Report a New Accident Event**
  * **Needs your attention** cards
  * **Continue where you left off** and **Recent submissions**
* Cards sit on a very light gray page background
* High priority or due content can use a soft tinted background rather than heavy borders

---

## Forms and stepper

Accident reports are completed in guided steps.

* Use a horizontal stepper near the top of the report flow with these four steps  
  `Incident Basics`, `Vehicle and Location`, `People and Impact`, `Review and Submit`
* Show the current step as filled, future steps as outlines, completed steps with checkmark
* Below the stepper, always show the step title and a short description
* Labels sit **above** inputs and are left aligned  
  Required fields use a red asterisk
* Use helper text under inputs where needed and keep it to one short line
* Use consistent spacing between rows of fields so the form can be scanned quickly

### Step 1: Incident Basics - Employee Information Flow

**Employee information appears FIRST** in Step 1, before event type and mode selection.

#### Role-based filing logic

**For regular employees (Operators):**
* Badge number is **LOCKED** and auto-filled from Workday login
* Shows locked field with lock icon and message: "Locked - auto-filled from your Workday login for data integrity"
* Cannot change badge number (maintains data integrity)
* Can edit other employee details if needed via "Edit details" button

**For Supervisors and Program Managers:**
* See "Filing on behalf of another employee?" question at the top with label "(Supervisors and Program Managers only)"
* Two filing modes:
  1. **Filing for themselves** (`is_on_behalf = false`): Badge is locked, same as operators
  2. **Filing on behalf** (`is_on_behalf = true`): Badge field becomes searchable with autocomplete
     * Shows search icon and placeholder "Search badge number or name..."
     * Dropdown shows matching employees as user types
     * Selecting an employee auto-fills all their details from Workday
     * Can change to different employee by searching again

#### Employee information banner

* Banner appears above badge field showing current context:
  * Self-filing: "Logged in as [Name] · [Role]"
  * On-behalf: "Filing on behalf of [Employee Name]"
* Banner includes "Edit details" button to unlock all auto-filled fields for manual editing
* Helper text: "Badge #[number] — details auto-filled from Workday. You can edit if needed."

#### Step 1 field order

1. On-behalf question (Supervisors/Program Managers only)
2. Employee information section (always visible)
   * Badge number (locked or searchable based on role/mode)
   * All employee details auto-filled from Workday
3. Event type selection
4. Driving question (conditional - for certain event types)
5. Mode selection

### Step 2: Vehicle and Location - Event Type Branching

**Collision events:**
* Shows full collision form with:
  * Event description, date/time
  * Vehicle details
  * Location information
  * Bus status and route
  * **Collision-specific fields:**
    - Collision type (with Auto, with Pedestrian, with Fixed Object, etc.)
    - Bus/Train action at time of event
    - Point of impact
    - Speed
    - Visual impact diagram
    - Damage questions
    - Runaway vehicle questions
    - Evacuation questions
  * Weather conditions

**Non-collision events** (Near Miss, Fire, Assault, etc.):
* Shows simplified form with:
  * Event description, date/time
  * Vehicle details
  * Location information
  * Bus status and route
  * Weather conditions
  * **NO collision-specific fields** (impact diagrams, collision type, etc.)

**Mode-specific forms:**
* **Bus/Non-Revenue Vehicle**: Uses BusCollisionSection or BasicIncidentSection
* **Light Rail/Streetcar/Hi-Rail**: Uses LRVCollisionSection or BasicIncidentSection

### Step 3: People and Impact - Conditional Sections

**Always shown:**
* Operator/employee injury
* Passenger injury section
* Police section

**Conditional sections** (based on collision type from Step 2):
* **Pedestrian injury section**: Only shows if collision type = "Collision – with Pedestrian"
* **Other vehicle section**: Only shows if collision type = "Collision – with Auto"

### Smart fields

* Fields like **Vehicle number**, **Badge number** (on-behalf mode), **Assigned route** should be searchable dropdowns with auto complete  
  As the user types, show a list of matching options with employee/vehicle details
* When a vehicle or employee is selected, related fields auto-fill with a helper line such as  
  `Auto-filled from Workday` or `Fleet type auto-filled: 40 ft Low Floor`
* Badge number search shows: Employee name, badge number, and division in dropdown
* Vehicle search shows: Vehicle number, fleet type, and route in dropdown

---

## Data integrity and Workday integration

* Employee badge numbers are sourced from Workday SSO login
* Regular employees cannot modify their own badge number to prevent fraud
* Only Supervisors and Program Managers can file on behalf of others
* Auto-fill triggers when:
  * User logs in (self-filing mode)
  * Badge number is selected (on-behalf mode)
* Auto-filled fields are editable via "Edit details" button but maintain audit trail
* Locked fields show lock icon and blue background (#E6F4FB)

---

## Smart Assist panel

The Smart Assist feature appears on the right side of the **Tell us what happened** step.

* The panel has a light blue background, icon, title `Smart Assist` and short description
* Include a clear primary action such as `Use Smart Assist` and an optional secondary action to skip
* If voice input is available, show a microphone icon inside or next to the description text area  
  The icon should be subtle and use the same blue family

---

## Notifications

* Notifications open in a panel that should always appear **above** hero content and cards  
  Ensure z index places it on top
* Each notification shows icon, title, short body text, time and a clear action link or button such as `View report`

---

## Accessibility

* Maintain adequate color contrast for all text and icons (WCAG 2.1 Level AA compliance)
* **Focus styles:** Use `ring-2 ring-[#FFCD00]` (DART Yellow) on all interactive elements
  * 2px ring width meets ADA 2px minimum requirement while being less visually prominent than ring-4
  * Applied to: navigation items, buttons, form inputs, dropdowns, toggles, stepper circles
* All interactive elements need descriptive labels and aria attributes where appropriate
* Form validation errors use red (#EF4444) with adequate contrast
* Success states use emerald (#10B981) or DART blue (#007DBA)

