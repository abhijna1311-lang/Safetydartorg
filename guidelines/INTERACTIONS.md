# Interaction Patterns and Animations

UX patterns, animations, and micro-interactions for the DART Accident Reporting application.

---

## Animation Library

### Framer Motion

All animations use `motion/react` (previously Framer Motion).

**Installation:**
```bash
pnpm add motion
```

**Import:**
```typescript
import { motion, AnimatePresence } from 'motion/react';
```

---

## Core Animation Patterns

### Fade In/Out

Used for conditional elements appearing and disappearing.

```typescript
const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
};

// Usage
<AnimatePresence>
  {showElement && (
    <motion.div {...fade}>
      Content here
    </motion.div>
  )}
</AnimatePresence>
```

**Where used:**
- Success banners after auto-fill
- Error messages
- Conditional form sections
- Smart Check results
- Notification toasts

---

### Scale on Interaction

Button press feedback.

```typescript
// Tailwind class
className="active:scale-[0.98] transition-transform duration-150"
```

**Where used:**
- GlassButton (primary and secondary)
- ModeCard
- YesNoToggle buttons
- Wizard stepper circles (clickable completed steps)

---

### Slide In/Out

For panels and modals.

```typescript
const slideIn = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', damping: 25, stiffness: 200 }
};

// Usage
<AnimatePresence>
  {isOpen && (
    <motion.div {...slideIn}>
      Panel content
    </motion.div>
  )}
</AnimatePresence>
```

**Where used:**
- NotificationPanel (slides from right)
- ViewReportModal
- Filter dropdown panels

---

### Flash Highlight

Temporary highlight to draw attention.

```typescript
const [flash, setFlash] = useState<number | null>(null);

const handleAction = () => {
  setFlash(itemId);
  setTimeout(() => setFlash(null), 700);
};

// CSS
className={flash === itemId ? 'animate-flash' : ''}

// In theme.css
@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; background-color: rgba(0, 125, 186, 0.1); }
}

.animate-flash {
  animation: flash 0.7s ease-out;
}
```

**Where used:**
- VehicleImpactDiagram when new marker added
- Form field after auto-fill
- Newly added items in lists

---

### Progress Bar Fill

Smooth progress indicator.

```typescript
<div className="h-1 bg-blue-100 rounded-full overflow-hidden">
  <div 
    className="h-full bg-gradient-to-r from-[#00A4B5] to-[#007DBA] transition-all duration-500 ease-out"
    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
  />
</div>
```

**Where used:**
- WizardStepper progress track
- Mobile stepper progress bar
- File upload progress (if implemented)

---

### Rotate Chevron

Expand/collapse indicator.

```typescript
<ChevronDown 
  className={cn(
    "w-4 h-4 transition-transform duration-200",
    isOpen && "rotate-180"
  )}
/>
```

**Where used:**
- SearchableCombobox dropdown
- Accordion/collapsible sections
- Mobile stepper "View all" button
- Filter dropdowns

---

### Stagger Children

Sequential animation of list items.

```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={container} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

**Where used:**
- Mode selection cards appearing
- Notification list items
- Review step summary sections
- Recent submissions list

---

## Button Interactions

### Primary Button

**Idle:**
- Background: `#007DBA`
- Text: White
- Cursor: pointer

**Hover:**
- Background: `#0066a3` (darker)
- Shadow: `0 4px 12px rgba(0,125,186,0.2)`
- Transition: 200ms ease

**Focus (keyboard):**
- Ring: 3px `#FFCD00` at 50% opacity
- No outline

**Active (pressed):**
- Scale: 0.98
- Transition: 150ms

**Disabled:**
- Background: `slate-300`
- Text: `slate-500`
- Cursor: not-allowed
- No hover effects

```typescript
<button
  className="
    px-6 py-3 rounded-lg min-h-[44px]
    bg-[#007DBA] text-white
    hover:bg-[#0066a3] hover:shadow-[0_4px_12px_rgba(0,125,186,0.2)]
    active:scale-[0.98]
    focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#FFCD00]/50
    disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed
    transition-all duration-200
  "
>
  Button Text
</button>
```

---

### Secondary Button

**Idle:**
- Background: White
- Border: 1px `#007DBA`
- Text: `#007DBA`

**Hover:**
- Background: `blue-50`
- Border: `#007DBA` (unchanged)

**Focus:**
- Ring: 3px `#FFCD00` at 50% opacity

**Active:**
- Scale: 0.98

**Disabled:**
- Opacity: 50%
- Cursor: not-allowed

---

### Icon Buttons

Small buttons with just an icon.

