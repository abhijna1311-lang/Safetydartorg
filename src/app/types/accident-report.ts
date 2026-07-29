export interface Person {
  id: string;
  role: 'Passenger' | 'Pedestrian';
  name?: string;
  injured?: boolean;
  fatal?: boolean;
  injured_body_part?: string;
  transported_to_hospital: boolean;
  fled_scene?: boolean;
  // Passenger-specific
  passenger_action?: string;
  which_door?: string;
  courtesy_card?: boolean;
  // Pedestrian-specific
  pedestrian_type?: string;
  pedestrian_action?: string;
}

// The other party in a collision. Occupants are recorded as counts (not named line items).
export interface OtherVehicle {
  id: string;
  occupants?: number;
  fatalities?: number;
  injuries?: number;
  fled?: number;
  transported?: number;
  dart_dart?: boolean;        // collision between two DART vehicles — changes the type list
  vehicle_type?: string;
  action?: string;
  point_of_impact?: string;
  direction?: string;         // direction relative to the DART vehicle
  damage?: boolean;
  damage_area?: string;
  tow_away?: boolean;
}

export interface PedestrianRecord {
  id: string;
  pedestrian_type?: string;
  pedestrian_action?: string;
  fled?: boolean;
}

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

export interface SupervisorDemographicRecord {
  age_group?: 'Child (12 and under)' | 'Teen (13 to 18)' | 'Adult (19 to 60)' | 'Senior Citizen (61 and up)';
  gender?: 'Female' | 'Male';
  transported_to_hospital?: boolean;
}

export type PMInjurySeverity = 'Injured – Non-Serious' | 'Injured - Serious';
export type PMInjuryBodyPart = 'Head' | 'Upper body' | 'Lower body';

export interface PMInjuryRecord {
  severity?: PMInjurySeverity;
  body_part?: PMInjuryBodyPart;
  age_group?: SupervisorDemographicRecord['age_group'];
  gender?: SupervisorDemographicRecord['gender'];
  transported_to_hospital?: boolean;
}

export type PMClassification =
  | 'Preventable'
  | 'Non-Preventable'
  | 'Preventable Incident'
  | 'Non-Preventable Incident'
  | 'Not Reportable';

export type PMAppealDecision = 'Overturn' | 'Uphold';

export interface SupervisorOtherVehicleRecord {
  id: string;
  occupant_fatality_count?: number;
  deceased_occupants?: SupervisorDemographicRecord[];
  occupant_injuries?: boolean;
  occupant_injury_count?: number;
  injured_occupants?: SupervisorDemographicRecord[];
  type?: string;
  action?: string;
  point_of_impact?: string;
  direction?: string;
}

export interface AccidentReportData {
  // ── STEP 1: Safety Events ──────────────────────────────────────
  event_type?: string;
  operating_dart_vehicle?: boolean;     // Q2 – conditional on Assault/Fire/Op-Passenger
  mode?: string;                        // Bus | Light Rail Vehicle | Streetcar | Hi-Rail | Non-Revenue Vehicle
  is_on_behalf?: boolean;
  on_behalf_employee?: string;

  // Employee Information (Q5–Q24)
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
  division_supervisor?: string;
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

  // ── STEP 2: Collision Information ─────────────────────────────
  description_of_event?: string;
  incident_date?: string;
  incident_time?: string;

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

  // Weather (shared – option sets differ by mode)
  weather?: string;
  road_conditions?: string;
  lighting_conditions?: string;
  streetlights?: string;
  traffic_conditions?: string;
  traffic_controls?: string;
  roadway_configuration?: string;

  // ── STEP 3: People & Impact ────────────────────────────────────
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

