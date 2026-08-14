import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { DatePickerInput } from '../../DatePickerInput';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { WeatherSection } from './WeatherSection';
import { ModeVehicleFields } from './ModeVehicleSection';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  narrativeReadOnly?: boolean;
  showErrors?: boolean;
  /** Schedule block injected above the sections (matches Bus/Rail/NRV flows). */
  headerSection?: React.ReactNode;
}

// ── option lists ──────────────────────────────────────────────────────────────
const toOptions = (values: string[]) => values.map(v => ({ value: v, label: v }));

// Signal Violation uses its own status list per spec — differs from LRVCollisionSection
// (adds "Special Events", uses "Pull In"/"Pull Out" casing).
const SIGNAL_TRAIN_STATUS_ALL = [
  'In Service', 'Deadhead', 'Not In Service', 'Pull In', 'Pull Out', 'Special Events', 'In Yard',
];
// Yard territory hides mainline-only statuses; Mainline hides In Yard.
const YARD_HIDE = new Set(['In Service', 'Deadhead', 'Pull Out', 'Special Events', 'Pull In']);
const MAINLINE_HIDE = new Set(['In Yard']);
const TERRITORY_OPTIONS = toOptions(['Mainline Territory', 'Yard Territory']);
const DISPLAY_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_observed', label: 'Not observed' },
];
// Line Description only appears when status-before is one of these.
const SHOWS_LINE = ['In Service', 'Pull In', 'Pull Out'];

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

// Spring for follow-up rows that glide in beside a toggle (matches Bus/Rail flows).
const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

const inputCls = 'dart-input-base';

// Same visual shell used by Bus/NRV/LRV/Derailment/Basic — one card, stacked sections.
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

export function SignalViolationSection({ data, onUpdate, narrativeReadOnly = false, showErrors = false, headerSection }: Props) {
  const isStreetcar = data.mode === 'Streetcar';
  const isHiRail = data.mode === 'Hi-Rail';

  // Territory drives which "before" statuses are selectable — clear the value if it's
  // no longer valid so a stale status doesn't sit hidden in the form.
  const territory = data.signal_territory;
  const filteredBefore = SIGNAL_TRAIN_STATUS_ALL.filter(s =>
    territory === 'Yard Territory' ? !YARD_HIDE.has(s)
    : territory === 'Mainline Territory' ? !MAINLINE_HIDE.has(s)
    : true,
  );
  const beforeOptions = toOptions(filteredBefore);
  const afterOptions = toOptions(SIGNAL_TRAIN_STATUS_ALL);

  const handleTerritoryChange = (val: string) => {
    const nextStatuses = SIGNAL_TRAIN_STATUS_ALL.filter(s =>
      val === 'Yard Territory' ? !YARD_HIDE.has(s)
      : val === 'Mainline Territory' ? !MAINLINE_HIDE.has(s)
      : true,
    );
    const beforeValid = !data.train_status_before || nextStatuses.includes(data.train_status_before);
    onUpdate({
      signal_territory: val as 'Mainline Territory' | 'Yard Territory',
      ...(beforeValid ? {} : { train_status_before: undefined }),
    });
  };

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      {/* 1 — The vehicle: the selected mode always gets the canonical vehicle fields. */}
      <Section title={isStreetcar ? 'The streetcar' : isHiRail ? 'The vehicle' : 'The train'} help="Select the vehicle involved in the event. Its assigned details are pulled in automatically.">
        <ModeVehicleFields
          data={data}
          onUpdate={onUpdate}
          showErrors={showErrors}
          statusBeforeField="train_status_before"
          statusAfterField="train_status_after"
          statusBeforeOptions={beforeOptions}
          statusAfterOptions={afterOptions}
          statusBeforeDisabled={!territory}
          statusBeforePlaceholder={territory ? 'Select status' : 'Select territory first'}
          vehicleNumberField={isHiRail ? 'train_number' : undefined}
          showRailLine={!isHiRail}
        />
      </Section>

      {/* 2 — The signal violation */}
      <Section title="The signal violation" help="Details about the signal, where it happened, and the vehicle's status before and after the event.">
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Date of signal violation" required error={showErrors && !data.signal_date}>
            <DatePickerInput value={data.signal_date || ''} onChange={v => onUpdate({ signal_date: v })} maxDate={new Date()} />
          </Field>
          <Field label="Signal number" required error={showErrors && !data.signal_number}>
            <input
              type="text"
              value={data.signal_number || ''}
              onChange={e => onUpdate({ signal_number: e.target.value })}
              placeholder="e.g. S-142"
              className={inputCls}
            />
          </Field>
          <Field label="Signal displaying properly" required error={showErrors && !data.signal_displaying_properly}>
            <CustomSelect
              value={data.signal_displaying_properly || ''}
              onChange={v => onUpdate({ signal_displaying_properly: v as 'yes' | 'no' | 'not_observed' })}
              options={DISPLAY_OPTIONS}
              placeholder="Select"
            />
          </Field>
          <Field label="Where did the signal violation happen" required error={showErrors && !data.signal_territory}>
            <CustomSelect
              value={data.signal_territory || ''}
              onChange={handleTerritoryChange}
              options={TERRITORY_OPTIONS}
              placeholder="Select territory"
            />
          </Field>
        </div>
      </Section>

      {/* 3 — What happened */}
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

        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Did this event involve an evacuation for life safety reasons?">
            <YesNoToggle value={data.evacuation_life_safety} onChange={v => onUpdate({ evacuation_life_safety: v })} />
          </BoolRow>
        </div>
      </Section>

      {/* 4 — Where it happened */}
      <Section title="Where it happened" help="The location and the conditions there — where the signal violation occurred.">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Field label="Address of event" required error={showErrors && !data.address_of_event}>
            <input
              type="text"
              value={data.address_of_event || ''}
              onChange={e => onUpdate({ address_of_event: e.target.value })}
              placeholder="e.g. Corinth Station platform, near switch S-142"
              className={inputCls}
            />
          </Field>
          <Field label="City">
            <input type="text" value={data.city || ''} onChange={e => onUpdate({ city: e.target.value })} placeholder="e.g. Dallas" className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* 5 — Weather and conditions */}
      <Section title="Weather and conditions" help="The environment at the time of the event — visibility, track surface, and traffic controls.">
        <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
      </Section>
    </div>
  );
}
