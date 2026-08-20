import type { ReactNode } from 'react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { StepContainer } from '../../StepContainer';
import { WeatherSection } from './WeatherSection';
import { ModeVehicleSection } from './ModeVehicleSection';
import type { AccidentReportData } from '../../../types/accident-report';

interface Step2Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  showErrors: boolean;
  narrativeReadOnly?: boolean;
  headerSection?: ReactNode;
}

const toOptions = (values: string[]) => values.map(value => ({ value, label: value }));
const REASONS = toOptions(['Near-Miss Experienced', 'Near-Miss Observed']);
const CATEGORIES = toOptions(['Auto – Near Miss', 'Pedestrian – Near Miss', 'Fixed Object – Near Miss', 'Non-Fixed Object – Near Miss']);
const BUS_LOCATION_CATEGORIES = toOptions(['Grade Crossing', 'Intersection', 'Train Station', 'Bus Stop', 'Street', 'Bridge', 'Tunnel', 'Non-Revenue Facility/Yard', 'Garage']);
const RAIL_LOCATION_CATEGORIES = toOptions(['Grade Crossing', 'Right-of-Way Track', 'Train Station', 'Bridge', 'Tunnel', 'Non-Revenue Facility/Yard', 'Garage']);
const PEDESTRIAN_TYPES = toOptions(['On Foot/Wheelchair/Walker/Cane/Crutches', 'Using Micro Mobility']);
const FOOT_ACTIONS = toOptions(['Standing', 'Walking', 'Jogging/Running', 'Mobility Assistance', 'Lying', 'Sitting']);
const MOBILITY_ACTIONS = toOptions(['Going Straight', 'Making a left turn', 'Making a right turn', 'Going backwards', 'Changing Lanes', 'Stopped', 'Negotiating a curve']);
const DART_VEHICLE_TYPES = toOptions(['Passenger Auto/St Wagon', 'Motorcycle/Moped', 'Passenger Truck/Van', 'Non-Revenue Rail vehicle (Maintenance)', 'Hi-Rail – Maintenance vehicle mounted to rail', 'Light rail vehicle', 'Streetcar', 'Bus', 'Wrecker/Tow Truck/Electric Utility cart/Garbage Truck/Forklift']);
const NON_DART_VEHICLE_TYPES = toOptions(['Passenger Auto/St Wagon', 'Motorcycle/Moped', 'Passenger Truck/Van', 'Delivery Truck/Van', '18 Wheel Truck (Semi)', 'Fire Engine, Ambulance, Police car', 'Tractor Trailer', 'Commercial Rail or Amtrak', 'School Bus/Charter/Tour Bus', 'Taxi/Rideshare', 'Utility Trucks', 'Trolley', 'Wrecker/Tow Truck/Electric Utility cart/Garbage Truck/Forklift']);
const VEHICLE_ACTIONS = toOptions(['Going Straight', 'Making a left turn', 'Making a right turn', 'Going backwards', 'Changing lanes', 'Stopped', 'Negotiating a curve', 'Parked']);

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">{label}{required && <span className="dart-req ml-1">*</span>}</label>
      <div className={error ? 'dart-field-error' : ''}>{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p>}
    </div>
  );
}

