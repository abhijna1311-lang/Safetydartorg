import { type ReactNode } from 'react';
import { CustomSelect } from '../../CustomSelect';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  mode?: string;
}

const WEATHER = ['Clear', 'Sunny', 'Cloudy', 'Foggy/Misting', 'Raining', 'Snowing/Sleeting'].map(v => ({ value: v, label: v }));
const ROAD = ['Debris', 'Defective Road/Track', 'Dry', 'Ice', 'Muddy', 'Repairing Road/Construction', 'Slushy', 'Snow', 'Wet/Flood Area'].map(v => ({ value: v, label: v }));
const LIGHTING = ['Dawn/Dusk', 'Daylight', 'Dark'].map(v => ({ value: v, label: v }));
const STREETLIGHTS = ['Streetlights On', 'No Streetlights', 'Streetlights Off', 'Defective Street Lights'].map(v => ({ value: v, label: v }));
const TRAFFIC_COND = ['Heavy', 'Medium', 'Light'].map(v => ({ value: v, label: v }));

const BUS_TRAFFIC_CONTROLS = [
  'Flashing Arrows', 'Officer/School Crossing Guard', 'Red Flashing Lights',
  'Signal', 'Stop Sign', 'Traffic Light', 'Turn Restricted', 'Yellow Flashing Lights', 'Yield Sign',
].map(v => ({ value: v, label: v }));

const LRV_TRAFFIC_CONTROLS = [
  'ABS', 'ATP', 'Green Band', 'Line of Sight', 'None', 'Red Flashing Lights',
  'Signal', 'Stop Sign', 'Traffic Light', 'TSS', 'Yellow Flashing Lights',
].map(v => ({ value: v, label: v }));

const BUS_ROADWAY = [
  'Bridge', 'Bus Track', 'Four Lane Road', 'Fuel Bay',
  'Highway/Expressways/Freeways/Toll Road', 'Intersection', 'One-way Street',
  'Overpass', 'Parking Lot', 'Rail Road Crossing – Grade Crossing', 'Ramp',
  'Roundabout', 'Service Road', 'Transit Parking Lot', 'Tunnel', 'Two Lane Road',
  'Underpass', 'Wash Bay/Car wash',
].map(v => ({ value: v, label: v }));

const LRV_ROADWAY = [
  'Bridge', 'Rail Road Crossing – Grade Crossing', 'Right Of Way Track',
  'Train Yard', 'Tunnel', 'Wash Bay/Car wash',
].map(v => ({ value: v, label: v }));

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">{label}</label>
      {children}
    </div>
  );
}

export function WeatherSection({ data, onUpdate, mode }: Props) {
  const isLRV = mode === 'Light Rail Vehicle' || mode === 'Streetcar' || mode === 'Hi-Rail';
  const trafficControls = isLRV ? LRV_TRAFFIC_CONTROLS : BUS_TRAFFIC_CONTROLS;
  const roadwayConfig = isLRV ? LRV_ROADWAY : BUS_ROADWAY;

  const isComplete = !!(data.weather && data.lighting_conditions && data.road_conditions);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isComplete ? 'bg-[#007DBA]' : 'bg-slate-300'}`} />
        
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">Weather & road conditions</h3>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Weather">
            <CustomSelect value={data.weather || ''} onChange={v => onUpdate({ weather: v })} options={WEATHER} placeholder="Select" />
          </Field>
          <Field label="Lighting conditions">
            <CustomSelect value={data.lighting_conditions || ''} onChange={v => onUpdate({ lighting_conditions: v })} options={LIGHTING} placeholder="Select" />
          </Field>
          <Field label="Streetlights (if applicable)">
            <CustomSelect value={data.streetlights || ''} onChange={v => onUpdate({ streetlights: v })} options={STREETLIGHTS} placeholder="Select" />
          </Field>
          <Field label="Road / track conditions">
            <CustomSelect value={data.road_conditions || ''} onChange={v => onUpdate({ road_conditions: v })} options={ROAD} placeholder="Select" />
          </Field>
          <Field label="Traffic conditions">
            <CustomSelect value={data.traffic_conditions || ''} onChange={v => onUpdate({ traffic_conditions: v })} options={TRAFFIC_COND} placeholder="Select" />
          </Field>
          <Field label="Traffic controls">
            <CustomSelect value={data.traffic_controls || ''} onChange={v => onUpdate({ traffic_controls: v })} options={trafficControls} placeholder="Select" />
          </Field>
          <div className="col-span-2 md:col-span-3">
            <Field label="Roadway configuration">
              <CustomSelect value={data.roadway_configuration || ''} onChange={v => onUpdate({ roadway_configuration: v })} options={roadwayConfig} placeholder="Select" />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}