# Data Models and Type Definitions

TypeScript interfaces, data structures, and data flow for the DART Accident Reporting application.

---

## Core Data Model

### AccidentReportData

Main data structure for accident reports. Located at `src/app/types/accident-report.ts`.

```typescript
export interface AccidentReportData {
  // ── STEP 1: Incident Basics ──────────────────────────────────────
  event_type?: string;
  operating_dart_vehicle?: boolean;
  mode?: string;
  is_on_behalf?: boolean;
  on_behalf_employee?: string;

  // Employee Information
  employee_badge_number?: string;
  employee_name?: string;
  employee_address?: string;
  employee_phone?: string;
  employee_age?: string;
  employee_gender?: string;
  date_of_hire?: string;
  employee_status?: string;
  department?: string;
  assigned_division?: string;
  division_work?: string;
  cost_center?: string;
  service_years?: string;
  service_months?: string;
  service_days?: string;
  is_student_employee?: boolean;
  regular_day_off_type?: 'Consecutive' | 'Split';
  rdo_consecutive?: string;
  rdo_split_1?: string;
  rdo_split_2?: string;

  // ── STEP 2: Vehicle and Location ─────────────────────────────────
  description_of_event?: string;
  incident_date?: string;  // YYYY-MM-DD
  incident_time?: string;  // HH:MM

  // Bus fields
  vehicle_number?: string;
  trip_id?: string;
  block_number?: string;
  employee_pullout_date?: string;
  employee_pullout_time?: string;
  event_at_bus_stop?: boolean;
  bus_stop_name?: string;
  street_on?: string;
  cross_street?: string;
  city?: string;
  zip?: string;
  bus_status_before?: string;
  bus_status_after?: string;
  fleet_type?: string;
  route_number?: string;
  run_number?: string;
  end_of_line_destination?: string;
  has_bike_lane?: boolean;
  collision_type?: string;
  bus_damage?: boolean;
  bus_damage_confirmed?: boolean;
  bus_action?: string;
  point_of_impact?: string;
  bus_speed?: string;
  runaway_vehicle?: boolean;
  operator_in_vehicle_runaway?: string;
  parking_brake_engaged?: boolean;
  evacuation_life_safety?: boolean;

  // LRV fields
  train_number?: string;
  train_pullout_date?: string;
  train_pullout_time?: string;
  location_category?: string;
  station_applicable?: string;
  grade_crossing_applicable?: string;
  tunnel_location?: string;
  address_of_event?: string;
  train_status_before?: string;
  train_status_after?: string;
  car_number?: string;
  lrv_consist_count?: number;
  lrv_consist_1?: string;
  lrv_consist_2?: string;
  lrv_consist_3?: string;
  lrv_consist_4?: string;
  lrv_fleet_type?: string;
  rail_line?: string;
  lrv_end_of_line?: string;
  lrv_collision_type?: string;
  train_damage?: boolean;
  disabling_damage?: boolean;
  train_action?: string;
  lrv_point_of_impact?: string;
  train_speed?: string;
  collision_resulted_in_derailment?: boolean;
  runaway_train?: boolean;
  operator_in_train_runaway?: string;
  lrv_evacuation?: boolean;

  // Weather (shared)
  weather?: string;
  road_conditions?: string;
  lighting_conditions?: string;
  streetlights?: string;
  traffic_conditions?: string;
  traffic_controls?: string;
  roadway_configuration?: string;

  // ── STEP 3: People & Impact ──────────────────────────────────────
  // Operator / Other Employees
  operator_injured?: boolean;
  operator_injured_body_part?: string;
  operator_transported?: boolean;
  other_employees_injured_count?: number;

  // Passenger
  passengers_on_board?: number;
  passenger_fatalities?: number;
  passengers_injured?: number;
  passenger_action?: string;
  which_door?: string;
  passengers_fled?: number;
  courtesy_cards?: number;
  passengers_transported?: number;

  // Pedestrian
  pedestrians_involved?: number;
  pedestrian_groups?: PedestrianRecord[];
  pedestrians_fled?: number;
  pedestrian_fatalities?: number;
  pedestrian_injuries?: number;
  pedestrians_transported?: number;

  // Other Vehicle
  other_vehicle_occupants?: number;
  other_vehicle_fatalities?: number;
  other_vehicle_injuries?: number;
  other_vehicle_fled?: number;
  other_vehicle_transported?: number;
  dart_dart_collision?: boolean;
  other_vehicle_type?: string;
  other_vehicle_action?: string;
  other_vehicle_point_of_impact?: string;
  other_vehicle_direction?: string;
  other_vehicle_damage?: boolean;
  other_vehicle_damage_area?: string;
  other_vehicle_tow_away?: string;
  third_vehicle_involved?: boolean;
  third_vehicle_collided?: boolean;
  third_vehicle?: ThirdVehicleData;

  // Police
  police_at_scene?: boolean;
  police_type?: string;
  dart_supervisor_investigating?: boolean;

  // Impact diagram
  impact_markers?: { x: number; y: number }[];

  // ── STEP 4: Review and Submit ────────────────────────────────────
  confirmation_checked?: boolean;
}
```