function Section({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold text-[#00205B] font-['Poppins'] leading-tight">{title}</h3>
        {help && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-['Poppins']">{help}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function NearMissVehicleSection({ data, onUpdate, showErrors }: { data: AccidentReportData; onUpdate: (d: Partial<AccidentReportData>) => void; showErrors: boolean }) {
  const isObserved = data.near_miss_reason === 'Near-Miss Observed';
  const vehicleData: AccidentReportData = {
    ...data,
    vehicle_number: data.near_miss_vehicle_number,
    fleet_type: data.near_miss_fleet_type,
    train_number: data.near_miss_vehicle_number,
    lrv_fleet_type: data.near_miss_fleet_type,
    rail_line: data.near_miss_rail_line,
    route_number: data.near_miss_route,
    trip_id: data.near_miss_run,
    block_number: data.near_miss_block,
    end_of_line_destination: data.near_miss_end_of_line_destination,
    lrv_end_of_line: data.near_miss_end_of_line_destination,
    employee_pullout_date: data.near_miss_pullout_date,
    employee_pullout_time: data.near_miss_pullout_time,
    train_pullout_date: data.near_miss_pullout_date,
    train_pullout_time: data.near_miss_pullout_time,
    lrv_consist_count: data.near_miss_consist_count,
    lrv_consist_1: data.near_miss_consist_1,
    lrv_consist_2: data.near_miss_consist_2,
    lrv_consist_3: data.near_miss_consist_3,
    lrv_consist_4: data.near_miss_consist_4,
  };
  const updateVehicle = (patch: Partial<AccidentReportData>) => {
    const nearMissPatch: Partial<AccidentReportData> = {};
    if ('vehicle_number' in patch || 'train_number' in patch) nearMissPatch.near_miss_vehicle_number = patch.vehicle_number ?? patch.train_number;
    if ('fleet_type' in patch || 'lrv_fleet_type' in patch) nearMissPatch.near_miss_fleet_type = patch.fleet_type ?? patch.lrv_fleet_type;
    if ('rail_line' in patch) nearMissPatch.near_miss_rail_line = patch.rail_line;
    if ('route_number' in patch) nearMissPatch.near_miss_route = patch.route_number;
    if ('trip_id' in patch) nearMissPatch.near_miss_run = patch.trip_id;
    if ('block_number' in patch) nearMissPatch.near_miss_block = patch.block_number;
    if ('end_of_line_destination' in patch || 'lrv_end_of_line' in patch) nearMissPatch.near_miss_end_of_line_destination = patch.end_of_line_destination ?? patch.lrv_end_of_line;
    if ('employee_pullout_date' in patch || 'train_pullout_date' in patch) nearMissPatch.near_miss_pullout_date = patch.employee_pullout_date ?? patch.train_pullout_date;
    if ('employee_pullout_time' in patch || 'train_pullout_time' in patch) nearMissPatch.near_miss_pullout_time = patch.employee_pullout_time ?? patch.train_pullout_time;
    if ('lrv_consist_count' in patch) nearMissPatch.near_miss_consist_count = patch.lrv_consist_count;
    if ('lrv_consist_1' in patch) nearMissPatch.near_miss_consist_1 = patch.lrv_consist_1;
    if ('lrv_consist_2' in patch) nearMissPatch.near_miss_consist_2 = patch.lrv_consist_2;
    if ('lrv_consist_3' in patch) nearMissPatch.near_miss_consist_3 = patch.lrv_consist_3;
    if ('lrv_consist_4' in patch) nearMissPatch.near_miss_consist_4 = patch.lrv_consist_4;
    onUpdate(nearMissPatch);
  };

  return (
    <ModeVehicleSection
      data={vehicleData}
      onUpdate={updateVehicle}
      showErrors={showErrors}
      showStatusFields={false}
      showLrvConsist={true}
      requiredVehicleNumber={!isObserved}
      help={`Select the ${data.mode || 'DART'} vehicle involved in the Near Miss. Assigned vehicle details are pulled in automatically.`}
    />
  );
}

export function NearMissSection({ data, onUpdate, showErrors, narrativeReadOnly = false, headerSection }: Step2Props) {
  const mode = data.mode || 'Bus';
  const isObserved = data.near_miss_reason === 'Near-Miss Observed';
  const isRail = mode === 'Light Rail Vehicle' || mode === 'Streetcar' || mode === 'Hi-Rail';
  const hasRevenueService = mode === 'Bus' || mode === 'Light Rail Vehicle' || mode === 'Streetcar';
  const locationOptions = isRail ? RAIL_LOCATION_CATEGORIES : BUS_LOCATION_CATEGORIES;
  const resetReasonDependentFields = (reason: string) => onUpdate({
    near_miss_reason: reason as AccidentReportData['near_miss_reason'],
    near_miss_employee_involved: undefined,
    near_miss_speed: undefined,
    near_miss_revenue_service: undefined,
    near_miss_route: undefined,
    near_miss_run: undefined,
    near_miss_block: undefined,
    near_miss_rail_line: undefined,
  });

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}
      <NearMissVehicleSection data={data} onUpdate={onUpdate} showErrors={showErrors} />
      <Section title="What happened" help="Describe the near miss and when it occurred.">
        <Field label="Description of Near Miss" required error={showErrors && !narrativeReadOnly && !data.near_miss_description?.trim()}>
          <textarea rows={4} className={`dart-input-base resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`} value={data.near_miss_description || ''} onChange={narrativeReadOnly ? undefined : event => onUpdate({ near_miss_description: event.target.value })} readOnly={narrativeReadOnly} placeholder="Describe what happened" />
        </Field>
      </Section>

      <Section title="Where it happened" help="Record the location and its category.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location of Near Miss" required error={showErrors && !data.near_miss_location?.trim()}>
            <input className="dart-input-base" value={data.near_miss_location || ''} onChange={event => onUpdate({ near_miss_location: event.target.value })} placeholder="Enter location" />
          </Field>
          <Field label="Location category of Near Miss" required error={showErrors && !data.near_miss_location_category}>
            <CustomSelect value={data.near_miss_location_category || ''} onChange={value => onUpdate({ near_miss_location_category: value })} options={locationOptions} placeholder="Select category" />
          </Field>
        </div>
      </Section>

      <Section title="Reason and category" help="The reporting reason controls which vehicle details are required.">
        <Field label="Reason for reporting" required error={showErrors && !data.near_miss_reason}>
          <CustomSelect value={data.near_miss_reason || ''} onChange={resetReasonDependentFields} options={REASONS} placeholder="Select reason" />
        </Field>
        {isObserved && <Field label="Employee involved name and badge number (if known)"><input className="dart-input-base" value={data.near_miss_employee_involved || ''} onChange={event => onUpdate({ near_miss_employee_involved: event.target.value })} placeholder="Enter name and badge number" /></Field>}
        <Field label="Select the category the Near Miss most relates to" required error={showErrors && !data.near_miss_category}>
          <CustomSelect value={data.near_miss_category || ''} onChange={value => onUpdate({ near_miss_category: value as AccidentReportData['near_miss_category'], near_miss_pedestrian_count: undefined, near_miss_pedestrians: undefined, near_miss_between_dart_vehicles: undefined, near_miss_other_vehicle_type: undefined, near_miss_other_vehicle_action: undefined })} options={CATEGORIES} placeholder="Select category" />
        </Field>
      </Section>

      {!isObserved && <Section title="Near Miss operating details" help="Record speed and service context for a Near Miss you experienced.">
        <Field label="DART vehicle speed at the time of Near Miss" required error={showErrors && !data.near_miss_speed}>
          <input className="dart-input-base" value={data.near_miss_speed || ''} onChange={event => onUpdate({ near_miss_speed: event.target.value })} placeholder="Enter speed" />
        </Field>
        {hasRevenueService && <Field label="Was DART vehicle in revenue service at the time of the Near Miss" required error={showErrors && data.near_miss_revenue_service === undefined}>
          <YesNoToggle value={data.near_miss_revenue_service} onChange={value => onUpdate({ near_miss_revenue_service: value, near_miss_run: value ? data.near_miss_run : undefined })} />
        </Field>}
        {data.near_miss_revenue_service === true && (mode === 'Light Rail Vehicle' || mode === 'Streetcar') && <Field label="Run" required error={showErrors && !data.near_miss_run}>
          <input className="dart-input-base" value={data.near_miss_run || ''} onChange={event => onUpdate({ near_miss_run: event.target.value })} placeholder="Enter run" />
        </Field>}
      </Section>}

      <Section title="Weather and conditions" help="Record the environment at the time of the near miss.">
        <WeatherSection data={{ ...data, weather: data.near_miss_weather, road_conditions: data.near_miss_road_conditions, lighting_conditions: data.near_miss_lighting_conditions, streetlights: data.near_miss_streetlights, traffic_conditions: data.near_miss_traffic_conditions, traffic_controls: data.near_miss_traffic_controls, roadway_configuration: data.near_miss_roadway_configuration }} onUpdate={patch => onUpdate({ near_miss_weather: patch.weather, near_miss_road_conditions: patch.road_conditions, near_miss_lighting_conditions: patch.lighting_conditions, near_miss_streetlights: patch.streetlights, near_miss_traffic_conditions: patch.traffic_conditions, near_miss_traffic_controls: patch.traffic_controls, near_miss_roadway_configuration: patch.roadway_configuration })} mode={mode} bare required showErrors={showErrors} />
      </Section>
    </div>
  );
}

interface Step3Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  showErrors: boolean;
}

