import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { DatePickerInput } from '../../DatePickerInput';
import { TimePickerInput } from '../../TimePickerInput';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { VehicleImpactDiagram } from '../../VehicleImpactDiagram';
import { WeatherSection } from './WeatherSection';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  compactMode?: boolean;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
}

// ── option lists ──────────────────────────────────────────────────────────────
export const BUS_STATUS_OPTIONS = [
  'In Service', 'Deadhead', 'Not In Service', 'Pull In', 'Pull Out',
  'In Yard/Bus Lot', 'Road Test', 'Tow', 'Service Protection',
  'Special Events', 'Non-Revenue Training',
].map(v => ({ value: v, label: v }));

const EVENT_TYPE_WITH = [
  'Collision – with Auto', 'Collision – with Pedestrian',
  'Collision – with Fixed Object', 'Collision – with Non-Fixed Object',
  'Collision – with Animal',
].map(v => ({ value: v, label: v }));

const BUS_ACTIONS = [
  'Changing Lanes', 'Completion of Left Turn', 'Completion of Right Turn',
  'Leaving Bus Stop', 'Leaving Terminus', 'Merging Left', 'Merging Right',
  'Moving Forward', 'Moving from Curb', 'Moving in Front of Bus',
  'Moving in Traffic Circle', 'Moving into Bus Stop', 'Moving into Terminus',
  'Moving Left of Bus', 'Moving Left to Right', 'Moving on Left Bend',
  'Moving on Right Bend', 'Moving Right of Bus', 'Moving Right to Left',
  'Moving Straight', 'Parked', 'Passing Left', 'Passing Right',
  'Reversing', 'Rolling Backward', 'Rolling Forward', 'Stopped', 'Stopping',
  'Turning Left', 'Turning Right', 'U-Turn',
].map(v => ({ value: v, label: v }));

const BUS_IMPACT = [
  'Bike Rack', "Driver's Side Mirror", 'Front Impact', 'Front/Rear Wheel',
  'Left Side Impact', 'Left Sideswipe', 'Passenger Side Mirror',
  'Rear Impact', 'Right Side Impact', 'Right Sideswipe', 'Top', 'Underbody',
].map(v => ({ value: v, label: v }));

const RUNAWAY_OPERATOR = [
  'Operator not in vehicle', 'Operator in vehicle',
].map(v => ({ value: v, label: v }));

// Bus → Trip → Block cascade. Picking a bus reveals its trips; picking a trip reveals its blocks.
// (Prototype data — in production these come from the scheduling system.)
export const FLEET = [
  { id: '2045', type: '40 ft Low Floor', trips: [
    { trip: 'T-1548', route: 'Route 15', endOfLine: 'Downtown Transit Center', blocks: [
      { block: 'BLK-215', pulloutDate: '2026-07-24', pulloutTime: '05:12' },
      { block: 'BLK-216', pulloutDate: '2026-07-24', pulloutTime: '13:40' },
    ] },
    { trip: 'T-1549', route: 'Route 15', endOfLine: 'Crossroads Station', blocks: [
      { block: 'BLK-217', pulloutDate: '2026-07-24', pulloutTime: '06:05' },
    ] },
  ] },
  { id: '3012', type: '60 ft Articulated', trips: [
    { trip: 'T-2231', route: 'Route 22', endOfLine: 'North Star Mall', blocks: [
      { block: 'BLK-322', pulloutDate: '2026-07-24', pulloutTime: '04:48' },
    ] },
    { trip: 'T-2232', route: 'Route 22', endOfLine: 'Medical Center', blocks: [
      { block: 'BLK-323', pulloutDate: '2026-07-24', pulloutTime: '15:10' },
    ] },
  ] },
  { id: '1523', type: '35 ft Standard', trips: [
    { trip: 'T-1012', route: 'Route 10', endOfLine: 'Medical Center', blocks: [
      { block: 'BLK-110', pulloutDate: '2026-07-24', pulloutTime: '05:30' },
    ] },
  ] },
  { id: '4089', type: '40 ft Hybrid', trips: [
    { trip: 'T-2014', route: 'Route 201', endOfLine: 'Airport', blocks: [
      { block: 'BLK-420', pulloutDate: '2026-07-24', pulloutTime: '06:05' },
      { block: 'BLK-421', pulloutDate: '2026-07-24', pulloutTime: '14:22' },
    ] },
  ] },
  { id: '5201', type: '40 ft Low Floor', trips: [
    { trip: 'T-0523', route: 'Route 5', endOfLine: 'Crossroads Station', blocks: [
      { block: 'BLK-205', pulloutDate: '2026-07-24', pulloutTime: '04:20' },
    ] },
  ] },
];

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