---

## Supporting Interfaces

### Person

Legacy structure for person involved in incident.

```typescript
export interface Person {
  id: string;
  role: 'Passenger' | 'Operator' | 'Pedestrian' | 'Other driver' | 'Other';
  name: string;
  injured?: boolean;                 // was this person injured? (drives "number injured")
  fatal?: boolean;                   // fatal injury? (drives "number of fatalities")
  injured_body_part?: string;
  transported_to_hospital: boolean;
  hospital_name?: string;
  fled_scene?: boolean;
  // Passenger-specific
  passenger_action?: string;
  which_door?: string;
  courtesy_card?: boolean;
  // Pedestrian-specific
  pedestrian_type?: string;
  pedestrian_action?: string;
}
```

---

### PedestrianRecord

Detailed pedestrian information.

```typescript
export interface PedestrianRecord {
  id: string;
  pedestrian_type?: string;     // Adult, Child, Elderly, etc.
  pedestrian_action?: string;    // Crossing street, Walking along road, etc.
  fled?: boolean;
}
```

---

### ThirdVehicleData

Information about third vehicle involved in collision.

```typescript
export interface ThirdVehicleData {
  occupants?: number;
  fatalities?: number;
  injuries?: number;
  fled?: number;
  transported?: number;
  dart_collision?: boolean;
  type?: string;
  action?: string;
  point_of_impact?: string;
  direction?: string;
  damage?: boolean;
  damage_area?: string;
  tow_away?: string;
}
```

---

### ImpactMarker

Visual markers on vehicle diagram.

```typescript
export interface ImpactMarker {
  x: number;  // 0–100 (percentage of container width)
  y: number;  // 0–100 (percentage of container height)
}
```

**Usage:**
```typescript
const markers: ImpactMarker[] = [
  { x: 15, y: 30 },  // Front-left
  { x: 85, y: 70 }   // Rear-right
];
```

---

## Employee and Vehicle Data

### Employee

Employee record from Workday integration.

```typescript
export interface Employee {
  badge: string;
  name: string;
  phone: string;
  address?: string;
  gender?: string;
  dateOfHire?: string;
  department?: string;
  division?: string;
  costCenter?: string;
  serviceYears?: number;
  serviceMonths?: number;
  serviceDays?: number;
}
```

**Database structure:**
```typescript
export const EMPLOYEE_DB: Record<string, Employee> = {
  '12345': {
    badge: '12345',
    name: 'John Smith',
    phone: '(214) 555-0100',
    address: '123 Main St, Dallas, TX 75201',
    gender: 'Male',
    dateOfHire: '2015-03-15',
    department: 'Bus Operations',
    division: 'Northwest',
    costCenter: 'CC-1001',
    serviceYears: 9,
    serviceMonths: 2,
    serviceDays: 10,
  },
  // ... more employees
};
```

---

### Vehicle

Vehicle record from fleet database.

