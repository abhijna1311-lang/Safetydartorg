import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { WeatherSection } from './WeatherSection';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
  headerSection?: React.ReactNode;
}

const toOptions = (values: string[]) => [...values]
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map(value => ({ value, label: value }));

const DERAILMENT_TYPES = toOptions(['Mainline', 'Yard']);
const MAINLINE_LOCATIONS = toOptions([
  'Revenue Facility: Transit Station',
  'Right-of-Way: Grade Crossing',
  'Right-of-Way: Trackway',
]);
const YARD_LOCATIONS = toOptions(['Non-Revenue Facility']);
const TRAIN_STATUS = toOptions([
  'Deadhead', 'In Service', 'In Yard', 'Not in Service', 'Pull-In', 'Pull-Out', 'Special Events',
]);
const SHOWS_LINE = ['In Service', 'Pull-In', 'Pull-Out'];
const RAIL_LINES = toOptions(['Blue', 'Green', 'Orange', 'Red']);
const TRAIN_ACTIONS = toOptions([
  'Going Straight',
  'Leaving a Transit Stop',
  'Making a Transit Stop',
  'Moving Through a Grade Crossing',
  'Negotiating a Curve',
  'Proceeding Through a Switch',
]);
const STATIONS = toOptions([
  'Akard', 'Baylor', 'Buckner', 'Cityplace/Uptown', 'DFW Airport', 'Downtown Carrollton',
  'Downtown Garland', 'Downtown Plano', 'Downtown Rowlett', 'Inwood/Love Field', 'Mockingbird',
  'Parker Road', 'Pearl/Arts District', 'St. Paul', 'UNT Dallas', 'Victory', 'West End', 'Westmoreland',
]);

const LRV_FLEET = [
  { id: 'T-2045', fleetType: 'KIN – Kinki Sharyo USA 1996', pulloutDate: '2026-07-24', pulloutTime: '05:10', cars: ['2101', '2102'] },
  { id: 'T-2088', fleetType: 'KIN – Kinki Sharyo USA 2005', pulloutDate: '2026-07-24', pulloutTime: '04:55', cars: ['2140'] },
  { id: 'T-3120', fleetType: 'KIN – Kinki Sharyo USA 2010', pulloutDate: '2026-07-24', pulloutTime: '06:02', cars: ['2201', '2202', '2203'] },
  { id: 'T-3345', fleetType: 'KIN – Kinki Sharyo USA 1999', pulloutDate: '2026-07-24', pulloutTime: '05:40', cars: ['2118', '2119'] },
];
const HI_RAIL_FLEET = [
  { id: 'HR-118', fleetType: 'Ford F-550 Hi-Rail Maintenance Truck', pulloutDate: '2026-07-24', pulloutTime: '05:15', cars: [] as string[] },
  { id: 'HR-224', fleetType: 'Freightliner Hi-Rail Service Truck', pulloutDate: '2026-07-24', pulloutTime: '05:35', cars: [] as string[] },
  { id: 'HR-307', fleetType: 'Ram 5500 Hi-Rail Inspection Truck', pulloutDate: '2026-07-24', pulloutTime: '06:05', cars: [] as string[] },
];

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};
const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;
const inputCls = 'dart-input-base';

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

