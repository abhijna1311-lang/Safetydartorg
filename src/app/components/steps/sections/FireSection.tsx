import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { ModeVehicleFields } from './ModeVehicleSection';
import { DART_STATION_OPTIONS } from './DerailmentSection';
import { WeatherSection } from './WeatherSection';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
  headerSection?: React.ReactNode;
}

const FIRE_TYPES = ['Fire', 'Smoke', 'Fire and Smoke'].map(value => ({ value, label: value }));
const FIRE_START_OPTIONS = ['Arson', 'Naturally', 'Unaware'].map(value => ({ value, label: value }));
const FIRE_SUPPRESSOR_OPTIONS = [
  'Operator', 'Other DART employee', 'Fire Department', 'Customer/Pedestrian',
  'Fire extinguisher itself', 'Fire suppressed by sprinkler system', 'Unknown',
].map(value => ({ value, label: value }));
const FIRE_RESPONSIBLE_OPTIONS = ['Pedestrian', 'Customer on Board', 'Unknown'].map(value => ({ value, label: value }));
const FIRE_LOCATIONS = [
  'In or on Transit Vehicle', 'Bus Stop/Train Station/Revenue Transit Center',
  'Right-of-Way: Outside vehicle', 'Street: Outside vehicle', 'Grade Crossing',
  'Non-Revenue Facility',
];
const TRANSIT_VEHICLES = [
  'Bus', 'Light Rail Vehicle', 'Streetcar', 'Non-Revenue Vehicle',
  '(Hi-Rail) On-Rail Mounted Maintenance Truck',
].map(value => ({ value, label: value }));
const HI_RAIL_MODE = 'Hi-Rail';

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">{title}</h3>
        {help && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-['Poppins']">{help}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function BoolRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function fireLocationOptions(mode?: string) {
  return FIRE_LOCATIONS
    .filter(location => mode !== 'Bus' || location !== 'Right-of-Way: Outside vehicle')
    .filter(location => mode !== 'Light Rail Vehicle' || location !== 'Street: Outside vehicle')
    .map(value => ({ value, label: value }));
}

