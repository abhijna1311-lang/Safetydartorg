import '../styles/globals.css';
import { useState } from 'react';
import { OperatorHome } from './components/OperatorHome';
import { AccidentReportWizard } from './components/AccidentReportWizard';
import { MyDrafts } from './components/MyDrafts';
import { MySubmissions } from './components/MySubmissions';
import { UserRoleProvider } from './context/UserRoleContext';
import type { WorkflowReport } from './types/workflow-report';
import type { AccidentReportData } from './types/accident-report';
import { EMPLOYEE_DB } from './data/employeeDatabase';

type View = 'home' | 'new-report' | 'drafts' | 'submissions';

function workdayEmployeeFields(badge: string): Partial<AccidentReportData> {
  const employee = EMPLOYEE_DB[badge];
  if (!employee) {
    return {};
  }

  return {
    employee_badge_number: employee.badge,
    employee_name: employee.name,
    employee_phone: employee.phone,
    employee_gender: employee.gender,
    employee_address: employee.address,
    employee_age: employee.age,
    date_of_hire: employee.hire_date,
    employee_status: employee.status,
    department: employee.department,
    assigned_division: employee.division,
    division_supervisor: employee.division_supervisor,
    division_work: employee.division_work,
    cost_center: employee.cost_center,
    service_years: employee.service_years,
    service_months: employee.service_months,
    service_days: employee.service_days,
    is_student_employee: employee.is_student,
  };
}

