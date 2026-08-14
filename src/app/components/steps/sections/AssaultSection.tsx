import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { SearchableCombobox, type ComboboxOption } from '../../SearchableCombobox';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { WeatherSection } from './WeatherSection';
import { ModeVehicleFields } from './ModeVehicleSection';
import type { AccidentReportData } from '../../../types/accident-report';
import {
  ASSAULT_LOCATIONS,
  getVehicle2TypeOptions,
  getVehicleStatusOptions,
  getVisibleAssaultFields,
  type AssaultFieldKey,
} from './assault/assaultFlow';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
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

const inputCls = 'dart-input-base';
const readonlyCls = 'dart-input-base bg-white/70 cursor-not-allowed text-slate-500';
const VEHICLE_EQUIPMENT_OPTIONS = [
  'Operator Area Protective Barrier Only',
  'Camera Only',
  'Operator Area Protective Barrier and Camera',
  'Neither',
].map((value) => ({ value, label: value }));

// Same visual shell used by Bus/NRV/LRV/Derailment so Step 2 renders under one card.
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

// Stacked yes/no question — label left, control right (matches other flows).
function BoolRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Show({ when, children }: { when: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {when && (
        <motion.div key="field" {...fade}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// A labelled combobox row that mirrors the collision sections' vehicle pickers.
function ComboField({ label, required, error, errorText, options, value, onChange, placeholder, searchPlaceholder }: {
  label: string; required?: boolean; error?: boolean; errorText?: string;
  options: ComboboxOption[]; value: string; onChange: (v: string) => void;
  placeholder: string; searchPlaceholder: string;
}) {
  return (
    <div>
      <label className="dart-field-label">{label}{required && <span className="dart-req ml-1">*</span>}</label>
      <div className={error ? 'dart-field-error' : ''}>
        <SearchableCombobox options={options} value={value} onChange={onChange} placeholder={placeholder} searchPlaceholder={searchPlaceholder} emptyMessage="No vehicles found" />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{errorText || `${label} is required.`}</p>}
    </div>
  );
}

export function AssaultSection({ data, onUpdate, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const vis = useMemo(() => getVisibleAssaultFields({
    operating_dart_vehicle: data.operating_dart_vehicle,
    mode: data.mode,
    assault_type: data.assault_type,
    assault_involves: data.assault_involves,
    who_assaulted: data.who_assaulted,
    vehicle_status_before: data.vehicle_status_before,
    assault_location: data.assault_location,
    transit_vehicle_on: data.transit_vehicle_on,
    operator_injured: data.operator_injured,
  }), [
    data.operating_dart_vehicle, data.mode, data.assault_type, data.assault_involves,
    data.who_assaulted, data.vehicle_status_before, data.assault_location,
    data.transit_vehicle_on, data.operator_injured,
  ]);
  const show = (key: AssaultFieldKey) => vis.has(key);

  const isBus = data.mode === 'Bus';
  const isLRV = data.mode === 'Light Rail Vehicle';
  const isStreetcar = data.mode === 'Streetcar';
  const isNRV = data.mode === 'Non-Revenue Vehicle';
  const isHiRail = data.mode === 'Hi-Rail';
  const isRailLike = isLRV || isStreetcar;
  const notInPossession = data.operating_dart_vehicle === false;

  // Spec: Streetcar mode auto-fills Line Description to 'Streetcar' (read-only).
  useEffect(() => {
    if (isStreetcar && show('line_description') && data.line_description !== 'Streetcar') {
      onUpdate({ line_description: 'Streetcar' });
    }
  }, [isStreetcar, data.line_description, show, onUpdate]);

  const vehicleStatusOptions = getVehicleStatusOptions(data.mode).map((s) => ({ value: s.value, label: s.label }));
  const vehicle2TypeOptions = getVehicle2TypeOptions(data.vehicle2_is_dart_vehicle);

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      {/* ── The vehicle (only when operating a DART vehicle) ──────────── */}
      {!notInPossession && (
        <Section
          title={isStreetcar ? 'The streetcar' : isLRV ? 'The train' : 'The vehicle'}
          help={
            isBus ? 'Enter the bus number and Block ID — the route and pull-out details are pulled in automatically.'
            : isRailLike ? `Pick the ${isStreetcar ? 'streetcar' : 'LRV'} — the line and pull-out details are pulled in automatically.`
            : isNRV || isHiRail ? 'Enter the vehicle number — its assigned details are pulled in automatically.'
            : 'The DART vehicle involved in the event.'
          }
        >
          <ModeVehicleFields
            data={data}
            onUpdate={onUpdate}
            showErrors={showErrors}
            statusBeforeField="vehicle_status_before"
            statusAfterField="vehicle_status_after"
            statusBeforeOptions={vehicleStatusOptions}
            statusAfterOptions={vehicleStatusOptions}
            showRailLine={show('line_description')}
          />

          {(show('vehicle_equipped_with') || show('driver_window_assault')) && (
            <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
              {show('vehicle_equipped_with') && (
                <BoolRow label="DART vehicle equipped with">
                  <div className="w-full max-w-full sm:w-[320px]">
                    <CustomSelect value={data.vehicle_equipped_with || ''} onChange={(v) => onUpdate({ vehicle_equipped_with: v })} options={VEHICLE_EQUIPMENT_OPTIONS} placeholder="Select equipment" />
                  </div>
                </BoolRow>
              )}
              {show('driver_window_assault') && (
                <BoolRow label="Did the operator get assaulted through the driver's side window?" required>
                  <YesNoToggle value={data.driver_window_assault} onChange={(v) => onUpdate({ driver_window_assault: v })} />
                </BoolRow>
              )}
            </div>
          )}

        </Section>
      )}

      {/* ── Where it happened ─────────────────────────────────────────── */}
      <Section title="Where it happened" help="The location of the assault and the conditions there.">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[18px]">
          <Field label="Street on" required error={showErrors && !data.street_on}>
            <input type="text" value={data.street_on || ''} onChange={(e) => onUpdate({ street_on: e.target.value })} placeholder="Street the event occurred on" className={inputCls} />
          </Field>
          <Field label="Street at">
            <input type="text" value={data.cross_street || ''} onChange={(e) => onUpdate({ cross_street: e.target.value })} placeholder="Nearest cross street" className={inputCls} />
          </Field>
          <Field label="City" required error={showErrors && !data.city}>
            <input type="text" value={data.city || ''} onChange={(e) => onUpdate({ city: e.target.value })} placeholder="City" className={inputCls} />
          </Field>
          <Field label="ZIP code" required error={showErrors && !data.zip}>
            <input type="text" value={data.zip || ''} onChange={(e) => onUpdate({ zip: e.target.value })} placeholder="ZIP" className={inputCls} />
          </Field>
        </div>

        <Field label="Where did the assault take place?" required error={showErrors && !data.assault_location}>
          <CustomSelect value={data.assault_location || ''} onChange={(v) => onUpdate({ assault_location: v as AccidentReportData['assault_location'] })} options={ASSAULT_LOCATIONS.map((o) => ({ value: o.value, label: o.label }))} placeholder="Select" />
        </Field>

        {/* Not in possession, but assaulted while riding a transit vehicle */}
        <Show when={show('transit_vehicle_on')}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px]">
            <Field label="Which transit vehicle were you on?" required error={showErrors && !data.transit_vehicle_on}>
              <CustomSelect
                value={data.transit_vehicle_on || ''}
                onChange={(v) => onUpdate({ transit_vehicle_on: v })}
                options={[
                  { value: 'Bus', label: 'Bus' },
                  { value: 'Light Rail Vehicle', label: 'Light Rail Vehicle' },
                  { value: 'Streetcar', label: 'Streetcar' },
                  { value: 'Non-Revenue Vehicle', label: 'Non-Revenue vehicle' },
                  { value: 'Hi-Rail', label: '(Hi-Rail) On-Rail Mounted Maintenance Truck' },
                ]}
                placeholder="Select"
              />
            </Field>
            <Show when={show('transit_vehicle_number')}>
              <Field label="Transit vehicle number (if applicable)">
                <input type="text" value={data.transit_vehicle_number || ''} onChange={(e) => onUpdate({ transit_vehicle_number: e.target.value })} placeholder="Vehicle number" className={inputCls} />
              </Field>
            </Show>
            <Show when={show('transit_route_or_line')}>
              <Field label="Transit route or line (if applicable)">
                <input type="text" value={data.transit_route_or_line || ''} onChange={(e) => onUpdate({ transit_route_or_line: e.target.value })} placeholder="Route or line" className={inputCls} />
              </Field>
            </Show>
          </div>
        </Show>
      </Section>

      {/* ── The assault ───────────────────────────────────────────────── */}
      <Section title="The assault" help="What happened, what led to it, and who was involved.">
        <Field label="Description of assault" required error={showErrors && !data.assault_description?.trim()}>
          <textarea
            value={data.assault_description || ''}
            onChange={(e) => onUpdate({ assault_description: e.target.value })}
            placeholder="Describe what happened in your own words"
            readOnly={narrativeReadOnly}
            rows={4}
            className={inputCls}
          />
        </Field>

      </Section>

      {/* ── Weather and conditions (spec: weather/road/lighting/streetlights) ── */}
      <Section title="Weather and conditions" help="The environment at the time of the event — visibility and road or track surface.">
        <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} assaultOnly />
      </Section>
    </div>
  );
}
