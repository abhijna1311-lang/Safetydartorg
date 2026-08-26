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
import { BUS_STOP_OPTIONS } from '../../../data/busStops';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  compactMode?: boolean;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
  headerSection?: React.ReactNode;
}

// ── option lists ──────────────────────────────────────────────────────────────
export const BUS_STATUS_OPTIONS = [
  ['In Service', 'Block + Route required'],
  ['Deadhead', 'Block + Route required'],
  ['Not In Service', 'No Block or Route'],
  ['Pull In', 'Block + Route required'],
  ['Pull Out', 'Block + Route required'],
  ['In Yard/Bus Lot', 'No Block or Route'],
  ['Road Test', 'No Block or Route'],
  ['Tow', 'No Block or Route'],
  ['Service Protection', 'Block + Route required'],
  ['Special Events', 'No Block or Route'],
  ['Non-Revenue Training', 'No Block or Route'],
  ['Bus Bridge', 'No Block or Route'],
  ['Shuttle', 'No Block or Route'],
].map(([value, group]) => ({ value, label: value, group }));
export const BUS_ROUTE_STATUSES = new Set(['In Service', 'Deadhead', 'Pull In', 'Pull Out', 'Service Protection']);

const EVENT_TYPE_WITH = [
  'Collision – with Auto', 'Collision – with Pedestrian',
  'Collision – with Fixed Object', 'Collision – with Non-Fixed Object',
  'Collision – with Animal',
].map(v => ({ value: v, label: v }));

