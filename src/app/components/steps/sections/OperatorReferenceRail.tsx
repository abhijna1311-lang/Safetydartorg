import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Printer, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { VehicleImpactDiagram } from '../../VehicleImpactDiagram';
import type { AccidentReportData, PedestrianRecord } from '../../../types/accident-report';
import type { WorkflowSectionStatus } from '../../../types/workflow-report';

interface Props {
  data: AccidentReportData;
  operatorStatus?: WorkflowSectionStatus;
  className?: string;
  showHeader?: boolean;
}

// Same silhouette-picker used by the reference drawer for the FS diagram.
function getImpactVariant(vehicleType: string | undefined): 'bus' | 'rail' | 'streetcar' | 'nrv' {
  if (vehicleType === 'Light Rail Vehicle') return 'rail';
  if (vehicleType === 'Streetcar') return 'streetcar';
  if (vehicleType === 'Hi-Rail' || vehicleType === 'Non-Revenue Vehicle' || vehicleType === 'NRV') return 'nrv';
  return 'bus';
}

interface OperatorFieldEntry {
  id: string;
  section: string;
  label: string;
  value: string;
}

interface TranscriptFieldDefinition {
  id: string;
  section: string;
  label: string;
  path?: string;
  getValue?: (data: AccidentReportData) => unknown;
}

interface ReportAttachment {
  id: string;
  name: string;
  sizeLabel?: string;
  file?: File;
}

interface ReportSectionCard {
  id: string;
  title: string;
  entries?: OperatorFieldEntry[];
  attachments?: ReportAttachment[];
}

