import { type ReactNode } from 'react';
import { CustomSelect } from '../../CustomSelect';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  mode?: string;
  /** Render just the fields grid (no card chrome/header) for embedding in another section. */
  bare?: boolean;
  required?: boolean;
  showErrors?: boolean;
}

const toOptions = (values: string[]) => [...values]
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map(v => ({ value: v, label: v }));

const WEATHER = toOptions(['Clear', 'Sunny', 'Cloudy', 'Foggy/Misting', 'Raining', 'Snowing/Sleeting']);
const ROAD = toOptions(['Debris', 'Defective Road/Track', 'Dry', 'Ice', 'Muddy', 'Repairing Road/Construction', 'Slushy', 'Snow', 'Wet/Flood Area']);
const LIGHTING = toOptions(['Dawn/Dusk', 'Daylight', 'Dark']);
const STREETLIGHTS = toOptions(['Streetlights On', 'No Streetlights', 'Streetlights Off', 'Defective Street Lights']);
const TRAFFIC_COND = toOptions(['Heavy', 'Medium', 'Light']);

const BUS_TRAFFIC_CONTROLS = toOptions([
  'Flashing Arrows', 'N/A', 'Officer/School Crossing Guard', 'Red Flashing Lights',
  'Signal', 'Stop Sign', 'Traffic Light', 'Turn Restricted', 'Yellow Flashing Lights', 'Yield Sign',
]);

const LRV_TRAFFIC_CONTROLS = toOptions([
  'ABS', 'ATP', 'Green Band', 'Line of Sight', 'N/A', 'None', 'Red Flashing Lights',
  'Signal', 'Stop Sign', 'Traffic Light', 'TSS', 'Yellow Flashing Lights',
]);

const BUS_ROADWAY = toOptions([
  'Bridge', 'Bus Track', 'Four Lane Road', 'Fuel Bay',
  'Highway/Expressways/Freeways/Toll Road', 'Intersection', 'One-way Street',
  'Overpass', 'Parking Lot', 'Rail Road Crossing – Grade Crossing', 'Ramp',
  'Roundabout', 'Service Road', 'Transit Parking Lot', 'Tunnel', 'Two Lane Road',
  'Underpass', 'Wash Bay/Car wash',
]);

const LRV_ROADWAY = toOptions([
  'Bridge', 'Rail Road Crossing – Grade Crossing', 'Right Of Way Track',
  'Train Yard', 'Tunnel', 'Wash Bay/Car wash',
]);

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">{label}{required && <span className="dart-req ml-1">*</span>}</label>
      <div className={error ? 'dart-field-error' : ''}>{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p>}
    </div>
  );
}

export function WeatherSection({ data, onUpdate, mode, bare = false, required = false, showErrors = false }: Props) {
  const isLRV = mode === 'Light Rail Vehicle' || mode === 'Streetcar' || mode === 'Hi-Rail';
  const trafficControls = isLRV ? LRV_TRAFFIC_CONTROLS : BUS_TRAFFIC_CONTROLS;
  const roadwayConfig = isLRV ? LRV_ROADWAY : BUS_ROADWAY;

  const isComplete = !!(data.weather && data.lighting_conditions && data.road_conditions);

  const fields = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-[36px]">
      <Field label="Weather" required={required} error={required && showErrors && !data.weather}>
        <CustomSelect value={data.weather || ''} onChange={v => onUpdate({ weather: v })} options={WEATHER} placeholder="Select" />
      </Field>
      <Field label="Lighting conditions" required={required} error={required && showErrors && !data.lighting_conditions}>
        <CustomSelect value={data.lighting_conditions || ''} onChange={v => onUpdate({ lighting_conditions: v })} options={LIGHTING} placeholder="Select" />
      </Field>
      <Field label="Streetlights (if applicable)">
        <CustomSelect value={data.streetlights || ''} onChange={v => onUpdate({ streetlights: v })} options={STREETLIGHTS} placeholder="Select" />
      </Field>
      <Field label="Road / track conditions" required={required} error={required && showErrors && !data.road_conditions}>
        <CustomSelect value={data.road_conditions || ''} onChange={v => onUpdate({ road_conditions: v })} options={ROAD} placeholder="Select" />
      </Field>
      <Field label="Traffic conditions" required={required} error={required && showErrors && !data.traffic_conditions}>
        <CustomSelect value={data.traffic_conditions || ''} onChange={v => onUpdate({ traffic_conditions: v })} options={TRAFFIC_COND} placeholder="Select" />
      </Field>
      <Field label="Traffic controls" required={required} error={required && showErrors && !data.traffic_controls}>
        <CustomSelect value={data.traffic_controls || ''} onChange={v => onUpdate({ traffic_controls: v })} options={trafficControls} placeholder="Select" />
      </Field>
      <Field label="Roadway configuration" required={required} error={required && showErrors && !data.roadway_configuration}>
        <CustomSelect value={data.roadway_configuration || ''} onChange={v => onUpdate({ roadway_configuration: v })} options={roadwayConfig} placeholder="Select" />
      </Field>
    </div>
  );

  if (bare) return fields;

  return (
    <div className="dart-card dart-card--surface">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isComplete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">Weather & road conditions</h3>
      </div>

      <div className="px-6 py-5">
        {fields}
      </div>
    </div>
  );
}