**Specifications:**
- Min size: 44x44px (accessibility)
- Icon size: 18-20px
- Padding: Equal on all sides
- Border radius: 8-12px

**Example:**
```typescript
<button className="p-3 rounded-lg hover:bg-slate-100 focus:ring-2 focus:ring-[#FFCD00] min-h-[44px] min-w-[44px]">
  <X className="w-5 h-5" />
</button>
```

---

## Form Input Interactions

### Text Input

**Idle:**
- Border: 2px `slate-300`
- Background: White
- Placeholder: `slate-400`

**Focus:**
- Border: `#007DBA`
- Ring: 2px `#FFCD00`
- Outline: none
- Transition: 150ms

**Filled:**
- Text: `slate-800`
- Placeholder: hidden

**Error:**
- Border: 2px `red-300`
- Shake animation on validation failure

**Disabled:**
- Background: `slate-50`
- Border: `slate-200`
- Text: `slate-400`
- Cursor: not-allowed

**Locked (data integrity):**
- Background: `#E6F4FB` (light blue)
- Border: `#007DBA` at 25% opacity
- Lock icon visible
- Cursor: not-allowed
- Helper text below

```typescript
<input
  type="text"
  className="
    w-full px-4 py-3 rounded-xl border-2
    border-slate-300
    focus:border-[#007DBA] focus:ring-2 focus:ring-[#FFCD00] focus:outline-none
    disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400
    transition-all duration-150
    min-h-[44px]
  "
/>
```

---

### Shake on Error

Shake animation for validation errors.

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.shake {
  animation: shake 0.4s ease-in-out;
}
```

**Trigger:**
```typescript
const [hasError, setHasError] = useState(false);

const handleValidation = () => {
  if (invalid) {
    setHasError(true);
    setTimeout(() => setHasError(false), 400);
  }
};

<input className={hasError ? 'shake border-red-300' : 'border-slate-300'} />
```

---

### Dropdown/Combobox

**Closed:**
- Chevron down icon
- Border: `slate-300`

**Opening:**
- Chevron rotates 180°
- Border changes to `#007DBA`
- Ring: 2px `#FFCD00`
- Popover fades in (150ms)

**Open:**
- Chevron pointing up
- Popover visible
- Search input auto-focused
- Items fade in with stagger

**Item hover:**
- Background: `slate-100`
- Cursor: pointer

**Item selected:**
- Checkmark icon appears
- Text color: `#007DBA`
- Font weight: medium

**Closing:**
- Chevron rotates back
- Popover fades out (150ms)
- Border returns to default

---

### Toggle Buttons (Yes/No)

**Unselected:**
- Border: 2px `slate-200`
- Background: White
- Text: `slate-700`

**Hover (unselected):**
- Border: `slate-300`
- Background: `slate-50`

**Selected:**
- Border: 2px `#007DBA`
- Background: `#E6F4FB`
- Text: `#00205B`
- Font weight: medium

**Transition:**
- All properties: 200ms ease

---

### Date Picker

**Trigger button:**
- Standard input styling
- Calendar icon on right
- Click opens popover

**Popover opening:**
- Fade in: 150ms
- Slide down slightly (y: -10 to 0)
- Shadow appears

**Calendar navigation:**
- Month/year centered
- Arrow buttons on sides
- Hover: Light grey background on arrows

**Day cells:**
- Aspect ratio: 1:1 (square)
- Today: Blue ring, bold text
- Selected: Blue background, white text
- Other month: Light grey text
- Hover: Light blue background

**Today button:**
- Bottom of calendar
- Text link style
- Hover: Underline

**Popover closing:**
- Fade out: 150ms
- Slide up slightly

---

## Mode Card Selection

**Grid layout:**
- 2 columns on mobile
- 3 columns on tablet
- 5 columns on desktop
- Gap: 12px

**Unselected card:**
- Border: 1px `slate-200`
- Shadow: Subtle
- Icon: Grey background, grey icon

**Hover:**
- Background: `slate-50/50`
- Shadow: Elevated
- Transition: 300ms

**Click:**
- Scale: 0.98 briefly
- Transition: 150ms

**Selected:**
- Border: 2px `#007DBA`
- Shadow: Blue tinted
- Icon: Blue background, white icon
- Label: Navy text, semibold

**Transition:**
- All properties: 300ms ease

---

## Wizard Stepper Interactions

### Desktop Stepper

**Completed step (clickable):**
- Cursor: pointer
- Hover: Scale to 1.05, elevated shadow
- Click: Navigate to that step

**Current step:**
- Pulse animation on first render
- No click action

**Upcoming step:**
- Cursor: not-allowed
- No hover effect
- Click does nothing