const OPERATOR_TRANSCRIPT_FIELDS: TranscriptFieldDefinition[] = [
  {
    id: 'is_on_behalf',
    section: 'Incident Basics',
    label: 'Is this case for another DART employee?',
    path: 'is_on_behalf',
  },
  {
    id: 'on_behalf_employee',
    section: 'Incident Basics',
    label: 'Employee name or badge number',
    getValue: (data) => {
      if (!data.on_behalf_employee) {
        return undefined;
      }
      return data.employee_name
        ? `${data.employee_name} · #${data.on_behalf_employee}`
        : `#${data.on_behalf_employee}`;
    },
  },
  {
    id: 'is_student_employee',
    section: 'Incident Basics',
    label: 'Student employee?',
    path: 'is_student_employee',
  },
  {
    id: 'regular_day_off_type',
    section: 'Incident Basics',
    label: 'Regular day off',
    path: 'regular_day_off_type',
  },
  {
    id: 'rdo_consecutive',
    section: 'Incident Basics',
    label: 'Regular days off (RDO) - Consecutive',
    path: 'rdo_consecutive',
  },
  {
    id: 'rdo_split_1',
    section: 'Incident Basics',
    label: 'RDO Split - Day 1',
    path: 'rdo_split_1',
  },
  {
    id: 'rdo_split_2',
    section: 'Incident Basics',
    label: 'RDO Split - Day 2',
    path: 'rdo_split_2',
  },
  {
    id: 'event_type',
    section: 'Incident Basics',
    label: 'Type of event',
    path: 'event_type',
  },
  {
    id: 'operating_dart_vehicle',
    section: 'Incident Basics',
    label: 'Were you operating a DART vehicle?',
    path: 'operating_dart_vehicle',
  },
  {
    id: 'mode',
    section: 'Incident Basics',
    label: 'Vehicle mode',
    path: 'mode',
  },

  {
    id: 'description_of_event',
    section: 'Event description & timing',
    label: 'Description of event',
    path: 'description_of_event',
  },
  {
    id: 'incident_date',
    section: 'Event description & timing',
    label: 'Event date',
    path: 'incident_date',
  },
  {
    id: 'incident_time',
    section: 'Event description & timing',
    label: 'Event time',
    path: 'incident_time',
  },

  {
    id: 'vehicle_number',
    section: 'Vehicle details',
    label: 'Bus vehicle number',
    path: 'vehicle_number',
  },
  {
    id: 'fleet_type',
    section: 'Vehicle details',
    label: 'Fleet type',
    path: 'fleet_type',
  },
  {
    id: 'trip_id',
    section: 'Vehicle details',
    label: 'Trip ID',
    path: 'trip_id',
  },
  {
    id: 'block_number',
    section: 'Vehicle details',
    label: 'Block number',
    path: 'block_number',
  },
  {
    id: 'employee_pullout_date',
    section: 'Vehicle details',
    label: 'Employee pull-out date',
    path: 'employee_pullout_date',
  },
  {
    id: 'employee_pullout_time',
    section: 'Vehicle details',
    label: 'Employee pull-out time',
    path: 'employee_pullout_time',
  },

  {
    id: 'event_at_bus_stop',
    section: 'Location',
    label: 'Did the event occur at a bus stop?',
    path: 'event_at_bus_stop',
  },
  {
    id: 'bus_stop_name',
    section: 'Location',
    label: 'Name of the bus stop',
    path: 'bus_stop_name',
  },
  {
    id: 'street_on',
    section: 'Location',
    label: 'Street On',
    path: 'street_on',
  },
  {
    id: 'cross_street',
    section: 'Location',
    label: 'Cross Street',
    path: 'cross_street',
  },
  {
    id: 'city',
    section: 'Location',
    label: 'City',
    path: 'city',
  },
  {
    id: 'zip',
    section: 'Location',
    label: 'ZIP Code',
    path: 'zip',
  },
  {
    id: 'address_of_event',
    section: 'Location',
    label: 'Address of event',
    path: 'address_of_event',
  },

  {
    id: 'bus_status_before',
    section: 'Bus status & route',
    label: 'Bus status before event',
    path: 'bus_status_before',
  },
  {
    id: 'bus_status_after',
    section: 'Bus status & route',
    label: 'Bus status after event',
    path: 'bus_status_after',
  },
  {
    id: 'route_number',
    section: 'Bus status & route',
    label: 'Route number',
    path: 'route_number',
  },
  {
    id: 'run_number',
    section: 'Bus status & route',
    label: 'Run number',
    path: 'run_number',
  },
  {
    id: 'end_of_line_destination',
    section: 'Bus status & route',
    label: 'End of line destination',
    path: 'end_of_line_destination',
  },
  {
    id: 'has_bike_lane',
    section: 'Bus status & route',
    label: 'Does the street have a designated bike lane?',
    path: 'has_bike_lane',
  },

  {
    id: 'collision_type',
    section: 'Bus collision details',
    label: 'Event type with',
    path: 'collision_type',
  },
  {
    id: 'bus_action',
    section: 'Bus collision details',
    label: 'Bus action at time of event',
    path: 'bus_action',
  },
  {
    id: 'point_of_impact',
    section: 'Bus collision details',
    label: 'Point of impact',
    path: 'point_of_impact',
  },
  {
    id: 'bus_speed',
    section: 'Bus collision details',
    label: 'Bus speed at time of event (mph)',
    path: 'bus_speed',
  },
  {
    id: 'impact_markers',
    section: 'Bus collision details',
    label: 'Vehicle impact diagram',
    getValue: (data) => {
      if (!Array.isArray(data.impact_markers) || data.impact_markers.length === 0) {
        return undefined;
      }
      return data.impact_markers
        .map((marker, index) => `Marker ${index + 1}: x=${Math.round(marker.x)}, y=${Math.round(marker.y)}`)
        .join('\n');
    },
  },
  {
    id: 'bus_damage',
    section: 'Bus collision details',
    label: 'Was there visible bus damage at the scene?',
    path: 'bus_damage',
  },
  {
    id: 'bus_damage_confirmed',
    section: 'Bus collision details',
    label: 'Was the damage confirmed after inspection?',
    path: 'bus_damage_confirmed',
  },

  {
    id: 'runaway_vehicle',
    section: 'Bus runaway & evacuation',
    label: 'Did this event involve a runaway bus?',
    path: 'runaway_vehicle',
  },
  {
    id: 'operator_in_vehicle_runaway',
    section: 'Bus runaway & evacuation',
    label: 'Was the operator in the vehicle when the bus ran away?',
    path: 'operator_in_vehicle_runaway',
  },
  {
    id: 'parking_brake_engaged',
    section: 'Bus runaway & evacuation',
    label: 'Was the parking brake engaged?',
    path: 'parking_brake_engaged',
  },
  {
    id: 'evacuation_life_safety',
    section: 'Bus runaway & evacuation',
    label: 'Did this event involve an evacuation for life safety reasons?',
    path: 'evacuation_life_safety',
  },

  {
    id: 'train_number',
    section: 'Train vehicle details',
    label: 'LRV number',
    path: 'train_number',
  },
  {
    id: 'car_number',
    section: 'Train vehicle details',
    label: 'Car number involved in event',
    path: 'car_number',
  },
  {
    id: 'train_pullout_date',
    section: 'Train vehicle details',
    label: 'LRV pull-out date',
    path: 'train_pullout_date',
  },
  {
    id: 'train_pullout_time',
    section: 'Train vehicle details',
    label: 'LRV pull-out time',
    path: 'train_pullout_time',
  },
  {
    id: 'lrv_consist_count',
    section: 'Train vehicle details',
    label: 'How many LRVs in consist?',
    path: 'lrv_consist_count',
  },
  {
    id: 'lrv_consist_1',
    section: 'Train vehicle details',
    label: 'Consist 1',
    path: 'lrv_consist_1',
  },
  {
    id: 'lrv_consist_2',
    section: 'Train vehicle details',
    label: 'Consist 2',
    path: 'lrv_consist_2',
  },
  {
    id: 'lrv_consist_3',
    section: 'Train vehicle details',
    label: 'Consist 3',
    path: 'lrv_consist_3',
  },
  {
    id: 'lrv_consist_4',
    section: 'Train vehicle details',
    label: 'Consist 4',
    path: 'lrv_consist_4',
  },
  {
    id: 'lrv_fleet_type',
    section: 'Train vehicle details',
    label: 'LRV fleet type',
    path: 'lrv_fleet_type',
  },

  {
    id: 'location_category',
    section: 'Train location',
    label: 'Location category',
    path: 'location_category',
  },
  {
    id: 'station_applicable',
    section: 'Train location',
    label: 'Station (if applicable)',
    path: 'station_applicable',
  },
  {
    id: 'grade_crossing_applicable',
    section: 'Train location',
    label: 'Grade crossing (if applicable)',
    path: 'grade_crossing_applicable',
  },
  {
    id: 'tunnel_location',
    section: 'Train location',
    label: 'Tunnel location',
    path: 'tunnel_location',
  },

  {
    id: 'train_status_before',
    section: 'Train status & line',
    label: 'Train status before event',
    path: 'train_status_before',
  },
  {
    id: 'train_status_after',
    section: 'Train status & line',
    label: 'Train status after event',
    path: 'train_status_after',
  },
  {
    id: 'rail_line',
    section: 'Train status & line',
    label: 'Rail line',
    path: 'rail_line',
  },
  {
    id: 'lrv_end_of_line',
    section: 'Train status & line',
    label: 'End of line destination',
    path: 'lrv_end_of_line',
  },

  {
    id: 'lrv_collision_type',
    section: 'Train collision details',
    label: 'Event type with',
    path: 'lrv_collision_type',
  },
  {
    id: 'train_action',
    section: 'Train collision details',
    label: 'Train action at time of event',
    path: 'train_action',
  },
  {
    id: 'lrv_point_of_impact',
    section: 'Train collision details',
    label: 'Point of impact',
    path: 'lrv_point_of_impact',
  },
  {
    id: 'train_speed',
    section: 'Train collision details',
    label: 'Train speed at time of event (mph)',
    path: 'train_speed',
  },
  {
    id: 'train_damage',
    section: 'Train collision details',
    label: 'Train damage?',
    path: 'train_damage',
  },
  {
    id: 'disabling_damage',
    section: 'Train collision details',
    label: 'Was there any disabling damage to the DART vehicle?',
    path: 'disabling_damage',
  },
  {
    id: 'collision_resulted_in_derailment',
    section: 'Train collision details',
    label: 'Did this event involve a collision that resulted in a derailment?',
    path: 'collision_resulted_in_derailment',
  },

  {
    id: 'runaway_train',
    section: 'Train runaway & evacuation',
    label: 'Did this event involve a runaway train?',
    path: 'runaway_train',
  },
  {
    id: 'operator_in_train_runaway',
    section: 'Train runaway & evacuation',
    label: 'Was the operator in the vehicle when the train ran away?',
    path: 'operator_in_train_runaway',
  },
  {
    id: 'lrv_evacuation',
    section: 'Train runaway & evacuation',
    label: 'Did this event involve an evacuation for life safety reasons?',
    path: 'lrv_evacuation',
  },

  {
    id: 'weather',
    section: 'Weather & road conditions',
    label: 'Weather',
    path: 'weather',
  },
  {
    id: 'lighting_conditions',
    section: 'Weather & road conditions',
    label: 'Lighting conditions',
    path: 'lighting_conditions',
  },
  {
    id: 'streetlights',
    section: 'Weather & road conditions',
    label: 'Streetlights (if applicable)',
    path: 'streetlights',
  },
  {
    id: 'road_conditions',
    section: 'Weather & road conditions',
    label: 'Road / track conditions',
    path: 'road_conditions',
  },
  {
    id: 'traffic_conditions',
    section: 'Weather & road conditions',
    label: 'Traffic conditions',
    path: 'traffic_conditions',
  },
  {
    id: 'traffic_controls',
    section: 'Weather & road conditions',
    label: 'Traffic controls',
    path: 'traffic_controls',
  },
  {
    id: 'roadway_configuration',
    section: 'Weather & road conditions',
    label: 'Roadway configuration',
    path: 'roadway_configuration',
  },

  {
    id: 'operator_injured',
    section: 'Employee Who Submitted The Report',
    label: 'Was the employee injured?',
    path: 'operator_injured',
  },
  {
    id: 'operator_injured_body_part',
    section: 'Employee Who Submitted The Report',
    label: 'Injured body part',
    path: 'operator_injured_body_part',
  },
  {
    id: 'operator_transported',
    section: 'Employee Who Submitted The Report',
    label: 'Was the employee transported to the hospital?',
    path: 'operator_transported',
  },
  {
    id: 'other_employees_injured_count',
    section: 'Employee Who Submitted The Report',
    label: 'Number of other employees injured (excluding the operator)',
    path: 'other_employees_injured_count',
  },

  {
    id: 'passengers_on_board',
    section: 'Passenger injury section',
    label: 'Number of passengers on board',
    path: 'passengers_on_board',
  },
  {
    id: 'passenger_fatalities',
    section: 'Passenger injury section',
    label: 'Number of passenger fatalities',
    path: 'passenger_fatalities',
  },
  {
    id: 'passengers_injured',
    section: 'Passenger injury section',
    label: 'Number of passengers injured',
    path: 'passengers_injured',
  },
  {
    id: 'passengers_fled',
    section: 'Passenger injury section',
    label: 'Number of passengers who fled the scene',
    path: 'passengers_fled',
  },
  {
    id: 'passenger_action',
    section: 'Passenger injury section',
    label: 'At the time of the event, the passenger was',
    path: 'passenger_action',
  },
  {
    id: 'which_door',
    section: 'Passenger injury section',
    label: 'Which door?',
    path: 'which_door',
  },
  {
    id: 'courtesy_cards',
    section: 'Passenger injury section',
    label: 'Number of courtesy cards obtained',
    path: 'courtesy_cards',
  },
  {
    id: 'passengers_transported',
    section: 'Passenger injury section',
    label: 'Number of passengers transported to hospital',
    path: 'passengers_transported',
  },

  {
    id: 'pedestrians_involved',
    section: 'Pedestrian injury section',
    label: 'Number of pedestrians involved',
    path: 'pedestrians_involved',
  },
  {
    id: 'pedestrian_fatalities',
    section: 'Pedestrian injury section',
    label: 'Number of pedestrian fatalities',
    path: 'pedestrian_fatalities',
  },
  {
    id: 'pedestrian_injuries',
    section: 'Pedestrian injury section',
    label: 'Number of pedestrian injuries',
    path: 'pedestrian_injuries',
  },
  {
    id: 'pedestrians_fled',
    section: 'Pedestrian injury section',
    label: 'Number of pedestrians who fled',
    path: 'pedestrians_fled',
  },
  {
    id: 'pedestrians_transported',
    section: 'Pedestrian injury section',
    label: 'Number of pedestrians transported to hospital',
    path: 'pedestrians_transported',
  },

  {
    id: 'other_vehicle_occupants',
    section: 'Other vehicle #2',
    label: 'Number of occupants',
    path: 'other_vehicle_occupants',
  },
  {
    id: 'other_vehicle_fatalities',
    section: 'Other vehicle #2',
    label: 'Fatalities in this vehicle',
    path: 'other_vehicle_fatalities',
  },
  {
    id: 'other_vehicle_injuries',
    section: 'Other vehicle #2',
    label: 'Injuries in this vehicle',
    path: 'other_vehicle_injuries',
  },
  {
    id: 'other_vehicle_fled',
    section: 'Other vehicle #2',
    label: 'Occupants who fled the scene',
    path: 'other_vehicle_fled',
  },
  {
    id: 'other_vehicle_transported',
    section: 'Other vehicle #2',
    label: 'Occupants transported to hospital',
    path: 'other_vehicle_transported',
  },
  {
    id: 'dart_dart_collision',
    section: 'Other vehicle #2',
    label: 'Was this a collision between DART vehicles?',
    path: 'dart_dart_collision',
  },
  {
    id: 'other_vehicle_type',
    section: 'Other vehicle #2',
    label: 'Vehicle type',
    path: 'other_vehicle_type',
  },
  {
    id: 'other_vehicle_action',
    section: 'Other vehicle #2',
    label: 'Vehicle action',
    path: 'other_vehicle_action',
  },
  {
    id: 'other_vehicle_point_of_impact',
    section: 'Other vehicle #2',
    label: 'Point of impact',
    path: 'other_vehicle_point_of_impact',
  },
  {
    id: 'other_vehicle_direction',
    section: 'Other vehicle #2',
    label: 'Direction relative to DART vehicle',
    path: 'other_vehicle_direction',
  },
  {
    id: 'other_vehicle_damage',
    section: 'Other vehicle #2',
    label: 'Was there damage to this vehicle?',
    path: 'other_vehicle_damage',
  },
  {
    id: 'other_vehicle_damage_area',
    section: 'Other vehicle #2',
    label: 'Damage area',
    path: 'other_vehicle_damage_area',
  },
  {
    id: 'other_vehicle_tow_away',
    section: 'Other vehicle #2',
    label: 'Tow away?',
    path: 'other_vehicle_tow_away',
  },
  {
    id: 'third_vehicle_involved',
    section: 'Other vehicle #3',
    label: 'Was there a third vehicle involved?',
    path: 'third_vehicle_involved',
  },
  {
    id: 'third_vehicle_collided',
    section: 'Other vehicle #3',
    label: 'Did the third vehicle collide with the DART vehicle?',
    path: 'third_vehicle_collided',
  },
  {
    id: 'third_vehicle_occupants',
    section: 'Other vehicle #3',
    label: 'Number of occupants',
    path: 'third_vehicle.occupants',
  },
  {
    id: 'third_vehicle_fatalities',
    section: 'Other vehicle #3',
    label: 'Fatalities in this vehicle',
    path: 'third_vehicle.fatalities',
  },
  {
    id: 'third_vehicle_injuries',
    section: 'Other vehicle #3',
    label: 'Injuries in this vehicle',
    path: 'third_vehicle.injuries',
  },
  {
    id: 'third_vehicle_fled',
    section: 'Other vehicle #3',
    label: 'Occupants who fled the scene',
    path: 'third_vehicle.fled',
  },
  {
    id: 'third_vehicle_transported',
    section: 'Other vehicle #3',
    label: 'Occupants transported to hospital',
    path: 'third_vehicle.transported',
  },
  {
    id: 'third_vehicle_dart_collision',
    section: 'Other vehicle #3',
    label: 'Was this a collision between DART vehicles?',
    path: 'third_vehicle.dart_collision',
  },
  {
    id: 'third_vehicle_type',
    section: 'Other vehicle #3',
    label: 'Vehicle type',
    path: 'third_vehicle.type',
  },
  {
    id: 'third_vehicle_action',
    section: 'Other vehicle #3',
    label: 'Vehicle action',
    path: 'third_vehicle.action',
  },
  {
    id: 'third_vehicle_point_of_impact',
    section: 'Other vehicle #3',
    label: 'Point of impact',
    path: 'third_vehicle.point_of_impact',
  },
  {
    id: 'third_vehicle_direction',
    section: 'Other vehicle #3',
    label: 'Direction relative to DART vehicle',
    path: 'third_vehicle.direction',
  },
  {
    id: 'third_vehicle_damage',
    section: 'Other vehicle #3',
    label: 'Was there damage to this vehicle?',
    path: 'third_vehicle.damage',
  },
  {
    id: 'third_vehicle_damage_area',
    section: 'Other vehicle #3',
    label: 'Damage area',
    path: 'third_vehicle.damage_area',
  },
  {
    id: 'third_vehicle_tow_away',
    section: 'Other vehicle #3',
    label: 'Tow away?',
    path: 'third_vehicle.tow_away',
  },

  {
    id: 'police_at_scene',
    section: 'Police section',
    label: 'Were police at the scene?',
    path: 'police_at_scene',
  },
  {
    id: 'police_type',
    section: 'Police section',
    label: 'If yes, whose police were they?',
    path: 'police_type',
  },
  {
    id: 'dart_supervisor_investigating',
    section: 'Police section',
    label: 'Was a DART supervisor investigating?',
    path: 'dart_supervisor_investigating',
  },
];

