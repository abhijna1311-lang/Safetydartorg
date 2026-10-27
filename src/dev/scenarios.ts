// Dev-only fixtures for the DevScenariosDrawer. Excluded from production builds
// by the import.meta.env.DEV check where the drawer is mounted.
//
// Scenarios are grouped by STORY (event type + who initiated) with multiple
// phases per story so you can jump through the real workflow arc.

import type { UserRole } from '../app/context/UserRoleContext';
import type { WorkflowReport } from '../app/types/workflow-report';
import type { AccidentReportData } from '../app/types/accident-report';
import { EMPLOYEE_DB } from '../app/data/employeeDatabase';

// ── Types ────────────────────────────────────────────────────────

export type ScenarioAction =
  | { type: 'go-home' }
  | { type: 'new-blank' }
  | { type: 'open-existing'; reportId: string }
  | { type: 'inject-and-open'; report: WorkflowReport; initialStep?: number }
  | { type: 'inject-many-and-open'; reports: WorkflowReport[]; openId: string };

export interface DevScenario {
  id: string;
  name: string;
  description: string;
  role: UserRole;
  action: ScenarioAction;
  group: string;
  phase?: string;
}

// ── Helpers ──────────────────────────────────────────────────────

const nowIso = () => new Date().toISOString();
const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

function employeeFields(badge: string): Partial<AccidentReportData> {
  const e = EMPLOYEE_DB[badge];
  if (!e) return {};
  return {
    employee_badge_number: e.badge,
    employee_name: e.name,
    employee_phone: e.phone,
    employee_gender: e.gender,
    employee_address: e.address,
    employee_age: e.age,
    date_of_hire: e.hire_date,
    employee_status: e.status,
    department: e.department,
    assigned_division: e.division,
    division_supervisor: e.division_supervisor,
    division_work: e.division_work,
    cost_center: e.cost_center,
    service_years: e.service_years,
    service_months: e.service_months,
    service_days: e.service_days,
    is_student_employee: e.is_student,
  };
}

const clearDayWeather: Partial<AccidentReportData> = {
  weather: 'Clear',
  road_conditions: 'Dry',
  lighting_conditions: 'Daylight',
  streetlights: 'Streetlights On',
  traffic_conditions: 'Medium',
  traffic_controls: 'Traffic Light',
  roadway_configuration: 'Two Lane Road',
};

const rainyNightWeather: Partial<AccidentReportData> = {
  weather: 'Raining',
  road_conditions: 'Wet/Flood Area',
  lighting_conditions: 'Dark',
  streetlights: 'Streetlights On',
  traffic_conditions: 'Light',
  traffic_controls: 'N/A',
  roadway_configuration: 'Train Yard',
};

// ── Base: Bus collision, Operator = Bukayo Saka ─────────────────

const busCollisionBase: AccidentReportData = {
  ...employeeFields('90001'),
  event_type: 'Collision',
  mode: 'Bus',
  operating_dart_vehicle: true,
  is_on_behalf: false,

  incident_date: '2026-07-30',
  incident_time: '08:42',
  description_of_event:
    'While proceeding straight in the curb lane on Cedar Blvd, a sedan changed lanes from the right without signaling and struck the mid-body right side of the bus. Operator braked, checked passengers, and notified dispatch.',
  vehicle_number: '2045',
  trip_id: 'T-1548',
  block_number: 'BLK-215',
  fleet_type: '40 ft Low Floor',
  route_number: 'Route 15',
  run_number: '15-04',
  end_of_line_destination: 'Downtown Transit Center',
  employee_pullout_date: '2026-07-24',
  employee_pullout_time: '05:12',
  street_on: 'Cedar Blvd',
  cross_street: '7th St',
  city: 'Dallas',
  zip: '75203',
  // Demo pin in Oak Cliff (75203); street names in this scenario are illustrative.
  location_lat: 32.7489,
  location_lng: -96.8275,
  event_at_bus_stop: false,
  has_bike_lane: true,
  bus_status_before: 'In Service',
  bus_status_after: 'In Service',
  collision_type: 'Collision – with Auto',
  bus_action: 'Moving Straight',
  bus_speed: '25',
  point_of_impact: 'Right Side Impact',
  bus_damage: true,
  impact_markers: [
    { x: 47, y: 68, label: 'Right Side' },
    { x: 79, y: 53, label: 'Front' },
  ],
  runaway_vehicle: false,
  parking_brake_engaged: true,
  evacuation_life_safety: false,
  ...clearDayWeather,

  operator_injured: false,
  passengers_on_board: 12,
  passenger_fatalities: 0,
  passengers_injured: 1,
  passengers_transported: 1,
  passengers_fled: 0,
  courtesy_cards: 1,
  people: [
    {
      id: 'p-1',
      role: 'Passenger',
      name: 'Ana Rodriguez',
      injured: true,
      injured_body_part: 'Neck',
      transported_to_hospital: true,
      fled_scene: false,
      courtesy_card: true,
    },
    { id: 'p-2', role: 'Passenger', name: 'Marcus Chen', injured: false },
  ],
  other_vehicles: [
    {
      id: 'ov-1',
      vehicle_type: 'Passenger Auto/St Wagon',
      action: 'Changing lanes',
      direction: 'Same direction',
      occupants: 2,
      injuries: 1,
      fatalities: 0,
      transported: 1,
      fled: 0,
      damage: true,
      damage_area: ['Right Side', 'Front'],
      point_of_impact: 'Right Side',
      tow_away: true,
    },
  ],
  pedestrians_involved: 0,
  police_at_scene: true,
  police_type: 'Dallas Police',
  dart_supervisor_investigating: true,
};

