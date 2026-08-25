import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { ModeVehicleFields } from './ModeVehicleSection';
import { WeatherSection } from './WeatherSection';
import { BUS_ROUTE_STATUSES, BUS_STATUS_OPTIONS, DART_VEHICLE_ACTIONS } from './BusCollisionSection';
import { RAIL_LINE_STATUSES, TRAIN_STATUS_OPTIONS } from './RailVehicleFields';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
  headerSection?: React.ReactNode;
}

const inputCls = 'dart-input-base';
const RELATING_TO_OPTIONS = [
  { value: 'DART Employee', label: 'DART Employee' },
  { value: 'Passenger/Non-Dart Employee', label: 'Passenger/Non-DART Employee' },
];
const DART_EMPLOYEE_EVENT_TYPES = [
  'Slip, Trips, Fall', 'Sprains and Strains', 'Fractures', 'Cuts and Lacerations',
  'Bruises (Contusions)', 'Burns', 'Crush Injury', 'Puncture Wounds',
  'Medical Emergency (e.g., fainting, seizure, heart attack)', 'Sickness/Occupational Illness',
  'Lost Personal Item', 'Evacuation', 'Transit Equipment Defect',
].map(value => ({ value, label: value }));
const PASSENGER_EVENT_TYPES = [
  'Slip, Trips, Fall', 'Sprains and Strains', 'Fractures', 'Cuts and Lacerations',
  'Bruises (Contusions)', 'Burns', 'Crush Injury', 'Puncture Wounds',
  'Medical Emergency (e.g., fainting, seizure, heart attack)', 'Sickness/Occupational Illness',
  'Assault on a non-employee', 'Vandalism of DART property', 'Lost Personal Item',
  'Customer Complaint', 'Passenger Self-Evacuation',
].map(value => ({ value, label: value }));
const INJURY_EVENT_TYPES = new Set([
  'Slip, Trips, Fall', 'Sprains and Strains', 'Fractures', 'Cuts and Lacerations',
  'Bruises (Contusions)', 'Burns', 'Crush Injury', 'Puncture Wounds',
  'Medical Emergency (e.g., fainting, seizure, heart attack)', 'Sickness/Occupational Illness',
]);
const EVACUATION_LOCATIONS = ['Platform side of the station', 'Non-platform side of the station', 'Right of way'].map(value => ({ value, label: value }));
const EVACUATION_REASONS = ['Safety reasons', 'Non-safety reasons'].map(value => ({ value, label: value }));
const EVENT_LOCATIONS = ['In-Transit vehicle', 'Outside/around the transit vehicle', 'Revenue facilities (Train station/Bus Stop/Transit centers)', 'Non-revenue facilities', 'Right of way', 'Street (All other locations)'].map(value => ({ value, label: value }));
const VEHICLES_ON = ['Bus', 'Light Rail Vehicle', 'Streetcar', 'Non-Revenue Vehicle', '(Hi-Rail) On-Rail Mounted Maintenance Truck'].map(value => ({ value, label: value }));
const VEHICLE_LOCATIONS = ['Boarding with stairs', 'Alighting with stairs', 'Boarding with a lift or ramp', 'Alighting with a lift or ramp', 'On board'].map(value => ({ value, label: value }));
const BODY_PARTS = ['Head injury', 'Upper body injury (Chest to waist)', 'Lower body', 'No Injury'].map(value => ({ value, label: value }));

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">{title}</h3>
        {help && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 font-['Poppins']">{help}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function BoolRow({ label, required, error, className, children }: { label: string; required?: boolean; error?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3 ${error ? 'bg-red-50/50' : ''} ${className || ''}`}>
      <p className={`dart-field-label sm:flex-1 ${error ? 'text-red-600' : ''}`} style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className={`w-full shrink-0 sm:w-72 ${error ? 'dart-field-error' : ''}`}>{children}</div>
    </div>
  );
}