**Progress bar:**
- Animated fill from left to right
- Duration: 500ms
- Easing: ease-out

---

### Mobile Stepper

**Compact header:**
- Shows current step only
- "View all" button on right

**View all clicked:**
- Expands full step list
- Chevron rotates 180°
- List fades in
- Stagger animation on items

**Collapse:**
- List fades out
- Chevron rotates back
- Smooth height transition

---

## Smart Check Interactions

**Run Check button:**
- Standard button hover/active states
- Click triggers validation

**Processing:**
- Button text: "Checking..."
- Loading spinner appears
- Button disabled temporarily

**Results appear:**
- Fade in: 200ms
- Banner changes color based on result:
  - Default (blue): Ready to check
  - Issues (amber): Problems found
  - Clear (green): No issues

**Issue list:**
- Stagger animation (80ms between items)
- Bullet points
- Each issue fades in

---

## Employee Search Auto-fill

**Badge input (on-behalf mode):**
- Search icon on left
- User types

**Searching:**
- Debounce: 300ms
- Loading spinner appears
- Placeholder changes to "Searching..."

**Results dropdown:**
- Fades in below input
- Max 5 results visible
- Scrollable if more

**Result item:**
- Hover: Light background
- Click: Auto-fill all fields

**Auto-fill sequence:**
1. Badge field populates
2. Loading state: 400ms (simulated Workday lookup)
3. Success banner fades in at top
4. All fields populate simultaneously
5. Each field has subtle flash highlight
6. Focus moves to first editable field

**No results:**
- Error banner fades in
- Red border on input
- Message: "No employee found"

---

## Vehicle Number Auto-complete

**Vehicle input:**
- Searchable dropdown
- User types vehicle number

**Searching:**
- Debounce: 200ms
- Dropdown updates in real-time

**Matching results:**
- Shows vehicle number, fleet type, current route
- Hover: Highlight

**Selection:**
- Auto-fills fleet_type field
- Auto-fills route_number if available
- Success icon appears
- Helper text: "Fleet type auto-filled: [type]"

---

## Impact Diagram Interactions

**Container:**
- Cursor changes to crosshair on hover
- Background: Vehicle image overlay

**Click to add marker:**
1. Calculate click position
2. Add marker at position
3. Marker fades in with scale animation
4. Flash highlight: 700ms
5. Marker count updates

**Marker added:**
- Scale from 0.5 to 1
- Opacity 0 to 1
- Duration: 200ms
- Spring easing

**Hover over marker:**
- Scale to 1.15
- Show delete button (X)
- Cursor: pointer

**Delete marker:**
1. Click X button
2. Marker scales to 0
3. Fades out
4. Duration: 150ms
5. Removed from array
6. Remaining markers don't move

**At max markers:**
- Cursor changes to not-allowed
- Click does nothing
- Message appears: "Maximum 6 markers"

---

## Notification Panel

**Opening:**
1. Overlay fades in (backdrop)
2. Panel slides in from right
3. Duration: 250ms
4. Spring easing

**Notification list:**
- Stagger animation (60ms between items)
- Each notification fades in from right

**Notification hover:**
- Background: Light grey
- Cursor: pointer if has action

**Mark as read:**
- Fade out: 200ms
- Slide left slightly
- Height collapse

**Mark all as read:**
- All notifications fade out together
- Empty state fades in

**Closing:**
1. Panel slides out to right
2. Overlay fades out
3. Duration: 200ms

**Close triggers:**
- Click X button
- Click outside panel
- Press Escape key

---

## Loading States

### Spinner

```typescript
<svg className="animate-spin h-5 w-5 text-[#007DBA]" viewBox="0 0 24 24">
  <circle 
    className="opacity-25" 
    cx="12" cy="12" r="10" 
    stroke="currentColor" 
    strokeWidth="4"
  />
  <path 
    className="opacity-75" 
    fill="currentColor" 
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
  />
</svg>
```

**Where used:**
- Button loading states
- Badge number search
- Vehicle lookup
- Form submission

---

### Skeleton Loaders

For content that's loading.

```typescript
<div className="space-y-3">
  <div className="h-4 bg-slate-200 rounded animate-pulse" />
  <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
  <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6" />
</div>
```

**Where used:**
- Loading employee data
- Loading vehicle information
- Loading draft/submission lists

---

### Progress Indicators

For multi-step operations.

```typescript
<div className="w-full bg-slate-200 rounded-full h-2">
  <div 
    className="bg-[#007DBA] h-2 rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

**Where used:**
- File uploads
- Multi-part form submission
- Report generation

---

## Success/Error Feedback

### Success Toast

```typescript
import { toast } from 'sonner';

