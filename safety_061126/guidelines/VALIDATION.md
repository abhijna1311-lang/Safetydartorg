# Form Validation Rules

Comprehensive validation logic for the DART Accident Reporting wizard.

---

## Validation Strategy

### Progressive Validation
- Fields validate on blur (after user leaves field)
- Step validation occurs before proceeding to next step
- Final validation happens before submission
- Smart Check provides optional mid-step validation

### Error Display
- Inline errors appear below invalid fields
- Error text: 12px, `red-500` (#EF4444)
- Error borders: 2px `red-300`
- Icon indicators for critical errors
- Smart Check banner for missing/conflicting data

---

## Step 1: Incident Basics

### Required Fields

**All users:**
- `event_type` - Event type selection
- `mode` - Vehicle mode selection
- `employee_badge_number` - Employee badge number
- `employee_name` - Employee full name

**Conditional requirements:**

**If event type is "Assault", "Fire", or "Operator/Passenger Events":**
- `operating_dart_vehicle` (boolean) - Were you operating a DART vehicle?

**If user is Supervisor or Program Manager:**
- `is_on_behalf` (boolean) - Filing on behalf of another employee?

**If filing on behalf (is_on_behalf = true):**
- Employee search must return valid result
- All employee data must auto-fill from Workday

---

### Validation Rules

#### Event Type
```typescript
if (!data.event_type) {
  error = "Event type is required";
}
```

#### Operating DART Vehicle
```typescript
const needsDrivingQ = ['Assault (Verbal or Physical)', 'Fire', 'Operator/Passenger Events (non-collision)'];

if (needsDrivingQ.includes(data.event_type) && data.operating_dart_vehicle === undefined) {
  error = "Please indicate if you were operating a DART vehicle";
}
```

#### Vehicle Mode
```typescript
if (!data.mode) {
  error = "Vehicle mode is required";
}
```

#### Employee Badge Number
```typescript
if (!data.employee_badge_number) {
  error = "Employee badge number is required";
}

// Self-filing validation
if (!isOnBehalf && data.employee_badge_number !== loggedInUserBadge) {
  error = "Badge number is locked to your Workday login for data integrity";
}

// On-behalf validation
if (isOnBehalf && !employeeSearchResults.includes(data.employee_badge_number)) {
  error = "Please select a valid employee from the search results";
}
```

#### Employee Name
```typescript
if (!data.employee_name || data.employee_name.trim().length === 0) {
  error = "Employee name is required";
}
```

---

### Step 1 Proceed Validation

```typescript
const canProceed = 
  !!data.event_type && 
  !!data.mode && 
  !!data.employee_badge_number && 
  !!data.employee_name;

// If driving question is shown, it must be answered
if (needsDrivingQ && data.operating_dart_vehicle === undefined) {
  canProceed = false;
}
```

---

## Step 2: Vehicle and Location

### Event Type Branching

Step 2 content varies based on event type:

**Collision events:**
- Show full collision form with impact diagrams and collision-specific fields
- Require collision type selection

**Non-collision events:**
- Show simplified form (description, date, location)
- Skip collision-specific fields

---

### Required Fields (All Events)

**Shared:**
- `description_of_event` - Description of what happened
- `incident_date` - Date of incident (YYYY-MM-DD)
- `incident_time` - Time of incident (HH:MM)

---

### Required Fields (Collision Events)

**Bus/Non-Revenue Vehicle:**
- `collision_type` - Type of collision (with Auto, with Pedestrian, etc.)
- `vehicle_number` - DART vehicle number
- `street_on` - Street name where event occurred
- `city` - City
- `bus_status_before` - Bus status before collision
- `fleet_type` - Fleet type (auto-filled from vehicle number)
- `route_number` - Route number
- `bus_action` - Bus action at time of event
- `point_of_impact` - Point of impact on bus
- `bus_speed` - Speed at time of collision
- `weather` - Weather conditions

**Light Rail/Streetcar/Hi-Rail:**
- `lrv_collision_type` - LRV collision type
- `train_number` - Train number
- `location_category` - Location category (Station, Grade Crossing, etc.)
- `address_of_event` - Address or location description
- `train_status_before` - Train status before collision
- `rail_line` - Rail line (Red, Blue, Green, Orange)
- `train_action` - Train action at time of event
- `lrv_point_of_impact` - Point of impact on train
- `train_speed` - Speed at time of collision
- `weather` - Weather conditions

---

### Conditional Requirements (Step 2)

**If event_at_bus_stop = true:**
- `bus_stop_name` - Bus stop name

**If collision_type = "Collision – with Pedestrian":**
- `point_of_impact` - Where pedestrian was struck

**If collision_type = "Collision – with Auto":**
- `other_vehicle_type` - Type of other vehicle

**If bus_damage = true:**
- `bus_damage_confirmed` (boolean) - Confirm damage assessment

**If runaway_vehicle = true:**
- `operator_in_vehicle_runaway` - Was operator in vehicle during runaway?
- `parking_brake_engaged` - Was parking brake engaged?

**If train_damage = true:**
- `disabling_damage` - Does damage disable the train?

**If runaway_train = true:**
- `operator_in_train_runaway` - Was operator in train during runaway?

**If collision_resulted_in_derailment = true:**
- Requires additional documentation (handled in later steps)

---

### Validation Rules

#### Date Validation
```typescript
if (!data.incident_date) {
  error = "Incident date is required";
}

// Date format: YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (data.incident_date && !dateRegex.test(data.incident_date)) {
  error = "Date must be in YYYY-MM-DD format";
}

// Date cannot be in the future
const incidentDate = new Date(data.incident_date);
const today = new Date();
if (incidentDate > today) {
  error = "Incident date cannot be in the future";
}
```

#### Time Validation
```typescript
if (!data.incident_time) {
  error = "Incident time is required";
}

// Time format: HH:MM (24-hour)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
if (data.incident_time && !timeRegex.test(data.incident_time)) {
  error = "Time must be in HH:MM format (24-hour)";
}
```

#### Vehicle Number Validation
```typescript
if (isCollision && !data.vehicle_number) {
  error = "Vehicle number is required for collision events";
}

// Vehicle must exist in fleet database
if (data.vehicle_number && !VEHICLE_DB[data.vehicle_number]) {
  error = "Vehicle number not found in fleet database";
}
```

#### Description Validation
```typescript
if (!data.description_of_event || data.description_of_event.trim().length === 0) {
  error = "Event description is required";
}

if (data.description_of_event && data.description_of_event.length < 10) {
  error = "Please provide a more detailed description (at least 10 characters)";
}

if (data.description_of_event && data.description_of_event.length > 2000) {
  error = "Description is too long (maximum 2000 characters)";
}
```

#### Collision Type Validation
```typescript
const isCollision = data.event_type === 'Collision';
const isBus = !['Light Rail Vehicle', 'Streetcar', 'Hi-Rail'].includes(data.mode);

if (isCollision && isBus && !data.collision_type) {
  error = "Collision type is required";
}

if (isCollision && !isBus && !data.lrv_collision_type) {
  error = "LRV collision type is required";
}
```

#### Impact Diagram Validation
```typescript
// Optional but recommended for collision events
if (isCollision && (!data.impact_markers || data.impact_markers.length === 0)) {
  warning = "Consider adding impact markers to the vehicle diagram";
}

if (data.impact_markers && data.impact_markers.length > 6) {
  error = "Maximum 6 impact markers allowed";
}
```

---

### Step 2 Proceed Validation

```typescript
// Non-collision events
if (data.event_type !== 'Collision') {
  canProceed = 
    !!data.description_of_event &&
    !!data.incident_date &&
    !!data.incident_time;
}

// Collision events
if (data.event_type === 'Collision') {
  const isBus = !['Light Rail Vehicle', 'Streetcar', 'Hi-Rail'].includes(data.mode);
  
  canProceed = 
    !!data.description_of_event &&
    !!data.incident_date &&
    !!data.incident_time &&
    !!data.vehicle_number &&
    (isBus ? !!data.collision_type : !!data.lrv_collision_type) &&
    !!data.street_on &&
    !!data.city &&
    !!data.weather;
}
```

---

## Step 3: People and Impact

### Always Required

**Operator/Employee Injury:**
- `operator_injured` (boolean) - Was operator injured?

**If operator_injured = true:**
- `operator_injured_body_part` - Body part injured
- `operator_transported` (boolean) - Transported to hospital?

**Passenger Injury:**
- `passengers_on_board` (number) - Number of passengers on board

**Police:**
- `police_at_scene` (boolean) - Were police at the scene?

---

### Conditional Sections (Based on Collision Type from Step 2)

**If collision_type = "Collision – with Pedestrian":**
- Show Pedestrian Injury Section
- `pedestrians_involved` (number) - Number of pedestrians involved
- `pedestrian_fatalities` (number) - Fatalities
- `pedestrian_injuries` (number) - Injuries
- `pedestrians_transported` (number) - Transported to hospital

**If collision_type = "Collision – with Auto":**
- Show Other Vehicle Section
- `other_vehicle_occupants` (number) - Occupants in other vehicle
- `other_vehicle_type` - Type of other vehicle
- `other_vehicle_action` - What was other vehicle doing?
- `other_vehicle_damage` (boolean) - Was other vehicle damaged?

---

### Validation Rules

#### Numeric Validations
```typescript
// Passengers on board
if (data.passengers_on_board === undefined || data.passengers_on_board === null) {
  error = "Number of passengers is required";
}

if (data.passengers_on_board < 0) {
  error = "Number of passengers cannot be negative";
}

if (data.passengers_on_board > 200) {
  warning = "This seems unusually high. Please verify passenger count.";
}

// Passenger injuries cannot exceed passengers on board
if (data.passengers_injured && data.passengers_injured > data.passengers_on_board) {
  error = "Injured passengers cannot exceed total passengers on board";
}

// Transported cannot exceed injured
if (data.passengers_transported && data.passengers_injured && 
    data.passengers_transported > data.passengers_injured) {
  error = "Transported passengers cannot exceed injured passengers";
}
```

#### Operator Injury Validation
```typescript
if (data.operator_injured === undefined) {
  error = "Please indicate if operator was injured";
}

if (data.operator_injured === true && !data.operator_injured_body_part) {
  error = "Please specify injured body part";
}

if (data.operator_injured === true && data.operator_transported === undefined) {
  error = "Please indicate if operator was transported to hospital";
}
```

#### Police Validation
```typescript
if (data.police_at_scene === undefined) {
  error = "Please indicate if police were at the scene";
}

if (data.police_at_scene === true && !data.police_type) {
  error = "Please specify which police department responded";
}
```

#### Pedestrian Validation
```typescript
if (showPedestrianSection) {
  if (data.pedestrians_involved === undefined || data.pedestrians_involved < 0) {
    error = "Number of pedestrians involved is required";
  }
  
  if (data.pedestrians_involved > 0) {
    if (data.pedestrian_fatalities === undefined) {
      error = "Please specify number of pedestrian fatalities (0 if none)";
    }
    
    if (data.pedestrian_injuries === undefined) {
      error = "Please specify number of pedestrian injuries (0 if none)";
    }
  }
}
```

#### Other Vehicle Validation
```typescript
if (showOtherVehicleSection) {
  if (data.other_vehicle_occupants === undefined || data.other_vehicle_occupants < 0) {
    error = "Number of vehicle occupants is required";
  }
  
  if (!data.other_vehicle_type) {
    error = "Other vehicle type is required";
  }
  
  if (data.other_vehicle_damage === undefined) {
    error = "Please indicate if other vehicle was damaged";
  }
}
```

---

### Step 3 Proceed Validation

```typescript
canProceed = 
  data.operator_injured !== undefined &&
  data.passengers_on_board !== undefined &&
  data.police_at_scene !== undefined;

// If operator injured, require details
if (data.operator_injured === true) {
  canProceed = canProceed && 
    !!data.operator_injured_body_part &&
    data.operator_transported !== undefined;
}

// If police at scene, require type
if (data.police_at_scene === true) {
  canProceed = canProceed && !!data.police_type;
}

// Conditional section validation
if (showPedestrianSection && data.pedestrians_involved > 0) {
  canProceed = canProceed &&
    data.pedestrian_fatalities !== undefined &&
    data.pedestrian_injuries !== undefined;
}

if (showOtherVehicleSection && data.other_vehicle_occupants > 0) {
  canProceed = canProceed &&
    !!data.other_vehicle_type &&
    data.other_vehicle_damage !== undefined;
}
```

---

## Step 4: Review and Submit

### Final Validation

All previous step validations must pass, plus:

**Pre-submission checklist:**
- `confirmation_checked` (boolean) - User must check confirmation box

---

### Validation Rules

#### Confirmation Checkbox
```typescript
if (!data.confirmation_checked) {
  error = "You must confirm the accuracy of this report before submitting";
}
```

#### Complete Data Review
```typescript
// Verify all required fields from all steps
const requiredFields = [
  'event_type',
  'mode',
  'employee_badge_number',
  'employee_name',
  'description_of_event',
  'incident_date',
  'incident_time',
  'operator_injured',
  'passengers_on_board',
  'police_at_scene',
];

const missingFields = requiredFields.filter(field => !data[field]);

if (missingFields.length > 0) {
  error = `Missing required fields: ${missingFields.join(', ')}`;
}
```

---

## Smart Check Validation

Smart Check provides comprehensive mid-step validation.

### Common Issues Detected

**Step 1:**
- Event type selected but mode not selected
- Employee badge number missing or invalid
- On-behalf filing without employee selected

**Step 2:**
- Collision event without collision type
- Vehicle number missing for collision
- Date/time missing or invalid
- Impact diagram empty for collision
- Weather conditions not specified

**Step 3:**
- Passenger count seems unusually high/low
- Injuries reported but no transport information
- Police at scene but no police type specified
- Pedestrian section incomplete when collision type requires it
- Other vehicle section incomplete when collision type requires it

**Step 4:**
- Critical fields from earlier steps are empty
- Confirmation not checked

---

### Smart Check Implementation

```typescript
function runSmartCheck(step: number, data: AccidentReportData): SmartCheckIssue[] {
  const issues: SmartCheckIssue[] = [];
  
  if (step === 1) {
    if (!data.event_type) {
      issues.push({ message: 'Event type is required to proceed' });
    }
    if (!data.mode) {
      issues.push({ message: 'Vehicle mode is required to proceed' });
    }
    if (!data.employee_badge_number) {
      issues.push({ message: 'Employee badge number is required' });
    }
  }
  
  if (step === 2) {
    if (data.event_type === 'Collision' && !data.collision_type && !data.lrv_collision_type) {
      issues.push({ message: 'Collision type is required for collision events' });
    }
    if (data.event_type === 'Collision' && !data.vehicle_number) {
      issues.push({ message: 'Vehicle number is required for collision events' });
    }
    if (!data.description_of_event || data.description_of_event.length < 10) {
      issues.push({ message: 'Event description should be detailed (at least 10 characters)' });
    }
    if (data.event_type === 'Collision' && (!data.impact_markers || data.impact_markers.length === 0)) {
      issues.push({ message: 'Consider marking impact points on the vehicle diagram' });
    }
  }
  
  if (step === 3) {
    if (data.passengers_on_board === undefined) {
      issues.push({ message: 'Number of passengers on board is required' });
    }
    if (data.operator_injured === undefined) {
      issues.push({ message: 'Operator injury status is required' });
    }
    if (data.operator_injured && !data.operator_injured_body_part) {
      issues.push({ message: 'Injured body part must be specified when operator is injured' });
    }
  }
  
  return issues;
}
```

---

## Data Integrity Rules

### Badge Number Locking

**Self-filing (Operators):**
```typescript
// Badge number must match logged-in user
if (!isOnBehalf && data.employee_badge_number !== userContext.badgeNumber) {
  error = "Badge number cannot be changed for data integrity";
  // Lock field and prevent editing
}
```

**On-behalf filing (Supervisors/Program Managers):**
```typescript
// Badge must be selected from employee database
if (isOnBehalf && !EMPLOYEE_DB[data.employee_badge_number]) {
  error = "Please select a valid employee from the search";
}

// All employee data must be from Workday lookup
if (isOnBehalf && !workdayLookupCompleted) {
  error = "Employee data must be auto-filled from Workday";
}
```

---

## Error Message Standards

### Error Text Format
- Short and specific
- Action-oriented when possible
- Professional and respectful tone
- No technical jargon

### Examples

**Good:**
- "Event type is required"
- "Date cannot be in the future"
- "Please select a vehicle from the dropdown"
- "Injured passengers cannot exceed total passengers on board"

**Bad:**
- "Invalid input" (too vague)
- "ERROR: event_type is null" (technical jargon)
- "You didn't fill this out correctly" (not helpful)
- "This field is required!!!!" (unprofessional)

---

## Validation Summary

| Step | Min Required Fields | Conditional Logic | Smart Check Available |
|------|---------------------|-------------------|----------------------|
| 1 | 4 | Event type, on-behalf status | Yes |
| 2 | 3-15 | Event type (collision vs non-collision), mode (bus vs LRV) | Yes |
| 3 | 3-10 | Collision type (pedestrian, other vehicle) | Yes |
| 4 | 1 | All prior validations | Yes |

---

## Testing Validation

### Unit Tests

Test each validation rule independently:
```typescript
describe('Step 1 Validation', () => {
  it('should require event type', () => {
    const data = { mode: 'Bus', employee_badge_number: '12345' };
    expect(canProceedStep1(data)).toBe(false);
  });
  
  it('should require mode', () => {
    const data = { event_type: 'Collision', employee_badge_number: '12345' };
    expect(canProceedStep1(data)).toBe(false);
  });
  
  it('should allow proceed when all required fields filled', () => {
    const data = { 
      event_type: 'Collision', 
      mode: 'Bus', 
      employee_badge_number: '12345',
      employee_name: 'John Doe'
    };
    expect(canProceedStep1(data)).toBe(true);
  });
});
```

### Integration Tests

Test full wizard flow with validation:
```typescript
describe('Wizard Validation Flow', () => {
  it('should prevent advancing to Step 2 without required Step 1 fields', () => {
    // Incomplete Step 1
    // Attempt to advance
    // Assert Next button is disabled
  });
  
  it('should prevent submission without confirmation checkbox', () => {
    // Complete all steps
    // Don't check confirmation
    // Attempt submit
    // Assert error message shown
  });
});
```
