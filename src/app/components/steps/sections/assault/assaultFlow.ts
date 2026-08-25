/**
 * Assault (Verbal or Physical) — DART business rules as pure functions.
 *
 * Every show/hide and option-filtering rule from the assault spec lives here,
 * not in JSX. The AssaultSection component calls these and renders a field
 * only when the engine says it's visible — so the rules are unit-testable
 * without rendering anything.
 *
 * Naming: reuses existing AccidentReportData fields where they already exist
 * (operating_dart_vehicle, mode, street_on, city, zip, vehicle_number,
 * fleet_type, employee_pullout_date/time, weather, road_conditions,
 * lighting_conditions, streetlights, lrv_consist_*, car_number,
 * route_number, run_number). Assault-specific fields use an assault_* prefix.
 */

// ---------- Option lists (labels match the spec verbatim) ----------

export const ASSAULT_TYPES = [
  { value: 'Physical Assault', label: 'Physical Assault' },
  { value: 'Verbal Assault', label: 'Verbal Assault' },
] as const;

export const ASSAULT_INVOLVES = [
  { value: 'customer_assaulted_worker', label: 'Customer/Pedestrian/Motorist assaulted transit worker' },
  { value: 'worker_assaulted_worker', label: 'Transit worker assaulted transit worker' },
] as const;
export type AssaultInvolves = (typeof ASSAULT_INVOLVES)[number]['value'];

export const WHO_ASSAULTED = [
  { value: 'customer_on_board', label: 'Customer on board' },
  { value: 'customer_waiting', label: 'Customer waiting at bus stop / transit center / train station' },
  { value: 'motorist', label: 'Motorist (anyone in a vehicle)' },
  { value: 'pedestrian', label: 'Pedestrian (anyone outside DART vehicle)' },
] as const;
export type WhoAssaulted = (typeof WHO_ASSAULTED)[number]['value'];

export const ASSAULT_TRIGGERS = [
  'Fare Dispute', 'Emotionally Disturbed', 'Bypassed/Drop Off/Missed Stop/Missed Transit Vehicle',
  'Carriage/Large Object', 'Wheelchair Delayed', 'Communication Problem',
  'Road Rage with other Driver', 'Pedestrian', 'Late Transit Vehicle', 'Intoxicated', 'Lay Over',
  '3rd Party Dispute', 'Traffic', 'Disruptive/Loud Music/Cell phone', 'Drugs/Smoking',
  'Failure to follow DART Policy', 'White Line', 'Parking Dispute', 'Animal', 'Unprovoked',
] as const;
const NON_TRANSIT_VEHICLE_TRIGGERS = new Set([
  'Bypassed/Drop Off/Missed Stop/Missed Transit Vehicle', 'Carriage/Large Object', 'Wheelchair Delayed',
  'Late Transit Vehicle', 'Lay Over', 'Disruptive/Loud Music/Cell phone', 'White Line',
]);
const LEGACY_ASSAULT_TRIGGERS = new Set([
  'Bypassed/Drop off/Missed Stop/Missed Bus', 'Late Bus',
]);

export function getAssaultTriggerOptions(mode: string | undefined) {
  return ASSAULT_TRIGGERS.filter((trigger) => (
    (trigger !== 'White Line' || mode === 'Bus')
    && (trigger !== 'Parking Dispute' || mode === 'Non-Revenue Vehicle')
    && (!(mode === 'Non-Revenue Vehicle' || mode === 'Hi-Rail') || !NON_TRANSIT_VEHICLE_TRIGGERS.has(trigger))
  ));
}

export function isAssaultTriggerAllowed(trigger: string | undefined, mode: string | undefined) {
  return (
    !LEGACY_ASSAULT_TRIGGERS.has(trigger || '')
    && (trigger !== 'White Line' || mode === 'Bus')
    && (trigger !== 'Parking Dispute' || mode === 'Non-Revenue Vehicle')
    && (!(mode === 'Non-Revenue Vehicle' || mode === 'Hi-Rail') || !NON_TRANSIT_VEHICLE_TRIGGERS.has(trigger || ''))
  );
}

export const ASSAULT_METHODS = [
  'Punched', 'Kicked', 'Pushed', 'Struck by Hand', 'Struck by Object',
  'Struck by Liquid', 'Bite', 'Struck by bodily fluid',
] as const;