function activeStatus(mode: string | undefined, status: string | undefined) {
  return mode === 'Bus' ? BUS_ROUTE_STATUSES.has(status || '') : RAIL_LINE_STATUSES.has(status || '');
}

export function operatorPassengerEventComplete(data: AccidentReportData) {
  if (data.event_type !== 'Operator/Passenger Events (non-collision)') return true;
  const isOperating = data.operating_dart_vehicle === true;
  const isOnboardTransitVehicle = data.operator_passenger_location === 'In-Transit vehicle'
    && data.operator_passenger_vehicle_location === 'On board';
  const isBus = data.mode === 'Bus';
  const isRail = data.mode === 'Light Rail Vehicle' || data.mode === 'Streetcar';
  const isNonRail = data.mode === 'Hi-Rail' || data.mode === 'Non-Revenue Vehicle';
  const statusBefore = isBus ? data.bus_status_before : data.train_status_before;
  const lrvLineRequired = data.mode === 'Light Rail Vehicle' && RAIL_LINE_STATUSES.has(data.train_status_before || '');
  const vehicleComplete = !isOperating || (
    isBus
      ? !!data.vehicle_number && !!data.block_number && !!data.bus_status_before && !!data.bus_status_after
      : isRail
        ? !!data.train_number && !!data.train_status_before && !!data.train_status_after
          && (data.mode === 'Streetcar' || (!!data.block_number && (!lrvLineRequired || !!data.rail_line) && (data.lrv_consist_count ?? 0) > 0))
        : isNonRail && !!data.vehicle_number
  );
  const routeComplete = !isOperating || !activeStatus(data.mode, statusBefore) || (
    isBus ? !!data.route_number && !!data.block_number : !!data.rail_line
  );
  const baseComplete = !!(
    data.operator_passenger_event_relating_to
    && data.operator_passenger_event_type
    && data.description_of_event?.trim()
    && data.operator_passenger_location
    && data.street_on?.trim()
    && data.cross_street?.trim()
    && data.city?.trim()
    && data.zip?.trim()
    && data.weather
    && data.road_conditions
    && data.lighting_conditions
    && data.traffic_conditions
    && data.traffic_controls
    && data.roadway_configuration
    && vehicleComplete
    && routeComplete
  );
  if (isOnboardTransitVehicle && (!data.operator_passenger_vehicle_speed?.trim() || !data.operator_passenger_vehicle_action)) return false;
  if (!baseComplete) return false;
  const eventType = data.operator_passenger_event_type;
  if (eventType === 'Passenger Self-Evacuation' && (!data.operator_passenger_evacuation_location || !data.operator_passenger_evacuation_reason)) return false;
  if (eventType === 'Transit Equipment Defect' && (data.operator_passenger_defective_vehicle_exchanged === undefined || (data.operator_passenger_defective_vehicle_exchanged && !data.operator_passenger_replacement_vehicle_number?.trim()))) return false;
  if (INJURY_EVENT_TYPES.has(eventType)) {
    if (data.operator_passenger_event_relating_to === 'DART Employee') {
      if (data.operator_passenger_employee_injured === undefined) return false;
      if (data.operator_passenger_employee_injured && (!data.operator_passenger_employee_body_part || data.operator_passenger_employee_transported === undefined)) return false;
    }
  }
  if (data.operator_passenger_location === 'In-Transit vehicle' && !data.operator_passenger_vehicle_location) return false;
  if (!isOperating && data.operator_passenger_location === 'In-Transit vehicle') {
    if (!data.operator_passenger_transit_vehicle_on) return false;
  }
  return true;
}