```typescript
export interface Vehicle {
  vehicleNumber: string;
  fleetType: string;
  currentRoute?: string;
  division?: string;
  status?: 'Active' | 'Maintenance' | 'Retired';
}
```

**Database structure:**
```typescript
export const VEHICLE_DB: Record<string, Vehicle> = {
  '1234': {
    vehicleNumber: '1234',
    fleetType: '40 ft Low Floor',
    currentRoute: '20',
    division: 'Northwest',
    status: 'Active',
  },
  // ... more vehicles
};
```

---

## Option Types

### Event Types

```typescript
type EventType = 
  | 'Collision'
  | 'Assault (Verbal or Physical)'
  | 'Near Miss'
  | 'Derailment'
  | 'Fire'
  | 'Operator/Passenger Events (non-collision)'
  | 'Trail a Switch'
  | 'Signal Violation';
```

---

### Vehicle Modes

```typescript
type VehicleMode = 
  | 'Bus'
  | 'Light Rail Vehicle'
  | 'Streetcar'
  | 'Hi-Rail'
  | 'Non-Revenue Vehicle';
```

---

### Collision Types (Bus)

```typescript
type BusCollisionType = 
  | 'Collision – with Auto'
  | 'Collision – with Pedestrian'
  | 'Collision – with Cyclist'
  | 'Collision – with Fixed Object'
  | 'Collision – with Animal'
  | 'Collision – with Train';
```

---

### Collision Types (LRV)

```typescript
type LRVCollisionType = 
  | 'Collision – with Auto'
  | 'Collision – with Pedestrian'
  | 'Collision – with Cyclist'
  | 'Collision – with Object on Track'
  | 'Collision – with Animal'
  | 'Collision – with Other Train';
```

---

### Injury Levels

```typescript
type InjuryLevel = 
  | 'None'
  | 'Minor'
  | 'Serious'
  | 'Fatal';
```

---

### Police Types

```typescript
type PoliceType = 
  | 'DART Police'
  | 'Dallas Police'
  | 'Irving Police'
  | 'Plano Police'
  | 'Garland Police'
  | 'Richardson Police'
  | 'Other';
```

---

## User Context

### UserRole

Current logged-in user information.

```typescript
export interface UserRole {
  badge: string;
  name: string;
  role: 'Operator' | 'Supervisor' | 'Program Manager';
  canFileOnBehalf: boolean;
  division?: string;
}
```

**Usage in React Context:**
```typescript
import { createContext, useContext } from 'react';

const UserRoleContext = createContext<{
  roleConfig: UserRole;
  setRole: (role: UserRole) => void;
} | undefined>(undefined);

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within UserRoleProvider');
  }
  return context;
};
```

---

## Dropdown Option Structures

### ComboboxOption

Generic option for searchable dropdowns.

```typescript
export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}
```

**Example usage:**
```typescript
const EVENT_TYPES: ComboboxOption[] = [
  { 
    value: 'Collision', 
    label: 'Collision',
    description: 'Vehicle collision with auto, pedestrian, or object'
  },
  { 
    value: 'Assault (Verbal or Physical)', 
    label: 'Assault',
    description: 'Verbal or physical assault on operator or passenger'
  },
  // ...
];
```

---

### CustomSelectOption

Simple option for basic dropdowns.

```typescript
export interface CustomSelectOption {
  value: string;
  label: string;
}
```

**Example usage:**
```typescript
const WEATHER_OPTIONS: CustomSelectOption[] = [
  { value: 'Clear', label: 'Clear' },
  { value: 'Rain', label: 'Rain' },
  { value: 'Snow', label: 'Snow' },
  { value: 'Fog', label: 'Fog' },
];
```

---

## Notification Types

### Notification

```typescript
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description: string;
  timestamp: string;  // ISO 8601
  read: boolean;
  actionLabel?: string;
  actionLink?: string;
}
```

**Example:**
```typescript
const notification: Notification = {
  id: 'notif-123',
  type: 'warning',
  title: 'Report pending review',
  description: 'Report AE-2024-1892 requires supervisor approval',
  timestamp: '2024-05-20T14:30:00Z',
  read: false,
  actionLabel: 'View report',
  actionLink: '/submissions/AE-2024-1892',
};
```

