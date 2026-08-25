export interface Person {
  id: string;
  role: 'Passenger' | 'Pedestrian';
  name?: string;
  age_group?: SupervisorDemographicRecord['age_group'];
  gender?: 'Female' | 'Male';
  is_dart_employee?: boolean;
  injured?: boolean;
  fatal?: boolean;
  injured_body_part?: string;
  // Operator flow supports a "Not sure" answer for Passenger/Pedestrian transport status.
  transported_to_hospital?: boolean | 'not_sure';
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
  injured_occupants?: OtherVehicleOccupantInjury[];
  // Per-deceased-occupant demographics captured by the Program Manager flow.
  fatal_occupants?: OtherVehicleFatalOccupant[];
  dart_dart?: boolean;        // collision between two DART vehicles — changes the type list
  dart_employee?: boolean;    // supervisor/PM only — was the driver of this other vehicle a DART employee
  vehicle_type?: string;
  collision_type?: string;
  action?: string;
  point_of_impact?: string;
  direction?: string;         // direction relative to the DART vehicle
  damage?: boolean;
  damage_area?: string[];
  impact_markers?: { x: number; y: number; label?: string }[];
  disabling_damage?: boolean;
  tow_away?: boolean;
}

// Per-injured-occupant record used by the Operator, Field Supervisor, and Program Manager flows.
// Operator captures gender + hospital-transport tri-state; Field Supervisor also captures age group;
// Program Manager also captures injury severity and body part.
export interface OtherVehicleOccupantInjury {
  id: string;
  is_dart_employee?: boolean;
  age_group?: SupervisorDemographicRecord['age_group'];
  gender?: 'Female' | 'Male';
  transported?: 'yes' | 'no' | 'not_sure';
  severity?: PMInjurySeverity;
  body_part?: PMInjuryBodyPart;
}

// Per-deceased-occupant record for the Program Manager other-vehicle flow.
export interface OtherVehicleFatalOccupant {
  id: string;
  is_dart_employee?: boolean;
  age_group?: SupervisorDemographicRecord['age_group'];
  gender?: 'Female' | 'Male';
}

export interface PedestrianRecord {
  id: string;
  pedestrian_type?: string;
  pedestrian_action?: string;
  fled?: boolean;
}

export interface NearMissPedestrianRecord {
  id: string;
  gender?: 'Female' | 'Male';
  is_dart_employee?: boolean;
  pedestrian_type?: string;
  pedestrian_action?: string;
}

// One perpetrator entry in an assault report. The count of entries equals the
// number of perpetrators the employee reported (on board / pedestrian / vehicle #2).
export interface AssaultPerpetrator {
  id: string;
  // Legacy role retained for saved reports; `who_assaulted` is the card-level source of truth.
  role?: 'Passenger' | 'Pedestrian';
  who_assaulted?: 'customer_on_board' | 'customer_waiting' | 'motorist' | 'pedestrian';
  assault_method?: string;
  age?: 'child' | 'teen' | 'adult' | 'senior';
  gender?: 'Female' | 'Male';
  spat_on?: boolean;
  fled_scene?: boolean;
  perpetrator_arrested?: YesNoUnknown;
  perpetrator_removed_from_dart_vehicle?: YesNoUnknown;
}

export type YesNoUnknown = 'Yes' | 'No' | 'Unknown';

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
  id?: string;
  age_group?: 'Child (12 and under)' | 'Teen (13 to 18)' | 'Adult (19 to 60)' | 'Senior Citizen (61 and up)';
  gender?: 'Female' | 'Male';
  is_dart_employee?: boolean;
  injured_body_part?: 'Head' | 'Upper body' | 'Lower body';
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

// One entry per person for the SPM "People involved" card. Mirrors the Op/FS
// PersonListEditor UX (add-person + role dropdown) with SPM's outcome-first
// question set: fatality vs injury, severity, body part, age group, gender,
// transported.
export interface PMPersonRecord {
  id: string;
  role?: 'Passenger' | 'Pedestrian' | 'Operator';
  outcome?: 'Fatality' | 'Injured';
  is_dart_employee?: boolean;
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
  // Captured when an initiator acknowledges a possible duplicate and continues.
  duplicate_record_confirmation?: {
    existing_report_id: string;
    confirmed_at: string;
    confirmed_by_role: string;
    confirmed_by_name: string;
  };

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
  // Signal Violation
  signal_date?: string;
  signal_number?: string;
  signal_displaying_properly?: 'yes' | 'no' | 'not_observed';
  signal_territory?: 'Mainline Territory' | 'Yard Territory';
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

