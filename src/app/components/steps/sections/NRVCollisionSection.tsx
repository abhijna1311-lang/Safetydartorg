import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { VehicleImpactDiagram } from '../../VehicleImpactDiagram';
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
  .map(v => ({ value: v, label: v }));

const EVENT_TYPE_WITH = toOptions([
  'Collision – with Auto', 'Collision – with Pedestrian',
  'Collision – with Fixed Object', 'Collision – with Non-Fixed Object',
  'Collision – with Animal',
]);

const NRV_ACTIONS = toOptions([
  'Moving Straight', 'Rolling Forward', 'Rolling Backward', 'Reversing',
  'Stopping', 'Stopped', 'Parked', 'Turning Left', 'Turning Right',
  'Completion of Left Turn', 'Completion of Right Turn', 'U-Turn',
  'Changing Lanes', 'Moving Left to Right', 'Moving Right to Left',
  'Passing Left', 'Passing Right', 'Merging Left', 'Merging Right',
  'Moving into Bus Stop/Train Station', 'Leaving Bus Stop', 'Moving to Curb',
  'Moving from Curb', 'Moving into Terminus', 'Leaving Terminus',
  'Moving in Traffic Circle', 'Moving on Left Bend', 'Moving on Right Bend',
]);

// Prototype NRV roster. Production values will come from the fleet system.
const NRV_FLEET = [
  { id: 'NRV-104', type: 'Ford Transit Support Van', pulloutDate: '2026-07-24', pulloutTime: '05:20' },
  { id: 'NRV-218', type: 'Chevrolet Silverado Service Truck', pulloutDate: '2026-07-24', pulloutTime: '05:45' },
  { id: 'NRV-327', type: 'Ford Explorer Supervisor Vehicle', pulloutDate: '2026-07-24', pulloutTime: '06:10' },
  { id: 'NRV-442', type: 'Ram ProMaster Maintenance Van', pulloutDate: '2026-07-24', pulloutTime: '04:50' },
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

function NRVRecordCard({ data }: { data: AccidentReportData }) {
  const cols = [
    { label: 'Vehicle type', value: data.fleet_type, glyph: 'directions_car' },
    { label: 'Pull-out date', value: fmtDate(data.employee_pullout_date), glyph: 'calendar_month' },
    { label: 'Pull-out time', value: fmtTime(data.employee_pullout_time), glyph: 'schedule' },
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

export function NRVCollisionSection({ data, onUpdate, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const vehicleOptions: ComboboxOption[] = [...NRV_FLEET]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(v => ({ value: v.id, label: v.id, description: v.type }));
  const selectedVehicle = NRV_FLEET.find(v => v.id === data.vehicle_number);

  const handleVehicleChange = (val: string) => {
    const vehicle = NRV_FLEET.find(v => v.id === val);
    onUpdate({
      vehicle_number: val,
      fleet_type: vehicle?.type,
      employee_pullout_date: vehicle?.pulloutDate,
      employee_pullout_time: vehicle?.pulloutTime,
    });
  };

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}
      <Section title="The NRV" help="Enter the NRV number — its vehicle type and pull-out details are pulled in automatically.">
        <AnimatePresence>
          {selectedVehicle && (
            <motion.div {...fade} key="nrv-record">
              <NRVRecordCard data={data} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: selectedVehicle ? 26 : undefined }} className="max-w-xl">
          <Field label="NRV number" required error={showErrors && !data.vehicle_number}>
            <SearchableCombobox
              options={vehicleOptions}
              value={data.vehicle_number || ''}
              onChange={handleVehicleChange}
              placeholder="Search NRV #"
              searchPlaceholder="Type NRV number..."
              emptyMessage="No NRVs found"
            />
          </Field>
        </div>
      </Section>

      <Section title="What happened" help="Describe the collision, the NRV's movement, and any damage or runaway event.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Event type with" required>
            <CustomSelect value={data.collision_type || ''} onChange={v => onUpdate({ collision_type: v })} options={EVENT_TYPE_WITH} placeholder="Select collision type" />
          </Field>
          <Field label="NRV action at time of event" required>
            <CustomSelect value={data.bus_action || ''} onChange={v => onUpdate({ bus_action: v })} options={NRV_ACTIONS} placeholder="Select action" />
          </Field>
          <Field label="NRV speed at time of event (mph)" required>
            <input type="number" min={0} max={90} value={data.bus_speed || ''} onChange={e => onUpdate({ bus_speed: e.target.value })} placeholder="Enter speed" className={inputCls} />
          </Field>
        </div>

        <Field label="Description of event" required error={showErrors && !narrativeReadOnly && !data.description_of_event} helper={narrativeReadOnly ? 'Operator-owned narrative is read-only in this section.' : undefined}>
          <textarea
            rows={4}
            value={data.description_of_event || ''}
            onChange={narrativeReadOnly ? undefined : e => onUpdate({ description_of_event: e.target.value })}
            placeholder="Describe what happened in your own words..."
            readOnly={narrativeReadOnly}
            className={`${inputCls} resize-none ${narrativeReadOnly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}`}
          />
        </Field>

        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Did this event involve a runaway NRV?" required>
            <YesNoToggle
              value={data.runaway_vehicle}
              onChange={v => onUpdate({ runaway_vehicle: v, operator_in_vehicle_runaway: undefined })}
            />
          </BoolRow>

          <AnimatePresence initial={false}>
            {data.runaway_vehicle === true && (
              <motion.div
                key="runaway-followup"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100"
              >
                <BoolRow label="Was the operator in the vehicle when the NRV ran away?" required>
                  <YesNoToggle
                    value={data.operator_in_vehicle_runaway === 'Operator in vehicle' ? true : data.operator_in_vehicle_runaway === 'Operator not in vehicle' ? false : undefined}
                    onChange={v => onUpdate({ operator_in_vehicle_runaway: v ? 'Operator in vehicle' : 'Operator not in vehicle' })}
                  />
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>

          <BoolRow label="Was there NRV damage?" required>
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
                <BoolRow label="Was there any disabling damage to the vehicle?" required>
                  <YesNoToggle value={data.bus_damage_confirmed} onChange={v => onUpdate({ bus_damage_confirmed: v })} />
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {data.bus_damage === true && (
            <motion.div {...fade} key="impact-diagram" className="pt-1">
              <VehicleImpactDiagram variant="nrv" markers={data.impact_markers || []} onChange={markers => onUpdate({ impact_markers: markers })} />
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Where it happened" help="Record the street address where the NRV collision occurred.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Field label="Street address" required error={showErrors && !data.street_on}>
              <input type="text" value={data.street_on || ''} onChange={e => onUpdate({ street_on: e.target.value })} placeholder="Enter street address" className={inputCls} />
            </Field>
          </div>
          <Field label="City" required>
            <input type="text" value={data.city || ''} onChange={e => onUpdate({ city: e.target.value })} placeholder="Enter city" className={inputCls} />
          </Field>
          <Field label="ZIP code" required>
            <input type="text" inputMode="numeric" maxLength={5} value={data.zip || ''} onChange={e => onUpdate({ zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="e.g. 75201" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Weather and conditions" help="The environment at the time of the event — visibility, road surface, and traffic conditions.">
        <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
      </Section>
    </div>
  );
}
