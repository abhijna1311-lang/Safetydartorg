# Component Library Reference

Complete inventory of custom components for the DART Accident Reporting application.

---

## Core UI Components

### GlassButton

Primary and secondary button component with glass morphism styling.

**Location:** `src/app/components/GlassButton.tsx`

**Props:**
```typescript
interface GlassButtonProps {
  variant: 'primary' | 'secondary';
  onClick?: (e?: any) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}
```

**Variants:**

**Primary:**
- Background: `#007DBA` (DART Blue)
- Text: White
- Hover: Darker blue (`#0066a3`) with shadow
- Disabled: Grey background, grey text, not clickable
- Min height: 44px (accessibility)
- Focus ring: 3px `#FFCD00` at 50% opacity

**Secondary:**
- Background: White
- Border: 1px `#007DBA`
- Text: `#007DBA`
- Hover: Light blue background (`blue-50`)
- Disabled: 50% opacity, not clickable
- Min height: 44px
- Focus ring: 3px `#FFCD00` at 50% opacity

**Usage:**
```tsx
<GlassButton variant="primary" onClick={handleNext}>
  Next step
</GlassButton>

<GlassButton variant="secondary" onClick={onSaveDraft}>
  Save as draft
</GlassButton>
```

---

### StepContainer

Wrapper component for wizard step content with header and description.

**Location:** `src/app/components/StepContainer.tsx`

**Props:**
```typescript
interface StepContainerProps {
  stepNumber: number;
  title: string;
  description: string | ReactNode;
  children: ReactNode;
  showBeforeYouBegin?: boolean;
}
```

**Features:**
- Displays step number badge (e.g., "Step 1 of 4")
- Shows step title and description
- Includes required field indicator
- Consistent padding and spacing
- Border separator below header

**Usage:**
```tsx
<StepContainer
  stepNumber={1}
  title="Incident basics"
  description="Identify yourself, then provide event type and vehicle mode details."
>
  {/* Step content */}
</StepContainer>
```

---

### Card

Reusable card component for grouping related form fields.

**Location:** Defined inline in `Step1IncidentBasics.tsx`

**Props:**
```typescript
interface CardProps {
  title: string;
  complete?: boolean;
  badge?: string;
  children: ReactNode;
}
```

**Features:**
- White background with border
- Completion indicator (blue dot when complete, grey when incomplete)
- Optional badge in top-right corner
- Consistent padding (6 on sides, 5 vertical)

**Usage:**
```tsx
<Card title="Event type" complete={!!data.event_type}>
  {/* Card content */}
</Card>
```

---

### ModeCard

Selectable card for choosing vehicle mode.

**Location:** `src/app/components/ModeCard.tsx`

**Props:**
```typescript
interface ModeCardProps {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  selected: boolean;
  onClick: () => void;
}
```

**States:**

**Selected:**
- 2px border in `#007DBA`
- Blue shadow
- Icon background: `#007DBA` with white icon
- Text color: `#00205B` (DART Navy)

**Unselected:**
- 1px border in light grey
- Grey icon background with grey icon
- Hover: Light background, elevated shadow

**Accessibility:**
- Min height: 44px
- Focus ring: 3px `#FFCD00` at 50% opacity with 2px offset

**Usage:**
```tsx
<ModeCard
  icon={Bus}
  label="Bus"
  sublabel="Fixed route bus"
  selected={data.mode === 'Bus'}
  onClick={() => onUpdate({ mode: 'Bus' })}
/>
```

---

## Form Components

### YesNoToggle

Binary toggle for yes/no questions.

**Location:** `src/app/components/form/YesNoToggle.tsx`

**Props:**
```typescript
interface YesNoToggleProps {
  value: boolean | undefined;
  onChange: (val: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}
```

**States:**

**Active:**
- Border: 2px `#007DBA`
- Background: `#E6F4FB` (light blue)
- Text: `#00205B` (DART Navy), medium weight

**Inactive:**
- Border: 2px light grey
- Background: White
- Text: Grey
- Hover: Light grey background

**Features:**
- Equal-width buttons (flex-1)
- Min height: 44px
- Focus ring: 2px `#FFCD00`

**Usage:**
```tsx
<YesNoToggle
  value={data.operator_injured}
  onChange={(val) => onUpdate({ operator_injured: val })}
/>
```

---

### SearchableCombobox

Dropdown with search/autocomplete functionality.

**Location:** `src/app/components/SearchableCombobox.tsx`

**Props:**
```typescript
interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
}
```

**Features:**
- Searchable dropdown with Radix UI Popover and Command
- Displays label with optional description below
- Checkmark icon for selected item
- Opens/closes with smooth animation
- Focus state: 2px `#FFCD00` ring with `#007DBA` border
- Error state: Red border