const busCollisionSupervisorOverlay: Partial<AccidentReportData> = {
  supervisor_badge_number: '90002',
  supervisor_name: 'Alexia Putellas',
  supervisor_first_name: 'Alexia',
  supervisor_last_name: 'Putellas',
  supervisor_division: 'Bus Operations',
  supervisor_arrival_date: '2026-07-30',
  supervisor_arrival_time: '09:04',
  supervisor_incident_date: '2026-07-30',
  supervisor_incident_time: '08:42',
  supervisor_street_on: 'Cedar Blvd',
  supervisor_cross_street: '7th St',
  supervisor_city: 'Dallas',
  supervisor_zip: '75203',
  supervisor_event_at_bus_stop: false,
  supervisor_has_bike_lane: true,
  supervisor_event_description:
    'On-scene inspection confirms operator statement. Right side mid-body impact consistent with sedan lane change. One passenger reported neck discomfort and was transported by paramedics. No other injuries observed.',
  supervisor_report_city: 'Dallas',
  supervisor_report_type: 'Collision',
  supervisor_dart_vehicle_type: 'Bus',
  supervisor_vehicle_number: '2045',
  supervisor_fleet: '40 ft Low Floor',
  supervisor_operating_route_number: 'Route 15',
  supervisor_block_number: 'BLK-215',
  supervisor_trip_id: 'T-1548',
  supervisor_employee_pullout_date: '2026-07-24',
  supervisor_employee_pullout_time: '05:12',
  supervisor_end_of_line_destination: 'Downtown Transit Center',
  supervisor_bus_status_before: 'In Service',
  supervisor_bus_status_after: 'In Service',
  supervisor_scene_diagram_completed: true,
  supervisor_scene_photos_taken: true,
  supervisor_dart_vehicle_damaged: true,
  supervisor_damage_requires_tow: false,
  supervisor_damage_count: 1,
  supervisor_tow_count: 0,
  supervisor_impact_markers: [
    { x: 47, y: 68, label: 'Right Side' },
    { x: 79, y: 53, label: 'Front' },
    { x: 72, y: 78, label: 'Front Wheel Right' },
  ],
  supervisor_other_vehicles_involved: true,
  supervisor_other_vehicle_count: 1,
  supervisor_other_vehicle_damage_count: 1,
  supervisor_other_vehicle_tow_count: 1,
  supervisor_dart_employee_fatalities: false,
  supervisor_dart_employee_injuries: false,
  supervisor_passenger_fatalities: false,
  supervisor_passenger_injuries: true,
  supervisor_passenger_injury_count: 1,
  supervisor_passenger_injury_details: [
    { age_group: 'Adult (19 to 60)', gender: 'Female', transported_to_hospital: true },
  ],
  supervisor_pedestrian_fatalities: false,
  supervisor_pedestrian_injuries: false,
  supervisor_collision_between_dart_vehicles: false,
  supervisor_other_vehicle_records: [
    {
      id: 'sov-1',
      type: 'Passenger Auto/St Wagon',
      action: 'Changing lanes',
      point_of_impact: 'Right Side',
      direction: 'Same direction',
      occupant_fatality_count: 0,
      occupant_injuries: true,
      occupant_injury_count: 1,
      injured_occupants: [
        { age_group: 'Adult (19 to 60)', gender: 'Male', transported_to_hospital: true },
      ],
    },
  ],
  supervisor_other_vehicle_injury_count: 1,
  supervisor_equipment_damage_description:
    'Right side mid-body panel dented approximately 18 inches. Handrail assembly on interior right side loosened. No structural damage.',
  supervisor_police_called: true,
  supervisor_police_agency: 'Dallas Police Department',
  supervisor_police_officer_name: 'Officer J. Ramirez',
  supervisor_police_notified_by: 'Field Supervisor',
  supervisor_police_report_number: 'DPD-2026-38214',
  supervisor_confirmation_checked: true,
};

const busCollisionPMOverlay: Partial<AccidentReportData> = {
  operator_datetime_correct: true,
  employee_contacted_program_manager: true,
  employee_contacted_program_manager_date: '2026-07-30',
  employee_contact_method: 'Phone',
  shared_corridor: false,
  equipment_malfunction: false,
  action_taken:
    'Reviewed operator, supervisor, and police reports. Sedan cited for improper lane change (DPD report DPD-2026-38214). Bus operator followed procedure. Property damage limited to right side panel. One passenger injury with hospital transport.',
  damage_to_property: true,
  damage_to_property_description: 'Right side mid-body panel, ~18 inches',
  program_manager_collision_with: 'Collision – with Auto',
  program_manager_collision_type: 'Collision – with Auto',
  program_manager_contributing_factors: 'Other driver – improper lane change',
  program_manager_contributing_factors_list: ['Other driver at fault', 'Improper lane change'],
  program_manager_estimated_total_damages: '$4,800',
  program_manager_tow_away: true,
  program_manager_tow_away_vehicle: 'Other vehicle only',
  program_manager_at_grade_crossing_or_intersection: false,
  program_manager_badge_number: '90003',
  program_manager_first_name: 'Jude',
  program_manager_last_name: 'Bellingham',
  program_manager_department: 'Operations',
  program_manager_fatalities_present: false,
  program_manager_injuries_present: true,
  program_manager_life_safety_evacuation: false,
  program_manager_employee_fatality_count: 0,
  program_manager_employee_injury_count: 0,
  program_manager_passenger_injury_count: 1,
  program_manager_passenger_injury_records: [
    { severity: 'Injured – Non-Serious', body_part: 'Upper body', age_group: 'Adult (19 to 60)', gender: 'Female', transported_to_hospital: true },
  ],
  program_manager_other_vehicle_injury_count: 1,
  program_manager_other_vehicle_injury_records: [
    { severity: 'Injured – Non-Serious', body_part: 'Upper body', age_group: 'Adult (19 to 60)', gender: 'Male', transported_to_hospital: true },
  ],
  program_manager_classification: 'Non-Preventable',
  program_manager_classification_value: 'Non-Preventable',
  program_manager_classification_date: '2026-07-31',
  program_manager_classification_justification:
    'Sedan changed lanes without signaling and struck the bus. Operator was proceeding lawfully in the curb lane at posted speed. No preventable action available to the operator.',
  program_manager_classified_by_name: 'Jude Bellingham',
  program_manager_classified_by_badge: '90003',
  program_manager_confirmation_checked: true,
  severity_level: 'Moderate',
};