export function NearMissPeopleImpactSection({ data, onUpdate, onNext, onBack, onSaveDraft, showErrors }: Step3Props) {
  const isPedestrian = data.near_miss_category === 'Pedestrian – Near Miss';
  const isAuto = data.near_miss_category === 'Auto – Near Miss';
  const pedestrians = data.near_miss_pedestrians || [];
  const count = data.near_miss_pedestrian_count || 0;
  const syncPedestrians = (nextCount: number) => {
    const next = pedestrians.slice(0, nextCount);
    for (let index = next.length; index < nextCount; index += 1) next.push({ id: `near-miss-ped-${Date.now()}-${index}` });
    onUpdate({ near_miss_pedestrian_count: nextCount, near_miss_pedestrians: next });
  };
  const updatePedestrian = (id: string, patch: { pedestrian_type?: string; pedestrian_action?: string }) => onUpdate({ near_miss_pedestrians: pedestrians.map(pedestrian => pedestrian.id === id ? { ...pedestrian, ...patch } : pedestrian) });
  const pedestrianComplete = !isPedestrian || (count > 0 && pedestrians.length === count && pedestrians.every(pedestrian => !!pedestrian.pedestrian_type && !!pedestrian.pedestrian_action));
  const vehicleComplete = !isAuto || (data.near_miss_between_dart_vehicles !== undefined && !!data.near_miss_other_vehicle_type && !!data.near_miss_other_vehicle_action);
  const canProceed = pedestrianComplete && vehicleComplete;

  return (
    <StepContainer stepNumber={3} title="Near Miss close-call details" description="Complete the pedestrian or other-vehicle details that apply to this Near Miss category.">
      <div className="space-y-5">
        <div className="dart-card dart-card--surface overflow-hidden">
          {isPedestrian && <Section title="Pedestrian close calls" help="Enter the number of pedestrians involved. Each pedestrian gets a type and action based on the selected type.">
          <Field label="Number of pedestrians Near Miss (Close Calls)" required error={showErrors && count < 1}><input type="number" min={1} className="dart-input-base sm:w-32" value={count || ''} onChange={event => syncPedestrians(Math.max(0, Number.parseInt(event.target.value, 10) || 0))} placeholder="Enter count" /></Field>
          {pedestrians.map((pedestrian, index) => {
            const actions = pedestrian.pedestrian_type === 'Using Micro Mobility' ? MOBILITY_ACTIONS : FOOT_ACTIONS;
            return <div key={pedestrian.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"><p className="mb-3 text-sm font-semibold text-slate-700 font-['Poppins']">Pedestrian {index + 1}</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Pedestrian type" required error={showErrors && !pedestrian.pedestrian_type}><CustomSelect value={pedestrian.pedestrian_type || ''} onChange={value => updatePedestrian(pedestrian.id, { pedestrian_type: value, pedestrian_action: undefined })} options={PEDESTRIAN_TYPES} placeholder="Select type" /></Field><Field label="Pedestrian action" required error={showErrors && !pedestrian.pedestrian_action}><CustomSelect value={pedestrian.pedestrian_action || ''} onChange={value => updatePedestrian(pedestrian.id, { pedestrian_action: value })} options={actions} placeholder="Select action" /></Field></div></div>;
          })}
        </Section>}
          {isAuto && <Section title="Other vehicle close call" help="Record the other vehicle only for an Auto Near Miss.">
          <Field label="Was this a Near Miss between two DART vehicles" required error={showErrors && data.near_miss_between_dart_vehicles === undefined}><YesNoToggle value={data.near_miss_between_dart_vehicles} onChange={value => onUpdate({ near_miss_between_dart_vehicles: value, near_miss_other_vehicle_type: undefined })} /></Field>
          {data.near_miss_between_dart_vehicles !== undefined && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Other vehicle #2 type" required error={showErrors && !data.near_miss_other_vehicle_type}><CustomSelect value={data.near_miss_other_vehicle_type || ''} onChange={value => onUpdate({ near_miss_other_vehicle_type: value })} options={data.near_miss_between_dart_vehicles ? DART_VEHICLE_TYPES : NON_DART_VEHICLE_TYPES} placeholder="Select vehicle type" /></Field><Field label="Other vehicle #2 action" required error={showErrors && !data.near_miss_other_vehicle_action}><CustomSelect value={data.near_miss_other_vehicle_action || ''} onChange={value => onUpdate({ near_miss_other_vehicle_action: value })} options={VEHICLE_ACTIONS} placeholder="Select action" /></Field></div>}
        </Section>}
          {!isPedestrian && !isAuto && <Section title="No additional close-call details" help="Fixed Object and Non-Fixed Object near misses do not require pedestrian or other-vehicle details." />}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-y-3 border-t border-slate-200 pt-6"><button onClick={onBack} className="dart-action-link min-h-[44px] rounded-lg px-4">← Back</button><div className="flex items-center gap-4"><button onClick={onSaveDraft} className="dart-action-link min-h-[44px] rounded-lg px-4">Save as draft</button><button onClick={onNext} disabled={!canProceed} className="dart-button-primary min-h-[44px] rounded-lg px-5 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div></div>
      </div>
    </StepContainer>
  );
}