import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { WeatherSection } from './WeatherSection';
import { ModeVehicleSection } from './ModeVehicleSection';
import { BUS_STOP_OPTIONS } from '../../../data/busStops';
import type { AccidentReportData } from '../../../types/accident-report';
import { AddressLocationFields } from '../../location/AddressLocationFields';
import { OPERATOR_LOCATION } from '../../location/locationFields';

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

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      {/* 1 — The vehicle: the selected mode always gets the canonical vehicle fields. */}
      <ModeVehicleSection
        data={data}
        onUpdate={onUpdate}
        showErrors={showErrors}
        vehicleNumberField={isHiRail ? 'train_number' : undefined}
        statusBeforeField={isHiRail ? 'train_status_before' : undefined}
        statusAfterField={isHiRail ? 'train_status_after' : undefined}
      />

      {/* 2 — What happened */}
      <Section title="What Happened" help="Describe the event in your own words — this narrative anchors the rest of the report.">
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
      <Section title="Where It Happened" help="The location and the conditions there — where it was, and what the environment was like.">
        <AddressLocationFields data={data} onUpdate={onUpdate} config={OPERATOR_LOCATION} showErrors={showErrors} />

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
        <Section title="Weather And Conditions" help="The environment at the time of the event — visibility, road surface, and traffic conditions.">
          <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
        </Section>
      )}

    </div>
  );
}