// ── Base: LRV derailment, Operator = Aitana Bonmati ─────────────

const lrvDerailmentBase: AccidentReportData = {
  ...employeeFields('10002'),
  event_type: 'Derailment',
  mode: 'Light Rail Vehicle',
  operating_dart_vehicle: true,
  is_on_behalf: false,

  incident_date: '2026-07-28',
  incident_time: '22:14',
  description_of_event:
    'While entering the yard limits, the lead truck of the leading car derailed at low speed on the switch approach. No collision occurred. Operator secured the train and notified rail control.',
  train_number: 'T-2088',
  train_pullout_date: '2026-07-24',
  train_pullout_time: '04:55',
  car_number: '2140',
  lrv_consist_count: 1,
  lrv_consist_1: '2140',
  lrv_fleet_type: 'KIN – Kinki Sharyo USA 2005',
  rail_line: 'Red',
  lrv_end_of_line: 'Parker Road',
  address_of_event: 'Rail yard – switch S-14',
  location_category: 'Non-Revenue facility/Yard',
  train_status_before: 'Pull-In',
  train_status_after: 'In Yard',
  derailment_type: 'Yard',
  train_action: 'Proceeding Through a Switch',
  train_speed: '8',
  train_damage: true,
  impact_markers: [
    { x: 18, y: 24, label: 'Rear Wheel Left' },
  ],
  disabling_damage: false,
  runaway_train: false,
  lrv_evacuation: false,
  ...rainyNightWeather,

  operator_injured: false,
  passengers_on_board: 0,
  passenger_fatalities: 0,
  passengers_injured: 0,
  pedestrians_involved: 0,
  police_at_scene: false,
  dart_supervisor_investigating: true,
  people: [],
  other_vehicles: [],
};

const lrvDerailmentSupervisorOverlay: Partial<AccidentReportData> = {
  supervisor_badge_number: '90002',
  supervisor_name: 'Alexia Putellas',
  supervisor_first_name: 'Alexia',
  supervisor_last_name: 'Putellas',
  supervisor_division: 'Rail Operations',
  supervisor_arrival_date: '2026-07-28',
  supervisor_arrival_time: '22:38',
  supervisor_incident_date: '2026-07-28',
  supervisor_incident_time: '22:14',
  supervisor_address_of_event: 'Rail yard – switch S-14',
  supervisor_location_category: 'Non-Revenue facility/Yard',
  supervisor_event_description:
    'Lead truck of car 2140 off rails at switch S-14 approach. Low-speed movement entering yard. No injuries. No collision. Rail control notified; MOW dispatched for rerailing.',
  supervisor_report_type: 'Derailment',
  supervisor_dart_vehicle_type: 'Light Rail Vehicle',
  supervisor_vehicle_number: 'T-2088',
  supervisor_car_number: '2140',
  supervisor_train_pullout_date: '2026-07-24',
  supervisor_train_pullout_time: '04:55',
  supervisor_lrv_fleet_type: 'KIN – Kinki Sharyo USA 2005',
  supervisor_rail_line: 'Red',
  supervisor_derailment_confirmed: true,
  supervisor_derailment_details: 'Lead truck, leading car (2140). One axle off rail on straight approach to S-14.',
  supervisor_revenue_service: false,
  supervisor_scene_diagram_completed: true,
  supervisor_scene_photos_taken: true,
  supervisor_dart_vehicle_damaged: true,
  supervisor_damage_requires_tow: false,
  supervisor_damage_count: 1,
  supervisor_tow_count: 0,
  supervisor_impact_markers: [
    { x: 18, y: 24, label: 'Rear Wheel Left' },
  ],
  supervisor_dart_employee_fatalities: false,
  supervisor_dart_employee_injuries: false,
  supervisor_passenger_fatalities: false,
  supervisor_passenger_injuries: false,
  supervisor_pedestrian_fatalities: false,
  supervisor_pedestrian_injuries: false,
  supervisor_collision_between_dart_vehicles: false,
  supervisor_equipment_damage_description:
    'Superficial wheel flange scoring. Truck inspected; no bearing or axle damage. No damage to rail; switch S-14 undamaged.',
  supervisor_police_called: false,
  supervisor_confirmation_checked: true,
};