---

## Draft and Submission Types

### DraftReport

Saved draft of incomplete report.

```typescript
export interface DraftReport {
  id: string;
  data: Partial<AccidentReportData>;
  lastSaved: string;  // ISO 8601 timestamp
  currentStep: number;  // 1-4
  title: string;  // Generated from event_type and date
}
```

**Example:**
```typescript
const draft: DraftReport = {
  id: 'draft-abc123',
  data: {
    event_type: 'Collision',
    mode: 'Bus',
    employee_badge_number: '12345',
    employee_name: 'John Smith',
  },
  lastSaved: '2024-05-20T10:15:00Z',
  currentStep: 2,
  title: 'Collision - 05/20/2024',
};
```

---

### SubmittedReport

Completed and submitted report.

```typescript
export interface SubmittedReport {
  id: string;  // Format: AE-YYYY-NNNN
  data: AccidentReportData;
  submittedAt: string;  // ISO 8601 timestamp
  submittedBy: string;  // Employee badge number
  status: 'Pending' | 'Under Review' | 'Approved' | 'Requires Changes';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
}
```

**Example:**
```typescript
const submission: SubmittedReport = {
  id: 'AE-2024-1892',
  data: { /* full AccidentReportData */ },
  submittedAt: '2024-05-20T11:30:00Z',
  submittedBy: '12345',
  status: 'Under Review',
  reviewedBy: '67890',
  reviewedAt: '2024-05-20T14:00:00Z',
};
```

---

## Data Flow

### Step 1 → Step 2

**Data passed forward:**
```typescript
{
  event_type: string,
  mode: string,
  operating_dart_vehicle?: boolean,
  employee_badge_number: string,
  employee_name: string,
  employee_phone?: string,
  employee_address?: string,
  // ... all employee fields
}
```

**Used in Step 2 to determine:**
- Which form to show (bus vs LRV)
- Whether collision fields are required
- Pre-populate employee info in headers

---

### Step 2 → Step 3

**Data passed forward:**
```typescript
{
  // All Step 1 data, plus:
  collision_type?: string,  // or lrv_collision_type
  description_of_event: string,
  incident_date: string,
  incident_time: string,
  vehicle_number?: string,
  // ... all location/vehicle fields
}
```

**Used in Step 3 to determine:**
- Show pedestrian section? (collision_type includes "Pedestrian")
- Show other vehicle section? (collision_type includes "Auto")
- Pre-populate incident context in review

---

### Step 3 → Step 4

**Data passed forward:**
```typescript
{
  // All previous steps, plus:
  operator_injured: boolean,
  operator_injured_body_part?: string,
  passengers_on_board: number,
  pedestrians_involved?: number,
  other_vehicle_occupants?: number,
  police_at_scene: boolean,
  // ... all people/impact fields
}
```

**Used in Step 4:**
- Generate summary sections
- Calculate severity level
- Validate completeness
- Display for final review

---

## Auto-fill Data Flow

### Self-Filing (Operator)

1. User logs in via Workday SSO
2. `UserRoleContext` receives badge number and role
3. On Step 1 mount, auto-fill triggers:
   ```typescript
   const emp = EMPLOYEE_DB[roleConfig.badge];
   onUpdate({
     employee_badge_number: emp.badge,
     employee_name: emp.name,
     employee_phone: emp.phone,
     // ... all fields
   });
   ```
4. Badge field is locked (visual only, data cannot change)
5. Other fields are editable via "Edit details"

---

### On-Behalf Filing (Supervisor)

1. Supervisor selects "Yes" for on-behalf question
2. Badge field becomes searchable
3. User types badge number or name
4. Debounced search (300ms) queries `EMPLOYEE_DB`
5. Results populate dropdown
6. User selects employee
7. Lookup state changes to "searching"
8. Simulated Workday API call (400ms)
9. All employee fields populate:
   ```typescript
   const emp = EMPLOYEE_DB[selectedBadge];
   onUpdate({
     employee_badge_number: emp.badge,
     employee_name: emp.name,
     employee_phone: emp.phone,
     // ... all fields
   });
   ```