**Usage:**
```tsx
<SearchableCombobox
  options={EVENT_TYPES}
  value={data.event_type}
  onChange={(val) => onUpdate({ event_type: val })}
  placeholder="Select event type..."
  searchPlaceholder="Search events..."
/>
```

---

### DatePickerInput

Date picker with calendar popover.

**Location:** `src/app/components/DatePickerInput.tsx`

**Props:**
```typescript
interface DatePickerInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
}
```

**Features:**
- Input displays date in MM/DD/YYYY format
- Stores date internally as YYYY-MM-DD
- Calendar popover with month/year navigation
- "Today" shortcut button
- Selected date highlighted in blue
- Today's date has blue ring if not selected
- Days outside current month shown in light grey
- Min height: 44px

**Usage:**
```tsx
<DatePickerInput
  value={data.incident_date || ''}
  onChange={(val) => onUpdate({ incident_date: val })}
  placeholder="MM/DD/YYYY"
/>
```

---

### TimePickerInput

Time picker component for selecting hours and minutes.

**Location:** `src/app/components/TimePickerInput.tsx`

**Props:**
```typescript
interface TimePickerInputProps {
  value: string; // "HH:MM" 24-hour format
  onChange: (value: string) => void;
  placeholder?: string;
}
```

**Features:**
- Input shows time in HH:MM format
- Click to open time picker popover
- Separate hour and minute selectors
- Validates time input
- Min height: 44px

---

### CustomSelect

Basic dropdown select component.

**Location:** `src/app/components/CustomSelect.tsx`

**Props:**
```typescript
interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}
```

**Features:**
- Native HTML select with custom styling
- Matches design system colors
- Disabled state support
- Min height: 44px
- Focus ring: 2px `#FFCD00`

---

## Specialized Components

### VehicleImpactDiagram

Interactive diagram for marking collision impact points on vehicle.

**Location:** `src/app/components/VehicleImpactDiagram.tsx`

**Props:**
```typescript
interface ImpactMarker {
  x: number; // 0–100 % of container width
  y: number; // 0–100 % of container height
}

interface Props {
  markers: ImpactMarker[];
  onChange: (markers: ImpactMarker[]) => void;
  maxMarkers?: number; // Default: 6
}
```

**Features:**
- Click to add impact markers (up to 6)
- Each marker has unique color (blue, orange, purple, green, gold, navy)
- Shows zone label (e.g., "Front-left corner", "Rear impact")
- Hover to see delete button
- Flash animation when marker added
- Responsive to container size

**Marker Colors:**
1. `#007DBA` (Blue)
2. `#E85D04` (Orange)
3. `#7B2D8B` (Purple)
4. `#1D8348` (Green)
5. `#B7950B` (Gold)
6. `#1A5276` (Navy)

**Zone Detection:**
- Front: x < 33%
- Rear: x > 66%
- Left: y < 40%
- Right: y > 60%

**Usage:**
```tsx
<VehicleImpactDiagram
  markers={data.impact_markers || []}
  onChange={(markers) => onUpdate({ impact_markers: markers })}
  maxMarkers={6}
/>
```

---

### EmployeeInfoSection

Auto-filling employee information with Workday integration.

**Location:** `src/app/components/steps/sections/EmployeeInfoSection.tsx`

**Props:**
```typescript
interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  isOnBehalf: boolean; // Filing on behalf of another employee
}
```

**Features:**

**Self-filing mode (isOnBehalf = false):**
- Badge number LOCKED with lock icon
- Blue background (`#E6F4FB`) for locked field
- Message: "Locked - auto-filled from your Workday login for data integrity"
- Banner shows: "Logged in as [Name] · [Role]"
- Other fields editable via "Edit details" button

**On-behalf mode (isOnBehalf = true):**
- Badge number SEARCHABLE with search icon
- Autocomplete dropdown shows matching employees
- Selection auto-fills all employee data from Workday
- Banner shows: "Filing on behalf of [Employee Name]"
- All fields editable

**Auto-filled fields:**
- Badge number
- Full name
- Phone number
- Address
- Gender
- Date of hire
- Department
- Division
- Cost center
- Service years/months/days
- Regular days off

**Lookup states:**
- `idle`: No lookup performed
- `searching`: Showing loading spinner
- `found`: Success banner with checkmark
- `not-found`: Error banner with warning

---

### WizardStepper

Multi-step progress indicator with responsive layouts.

**Location:** `src/app/components/WizardStepper.tsx`

**Props:**
```typescript
interface WizardStepperProps {
  currentStep: number; // 1-4
  onStepClick?: (step: number) => void;
}
```

**Features:**