const lrvDerailmentPMOverlay: Partial<AccidentReportData> = {
  operator_datetime_correct: true,
  employee_contacted_program_manager: true,
  employee_contacted_program_manager_date: '2026-07-29',
  employee_contact_method: 'Phone',
  shared_corridor: false,
  equipment_malfunction: false,
  action_taken:
    'Reviewed derailment reports. Yard derailment at S-14 during low-speed movement. No injuries, no revenue-service impact. MOW confirmed track and switch in specification. Truck inspection complete; car returned to service.',
  damage_to_property: false,
  program_manager_collision_with: 'Not applicable – derailment',
  program_manager_derail_configuration: 'Yard – low speed',
  program_manager_cars_derailed_count: 1,
  program_manager_estimated_total_damages: '$1,200',
  program_manager_tow_away: false,
  program_manager_at_grade_crossing_or_intersection: false,
  program_manager_badge_number: '90003',
  program_manager_first_name: 'Jude',
  program_manager_last_name: 'Bellingham',
  program_manager_department: 'Operations',
  program_manager_fatalities_present: false,
  program_manager_injuries_present: false,
  program_manager_life_safety_evacuation: false,
  program_manager_classification: 'Non-Preventable',
  program_manager_classification_value: 'Non-Preventable',
  program_manager_classification_date: '2026-07-30',
  program_manager_classification_justification:
    'Yard movement at low speed on properly aligned switch. No indication of operator error. Truck inspection revealed intermittent flange wear pattern; MOW work order opened.',
  program_manager_classified_by_name: 'Jude Bellingham',
  program_manager_classified_by_badge: '90003',
  program_manager_confirmation_checked: true,
  severity_level: 'Minor',
};

// ── Base: Bus fire ──────────────────────────────────────────────

const busFireBase: AccidentReportData = {
  ...employeeFields('10005'),
  event_type: 'Fire',
  mode: 'Bus',
  operating_dart_vehicle: true,
  is_on_behalf: false,

  incident_date: '2026-07-25',
  incident_time: '14:22',
  description_of_event:
    'While stopped at a red light, smoke began to emerge from the engine compartment. Operator evacuated all 8 passengers safely to the sidewalk and notified dispatch. Small engine-bay fire self-extinguished before DFR arrival.',
  vehicle_number: '4089',
  trip_id: 'T-2014',
  block_number: 'BLK-420',
  fleet_type: '40 ft Hybrid',
  route_number: 'Route 201',
  run_number: '204-08',
  end_of_line_destination: 'Airport',
  employee_pullout_date: '2026-07-24',
  employee_pullout_time: '06:05',
  street_on: 'Main St',
  cross_street: 'Ervay St',
  city: 'Dallas',
  zip: '75201',
  event_at_bus_stop: false,
  bus_status_before: 'In Service',
  bus_status_after: 'Not In Service',
  bus_action: 'Stopping',
  bus_speed: '0',
  bus_damage: true,
  evacuation_life_safety: true,
  ...clearDayWeather,

  operator_injured: false,
  passengers_on_board: 8,
  passenger_fatalities: 0,
  passengers_injured: 0,
  passengers_transported: 0,
  pedestrians_involved: 0,
  police_at_scene: true,
  police_type: 'Dallas Fire-Rescue',
  dart_supervisor_investigating: true,
  people: [],
  other_vehicles: [],
};

// ── Base: Assault (Op-Passenger) ────────────────────────────────

const assaultBase: AccidentReportData = {
  ...employeeFields('10008'),
  event_type: 'Assault',
  mode: 'Bus',
  operating_dart_vehicle: true,
  is_on_behalf: false,

  incident_date: '2026-07-22',
  incident_time: '18:04',
  description_of_event:
    'Passenger became verbally abusive after being asked to pay fare. Passenger spit at operator and threw a beverage container that struck the operator on the shoulder. Operator activated silent alarm and pulled to a safe stop. Passenger fled on foot before police arrival.',
  vehicle_number: '5201',
  trip_id: 'T-0523',
  block_number: 'BLK-205',
  fleet_type: '40 ft Low Floor',
  route_number: 'Route 5',
  run_number: '19-06',
  end_of_line_destination: 'Crossroads Station',
  employee_pullout_date: '2026-07-24',
  employee_pullout_time: '04:20',
  street_on: 'Ross Ave',
  cross_street: 'Skillman St',
  city: 'Dallas',
  zip: '75214',
  event_at_bus_stop: true,
  bus_stop_name: 'Ross at Skillman',
  bus_status_before: 'In Service',
  bus_status_after: 'In Service',
  bus_action: 'Stopped',
  bus_speed: '0',
  ...clearDayWeather,

  operator_injured: true,
  operator_injured_body_part: 'Shoulder',
  operator_transported: false,
  passengers_on_board: 6,
  passenger_fatalities: 0,
  passengers_injured: 0,
  pedestrians_involved: 0,
  police_at_scene: true,
  police_type: 'Dallas Police',
  dart_supervisor_investigating: true,
  people: [],
  other_vehicles: [],
};

// ── Section-state helpers ───────────────────────────────────────

