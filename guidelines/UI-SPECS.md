# DART Accident Reporting - UI Specifications

Technical specifications for developers implementing the DART Accident Reporting application.

---

## Color System

### Brand Colors
- **DART Blue Primary**: `#007DBA` - Primary actions, links, active states
- **DART Blue Dark**: `#00205B` - Headers, important text
- **DART Blue Navy**: `#0B3466` / `#002B5C` - Navigation text, headings
- **DART Blue Light**: `#00A4B5` - Accents, progress indicators
- **DART Yellow**: `#FFCD00` - Focus rings, highlights (ADA compliant)

### Semantic Colors
- **Success**: `#10B981` (Emerald 500)
- **Warning**: `#F59E0B` (Amber 500)
- **Error**: `#EF4444` (Red 500)
- **Info**: `#007DBA` (DART Blue)

### Backgrounds
- **Page Background**: `#F5F7FB` - Light gray-blue
- **Card Background**: `#FFFFFF` (White)
- **Glass Background**: `rgba(255, 255, 255, 0.78)` with `backdrop-filter: blur(22px)`
- **Locked Field**: `#E6F4FB` - Light blue tint (40% opacity)
- **Hover States**: `rgba(0, 113, 188, 0.08)` - Subtle blue hover

### Status Badge Colors
- **Approved**: `bg-emerald-50 text-emerald-700 border-emerald-200`
- **Under Review**: `bg-blue-50 text-blue-700 border-blue-200`
- **Completed**: `bg-slate-50 text-slate-700 border-slate-200`
- **Needs Clarification**: `bg-amber-50 text-amber-700 border-amber-200`

---

## Typography

### Font Family
- Primary: `font-family: 'Poppins', sans-serif`
- Fallback: System sans-serif stack

### Font Sizes
- **Page Title**: `text-[28px] sm:text-[32px]` (28px mobile, 32px desktop)
- **Section Title**: `text-[18px]` 
- **Card Title**: `text-sm` (14px)
- **Body Text**: `text-sm` (14px)
- **Label**: `text-sm` (14px)
- **Helper Text**: `text-xs` (12px)
- **Caption**: `text-[10px]` or `text-[11px]`

### Font Weights
- **Semibold**: `font-semibold` (600) - Headings, labels
- **Medium**: `font-medium` (500) - Active states
- **Normal**: `font-normal` (400) - Body text

### Line Heights
Use Tailwind defaults unless specified otherwise.

---

## Spacing

### Container Widths
- **Page Max Width**: `1920px`
- **Content Max Width**: `1200px` (centered)
- **Form Max Width**: `1320px`

### Padding
- **Page Horizontal**: `px-8` (32px)
- **Page Vertical**: `py-6` (24px) or `py-8` (32px)
- **Card Padding**: `px-6 py-5` (24px horizontal, 20px vertical)
- **Card Header**: `px-6 py-4` (24px horizontal, 16px vertical)

### Gaps
- **Section Gap**: `gap-6` (24px)
- **Card Gap**: `space-y-5` (20px between cards)
- **Form Field Gap**: `space-y-4` (16px between fields)
- **Grid Gap**: `gap-4` (16px) or `gap-x-5 gap-y-4` (20px horizontal, 16px vertical)

---

## Border Radius

- **Cards**: `rounded-2xl` (16px) or `rounded-xl` (12px)
- **Inputs**: `rounded-lg` (8px)
- **Buttons**: `rounded-lg` (8px) or `rounded-full` (pill shape)
- **Badges**: `rounded-full` (pill shape)
- **Dropdowns**: `rounded-xl` (12px)

---

## Shadows

### Card Shadows
```css
box-shadow: 0 2px 16px rgba(15, 35, 52, 0.04);
```

### Glass Effect Shadow
```css
box-shadow: 0 16px 40px 0 rgba(10, 31, 68, 0.10);
```

### Dropdown Shadow
```css
box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.12), 0 20px 48px -8px rgba(0, 0, 0, 0.10);
```

---

## Component Specifications

### Buttons

#### Primary Button (GlassButton variant="primary")
```css
background: linear-gradient(135deg, #007DBA 0%, #00A4B5 100%)
color: white
padding: 12px 24px
border-radius: 8px
font-weight: 600
min-height: 44px
transition: all 0.2s

hover: brightness(110%)
focus: ring-2 ring-[#FFCD00] outline-none
disabled: opacity-50 cursor-not-allowed
```

