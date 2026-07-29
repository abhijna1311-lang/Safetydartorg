import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { DatePickerInput } from '../../DatePickerInput';
import { TimePickerInput } from '../../TimePickerInput';
import { YesNoToggle } from '../../form/YesNoToggle';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  compactMode?: boolean;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
}

// ── option lists ──────────────────────────────────────────────────────────────
const BUS_STATUS_OPTIONS = [
  'In Service', 'Deadhead', 'Not In Service', 'Pull In', 'Pull Out',
  'In Yard/Bus Lot', 'Road Test', 'Tow', 'Service Protection',
  'Special Events', 'Non-Revenue Training',
].map(v => ({ value: v, label: v }));

const SHOWS_ROUTE = ['In Service', 'Pull In', 'Pull Out', 'Service Protection'];

const VEHICLE_DB = [
  { id: '2045', label: '2045', type: '40 ft Low Floor', route: 'Route 15' },
  { id: '3012', label: '3012', type: '60 ft Articulated', route: 'Route 22' },
  { id: '1523', label: '1523', type: '35 ft Standard', route: 'Route 10' },
  { id: '4089', label: '4089', type: '40 ft Hybrid', route: 'Route 201' },
  { id: '5201', label: '5201', type: '40 ft Low Floor', route: 'Route 5' },
];

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const inputCls = "dart-input-base";

function Field({ label, required, helper, error, children }: { label: string; required?: boolean; helper?: string; error?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={error ? 'rounded-[11px] ring-2 ring-red-400/70' : ''}>{children}</div>
      {error ? <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p> : helper ? <p className="mt-1 text-xs text-slate-500 font-['Poppins']">{helper}</p> : null}
    </div>
  );
}