10. Success banner appears
11. Fields remain editable

---

### Vehicle Auto-fill

1. User selects or types vehicle number
2. Vehicle lookup:
   ```typescript
   const vehicle = VEHICLE_DB[vehicleNumber];
   ```
3. Auto-fill fleet type and route:
   ```typescript
   onUpdate({
     vehicle_number: vehicleNumber,
     fleet_type: vehicle.fleetType,
     route_number: vehicle.currentRoute,
   });
   ```
4. Helper text appears: "Fleet type auto-filled: [type]"

---

## Persistence

### Local Draft Saving

Auto-save to localStorage every 30 seconds:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (hasChanges) {
      saveDraft(formData, currentStep);
    }
  }, 30000);  // 30 seconds
  
  return () => clearInterval(interval);
}, [formData, currentStep, hasChanges]);

const saveDraft = (data: AccidentReportData, step: number) => {
  const draft: DraftReport = {
    id: `draft-${Date.now()}`,
    data,
    lastSaved: new Date().toISOString(),
    currentStep: step,
    title: generateTitle(data),
  };
  
  localStorage.setItem(`draft-${draft.id}`, JSON.stringify(draft));
};
```

---

### Loading Draft

Resume from localStorage:
```typescript
const loadDraft = (draftId: string): DraftReport | null => {
  const stored = localStorage.getItem(`draft-${draftId}`);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as DraftReport;
  } catch {
    return null;
  }
};