  // Supervisor review
  supervisor_badge_number?: string;
  supervisor_name?: string;
  supervisor_first_name?: string;
  supervisor_last_name?: string;
  supervisor_division?: string;
  supervisor_operating_statement?: string;
  supervisor_incident_date?: string;
  supervisor_incident_time?: string;
  supervisor_arrival_date?: string;
  supervisor_arrival_time?: string;
  supervisor_street_on?: string;
  supervisor_cross_street?: string;
  supervisor_city?: string;
  supervisor_zip?: string;
  supervisor_event_at_bus_stop?: boolean;
  supervisor_bus_stop_name?: string;
  supervisor_has_bike_lane?: boolean;
  supervisor_location_category?: string;
  supervisor_station_applicable?: string;
  supervisor_grade_crossing_applicable?: string;
  supervisor_tunnel_location?: string;
  supervisor_address_of_event?: string;
  supervisor_event_description?: string;
  supervisor_report_city?: string;
  supervisor_report_type?: string;
  supervisor_dart_vehicle_type?: string;
  supervisor_vehicle_number?: string;
  supervisor_fleet?: string;
  supervisor_car_number?: string;
  supervisor_trip_id?: string;
  supervisor_employee_pullout_date?: string;
  supervisor_employee_pullout_time?: string;
  supervisor_train_pullout_date?: string;
  supervisor_train_pullout_time?: string;
  supervisor_lrv_fleet_type?: string;
  supervisor_operating_route_number?: string;
  supervisor_block_number?: string;
  supervisor_end_of_line_destination?: string;
  supervisor_bus_status_before?: string;
  supervisor_bus_status_after?: string;
  supervisor_rail_line?: string;
  supervisor_derailment_confirmed?: boolean;
  supervisor_derailment_details?: string;
  supervisor_revenue_service?: boolean;
  supervisor_scene_diagram_completed?: boolean;
  supervisor_scene_photos_taken?: boolean;
  supervisor_dart_vehicle_damaged?: boolean;
  supervisor_damage_requires_tow?: boolean;
  supervisor_damage_count?: number;
  supervisor_tow_count?: number;
  supervisor_other_vehicle_damage_count?: number;
  supervisor_other_vehicle_tow_count?: number;
  supervisor_other_vehicles_involved?: boolean;
  supervisor_other_vehicle_count?: number;
  supervisor_dart_employee_fatalities?: boolean;
  supervisor_dart_employee_fatality_count?: number;
  supervisor_dart_employee_injuries?: boolean;
  supervisor_dart_employee_injury_count?: number;
  supervisor_dart_employee_hospital_transport_count?: number;
  supervisor_passenger_fatalities?: boolean;
  supervisor_passenger_fatality_count?: number;
  supervisor_passenger_fatality_details?: SupervisorDemographicRecord[];
  supervisor_passenger_injuries?: boolean;
  supervisor_passenger_injury_count?: number;
  supervisor_passenger_injury_details?: SupervisorDemographicRecord[];
  supervisor_pedestrian_fatalities?: boolean;
  supervisor_pedestrian_fatality_count?: number;
  supervisor_pedestrian_fatality_details?: SupervisorDemographicRecord[];
  supervisor_pedestrian_injuries?: boolean;
  supervisor_pedestrian_injury_count?: number;
  supervisor_pedestrian_injury_details?: SupervisorDemographicRecord[];
  supervisor_collision_between_dart_vehicles?: boolean;
  supervisor_other_vehicle_records?: SupervisorOtherVehicleRecord[];
  supervisor_other_vehicle_fatality_count?: number;
  supervisor_other_vehicle_injury_count?: number;
  supervisor_equipment_damage_description?: string;
  supervisor_police_called?: boolean;
  supervisor_police_agency?: string;
  supervisor_police_officer_name?: string;
  supervisor_police_notified_by?: string;
  supervisor_police_report_number?: string;
  supervisor_confirmation_checked?: boolean;

  // Program manager review
  operator_datetime_correct?: boolean;
  employee_contacted_program_manager?: boolean;
  employee_contacted_program_manager_date?: string;
  employee_contact_method?: string;
  shared_corridor?: boolean;
  equipment_malfunction?: boolean;
  action_taken?: string;
  damage_to_property?: boolean;
  damage_to_property_description?: string;
  field_supervisor_statement?: string;
  police_statement?: string;
  program_manager_collision_with?: string;
  program_manager_contributing_factors?: string;
  program_manager_contributing_factors_list?: string[];
  program_manager_collision_type?: string;
  program_manager_dart_collision_type?: string;
  program_manager_other_collision_type?: string;
  program_manager_derail_configuration?: string;
  program_manager_cars_derailed_count?: number;
  program_manager_fatalities_present?: boolean;
  program_manager_injuries_present?: boolean;
  program_manager_life_safety_evacuation?: boolean;
  program_manager_estimated_total_damages?: string;
  program_manager_tow_away?: boolean;
  program_manager_tow_away_vehicle?: 'DART vehicle only' | 'Other vehicle only' | 'Both DART and other vehicle';
  program_manager_at_grade_crossing_or_intersection?: boolean;