  // Derailment-only fields
  derailment_type?: 'Mainline' | 'Yard';

  // Trail a Switch fields
  trail_description?: string;
  trail_employee_pullout_date?: string;
  trail_employee_pullout_time?: string;
  trail_switch_configuration?: 'Interlocking' | 'Crossover' | 'Yard Switch';
  trail_switch_number_known?: boolean;
  trail_switch_number?: string;
  trail_derailment_confirmed?: boolean;
  trail_location_category?: string;
  trail_car_number?: string;
  trail_line_description?: string;
  trail_train_speed?: string;
  trail_train_damage?: boolean;
  trail_train_action?: string;
  trail_operator_injured?: boolean;
  trail_operator_injured_body_part?: string;
  trail_operator_transported?: boolean;
  trail_passengers_injured?: number;
  trail_passengers_transported?: number;
  trail_pedestrian_injuries?: number;
  trail_pedestrians_transported?: number;

  // ── Assault (Verbal or Physical) — event-specific fields ────────
  // Shared fields reused: operating_dart_vehicle, mode, incident_date/time,
  // street_on, cross_street, city, zip, vehicle_number, fleet_type, run_number,
  // car_number, lrv_consist_*, weather, road_conditions, lighting_conditions,
  // streetlights, employee_pullout_date/time, operator_injured,
  // operator_injured_body_part, operator_transported.
  assault_type?: 'Physical Assault' | 'Verbal Assault';
  assault_spat_on?: boolean;
  assault_method?: string;
  assault_description?: string;
  assault_involves?: 'customer_assaulted_worker' | 'worker_assaulted_worker';
  who_assaulted?: 'customer_on_board' | 'customer_waiting' | 'motorist' | 'pedestrian';
  assault_trigger?: string;
  driver_window_assault?: boolean;
  vehicle_status_before?: string;
  vehicle_status_after?: string;
  line_description?: string;
  vehicle_equipped_with?: string;
  assault_in_operator_driving_area?: boolean;
  operator_driving_area_security?: 'Fully Secured' | 'Partially Secured' | 'Not Secured';
  assault_location?: 'in_transit_vehicle' | 'transit_property_revenue' | 'transit_property_non_revenue' | 'non_transit_property' | 'outside_around_transit_vehicle';
  // When not in possession of a DART vehicle but assaulted while riding one.
  transit_vehicle_on?: string;
  transit_vehicle_number?: string;
  transit_route_or_line?: string;
  // Perpetrators — repeating groups, one entry per reported perpetrator.
  assault_perpetrators?: AssaultPerpetrator[];
  onboard_perpetrators?: AssaultPerpetrator[];
  pedestrian_perpetrators?: AssaultPerpetrator[];
  // Other vehicle #2 (motorist assault) — perpetrators + vehicle context.
  vehicle2_perpetrators?: AssaultPerpetrator[];
  vehicle2_occupants_count?: number;
  vehicle2_is_dart_vehicle?: boolean;
  vehicle2_type?: string;
  // Employee response
  notified_law_enforcement?: boolean;
  contacted_supervisor?: boolean;

  // Operator/Passenger Events (non-collision)
  operator_passenger_event_relating_to?: 'DART Employee' | 'Passenger/Non-Dart Employee';
  operator_passenger_event_type?: string;
  operator_passenger_evacuation_location?: string;
  operator_passenger_evacuation_reason?: string;
  operator_passenger_employee_injured?: boolean;
  operator_passenger_employee_transported?: boolean;
  operator_passenger_employee_body_part?: string;
  operator_passenger_injured_non_transit_employees?: number;
  operator_passenger_non_transit_employees_transported?: number;
  operator_passenger_defective_vehicle_exchanged?: boolean;
  operator_passenger_replacement_vehicle_number?: string;
  operator_passenger_location?: string;
  operator_passenger_vehicle_location?: string;
  operator_passenger_vehicle_speed?: string;
  operator_passenger_vehicle_action?: string;
  operator_passenger_transit_vehicle_on?: string;
  operator_passenger_transit_vehicle_number?: string;
  operator_passenger_transit_route_or_line?: string;

