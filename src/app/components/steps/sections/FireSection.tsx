import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { WeatherSection } from './WeatherSection';
import { BUS_STATUS_OPTIONS } from './BusCollisionSection';
import { TRAIN_STATUS_OPTIONS } from './RailVehicleFields';
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
];
const TRANSIT_VEHICLES = [
  'Bus', 'Light Rail Vehicle', 'Streetcar', 'Non-Revenue Vehicle',
  '(Hi-Rail) On-Rail Mounted Maintenance Truck',
].map(value => ({ value, label: value }));
const RAIL_LINES = ['Blue', 'Red', 'Orange', 'Green', 'Streetcar'].map(value => ({ value, label: value }));
const ACTIVE_STATUSES = ['In Service', 'Pull In', 'Pull Out', 'Service Protection'];
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

function activeStatus(status?: string) {
  return ACTIVE_STATUSES.includes(status || '');
}

function VehicleFields({ data, onUpdate, showErrors }: { data: AccidentReportData; onUpdate: Props['onUpdate']; showErrors: boolean }) {
  const mode = data.mode;
  const isBus = mode === 'Bus';
  const isLRV = mode === 'Light Rail Vehicle';
  const isStreetcar = mode === 'Streetcar';
  const isRail = isLRV || isStreetcar;
  const isHiRail = mode === HI_RAIL_MODE;
  const isNRV = mode === 'Non-Revenue Vehicle';
  const before = isBus ? data.bus_status_before : isRail ? data.train_status_before : data.vehicle_status_before;
  const after = isBus ? data.bus_status_after : isRail ? data.train_status_after : data.vehicle_status_after;
  const beforeKey = isBus ? 'bus_status_before' : isRail ? 'train_status_before' : 'vehicle_status_before';
  const afterKey = isBus ? 'bus_status_after' : isRail ? 'train_status_after' : 'vehicle_status_after';
  const setStatus = (key: string, value: string) => onUpdate({ [key]: value } as Partial<AccidentReportData>);
  const routeVisible = activeStatus(before);

  if (isHiRail || isNRV) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={isHiRail ? 'Hi-Rail vehicle number' : 'Vehicle number'} required error={showErrors && !data.vehicle_number}>
          <input className="dart-input-base" value={data.vehicle_number || ''} onChange={event => onUpdate({ vehicle_number: event.target.value })} placeholder="Enter vehicle number" />
        </Field>
        {isHiRail && <Field label="Fleet type"><input className="dart-input-base" value={data.fleet_type || ''} onChange={event => onUpdate({ fleet_type: event.target.value })} placeholder="Enter fleet type" /></Field>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={isBus ? 'Vehicle number' : isStreetcar ? 'Streetcar number' : 'LRV number'} required error={showErrors && !(isBus ? data.vehicle_number : data.train_number)}>
          <input className="dart-input-base" value={(isBus ? data.vehicle_number : data.train_number) || ''} onChange={event => onUpdate(isBus ? { vehicle_number: event.target.value } : { train_number: event.target.value })} placeholder="Enter vehicle number" />
        </Field>
        <Field label="DART vehicle status before event" required error={showErrors && !before}>
          <CustomSelect value={before || ''} onChange={value => setStatus(beforeKey, value)} options={isBus ? BUS_STATUS_OPTIONS : TRAIN_STATUS_OPTIONS} placeholder="Select status" />
        </Field>
        <Field label="DART vehicle status after event" required error={showErrors && !after}>
          <CustomSelect value={after || ''} onChange={value => setStatus(afterKey, value)} options={isBus ? BUS_STATUS_OPTIONS : TRAIN_STATUS_OPTIONS} placeholder="Select status" />
        </Field>
      </div>
      {routeVisible && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isLRV && <Field label="Rail line"><CustomSelect value={data.rail_line || ''} onChange={value => onUpdate({ rail_line: value })} options={RAIL_LINES} placeholder="Select rail line" /></Field>}
          {isBus && <Field label="Route"><input className="dart-input-base" value={data.route_number || ''} onChange={event => onUpdate({ route_number: event.target.value })} placeholder="Enter route" /></Field>}
          {isBus && <Field label="Block"><input className="dart-input-base" value={data.block_number || ''} onChange={event => onUpdate({ block_number: event.target.value })} placeholder="Enter block" /></Field>}
        </div>
      )}
      {isLRV && (
        <Field label="How many LRVs consist?"><input type="number" min={1} className="dart-input-base" value={data.lrv_consist_count ?? ''} onChange={event => onUpdate({ lrv_consist_count: event.target.value ? Math.max(1, Number(event.target.value)) : undefined })} placeholder="Enter count" /></Field>
      )}
    </div>
  );
}