function operatorSubmittedSection(at: string) {
  return {
    key: 'operator' as const,
    ownerRole: 'Operator' as UserRole,
    label: 'Operator section',
    status: 'submitted' as const,
    submittedBy: 'Operator' as UserRole,
    submittedAt: at,
  };
}
function pendingSection(key: 'supervisor' | 'programManager', ownerRole: UserRole, label: string) {
  return { key, ownerRole, label, status: 'pending' as const };
}
function notStartedSection(key: 'supervisor' | 'programManager', ownerRole: UserRole, label: string) {
  return { key, ownerRole, label, status: 'not-started' as const };
}
function acceptedSection(key: 'operator' | 'supervisor' | 'programManager', ownerRole: UserRole, label: string, at: string, by: UserRole) {
  return { key, ownerRole, label, status: 'accepted' as const, submittedBy: by, submittedAt: at };
}
function submittedSection(key: 'supervisor' | 'programManager', ownerRole: UserRole, label: string, at: string) {
  return { key, ownerRole, label, status: 'submitted' as const, submittedBy: ownerRole, submittedAt: at };
}
function returnedSection(
  key: 'supervisor' | 'programManager',
  ownerRole: UserRole,
  label: string,
  correctionNote: string,
  at: string,
) {
  return {
    key,
    ownerRole,
    label,
    status: 'returned' as const,
    returnedBy: 'Program Manager' as UserRole,
    returnedAt: at,
    correctionNote,
  };
}

// ── Story A: Bus collision, Operator initiates ──────────────────

const bcOperatorStep1: WorkflowReport = {
  id: 'DEV-BC-OP-STEP1',
  initiatedBy: 'Operator',
  workflowStage: 'operator-completion',
  overallStatus: 'draft',
  currentStep: 1,
  createdAt: isoDaysAgo(0),
  lastSavedAt: nowIso(),
  formData: {
    ...employeeFields('90001'),
    event_type: 'Collision',
    mode: 'Bus',
    operating_dart_vehicle: true,
    is_on_behalf: false,
  },
};

const bcOperatorStep2: WorkflowReport = {
  id: 'DEV-BC-OP-STEP2',
  initiatedBy: 'Operator',
  workflowStage: 'operator-completion',
  overallStatus: 'draft',
  currentStep: 2,
  createdAt: isoDaysAgo(0),
  lastSavedAt: nowIso(),
  formData: {
    ...busCollisionBase,
    people: undefined,
    other_vehicles: undefined,
    passengers_on_board: undefined,
    passengers_injured: undefined,
    passengers_transported: undefined,
    passengers_fled: undefined,
    courtesy_cards: undefined,
    police_at_scene: undefined,
    dart_supervisor_investigating: undefined,
  },
};

const bcOperatorStep3: WorkflowReport = {
  id: 'DEV-BC-OP-STEP3',
  initiatedBy: 'Operator',
  workflowStage: 'operator-completion',
  overallStatus: 'draft',
  currentStep: 3,
  createdAt: isoDaysAgo(0),
  lastSavedAt: nowIso(),
  formData: busCollisionBase,
};

const bcOperatorReadyToSubmit: WorkflowReport = {
  id: 'DEV-BC-OP-REVIEW',
  initiatedBy: 'Operator',
  workflowStage: 'operator-completion',
  overallStatus: 'draft',
  currentStep: 4,
  createdAt: isoDaysAgo(0),
  lastSavedAt: nowIso(),
  formData: { ...busCollisionBase, severity_level: 'Moderate' },
};

const bcAwaitingSupervisor: WorkflowReport = {
  id: 'DEV-BC-SUP-PENDING',
  initiatedBy: 'Operator',
  workflowStage: 'supervisor-review',
  overallStatus: 'waiting-on-sections',
  currentStep: 4,
  createdAt: isoDaysAgo(1),
  lastSavedAt: isoDaysAgo(1),
  dueBy: '08/07/2026',
  lastSubmittedBy: 'Operator',
  sections: {
    operator: operatorSubmittedSection(isoDaysAgo(1)),
    supervisor: pendingSection('supervisor', 'Supervisor', 'Supervisor section collision'),
    programManager: notStartedSection('programManager', 'Program Manager', 'Program manager section'),
  },
  formData: { ...busCollisionBase, severity_level: 'Moderate' },
};

const bcAwaitingPM: WorkflowReport = {
  id: 'DEV-BC-PM-PENDING',
  initiatedBy: 'Operator',
  workflowStage: 'program-manager-review',
  overallStatus: 'waiting-on-sections',
  currentStep: 4,
  createdAt: isoDaysAgo(3),
  lastSavedAt: isoDaysAgo(1),
  dueBy: '08/06/2026',
  lastSubmittedBy: 'Supervisor',
  sections: {
    operator: acceptedSection('operator', 'Operator', 'Operator section', isoDaysAgo(3), 'Operator'),
    supervisor: submittedSection('supervisor', 'Supervisor', 'Supervisor section collision', isoDaysAgo(1)),
    programManager: pendingSection('programManager', 'Program Manager', 'Program manager section'),
  },
  formData: {
    ...busCollisionBase,
    ...busCollisionSupervisorOverlay,
    severity_level: 'Moderate',
  },
};

const bcClosed: WorkflowReport = {
  id: 'DEV-BC-CLOSED',
  initiatedBy: 'Operator',
  workflowStage: 'closed',
  overallStatus: 'closed',
  currentStep: 4,
  createdAt: isoDaysAgo(5),
  lastSavedAt: isoDaysAgo(1),
  dueBy: '08/04/2026',
  lastSubmittedBy: 'Program Manager',
  closedAt: isoDaysAgo(1),
  sections: {
    operator: acceptedSection('operator', 'Operator', 'Operator section', isoDaysAgo(5), 'Operator'),
    supervisor: acceptedSection('supervisor', 'Supervisor', 'Supervisor section collision', isoDaysAgo(3), 'Supervisor'),
    programManager: acceptedSection('programManager', 'Program Manager', 'Program manager section', isoDaysAgo(1), 'Program Manager'),
  },
  formData: {
    ...busCollisionBase,
    ...busCollisionSupervisorOverlay,
    ...busCollisionPMOverlay,
  },
};