// Spring for follow-up questions that glide in beside a toggle (same feel as the Step 1 schedule row).
const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

const inputCls = "dart-input-base";

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

// A single yes/no (or short-select) question rendered as an inline row — label left, control right.
// Keeps the boolean group tight and balanced instead of leaving wide gaps beside compact toggles.
function BoolRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${m}/${d}/${y}` : iso;
}
function fmtTime(val?: string) {
  if (!val) return undefined;
  const [h, mm = '00'] = val.split(':');
  const h24 = parseInt(h, 10);
  if (Number.isNaN(h24)) return val;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm.padStart(2, '0')} ${period}`;
}

// Vehicle record pulled from the vehicle lookup — reads the live data fields each render, so
// changing any identifier (bus number, Trip ID, Block ID) re-populates the matching values.
function VehicleRecordCard({ data }: { data: AccidentReportData }) {
  const cols = [
    { label: 'Fleet type', value: data.fleet_type, glyph: 'directions_bus' },
    { label: 'Route', value: data.route_number, glyph: 'route' },
    { label: 'Pull-out date', value: fmtDate(data.employee_pullout_date), glyph: 'calendar_month' },
    { label: 'Pull-out time', value: fmtTime(data.employee_pullout_time), glyph: 'schedule' },
    { label: 'End of line destination', value: data.end_of_line_destination, glyph: 'flag' },
  ];
  return (
    <div className="dart-vehicle-strip">
      {cols.map(({ label, value, glyph }) => (
        <div key={label} className="dart-vehicle-item">
          <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">{glyph}</span></span>
          <div className="dart-vehicle-text">
            <span className="dart-vehicle-label">{label}</span>
            <span className="dart-vehicle-value dart-tabular">{value || '\u2014'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BusCollisionSection({ data, onUpdate, compactMode = false, narrativeReadOnly = false, showErrors = false }: Props) {
  // Bus → Trip → Block cascade: each list is filtered by its parent selection.
  const vehicleOptions: ComboboxOption[] = FLEET.map(f => ({
    value: f.id, label: f.id, description: f.type,
  }));
  const selectedBus = FLEET.find(f => f.id === data.vehicle_number);
  const tripOptions = (selectedBus?.trips ?? []).map(t => ({ value: t.trip, label: t.trip }));
  const selectedTrip = selectedBus?.trips.find(t => t.trip === data.trip_id);
  const blockOptions = (selectedTrip?.blocks ?? []).map(b => ({ value: b.block, label: b.block }));

  // Selecting a level fills its record slice and RESETS everything below it (so no stale child stays).
  const handleVehicleChange = (val: string) => {
    const f = FLEET.find(x => x.id === val);
    onUpdate({
      vehicle_number: val,
      fleet_type: f?.type,
      trip_id: undefined, route_number: undefined, end_of_line_destination: undefined,
      block_number: undefined, employee_pullout_date: undefined, employee_pullout_time: undefined,
    });
  };
  const handleTripChange = (val: string) => {
    const t = selectedBus?.trips.find(x => x.trip === val);
    onUpdate({
      trip_id: val,
      route_number: t?.route,
      end_of_line_destination: t?.endOfLine,
      block_number: undefined, employee_pullout_date: undefined, employee_pullout_time: undefined,
    });
  };
  const handleBlockChange = (val: string) => {
    const b = selectedTrip?.blocks.find(x => x.block === val);
    onUpdate({ block_number: val, employee_pullout_date: b?.pulloutDate, employee_pullout_time: b?.pulloutTime });
  };

  const hasVehicleRecord = !!(data.vehicle_number && data.trip_id?.trim() && data.block_number?.trim());

  return (
    <div className="dart-card dart-card--surface overflow-hidden">

      {/* 1 — The vehicle: bus number + Trip ID + Block ID drive the read-only detail card above */}
      <Section title="The vehicle" help="Enter the bus number, Trip ID and Block ID — the vehicle's assigned details are pulled in automatically.">
        <AnimatePresence>
          {hasVehicleRecord && (
            <motion.div {...fade} key="vehicle-record">
              <VehicleRecordCard data={data} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: hasVehicleRecord ? 26 : undefined }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-[18px]">
          <div>
            <label className="dart-field-label">
              Bus vehicle number <span className="dart-req">*</span>
            </label>
            <div className={showErrors && !data.vehicle_number ? 'rounded-[11px] ring-2 ring-red-400/70' : ''}>
              <SearchableCombobox
                options={vehicleOptions}
                value={data.vehicle_number || ''}
                onChange={handleVehicleChange}
                placeholder="Search vehicle #"
                searchPlaceholder="Type vehicle number..."
                emptyMessage="No vehicles found"
              />
            </div>
            {showErrors && !data.vehicle_number && (
              <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">Bus vehicle number is required.</p>
            )}
          </div>

          <Field label="Trip ID" required error={showErrors && !data.trip_id}>
            <CustomSelect value={data.trip_id || ''} onChange={handleTripChange} options={tripOptions} placeholder={data.vehicle_number ? 'Select trip' : 'Select bus first'} disabled={!data.vehicle_number} />
          </Field>
          <Field label="Block ID" required error={showErrors && !data.block_number}>
            <CustomSelect value={data.block_number || ''} onChange={handleBlockChange} options={blockOptions} placeholder={data.trip_id ? 'Select block' : 'Select trip first'} disabled={!data.trip_id} />
          </Field>
          <Field label="Status before event" required>
            <CustomSelect value={data.bus_status_before || ''} onChange={v => onUpdate({ bus_status_before: v })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
          </Field>
          <Field label="Status after event" required>
            <CustomSelect value={data.bus_status_after || ''} onChange={v => onUpdate({ bus_status_after: v })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
          </Field>
        </div>
      </Section>

      {/* 2 — What happened: the narrative + mechanics of the collision */}
      <Section title="What happened" help="One continuous account of the collision — the description, mechanics, impact, and any runaway or evacuation.">
        {!compactMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Event type with" required>
              <CustomSelect value={data.collision_type || ''} onChange={v => onUpdate({ collision_type: v })} options={EVENT_TYPE_WITH} placeholder="Select collision type" />
            </Field>
            <Field label="Bus action at time of event" required>
              <CustomSelect value={data.bus_action || ''} onChange={v => onUpdate({ bus_action: v })} options={BUS_ACTIONS} placeholder="Select action" />
            </Field>
            <Field label="Bus speed at time of event (mph)">
              <input type="number" min={0} max={90} value={data.bus_speed || ''} onChange={e => onUpdate({ bus_speed: e.target.value })} placeholder="0" className={inputCls} />
            </Field>
          </div>
        )}

        <Field label="Description of event" required error={showErrors && !narrativeReadOnly && !data.description_of_event} helper={narrativeReadOnly ? 'Operator-owned narrative is read-only in this section.' : undefined}>
          <textarea
            rows={4}
            value={data.description_of_event || ''}
            onChange={narrativeReadOnly ? undefined : (e => onUpdate({ description_of_event: e.target.value }))}
            placeholder="Describe what happened in your own words..."
            readOnly={narrativeReadOnly}
            className={`${inputCls} resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`}
          />
        </Field>

        {!compactMode && (
          <>

            <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
              <BoolRow label="Did this event involve an evacuation for life safety reasons?">
                <YesNoToggle value={data.evacuation_life_safety} onChange={v => onUpdate({ evacuation_life_safety: v })} />
              </BoolRow>

              <BoolRow label="Did this event involve a runaway bus?">
                <YesNoToggle
                  value={data.runaway_vehicle}
                  onChange={v => onUpdate({ runaway_vehicle: v, operator_in_vehicle_runaway: undefined, parking_brake_engaged: undefined })}
                />
              </BoolRow>

              <AnimatePresence initial={false}>
                {data.runaway_vehicle === true && (
                  <motion.div
                    key="runaway-followups"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                    className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100"
                  >
                    <BoolRow label="Was the parking brake engaged?">
                      <YesNoToggle value={data.parking_brake_engaged} onChange={v => onUpdate({ parking_brake_engaged: v })} />
                    </BoolRow>
                    <BoolRow label="Was the operator in the vehicle when the bus ran away?">
                      <YesNoToggle
                        value={data.operator_in_vehicle_runaway === 'Operator in vehicle' ? true : data.operator_in_vehicle_runaway === 'Operator not in vehicle' ? false : undefined}
                        onChange={v => onUpdate({ operator_in_vehicle_runaway: v ? 'Operator in vehicle' : 'Operator not in vehicle' })}
                      />
                    </BoolRow>
                  </motion.div>
                )}
              </AnimatePresence>

              <BoolRow label="Was there visible bus damage at the scene?">
                <YesNoToggle value={data.bus_damage} onChange={v => onUpdate({ bus_damage: v, bus_damage_confirmed: v ? data.bus_damage_confirmed : undefined })} />
              </BoolRow>

              <AnimatePresence initial={false}>
                {data.bus_damage === true && (
                  <motion.div
                    key="damage-followup"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                    className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100"
                  >
                    <BoolRow label="Was the damage confirmed after inspection?">
                      <YesNoToggle value={data.bus_damage_confirmed} onChange={v => onUpdate({ bus_damage_confirmed: v })} />
                    </BoolRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {data.bus_damage === true && (
                <motion.div {...fade} key="impact-diagram" className="pt-1">
                  <VehicleImpactDiagram
                    markers={data.impact_markers || []}
                    onChange={markers => onUpdate({ impact_markers: markers })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </Section>

      {/* 3 — Where it happened: location + the conditions there */}
      <Section title="Where it happened" help="The location and the conditions there — where it was, and what the environment was like.">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Field label="Street on" required error={showErrors && !data.street_on}>
            <input type="text" value={data.street_on || ''} onChange={e => onUpdate({ street_on: e.target.value })} placeholder="e.g. Main St" className={inputCls} />
          </Field>
          <Field label="Cross street">
            <input type="text" value={data.cross_street || ''} onChange={e => onUpdate({ cross_street: e.target.value })} placeholder="e.g. Elm Ave" className={inputCls} />
          </Field>
          <Field label="City" required error={showErrors && !data.city}>
            <input type="text" value={data.city || ''} onChange={e => onUpdate({ city: e.target.value })} placeholder="e.g. Dallas" className={inputCls} />
          </Field>
          <Field label="ZIP code">
            <input type="text" maxLength={5} value={data.zip || ''} onChange={e => onUpdate({ zip: e.target.value })} placeholder="e.g. 75201" className={inputCls} />
          </Field>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Did the event occur at a bus stop?" required>
            <YesNoToggle
              value={data.event_at_bus_stop}
              onChange={v => onUpdate({ event_at_bus_stop: v, bus_stop_name: v ? data.bus_stop_name : undefined })}
            />
          </BoolRow>

          <AnimatePresence initial={false}>
            {data.event_at_bus_stop === true && (
              <motion.div
                key="stop-name"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100"
              >
                <BoolRow label="Name of the bus stop" required>
                  <div className="w-full sm:w-64">
                    <input type="text" value={data.bus_stop_name || ''} onChange={e => onUpdate({ bus_stop_name: e.target.value })} placeholder="Bus stop name" className={inputCls} />
                  </div>
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>

          <BoolRow label="Does the street have a designated bike lane?">
            <YesNoToggle value={data.has_bike_lane} onChange={v => onUpdate({ has_bike_lane: v })} />
          </BoolRow>
        </div>
      </Section>

      {/* 4 — Weather and conditions: the environment at the time of the event */}
      {!compactMode && (
        <Section title="Weather and conditions" help="The environment at the time of the event — visibility, road surface, and traffic conditions.">
          <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare />
        </Section>
      )}

    </div>
  );
}