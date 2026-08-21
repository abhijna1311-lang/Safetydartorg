import type { ReactNode } from 'react';
import { CustomSelect } from '../../CustomSelect';
import { StepContainer } from '../../StepContainer';
import { GlassButton } from '../../GlassButton';
import { PersonListEditor } from '../../PersonListEditor';
import { WeatherSection } from './WeatherSection';
import { ModeVehicleSection } from './ModeVehicleSection';
import { OtherVehiclesEditor } from '../../OtherVehiclesEditor';
import type { AccidentReportData, NearMissPedestrianRecord, OtherVehicle, Person } from '../../../types/accident-report';

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

export function getNearMissOtherVehicles(data: AccidentReportData): OtherVehicle[] {
  if (data.near_miss_other_vehicles) return data.near_miss_other_vehicles;
  if (data.near_miss_between_dart_vehicles !== undefined || data.near_miss_other_vehicle_type || data.near_miss_other_vehicle_action) {
    return [{
      id: 'near-miss-vehicle-2',
      dart_dart: data.near_miss_between_dart_vehicles,
      vehicle_type: data.near_miss_other_vehicle_type,
      action: data.near_miss_other_vehicle_action,
    }];
  }
  return [];
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">{label}{required && <span className="dart-req ml-1">*</span>}</label>
      <div className={error ? 'dart-field-error' : ''}>{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p>}
    </div>
  );
}