export const VEHICLE_STATUSES = [
  { value: 'In Service', label: 'In Service' },
  { value: 'Deadhead', label: 'Deadhead' },
  { value: 'Pull In', label: 'Pull In' },
  { value: 'Pull Out', label: 'Pull Out' },
  { value: 'Service Protection', label: 'Service Protection' },
  { value: 'In Yard', label: 'In Yard' },
  { value: 'Road Test/ Test Train', label: 'Road Test / Test Train' },
  { value: 'Tow', label: 'Tow' },
  { value: 'Special Events', label: 'Special Events' },
  { value: 'Not In Service', label: 'Not In Service' },
  { value: 'Bus Bridge', label: 'Bus Bridge', busOnly: true },
  { value: 'Shuttle', label: 'Shuttle' },
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]['value'];

/** Statuses that hide Route Number / Run Number / Line Description. */
const NON_REVENUE_STATUSES: VehicleStatus[] = [
  'Deadhead', 'Not In Service', 'In Yard', 'Road Test/ Test Train',
  'Tow', 'Special Events', 'Bus Bridge', 'Shuttle',
];

export const ASSAULT_LOCATIONS = [
  { value: 'in_transit_vehicle', label: 'In transit vehicle' },
  { value: 'transit_property_revenue', label: 'On transit property (revenue train station, bus stop)' },
  { value: 'transit_property_non_revenue', label: 'On transit property (non-revenue facility)' },
  { value: 'non_transit_property', label: 'Non-transit property' },
  { value: 'outside_around_transit_vehicle', label: 'Outside around the transit vehicle' },
] as const;

export const INJURED_BODY_PARTS = ['Head', 'Upper body', 'Lower body'] as const;

const VEHICLE2_TYPES_DART = [
  'Passenger Auto/St Wagon', 'Motorcycle/Moped', 'Passenger Truck/Van',
  'Non-Revenue Rail vehicle (Maintenance)', 'Hi-Rail – Maintenance vehicle mounted to rail',
  'Light rail vehicle', 'Streetcar', 'Bus',
  'Wrecker/Tow Truck/Electric Utility cart/Garbage Truck/Forklift',
] as const;
const VEHICLE2_TYPES_NON_DART = [
  'Passenger Auto/St Wagon', 'Motorcycle/Moped', 'Passenger Truck/Van',
  'Delivery Truck/Van', '18 Wheel Truck (Semi)', 'Fire Engine, Ambulance, Police car',
  'Tractor Trailer', 'Commercial Rail or Amtrak', 'School Bus/Charter/Tour Bus',
  'Taxi/Rideshare', 'Utility Trucks', 'Trolley',
  'Wrecker/Tow Truck/Electric Utility cart/Garbage Truck/Forklift',
] as const;

export const PERPETRATOR_AGES = [
  { value: 'child', label: 'Child (12 and under)' },
  { value: 'teen', label: 'Teen (13 to 18)' },
  { value: 'adult', label: 'Adult (19 to 60)' },
  { value: 'senior', label: 'Senior Citizen (61 and up)' },
] as const;
export const PERPETRATOR_GENDERS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
] as const;

/** "Bus Bridge" only appears when the mode is Bus. */
export function getVehicleStatusOptions(mode: string | undefined) {
  return VEHICLE_STATUSES.filter((s) => !('busOnly' in s && s.busOnly) || mode === 'Bus');
}

/** Other vehicle #2 type list depends on whether it was a DART vehicle. */
export function getVehicle2TypeOptions(isDartVehicle: boolean | undefined) {
  if (isDartVehicle === true) return VEHICLE2_TYPES_DART.map((v) => ({ value: v, label: v }));
  if (isDartVehicle === false) return VEHICLE2_TYPES_NON_DART.map((v) => ({ value: v, label: v }));
  return [];
}

// ---------- Repeating perpetrator groups ----------

export interface PerpetratorDetails {
  id: string;
  role?: 'Passenger' | 'Pedestrian';
  who_assaulted?: WhoAssaulted;
  assault_method?: string;
  age?: string;
  gender?: string;
  spat_on?: boolean;
  fled_scene?: boolean;
}

/** Resize a perpetrator list to `count`, keeping entered details and stamping ids on new rows. */
export function resizePerpetrators(list: PerpetratorDetails[], count: number): PerpetratorDetails[] {
  const next = list.slice(0, count);
  while (next.length < count) next.push({ id: `perp-${Date.now()}-${next.length}` });
  return next;
}

// ---------- Visibility engine ----------

export type AssaultFieldKey =
  | 'mode' | 'employee_pullout' | 'driver_window_assault' | 'operator_driving_area' | 'operator_driving_area_security'
  | 'vehicle_status_before' | 'vehicle_status_after' | 'vehicle_number' | 'fleet_type'
  | 'car_number' | 'lrv_consist' | 'route_number' | 'run_number' | 'line_description'
  | 'assault_type' | 'spat_on' | 'assault_method' | 'description_of_assault'
  | 'assault_involves' | 'who_assaulted' | 'assault_trigger' | 'assault_location'
  | 'transit_vehicle_on' | 'transit_vehicle_number' | 'transit_route_or_line'
  | 'onboard_perpetrators' | 'pedestrian_perpetrators' | 'vehicle2_section'
  | 'operator_injured' | 'injured_body_part' | 'transported_to_hospital'
  | 'notified_law_enforcement' | 'contacted_supervisor';