// ── Story B: LRV derailment, Supervisor on-behalf ───────────────

const lrvSupInitDraft: WorkflowReport = {
  id: 'DEV-LRV-SUP-DRAFT',
  initiatedBy: 'Supervisor',
  workflowStage: 'operator-completion',
  overallStatus: 'draft',
  currentStep: 2,
  createdAt: isoDaysAgo(0),
  lastSavedAt: nowIso(),
  formData: {
    ...lrvDerailmentBase,
    is_on_behalf: true,
    on_behalf_employee: '10002',
  },
};

const lrvAwaitingPM: WorkflowReport = {
  id: 'DEV-LRV-PM-PENDING',
  initiatedBy: 'Supervisor',
  workflowStage: 'program-manager-review',
  overallStatus: 'waiting-on-sections',
  currentStep: 4,
  createdAt: isoDaysAgo(4),
  lastSavedAt: isoDaysAgo(1),
  dueBy: '08/08/2026',
  lastSubmittedBy: 'Supervisor',
  sections: {
    operator: acceptedSection('operator', 'Operator', 'Operator section', isoDaysAgo(4), 'Operator'),
    supervisor: submittedSection('supervisor', 'Supervisor', 'Supervisor section derailment', isoDaysAgo(1)),
    programManager: pendingSection('programManager', 'Program Manager', 'Program manager section'),
  },
  formData: {
    ...lrvDerailmentBase,
    ...lrvDerailmentSupervisorOverlay,
    is_on_behalf: true,
    on_behalf_employee: '10002',
    severity_level: 'Minor',
  },
};

const lrvClosed: WorkflowReport = {
  id: 'DEV-LRV-CLOSED',
  initiatedBy: 'Supervisor',
  workflowStage: 'closed',
  overallStatus: 'closed',
  currentStep: 4,
  createdAt: isoDaysAgo(7),
  lastSavedAt: isoDaysAgo(2),
  dueBy: '08/02/2026',
  lastSubmittedBy: 'Program Manager',
  closedAt: isoDaysAgo(2),
  sections: {
    operator: acceptedSection('operator', 'Operator', 'Operator section', isoDaysAgo(7), 'Operator'),
    supervisor: acceptedSection('supervisor', 'Supervisor', 'Supervisor section derailment', isoDaysAgo(4), 'Supervisor'),
    programManager: acceptedSection('programManager', 'Program Manager', 'Program manager section', isoDaysAgo(2), 'Program Manager'),
  },
  formData: {
    ...lrvDerailmentBase,
    ...lrvDerailmentSupervisorOverlay,
    ...lrvDerailmentPMOverlay,
    is_on_behalf: true,
    on_behalf_employee: '10002',
  },
};

// ── Story C: Bus fire ──────────────────────────────────────────

const fireOperatorStep3: WorkflowReport = {
  id: 'DEV-FIRE-STEP3',
  initiatedBy: 'Operator',
  workflowStage: 'operator-completion',
  overallStatus: 'draft',
  currentStep: 3,
  createdAt: isoDaysAgo(0),
  lastSavedAt: nowIso(),
  formData: busFireBase,
};

const fireAwaitingReview: WorkflowReport = {
  id: 'DEV-FIRE-PENDING',
  initiatedBy: 'Operator',
  workflowStage: 'supervisor-review',
  overallStatus: 'waiting-on-sections',
  currentStep: 4,
  createdAt: isoDaysAgo(2),
  lastSavedAt: isoDaysAgo(2),
  dueBy: '08/09/2026',
  lastSubmittedBy: 'Operator',
  sections: {
    operator: operatorSubmittedSection(isoDaysAgo(2)),
    supervisor: pendingSection('supervisor', 'Supervisor', 'Supervisor section fire'),
    programManager: notStartedSection('programManager', 'Program Manager', 'Program manager section'),
  },
  formData: { ...busFireBase, severity_level: 'Moderate' },
};

// ── Story D: Assault ───────────────────────────────────────────

const assaultOperatorStep3: WorkflowReport = {
  id: 'DEV-ASSAULT-STEP3',
  initiatedBy: 'Operator',
  workflowStage: 'operator-completion',
  overallStatus: 'draft',
  currentStep: 3,
  createdAt: isoDaysAgo(0),
  lastSavedAt: nowIso(),
  formData: assaultBase,
};

const assaultClosed: WorkflowReport = {
  id: 'DEV-ASSAULT-CLOSED',
  initiatedBy: 'Operator',
  workflowStage: 'closed',
  overallStatus: 'closed',
  currentStep: 4,
  createdAt: isoDaysAgo(10),
  lastSavedAt: isoDaysAgo(3),
  closedAt: isoDaysAgo(3),
  lastSubmittedBy: 'Program Manager',
  sections: {
    operator: acceptedSection('operator', 'Operator', 'Operator section', isoDaysAgo(10), 'Operator'),
    supervisor: acceptedSection('supervisor', 'Supervisor', 'Supervisor section assault', isoDaysAgo(7), 'Supervisor'),
    programManager: acceptedSection('programManager', 'Program Manager', 'Program manager section', isoDaysAgo(3), 'Program Manager'),
  },
  formData: {
    ...assaultBase,
    severity_level: 'Serious',
    program_manager_classification: 'Not Reportable',
    program_manager_classification_value: 'Not Reportable',
    program_manager_classification_justification:
      'Passenger-initiated assault. Operator followed procedure. Not a preventable safety event under current guidance.',
    program_manager_classified_by_name: 'Jude Bellingham',
    program_manager_classified_by_badge: '90003',
    program_manager_confirmation_checked: true,
  },
};