#### Secondary Button (GlassButton variant="secondary")
```css
background: white
border: 2px solid #007DBA
color: #007DBA
padding: 12px 24px
border-radius: 8px
font-weight: 600
min-height: 44px

hover: bg-blue-50
focus: ring-2 ring-[#FFCD00] outline-none
```

### Form Inputs

#### Text Input (Editable)
```css
width: 100%
padding: 12px 16px
border: 2px solid #CBD5E1 (slate-300)
border-radius: 8px
min-height: 44px
font-size: 14px
background: white

focus: 
  outline: none
  ring: 2px #FFCD00
  border-color: #007DBA

placeholder: text-slate-400
```

#### Text Input (Locked/Read-only)
```css
width: 100%
padding: 12px 16px
border: 2px solid rgba(0, 125, 186, 0.2)
border-radius: 8px
min-height: 44px
background: rgba(230, 244, 251, 0.4) (#E6F4FB with 40% opacity)
color: #334155 (slate-700)
cursor: default
user-select: none
```

#### SearchableCombobox
```css
trigger:
  width: 100%
  padding: 12px 16px
  border: 2px solid #CBD5E1
  border-radius: 8px
  min-height: 44px
  display: flex
  justify-content: space-between
  align-items: center
  
  focus/open: 
    border-color: #007DBA
    ring: 2px #FFCD00

dropdown:
  background: white
  border-radius: 12px
  border: 1px solid #E2E8F0
  box-shadow: 0 8px 32px -4px rgba(0,0,0,0.12)
  max-height: 256px
  overflow-y: auto
```

#### YesNoToggle
```css
container: inline-flex gap-3

button (inactive):
  padding: 12px 24px
  border: 2px solid #E2E8F0
  border-radius: 8px
  background: white
  color: #64748B
  
button (active):
  border-color: #007DBA
  background: #E6F4FB
  color: #00205B
  font-weight: 600
```

### Cards

#### Standard Card
```css
background: white
border: 1px solid #E2E8F0 (slate-200)
border-radius: 16px
box-shadow: 0 2px 16px rgba(15, 35, 52, 0.04)

header:
  padding: 16px 24px
  border-bottom: 1px solid #F1F5F9 (slate-100)
  display: flex
  align-items: center
  gap: 12px
  
body:
  padding: 20px 24px
```

#### Glass Card (Header/Navigation)
```css
background: linear-gradient(110deg, 
  rgba(10, 68, 140, 0.06) 0%, 
  rgba(255, 255, 255, 0.78) 45%, 
  rgba(255, 255, 255, 0.78) 100%)
border: 1px solid rgba(216, 228, 246, 0.55)
border-radius: 24px
box-shadow: 0 16px 40px 0 rgba(10, 31, 68, 0.10)
backdrop-filter: blur(22px)
-webkit-backdrop-filter: blur(22px)
```

### Navigation

#### Horizontal Nav Item
```css
inactive:
  color: #00205B
  font-weight: 400
  padding: 8px
  
active:
  color: #00205B
  font-weight: 600
  border-bottom: 3px solid #007DBA
  
hover (inactive):
  color: #007DBA
  border-bottom: 3px solid rgba(0, 125, 186, 0.3)
  
focus: ring-2 ring-[#FFCD00] outline-none
```

### Stepper

#### Step Circle
```css
active:
  width: 30px
  height: 30px
  background: #00205B
  box-shadow: 0 0 0 3px rgba(0, 164, 181, 0.12), 0 3px 10px rgba(0, 32, 91, 0.2)
  color: white
  font-size: 11px
  font-weight: 600
  
completed:
  width: 28px
  height: 28px
  background: #00A4B5
  box-shadow: 0 2px 6px rgba(0, 164, 181, 0.15)
  color: white (shows checkmark icon)
  
  hover: scale-105
  
upcoming:
  width: 28px
  height: 28px
  background: white
  border: 1px solid #BFDBFE (blue-200)
  color: #94A3B8 (slate-400)
  cursor: not-allowed
```

#### Progress Track
```css
background: linear-gradient(to right, #DBEAFE, #EFF6FF, #DBEAFE) (blue-100 gradient)
height: 3px
border-radius: 9999px

active portion:
  background: linear-gradient(to right, #00A4B5, #007DBA)
  transition: width 500ms ease-out
```