// Usage in wizard
const draft = loadDraft(draftId);
if (draft) {
  setFormData(draft.data);
  setCurrentStep(draft.currentStep);
}
```

---

### Submission

Submit to backend API:
```typescript
const submitReport = async (data: AccidentReportData) => {
  const payload = {
    ...data,
    submittedAt: new Date().toISOString(),
    submittedBy: userContext.badge,
  };
  
  try {
    const response = await fetch('/api/accidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) throw new Error('Submission failed');
    
    const result = await response.json();
    return result.accidentEventId;  // e.g., "AE-2024-1892"
  } catch (error) {
    console.error('Submission error:', error);
    throw error;
  }
};
```

---

## Mock Data Examples

### Complete Collision Report

```typescript
const mockCollisionReport: AccidentReportData = {
  // Step 1
  event_type: 'Collision',
  mode: 'Bus',
  operating_dart_vehicle: true,
  is_on_behalf: false,
  employee_badge_number: '12345',
  employee_name: 'John Smith',
  employee_phone: '(214) 555-0100',
  employee_gender: 'Male',
  date_of_hire: '2015-03-15',
  department: 'Bus Operations',
  assigned_division: 'Northwest',
  
  // Step 2
  description_of_event: 'Vehicle turned left in front of bus at intersection',
  incident_date: '2024-05-20',
  incident_time: '14:30',
  vehicle_number: '1234',
  street_on: 'Main Street',
  cross_street: 'Elm Street',
  city: 'Dallas',
  zip: '75201',
  collision_type: 'Collision – with Auto',
  bus_status_before: 'In Service',
  fleet_type: '40 ft Low Floor',
  route_number: '20',
  bus_action: 'Going Straight',
  point_of_impact: 'Front',
  bus_speed: '15 mph',
  weather: 'Clear',
  impact_markers: [
    { x: 15, y: 45 }
  ],
  
  // Step 3
  operator_injured: false,
  passengers_on_board: 12,
  passenger_fatalities: 0,
  passengers_injured: 2,
  passengers_transported: 1,
  other_vehicle_occupants: 2,
  other_vehicle_type: 'Sedan',
  other_vehicle_action: 'Turning Left',
  other_vehicle_damage: true,
  police_at_scene: true,
  police_type: 'Dallas Police',
  
  // Step 4
  confirmation_checked: true,
};
```

---

### Complete Non-Collision Report

```typescript
const mockNonCollisionReport: AccidentReportData = {
  // Step 1
  event_type: 'Assault (Verbal or Physical)',
  operating_dart_vehicle: true,
  mode: 'Light Rail Vehicle',
  is_on_behalf: false,
  employee_badge_number: '67890',
  employee_name: 'Jane Doe',
  employee_phone: '(214) 555-0200',
  
  // Step 2 (simplified for non-collision)
  description_of_event: 'Passenger became verbally aggressive when asked to pay fare',
  incident_date: '2024-05-21',
  incident_time: '09:15',
  train_number: '501',
  location_category: 'Station',
  station_applicable: 'Mockingbird Station',
  address_of_event: 'Mockingbird Lane at N. Central Expressway, Dallas, TX',
  rail_line: 'Red Line',
  weather: 'Clear',
  
  // Step 3
  operator_injured: false,
  passengers_on_board: 45,
  passenger_fatalities: 0,
  passengers_injured: 0,
  police_at_scene: true,
  police_type: 'DART Police',
  
  // Step 4
  confirmation_checked: true,
};
```

---

## Type Guards

### Check if collision event

```typescript
const isCollisionEvent = (data: AccidentReportData): boolean => {
  return data.event_type === 'Collision';
};
```

---

### Check if bus mode

```typescript
const isBusMode = (data: AccidentReportData): boolean => {
  return !['Light Rail Vehicle', 'Streetcar', 'Hi-Rail'].includes(data.mode || '');
};
```

---

### Check if on-behalf filing

```typescript
const isOnBehalfFiling = (data: AccidentReportData): boolean => {
  return data.is_on_behalf === true;
};
```

---

### Check if pedestrian section required

```typescript
const needsPedestrianSection = (data: AccidentReportData): boolean => {
  const collisionTypes = [
    data.collision_type,
    data.lrv_collision_type
  ];
  return collisionTypes.some(type => type?.includes('Pedestrian'));
};
```

---

### Check if other vehicle section required

```typescript
const needsOtherVehicleSection = (data: AccidentReportData): boolean => {
  const collisionTypes = [
    data.collision_type,
    data.lrv_collision_type
  ];
  return collisionTypes.some(type => type?.includes('Auto'));
};
```

---

## Validation Helper Functions

### Check step completeness

```typescript
const isStep1Complete = (data: AccidentReportData): boolean => {
  return !!(
    data.event_type &&
    data.mode &&
    data.employee_badge_number &&
    data.employee_name
  );
};

const isStep2Complete = (data: AccidentReportData): boolean => {
  const baseComplete = !!(
    data.description_of_event &&
    data.incident_date &&
    data.incident_time
  );
  
  if (!isCollisionEvent(data)) {
    return baseComplete;
  }
  
  const collisionComplete = !!(
    data.vehicle_number &&
    (data.collision_type || data.lrv_collision_type) &&
    data.weather
  );
  
  return baseComplete && collisionComplete;
};

const isStep3Complete = (data: AccidentReportData): boolean => {
  return !!(
    data.operator_injured !== undefined &&
    data.passengers_on_board !== undefined &&
    data.police_at_scene !== undefined
  );
};

const isStep4Complete = (data: AccidentReportData): boolean => {
  return data.confirmation_checked === true;
};
```

---

### Calculate overall completeness

```typescript
const calculateCompleteness = (data: AccidentReportData): number => {
  const steps = [
    isStep1Complete(data),
    isStep2Complete(data),
    isStep3Complete(data),
    isStep4Complete(data),
  ];
  
  const completedSteps = steps.filter(Boolean).length;
  return (completedSteps / steps.length) * 100;
};
```

---

## Default Values

### New report defaults

```typescript
const getDefaultReportData = (): Partial<AccidentReportData> => {
  return {
    passengers_on_board: 0,
    passenger_fatalities: 0,
    passengers_injured: 0,
    passengers_transported: 0,
    pedestrians_involved: 0,
    pedestrian_fatalities: 0,
    pedestrian_injuries: 0,
    other_employees_injured_count: 0,
    impact_markers: [],
  };
};
```

---

## API Response Types

### Submission Response

```typescript
export interface SubmissionResponse {
  success: boolean;
  accidentEventId: string;
  submittedAt: string;
  message?: string;
}
```

**Example:**
```typescript
const response: SubmissionResponse = {
  success: true,
  accidentEventId: 'AE-2024-1892',
  submittedAt: '2024-05-20T11:30:00Z',
  message: 'Report submitted successfully',
};
```

---

### Error Response

```typescript
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string[];
  code?: string;
}
```

**Example:**
```typescript
const errorResponse: ErrorResponse = {
  success: false,
  error: 'Validation failed',
  details: [
    'Employee badge number is required',
    'Incident date cannot be in the future'
  ],
  code: 'VALIDATION_ERROR',
};
```

---

## State Management Patterns

### Form state in wizard

```typescript
const [formData, setFormData] = useState<AccidentReportData>({});
const [currentStep, setCurrentStep] = useState(1);

