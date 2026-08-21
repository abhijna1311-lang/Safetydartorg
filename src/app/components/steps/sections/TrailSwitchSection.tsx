import { useEffect } from 'react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { ModeVehicleFields } from './ModeVehicleSection';
import { TRAIN_STATUS_OPTIONS } from './RailVehicleFields';
import { WeatherSection } from './WeatherSection';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  showErrors?: boolean;
  headerSection?: React.ReactNode;
  narrativeReadOnly?: boolean;
}

const inputCls = 'dart-input-base';
const SWITCH_OPTIONS = ['Interlocking', 'Crossover', 'Yard Switch'].map(value => ({ value, label: value }));
const LOCATION_OPTIONS = ['Mainline', 'Yard', 'Rail Station', 'Grade Crossing', 'Bridge', 'Tunnel', 'Other'].map(value => ({ value, label: value }));
const ACTION_OPTIONS = ['Going straight', 'In a curve'].map(value => ({ value, label: value }));

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">{title}</h3>
        {help && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 font-['Poppins']">{help}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">
        {label}{required && <span className="dart-req ml-1">*</span>}
      </label>
      <div className={error ? 'dart-field-error' : ''}>{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p>}
    </div>
  );
}

function InlineField({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3 ${error ? 'bg-red-50/50' : ''}`}>
      <p className={`dart-field-label sm:flex-1 ${error ? 'text-red-600' : ''}`} style={{ marginBottom: 0 }}>
        {label}{required && <span className="dart-req ml-1">*</span>}
      </p>
      <div className={`w-full shrink-0 sm:w-60 ${error ? 'dart-field-error' : ''}`}>
        {children}
        {error && <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p>}
      </div>
    </div>
  );
}

export function TrailSwitchSection({ data, onUpdate, showErrors = false, headerSection, narrativeReadOnly = false }: Props) {
  const isLRV = data.mode === 'Light Rail Vehicle';
  const isStreetcar = data.mode === 'Streetcar';
  const isHiRail = data.mode === 'Hi-Rail';
  const pulloutDate = data.employee_pullout_date || data.train_pullout_date || '';
  const pulloutTime = data.employee_pullout_time || data.train_pullout_time || '';
  const carNumber = data.trail_car_number || data.car_number || '';

  useEffect(() => {
    const updates: Partial<AccidentReportData> = {};
    if (isLRV && data.trail_line_description !== data.rail_line) updates.trail_line_description = data.rail_line || undefined;
    if (isStreetcar && data.trail_line_description !== 'Streetcar') updates.trail_line_description = 'Streetcar';
    if (isStreetcar && !data.trail_car_number && data.car_number) updates.trail_car_number = data.car_number;
    if (data.trail_employee_pullout_date !== pulloutDate) updates.trail_employee_pullout_date = pulloutDate || undefined;
    if (data.trail_employee_pullout_time !== pulloutTime) updates.trail_employee_pullout_time = pulloutTime || undefined;
    if (Object.keys(updates).length > 0) onUpdate(updates);
  }, [data.car_number, data.employee_pullout_date, data.employee_pullout_time, data.rail_line, data.train_pullout_date, data.train_pullout_time, data.trail_employee_pullout_date, data.trail_employee_pullout_time, data.trail_line_description, isLRV, isStreetcar, onUpdate, pulloutDate, pulloutTime]);

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {headerSection}

      <Section title="Vehicle" help="Select the vehicle involved. Fleet and pullout details are filled from the roster when available.">
        <ModeVehicleFields
          data={data}
          onUpdate={onUpdate}
          showErrors={showErrors}
          showStatusFields
          showRailLine={isLRV}
          showLrvConsist={isLRV}
          statusBeforeOptions={isHiRail ? undefined : TRAIN_STATUS_OPTIONS}
          statusAfterOptions={isHiRail ? undefined : TRAIN_STATUS_OPTIONS}
          requiredVehicleNumber
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {isStreetcar && (
            <Field label="Car number" required error={showErrors && !carNumber}>
              <input
                type="text"
                value={carNumber}
                onChange={event => onUpdate({ trail_car_number: event.target.value })}
                placeholder="Enter car number"
                className={inputCls}
                readOnly={!!data.car_number}
              />
            </Field>
          )}
          {isStreetcar && (
            <Field label="Line description" required>
              <input type="text" value="Streetcar" className={inputCls} readOnly />
            </Field>
          )}
        </div>

      </Section>

      <Section title="What Happened" help="Describe the Trail a Switch event and capture the operating details at the time.">
        <Field label="Description of event" required error={showErrors && !data.trail_description?.trim()}>
          <textarea
            value={data.trail_description || ''}
            onChange={event => onUpdate({ trail_description: event.target.value })}
            placeholder="Describe what happened"
            className={`${inputCls} min-h-[108px] resize-y py-3`}
            readOnly={narrativeReadOnly}
          />
        </Field>

        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <InlineField label="Train speed" required error={showErrors && !data.trail_train_speed?.trim()}>
            <input type="text" value={data.trail_train_speed || ''} onChange={event => onUpdate({ trail_train_speed: event.target.value })} placeholder="Enter speed" className={inputCls} />
          </InlineField>
          <InlineField label="Train damage" required error={showErrors && data.trail_train_damage === undefined}>
            <YesNoToggle value={data.trail_train_damage} onChange={value => onUpdate({ trail_train_damage: value })} />
          </InlineField>
          <InlineField label="Action of train" required error={showErrors && !data.trail_train_action}>
            <CustomSelect value={data.trail_train_action || ''} onChange={value => onUpdate({ trail_train_action: value })} options={ACTION_OPTIONS} placeholder="Select action" />
          </InlineField>
        </div>

      </Section>

      <Section title="Where It Happened" help="Record the switch location and the conditions at the time of the Trail a Switch event.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Street On" required error={showErrors && !data.street_on?.trim()}>
            <input type="text" value={data.street_on || ''} onChange={event => onUpdate({ street_on: event.target.value })} placeholder="e.g. Main St" className={inputCls} />
          </Field>
          <Field label="Cross Street" required error={showErrors && !data.cross_street?.trim()}>
            <input type="text" value={data.cross_street || ''} onChange={event => onUpdate({ cross_street: event.target.value })} placeholder="e.g. Elm Ave" className={inputCls} />
          </Field>
          <Field label="City" required error={showErrors && !data.city?.trim()}>
            <input type="text" value={data.city || ''} onChange={event => onUpdate({ city: event.target.value })} placeholder="e.g. Dallas" className={inputCls} />
          </Field>
          <Field label="ZIP Code" required error={showErrors && !data.zip?.trim()}>
            <input type="text" inputMode="numeric" maxLength={5} value={data.zip || ''} onChange={event => onUpdate({ zip: event.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="e.g. 75201" className={inputCls} />
          </Field>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <InlineField label="Location of Trail a Switch event" required error={showErrors && !data.trail_location_category}>
            <CustomSelect value={data.trail_location_category || ''} onChange={value => onUpdate({ trail_location_category: value })} options={LOCATION_OPTIONS} placeholder="Select location" />
          </InlineField>
          <InlineField label="Switch configuration" required error={showErrors && !data.trail_switch_configuration}>
            <CustomSelect value={data.trail_switch_configuration || ''} onChange={value => onUpdate({ trail_switch_configuration: value as AccidentReportData['trail_switch_configuration'], trail_switch_number: undefined })} options={SWITCH_OPTIONS} placeholder="Select configuration" />
          </InlineField>
          <InlineField label="Do you know the switch number?" required error={showErrors && data.trail_switch_number_known === undefined}>
            <YesNoToggle value={data.trail_switch_number_known} onChange={value => onUpdate({ trail_switch_number_known: value, trail_switch_number: value ? data.trail_switch_number : undefined })} />
          </InlineField>
          {data.trail_switch_number_known === true && (
            <InlineField label="What is the switch number?" required error={showErrors && !data.trail_switch_number?.trim()}>
              <input type="text" value={data.trail_switch_number || ''} onChange={event => onUpdate({ trail_switch_number: event.target.value })} placeholder="Enter switch number" className={inputCls} />
            </InlineField>
          )}
        </div>
      </Section>

      <Section title="Weather And Conditions" help="The environment and track conditions at the time of the Trail a Switch event.">
        <WeatherSection data={data} onUpdate={onUpdate} mode={data.mode} bare required showErrors={showErrors} />
      </Section>
    </div>
  );
}