// ── Story F: Duplicate detection ───────────────────────────────
// The existing report is a submitted case for badge 90001 on 2026-07-30 (Cedar Blvd
// bus collision, vehicle 2045). The new draft matches badge + date + vehicle + route,
// which fires the duplicate detector when the operator lands on Step 2.

const dupExisting: WorkflowReport = {
  id: 'DEV-DUP-EXISTING',
  initiatedBy: 'Operator',
  workflowStage: 'supervisor-review',
  overallStatus: 'waiting-on-sections',
  currentStep: 4,
  createdAt: isoDaysAgo(0),
  lastSavedAt: isoDaysAgo(0),
  lastSubmittedBy: 'Operator',
  sections: {
    operator: operatorSubmittedSection(isoDaysAgo(0)),
    supervisor: pendingSection('supervisor', 'Supervisor', 'Supervisor section collision'),
    programManager: notStartedSection('programManager', 'Program Manager', 'Program manager section'),
  },
  formData: { ...busCollisionBase, severity_level: 'Moderate' },
};

const dupNewDraft: WorkflowReport = {
  id: 'DEV-DUP-NEW-DRAFT',
  initiatedBy: 'Operator',
  workflowStage: 'operator-completion',
  overallStatus: 'draft',
  currentStep: 2,
  createdAt: nowIso(),
  lastSavedAt: nowIso(),
  formData: {
    ...employeeFields('90001'),
    event_type: 'Collision',
    mode: 'Bus',
    operating_dart_vehicle: true,
    is_on_behalf: false,
    // Same date + vehicle + route as dupExisting — triggers the modal.
    incident_date: '2026-07-30',
    incident_time: '09:15',
    vehicle_number: '2045',
    trip_id: 'T-1548',
    block_number: 'BLK-215',
    fleet_type: '40 ft Low Floor',
    route_number: 'Route 15',
    run_number: '15-04',
    end_of_line_destination: 'Downtown Transit Center',
    employee_pullout_date: '2026-07-24',
    employee_pullout_time: '05:12',
    street_on: 'Cedar Blvd',
    cross_street: '7th St',
    city: 'Dallas',
    zip: '75203',
    bus_status_before: 'In Service',
    bus_status_after: 'In Service',
    collision_type: 'Collision – with Auto',
  },
};

// ── Story E: Correction cycle ──────────────────────────────────

const bcCorrectionRequested: WorkflowReport = {
  id: 'DEV-BC-CORRECTION',
  initiatedBy: 'Operator',
  workflowStage: 'supervisor-review',
  overallStatus: 'correction-requested',
  currentStep: 4,
  createdAt: isoDaysAgo(4),
  lastSavedAt: isoDaysAgo(1),
  dueBy: '08/05/2026',
  lastSubmittedBy: 'Program Manager',
  handoffNote:
    'Supervisor equipment damage description needs specifics — panel dimensions and interior damage detail. Please resubmit.',
  sections: {
    operator: acceptedSection('operator', 'Operator', 'Operator section', isoDaysAgo(4), 'Operator'),
    supervisor: returnedSection(
      'supervisor',
      'Supervisor',
      'Supervisor section collision',
      'Equipment damage description is too brief. Add panel dimensions, describe interior damage, note whether handrail replacement is required.',
      isoDaysAgo(1),
    ),
    programManager: notStartedSection('programManager', 'Program Manager', 'Program manager section'),
  },
  formData: {
    ...busCollisionBase,
    ...busCollisionSupervisorOverlay,
    severity_level: 'Moderate',
    supervisor_equipment_damage_description: 'Right side damage.',
  },
};

// ── Scenario list ───────────────────────────────────────────────