  // Weather (shared – option sets differ by mode)
  weather?: string;
  road_conditions?: string;
  lighting_conditions?: string;
  streetlights?: string;
  traffic_conditions?: string;
  traffic_controls?: string;
  roadway_configuration?: string;

  // Fire event fields
  fire_type?: 'Fire' | 'Smoke' | 'Fire and Smoke';
  fire_location?: string;
  fire_station_transit_center?: string;
  fire_address?: string;
  fire_started_how?: 'Arson' | 'Naturally' | 'Unaware';
  fire_responsible_for_starting?: string;
  fire_suppressed?: boolean;
  fire_responsible_for_suppressing?: string;
  fire_extinguisher_used?: boolean;
  fire_transit_vehicle_on?: string;
  fire_transit_vehicle_number?: string;
  fire_transit_route_or_line?: string;
  fire_evacuation_rail_right_of_way?: boolean;
  fire_other_employees_injured?: number;
  fire_passengers_injured?: number;
  fire_passengers_transported?: number;
  fire_pedestrians_injured?: number;
  fire_pedestrians_transported?: number;

  near_miss_description?: string;
  near_miss_date?: string;
  near_miss_time?: string;
  near_miss_location?: string;
  near_miss_location_category?: string;
  near_miss_street_on?: string;
  near_miss_cross_street?: string;
  near_miss_city?: string;
  near_miss_zip?: string;
  near_miss_reason?: 'Near-Miss Experienced' | 'Near-Miss Observed';
  near_miss_employee_involved?: string;
  near_miss_category?: 'Auto – Near Miss' | 'Pedestrian – Near Miss' | 'Fixed Object – Near Miss' | 'Non-Fixed Object – Near Miss';
  near_miss_vehicle_number?: string;
  near_miss_fleet_type?: string;
  near_miss_speed?: string;
  near_miss_vehicle_action?: string;
  near_miss_revenue_service?: boolean;
  near_miss_route?: string;
  near_miss_run?: string;
  near_miss_block?: string;
  near_miss_rail_line?: string;
  near_miss_end_of_line_destination?: string;
  near_miss_pullout_date?: string;
  near_miss_pullout_time?: string;
  near_miss_consist_count?: number;
  near_miss_consist_1?: string;
  near_miss_consist_2?: string;
  near_miss_consist_3?: string;
  near_miss_consist_4?: string;
  near_miss_weather?: string;
  near_miss_road_conditions?: string;
  near_miss_lighting_conditions?: string;
  near_miss_streetlights?: string;
  near_miss_traffic_conditions?: string;
  near_miss_traffic_controls?: string;
  near_miss_roadway_configuration?: string;
  near_miss_pedestrian_count?: number;
  near_miss_pedestrians?: NearMissPedestrianRecord[];
  near_miss_between_dart_vehicles?: boolean;
  near_miss_other_vehicle_type?: string;
  near_miss_other_vehicle_action?: string;
  near_miss_other_vehicles?: OtherVehicle[];

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
  ems_at_scene?: boolean;