toast.success('Report saved successfully', {
  duration: 3000,
  position: 'top-right',
});
```

**Animation:**
- Slide in from right
- Auto-dismiss after 3s
- Hover pauses timer
- Swipe to dismiss

---

### Error Toast

```typescript
toast.error('Failed to save report', {
  duration: 5000,
  description: 'Please check your connection and try again',
});
```

**Animation:**
- Shake on appear
- Red accent color
- Longer duration (5s)
- Dismiss button always visible

---

### Inline Success Banner

**Appearance:**
- Fade in: 200ms
- Green/blue background
- Checkmark icon
- Auto-dismiss: 5s (optional)

**Example:**
```typescript
<motion.div 
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3"
>
  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
  <span>Employee data auto-filled from Workday</span>
</motion.div>
```

---

## Scroll Behaviors

### Auto-scroll on Navigation

When moving between wizard steps:
```typescript
const handleNext = () => {
  setCurrentStep(prev => prev + 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

---

### Smooth Scroll to Error

When validation fails, scroll to first error:
```typescript
const scrollToError = () => {
  const firstError = document.querySelector('[data-error="true"]');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
```

---

### Sticky Header

Wizard stepper remains visible while scrolling:
```typescript
<div className="sticky top-0 z-20 bg-white">
  <WizardStepper currentStep={currentStep} />
</div>
```

---

## Focus Management

### Auto-focus on Open

When modal/panel opens, focus first interactive element:
```typescript
useEffect(() => {
  if (isOpen && firstInputRef.current) {
    firstInputRef.current.focus();
  }
}, [isOpen]);
```

---

### Focus Trap in Modal

Keep focus within modal while open:
```typescript
import { useRef, useEffect } from 'react';

const useFocusTrap = (isOpen: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      const focusable = containerRef.current?.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);
  
  return containerRef;
};
```

---

## Keyboard Interactions

### Escape to Close

Modals and panels close on Escape:
```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  
  if (isOpen) {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }
}, [isOpen, onClose]);
```

---

### Enter to Submit

Forms submit on Enter (when appropriate):
```typescript
<form onSubmit={handleSubmit}>
  <input 
    type="text" 
    onKeyDown={(e) => {
      if (e.key === 'Enter' && canSubmit) {
        handleSubmit();
      }
    }}
  />
</form>
```

---

### Arrow Navigation

In dropdowns and lists:
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    // Move to next item
    setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
  } else if (e.key === 'ArrowUp') {
    // Move to previous item
    setSelectedIndex(prev => Math.max(prev - 1, 0));
  } else if (e.key === 'Enter') {
    // Select current item
    handleSelect(items[selectedIndex]);
  }
};
```

---

## Timing Standards

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button hover | 200ms | ease |
| Button press | 150ms | ease |
| Input focus | 150ms | ease |
| Fade in/out | 220ms | ease-out |
| Slide panel | 250ms | spring |
| Progress bar | 500ms | ease-out |
| Flash highlight | 700ms | ease-out |
| Toast dismiss | 3000ms | — |
| Error shake | 400ms | ease-in-out |
| Stagger delay | 60-80ms | — |

---

## Accessibility Considerations

### Focus Indicators

All interactive elements must have visible focus:
```typescript
focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCD00]
```

**ADA compliance:**
- Ring width: 2px minimum
- Color: High contrast (#FFCD00 on various backgrounds)
- Offset: 2px from element edge (optional)

---

### Min Touch Targets

All interactive elements: 44x44px minimum
```typescript
className="min-h-[44px] min-w-[44px]"
```

---

### Reduced Motion

Respect user's motion preferences:
```typescript
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Screen Reader Announcements

For dynamic content changes:
```typescript
<div role="status" aria-live="polite" className="sr-only">
  {loading ? 'Loading employee data' : 'Employee data loaded'}
</div>
```

---

## Performance Tips

### Debounce Search Inputs

```typescript
import { useState, useEffect } from 'react';

const useDebounce = (value: string, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

---

### Lazy Load Heavy Components

```typescript
import { lazy, Suspense } from 'react';

const VehicleImpactDiagram = lazy(() => import('./VehicleImpactDiagram'));

<Suspense fallback={<div>Loading diagram...</div>}>
  <VehicleImpactDiagram markers={markers} onChange={setMarkers} />
</Suspense>
```

---

### Optimize Animations

Use `transform` and `opacity` for best performance:
```typescript
// Good (GPU accelerated)
transform: translateX(10px);
opacity: 0.5;

// Avoid (triggers layout/paint)
left: 10px;
background-color: red;
```