**Desktop (≥768px):**
- Horizontal capsule rail design
- 4 step circles connected by progress track
- Active step: Navy (`#00205B`), 30px diameter
- Completed steps: Teal (`#00A4B5`), 28px, checkmark icon, clickable
- Upcoming steps: White with border, 28px, number, disabled
- Gradient progress bar beneath
- Auto-save message on right

**Tablet (480-767px):**
- Vertical list layout
- Step number badge + title for current step
- Full list of all steps with status
- Progress bar at bottom

**Mobile (<480px):**
- Compressed header showing current step only
- "View all" button to expand full list
- Next step preview
- Progress bar

**Step states:**
- Active: Navy background, white text/icon
- Completed: Teal background, white checkmark
- Upcoming: White background, grey text, disabled

**Accessibility:**
- ARIA navigation landmark
- aria-current for active step
- Descriptive aria-labels for each step
- Focus rings on all interactive elements

---

### SmartCheckBanner

Smart validation banner for reviewing step completeness.

**Location:** `src/app/components/SmartCheckBanner.tsx`

**Props:**
```typescript
interface SmartCheckIssue {
  message: string;
}

interface SmartCheckBannerProps {
  state?: 'default' | 'issues' | 'clear';
  issues?: SmartCheckIssue[];
  onRunCheck?: () => void;
}
```

**States:**

**Default:**
- Light blue gradient background
- Lightbulb icon
- "Run smart check" button
- Invites user to validate their input

**Issues found:**
- Amber gradient background
- Alert icon
- List of issues with bullet points
- Shows count of issues found

**Clear:**
- Green gradient background
- Check circle icon
- Success message
- No issues found

**Usage:**
```tsx
<SmartCheckBanner
  state="issues"
  issues={[
    { message: 'Vehicle number is required for collision events' },
    { message: 'Operator injury details are incomplete' }
  ]}
  onRunCheck={handleRunCheck}
/>
```

---

### RequiredPill

Small pill badge to mark optional fields that are contextually required.

**Location:** `src/app/components/RequiredPill.tsx`

**Appearance:**
- Background: `slate-100`
- Border: `slate-200`
- Text: 10px, `slate-600`
- Rounded corners
- Padding: 2px vertical, 8px horizontal
- Text: "Required"

**Usage:**
```tsx
<label>
  Bus stop name
  {data.event_at_bus_stop && <RequiredPill />}
</label>
```

---

### NotificationPanel

Slide-out notification panel from header.

**Location:** `src/app/components/NotificationPanel.tsx`

**Features:**
- Opens from notification bell in header
- Shows list of notifications with icons
- Each notification has:
  - Icon (Info, AlertCircle, CheckCircle, etc.)
  - Title and description
  - Timestamp
  - Action button/link
- "Mark all as read" option
- Empty state when no notifications
- Closes on outside click or Escape key

---

### SuccessScreen

Full-page success message after report submission.

**Location:** `src/app/components/SuccessScreen.tsx`

**Props:**
```typescript
interface SuccessScreenProps {
  accidentEventId: string;
  onBackToHome?: () => void;
}
```

**Features:**
- Large checkmark icon in green circle
- Success message with event ID
- Next steps guidance
- "Back to home" button
- "Submit another report" button
- Celebration animation on mount

---

## Layout Components

### DARTHeader

Application header with logo, navigation, and user controls.

**Location:** `src/app/components/DARTHeader.tsx`

**Props:**
```typescript
interface DARTHeaderProps {
  activeNav?: 'home' | 'new-report' | 'drafts' | 'submissions';
  onNavigate?: (view: string) => void;
}
```

**Features:**
- DART logo on left
- Primary navigation: Home, New Accident Report, My Drafts, My Submissions
- User profile and notification bell on right
- Liquid glass styling with light background and shadow
- Sticky positioning
- Responsive: Collapses to hamburger menu on mobile

**Navigation states:**
- Active: `#007DBA` text, blue underline
- Inactive: Grey text
- Hover: Navy text

---

### DARTFooter

Application footer with links and copyright.

**Location:** `src/app/components/DARTFooter.tsx`

**Features:**
- DART branding
- Legal links (Privacy Policy, Terms of Use, Accessibility)
- Copyright notice
- Social media links (optional)
- Consistent with header styling

---

## Input Styling Standards

All form inputs follow these standards:

**Base styles:**
- Border: 2px `slate-300`
- Background: White
- Padding: 12px horizontal (px-4), 12px vertical (py-3)
- Border radius: 12px (rounded-xl)
- Font: Poppins, 14px
- Min height: 44px (accessibility requirement)

**Focus state:**
- Border: `#007DBA`
- Ring: 2px `#FFCD00`
- No outline

**Disabled state:**
- Background: `slate-50`
- Border: `slate-200`
- Text: `slate-400`
- Cursor: not-allowed