const handleUpdate = (updates: Partial<AccidentReportData>) => {
  setFormData(prev => ({ ...prev, ...updates }));
};
```

---

### Employee lookup state

```typescript
type LookupState = 'idle' | 'searching' | 'found' | 'not-found';

const [lookupState, setLookupState] = useState<LookupState>('idle');
const [suggestions, setSuggestions] = useState<Employee[]>([]);
```

---

### Loading states

```typescript
const [isLoading, setIsLoading] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

---

## Quick Reference

| Data Type | File Location | Purpose |
|-----------|---------------|---------|
| AccidentReportData | `types/accident-report.ts` | Main form data structure |
| Employee | `data/employeeDatabase.ts` | Workday employee records |
| Vehicle | `data/vehicleDatabase.ts` | Fleet vehicle records |
| DraftReport | `types/draft.ts` | Saved incomplete reports |
| SubmittedReport | `types/submission.ts` | Completed reports |
| Notification | `types/notification.ts` | User notifications |
| UserRole | `context/UserRoleContext.tsx` | Current user info |
| ComboboxOption | `components/SearchableCombobox.tsx` | Dropdown options |
| ImpactMarker | `components/VehicleImpactDiagram.tsx` | Impact diagram markers |

---

## Testing Data Sets

### Minimal valid collision report

```typescript
const minimalCollision: AccidentReportData = {
  event_type: 'Collision',
  mode: 'Bus',
  employee_badge_number: '12345',
  employee_name: 'Test User',
  description_of_event: 'Test description',
  incident_date: '2024-05-20',
  incident_time: '10:00',
  vehicle_number: '1234',
  collision_type: 'Collision – with Auto',
  weather: 'Clear',
  operator_injured: false,
  passengers_on_board: 0,
  police_at_scene: false,
  confirmation_checked: true,
};
```

---

### Edge case: Maximum complexity

```typescript
const maxComplexityReport: AccidentReportData = {
  // All Step 1 fields filled
  event_type: 'Collision',
  mode: 'Bus',
  operating_dart_vehicle: true,
  is_on_behalf: true,
  employee_badge_number: '99999',
  employee_name: 'Complex Test Case',
  // ... all employee fields
  
  // All Step 2 fields filled
  collision_type: 'Collision – with Auto',
  // ... all vehicle/location fields
  impact_markers: [
    { x: 10, y: 20 },
    { x: 30, y: 40 },
    { x: 50, y: 60 },
    { x: 70, y: 80 },
    { x: 90, y: 50 },
    { x: 50, y: 90 },
  ],  // Maximum 6 markers
  
  // All Step 3 fields filled
  operator_injured: true,
  operator_injured_body_part: 'Neck',
  operator_transported: true,
  passengers_on_board: 50,
  passenger_fatalities: 1,
  passengers_injured: 10,
  pedestrians_involved: 2,
  pedestrian_fatalities: 1,
  other_vehicle_occupants: 4,
  third_vehicle_involved: true,
  third_vehicle_collided: true,
  police_at_scene: true,
  police_type: 'Dallas Police',
  dart_supervisor_investigating: true,
  
  confirmation_checked: true,
};
```