/** The answers that drive show/hide. Maps onto AccidentReportData. */
export interface AssaultAnswers {
  operating_dart_vehicle?: boolean;
  mode?: string;
  assault_type?: string;
  assault_involves?: string;
  who_assaulted?: string;
  vehicle_status_before?: string;
  assault_in_operator_driving_area?: boolean;
  assault_location?: string;
  transit_vehicle_on?: string;
  operator_injured?: boolean;
}

const ALWAYS_VISIBLE: AssaultFieldKey[] = [
  'assault_type', 'description_of_assault', 'assault_involves', 'assault_trigger',
  'assault_location', 'operator_injured', 'transported_to_hospital',
  'notified_law_enforcement', 'contacted_supervisor',
];

/** Fields that only exist when the employee was in possession of a DART vehicle. */
const POSSESSION_ONLY: AssaultFieldKey[] = [
  'mode', 'employee_pullout', 'driver_window_assault', 'operator_driving_area',
  'operator_driving_area_security',
  'vehicle_status_before', 'vehicle_status_after', 'vehicle_number', 'fleet_type',
  'car_number', 'lrv_consist', 'route_number', 'run_number',
  'line_description',
];

export function getVisibleAssaultFields(a: AssaultAnswers): Set<AssaultFieldKey> {
  const visible = new Set<AssaultFieldKey>(ALWAYS_VISIBLE);

  // Possession = Yes reveals vehicle-operation fields; No hides them all.
  if (a.operating_dart_vehicle === true) {
    POSSESSION_ONLY.forEach((f) => visible.add(f));

    // Mode rules (applied as removals — a mode can only hide, never re-show).
    if (a.mode === 'Bus') {
      (['car_number', 'lrv_consist', 'line_description'] as const).forEach((f) => visible.delete(f));
    }
    if (a.mode === 'Streetcar') {
      (['car_number', 'lrv_consist', 'route_number'] as const).forEach((f) => visible.delete(f));
      // Line Description auto-fills to 'Streetcar' — handled by the form component.
    }
    if (a.mode === 'Hi-Rail' || a.mode === 'Non-Revenue Vehicle') {
      (['vehicle_status_before', 'vehicle_status_after', 'car_number', 'lrv_consist',
        'route_number', 'run_number', 'line_description', 'operator_driving_area',
        'operator_driving_area_security'] as const)
        .forEach((f) => visible.delete(f));
    }

    if (a.assault_in_operator_driving_area !== true) visible.delete('operator_driving_area_security');

    // Vehicle-status rule: non-revenue statuses hide route/run/line.
    if (a.vehicle_status_before && NON_REVENUE_STATUSES.includes(a.vehicle_status_before as VehicleStatus)) {
      (['route_number', 'run_number', 'line_description'] as const).forEach((f) => visible.delete(f));
    }
  }

  // Assault type: physical reveals Spat On + Assault Method; verbal hides them.
  if (a.assault_type === 'Physical Assault') {
    visible.add('spat_on');
    visible.add('assault_method');
  }

  // "Who assaulted the employee" only applies customer/pedestrian/motorist → worker.
  // Worker-on-worker captures no perpetrator section at all (per spec).
  if (a.assault_involves === 'customer_assaulted_worker') {
    visible.add('who_assaulted');
    if (a.who_assaulted === 'customer_on_board') visible.add('onboard_perpetrators');
    if (a.who_assaulted === 'customer_waiting' || a.who_assaulted === 'pedestrian') visible.add('pedestrian_perpetrators');
    if (a.who_assaulted === 'motorist') visible.add('vehicle2_section');
  }

  // Not in possession, but assaulted while riding a transit vehicle.
  if (a.operating_dart_vehicle === false && a.assault_location === 'in_transit_vehicle') {
    visible.add('transit_vehicle_on');
    if (a.transit_vehicle_on === 'Bus' || a.transit_vehicle_on === 'Light Rail Vehicle' || a.transit_vehicle_on === 'Streetcar') {
      visible.add('transit_vehicle_number');
      visible.add('transit_route_or_line');
    }
    if (a.transit_vehicle_on === 'Hi-Rail' || a.transit_vehicle_on === 'Non-Revenue Vehicle') {
      visible.add('transit_vehicle_number');
    }
  }

  if (a.operator_injured === true) visible.add('injured_body_part');

  return visible;
}