const INITIAL_REPORTS: WorkflowReport[] = [
  // ── Test scenarios: one per event-type × vehicle-mode combination so testers can
  // see how the interface branches. Each sits in program-manager-review so the PM can
  // open it and view the mode-filtered operator report (and, for Bus + Derailment, the
  // data-integrity warning since derailment is only valid for rail modes).
  {
    id: 'AE-2026-1050',
    initiatedBy: 'Operator',
    workflowStage: 'program-manager-review',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'submitted', submittedBy: 'Operator', submittedAt: '2026-07-15T09:20:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-07-15T11:00:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-07-15T09:00:00.000Z',
    lastSavedAt: '2026-07-15T11:00:00.000Z',
    dueBy: '07/18/2026',
    lastSubmittedBy: 'Supervisor',
    closedAt: null,
    formData: {
      ...workdayEmployeeFields('90001'),
      event_type: 'Collision',
      mode: 'Bus',
      operating_dart_vehicle: true,
      incident_date: '2026-07-15',
      incident_time: '09:12',
      description_of_event: 'A sedan merged from the curb lane on Route 15 and struck the right side of the bus. Operator stopped, checked passengers, and notified dispatch.',
      vehicle_number: '2045',
      fleet_type: '40 ft bus',
      route_number: '15',
      run_number: '15-04',
      street_on: 'Cedar Blvd',
      cross_street: '7th St',
      city: 'Dallas',
      zip: '75203',
      event_at_bus_stop: true,
      bus_stop_name: 'Cedar Blvd at 7th St',
      bus_status_before: 'In motion',
      bus_status_after: 'Stopped at scene',
      collision_type: 'Collision – with Auto',
      bus_action: 'Proceeding straight through traffic lane',
      point_of_impact: 'Right side midpoint near rear door',
      bus_speed: '18 mph',
      bus_damage: true,
      bus_damage_confirmed: true,
      weather: 'Clear',
      road_conditions: 'Dry',
      lighting_conditions: 'Daylight',
      passengers_on_board: 14,
      passengers_injured: 1,
      severity_level: 'Moderate',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Bus Operations',
      supervisor_arrival_date: '2026-07-15',
      supervisor_arrival_time: '09:28',
      supervisor_event_description: 'Arrived on scene, secured the area, and documented right-side contact damage.',
      supervisor_damage_count: 1,
      supervisor_tow_count: 0,
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1051',
    initiatedBy: 'Operator',
    workflowStage: 'program-manager-review',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'submitted', submittedBy: 'Operator', submittedAt: '2026-07-14T17:05:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-07-14T18:30:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-07-14T16:45:00.000Z',
    lastSavedAt: '2026-07-14T18:30:00.000Z',
    dueBy: '07/17/2026',
    lastSubmittedBy: 'Supervisor',
    closedAt: null,
    formData: {
      ...workdayEmployeeFields('10002'),
      event_type: 'Collision',
      mode: 'Light Rail Vehicle',
      operating_dart_vehicle: true,
      incident_date: '2026-07-14',
      incident_time: '16:40',
      description_of_event: 'A passenger car entered the grade crossing on the Red Line and struck the front of the light rail vehicle.',
      train_number: 'R-142',
      car_number: '2',
      lrv_fleet_type: 'SLRV',
      rail_line: 'Red Line',
      location_category: 'Grade crossing',
      street_on: 'Pacific Ave',
      city: 'Dallas',
      train_status_before: 'In motion',
      train_status_after: 'Stopped at scene',
      lrv_collision_type: 'Collision – with Auto',
      train_action: 'Proceeding through grade crossing',
      lrv_point_of_impact: 'Front coupler',
      train_speed: '25 mph',
      train_damage: true,
      weather: 'Clear',
      road_conditions: 'Dry',
      lighting_conditions: 'Daylight',
      passengers_on_board: 40,
      passengers_injured: 2,
      severity_level: 'Serious',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Rail Operations',
      supervisor_arrival_date: '2026-07-14',
      supervisor_arrival_time: '16:55',
      supervisor_event_description: 'Confirmed grade-crossing signals were active and documented front coupler damage.',
      supervisor_damage_count: 1,
      supervisor_tow_count: 1,
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1052',
    initiatedBy: 'Operator',
    workflowStage: 'program-manager-review',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'submitted', submittedBy: 'Operator', submittedAt: '2026-07-13T07:20:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-07-13T08:40:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-07-13T07:00:00.000Z',
    lastSavedAt: '2026-07-13T08:40:00.000Z',
    dueBy: '07/16/2026',
    lastSubmittedBy: 'Supervisor',
    closedAt: null,
    formData: {
      ...workdayEmployeeFields('90001'),
      event_type: 'Derailment',
      mode: 'Bus',
      operating_dart_vehicle: true,
      incident_date: '2026-07-13',
      incident_time: '07:05',
      description_of_event: 'Bus left the roadway and came to rest against a barrier. The report was filed as a Derailment on a Bus, which the system flags for review.',
      vehicle_number: '4088',
      fleet_type: '40 ft bus',
      route_number: '201',
      street_on: 'Pine Ave',
      cross_street: '8th St',
      city: 'Dallas',
      bus_status_before: 'In motion',
      bus_status_after: 'Off roadway',
      weather: 'Rain',
      road_conditions: 'Wet',
      lighting_conditions: 'Dawn',
      passengers_on_board: 9,
      passengers_injured: 0,
      severity_level: 'Minor',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Bus Operations',
      supervisor_arrival_date: '2026-07-13',
      supervisor_arrival_time: '07:20',
      supervisor_event_description: 'Noted the event was logged as a derailment for a bus and flagged it for program manager review.',
      supervisor_damage_count: 1,
      supervisor_tow_count: 1,
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1053',
    initiatedBy: 'Operator',
    workflowStage: 'program-manager-review',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'submitted', submittedBy: 'Operator', submittedAt: '2026-07-12T22:35:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-07-12T23:50:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-07-12T22:20:00.000Z',
    lastSavedAt: '2026-07-12T23:50:00.000Z',
    dueBy: '07/16/2026',
    lastSubmittedBy: 'Supervisor',
    closedAt: null,
    formData: {
      ...workdayEmployeeFields('10002'),
      event_type: 'Derailment',
      mode: 'Light Rail Vehicle',
      operating_dart_vehicle: true,
      incident_date: '2026-07-12',
      incident_time: '22:15',
      description_of_event: 'The light rail vehicle trailed an improperly lined switch and the lead truck derailed on the Blue Line.',
      train_number: 'R-118',
      car_number: '1',
      lrv_fleet_type: 'SLRV',
      rail_line: 'Blue Line',
      location_category: 'Mainline',
      street_on: 'Corinth St',
      city: 'Dallas',
      train_status_before: 'In motion',
      train_status_after: 'Derailed, stopped',
      train_action: 'Proceeding over switch',
      train_speed: '15 mph',
      train_damage: true,
      collision_resulted_in_derailment: false,
      weather: 'Clear',
      road_conditions: 'Dry',
      lighting_conditions: 'Dark',
      passengers_on_board: 12,
      passengers_injured: 0,
      severity_level: 'Serious',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Rail Operations',
      supervisor_arrival_date: '2026-07-12',
      supervisor_arrival_time: '22:35',
      supervisor_event_description: 'Confirmed lead-truck derailment at the switch and notified the track supervisor.',
      supervisor_damage_count: 1,
      supervisor_tow_count: 0,
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1046',
    initiatedBy: 'Program Manager',
    workflowStage: 'initiation',
    overallStatus: 'open',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'not-started' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'not-started' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'in-progress' },
    },
    currentStep: 1,
    createdAt: '2026-06-12T06:50:00.000Z',
    lastSavedAt: '2026-06-12T07:05:00.000Z',
    dueBy: '06/13/2026',
    lastSubmittedBy: null,
    closedAt: null,
    formData: {
      event_type: 'Collision',
      mode: 'Bus',
      is_on_behalf: true,
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-12',
      incident_time: '06:47',
      street_on: 'Jefferson Blvd',
      city: 'Dallas',
      description_of_event: 'Program manager started the case and saved the intake before handing it to the operator.',
      operator_datetime_correct: true,
      employee_contacted_program_manager_date: '2026-06-12',
      program_manager_classification: 'Classification pending until operator and supervisor sections are submitted.',
      severity_level: 'Moderate',
    },
  },
  {
    id: 'AE-2026-1045',
    initiatedBy: 'Supervisor',
    workflowStage: 'operator-completion',
    overallStatus: 'open',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'not-required' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'in-progress' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'not-started' },
    },
    currentStep: 2,
    createdAt: '2026-06-11T11:05:00.000Z',
    lastSavedAt: '2026-06-11T11:40:00.000Z',
    dueBy: '06/13/2026',
    lastSubmittedBy: null,
    closedAt: null,
    formData: {
      event_type: 'Near Miss',
      mode: 'Non-Revenue Vehicle',
      is_on_behalf: false,
      employee_badge_number: '90002',
      employee_name: 'Alexia Putellas',
      incident_date: '2026-06-11',
      incident_time: '11:02',
      vehicle_number: '5201',
      street_on: 'Akard St',
      cross_street: 'Pacific Ave',
      city: 'Dallas',
      description_of_event: 'Supervisor is filing the report for themselves and should complete the full form before program manager review.',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Bus Operations',
      severity_level: 'Minor',
    },
  },
  {
    id: 'AE-2026-1044',
    initiatedBy: 'Operator',
    workflowStage: 'supervisor-review',
    overallStatus: 'correction-requested',
    sections: {
      operator: {
        key: 'operator',
        ownerRole: 'Operator',
        label: 'Operator section',
        status: 'submitted',
        submittedBy: 'Operator',
        submittedAt: '2026-06-11T08:40:00.000Z',
      },
      supervisor: {
        key: 'supervisor',
        ownerRole: 'Supervisor',
        label: 'Supervisor section collision',
        status: 'returned',
        submittedBy: 'Supervisor',
        submittedAt: '2026-06-11T09:05:00.000Z',
        returnedBy: 'Program Manager',
        returnedAt: '2026-06-11T09:40:00.000Z',
        correctionNote: 'Add the field supervisor statement and confirm the passenger injury severity before I can classify this.',
      },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-06-11T07:40:00.000Z',
    lastSavedAt: '2026-06-11T09:40:00.000Z',
    dueBy: '06/12/2026',
    lastSubmittedBy: 'Program Manager',
    handoffNote: 'Add the field supervisor statement and confirm the passenger injury severity before I can classify this.',
    handoffHistory: [
      {
        id: 'AE-2026-1044-1',
        fromRole: 'Operator',
        toRole: 'Supervisor',
        fromStage: 'operator-completion',
        toStage: 'supervisor-review',
        action: 'forwarded',
        createdAt: '2026-06-11T08:40:00.000Z',
      },
      {
        id: 'AE-2026-1044-2',
        fromRole: 'Supervisor',
        toRole: 'Program Manager',
        fromStage: 'supervisor-review',
        toStage: 'program-manager-review',
        action: 'section-submitted',
        targetSection: 'supervisor',
        createdAt: '2026-06-11T09:05:00.000Z',
      },
      {
        id: 'AE-2026-1044-3',
        fromRole: 'Program Manager',
        toRole: 'Supervisor',
        fromStage: 'program-manager-review',
        toStage: 'supervisor-review',
        action: 'section-returned',
        targetSection: 'supervisor',
        note: 'Add the field supervisor statement and confirm the passenger injury severity before I can classify this.',
        createdAt: '2026-06-11T09:40:00.000Z',
      },
    ],
    closedAt: null,
    formData: {
      event_type: 'Collision',
      mode: 'Bus',
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-11',
      incident_time: '07:36',
      vehicle_number: '2045',
      route_number: '15',
      street_on: 'Maple Ave',
      cross_street: '9th St',
      city: 'Dallas',
      description_of_event: 'Program manager returned the supervisor section for clarification before final classification.',
      severity_level: 'Moderate',
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1042',
    initiatedBy: 'Supervisor',
    workflowStage: 'operator-completion',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'pending' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-06-10T08:25:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 1,
    createdAt: '2026-06-10T08:15:00.000Z',
    lastSavedAt: '2026-06-10T08:25:00.000Z',
    dueBy: '06/12/2026',
    lastSubmittedBy: 'Supervisor',
    closedAt: null,
    formData: {
      event_type: 'Collision',
      mode: 'Bus',
      is_on_behalf: true,
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-10',
      incident_time: '08:14',
      vehicle_number: '2045',
      route_number: '15',
      block_number: 'BLK-204',
      street_on: 'Main St',
      cross_street: '5th Ave',
      city: 'Dallas',
      zip: '75201',
      description_of_event: 'Supervisor opened the case after the operator did not file on time.',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Bus Operations',
      supervisor_incident_date: '2026-06-10',
      supervisor_incident_time: '08:14',
      supervisor_arrival_date: '2026-06-10',
      supervisor_arrival_time: '08:22',
      supervisor_street_on: 'Main St',
      supervisor_cross_street: '5th Ave',
      supervisor_city: 'Dallas',
      supervisor_zip: '75201',
      supervisor_event_description: 'Supervisor arrived after dispatch call, secured location, and collected initial scene details.',
      supervisor_revenue_service: true,
      supervisor_damage_count: 1,
      supervisor_tow_count: 0,
      supervisor_passenger_injury_count: 0,
      severity_level: 'Moderate',
    },
  },
  {
    id: 'AE-2026-1041',
    initiatedBy: 'Operator',
    workflowStage: 'operator-completion',
    overallStatus: 'open',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'in-progress' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'not-started' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'not-started' },
    },
    currentStep: 2,
    createdAt: '2026-06-09T14:10:00.000Z',
    lastSavedAt: '2026-06-09T14:22:00.000Z',
    dueBy: '06/13/2026',
    lastSubmittedBy: null,
    closedAt: null,
    formData: {
      event_type: 'Collision',
      mode: 'Bus',
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-09',
      incident_time: '14:08',
      vehicle_number: '5201',
      route_number: '5',
      street_on: 'Elm St',
      cross_street: '2nd Ave',
      city: 'Dallas',
      zip: '75202',
      severity_level: 'Minor',
    },
  },
  {
    id: 'AE-2026-1037',
    initiatedBy: 'Operator',
    workflowStage: 'supervisor-review',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'submitted', submittedBy: 'Operator', submittedAt: '2026-06-08T18:10:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'pending' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-06-08T16:00:00.000Z',
    lastSavedAt: '2026-06-08T18:10:00.000Z',
    dueBy: '06/11/2026',
    lastSubmittedBy: 'Operator',
    closedAt: null,
    formData: {
      ...workdayEmployeeFields('90001'),
      event_type: 'Collision',
      mode: 'Bus',
      is_on_behalf: false,
      regular_day_off_type: 'Consecutive',
      rdo_consecutive: 'Sun/Mon',
      operating_dart_vehicle: true,
      incident_date: '2026-06-08',
      incident_time: '15:55',
      description_of_event: 'While operating Route 15 eastbound, the bus was sideswiped by a gray sedan entering the lane from the curb. I stopped the bus, checked passengers, notified dispatch, and waited for police and field supervision.',
      vehicle_number: '2045',
      trip_id: 'T-15-2448',
      block_number: 'BLK-204',
      employee_pullout_date: '2026-06-08',
      employee_pullout_time: '14:20',
      route_number: '15',
      run_number: '15-04',
      end_of_line_destination: 'Downtown Transit Center',
      fleet_type: '40 ft bus',
      street_on: 'Cedar Blvd',
      cross_street: '7th St',
      city: 'Dallas',
      zip: '75203',
      event_at_bus_stop: true,
      bus_stop_name: 'Cedar Blvd at 7th St farside stop',
      bus_status_before: 'In motion',
      bus_status_after: 'Stopped at scene',
      has_bike_lane: true,
      collision_type: 'Collision – with Auto',
      bus_damage: true,
      bus_damage_confirmed: true,
      bus_action: 'Proceeding straight through traffic lane',
      point_of_impact: 'Right side midpoint near rear door',
      bus_speed: '18 mph',
      runaway_vehicle: false,
      parking_brake_engaged: true,
      evacuation_life_safety: false,
      weather: 'Clear',
      road_conditions: 'Dry',
      lighting_conditions: 'Daylight',
      streetlights: 'Present',
      traffic_conditions: 'Moderate',
      traffic_controls: 'Signalized intersection',
      roadway_configuration: 'Four-lane arterial with curb lane',
      operator_injured: false,
      operator_transported: false,
      other_employees_injured_count: 0,
      passengers_on_board: 18,
      passenger_fatalities: 0,
      passengers_injured: 1,
      passenger_action: 'One passenger reported shoulder soreness after the stop',
      which_door: 'Rear door area',
      passengers_fled: 0,
      courtesy_cards: 18,
      passengers_transported: 0,
      pedestrians_involved: 1,
      pedestrian_groups: [{ id: 'ped-1', pedestrian_type: 'Bystander', pedestrian_action: 'Witnessed event from sidewalk', fled: false }],
      pedestrians_fled: 0,
      pedestrian_fatalities: 0,
      pedestrian_injuries: 0,
      pedestrians_transported: 0,
      other_vehicle_occupants: 2,
      other_vehicle_fatalities: 0,
      other_vehicle_injuries: 1,
      other_vehicle_fled: 0,
      other_vehicle_transported: 0,
      dart_dart_collision: false,
      other_vehicle_type: 'Gray sedan',
      other_vehicle_action: 'Merged from curb lane into bus path',
      other_vehicle_point_of_impact: 'Driver side front quarter panel',
      other_vehicle_direction: 'Eastbound',
      other_vehicle_damage: true,
      other_vehicle_damage_area: 'Driver side front fender and mirror',
      other_vehicle_tow_away: 'No',
      third_vehicle_involved: true,
      third_vehicle_collided: false,
      third_vehicle: {
        occupants: 1,
        fatalities: 0,
        injuries: 0,
        fled: 0,
        transported: 0,
        dart_collision: false,
        type: 'White pickup witness vehicle',
        action: 'Stopped behind bus after event',
        point_of_impact: 'No contact',
        direction: 'Eastbound',
        damage: false,
        damage_area: 'None',
        tow_away: 'No',
      },
      police_at_scene: true,
      police_type: 'Dallas Police',
      dart_supervisor_investigating: true,
      any_injuries: true,
      total_people_involved: 21,
      service_status_at_time: 'In revenue service',
      severity_level: 'Moderate',
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1032',
    initiatedBy: 'Supervisor',
    workflowStage: 'program-manager-review',
    overallStatus: 'waiting-on-sections',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'submitted', submittedBy: 'Operator', submittedAt: '2026-06-07T11:20:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'submitted', submittedBy: 'Supervisor', submittedAt: '2026-06-07T13:30:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'pending' },
    },
    currentStep: 4,
    createdAt: '2026-06-07T10:45:00.000Z',
    lastSavedAt: '2026-06-07T13:30:00.000Z',
    dueBy: '06/12/2026',
    lastSubmittedBy: 'Supervisor',
    closedAt: null,
    formData: {
      event_type: 'Passenger Injury',
      mode: 'Light Rail Vehicle',
      is_on_behalf: true,
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-07',
      incident_time: '10:38',
      train_number: 'R-301',
      address_of_event: 'Downtown Station',
      description_of_event: 'Supervisor added scene notes and routed for final classification.',
      severity_level: 'Serious',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Rail Operations',
      supervisor_arrival_date: '2026-06-07',
      supervisor_arrival_time: '10:52',
      supervisor_event_description: 'Scene reviewed and operator statement collected.',
      supervisor_damage_count: 0,
      supervisor_tow_count: 0,
      confirmation_checked: true,
    },
  },
  {
    id: 'AE-2026-1025',
    initiatedBy: 'Operator',
    workflowStage: 'closed',
    overallStatus: 'closed',
    sections: {
      operator: { key: 'operator', ownerRole: 'Operator', label: 'Operator section', status: 'accepted', submittedBy: 'Operator', submittedAt: '2026-06-05T10:00:00.000Z' },
      supervisor: { key: 'supervisor', ownerRole: 'Supervisor', label: 'Supervisor section collision', status: 'accepted', submittedBy: 'Supervisor', submittedAt: '2026-06-05T11:10:00.000Z' },
      programManager: { key: 'programManager', ownerRole: 'Program Manager', label: 'Program manager section', status: 'accepted', submittedBy: 'Program Manager', submittedAt: '2026-06-05T12:20:00.000Z' },
    },
    currentStep: 4,
    createdAt: '2026-06-05T09:10:00.000Z',
    lastSavedAt: '2026-06-05T12:20:00.000Z',
    dueBy: '06/09/2026',
    lastSubmittedBy: 'Program Manager',
    closedAt: '2026-06-05T12:20:00.000Z',
    formData: {
      event_type: 'Collision',
      mode: 'Bus',
      employee_badge_number: '90001',
      employee_name: 'Bukayo Saka',
      incident_date: '2026-06-05',
      incident_time: '09:02',
      vehicle_number: '4089',
      route_number: '201',
      street_on: 'Pine Ave',
      cross_street: '8th St',
      city: 'Dallas',
      zip: '75204',
      description_of_event: 'Closed after final program manager classification.',
      severity_level: 'Minor',
      supervisor_badge_number: '90002',
      supervisor_name: 'Alexia Putellas',
      supervisor_division: 'Bus Operations',
      supervisor_arrival_date: '2026-06-05',
      supervisor_arrival_time: '09:18',
      supervisor_event_description: 'No injuries observed. Minor property contact documented at the scene.',
      supervisor_damage_count: 1,
      supervisor_tow_count: 0,
      operator_datetime_correct: true,
      employee_contacted_program_manager_date: '2026-06-05',
      program_manager_collision_with: 'Collision – with Fixed Object',
      action_taken: 'Reviewed operator and supervisor sections. Classification recorded.',
      program_manager_classification: 'Preventable',
      confirmation_checked: true,
    },
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [reports, setReports] = useState<WorkflowReport[]>(INITIAL_REPORTS);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    if (view !== 'new-report') {
      setActiveReportId(null);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setActiveReportId(null);
  };

  const handleStartNewReport = () => {
    setActiveReportId(null);
    setCurrentView('new-report');
  };

  const handleOpenReport = (reportId: string) => {
    setActiveReportId(reportId);
    setCurrentView('new-report');
  };

  const handleSaveReport = (report: WorkflowReport) => {
    setReports((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === report.id);
      if (existingIndex === -1) {
        return [report, ...prev];
      }

      const next = [...prev];
      next[existingIndex] = report;
      return next;
    });
    setActiveReportId(report.id);
  };

  const handleDeleteDraft = (reportId: string) => {
    setReports((prev) => prev.filter((report) => report.id !== reportId));
    if (activeReportId === reportId) {
      setActiveReportId(null);
    }
  };

  const activeReport = activeReportId ? reports.find((report) => report.id === activeReportId) || null : null;

  return (
    <UserRoleProvider>
      <>
        {currentView === 'home' && (
          <OperatorHome
            onNavigate={handleNavigate}
            onStartNewReport={handleStartNewReport}
            onOpenReport={handleOpenReport}
            onDeleteDraft={handleDeleteDraft}
            reports={reports}
          />
        )}

        {currentView === 'new-report' && (
          <AccidentReportWizard
            onNavigate={handleNavigate}
            onBackToHome={handleBackToHome}
            initialReport={activeReport}
            onSaveReport={handleSaveReport}
          />
        )}

        {currentView === 'drafts' && (
          <MyDrafts
            onNavigate={handleNavigate}
            onBackToHome={handleBackToHome}
            onResumeReport={handleOpenReport}
            onDeleteDraft={handleDeleteDraft}
            drafts={reports}
          />
        )}

        {currentView === 'submissions' && (
          <MySubmissions
            onNavigate={handleNavigate}
            onBackToHome={handleBackToHome}
            reports={reports}
          />
        )}
      </>
    </UserRoleProvider>
  );
}