function formatOperatorStatus(status?: WorkflowSectionStatus) {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'submitted':
      return 'Submitted';
    case 'resubmitted':
      return 'Resubmitted';
    case 'returned':
      return 'Returned for correction';
    case 'in-progress':
      return 'In progress';
    case 'pending':
      return 'Pending';
    case 'not-required':
      return 'Not required';
    default:
      return 'Not started';
  }
}

function getStatusTone(status?: WorkflowSectionStatus) {
  switch (status) {
    case 'accepted':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'submitted':
    case 'resubmitted':
      return 'border-[#0078AE]/30 bg-[#0078AE]/10 text-[#00205B]';
    case 'returned':
      return 'border-amber-200 bg-amber-50 text-amber-900';
    case 'in-progress':
      return 'border-[#0078AE]/20 bg-slate-50 text-slate-700';
    case 'pending':
      return 'border-slate-200 bg-slate-100 text-slate-700';
    case 'not-required':
      return 'border-slate-200 bg-slate-100 text-slate-600';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function getValueByPath(data: AccidentReportData, path: string) {
  const segments = path.split('.');
  let current: unknown = data;

  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function formatDisplayValue(value: unknown): string {
  if (value === undefined || value === null) {
    return 'Not provided';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : 'Not provided';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'Not provided';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'Not provided';
    }

    if (value.every((item) => item instanceof File)) {
      return (value as File[]).map((file) => file.name).join(', ');
    }

    if (value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
      return value.map((item) => String(item)).join(', ');
    }

    return JSON.stringify(value, null, 2);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function buildPedestrianGroupEntries(data: AccidentReportData): OperatorFieldEntry[] {
  const groups = Array.isArray(data.pedestrian_groups) ? data.pedestrian_groups : [];

  return groups.flatMap((group: PedestrianRecord, index) => {
    const groupLabel = `Pedestrian ${index + 1}`;
    return [
      {
        id: `pedestrian_group_${index}_type`,
        section: 'Pedestrian injury section',
        label: `${groupLabel} - Pedestrian type`,
        value: formatDisplayValue(group.pedestrian_type),
      },
      {
        id: `pedestrian_group_${index}_action`,
        section: 'Pedestrian injury section',
        label: `${groupLabel} - Pedestrian action`,
        value: formatDisplayValue(group.pedestrian_action),
      },
      {
        id: `pedestrian_group_${index}_fled`,
        section: 'Pedestrian injury section',
        label: `${groupLabel} - Did this pedestrian flee the scene?`,
        value: formatDisplayValue(group.fled),
      },
    ];
  });
}

// The transcript above holds every possible operator field (bus AND rail). We only
// surface the sections that match the case's vehicle mode, so a rail case never shows
// bus-stop questions or bus vehicle details, and a bus case never shows train sections.
const BUS_ONLY_SECTIONS = new Set<string>([
  'Vehicle details',
  'Bus status & route',
  'Bus collision details',
  'Bus runaway & evacuation',
]);
const RAIL_ONLY_SECTIONS = new Set<string>([
  'Train vehicle details',
  'Train location',
  'Train status & line',
  'Train collision details',
  'Train runaway & evacuation',
]);
// Bus-specific fields that live inside an otherwise shared section (Location).
const BUS_ONLY_FIELD_IDS = new Set<string>(['event_at_bus_stop', 'bus_stop_name']);

const OPERATOR_SECTION_TITLES: Record<string, string> = {
  'Vehicle details': 'The Vehicle',
  'Train vehicle details': 'The Vehicle',
  'Bus status & route': 'The Vehicle',
  'Train status & line': 'The Vehicle',
  Location: 'Where It Happened',
  'Train location': 'Where It Happened',
  'Bus collision details': 'What Happened',
  'Bus runaway & evacuation': 'What Happened',
  'Train collision details': 'What Happened',
  'Train runaway & evacuation': 'What Happened',
  'Weather & road conditions': 'Weather And Conditions',
  'Near Miss Details': 'Near Miss Details',
};

function getOperatorSectionTitle(section: string) {
  return OPERATOR_SECTION_TITLES[section] || section;
}

function isRailMode(mode?: string): boolean {
  return mode === 'Light Rail Vehicle' || mode === 'Streetcar' || mode === 'Hi-Rail';
}

function fieldMatchesMode(definition: TranscriptFieldDefinition, rail: boolean): boolean {
  if (rail) {
    return !BUS_ONLY_SECTIONS.has(definition.section) && !BUS_ONLY_FIELD_IDS.has(definition.id);
  }
  return !RAIL_ONLY_SECTIONS.has(definition.section);
}

function buildNearMissEntries(data: AccidentReportData): OperatorFieldEntry[] {
  if (data.event_type !== 'Near Miss') return [];
  const fields: Array<[string, string, unknown]> = [
    ['near_miss_description', 'Description of Near Miss', data.near_miss_description],
    ['incident_date', 'Incident date', data.incident_date],
    ['incident_time', 'Incident time', data.incident_time],
    ['near_miss_street_on', 'Street On', data.near_miss_street_on],
    ['near_miss_cross_street', 'Cross Street', data.near_miss_cross_street],
    ['near_miss_city', 'City', data.near_miss_city],
    ['near_miss_zip', 'ZIP Code', data.near_miss_zip],
    ['near_miss_location_category', 'Location Category', data.near_miss_location_category],
    ['near_miss_reason', 'Reason for reporting', data.near_miss_reason],
    ['near_miss_employee_involved', 'Employee involved', data.near_miss_employee_involved],
    ['near_miss_category', 'Near Miss category', data.near_miss_category],
    ['near_miss_vehicle_number', 'Vehicle number', data.near_miss_vehicle_number],
    ['near_miss_fleet_type', 'Fleet type', data.near_miss_fleet_type],
    ['near_miss_speed', 'DART vehicle speed', data.near_miss_speed],
    ['near_miss_revenue_service', 'DART vehicle in revenue service', data.near_miss_revenue_service],
    ['near_miss_route', 'Route', data.near_miss_route],
    ['near_miss_run', 'Trip ID', data.near_miss_run],
    ['near_miss_block', 'Block', data.near_miss_block],
    ['near_miss_rail_line', 'Rail line', data.near_miss_rail_line],
    ['near_miss_weather', 'Weather', data.near_miss_weather],
    ['near_miss_road_conditions', 'Road / track conditions', data.near_miss_road_conditions],
    ['near_miss_lighting_conditions', 'Lighting conditions', data.near_miss_lighting_conditions],
    ['near_miss_traffic_conditions', 'Traffic conditions', data.near_miss_traffic_conditions],
    ['near_miss_traffic_controls', 'Traffic controls', data.near_miss_traffic_controls],
    ['near_miss_roadway_configuration', 'Roadway configuration', data.near_miss_roadway_configuration],
  ];
  return fields.map(([id, label, value]) => ({ id, section: 'Near Miss Details', label, value: formatDisplayValue(value) }));
}

function buildOperatorFieldEntries(data: AccidentReportData): OperatorFieldEntry[] {
  const rail = isRailMode(data.mode);
  const fixedEntries = OPERATOR_TRANSCRIPT_FIELDS
    .filter((definition) => fieldMatchesMode(definition, rail))
    .map((definition) => ({
      id: definition.id,
      section: getOperatorSectionTitle(definition.section),
      label: definition.label,
      value: formatDisplayValue(
        definition.getValue
          ? definition.getValue(data)
          : definition.path
          ? getValueByPath(data, definition.path)
          : undefined,
      ),
    }));

  return [...fixedEntries, ...buildNearMissEntries(data), ...buildPedestrianGroupEntries(data)];
}

function buildReportSections(entries: OperatorFieldEntry[], attachments: ReportAttachment[]): ReportSectionCard[] {
  const groupedSections = entries.reduce<ReportSectionCard[]>((sections, entry) => {
    const existingSection = sections.find((section) => section.title === entry.section);
    if (existingSection) {
      existingSection.entries = [...(existingSection.entries || []), entry];
      return sections;
    }

    return [
      ...sections,
      {
        id: entry.section.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: entry.section,
        entries: [entry],
      },
    ];
  }, []);

  return [
    ...groupedSections,
    {
      id: 'attachments',
      title: 'Attachments',
      attachments,
    },
  ];
}

function formatFileSize(size?: number) {
  if (size === undefined || size < 0 || !Number.isFinite(size)) {
    return undefined;
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function normalizeAttachments(raw: unknown): ReportAttachment[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item, index) => {
    if (item instanceof File) {
      return [{
        id: `attachment_${index}`,
        name: item.name,
        sizeLabel: formatFileSize(item.size),
        file: item,
      }];
    }

    if (typeof item === 'string') {
      const name = item.trim();
      return name ? [{ id: `attachment_${index}`, name }] : [];
    }

    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const name = typeof record.name === 'string' ? record.name.trim() : '';
      if (!name) {
        return [];
      }

      const size = typeof record.size === 'number' ? record.size : undefined;
      return [{
        id: `attachment_${index}`,
        name,
        sizeLabel: formatFileSize(size),
      }];
    }

    return [];
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPrintableReportHtml(entries: OperatorFieldEntry[], attachmentNames: string[]) {
  const entryRows = entries
    .map((entry) => `<tr><td>${escapeHtml(entry.section)}</td><td>${escapeHtml(entry.label)}</td><td>${escapeHtml(entry.value).replace(/\n/g, '<br />')}</td></tr>`)
    .join('');

  const attachmentRow = `<tr><td>Attachments</td><td>Files included with this report</td><td>${escapeHtml(attachmentNames.length > 0 ? attachmentNames.join(', ') : 'None')}</td></tr>`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Operator Report</title>
    <style>
      body { font-family: 'Poppins', Arial, sans-serif; color: #0f172a; margin: 24px; }
      h1 { margin: 0 0 8px; font-size: 22px; }
      .meta { margin-bottom: 18px; color: #334155; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #cbd5e1; text-align: left; vertical-align: top; padding: 8px 10px; font-size: 13px; }
      th { background: #e2e8f0; font-weight: 700; }
      td:nth-child(1) { width: 22%; background: #f8fafc; font-weight: 600; }
      td:nth-child(2) { width: 34%; background: #f8fafc; font-weight: 600; }
      @media print {
        body { margin: 12mm; }
      }
    </style>
  </head>
  <body>
    <h1>Operator report</h1>
    <table>
      <thead>
        <tr>
          <th>Section</th>
          <th>Question shown on operator form</th>
          <th>Answer provided</th>
        </tr>
      </thead>
      <tbody>${entryRows}${attachmentRow}</tbody>
    </table>
  </body>
</html>`;
}

// The operator wizard is 4 steps. The transcript groups above are the finer-grained
// sub-sections the operator saw inside each step — we roll them back up so reviewers
// see the report through the same mental model the operator filled it in.
type OperatorStepNumber = 1 | 2 | 3 | 4;

const OPERATOR_STEP_META: Record<OperatorStepNumber, { title: string; description: string }> = {
  1: { title: 'Incident basics', description: 'Schedule, event type, and vehicle mode.' },
  2: { title: 'Incident details', description: 'Vehicle details, location, collision, and conditions.' },
  3: { title: 'People & impact', description: 'Injuries, passengers, pedestrians, other vehicles, police.' },
  4: { title: 'Attachments', description: 'Files the operator uploaded with this submission.' },
};

const SUB_SECTION_TO_STEP: Record<string, OperatorStepNumber> = {
  'Incident Basics': 1,
  'Event description & timing': 1,
  'Vehicle details': 2,
  Location: 2,
  'Bus status & route': 2,
  'Bus collision details': 2,
  'Bus runaway & evacuation': 2,
  'Train vehicle details': 2,
  'Train location': 2,
  'Train status & line': 2,
  'Train collision details': 2,
  'Train runaway & evacuation': 2,
  'Weather & road conditions': 2,
  'The Vehicle': 2,
  'What Happened': 2,
  'Where It Happened': 2,
  'Weather And Conditions': 2,
  'Employee Who Submitted The Report': 3,
  'Passenger injury section': 3,
  'Pedestrian injury section': 3,
  'Other vehicle #2': 3,
  'Other vehicle #3': 3,
  'Police section': 3,
  Attachments: 4,
};

interface OperatorStepGroup {
  step: OperatorStepNumber;
  title: string;
  description: string;
  subSections: ReportSectionCard[];
  answerCount: number;
}

function buildStepGroups(reportSections: ReportSectionCard[]): OperatorStepGroup[] {
  return ([1, 2, 3, 4] as OperatorStepNumber[]).map((step) => {
    const subSections = reportSections.filter((s) => SUB_SECTION_TO_STEP[s.title] === step);
    const answerCount = subSections.reduce(
      (sum, s) => sum + (s.entries?.length ?? 0) + (s.attachments?.length ?? 0),
      0,
    );
    return {
      step,
      title: OPERATOR_STEP_META[step].title,
      description: OPERATOR_STEP_META[step].description,
      subSections,
      answerCount,
    };
  });
}

export function OperatorReferenceRail({ data, operatorStatus, className = '', showHeader = true }: Props) {
  const operatorFieldEntries = useMemo(() => buildOperatorFieldEntries(data), [data]);
  const reportAttachments = useMemo(() => normalizeAttachments(data.attachments), [data.attachments]);
  const reportSections = useMemo(() => buildReportSections(operatorFieldEntries, reportAttachments), [operatorFieldEntries, reportAttachments]);
  const stepGroups = useMemo(() => buildStepGroups(reportSections), [reportSections]);
  const operatorStatusText = formatOperatorStatus(operatorStatus);
  const statusTone = getStatusTone(operatorStatus);
  const [activeStep, setActiveStep] = useState<OperatorStepNumber>(1);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const activeIndex = stepGroups.findIndex((g) => g.step === activeStep);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeGroup = stepGroups[safeIndex];
  const canGoBack = safeIndex > 0;
  const canGoForward = safeIndex < stepGroups.length - 1;

  const goToStepAtIndex = (nextIndex: number) => {
    const bounded = Math.min(Math.max(nextIndex, 0), stepGroups.length - 1);
    if (bounded === safeIndex) {
      return;
    }
    setSlideDirection(bounded > safeIndex ? 1 : -1);
    setActiveStep(stepGroups[bounded].step);
  };

  const goToPreviousStep = () => goToStepAtIndex(safeIndex - 1);
  const goToNextStep = () => goToStepAtIndex(safeIndex + 1);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const distance = info.offset.x;
    const velocity = info.velocity.x;
    if ((distance < -70 || velocity < -450) && canGoForward) {
      goToNextStep();
      return;
    }
    if ((distance > 70 || velocity > 450) && canGoBack) {
      goToPreviousStep();
    }
  };

  const handlePrintOrSavePdf = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(
      buildPrintableReportHtml(
        operatorFieldEntries,
        reportAttachments.map((attachment) => attachment.name),
      ),
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 150);
  };

  const handleDownloadAttachment = (attachment: ReportAttachment) => {
    if (!attachment.file) {
      return;
    }

    const objectUrl = URL.createObjectURL(attachment.file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = attachment.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <aside className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {showHeader && (
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Operator report</p>
              <h3 className="mt-1 text-base font-semibold text-[#00205B] font-['Poppins']">What the operator submitted</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0078AE]" />
              Read-only
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-5 font-['Poppins']">
            Every operator question is listed below with the saved answer so you can review the report exactly as submitted.
          </p>
          <button
            type="button"
            onClick={handlePrintOrSavePdf}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
          >
            <Printer className="h-3.5 w-3.5" />
            Print or save as PDF
          </button>
        </div>
      )}

      <div className={`space-y-4 px-5 ${showHeader ? 'py-4' : 'py-5'}`}>
        <div className={`rounded-lg border p-3 ${statusTone}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Operator section status</p>
          <p className="mt-1 text-sm font-semibold text-current font-['Poppins']">{operatorStatusText}</p>
        </div>

        {!showHeader && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm text-slate-700 leading-6 font-['Poppins']">
              Every operator question and answer is listed below. You can review details, but you cannot edit them.
            </p>
            <button
              type="button"
              onClick={handlePrintOrSavePdf}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
            >
              <Printer className="h-3.5 w-3.5" />
              Print or save as PDF
            </button>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">
                Step {activeGroup.step} of {stepGroups.length}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[#00205B] font-['Poppins']">
                {activeGroup.title}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={!canGoBack}
                aria-label="Previous step"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                disabled={!canGoForward}
                aria-label="Next step"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden">
            <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
              <motion.div
                key={activeGroup.step}
                custom={slideDirection}
                initial={{ opacity: 0, x: slideDirection > 0 ? 32 : -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection > 0 ? -32 : 32 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragEnd={handleDragEnd}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4 sm:py-4"
              >
                <div className="border-b border-slate-200 pb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">
                    Step {activeGroup.step}
                  </p>
                  <h4 className="mt-0.5 text-base font-semibold text-[#00205B] font-['Poppins']">
                    {activeGroup.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 font-['Poppins']">
                    {activeGroup.description}
                  </p>
                </div>

                <div className="mt-3 max-h-[440px] space-y-4 overflow-y-auto pr-1">
                  {activeGroup.subSections.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500 font-['Poppins']">
                      Nothing was recorded in this step.
                    </p>
                  ) : (
                    activeGroup.subSections.map((subSection) => {
                      const isAttachmentSlot = subSection.attachments !== undefined;
                      const entries = subSection.entries || [];
                      const count = isAttachmentSlot ? reportAttachments.length : entries.length;
                      return (
                        <div key={subSection.id}>
                          {!isAttachmentSlot && (
                            <div className="mb-2 flex items-baseline justify-between gap-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">
                                {subSection.title}
                              </p>
                              <p className="text-[10px] font-medium text-slate-500 font-['Poppins']">
                                {count} {count === 1 ? 'answer' : 'answers'}
                              </p>
                            </div>
                          )}

                          {isAttachmentSlot ? (
                            <div className="space-y-2">
                              {reportAttachments.length > 0 ? (
                                reportAttachments.map((attachment) => (
                                  <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-slate-900 font-['Poppins']">{attachment.name}</p>
                                      {attachment.sizeLabel && (
                                        <p className="text-xs text-slate-500 font-['Poppins']">{attachment.sizeLabel}</p>
                                      )}
                                    </div>
                                    {attachment.file && (
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadAttachment(attachment)}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                      </button>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500 font-['Poppins']">
                                  No attachments were submitted by the operator.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {entries.map((entry) => {
                                if (entry.id === 'impact_markers' && Array.isArray(data.impact_markers) && data.impact_markers.length > 0) {
                                  return (
                                    <div key={entry.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                                      <p className="text-xs font-semibold text-slate-700 font-['Poppins']">{entry.label}</p>
                                      <div className="mt-2">
                                        <VehicleImpactDiagram
                                          variant={getImpactVariant(data.mode)}
                                          markers={data.impact_markers}
                                          onChange={() => {}}
                                          readOnly
                                          title=""
                                        />
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={entry.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                                    <p className="text-xs font-semibold text-slate-700 font-['Poppins']">{entry.label}</p>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-900 font-['Poppins']">{entry.value}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {stepGroups.map((group, index) => (
              <button
                key={group.step}
                type="button"
                onClick={() => goToStepAtIndex(index)}
                aria-label={`Go to Step ${group.step}: ${group.title}`}
                className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#FFCD00] ${
                  index === safeIndex ? 'w-8 bg-[#00205B]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}