export const DEV_SCENARIOS: DevScenario[] = [
  // Home views by persona
  { id: 'home-operator', name: 'Home — Operator', description: 'Operator home. Fresh session.', role: 'Operator', group: 'Home views', action: { type: 'go-home' } },
  { id: 'home-supervisor', name: 'Home — Field Supervisor', description: 'Field Supervisor home + queue.', role: 'Supervisor', group: 'Home views', action: { type: 'go-home' } },
  { id: 'home-asstmgr', name: 'Home — Assistant Manager', description: 'Assistant Manager review queue.', role: 'Assistant Manager', group: 'Home views', action: { type: 'go-home' } },
  { id: 'home-pm', name: 'Home — Safety Program Manager', description: 'Program Manager queue.', role: 'Program Manager', group: 'Home views', action: { type: 'go-home' } },
  { id: 'new-blank', name: 'New blank report', description: 'Wizard from scratch — no fields filled.', role: 'Operator', group: 'Home views', action: { type: 'new-blank' } },

  // Story A
  { id: 'bc-op-step1', name: '① Just started — Step 1', description: 'Operator picked Collision + Bus. Nothing else filled.', role: 'Operator', group: 'Story A · Bus collision (Operator files)', phase: 'Step 1', action: { type: 'inject-and-open', report: bcOperatorStep1 } },
  { id: 'bc-op-step2', name: '② Step 2 — Vehicle & location filled', description: 'Route, block, street, weather, roadway config, damage flag — all set.', role: 'Operator', group: 'Story A · Bus collision (Operator files)', phase: 'Step 2', action: { type: 'inject-and-open', report: bcOperatorStep2 } },
  { id: 'bc-op-step3', name: '③ Step 3 — People + other vehicles', description: '12 passengers, 1 injured (transported), sedan cited, right side + front damage.', role: 'Operator', group: 'Story A · Bus collision (Operator files)', phase: 'Step 3', action: { type: 'inject-and-open', report: bcOperatorStep3 } },
  { id: 'bc-op-review', name: '④ Ready to submit — Step 4', description: 'All operator fields filled. Review before submit.', role: 'Operator', group: 'Story A · Bus collision (Operator files)', phase: 'Step 4', action: { type: 'inject-and-open', report: bcOperatorReadyToSubmit } },
  { id: 'bc-sup-pending', name: '⑤ Awaiting Field Supervisor review', description: 'Operator submitted. Supervisor section pending.', role: 'Supervisor', group: 'Story A · Bus collision (Operator files)', phase: 'Supervisor review', action: { type: 'inject-and-open', report: bcAwaitingSupervisor } },
  { id: 'bc-sup-people', name: '⑤.a Jump to FS · People and Impact', description: 'Same FS case, lands directly on the People and Impact sub-step.', role: 'Supervisor', group: 'Story A · Bus collision (Operator files)', phase: 'Supervisor review', action: { type: 'inject-and-open', report: bcAwaitingSupervisor, initialStep: 3 } },
  { id: 'bc-pm-pending', name: '⑥ Awaiting Program Manager', description: 'Supervisor done. PM classification pending.', role: 'Program Manager', group: 'Story A · Bus collision (Operator files)', phase: 'PM review', action: { type: 'inject-and-open', report: bcAwaitingPM } },
  { id: 'bc-pm-people', name: '⑥.a Jump to PM · People and Impact', description: 'Same PM case, lands directly on the People and Impact sub-step.', role: 'Program Manager', group: 'Story A · Bus collision (Operator files)', phase: 'PM review', action: { type: 'inject-and-open', report: bcAwaitingPM, initialStep: 3 } },
  { id: 'bc-closed', name: '⑦ Closed — Non-Preventable', description: 'All sections accepted. PM classified as Non-Preventable.', role: 'Operator', group: 'Story A · Bus collision (Operator files)', phase: 'Closed', action: { type: 'inject-and-open', report: bcClosed } },

  // Story B
  { id: 'lrv-sup-draft', name: '① Supervisor initiation draft', description: 'Supervisor filing on behalf of Aitana Bonmati. Yard derailment.', role: 'Supervisor', group: 'Story B · LRV derailment (Supervisor on behalf)', phase: 'Draft', action: { type: 'inject-and-open', report: lrvSupInitDraft } },
  { id: 'lrv-pm-pending', name: '② Awaiting PM classification', description: 'Supervisor section done. PM queue.', role: 'Program Manager', group: 'Story B · LRV derailment (Supervisor on behalf)', phase: 'PM review', action: { type: 'inject-and-open', report: lrvAwaitingPM } },
  { id: 'lrv-closed', name: '③ Closed — Non-Preventable', description: 'Yard derailment closed. MOW work order opened for flange wear.', role: 'Program Manager', group: 'Story B · LRV derailment (Supervisor on behalf)', phase: 'Closed', action: { type: 'inject-and-open', report: lrvClosed } },

  // Story C
  { id: 'fire-op-step3', name: '① Draft — Step 3', description: 'Engine-bay fire, 8 passengers evacuated safely.', role: 'Operator', group: 'Story C · Bus fire (Operator files)', phase: 'Step 3', action: { type: 'inject-and-open', report: fireOperatorStep3 } },
  { id: 'fire-pending', name: '② Awaiting review', description: 'Operator submitted. Field Supervisor section pending.', role: 'Supervisor', group: 'Story C · Bus fire (Operator files)', phase: 'Supervisor review', action: { type: 'inject-and-open', report: fireAwaitingReview } },

  // Story D
  { id: 'assault-op-step3', name: '① Draft — Step 3', description: 'Passenger assault at bus stop. Operator injured (shoulder). Passenger fled.', role: 'Operator', group: 'Story D · Op-Passenger assault', phase: 'Step 3', action: { type: 'inject-and-open', report: assaultOperatorStep3 } },
  { id: 'assault-closed', name: '② Closed — Not Reportable', description: 'PM classified as Not Reportable. Operator followed procedure.', role: 'Program Manager', group: 'Story D · Op-Passenger assault', phase: 'Closed', action: { type: 'inject-and-open', report: assaultClosed } },

  // Story E
  { id: 'bc-correction', name: 'PM → Supervisor correction requested', description: 'PM returned Supervisor section for a better equipment damage description.', role: 'Supervisor', group: 'Story E · Correction cycle', phase: 'Correction', action: { type: 'inject-and-open', report: bcCorrectionRequested } },

  // Story F
  {
    id: 'dup-detection',
    name: 'Duplicate record detected',
    description: 'Operator started a new draft for the same badge + date + vehicle as an existing submitted case. Modal fires on Step 2.',
    role: 'Operator',
    group: 'Story F · Duplicate detection',
    phase: 'Modal fires',
    action: { type: 'inject-many-and-open', reports: [dupExisting, dupNewDraft], openId: dupNewDraft.id },
  },
];