### Status Badges

```css
base:
  display: inline-flex
  padding: 4px 10px
  border-radius: 8px
  border: 1px solid
  font-size: 12px
  font-weight: 500
  
approved:
  background: #ECFDF5 (emerald-50)
  color: #047857 (emerald-700)
  border-color: #A7F3D0 (emerald-200)
  
under-review:
  background: #EFF6FF (blue-50)
  color: #1D4ED8 (blue-700)
  border-color: #BFDBFE (blue-200)
```

---

## Icons

### Icon Library
- **Primary**: Lucide React (`lucide-react` package)
- **Size**: `w-4 h-4` (16px) or `w-5 h-5` (20px) most common

### Common Icons
- **Lock**: `<Lock />` - Locked fields
- **Search**: `<Search />` - Search inputs
- **CheckCircle2**: `<CheckCircle2 />` - Success states
- **AlertCircle**: `<AlertCircle />` - Warning/error states
- **Info**: `<Info />` - Information banners
- **Pencil**: `<Pencil />` - Edit actions
- **X**: `<X />` - Close/clear actions
- **ChevronDown**: `<ChevronDown />` - Dropdowns
- **Loader2**: `<Loader2 />` - Loading states (with `animate-spin`)

---

## Accessibility (ADA/WCAG 2.1 Level AA)

### Focus Indicators
```css
focus:
  outline: none
  ring: 2px solid #FFCD00
  ring-offset: 0 or 2px (context dependent)

/* Applied to ALL interactive elements */
```

### Minimum Target Size
- All clickable elements: `min-height: 44px` (exceeds WCAG 2.1 AA 44×44px requirement)

### Color Contrast
- Text on white: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Focus indicators: 2px minimum (using ring-2)

### ARIA Labels
- All form inputs have associated labels
- Icon buttons include `aria-label`
- Stepper includes `aria-current="step"` for active step
- Navigation includes `aria-label="Main navigation"`

---

## Responsive Breakpoints

### Tailwind Breakpoints
- **sm**: `640px` - Small tablets
- **md**: `768px` - Tablets
- **lg**: `1024px` - Laptops
- **xl**: `1280px` - Desktops

### Common Responsive Patterns

#### Grid Columns
```css
grid-cols-1          /* Mobile: 1 column */
md:grid-cols-2       /* Tablet: 2 columns */
lg:grid-cols-3       /* Desktop: 3 columns */
```

#### Mode Selection
```css
grid-cols-2          /* Mobile: 2 columns */
md:grid-cols-3       /* Tablet: 3 columns */
lg:grid-cols-5       /* Desktop: 5 columns */
```

#### Font Sizes
```css
text-[28px]         /* Mobile */
sm:text-[32px]      /* Tablet/Desktop */
```

---

## Animation & Transitions

### Default Transitions
```css
transition-all duration-200   /* Most interactive elements */
transition-colors             /* Text color changes */
```

### Framer Motion (motion/react)

#### Fade In/Out
```javascript
const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: { duration: 0.22 }
}
```

#### Modal/Dropdown
```javascript
initial: { opacity: 0, y: -4 }
animate: { opacity: 1, y: 0 }
exit: { opacity: 0, y: -4 }
transition: { duration: 0.15 }
```

### Hover Effects
```css
hover:bg-slate-50              /* Subtle background */
hover:border-slate-300         /* Border darkening */
hover:text-[#007DBA]           /* Color change */
hover:shadow-md                /* Elevation */
hover:scale-105                /* Slight growth */
```

---

## Z-Index Stack

```
Layer                    z-index
─────────────────────────────────
Base content             0
Sticky header            10
Dropdown menus           50
Modal backdrop           9998
Mobile drawer            9999
Toasts                   10000
Portal content           10000
```

---

## Loading States

### Spinner (Loader2)
```css
<Loader2 className="w-4 h-4 text-[#007DBA] animate-spin" />
```

### Skeleton States
Use `bg-slate-200 animate-pulse` for loading placeholders.

---

## Form Validation

### Error States
```css
input (error):
  border-color: #FCA5A5 (red-300)
  
error message:
  color: #DC2626 (red-600)
  font-size: 12px
  margin-top: 4px
```

### Success States
```css
helper text (success):
  color: #10B981 (emerald-500) or #007DBA
  display: flex
  align-items: center
  gap: 4px
  
icon: <CheckCircle2 className="w-3 h-3" />
```