function InlineField({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3 ${error ? 'bg-red-50/50' : ''}`}>
      <p className={`dart-field-label sm:flex-1 ${error ? 'text-red-600' : ''}`} style={{ marginBottom: 0 }}>
        {label}{required && <span className="dart-req ml-1">*</span>}
      </p>
      <div className={`w-full shrink-0 sm:w-60 ${error ? 'dart-field-error' : ''}`}>
        {children}
        {error && <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p>}
      </div>
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
    if ('train_status_before' in patch) nearMissPatch.train_status_before = patch.train_status_before;
    if ('train_status_after' in patch) nearMissPatch.train_status_after = patch.train_status_after;
    if ('bus_status_before' in patch) nearMissPatch.bus_status_before = patch.bus_status_before;
    if ('bus_status_after' in patch) nearMissPatch.bus_status_after = patch.bus_status_after;
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
      showRailLine
      showStatusFields
      showVehicleDetails
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
  const locationOptions = isRail ? RAIL_LOCATION_CATEGORIES : BUS_LOCATION_CATEGORIES;
  const resetReasonDependentFields = (reason: string) => onUpdate({
    near_miss_reason: reason as AccidentReportData['near_miss_reason'],
    near_miss_employee_involved: undefined,
    near_miss_speed: undefined,
    near_miss_route: undefined,
    near_miss_run: undefined,
    near_miss_block: undefined,
    near_miss_rail_line: undefined,
  });
  const updateWeather = (patch: Partial<AccidentReportData>) => {
    const nearMissPatch: Partial<AccidentReportData> = {};
    if ('weather' in patch) nearMissPatch.near_miss_weather = patch.weather;
    if ('road_conditions' in patch) nearMissPatch.near_miss_road_conditions = patch.road_conditions;
    if ('lighting_conditions' in patch) nearMissPatch.near_miss_lighting_conditions = patch.lighting_conditions;
    if ('streetlights' in patch) nearMissPatch.near_miss_streetlights = patch.streetlights;
    if ('traffic_conditions' in patch) nearMissPatch.near_miss_traffic_conditions = patch.traffic_conditions;
    if ('traffic_controls' in patch) nearMissPatch.near_miss_traffic_controls = patch.traffic_controls;
    if ('roadway_configuration' in patch) nearMissPatch.near_miss_roadway_configuration = patch.roadway_configuration;
    onUpdate(nearMissPatch);
  };

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}
      <NearMissVehicleSection data={data} onUpdate={onUpdate} showErrors={showErrors} />
      <Section title="What happened" help="Describe the near miss, why it is being reported, and the operating context.">
        <Field label="Description of Near Miss" required error={showErrors && !narrativeReadOnly && !data.near_miss_description?.trim()}>
          <textarea rows={4} className={`dart-input-base resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`} value={data.near_miss_description || ''} onChange={narrativeReadOnly ? undefined : event => onUpdate({ near_miss_description: event.target.value })} readOnly={narrativeReadOnly} placeholder="Describe what happened" />
        </Field>
        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <InlineField label="Reason for reporting" required error={showErrors && !data.near_miss_reason}>
            <CustomSelect value={data.near_miss_reason || ''} onChange={resetReasonDependentFields} options={REASONS} placeholder="Select reason" />
          </InlineField>
          <InlineField label="Select the category the Near Miss most relates to" required error={showErrors && !data.near_miss_category}>
            <CustomSelect value={data.near_miss_category || ''} onChange={value => onUpdate({ near_miss_category: value as AccidentReportData['near_miss_category'], near_miss_pedestrian_count: undefined, near_miss_pedestrians: undefined, near_miss_between_dart_vehicles: undefined, near_miss_other_vehicle_type: undefined, near_miss_other_vehicle_action: undefined, near_miss_other_vehicles: undefined })} options={CATEGORIES} placeholder="Select category" />
          </InlineField>
          {!isObserved && <>
            <InlineField label="DART vehicle speed at the time of Near Miss" required error={showErrors && !data.near_miss_speed}>
              <input className="dart-input-base" value={data.near_miss_speed || ''} onChange={event => onUpdate({ near_miss_speed: event.target.value })} placeholder="Enter speed" />
            </InlineField>
            {(mode === 'Light Rail Vehicle' || mode === 'Streetcar') && <InlineField label="Run" required error={showErrors && !data.near_miss_run}>
              <input className="dart-input-base" value={data.near_miss_run || ''} onChange={event => onUpdate({ near_miss_run: event.target.value })} placeholder="Enter run" />
            </InlineField>}
          </>}
        </div>
      </Section>

      <Section title="Where it happened" help="Record the street address and cross street where the Near Miss occurred.">
        <Field label="Location Category of Near Miss" required error={showErrors && !data.near_miss_location_category}>
          <CustomSelect value={data.near_miss_location_category || ''} onChange={value => onUpdate({ near_miss_location_category: value })} options={locationOptions} placeholder="Select category" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Street On" required error={showErrors && !data.near_miss_street_on?.trim()}>
            <input className="dart-input-base" value={data.near_miss_street_on || ''} onChange={event => onUpdate({ near_miss_street_on: event.target.value })} placeholder="e.g. Main St" />
          </Field>
          <Field label="Cross Street" required error={showErrors && !data.near_miss_cross_street?.trim()}>
            <input className="dart-input-base" value={data.near_miss_cross_street || ''} onChange={event => onUpdate({ near_miss_cross_street: event.target.value })} placeholder="e.g. Elm Ave" />
          </Field>
          <Field label="City" required error={showErrors && !data.near_miss_city?.trim()}>
            <input className="dart-input-base" value={data.near_miss_city || ''} onChange={event => onUpdate({ near_miss_city: event.target.value })} placeholder="e.g. Dallas" />
          </Field>
          <Field label="ZIP Code" required error={showErrors && !data.near_miss_zip?.trim()}>
            <input className="dart-input-base" value={data.near_miss_zip || ''} onChange={event => onUpdate({ near_miss_zip: event.target.value })} placeholder="e.g. 75201" inputMode="numeric" />
          </Field>
        </div>
      </Section>

      <Section title="Weather and conditions" help="Record the environment at the time of the near miss.">
        <WeatherSection data={{ ...data, weather: data.near_miss_weather, road_conditions: data.near_miss_road_conditions, lighting_conditions: data.near_miss_lighting_conditions, streetlights: data.near_miss_streetlights, traffic_conditions: data.near_miss_traffic_conditions, traffic_controls: data.near_miss_traffic_controls, roadway_configuration: data.near_miss_roadway_configuration }} onUpdate={updateWeather} mode={mode} bare required showErrors={showErrors} />
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
  const isPedestrian = data.near_miss_category?.startsWith('Pedestrian') === true;
  const isAuto = data.near_miss_category?.startsWith('Auto') === true;
  const pedestrians = data.near_miss_pedestrians || [];
  const otherVehicles = getNearMissOtherVehicles(data);
  const count = data.near_miss_pedestrian_count || 0;
  const pedestrianComplete = !isPedestrian || (count > 0 && pedestrians.length === count && pedestrians.every(pedestrian => !!pedestrian.pedestrian_type && !!pedestrian.pedestrian_action));
  const vehicleComplete = !isAuto || (otherVehicles.length > 0 && otherVehicles.every(vehicle => vehicle.dart_dart !== undefined && !!vehicle.vehicle_type && !!vehicle.action));
  const updateOtherVehicles = (vehicles: OtherVehicle[]) => {
    const first = vehicles[0];
    onUpdate({
      near_miss_other_vehicles: vehicles,
      near_miss_between_dart_vehicles: first?.dart_dart,
      near_miss_other_vehicle_type: first?.vehicle_type,
      near_miss_other_vehicle_action: first?.action,
    });
  };
  const updatePedestrians = (people: Person[]) => {
    const next: NearMissPedestrianRecord[] = people.map(person => ({
      id: person.id,
      gender: person.gender,
      is_dart_employee: person.is_dart_employee,
      pedestrian_type: person.pedestrian_type,
      pedestrian_action: person.pedestrian_action,
    }));
    onUpdate({ near_miss_pedestrians: next, near_miss_pedestrian_count: next.length });
  };
  const canProceed = pedestrianComplete && vehicleComplete;

  return (
    <StepContainer stepNumber={3} title="People And Impact" description="Record the people and other vehicles involved in this Near Miss.">
      <div className="space-y-5">
        <div className="dart-card dart-card--surface overflow-hidden">
          {isPedestrian && <Section title="Pedestrians" help="Add each pedestrian involved in the close call. Each person can be expanded to capture their type and action.">
            <PersonListEditor
              variant="nearMiss"
              people={pedestrians.map(pedestrian => ({ id: pedestrian.id, role: 'Pedestrian', pedestrian_type: pedestrian.pedestrian_type, pedestrian_action: pedestrian.pedestrian_action }))}
              onChange={updatePedestrians}
              showErrors={showErrors}
              injuryDetailsRequired={false}
              showFollowUpFields={false}
              showPassengerAction={false}
            />
          </Section>}
          {isAuto && <Section title="Other vehicles" help="Add each vehicle involved besides the DART vehicle. Each vehicle can be expanded to capture its near miss details.">
            <OtherVehiclesEditor variant="nearMiss" vehicles={otherVehicles} onChange={updateOtherVehicles} showErrors={showErrors} injuryDetailsRequired={false} />
          </Section>}
          {!isPedestrian && !isAuto && <Section title="No additional close-call details" help="Fixed Object and Non-Fixed Object near misses do not require pedestrian or other-vehicle details." />}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-y-3 border-t border-slate-200 pt-6"><button onClick={onBack} className="dart-action-link min-h-[44px] rounded-lg px-4">← Back</button><div className="flex items-center gap-4"><GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton><GlassButton variant="primary" onClick={onNext} disabled={!canProceed}>Next</GlassButton></div></div>
      </div>
    </StepContainer>
  );
}