function fmtDate(iso?: string) {
  if (!iso) return 'Not available';
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${month}/${day}/${year}` : iso;
}

function fmtTime(value?: string) {
  if (!value) return 'Not available';
  const [hour, minute = '00'] = value.split(':');
  const hour24 = Number(hour);
  if (Number.isNaN(hour24)) return value;
  return `${hour24 % 12 || 12}:${minute} ${hour24 >= 12 ? 'PM' : 'AM'}`;
}

export function DerailmentSection({ data, onUpdate, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const isLRV = data.mode === 'Light Rail Vehicle';
  const fleet = isLRV ? LRV_FLEET : HI_RAIL_FLEET;
  const selectedVehicle = fleet.find(vehicle => vehicle.id === data.train_number);
  const vehicleOptions: ComboboxOption[] = fleet.map(vehicle => ({
    value: vehicle.id,
    label: vehicle.id,
    description: vehicle.fleetType,
  }));
  const carOptions = toOptions(selectedVehicle?.cars || []);
  const locationOptions = data.derailment_type === 'Yard' ? YARD_LOCATIONS : MAINLINE_LOCATIONS;
  const showStation = data.location_category === 'Revenue Facility: Transit Station';
  const showGradeCrossing = data.location_category === 'Right-of-Way: Grade Crossing';
  const showLine = isLRV && SHOWS_LINE.includes(data.train_status_before || '');

  const handleVehicleChange = (value: string) => {
    const vehicle = fleet.find(item => item.id === value);
    const cars = vehicle?.cars || [];
    onUpdate({
      train_number: value,
      lrv_fleet_type: vehicle?.fleetType,
      train_pullout_date: vehicle?.pulloutDate,
      train_pullout_time: vehicle?.pulloutTime,
      lrv_consist_count: isLRV ? cars.length || undefined : undefined,
      lrv_consist_1: isLRV ? cars[0] : undefined,
      lrv_consist_2: isLRV ? cars[1] : undefined,
      lrv_consist_3: isLRV ? cars[2] : undefined,
      lrv_consist_4: isLRV ? cars[3] : undefined,
      car_number: undefined,
    });
  };

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}
      <Section title={isLRV ? 'The train' : 'The Hi-Rail vehicle'} help={`Select the ${isLRV ? 'train' : 'Hi-Rail vehicle'} number to pull its fleet and employee pull-out details.`}>
        {selectedVehicle && (
          <div className="dart-vehicle-strip">
            <div className="dart-vehicle-item">
              <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">tram</span></span>
              <div className="dart-vehicle-text"><span className="dart-vehicle-label">Fleet type</span><span className="dart-vehicle-value">{data.lrv_fleet_type || 'Not available'}</span></div>
            </div>
            <div className="dart-vehicle-item">
              <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">calendar_month</span></span>
              <div className="dart-vehicle-text"><span className="dart-vehicle-label">Employee pull-out date</span><span className="dart-vehicle-value dart-tabular">{fmtDate(data.train_pullout_date)}</span></div>
            </div>
            <div className="dart-vehicle-item">
              <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">schedule</span></span>
              <div className="dart-vehicle-text"><span className="dart-vehicle-label">Employee pull-out time</span><span className="dart-vehicle-value dart-tabular">{fmtTime(data.train_pullout_time)}</span></div>
            </div>
            {isLRV && (
              <div className="dart-vehicle-item">
                <span className="dart-vehicle-icon"><span className="material-symbols-rounded" aria-hidden="true">train</span></span>
                <div className="dart-vehicle-text"><span className="dart-vehicle-label">LRV consist</span><span className="dart-vehicle-value dart-tabular">{data.lrv_consist_count || 'Not available'}</span></div>
              </div>
            )}
          </div>
        )}

        <div className={`grid grid-cols-1 gap-4 ${isLRV ? 'sm:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
          <Field label={isLRV ? 'Train number' : 'Hi-Rail vehicle number'} required error={showErrors && !data.train_number}>
            <SearchableCombobox options={vehicleOptions} value={data.train_number || ''} onChange={handleVehicleChange} placeholder={isLRV ? 'Search train #' : 'Search Hi-Rail #'} searchPlaceholder="Type vehicle number..." emptyMessage="No vehicles found" />
          </Field>
          {isLRV && (
            <Field label="Car number involved in event" required error={showErrors && !data.car_number}>
              <CustomSelect value={data.car_number || ''} onChange={value => onUpdate({ car_number: value })} options={carOptions} placeholder={selectedVehicle ? 'Select car' : 'Select vehicle first'} disabled={!selectedVehicle} />
            </Field>
          )}
          <Field label={isLRV ? 'Train status before event' : 'Status before event'} required>
            <CustomSelect value={data.train_status_before || ''} onChange={value => onUpdate({ train_status_before: value, ...(!SHOWS_LINE.includes(value) ? { rail_line: undefined } : {}) })} options={TRAIN_STATUS} placeholder="Select status" />
          </Field>
          <Field label={isLRV ? 'Train status after event' : 'Status after event'} required>
            <CustomSelect value={data.train_status_after || ''} onChange={value => onUpdate({ train_status_after: value })} options={TRAIN_STATUS} placeholder="Select status" />
          </Field>
        </div>

        <AnimatePresence>
          {showLine && (
            <motion.div {...fade} key="line" className="max-w-[360px]">
              <Field label="Line description" required>
                <CustomSelect value={data.rail_line || ''} onChange={value => onUpdate({ rail_line: value })} options={RAIL_LINES} placeholder="Select line" />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Derailment details" help="Describe the event and capture the train movement immediately before the derailment.">
        <Field label="Description of derailment" required error={showErrors && !narrativeReadOnly && !data.description_of_event} helper={narrativeReadOnly ? 'Operator-owned narrative is read-only in this section.' : undefined}>
          <textarea rows={4} value={data.description_of_event || ''} onChange={narrativeReadOnly ? undefined : event => onUpdate({ description_of_event: event.target.value })} readOnly={narrativeReadOnly} placeholder="Describe how the derailment occurred in your own words..." className={`${inputCls} resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`} />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Action of train" required>
            <CustomSelect value={data.train_action || ''} onChange={value => onUpdate({ train_action: value })} options={TRAIN_ACTIONS} placeholder="Select action" />
          </Field>
          <Field label="Train speed at time of event (mph)" required>
            <input type="number" min={0} max={90} value={data.train_speed || ''} onChange={event => onUpdate({ train_speed: event.target.value })} placeholder="Enter speed" className={inputCls} />
          </Field>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Was there train damage?" required>
            <YesNoToggle value={data.train_damage} onChange={value => onUpdate({ train_damage: value })} />
          </BoolRow>
          <BoolRow label="Did this event involve a runaway train?" required>
            <YesNoToggle value={data.runaway_train} onChange={value => onUpdate({ runaway_train: value, operator_in_train_runaway: value ? data.operator_in_train_runaway : undefined })} />
          </BoolRow>
          <AnimatePresence initial={false}>
            {data.runaway_train === true && (
              <motion.div key="runaway-followup" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: layoutSpring, opacity: { duration: 0.2 } }} className="overflow-hidden bg-slate-50/60">
                <BoolRow label="Was the operator in the vehicle when the train ran away?" required>
                  <YesNoToggle value={data.operator_in_train_runaway === 'Operator in vehicle' ? true : data.operator_in_train_runaway === 'Operator not in vehicle' ? false : undefined} onChange={value => onUpdate({ operator_in_train_runaway: value ? 'Operator in vehicle' : 'Operator not in vehicle' })} />
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>
          <BoolRow label="Did this event involve an evacuation for life safety reasons or evacuation to the right-of-way?" required>
            <YesNoToggle value={data.lrv_evacuation} onChange={value => onUpdate({ lrv_evacuation: value })} />
          </BoolRow>
        </div>
      </Section>

      <Section title="Where it happened" help="The derailment type limits the location choices to the places that apply.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Derailment type" required error={showErrors && !data.derailment_type}>
            <CustomSelect value={data.derailment_type || ''} onChange={value => onUpdate({ derailment_type: value as AccidentReportData['derailment_type'], location_category: undefined, station_applicable: undefined, grade_crossing_applicable: undefined })} options={DERAILMENT_TYPES} placeholder="Select derailment type" />
          </Field>
          <Field label="Location of derailment" required error={showErrors && !!data.derailment_type && !data.location_category}>
            <CustomSelect value={data.location_category || ''} onChange={value => onUpdate({ location_category: value, station_applicable: undefined, grade_crossing_applicable: undefined })} options={locationOptions} placeholder={data.derailment_type ? 'Select location' : 'Select derailment type first'} disabled={!data.derailment_type} />
          </Field>
        </div>
        <AnimatePresence mode="popLayout">
          {showStation && (
            <motion.div {...fade} key="station">
              <Field label="Station" required><CustomSelect value={data.station_applicable || ''} onChange={value => onUpdate({ station_applicable: value })} options={STATIONS} placeholder="Select station" /></Field>
            </motion.div>
          )}
          {showGradeCrossing && (
            <motion.div {...fade} key="grade-crossing">
              <Field label="Grade crossing" required><input value={data.grade_crossing_applicable || ''} onChange={event => onUpdate({ grade_crossing_applicable: event.target.value })} placeholder="Enter grade crossing" className={inputCls} /></Field>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Weather and conditions" help="The environment and track conditions at the time of the derailment.">
        <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
      </Section>
    </div>
  );
}
