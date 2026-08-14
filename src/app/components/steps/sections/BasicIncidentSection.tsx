import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { WeatherSection } from './WeatherSection';
import { BusVehicleFields } from './BusCollisionSection';
import { NRV_FLEET, NRVRecordCard } from './NRVCollisionSection';
import { TRAIN_FLEET, STREETCAR_FLEET } from './LRVCollisionSection';
import { HI_RAIL_FLEET } from './DerailmentSection';
import { RailVehicleFields } from './RailVehicleFields';
import { OperatorNonRailVehicleFields } from './OperatorNonRailVehicleFields';
import { BUS_STOP_OPTIONS } from '../../../data/busStops';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  compactMode?: boolean;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
  /** Schedule block injected above the sections (matches Bus/Rail/NRV flows). */
  headerSection?: React.ReactNode;
}

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

// Spring for follow-up rows that glide in beside a toggle (matches Bus/Rail flows).
const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

const inputCls = 'dart-input-base';

// Same visual shell used by Bus/NRV/LRV/Derailment so every mode Step 2 renders under one card.
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

// Stacked yes/no (or short-select) question — label left, control right.
function BoolRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function BasicIncidentSection({ data, onUpdate, compactMode = false, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const isBus = data.mode === 'Bus';
  const isNRV = data.mode === 'Non-Revenue Vehicle';
  const isLRV = data.mode === 'Light Rail Vehicle';
  const isStreetcar = data.mode === 'Streetcar';
  const isHiRail = data.mode === 'Hi-Rail';
  const isRailLike = isLRV || isStreetcar;

  // NRV — mirrors NRVCollisionSection's "The NRV" section.
  const nrvOptions: ComboboxOption[] = [...NRV_FLEET]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(v => ({ value: v.id, label: v.id, description: v.type }));
  const selectedNRV = NRV_FLEET.find(v => v.id === data.vehicle_number);
  const handleNRVChange = (val: string) => {
    const v = NRV_FLEET.find(x => x.id === val);
    onUpdate({
      vehicle_number: val,
      fleet_type: v?.type,
      employee_pullout_date: v?.pulloutDate,
      employee_pullout_time: v?.pulloutTime,
    });
  };

  // Rail / Streetcar — mirrors LRVCollisionSection's "The train" / "The streetcar" section.
  const trainFleet = isStreetcar ? STREETCAR_FLEET : TRAIN_FLEET;
  const trainOptions: ComboboxOption[] = [...trainFleet]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(t => ({ value: t.id, label: t.id, description: t.fleetType }));
  const selectedTrain = trainFleet.find(t => t.id === data.train_number);
  const streetcarCars = selectedTrain?.cars ?? [];
  const carOptions = [...streetcarCars]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(c => ({ value: c, label: c }));
  // Streetcar still gates on car number; LRV shows the record once a train is picked (consist entered manually).
  const hasTrainRecord = !!(selectedTrain && (isStreetcar ? data.car_number : true));
  const consistCount = data.lrv_consist_count ?? 0;

  const handleTrainChange = (val: string) => {
    const t = trainFleet.find(x => x.id === val);
    const cars = t?.cars ?? [];
    onUpdate({
      train_number: val,
      lrv_fleet_type: t?.fleetType,
      rail_line: t?.railLine,
      lrv_end_of_line: t?.endOfLine,
      train_pullout_date: t?.pulloutDate,
      train_pullout_time: t?.pulloutTime,
      lrv_consist_count: isStreetcar ? undefined : data.lrv_consist_count,
      lrv_consist_1: isStreetcar ? undefined : data.lrv_consist_1,
      lrv_consist_2: isStreetcar ? undefined : data.lrv_consist_2,
      lrv_consist_3: isStreetcar ? undefined : data.lrv_consist_3,
      lrv_consist_4: isStreetcar ? undefined : data.lrv_consist_4,
      car_number: isStreetcar ? cars[0] : undefined,
    });
  };

  // Hi-Rail — mirrors DerailmentSection's "The Hi-Rail vehicle" section.
  const hiRailOptions: ComboboxOption[] = HI_RAIL_FLEET.map(v => ({
    value: v.id, label: v.id, description: v.fleetType,
  }));
  const selectedHiRail = HI_RAIL_FLEET.find(v => v.id === data.train_number);
  const handleHiRailChange = (val: string) => {
    const v = HI_RAIL_FLEET.find(x => x.id === val);
    onUpdate({
      train_number: val,
      lrv_fleet_type: v?.fleetType,
      train_pullout_date: v?.pulloutDate,
      train_pullout_time: v?.pulloutTime,
      car_number: undefined,
    });
  };

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      {/* 1 — The vehicle: mode-specific identity section. Each mode mirrors the fields its
          collision/derailment section captures so the vehicle experience feels the same. */}
      {isBus && (
        <Section title="The vehicle" help="Enter the bus number and Block ID — the route and the vehicle's assigned details are pulled in automatically.">
          <BusVehicleFields data={data} onUpdate={onUpdate} showErrors={showErrors} />
        </Section>
      )}

      {isNRV && (
        <Section title="The NRV" help="Enter the NRV number — its vehicle type and pull-out details are pulled in automatically.">
          <OperatorNonRailVehicleFields data={data} onUpdate={onUpdate} fleet={NRV_FLEET} label="NRV number" placeholder="Search NRV #" showErrors={showErrors} />
        </Section>
      )}

      {isRailLike && (
        <Section title={isStreetcar ? 'The streetcar' : 'The train'} help={`Enter the ${isStreetcar ? 'streetcar' : 'train'} number — its assigned fleet, line and schedule are pulled in automatically.`}>
          <RailVehicleFields data={data} onUpdate={onUpdate} showErrors={showErrors} showRailLine />
        </Section>
      )}

      {isHiRail && (
        <Section title="The NRV vehicle" help="Enter the NRV number — its fleet type and pull-out details are pulled in automatically.">
          <OperatorNonRailVehicleFields data={data} onUpdate={onUpdate} fleet={HI_RAIL_FLEET} numberField="train_number" label="NRV number" placeholder="Search NRV #" showErrors={showErrors} typeLabel="Fleet type" icon="local_shipping" />
        </Section>
      )}

      {/* 2 — What happened */}
      <Section title="What happened" help="Describe the event in your own words — this narrative anchors the rest of the report.">
        <Field
          label="Description of event"
          required
          error={showErrors && !narrativeReadOnly && !data.description_of_event}
          helper={narrativeReadOnly ? 'Operator-owned narrative is read-only in this section.' : undefined}
        >
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
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="Did this event involve an evacuation for life safety reasons?">
              <YesNoToggle value={data.evacuation_life_safety} onChange={v => onUpdate({ evacuation_life_safety: v })} />
            </BoolRow>
          </div>
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

          {isBus && !compactMode && (
            <BoolRow label="Does the street have a designated bike lane?">
              <YesNoToggle value={data.has_bike_lane} onChange={v => onUpdate({ has_bike_lane: v })} />
            </BoolRow>
          )}
        </div>
      </Section>

      {/* 5 — Weather and conditions: the environment at the time of the event */}
      {!compactMode && (
        <Section title="Weather and conditions" help="The environment at the time of the event — visibility, road surface, and traffic conditions.">
          <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
        </Section>
      )}

    </div>
  );
}