  // Program manager identity (auto-filled from current role)
  program_manager_badge_number?: string;
  program_manager_first_name?: string;
  program_manager_last_name?: string;
  program_manager_department?: string;

  // Program manager injury records (structured, one per person)
  program_manager_employee_fatality_count?: number;
  program_manager_employee_injury_count?: number;
  program_manager_employee_injury_records?: PMInjuryRecord[];
  program_manager_passenger_fatality_count?: number;
  program_manager_passenger_fatality_records?: SupervisorDemographicRecord[];
  program_manager_passenger_injury_count?: number;
  program_manager_passenger_injury_records?: PMInjuryRecord[];
  program_manager_pedestrian_fatality_count?: number;
  program_manager_pedestrian_fatality_records?: SupervisorDemographicRecord[];
  program_manager_pedestrian_injury_count?: number;
  program_manager_pedestrian_injury_records?: PMInjuryRecord[];
  program_manager_other_vehicle_fatality_count?: number;
  program_manager_other_vehicle_fatality_records?: SupervisorDemographicRecord[];
  program_manager_other_vehicle_injury_count?: number;
  program_manager_other_vehicle_injury_records?: PMInjuryRecord[];

  // Classification
  program_manager_classification?: string;
  program_manager_classification_value?: PMClassification;
  program_manager_classification_date?: string;
  program_manager_classification_justification?: string;
  program_manager_classified_by_name?: string;
  program_manager_classified_by_badge?: string;

  // Appeal Section
  appeal_requested?: boolean;
  appeal_notes?: string;
  program_manager_first_appeal_decision?: PMAppealDecision;
  program_manager_first_appeal_date?: string;
  program_manager_first_appeal_time?: string;
  program_manager_first_appeal_completed_by?: string;
  program_manager_arb_decision?: PMAppealDecision;
  program_manager_arb_appeal_date?: string;
  program_manager_arb_appeal_time?: string;

  program_manager_confirmation_checked?: boolean;

  // PM reviewer decision on Supervisor's submitted section
  pm_supervisor_review_decision?: 'approved' | 'returned' | 'rejected' | 'reassigned';
  pm_supervisor_reviewed_at?: string;
  pm_supervisor_review_note?: string;
  pm_supervisor_reassigned_to_badge?: string;
  pm_supervisor_reassigned_to_name?: string;

  // PM "Hold" — case is parked in the PM queue without routing anywhere
  pm_on_hold?: boolean;
  pm_hold_note?: string;
  pm_held_at?: string;

  // Operator waiver — PM or Supervisor states whether the operator can file their own section.
  // operator_availability_confirmed: true = operator will file; false = waived (unavailable) with reason.
  operator_availability_confirmed?: boolean;
  operator_unavailable_reason?: string;
  operator_unavailable_notes?: string;
  operator_waived_by?: string;
  operator_waived_at?: string;

  // Impact diagram markers
  impact_markers?: { x: number; y: number; label?: string }[];

  // ── Legacy / Step 4 ───────────────────────────────────────────
  people_involved?: boolean;
  people?: Person[];
  other_vehicles?: OtherVehicle[];
  total_people_involved?: number;
  severity_level?: string;
  assigned_route?: string;
  operating_route?: string;
  county?: string;
  location_type?: string;
  nearest_intersection_or_stop?: string;
  direction_of_travel?: string;
  facility_name?: string;
  facility_area?: string;
  location_description?: string;
  incident_description?: string;
  service_status_at_time?: string;
  attachments?: File[];
  confirmation_checked?: boolean;
}