  // Supervisor review
  supervisor_badge_number?: string;
  supervisor_name?: string;
  supervisor_first_name?: string;
  supervisor_last_name?: string;
  supervisor_division?: string;
  supervisor_operating_statement?: string;
  supervisor_incident_date?: string;
  supervisor_incident_time?: string;
  supervisor_went_to_scene?: boolean;
  supervisor_no_scene_reason?: string;
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
  supervisor_lrv_consist_count?: number;
  supervisor_lrv_consist_2?: string;
  supervisor_lrv_consist_3?: string;
  supervisor_lrv_consist_4?: string;
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
  // Field Supervisor's parallel DART-vehicle impact fields — mirror Operator's point-of-impact / damage-area / diagram.
  supervisor_point_of_impact?: string;
  supervisor_damage_area?: string[];
  supervisor_impact_markers?: { x: number; y: number; label?: string }[];
  supervisor_other_vehicle_damage_count?: number;
  supervisor_other_vehicle_tow_count?: number;
  supervisor_other_vehicles_involved?: boolean;
  supervisor_other_vehicle_count?: number;
  supervisor_dart_employee_fatalities?: boolean;
  supervisor_dart_employee_fatality_count?: number;
  supervisor_dart_employee_fatality_details?: SupervisorDemographicRecord[];
  supervisor_dart_employee_injuries?: boolean;
  supervisor_dart_employee_injury_count?: number;
  supervisor_dart_employee_injury_details?: SupervisorDemographicRecord[];
  supervisor_dart_employee_hospital_transport_count?: number;
  // Field Supervisor mirrors the Operator's People/Impact flow with parallel data
  // — the FS is source-of-truth even when the operator already submitted.
  supervisor_operator_injured?: boolean;
  supervisor_operator_injured_body_part?: string;
  supervisor_operator_transported?: boolean;
  // Field Supervisor outcome for the operator, mirrors the PM "DART Operator Injury" flow.
  supervisor_operator_outcome?: 'Not Injured' | 'Injured' | 'Fatality';
  supervisor_operator_injury_record?: PMInjuryRecord;
  supervisor_passengers_on_board?: number;
  supervisor_people_involved?: boolean;
  supervisor_people?: PMPersonRecord[];
  supervisor_police_at_scene?: boolean;
  supervisor_police_type?: string;
  supervisor_dart_supervisor_investigating?: boolean;
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
  // Field Supervisor's parallel per-vehicle records — mirrors Operator's `other_vehicles` shape.
  supervisor_other_vehicles?: OtherVehicle[];
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
  program_manager_statement?: string;
  program_manager_collision_with?: string;
  program_manager_contributing_factors?: string;
  program_manager_contributing_factors_list?: string[];
  // Single factor flagged as the primary driver for classification narrative.
  program_manager_primary_contributing_factor?: string;
  program_manager_collision_type?: string;
  program_manager_dart_collision_type?: string;
  program_manager_dart_action?: string;
  program_manager_other_collision_type?: string;
  program_manager_derailment_type?: 'Mainline derailment' | 'Yard derailment' | 'Shop derailment' | 'Work zone derailment';
  program_manager_derail_configuration?: string;
  program_manager_cars_derailed_count?: number;
  program_manager_axles_derailed_count?: number;
  program_manager_derailment_speed?: string;
  program_manager_primary_cause?: string;
  program_manager_primary_cause_other?: string;
  program_manager_damage_assessment?: string;
  program_manager_switch_position?: string;
  program_manager_post_event_actions?: string[];
  program_manager_equipment_condition?: string;
  program_manager_track_condition?: string;
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
  program_manager_employee_fatality_records?: SupervisorDemographicRecord[];
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
  // Unified per-person list for the SPM "People involved" card (passengers + pedestrians).
  program_manager_people?: PMPersonRecord[];
  // Yes/No gate that reveals the SPM per-person list.
  program_manager_people_involved?: boolean;
  // Yes/No gate that reveals the SPM damage-area diagram.
  program_manager_dart_vehicle_damaged?: boolean;
  // SPM-side confirmation that the damage disables the vehicle from further service.
  program_manager_disabling_damage?: boolean;
  // SPM-only aggregate: were any of the OTHER vehicles disabled by their damage, and which ones.
  program_manager_other_vehicles_disabling_damage_present?: boolean;
  program_manager_other_vehicles_disabling_damage_vehicle_ids?: string[];
  // Independent SPM record of DART vehicle impact points — mirrors the Op/FS diagram, kept separate
  // so each role's observations survive the review cycle for downstream reporting (NTSD, TxDOT).
  program_manager_impact_markers?: { x: number; y: number; label?: string }[];
  // Per-operator list for the SPM "DART operator injury" card.
  program_manager_operator_people?: PMPersonRecord[];
  // Single-operator outcome for the SPM "DART operator injury" card.
  program_manager_operator_outcome?: 'Not Injured' | 'Injured' | 'Fatality';
  program_manager_other_vehicle_fatality_count?: number;
  program_manager_other_vehicle_fatality_records?: SupervisorDemographicRecord[];
  program_manager_other_vehicle_injury_count?: number;
  program_manager_other_vehicle_injury_records?: PMInjuryRecord[];
  // Program manager per-vehicle details (mirror Operator / Field Supervisor shape)
  program_manager_other_vehicles_involved?: boolean;
  program_manager_other_vehicles?: OtherVehicle[];

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