---

## Data Integrity Indicators

### Locked Field Visual
```css
<div className="flex items-center gap-2">
  <Lock className="w-4 h-4 text-[#007DBA]/50" />
  <span>{value}</span>
</div>

background: rgba(230, 244, 251, 0.4)
border: 2px solid rgba(0, 125, 186, 0.2)
```

### Auto-filled Indicator
```css
<p className="text-xs text-[#007DBA]/80 flex items-center gap-1">
  <CheckCircle2 className="w-3 h-3" />
  Auto-filled from Workday
</p>
```

---

## Mobile Considerations

### Touch Targets
- Minimum: 44×44px (all interactive elements)
- Prefer: 48×48px for primary actions

### Mobile Navigation
- Drawer slides from left: `translate-x-0` (open) / `-translate-x-full` (closed)
- Backdrop: `bg-slate-900/40 backdrop-blur-sm`
- Transition: `duration-300 ease-out`

### Mobile Stepper
- Compact header showing current step
- Expandable accordion to show all steps
- Progress bar at bottom

---

## Print Styles

Not currently implemented, but reserved for future PDF generation of submitted reports.

---

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 14+
- Chrome Android: Last 2 versions

---

## Development Notes

### CSS Framework
- **Tailwind CSS v4.0** - Utility-first framework
- Design tokens + `.dart-*` classes in `/src/styles/dart-design-system.css`; Tailwind token classes registered in `/src/styles/globals.css`
- Font imports in `/src/styles/fonts.css`

### Component Library
- Custom components in `/src/app/components/`
- Radix UI primitives for complex components (Command, Popover, etc.)
- Lucide React for icons

### State Management
- React hooks (useState, useEffect, useRef)
- Context API for user roles (`useUserRole`)
- No external state management library

### Form Data
- TypeScript interface: `AccidentReportData` in `/src/app/types/accident-report.ts`
- Employee database mock: `/src/app/data/employeeDatabase.ts`

---

## File Structure Reference

```
/src/app/
  ├── components/
  │   ├── DARTHeader.tsx          # Top navigation with glass effect
  │   ├── DARTFooter.tsx          # Page footer
  │   ├── WizardStepper.tsx       # 4-step progress indicator
  │   ├── GlassButton.tsx         # Primary/secondary buttons
  │   ├── CustomSelect.tsx        # Dropdown component
  │   ├── SearchableCombobox.tsx  # Autocomplete dropdown
  │   ├── YesNoToggle.tsx         # Binary toggle buttons
  │   ├── steps/
  │   │   ├── Step1IncidentBasics.tsx
  │   │   ├── Step2VehicleLocation.tsx
  │   │   ├── Step3PeopleImpact.tsx
  │   │   ├── Step4ReviewSubmit.tsx
  │   │   └── sections/
  │   │       ├── EmployeeInfoSection.tsx
  │   │       ├── BusCollisionSection.tsx
  │   │       ├── LRVCollisionSection.tsx
  │   │       ├── BasicIncidentSection.tsx
  │   │       └── ...
  ├── styles/
  │   ├── dart-design-system.css  # Design tokens + .dart-* classes (source of truth)
  │   ├── globals.css             # Tailwind glue + token classes
  │   └── fonts.css               # Font imports (Poppins)
  ├── context/
  │   └── UserRoleContext.tsx     # Role-based access control
  └── data/
      └── employeeDatabase.ts     # Mock Workday data
```

---

## Quick Reference

| Element | Class Pattern | Example |
|---------|--------------|---------|
| Page wrapper | `min-h-screen bg-[#F5F7FB]` | Full height, light background |
| Content container | `max-w-[1200px] mx-auto px-8` | Centered, responsive padding |
| Card | `bg-white rounded-2xl border border-slate-200 shadow-sm` | White card with subtle shadow |
| Primary button | `bg-gradient-to-r from-[#007DBA] to-[#00A4B5]` | Blue gradient |
| Text input | `px-4 py-3 rounded-lg border-2 min-h-[44px]` | Standard input sizing |
| Focus ring | `focus:ring-2 focus:ring-[#FFCD00]` | ADA-compliant yellow ring |
| Locked field | `bg-[#E6F4FB]/40 border-[#007DBA]/20` | Light blue, low opacity |