export function FireSection({ data, onUpdate, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const isPossession = data.operating_dart_vehicle === true;
  const isRailMode = ['Light Rail Vehicle', 'Streetcar', HI_RAIL_MODE].includes(data.mode || '');
  const noPossessionOnTransitVehicle = data.operating_dart_vehicle === false && data.fire_location === 'In or on Transit Vehicle';
  const needsStationTransitCenter = data.fire_location === 'Bus Stop/Train Station/Revenue Transit Center';
  const canShowCustomersOnBoard = !['Non-Revenue Vehicle', HI_RAIL_MODE].includes(data.mode || '');
  const locationOptions = fireLocationOptions(data.mode);
  const needsTransitNumber = ['Bus', 'Light Rail Vehicle', 'Streetcar', 'Non-Revenue Vehicle', HI_RAIL_MODE].includes(data.fire_transit_vehicle_on || '');
  const needsTransitRoute = ['Bus', 'Light Rail Vehicle', 'Streetcar'].includes(data.fire_transit_vehicle_on || '');

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}
      {isPossession && (
      <Section title="The Vehicle" help={data.mode === 'Bus' ? "Enter the bus number and Block ID — the route and the vehicle's assigned details are pulled in automatically." : undefined}>
        <ModeVehicleFields data={data} onUpdate={onUpdate} showErrors={showErrors} />
      </Section>
      )}

      <Section title="What Happened" help="Describe the fire or smoke event and the response at the scene.">
        <Field label="Type of event" required error={showErrors && !data.fire_type}>
          <CustomSelect value={data.fire_type || ''} onChange={value => onUpdate({ fire_type: value })} options={FIRE_TYPES} placeholder="Select event type" />
        </Field>
        <Field label="Description of fire" required error={showErrors && !narrativeReadOnly && !data.description_of_event}>
          <textarea rows={4} className={`dart-input-base resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`} value={data.description_of_event || ''} onChange={narrativeReadOnly ? undefined : event => onUpdate({ description_of_event: event.target.value })} readOnly={narrativeReadOnly} placeholder="Describe the fire or smoke event" />
        </Field>

        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="At the time of the event, how did the fire/smoke initially start?" required>
            <div className="w-full sm:w-72"><CustomSelect value={data.fire_started_how || ''} onChange={value => onUpdate({ fire_started_how: value, fire_responsible_for_starting: value === 'Arson' ? data.fire_responsible_for_starting : undefined })} options={FIRE_START_OPTIONS} placeholder="Select" /></div>
          </BoolRow>
          {data.fire_started_how === 'Arson' && (
            <div className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100">
              <BoolRow label="Who is responsible for starting the fire?" required><div className="w-full sm:w-72"><CustomSelect value={data.fire_responsible_for_starting || ''} onChange={value => onUpdate({ fire_responsible_for_starting: value })} options={canShowCustomersOnBoard ? FIRE_RESPONSIBLE_OPTIONS : FIRE_RESPONSIBLE_OPTIONS.filter(option => option.value !== 'Customer on Board')} placeholder="Select" /></div></BoolRow>
            </div>
          )}
          <BoolRow label="Was the fire suppressed while you were on scene?" required><YesNoToggle value={data.fire_suppressed} onChange={value => onUpdate({ fire_suppressed: value, fire_responsible_for_suppressing: value ? data.fire_responsible_for_suppressing : undefined, fire_extinguisher_used: value ? data.fire_extinguisher_used : undefined })} /></BoolRow>
          {data.fire_suppressed === true && (
            <div className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100">
              <BoolRow label="Who is responsible for suppressing the fire?" required><div className="w-full sm:w-72"><CustomSelect value={data.fire_responsible_for_suppressing || ''} onChange={value => onUpdate({ fire_responsible_for_suppressing: value })} options={FIRE_SUPPRESSOR_OPTIONS} placeholder="Select" /></div></BoolRow>
              <BoolRow label="Was a fire extinguisher used?" required><YesNoToggle value={data.fire_extinguisher_used} onChange={value => onUpdate({ fire_extinguisher_used: value })} /></BoolRow>
            </div>
          )}
          <BoolRow label="Did this event involve an evacuation for life safety reasons?" required><YesNoToggle value={data.evacuation_life_safety} onChange={value => onUpdate({ evacuation_life_safety: value, fire_evacuation_rail_right_of_way: value ? data.fire_evacuation_rail_right_of_way : undefined })} /></BoolRow>
          {isRailMode && data.evacuation_life_safety === true && (
            <div className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100">
              <BoolRow label="Was there an evacuation to the rail right of way?" required><YesNoToggle value={data.fire_evacuation_rail_right_of_way} onChange={value => onUpdate({ fire_evacuation_rail_right_of_way: value })} /></BoolRow>
            </div>
          )}
        </div>
      </Section>

      <Section title="Where It Happened" help="Record the fire location and any transit vehicle details when you were not operating one.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location of fire" required error={showErrors && !data.fire_location}>
            <CustomSelect value={data.fire_location || ''} onChange={value => onUpdate({ fire_location: value, fire_transit_vehicle_on: undefined, fire_transit_vehicle_number: undefined, fire_transit_route_or_line: undefined })} options={locationOptions} placeholder="Select location" />
          </Field>
          <Field label="Stations / transit centers" required={needsStationTransitCenter} error={showErrors && needsStationTransitCenter && !data.fire_station_transit_center}>
            <CustomSelect value={data.fire_station_transit_center || ''} onChange={value => onUpdate({ fire_station_transit_center: value })} options={DART_STATION_OPTIONS} placeholder="Select station or transit center" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Street On" required error={showErrors && !(data.street_on || data.fire_address)}>
            <input className="dart-input-base" value={data.street_on || data.fire_address || ''} onChange={event => onUpdate({ street_on: event.target.value, fire_address: event.target.value })} placeholder="e.g. Main St" />
          </Field>
          <Field label="Cross Street" required error={showErrors && !data.cross_street}>
            <input className="dart-input-base" value={data.cross_street || ''} onChange={event => onUpdate({ cross_street: event.target.value })} placeholder="e.g. Elm Ave" />
          </Field>
          <Field label="City" required error={showErrors && !data.city}>
            <input className="dart-input-base" value={data.city || ''} onChange={event => onUpdate({ city: event.target.value })} placeholder="e.g. Dallas" />
          </Field>
          <Field label="ZIP Code" required error={showErrors && !data.zip}>
            <input className="dart-input-base" inputMode="numeric" maxLength={5} value={data.zip || ''} onChange={event => onUpdate({ zip: event.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="e.g. 75201" />
          </Field>
        </div>

        <AnimatePresence initial={false}>
          {noPossessionOnTransitVehicle && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
              <BoolRow label="Which transit vehicle were you on?" required>
                <div className="w-full sm:w-72"><CustomSelect value={data.fire_transit_vehicle_on || ''} onChange={value => onUpdate({ fire_transit_vehicle_on: value, fire_transit_vehicle_number: undefined, fire_transit_route_or_line: undefined })} options={TRANSIT_VEHICLES} placeholder="Select vehicle" /></div>
              </BoolRow>
              {needsTransitNumber && <BoolRow label="Can you provide the transit vehicle number, if applicable?" required><div className="w-full sm:w-72"><input className="dart-input-base" value={data.fire_transit_vehicle_number || ''} onChange={event => onUpdate({ fire_transit_vehicle_number: event.target.value })} placeholder="Enter vehicle number" /></div></BoolRow>}
              {needsTransitRoute && <BoolRow label="Can you provide the transit route number or line, if applicable?"><div className="w-full sm:w-72"><input className="dart-input-base" value={data.fire_transit_route_or_line || ''} onChange={event => onUpdate({ fire_transit_route_or_line: event.target.value })} placeholder="Enter route or line" /></div></BoolRow>}
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Weather And Conditions" help="Record the conditions at the time of the fire.">
        <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required assaultOnly showErrors={showErrors} />
      </Section>
    </div>
  );
}