**Error state:**
- Border: 2px `red-300`
- Hover: `red-400`
- Error message below in `red-500`, 12px

**Locked state (for data integrity):**
- Background: `#E6F4FB` (light blue)
- Border: `#007DBA`/25 opacity
- Lock icon visible
- Text: `#00205B`
- Not editable

**Auto-filled state:**
- Success banner with checkmark
- Helper text: "Auto-filled from Workday"
- Fields editable via "Edit details" button

---

## Animation Standards

**Framer Motion settings:**

```typescript
// Fade in/out
const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
};

// Scale on active
active:scale-[0.98]

// Smooth transitions
transition-all duration-200
transition-colors duration-300
```

**AnimatePresence usage:**
- Wrap conditional renders
- Provides exit animations
- Used for banners, modals, notifications

**Example:**
```tsx
<AnimatePresence>
  {showBanner && (
    <motion.div {...fade}>
      {/* Banner content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Quick Component Reference

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| GlassButton | Primary/secondary actions | variant, onClick, disabled |
| StepContainer | Wizard step wrapper | stepNumber, title, description |
| Card | Group related fields | title, complete, badge |
| ModeCard | Vehicle mode selector | icon, label, selected, onClick |
| YesNoToggle | Binary yes/no input | value, onChange |
| SearchableCombobox | Searchable dropdown | options, value, onChange |
| DatePickerInput | Date selection | value (YYYY-MM-DD), onChange |
| TimePickerInput | Time selection | value (HH:MM), onChange |
| VehicleImpactDiagram | Mark impact points | markers, onChange, maxMarkers |
| EmployeeInfoSection | Employee data auto-fill | data, onUpdate, isOnBehalf |
| WizardStepper | Progress indicator | currentStep, onStepClick |
| SmartCheckBanner | Validation feedback | state, issues, onRunCheck |
| RequiredPill | Conditional required badge | (no props) |
| NotificationPanel | Notifications drawer | notifications, onClose |
| SuccessScreen | Post-submit success | accidentEventId, onBackToHome |
| DARTHeader | App header | activeNav, onNavigate |
| DARTFooter | App footer | (no props) |

---

## File Structure

```
src/app/components/
├── AccidentReportWizard.tsx
├── AppShell.tsx
├── DARTFooter.tsx
├── DARTHeader.tsx
├── GlassButton.tsx
├── StepContainer.tsx
├── ModeCard.tsx
├── RequiredPill.tsx
├── SearchableCombobox.tsx
├── CustomSelect.tsx
├── DatePickerInput.tsx
├── TimePickerInput.tsx
├── VehicleImpactDiagram.tsx
├── WizardStepper.tsx
├── NotificationPanel.tsx
├── SmartCheckBanner.tsx
├── SmartCheckDescriptionHelper.tsx
├── SmartCheckReviewBanner.tsx
├── SuccessScreen.tsx
├── SubmissionSuccessInline.tsx
├── ViewReportModal.tsx
├── NeedsAttentionCard.tsx
├── OperatorHome.tsx
├── MyDrafts.tsx
├── MySubmissions.tsx
├── LeftNavigation.tsx
├── FilterDropdown.tsx
├── figma/
│   └── ImageWithFallback.tsx
├── form/
│   └── YesNoToggle.tsx
├── steps/
│   ├── Step1IncidentBasics.tsx
│   ├── Step2VehicleLocation.tsx
│   ├── Step2CollisionInformation.tsx
│   ├── Step3PeopleImpact.tsx
│   ├── Step4ReviewSubmit.tsx
│   └── sections/
│       ├── EmployeeInfoSection.tsx
│       ├── BasicIncidentSection.tsx
│       ├── BusCollisionSection.tsx
│       ├── BusCollisionDetailsSection.tsx
│       ├── BusVehicleLocationSection.tsx
│       ├── LRVCollisionSection.tsx
│       ├── LRVCollisionDetailsSection.tsx
│       ├── LRVVehicleLocationSection.tsx
│       ├── WeatherSection.tsx
│       ├── PassengerInjurySection.tsx
│       ├── PedestrianInjurySection.tsx
│       ├── OtherVehicleSection.tsx
│       └── PoliceSection.tsx
└── ui/ (shadcn/ui components)
    ├── accordion.tsx
    ├── alert-dialog.tsx
    ├── button.tsx
    ├── calendar.tsx
    ├── card.tsx
    ├── checkbox.tsx
    ├── command.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── input.tsx
    ├── label.tsx
    ├── popover.tsx
    ├── radio-group.tsx
    ├── select.tsx
    ├── switch.tsx
    ├── table.tsx
    ├── tabs.tsx
    ├── textarea.tsx
    └── ... (other shadcn components)
```
