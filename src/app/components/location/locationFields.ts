import type { AccidentReportData } from '../../types/accident-report';

type KeysOfType<T> = {
  [K in keyof AccidentReportData]-?: NonNullable<AccidentReportData[K]> extends T ? K : never;
}[keyof AccidentReportData];

export type StringField = KeysOfType<string>;
export type NumberField = KeysOfType<number>;
export type AddressRole = 'street' | 'cross' | 'city' | 'zip';

/** Which report fields a location block reads and writes. */
export interface LocationFieldConfig {
  street: StringField;
  cross?: StringField;
  city?: StringField;
  zip?: StringField;
  lat: 'location_lat' | 'supervisor_location_lat';
  lng: 'location_lng' | 'supervisor_location_lng';
  autofilled: 'location_autofilled_fields' | 'supervisor_location_autofilled_fields';
  /** Legacy fields that also receive the street value (and are read as a fallback). */
  mirrorStreet?: StringField[];
  /** Single "Event location" input: the pin writes the full one-line address into `street`. */
  streetAsFullAddress?: boolean;
}

const OPERATOR_COORDS = {
  lat: 'location_lat',
  lng: 'location_lng',
  autofilled: 'location_autofilled_fields',
} as const;

export const OPERATOR_LOCATION: LocationFieldConfig = {
  street: 'street_on', cross: 'cross_street', city: 'city', zip: 'zip', ...OPERATOR_COORDS,
};

/** Rail sections that historically stored the street in `address_of_event`. */
export const OPERATOR_RAIL_LOCATION: LocationFieldConfig = { ...OPERATOR_LOCATION, mirrorStreet: ['address_of_event'] };

export const OPERATOR_FIRE_LOCATION: LocationFieldConfig = { ...OPERATOR_LOCATION, mirrorStreet: ['fire_address'] };

/** Near miss keeps its own address fields; the pin is still the report's event location. */
export const NEAR_MISS_LOCATION: LocationFieldConfig = {
  street: 'near_miss_street_on', cross: 'near_miss_cross_street', city: 'near_miss_city', zip: 'near_miss_zip', ...OPERATOR_COORDS,
};

export const SUPERVISOR_LOCATION: LocationFieldConfig = {
  street: 'supervisor_street_on',
  cross: 'supervisor_cross_street',
  city: 'supervisor_city',
  zip: 'supervisor_zip',
  lat: 'supervisor_location_lat',
  lng: 'supervisor_location_lng',
  autofilled: 'supervisor_location_autofilled_fields',
};

/** Field Supervisor, rail modes: one optional "Address of event" field. */
export const SUPERVISOR_RAIL_LOCATION: LocationFieldConfig = {
  street: 'supervisor_address_of_event',
  lat: 'supervisor_location_lat',
  lng: 'supervisor_location_lng',
  autofilled: 'supervisor_location_autofilled_fields',
  streetAsFullAddress: true,
};

/** Leader intake for NRV: one free-text "Event location" field. */
export const INTAKE_NRV_LOCATION: LocationFieldConfig = { street: 'street_on', ...OPERATOR_COORDS, streetAsFullAddress: true };

/** Leader intake for LRV: one free-text "Event location" field. */
export const INTAKE_LRV_LOCATION: LocationFieldConfig = { street: 'address_of_event', ...OPERATOR_COORDS, streetAsFullAddress: true };

export function roleKey(config: LocationFieldConfig, role: AddressRole): StringField | undefined {
  return role === 'street' ? config.street : config[role];
}

export function readRole(data: AccidentReportData, config: LocationFieldConfig, role: AddressRole): string {
  const key = roleKey(config, role);
  if (!key) return '';
  const value = data[key] as string | undefined;
  if (value || role !== 'street') return value ?? '';
  for (const mirror of config.mirrorStreet ?? []) {
    const fallback = data[mirror] as string | undefined;
    if (fallback) return fallback;
  }
  return '';
}

/** Patch that writes a value into a role's field (and street mirrors). */
export function writeRole(config: LocationFieldConfig, role: AddressRole, value: string): Partial<AccidentReportData> {
  const key = roleKey(config, role);
  if (!key) return {};
  const patch: Record<string, unknown> = { [key]: value };
  if (role === 'street') for (const mirror of config.mirrorStreet ?? []) patch[mirror] = value;
  return patch as Partial<AccidentReportData>;
}

export function readPin(data: AccidentReportData, config: LocationFieldConfig) {
  const lat = data[config.lat];
  const lng = data[config.lng];
  return lat != null && lng != null ? { lat, lng } : null;
}

export function readAutofilled(data: AccidentReportData, config: LocationFieldConfig): AddressRole[] {
  return data[config.autofilled] ?? [];
}

/** "Street & Cross" label for the operator's event location, for map previews. */
export function eventLocationLabel(data: AccidentReportData): string | undefined {
  const config = data.event_type === 'Near Miss' ? NEAR_MISS_LOCATION : { ...OPERATOR_LOCATION, mirrorStreet: ['address_of_event', 'fire_address'] as StringField[] };
  return [readRole(data, config, 'street'), readRole(data, config, 'cross')].filter(Boolean).join(' & ') || undefined;
}

/** "Street & Cross" label for the Field Supervisor's location, for map previews. */
export function supervisorLocationLabel(data: AccidentReportData): string | undefined {
  return [data.supervisor_street_on, data.supervisor_cross_street].filter(Boolean).join(' & ') || data.supervisor_address_of_event || undefined;
}