function Card({ title, complete, children }: { title: string; complete?: boolean; children: React.ReactNode }) {
  return (
    <div className="dart-card dart-card--surface">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export function BasicIncidentSection({ data, onUpdate, compactMode = false, narrativeReadOnly = false, showErrors = false }: Props) {
  const isBusMode = data.mode === 'Bus' || data.mode === 'Non-Revenue Vehicle';

  const vehicleOptions: ComboboxOption[] = VEHICLE_DB.map(v => ({
    value: v.id, label: v.label, description: `${v.type} • ${v.route}`,
  }));

  const handleVehicleChange = (val: string) => {
    const v = VEHICLE_DB.find(x => x.id === val);
    onUpdate(v
      ? { vehicle_number: v.id, fleet_type: v.type, route_number: v.route }
      : { vehicle_number: val });
  };

  useEffect(() => {
    if (!SHOWS_ROUTE.includes(data.bus_status_before || '')) {
      if (data.route_number || data.run_number) {
        onUpdate({ route_number: undefined, run_number: undefined });
      }
    }
  }, [data.bus_status_before]);

  const showRouteRun = SHOWS_ROUTE.includes(data.bus_status_before || '');

  return (
    <div className="space-y-5">

      {/* Description — incident date & time now live on Step 1 */}
      <Card title="Event description" complete={!!(compactMode || data.description_of_event)}>
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
      </Card>

      {/* 3–6 – Vehicle (Bus/Non-Revenue only) */}
      {isBusMode && (
        <Card title="Vehicle details" complete={!!data.vehicle_number}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bus vehicle number" required>
              <SearchableCombobox
                options={vehicleOptions}
                value={data.vehicle_number || ''}
                onChange={handleVehicleChange}
                placeholder="Search vehicle #"
                searchPlaceholder="Type vehicle number..."
                emptyMessage="No vehicles found"
              />
              {data.fleet_type && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 font-['Poppins']">
                  <CheckCircle2 className="w-3 h-3" />
                  Fleet type auto-filled: {data.fleet_type}
                </div>
              )}
            </Field>

            <Field label="Fleet type">
              <input
                type="text"
                readOnly
                value={data.fleet_type || ''}
                placeholder="Auto-populated from vehicle"
                className={`${inputCls} bg-slate-50 cursor-not-allowed text-slate-500`}
              />
            </Field>

            {!compactMode && (
            <Field label="Trip ID">
              <input type="text" value={data.trip_id || ''} onChange={e => onUpdate({ trip_id: e.target.value })} placeholder="e.g. T-20451" className={inputCls} />
            </Field>
            )}

            <Field label="Block number">
              <input type="text" value={data.block_number || ''} onChange={e => onUpdate({ block_number: e.target.value })} placeholder="e.g. BLK-204" className={inputCls} />
            </Field>

            {!compactMode && (
            <Field label="Employee pull-out date">
              <DatePickerInput value={data.employee_pullout_date || ''} onChange={v => onUpdate({ employee_pullout_date: v })} />
            </Field>
            )}

            {!compactMode && (
            <Field label="Employee pull-out time">
              <TimePickerInput value={data.employee_pullout_time || ''} onChange={v => onUpdate({ employee_pullout_time: v })} />
            </Field>
            )}
          </div>
        </Card>
      )}

      {/* 7–9 – Location */}
      <Card title="Location" complete={!!(data.street_on && data.city)}>
        <Field label="Did the event occur at a bus stop?" required>
          <YesNoToggle
            value={data.event_at_bus_stop}
            onChange={v => onUpdate({ event_at_bus_stop: v, bus_stop_name: v ? data.bus_stop_name : undefined })}
          />
        </Field>

        <AnimatePresence>
          {data.event_at_bus_stop === true && (
            <motion.div {...fade} key="stop-name">
              <Field label="Name of the bus stop" required>
                <input type="text" value={data.bus_stop_name || ''} onChange={e => onUpdate({ bus_stop_name: e.target.value })} placeholder="Bus stop name" className={inputCls} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

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
      </Card>

      {/* 10–15 – Bus Status + Route (Bus/Non-Revenue only) */}
      {isBusMode && !compactMode && (
        <Card title="Bus status & route" complete={!!(data.bus_status_before && data.bus_status_after)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bus status before event" required>
              <CustomSelect value={data.bus_status_before || ''} onChange={v => onUpdate({ bus_status_before: v })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
            </Field>
            <Field label="Bus status after event" required>
              <CustomSelect value={data.bus_status_after || ''} onChange={v => onUpdate({ bus_status_after: v })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
            </Field>
          </div>

          <AnimatePresence>
            {showRouteRun && (
              <motion.div {...fade} key="route-run" className="grid grid-cols-2 gap-4">
                <Field label="Route number">
                  <input type="text" value={data.route_number || ''} onChange={e => onUpdate({ route_number: e.target.value })} placeholder="e.g. Route 12" className={inputCls} />
                </Field>
                <Field label="Run number">
                  <input type="text" value={data.run_number || ''} onChange={e => onUpdate({ run_number: e.target.value })} placeholder="e.g. Run 204" className={inputCls} />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            <Field label="End of line destination">
              <input type="text" value={data.end_of_line_destination || ''} onChange={e => onUpdate({ end_of_line_destination: e.target.value })} placeholder="e.g. Downtown" className={inputCls} />
            </Field>
            <div />
          </div>

          <Field label="Does the street have a designated bike lane?">
            <YesNoToggle value={data.has_bike_lane} onChange={v => onUpdate({ has_bike_lane: v })} />
          </Field>
        </Card>
      )}

      {/* Evacuation (for non-collision events) */}
      {!compactMode && (
      <Card title="Life safety" complete={data.evacuation_life_safety !== undefined}>
        <Field label="Did this event involve an evacuation for life safety reasons?">
          <YesNoToggle value={data.evacuation_life_safety} onChange={v => onUpdate({ evacuation_life_safety: v })} />
        </Field>
      </Card>
      )}

    </div>
  );
}