export const DART_VEHICLE_ACTIONS = [
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
    { trip: 'T-0812', route: 'Route 8', endOfLine: 'Lakeview Terminal', blocks: [
      { block: 'BLK-108', pulloutDate: '2026-07-24', pulloutTime: '07:20' },
    ] },
    { trip: 'T-0311', route: 'Route 3', endOfLine: 'University Station', blocks: [
      { block: 'BLK-303', pulloutDate: '2026-07-24', pulloutTime: '05:45' },
    ] },
    { trip: 'T-4402', route: 'Route 44', endOfLine: 'South Park & Ride', blocks: [
      { block: 'BLK-444', pulloutDate: '2026-07-24', pulloutTime: '06:30' },
    ] },
    { trip: 'T-1901', route: 'Route 19', endOfLine: 'Fairgrounds Loop', blocks: [
      { block: 'BLK-190', pulloutDate: '2026-07-24', pulloutTime: '08:10' },
    ] },
  ] },
  { id: '3012', type: '60 ft Articulated', trips: [
    { trip: 'T-2231', route: 'Route 22', endOfLine: 'North Star Mall', blocks: [
      { block: 'BLK-322', pulloutDate: '2026-07-24', pulloutTime: '04:48' },
    ] },
    { trip: 'T-2232', route: 'Route 22', endOfLine: 'Medical Center', blocks: [
      { block: 'BLK-323', pulloutDate: '2026-07-24', pulloutTime: '15:10' },
    ] },
    { trip: 'T-3301', route: 'Route 33', endOfLine: 'Convention Center', blocks: [
      { block: 'BLK-330', pulloutDate: '2026-07-24', pulloutTime: '05:55' },
    ] },
    { trip: 'T-7702', route: 'Route 77', endOfLine: 'Airport', blocks: [
      { block: 'BLK-770', pulloutDate: '2026-07-24', pulloutTime: '06:15' },
    ] },
  ] },
  { id: '1523', type: '35 ft Standard', trips: [
    { trip: 'T-1012', route: 'Route 10', endOfLine: 'Medical Center', blocks: [
      { block: 'BLK-110', pulloutDate: '2026-07-24', pulloutTime: '05:30' },
    ] },
    { trip: 'T-2701', route: 'Route 27', endOfLine: 'Westside Transit Plaza', blocks: [
      { block: 'BLK-270', pulloutDate: '2026-07-24', pulloutTime: '06:40' },
    ] },
    { trip: 'T-5201', route: 'Route 52', endOfLine: 'Old Town Loop', blocks: [
      { block: 'BLK-520', pulloutDate: '2026-07-24', pulloutTime: '07:05' },
    ] },
  ] },
  { id: '4089', type: '40 ft Hybrid', trips: [
    { trip: 'T-2014', route: 'Route 201', endOfLine: 'Airport', blocks: [
      { block: 'BLK-420', pulloutDate: '2026-07-24', pulloutTime: '06:05' },
      { block: 'BLK-421', pulloutDate: '2026-07-24', pulloutTime: '14:22' },
    ] },
    { trip: 'T-0611', route: 'Route 6', endOfLine: 'Riverside Depot', blocks: [
      { block: 'BLK-606', pulloutDate: '2026-07-24', pulloutTime: '05:50' },
    ] },
    { trip: 'T-1104', route: 'Route 11', endOfLine: 'East End Terminal', blocks: [
      { block: 'BLK-111', pulloutDate: '2026-07-24', pulloutTime: '07:35' },
    ] },
  ] },
  { id: '5201', type: '40 ft Low Floor', trips: [
    { trip: 'T-0523', route: 'Route 5', endOfLine: 'Crossroads Station', blocks: [
      { block: 'BLK-205', pulloutDate: '2026-07-24', pulloutTime: '04:20' },
    ] },
    { trip: 'T-9101', route: 'Route 91', endOfLine: 'North Gate Transit', blocks: [
      { block: 'BLK-910', pulloutDate: '2026-07-24', pulloutTime: '05:15' },
    ] },
    { trip: 'T-1401', route: 'Route 14', endOfLine: 'Harbor District', blocks: [
      { block: 'BLK-140', pulloutDate: '2026-07-24', pulloutTime: '06:25' },
    ] },
    { trip: 'T-6602', route: 'Route 66', endOfLine: 'Stadium Loop', blocks: [
      { block: 'BLK-660', pulloutDate: '2026-07-24', pulloutTime: '07:50' },
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
export function VehicleRecordCard({ data, showRouteDetails = true }: { data: AccidentReportData; showRouteDetails?: boolean }) {
  const cols = [
    { label: 'Fleet type', value: data.fleet_type, glyph: 'directions_bus' },
    ...(showRouteDetails ? [{ label: 'Trip ID', value: data.trip_id, glyph: 'route' }] : []),
    { label: 'Pull-out date', value: fmtDate(data.employee_pullout_date), glyph: 'calendar_month' },
    { label: 'Pull-out time', value: fmtTime(data.employee_pullout_time), glyph: 'schedule' },
    ...(showRouteDetails ? [{ label: 'End of line destination', value: data.end_of_line_destination, glyph: 'flag' }] : []),
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

type BusStatusField = 'bus_status_before' | 'bus_status_after' | 'vehicle_status_before' | 'vehicle_status_after';

export function BusVehicleFields({
  data,
  onUpdate,
  showErrors = false,
  statusBeforeField = 'bus_status_before',
  statusAfterField = 'bus_status_after',
  statusOptions = BUS_STATUS_OPTIONS,
  showStatusFields = true,
  showVehicleDetails = true,
  showBlock = true,
  showVehicleRecordOnSelection = false,
  requiredVehicleNumber = true,
}: {
  data: AccidentReportData;
  onUpdate: (data: Partial<AccidentReportData>) => void;
  showErrors?: boolean;
  statusBeforeField?: BusStatusField;
  statusAfterField?: BusStatusField;
  statusOptions?: { value: string; label: string }[];
  showStatusFields?: boolean;
  showVehicleDetails?: boolean;
  showBlock?: boolean;
  showVehicleRecordOnSelection?: boolean;
  requiredVehicleNumber?: boolean;
}) {
  const vehicleOptions: ComboboxOption[] = FLEET.map(bus => ({ value: bus.id, label: bus.id, description: bus.type }));
  const selectedBus = FLEET.find(bus => bus.id === data.vehicle_number);
  const busBlocks = (selectedBus?.trips ?? []).flatMap(trip => trip.blocks.map(block => ({ ...block, trip })));
  const blockOptions = busBlocks
    .map(block => ({ value: block.block, label: block.block }))
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
  const hasVehicleRecord = !!data.vehicle_number && (showVehicleRecordOnSelection || !!(data.trip_id?.trim() && data.block_number?.trim()));
  const showRoute = BUS_ROUTE_STATUSES.has((data[statusBeforeField] as string) || '');

  const handleVehicleChange = (value: string) => {
    const bus = FLEET.find(item => item.id === value);
    const defaultAssignment = bus?.trips[0]?.blocks[0];
    onUpdate({
      vehicle_number: value,
      fleet_type: bus?.type,
      trip_id: undefined,
      route_number: undefined,
      end_of_line_destination: undefined,
      block_number: undefined,
      employee_pullout_date: defaultAssignment?.pulloutDate,
      employee_pullout_time: defaultAssignment?.pulloutTime,
    });
  };
  const handleBlockChange = (value: string) => {
    const match = busBlocks.find(block => block.block === value);
    onUpdate({
      block_number: value,
      trip_id: match?.trip.trip,
      route_number: match?.trip.route,
      end_of_line_destination: match?.trip.endOfLine,
      employee_pullout_date: match?.pulloutDate,
      employee_pullout_time: match?.pulloutTime,
    });
  };
  const handleStatusBeforeChange = (value: string) => {
    const match = busBlocks.find(block => block.block === data.block_number);
    onUpdate({
      [statusBeforeField]: value,
      ...(BUS_ROUTE_STATUSES.has(value)
        ? { route_number: match?.trip.route }
        : {
            trip_id: undefined,
            route_number: undefined,
            end_of_line_destination: undefined,
            block_number: undefined,
          }),
    } as Partial<AccidentReportData>);
  };

  return (
    <>
      <AnimatePresence>
        {showVehicleDetails && hasVehicleRecord && (
          <motion.div {...fade} key="bus-record">
            <VehicleRecordCard data={data} showRouteDetails={showBlock} />
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ marginTop: showVehicleDetails && hasVehicleRecord ? 26 : undefined }} className={showStatusFields ? 'grid grid-cols-1 gap-[18px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5' : showVehicleDetails ? 'grid grid-cols-1 gap-[18px] sm:grid-cols-2 md:grid-cols-3' : 'grid grid-cols-1 gap-[18px]'}>
        {showStatusFields && <Field label="Bus Status Before Event" required error={showErrors && !data[statusBeforeField]}>
          <CustomSelect value={(data[statusBeforeField] as string) || ''} onChange={handleStatusBeforeChange} options={statusOptions} placeholder="Select status" />
        </Field>}
        {showStatusFields && <Field label="Status after event" required error={showErrors && !data[statusAfterField]}>
          <CustomSelect value={(data[statusAfterField] as string) || ''} onChange={value => onUpdate({ [statusAfterField]: value } as Partial<AccidentReportData>)} options={statusOptions} placeholder="Select status" />
        </Field>}
        <Field label="Bus vehicle number" required={requiredVehicleNumber} error={showErrors && requiredVehicleNumber && !data.vehicle_number}>
          <SearchableCombobox options={vehicleOptions} value={data.vehicle_number || ''} onChange={handleVehicleChange} placeholder="Search vehicle #" searchPlaceholder="Type vehicle number..." emptyMessage="No vehicles found" />
        </Field>
        {showVehicleDetails && showBlock && <>
          <Field label="Block ID" required error={showErrors && !data.block_number}>
            <CustomSelect value={data.block_number || ''} onChange={handleBlockChange} options={blockOptions} placeholder={data.vehicle_number ? 'Select block' : 'Select bus first'} disabled={!data.vehicle_number} />
          </Field>
          {showRoute && <Field label="Route" required error={showErrors && !data.route_number}>
            <input type="text" value={data.route_number || ''} onChange={e => onUpdate({ route_number: e.target.value })} placeholder={data.block_number ? '—' : 'Auto-filled from block'} className="dart-input-base" />
          </Field>}
        </>}
      </div>
    </>
  );
}

export function BusCollisionSection({ data, onUpdate, compactMode = false, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  // Bus → Block → Route cascade: user picks bus + block, route auto-populates from the block's trip.
  const vehicleOptions: ComboboxOption[] = FLEET.map(f => ({
    value: f.id, label: f.id, description: f.type,
  }));
  const selectedBus = FLEET.find(f => f.id === data.vehicle_number);
  const busBlocks = (selectedBus?.trips ?? []).flatMap(t => t.blocks.map(b => ({ ...b, trip: t })));
  const blockOptions = busBlocks
    .map(b => ({ value: b.block, label: b.block }))
    .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));

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
  const handleBlockChange = (val: string) => {
    const match = busBlocks.find(b => b.block === val);
    onUpdate({
      block_number: val,
      trip_id: match?.trip.trip,
      route_number: match?.trip.route,
      end_of_line_destination: match?.trip.endOfLine,
      employee_pullout_date: match?.pulloutDate,
      employee_pullout_time: match?.pulloutTime,
    });
  };

  const hasVehicleRecord = !!(data.vehicle_number && data.trip_id?.trim() && data.block_number?.trim());
  const showScheduleFields = BUS_ROUTE_STATUSES.has(data.bus_status_before || '');

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      {/* 1 — The vehicle: bus number + Block ID drive the detail card; route can be adjusted when needed. */}
      <Section title="The Vehicle" help="Enter the bus number and Block ID — the route and the vehicle's assigned details are pulled in automatically. Adjust the route if needed.">
        <BusVehicleFields data={data} onUpdate={onUpdate} showErrors={showErrors} showBlock={showScheduleFields} showVehicleRecordOnSelection />
      </Section>

      {/* 2 — What happened: the narrative + mechanics of the collision */}
      <Section title="What Happened" help="One continuous account of the collision — the description, mechanics, impact, and any runaway or evacuation.">
        {!compactMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Field label="Event type with" required>
              <CustomSelect value={data.collision_type || ''} onChange={v => onUpdate({ collision_type: v })} options={EVENT_TYPE_WITH} placeholder="Select collision type" />
            </Field>
            <Field label="Bus action at time of event" required>
              <CustomSelect value={data.bus_action || ''} onChange={v => onUpdate({ bus_action: v })} options={DART_VEHICLE_ACTIONS} placeholder="Select action" />
            </Field>
            <Field label="Bus speed at time of event (mph)" required>
              <input type="number" min={0} max={90} value={data.bus_speed || ''} onChange={e => onUpdate({ bus_speed: e.target.value })} placeholder="Enter speed" className={inputCls} />
            </Field>
            <Field label="Point of impact" required>
              <CustomSelect value={data.point_of_impact || ''} onChange={v => onUpdate({ point_of_impact: v })} options={BUS_IMPACT} placeholder="Select impact point" />
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
              <BoolRow label="Did this event involve an evacuation for life safety reasons?" required>
                <YesNoToggle value={data.evacuation_life_safety} onChange={v => onUpdate({ evacuation_life_safety: v })} />
              </BoolRow>

              <BoolRow label="Did this event involve a runaway bus?" required>
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
                    <BoolRow label="Was the parking brake engaged?" required>
                      <YesNoToggle value={data.parking_brake_engaged} onChange={v => onUpdate({ parking_brake_engaged: v })} />
                    </BoolRow>
                    <BoolRow label="Was the operator in the vehicle when the bus ran away?" required>
                      <YesNoToggle
                        value={data.operator_in_vehicle_runaway === 'Operator in vehicle' ? true : data.operator_in_vehicle_runaway === 'Operator not in vehicle' ? false : undefined}
                        onChange={v => onUpdate({ operator_in_vehicle_runaway: v ? 'Operator in vehicle' : 'Operator not in vehicle' })}
                      />
                    </BoolRow>
                  </motion.div>
                )}
              </AnimatePresence>

              <BoolRow label="Was there damage to this vehicle?" required>
                <YesNoToggle
                  value={data.bus_damage}
                  onChange={v => onUpdate({ bus_damage: v, impact_markers: v ? data.impact_markers : [] })}
                />
              </BoolRow>
            </div>

            <AnimatePresence initial={false}>
              {data.bus_damage === true && (
                <motion.div
                  key="bus-impact-diagram"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                  className="overflow-hidden"
                >
                  <div className="pt-3">
                    <VehicleImpactDiagram
                      markers={data.impact_markers || []}
                      onChange={markers => onUpdate({ impact_markers: markers })}
                      showError={showErrors && (data.impact_markers?.length || 0) === 0}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </Section>

      {/* 3 — Where it happened: location + the conditions there */}
      <Section title="Where It Happened" help="The location and the conditions there — where it was, and what the environment was like.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Street On" required error={showErrors && !data.street_on}>
            <input type="text" value={data.street_on || ''} onChange={e => onUpdate({ street_on: e.target.value })} placeholder="e.g. Main St" className={inputCls} />
          </Field>
          <Field label="Cross Street" required error={showErrors && !data.cross_street}>
            <input type="text" value={data.cross_street || ''} onChange={e => onUpdate({ cross_street: e.target.value })} placeholder="e.g. Elm Ave" className={inputCls} />
          </Field>
          <Field label="City" required error={showErrors && !data.city}>
            <input type="text" value={data.city || ''} onChange={e => onUpdate({ city: e.target.value })} placeholder="e.g. Dallas" className={inputCls} />
          </Field>
          <Field label="ZIP Code" required error={showErrors && !data.zip}>
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
                    <SearchableCombobox
                      options={BUS_STOP_OPTIONS}
                      value={data.bus_stop_name || ''}
                      onChange={v => onUpdate({ bus_stop_name: v })}
                      placeholder="Select bus stop"
                      searchPlaceholder="Search bus stops…"
                      emptyMessage="No bus stops match…"
                    />
                  </div>
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>

          <BoolRow label="Does the street have a designated bike lane?" required>
            <YesNoToggle value={data.has_bike_lane} onChange={v => onUpdate({ has_bike_lane: v })} />
          </BoolRow>
        </div>
      </Section>

      {/* 4 — Weather and conditions: the environment at the time of the event */}
      {!compactMode && (
        <Section title="Weather And Conditions" help="The environment at the time of the event — visibility, road surface, and traffic conditions.">
          <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
        </Section>
      )}

    </div>
  );
}