export function OperatorPassengerEventSection({ data, onUpdate, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const isOperating = data.operating_dart_vehicle === true;
  const isBus = data.mode === 'Bus';
  const isLRV = data.mode === 'Light Rail Vehicle';
  const isStreetcar = data.mode === 'Streetcar';
  const isRail = isLRV || isStreetcar;
  const isInTransitVehicle = data.operator_passenger_location === 'In-Transit vehicle';
  const isOnboardTransitVehicle = isInTransitVehicle && data.operator_passenger_vehicle_location === 'On board';
  const isPassengerEvent = data.operator_passenger_event_relating_to === 'Passenger/Non-Dart Employee';
  const eventTypes = isPassengerEvent
    ? PASSENGER_EVENT_TYPES.filter(option => option.value !== 'Passenger Self-Evacuation' || isLRV)
    : DART_EMPLOYEE_EVENT_TYPES;
  const isInjuryEvent = INJURY_EVENT_TYPES.has(data.operator_passenger_event_type || '');

  useEffect(() => {
    const updates: Partial<AccidentReportData> = {};
    if (!isRail && data.line_description) updates.line_description = undefined;
    if (data.operator_passenger_event_type === 'Passenger Self-Evacuation' && !isLRV) updates.operator_passenger_event_type = undefined;
    if (Object.keys(updates).length > 0) onUpdate(updates);
  }, [data.line_description, data.operator_passenger_event_type, isLRV, isRail, onUpdate]);

  const updateRelation = (value: string) => onUpdate({
    operator_passenger_event_relating_to: value as AccidentReportData['operator_passenger_event_relating_to'],
    operator_passenger_event_type: undefined,
    operator_passenger_employee_injured: undefined,
    operator_passenger_employee_body_part: undefined,
    operator_passenger_employee_transported: undefined,
    operator_passenger_injured_non_transit_employees: undefined,
    operator_passenger_non_transit_employees_transported: undefined,
  });
  const updateEventType = (value: string) => onUpdate({
    operator_passenger_event_type: value,
    operator_passenger_evacuation_location: undefined,
    operator_passenger_evacuation_reason: undefined,
    operator_passenger_defective_vehicle_exchanged: undefined,
    operator_passenger_replacement_vehicle_number: undefined,
    operator_passenger_employee_injured: undefined,
    operator_passenger_employee_body_part: undefined,
    operator_passenger_employee_transported: undefined,
    operator_passenger_injured_non_transit_employees: undefined,
    operator_passenger_non_transit_employees_transported: undefined,
  });

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      {isOperating && (
        <Section title="The Vehicle" help="Select the DART vehicle involved. Fleet, route, and pull-out details are filled from the roster when available.">
          <ModeVehicleFields
            data={data}
            onUpdate={onUpdate}
            showErrors={showErrors}
            statusBeforeOptions={isBus ? BUS_STATUS_OPTIONS : TRAIN_STATUS_OPTIONS}
            statusAfterOptions={isBus ? BUS_STATUS_OPTIONS : TRAIN_STATUS_OPTIONS}
            showRailLine={isLRV}
            showLrvConsist={isLRV}
          />
        </Section>
      )}

      <Section title="What Happened" help="Describe who the event relates to and what occurred.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Who is this event relating to" required error={showErrors && !data.operator_passenger_event_relating_to}>
            <CustomSelect value={data.operator_passenger_event_relating_to || ''} onChange={updateRelation} options={RELATING_TO_OPTIONS} placeholder="Select person" />
          </Field>
          <Field label="Type of event" required error={showErrors && !data.operator_passenger_event_type}>
            <CustomSelect value={data.operator_passenger_event_type || ''} onChange={updateEventType} options={eventTypes} placeholder="Select event type" />
          </Field>
        </div>
        <Field label="Description of event" required error={showErrors && !narrativeReadOnly && !data.description_of_event} helper={narrativeReadOnly ? 'Operator-owned narrative is read-only in this section.' : undefined}>
          <textarea rows={4} value={data.description_of_event || ''} onChange={narrativeReadOnly ? undefined : event => onUpdate({ description_of_event: event.target.value })} readOnly={narrativeReadOnly} placeholder="Describe what happened in your own words..." className={`${inputCls} resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`} />
        </Field>

        {isInjuryEvent && !isPassengerEvent && (
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="Was DART employee injured?" required error={showErrors && data.operator_passenger_employee_injured === undefined}>
              <YesNoToggle value={data.operator_passenger_employee_injured} onChange={value => onUpdate({ operator_passenger_employee_injured: value, operator_passenger_employee_body_part: value ? data.operator_passenger_employee_body_part : undefined, operator_passenger_employee_transported: value ? data.operator_passenger_employee_transported : undefined })} />
            </BoolRow>
            <AnimatePresence initial={false}>
              {data.operator_passenger_employee_injured === true && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100">
                  <BoolRow label="DART employee transported to hospital" required error={showErrors && data.operator_passenger_employee_transported === undefined}>
                    <YesNoToggle value={data.operator_passenger_employee_transported} onChange={value => onUpdate({ operator_passenger_employee_transported: value })} />
                  </BoolRow>
                  <BoolRow label="Which part of DART employee body was injured?" required error={showErrors && !data.operator_passenger_employee_body_part}>
                    <CustomSelect value={data.operator_passenger_employee_body_part || ''} onChange={value => onUpdate({ operator_passenger_employee_body_part: value })} options={BODY_PARTS} placeholder="Select body part" />
                  </BoolRow>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {data.operator_passenger_event_type === 'Passenger Self-Evacuation' && (
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="Evacuation location" required error={showErrors && !data.operator_passenger_evacuation_location}>
              <CustomSelect value={data.operator_passenger_evacuation_location || ''} onChange={value => onUpdate({ operator_passenger_evacuation_location: value })} options={EVACUATION_LOCATIONS} placeholder="Select location" />
            </BoolRow>
            <BoolRow label="Reason for evacuation" required error={showErrors && !data.operator_passenger_evacuation_reason}>
              <CustomSelect value={data.operator_passenger_evacuation_reason || ''} onChange={value => onUpdate({ operator_passenger_evacuation_reason: value })} options={EVACUATION_REASONS} placeholder="Select reason" />
            </BoolRow>
          </div>
        )}

        {data.operator_passenger_event_type === 'Transit Equipment Defect' && (
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="Was the defective transit vehicle exchanged for a replacement vehicle?" required error={showErrors && data.operator_passenger_defective_vehicle_exchanged === undefined}>
              <YesNoToggle value={data.operator_passenger_defective_vehicle_exchanged} onChange={value => onUpdate({ operator_passenger_defective_vehicle_exchanged: value, operator_passenger_replacement_vehicle_number: value ? data.operator_passenger_replacement_vehicle_number : undefined })} />
            </BoolRow>
            {data.operator_passenger_defective_vehicle_exchanged === true && (
              <BoolRow label="What is the replacement vehicle number?" required error={showErrors && !data.operator_passenger_replacement_vehicle_number?.trim()}>
                <input type="text" value={data.operator_passenger_replacement_vehicle_number || ''} onChange={event => onUpdate({ operator_passenger_replacement_vehicle_number: event.target.value })} placeholder="Enter vehicle number" className={inputCls} />
              </BoolRow>
            )}
          </div>
        )}
      </Section>

      <Section title="Where It Happened" help="Record the event location and any transit vehicle details.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className={isInTransitVehicle ? 'sm:col-span-2 md:col-span-2' : 'sm:col-span-2 md:col-span-4'}>
            <Field label="Where did the event take place" required error={showErrors && !data.operator_passenger_location}>
              <CustomSelect value={data.operator_passenger_location || ''} onChange={value => onUpdate({ operator_passenger_location: value, operator_passenger_vehicle_location: undefined, operator_passenger_vehicle_speed: undefined, operator_passenger_vehicle_action: undefined, operator_passenger_transit_vehicle_on: undefined, operator_passenger_transit_vehicle_number: undefined, operator_passenger_transit_route_or_line: undefined })} options={EVENT_LOCATIONS} placeholder="Select location" />
            </Field>
          </div>
          {isInTransitVehicle && (
            <div className="sm:col-span-2 md:col-span-2">
              <Field label="Location of event in vehicle" required error={showErrors && !data.operator_passenger_vehicle_location}>
                <CustomSelect value={data.operator_passenger_vehicle_location || ''} onChange={value => onUpdate({ operator_passenger_vehicle_location: value, operator_passenger_vehicle_speed: value === 'On board' ? data.operator_passenger_vehicle_speed : undefined, operator_passenger_vehicle_action: value === 'On board' ? data.operator_passenger_vehicle_action : undefined })} options={VEHICLE_LOCATIONS} placeholder="Select location" />
              </Field>
            </div>
          )}
        </div>
        {isOnboardTransitVehicle && (
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="Speed at time of event (mph)" required className="py-5 sm:py-4" error={showErrors && !data.operator_passenger_vehicle_speed?.trim()}>
              <input type="number" min={0} max={90} value={data.operator_passenger_vehicle_speed || ''} onChange={event => onUpdate({ operator_passenger_vehicle_speed: event.target.value })} placeholder="Enter speed" className={inputCls} />
            </BoolRow>
            <BoolRow label="DART vehicle action" required className="py-5 sm:py-4" error={showErrors && !data.operator_passenger_vehicle_action}>
              <CustomSelect value={data.operator_passenger_vehicle_action || ''} onChange={value => onUpdate({ operator_passenger_vehicle_action: value })} options={DART_VEHICLE_ACTIONS} placeholder="Select action" />
            </BoolRow>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Street On" required error={showErrors && !data.street_on}><input type="text" value={data.street_on || ''} onChange={event => onUpdate({ street_on: event.target.value })} placeholder="e.g. Main St" className={inputCls} /></Field>
          <Field label="Cross Street" required error={showErrors && !data.cross_street}><input type="text" value={data.cross_street || ''} onChange={event => onUpdate({ cross_street: event.target.value })} placeholder="e.g. Elm Ave" className={inputCls} /></Field>
          <Field label="City" required error={showErrors && !data.city}><input type="text" value={data.city || ''} onChange={event => onUpdate({ city: event.target.value })} placeholder="e.g. Dallas" className={inputCls} /></Field>
          <Field label="ZIP Code" required error={showErrors && !data.zip}><input type="text" inputMode="numeric" maxLength={5} value={data.zip || ''} onChange={event => onUpdate({ zip: event.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="e.g. 75201" className={inputCls} /></Field>
        </div>
        {!isOperating && isInTransitVehicle && (
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="Which transit vehicle were you on?" required error={showErrors && !data.operator_passenger_transit_vehicle_on}>
              <CustomSelect value={data.operator_passenger_transit_vehicle_on || ''} onChange={value => onUpdate({ operator_passenger_transit_vehicle_on: value, operator_passenger_transit_vehicle_number: undefined, operator_passenger_transit_route_or_line: undefined })} options={VEHICLES_ON} placeholder="Select vehicle" />
            </BoolRow>
            {data.operator_passenger_transit_vehicle_on && (
              <>
                <BoolRow label="Can you provide the transit vehicle number, if applicable?">
                  <input type="text" value={data.operator_passenger_transit_vehicle_number || ''} onChange={event => onUpdate({ operator_passenger_transit_vehicle_number: event.target.value })} placeholder="Enter vehicle number" className={inputCls} />
                </BoolRow>
                {['Bus', 'Light Rail Vehicle', 'Streetcar'].includes(data.operator_passenger_transit_vehicle_on) && (
                  <BoolRow label="Can you provide the transit route number or line, if applicable?">
                    <input type="text" value={data.operator_passenger_transit_route_or_line || ''} onChange={event => onUpdate({ operator_passenger_transit_route_or_line: event.target.value })} placeholder="Enter route or line" className={inputCls} />
                  </BoolRow>
                )}
              </>
            )}
          </div>
        )}
      </Section>

      <Section title="Weather And Conditions" help="Record the environment at the time of the event.">
        <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
      </Section>
    </div>
  );
}