export function FireSection({ data, onUpdate, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const isPossession = data.operating_dart_vehicle === true;
  const isRailMode = ['Light Rail Vehicle', 'Streetcar', HI_RAIL_MODE].includes(data.mode || '');
  const noPossessionOnTransitVehicle = data.operating_dart_vehicle === false && data.fire_location === 'In or on Transit Vehicle';
  const canShowCustomersOnBoard = !['Non-Revenue Vehicle', HI_RAIL_MODE].includes(data.mode || '');
  const locationOptions = fireLocationOptions(data.mode);
  const needsTransitNumber = ['Bus', 'Light Rail Vehicle', 'Streetcar', 'Non-Revenue Vehicle', HI_RAIL_MODE].includes(data.fire_transit_vehicle_on || '');
  const needsTransitRoute = ['Bus', 'Light Rail Vehicle', 'Streetcar'].includes(data.fire_transit_vehicle_on || '');

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}
      {isPossession && (
      <Section title="The Vehicle" help="Enter the DART vehicle involved in the fire event.">
        <VehicleFields data={data} onUpdate={onUpdate} showErrors={showErrors} />
      </Section>
      )}

      <Section title="What Happened" help="Describe the fire or smoke event and the response at the scene.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Description of fire" required error={showErrors && !narrativeReadOnly && !data.description_of_event}>
            <textarea rows={4} className={`dart-input-base resize-none sm:col-span-2 ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`} value={data.description_of_event || ''} onChange={narrativeReadOnly ? undefined : event => onUpdate({ description_of_event: event.target.value })} readOnly={narrativeReadOnly} placeholder="Describe the fire or smoke event" />
          </Field>
          <Field label="Type of event" required error={showErrors && !data.fire_type}>
            <CustomSelect value={data.fire_type || ''} onChange={value => onUpdate({ fire_type: value })} options={FIRE_TYPES} placeholder="Select event type" />
          </Field>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="At the time of the event, how did the fire/smoke initially start?" required>
            <div className="w-full sm:w-72"><CustomSelect value={data.fire_started_how || ''} onChange={value => onUpdate({ fire_started_how: value, fire_responsible_for_starting: value === 'Arson' ? data.fire_responsible_for_starting : undefined })} options={FIRE_START_OPTIONS} placeholder="Select" /></div>
          </BoolRow>
          {data.fire_started_how === 'Arson' && <BoolRow label="Who is responsible for starting the fire?" required><div className="w-full sm:w-72"><CustomSelect value={data.fire_responsible_for_starting || ''} onChange={value => onUpdate({ fire_responsible_for_starting: value })} options={canShowCustomersOnBoard ? FIRE_RESPONSIBLE_OPTIONS : FIRE_RESPONSIBLE_OPTIONS.filter(option => option.value !== 'Customer on Board')} placeholder="Select" /></div></BoolRow>}
          <BoolRow label="Was the fire suppressed while you were on scene?" required><YesNoToggle value={data.fire_suppressed} onChange={value => onUpdate({ fire_suppressed: value, fire_responsible_for_suppressing: value ? data.fire_responsible_for_suppressing : undefined })} /></BoolRow>
          {data.fire_suppressed === true && <BoolRow label="Who is responsible for suppressing the fire?" required><div className="w-full sm:w-72"><CustomSelect value={data.fire_responsible_for_suppressing || ''} onChange={value => onUpdate({ fire_responsible_for_suppressing: value })} options={FIRE_SUPPRESSOR_OPTIONS} placeholder="Select" /></div></BoolRow>}
          <BoolRow label="Did this event involve an evacuation for life safety reasons?" required><YesNoToggle value={data.evacuation_life_safety} onChange={value => onUpdate({ evacuation_life_safety: value, fire_evacuation_rail_right_of_way: value ? data.fire_evacuation_rail_right_of_way : undefined })} /></BoolRow>
          {isRailMode && data.evacuation_life_safety === true && <BoolRow label="Was there an evacuation to the rail right of way?" required><YesNoToggle value={data.fire_evacuation_rail_right_of_way} onChange={value => onUpdate({ fire_evacuation_rail_right_of_way: value })} /></BoolRow>}
        </div>
      </Section>

      <Section title="Where It Happened" help="Record the fire location and any transit vehicle details when you were not operating one.">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Stations / transit centers" required error={showErrors && !data.fire_station_transit_center}>
            <input className="dart-input-base" value={data.fire_station_transit_center || ''} onChange={event => onUpdate({ fire_station_transit_center: event.target.value })} placeholder="Enter station or transit center" />
          </Field>
          <Field label="Location of fire" required error={showErrors && !data.fire_location}>
            <CustomSelect value={data.fire_location || ''} onChange={value => onUpdate({ fire_location: value, fire_transit_vehicle_on: undefined, fire_transit_vehicle_number: undefined, fire_transit_route_or_line: undefined })} options={locationOptions} placeholder="Select location" />
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
