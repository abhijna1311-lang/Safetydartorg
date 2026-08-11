import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from './CustomSelect';
import { MultiSelect } from './MultiSelect';
import { YesNoToggle } from './form/YesNoToggle';
import { DamageAreaChips } from './steps/sections/DamageAreaChips';
import type { OtherVehicle, OtherVehicleFatalOccupant, OtherVehicleOccupantInjury, PMInjuryBodyPart, PMInjurySeverity } from '../types/accident-report';

const opt = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b)).map(v => ({ value: v, label: v }));

// Vehicle type list changes depending on whether this was a DART-to-DART collision.
const TYPES_DART = opt([
  'Passenger Auto/St Wagon', 'Motorcycle/Moped', 'Passenger Truck/Van',
  'Non-Revenue Rail vehicle (Maintenance)', 'Hi-Rail – Maintenance vehicle mounted to rail',
  'Light rail vehicle', 'Streetcar', 'Bus',
  'Wrecker/Tow Truck/Electric Utility cart/ Garbage Truck/Forklift',
]);
const TYPES_NON_DART = opt([
  'Passenger Auto/St Wagon', 'Motorcycle/Moped', 'Passenger Truck/Van', 'Delivery Truck/Van',
  '18 Wheel Truck (Semi)', 'Fire Engine, Ambulance, Police car', 'Tractor Trailer',
  'Commercial Rail or Amtrak', 'School Bus/Charter/Tour Bus', 'Taxi/Rideshare',
  'Utility Trucks', 'Trolley', 'Wrecker/Tow Truck/Electric Utility cart/ Garbage Truck/Forklift',
]);
const ACTIONS = opt(['Going Straight', 'Making a left turn', 'Making a right turn', 'Going backwards', 'Changing lanes', 'Stopped', 'Negotiating a curve', 'Parked']);
const POINTS = opt(['Front Impact', 'Rear Impact', 'Sideswipe', 'Driver Side Mirror', 'Passenger Side Mirror', 'Left Side Impact', 'Right Side Impact', 'Roof/Top of vehicle', 'Underbody', 'Front/Rear Wheel']);
// Stakeholder-specified order (not alphabetized) to match the PM screen.
const COLLISION_TYPES = ['Head On', 'Sideswipe', 'Rear-Ending', 'Rear-Ended', 'Other Front Impact', 'Right Side Impact', 'Left Side Impact', 'Other Rear Impact', 'Roof/top of vehicle'].map(v => ({ value: v, label: v }));
const DIRECTIONS = opt([
  'Traveling in the same direction ahead of DART vehicle',
  'Approaching at an angle from the left',
  'Approaching at an angle from the right',
  'Traveling in the same direction behind DART vehicle',
  'Approaching ahead or passing',
  'Moving facing the opposite direction',
  'Traveling the same direction beside DART vehicle',
  'Not moving on the left side of DART vehicle',
  'Not moving on the right side of DART vehicle',
  'Not moving ahead of DART Vehicle',
]);

const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

function Field({ label, required, className = '', error = false, children }: { label: string; required?: boolean; className?: string; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="dart-field-label">{label}{required && <span className="dart-req ml-1">*</span>}</label>
      <div className={error ? 'dart-field-error' : ''}>{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, className = '', required = false, error = false }: { label: string; value?: number; onChange: (v: number | undefined) => void; className?: string; required?: boolean; error?: boolean }) {
  return (
    <Field label={label} required={required} className={className} error={error}>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0))}
        placeholder="Enter count"
        className="dart-input-base"
      />
    </Field>
  );
}

// Small eyebrow that titles each chunk of the editor.
function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 font-['Poppins']">{children}</p>;
}

// A stacked question row: label on the left, control on the right (matches the Police section).
function BoolRow({ label, required, sentenceCase = false, error = false, children }: { label: string; required?: boolean; sentenceCase?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3 ${error ? 'bg-red-50/50' : ''}`}>
      <p className={`dart-field-label sm:flex-1 ${error ? 'text-red-600' : ''}`} style={{ marginBottom: 0, textTransform: sentenceCase ? 'none' : undefined }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className={`shrink-0 ${error ? 'dart-field-error' : ''}`}>{children}</div>
    </div>
  );
}

interface Props {
  vehicles: OtherVehicle[];
  onChange: (vehicles: OtherVehicle[]) => void;
  showErrors?: boolean;
  injuryDetailsRequired?: boolean;
  // 'operator' drops "Occupant fatalities" and captures gender + transported per injured occupant.
  // 'supervisor' matches operator's per-occupant capture and also asks age group.
  // 'pm' keeps fatalities count and captures severity + body part + age + gender + transported per injured occupant.
  variant?: 'operator' | 'supervisor' | 'pm' | 'full';
}

const GENDER_OPTS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
];
const AGE_OPTS = [
  { value: 'Child (12 and under)', label: 'Child (12 and under)' },
  { value: 'Teen (13 to 18)', label: 'Teen (13 to 18)' },
  { value: 'Adult (19 to 60)', label: 'Adult (19 to 60)' },
  { value: 'Senior Citizen (61 and up)', label: 'Senior Citizen (61 and up)' },
];
const SEVERITY_OPTS = [
  { value: 'Injured – Non-Serious', label: 'Injured – Non-Serious' },
  { value: 'Injured - Serious', label: 'Injured - Serious' },
];
const BODY_PART_OPTS = [
  { value: 'Head', label: 'Head' },
  { value: 'Upper body', label: 'Upper body' },
  { value: 'Lower body', label: 'Lower body' },
];
const TRANSPORTED_OPTS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'Not sure' },
];
const YES_NO_OPTS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const makeInjuredOccupant = (): OtherVehicleOccupantInjury => ({
  id: `io-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
});

const syncInjuredOccupants = (existing: OtherVehicleOccupantInjury[] | undefined, targetCount: number): OtherVehicleOccupantInjury[] => {
  const list = existing ?? [];
  if (list.length === targetCount) return list;
  if (list.length < targetCount) {
    const add = Array.from({ length: targetCount - list.length }, makeInjuredOccupant);
    return [...list, ...add];
  }
  return list.slice(0, targetCount);
};

const makeFatalOccupant = (): OtherVehicleFatalOccupant => ({
  id: `fo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
});

const syncFatalOccupants = (existing: OtherVehicleFatalOccupant[] | undefined, targetCount: number): OtherVehicleFatalOccupant[] => {
  const list = existing ?? [];
  if (list.length === targetCount) return list;
  if (list.length < targetCount) {
    const add = Array.from({ length: targetCount - list.length }, makeFatalOccupant);
    return [...list, ...add];
  }
  return list.slice(0, targetCount);
};

export function OtherVehiclesEditor({ vehicles, onChange, showErrors = false, injuryDetailsRequired = true, variant = 'full' }: Props) {
  const isOperator = variant === 'operator';
  const isSupervisor = variant === 'supervisor';
  const isPM = variant === 'pm';
  // Operator, Supervisor and PM collect per-injured-occupant rows instead of aggregate 'transported' counts.
  const perOccupant = isOperator || isSupervisor || isPM;
  const [openId, setOpenId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<OtherVehicle>) =>
    onChange(vehicles.map(v => (v.id === id ? { ...v, ...patch } : v)));

  const addVehicle = () => {
    const id = `vehicle-${Date.now()}`;
    onChange([...vehicles, { id }]);
    setOpenId(id);
  };

  const remove = (id: string) => {
    onChange(vehicles.filter(v => v.id !== id));
    if (openId === id) setOpenId(null);
  };

  // 0 or empty occupants clears the whole occupant breakdown.
  const setOccupants = (id: string, n: number | undefined) => {
    if (!n || n < 1) update(id, { occupants: n, fatalities: undefined, injuries: undefined, fled: undefined, transported: undefined, injured_occupants: [], fatal_occupants: [] });
    else update(id, { occupants: n });
  };
  // 0 injuries clears transported + per-injury records (nothing to describe).
  const setInjuries = (id: string, n: number | undefined) => {
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    if (!n || n < 1) {
      update(id, { injuries: n, transported: undefined, injured_occupants: [] });
      return;
    }
    if (perOccupant) {
      update(id, { injuries: n, injured_occupants: syncInjuredOccupants(v.injured_occupants, n) });
      return;
    }
    update(id, { injuries: n });
  };
  // PM captures per-deceased demographics inline; keep list length in sync with the fatalities count.
  const setFatalities = (id: string, n: number | undefined) => {
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    if (!n || n < 1) {
      update(id, { fatalities: n, fatal_occupants: [] });
      return;
    }
    update(id, { fatalities: n, fatal_occupants: syncFatalOccupants(v.fatal_occupants, n) });
  };

  const updateInjuredOccupant = (vehicleId: string, occupantId: string, patch: Partial<OtherVehicleOccupantInjury>) => {
    const v = vehicles.find(x => x.id === vehicleId);
    if (!v) return;
    const next = (v.injured_occupants ?? []).map(o => (o.id === occupantId ? { ...o, ...patch } : o));
    update(vehicleId, { injured_occupants: next });
  };

  const updateFatalOccupant = (vehicleId: string, occupantId: string, patch: Partial<OtherVehicleFatalOccupant>) => {
    const v = vehicles.find(x => x.id === vehicleId);
    if (!v) return;
    const next = (v.fatal_occupants ?? []).map(o => (o.id === occupantId ? { ...o, ...patch } : o));
    update(vehicleId, { fatal_occupants: next });
  };

  if (vehicles.length === 0) {
    return (
      <button
        type="button"
        onClick={addVehicle}
        className={`group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50/70 px-6 py-10 text-center transition-colors hover:border-[#007DBA]/40 hover:bg-[#f2f8fc] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] ${showErrors ? 'border-red-300' : 'border-slate-200'}`}
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-all group-hover:ring-[#007DBA]/30 group-hover:shadow-md">
          <span className="material-symbols-rounded text-[26px] text-[#007DBA]/70">directions_car</span>
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-700 font-['Poppins']">No other vehicles added <span className="dart-req">*</span></p>
        <p className="mt-1 text-xs text-slate-400 font-['Poppins']">Add each vehicle involved besides the DART vehicle.</p>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {vehicles.map((v, idx) => {
        const open = openId === v.id;
        const hasOccupants = (v.occupants ?? 0) > 0;
        const hasInjuries = (v.injuries ?? 0) > 0;
        const hasFatalities = (v.fatalities ?? 0) > 0;
        const typeOptions = v.dart_dart ? TYPES_DART : TYPES_NON_DART;
        const injuredOccupants = v.injured_occupants ?? [];
        const fatalOccupants = v.fatal_occupants ?? [];
        const injuredRowsComplete = !perOccupant || !injuryDetailsRequired || !hasInjuries
          || (injuredOccupants.length === (v.injuries ?? 0)
            && injuredOccupants.every(o =>
              (isSupervisor || !!o.gender)
              && !!o.transported
              && (!(isSupervisor || isPM) || !!o.age_group)
              && (!isPM || (!!o.severity && !!o.body_part))
              && (!(isSupervisor || isPM) || o.is_dart_employee !== undefined)
            ));
        const fatalRowsComplete = !(isSupervisor || isPM) || !hasFatalities
          || (fatalOccupants.length === (v.fatalities ?? 0)
            && fatalOccupants.every(o => !!o.age_group && !!o.gender && o.is_dart_employee !== undefined));
        const occupantsComplete = !hasOccupants
          || (
            perOccupant
              ? (
                  isPM
                    ? (v.fatalities !== undefined && fatalRowsComplete && (!injuryDetailsRequired || (v.injuries !== undefined && v.fled !== undefined && injuredRowsComplete)))
                    : (!injuryDetailsRequired || (v.injuries !== undefined && v.fled !== undefined && injuredRowsComplete))
                )
              : (v.fatalities !== undefined && (!injuryDetailsRequired || (v.injuries !== undefined && v.fled !== undefined && (!hasInjuries || v.transported !== undefined))))
          );
        const recordComplete = v.occupants !== undefined
          && occupantsComplete
          && v.dart_dart !== undefined && !!v.vehicle_type && (isOperator || !!v.collision_type) && !!v.action && !!v.point_of_impact
          && !!v.direction && v.damage !== undefined && (!v.damage || (Array.isArray(v.damage_area) && v.damage_area.length > 0));
        // Richer collapsed subtitle so scanners see impact + condition, not just occupant count.
        const subtitleParts = [
          v.vehicle_type || 'Type not set',
          `${v.occupants ?? 0} occ.`,
          v.point_of_impact ? `${v.point_of_impact} impact` : null,
          v.damage ? 'damaged' : null,
          v.tow_away ? 'towed' : null,
        ].filter(Boolean);
        const subtitle = subtitleParts.join(' · ');
        const fatalCount = v.fatalities ?? 0;
        const transportedCount = perOccupant
          ? injuredOccupants.filter(o => o.transported === 'yes').length
          : (v.transported ?? 0);
        const fledCount = v.fled ?? 0;

        return (
          <div key={v.id} className={`overflow-hidden rounded-xl border bg-white transition-shadow ${showErrors && !recordComplete ? 'border-red-300' : open ? 'border-[#112458]/30 shadow-sm' : 'border-slate-200/70'}`}>
            {/* Summary row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf1fb] text-[#1c3570]">
                <span className="material-symbols-rounded text-[19px]">directions_car</span>
              </span>
              <button type="button" onClick={() => setOpenId(open ? null : v.id)} className="min-w-0 flex-1 text-left focus:outline-none">
                <p className="truncate text-sm font-semibold text-slate-800 font-['Poppins']">Vehicle {idx + 2}</p>
                <p className="truncate text-xs text-slate-500 font-['Poppins']">{subtitle}</p>
              </button>
              {fatalCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 font-['Poppins']" title={`${fatalCount} fatal`}>
                  <span className="material-symbols-rounded text-[13px]" aria-hidden="true">warning</span>
                  {fatalCount} fatal
                </span>
              )}
              {hasInjuries && (
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 font-['Poppins']">{v.injuries} injured</span>
              )}
              {transportedCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 font-['Poppins']" title={`${transportedCount} transported to hospital`}>
                  <span className="material-symbols-rounded text-[13px]" aria-hidden="true">local_hospital</span>
                  {transportedCount}
                </span>
              )}
              {fledCount > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 font-['Poppins']" title={`${fledCount} fled the scene`}>
                  <span className="material-symbols-rounded text-[13px]" aria-hidden="true">directions_run</span>
                  {fledCount}
                </span>
              )}
              <button type="button" onClick={() => setOpenId(open ? null : v.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[rgba(17,36,88,0.2)]" aria-label={open ? `Collapse vehicle ${idx + 2}` : `Edit vehicle ${idx + 2}`}>
                {open
                  ? <span className="material-symbols-rounded text-[18px] text-emerald-600" aria-hidden="true">check</span>
                  : <span className="material-symbols-rounded text-[16px]" aria-hidden="true">edit</span>}
              </button>
              <button type="button" onClick={() => remove(v.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-300" aria-label={`Remove vehicle ${idx + 2}`}>
                <span className="material-symbols-rounded text-[16px]" aria-hidden="true">delete</span>
              </button>
            </div>

            {/* Inline editor */}
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="editor"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                  className="overflow-hidden border-t border-slate-100 bg-slate-50/40"
                >
                  <div className="space-y-6 px-4 py-5">
                    {/* This determines which vehicle-type options apply, so ask it first. */}
                    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
                      <BoolRow label="Was this a collision between DART vehicles?" required sentenceCase error={showErrors && v.dart_dart === undefined}>
                        <YesNoToggle value={v.dart_dart} onChange={val => update(v.id, { dart_dart: val, vehicle_type: undefined })} />
                      </BoolRow>
                    </div>

                    {/* Vehicle */}
                    <div>
                      <GroupLabel>Vehicle</GroupLabel>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-3">
                        <Field label="Vehicle type" required error={showErrors && !v.vehicle_type}>
                          <CustomSelect value={v.vehicle_type || ''} onChange={val => update(v.id, { vehicle_type: val })} options={typeOptions} placeholder="Select vehicle type" />
                        </Field>
                        {!isOperator && (
                          <Field label="Other vehicle collision type" required error={showErrors && !v.collision_type}>
                            <CustomSelect value={v.collision_type || ''} onChange={val => update(v.id, { collision_type: val })} options={COLLISION_TYPES} placeholder="Select collision type" />
                          </Field>
                        )}
                        <Field label="Vehicle action" required error={showErrors && !v.action}>
                          <CustomSelect value={v.action || ''} onChange={val => update(v.id, { action: val })} options={ACTIONS} placeholder="Select" />
                        </Field>
                        <Field label="Direction relative to DART vehicle" required error={showErrors && !v.direction}>
                          <CustomSelect value={v.direction || ''} onChange={val => update(v.id, { direction: val })} options={DIRECTIONS} placeholder="Select" />
                        </Field>
                      </div>
                    </div>

                    {/* Occupants */}
                    <div>
                      <GroupLabel>Occupants</GroupLabel>
                      {/* Column count adapts to which follow-ups apply: fatalities and aggregate transport for FS/PM, per-injury rows below for operator/supervisor/pm. */}
                      <div
                        className={`grid gap-x-5 gap-y-4 ${
                          hasOccupants
                            ? isPM
                              ? 'grid-cols-1 md:grid-cols-4'
                              : perOccupant
                                ? 'grid-cols-1 md:grid-cols-3'
                                : hasInjuries
                                  ? 'grid-cols-1 md:grid-cols-5'
                                  : 'grid-cols-1 md:grid-cols-4'
                            : 'grid-cols-1'
                        }`}
                      >
                        <NumberField label="Number of occupants in vehicle" required error={showErrors && v.occupants === undefined} value={v.occupants} onChange={n => setOccupants(v.id, n)} />
                        {hasOccupants && (
                          <>
                            {(!perOccupant || isSupervisor || isPM) && (
                              <NumberField label="Occupant fatalities" required error={showErrors && v.fatalities === undefined} value={v.fatalities} onChange={n => setFatalities(v.id, n)} />
                            )}
                            <NumberField label="Occupant injuries" required={injuryDetailsRequired} error={showErrors && injuryDetailsRequired && v.injuries === undefined} value={v.injuries} onChange={n => setInjuries(v.id, n)} />
                            {!perOccupant && hasInjuries && (
                              <NumberField
                                label="Occupants transported to hospital"
                                required={injuryDetailsRequired}
                                error={showErrors && injuryDetailsRequired && v.transported === undefined}
                                value={v.transported}
                                onChange={n => update(v.id, { transported: n })}
                              />
                            )}
                            <NumberField label="Occupants who fled the scene" required={injuryDetailsRequired} error={showErrors && injuryDetailsRequired && v.fled === undefined} value={v.fled} onChange={n => update(v.id, { fled: n })} />
                          </>
                        )}
                      </div>
                      {perOccupant && hasInjuries && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/70 bg-white">
                          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Injured occupants ({injuredOccupants.length})</p>
                            <p className="mt-0.5 text-[11px] text-slate-400 font-['Poppins']">{isPM
                              ? 'Capture severity, body part, age, gender, and hospital transport for each injured occupant.'
                              : isSupervisor
                                ? 'Capture age, gender, and hospital transport for each injured occupant.'
                                : 'Capture gender and hospital transport for each injured occupant.'}</p>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {injuredOccupants.map((occ, occIdx) => {
                              const ageMissing = showErrors && (isSupervisor || isPM) && injuryDetailsRequired && !occ.age_group;
                              const severityMissing = showErrors && isPM && injuryDetailsRequired && !occ.severity;
                              const bodyPartMissing = showErrors && isPM && injuryDetailsRequired && !occ.body_part;
                              const genderRequired = injuryDetailsRequired && !isSupervisor;
                              const genderMissing = showErrors && genderRequired && !occ.gender;
                              const transportMissing = showErrors && injuryDetailsRequired && !occ.transported;
                              const employeeMissing = showErrors && injuryDetailsRequired && occ.is_dart_employee === undefined;
                              const rowGrid = isPM
                                ? 'sm:grid-cols-2 lg:grid-cols-6'
                                : isSupervisor
                                  ? 'sm:grid-cols-4'
                                  : 'sm:grid-cols-2';
                              return (
                                <div key={occ.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
                                  <p className="w-28 shrink-0 pt-1 text-[12px] font-semibold text-slate-500 font-['Poppins']">Occupant {occIdx + 1}</p>
                                  <div className={`grid flex-1 grid-cols-1 gap-x-4 gap-y-3 ${rowGrid}`}>
                                    {isPM && (
                                      <Field label="Injury severity" required={injuryDetailsRequired} error={severityMissing}>
                                        <CustomSelect
                                          value={occ.severity || ''}
                                          onChange={val => updateInjuredOccupant(v.id, occ.id, { severity: (val || undefined) as PMInjurySeverity })}
                                          options={SEVERITY_OPTS}
                                          placeholder="Select severity"
                                          error={severityMissing}
                                        />
                                      </Field>
                                    )}
                                    {isPM && (
                                      <Field label="Injured body part" required={injuryDetailsRequired} error={bodyPartMissing}>
                                        <CustomSelect
                                          value={occ.body_part || ''}
                                          onChange={val => updateInjuredOccupant(v.id, occ.id, { body_part: (val || undefined) as PMInjuryBodyPart })}
                                          options={BODY_PART_OPTS}
                                          placeholder="Select body part"
                                          error={bodyPartMissing}
                                        />
                                      </Field>
                                    )}
                                    {(isSupervisor || isPM) && (
                                      <Field label="Age group" required={injuryDetailsRequired} error={ageMissing}>
                                        <CustomSelect
                                          value={occ.age_group || ''}
                                          onChange={val => updateInjuredOccupant(v.id, occ.id, { age_group: (val || undefined) as OtherVehicleOccupantInjury['age_group'] })}
                                          options={AGE_OPTS}
                                          placeholder="Select age"
                                          error={ageMissing}
                                        />
                                      </Field>
                                    )}
                                    <Field label="Gender" required={genderRequired} error={genderMissing}>
                                      <CustomSelect
                                        value={occ.gender || ''}
                                        onChange={val => updateInjuredOccupant(v.id, occ.id, { gender: (val || undefined) as OtherVehicleOccupantInjury['gender'] })}
                                        options={GENDER_OPTS}
                                        placeholder="Select"
                                        error={genderMissing}
                                      />
                                    </Field>
                                    <Field label="Transported to hospital" required={injuryDetailsRequired} error={transportMissing}>
                                      <CustomSelect
                                        value={occ.transported || ''}
                                        onChange={val => updateInjuredOccupant(v.id, occ.id, { transported: (val || undefined) as OtherVehicleOccupantInjury['transported'] })}
                                        options={TRANSPORTED_OPTS}
                                        placeholder="Select"
                                        error={transportMissing}
                                      />
                                    </Field>
                                    {(isSupervisor || isPM) && (
                                      <Field label="DART employee?" required={injuryDetailsRequired} error={employeeMissing}>
                                        <CustomSelect
                                          value={occ.is_dart_employee === undefined ? '' : (occ.is_dart_employee ? 'yes' : 'no')}
                                          onChange={val => updateInjuredOccupant(v.id, occ.id, { is_dart_employee: val === '' ? undefined : val === 'yes' })}
                                          options={YES_NO_OPTS}
                                          placeholder="Select"
                                          error={employeeMissing}
                                        />
                                      </Field>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {(isSupervisor || isPM) && hasFatalities && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/70 bg-white">
                          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Deceased occupants ({fatalOccupants.length})</p>
                            <p className="mt-0.5 text-[11px] text-slate-400 font-['Poppins']">Capture DART employee status, age, and gender for each deceased occupant.</p>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {fatalOccupants.map((occ, occIdx) => {
                              const ageMissing = showErrors && !occ.age_group;
                              const genderMissing = showErrors && !occ.gender;
                              const employeeMissing = showErrors && occ.is_dart_employee === undefined;
                              return (
                                <div key={occ.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
                                  <p className="w-28 shrink-0 pt-1 text-[12px] font-semibold text-slate-500 font-['Poppins']">Deceased #{occIdx + 1}</p>
                                  <div className="grid flex-1 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
                                    <Field label="DART employee?" required error={employeeMissing}>
                                      <CustomSelect
                                        value={occ.is_dart_employee === undefined ? '' : (occ.is_dart_employee ? 'yes' : 'no')}
                                        onChange={val => updateFatalOccupant(v.id, occ.id, { is_dart_employee: val === '' ? undefined : val === 'yes' })}
                                        options={YES_NO_OPTS}
                                        placeholder="Select"
                                        error={employeeMissing}
                                      />
                                    </Field>
                                    <Field label="Age group" required error={ageMissing}>
                                      <CustomSelect
                                        value={occ.age_group || ''}
                                        onChange={val => updateFatalOccupant(v.id, occ.id, { age_group: (val || undefined) as OtherVehicleFatalOccupant['age_group'] })}
                                        options={AGE_OPTS}
                                        placeholder="Select age"
                                        error={ageMissing}
                                      />
                                    </Field>
                                    <Field label="Gender" required error={genderMissing}>
                                      <CustomSelect
                                        value={occ.gender || ''}
                                        onChange={val => updateFatalOccupant(v.id, occ.id, { gender: (val || undefined) as OtherVehicleFatalOccupant['gender'] })}
                                        options={GENDER_OPTS}
                                        placeholder="Select"
                                        error={genderMissing}
                                      />
                                    </Field>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Damage */}
                    <div>
                      <GroupLabel>Damage</GroupLabel>
                      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                        <BoolRow label="Was there damage to this vehicle?" required error={showErrors && v.damage === undefined}>
                          <YesNoToggle value={v.damage} onChange={val => update(v.id, { damage: val, damage_area: val ? v.damage_area : undefined, impact_markers: val ? v.impact_markers : undefined })} />
                        </BoolRow>
                        {v.damage && (() => {
                          const damageAreaError = showErrors && (v.damage_area?.length ?? 0) === 0;
                          return (
                          <div className={`px-4 py-3 ${damageAreaError ? 'bg-red-50/50' : ''}`}>
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                              <p className={`dart-field-label ${damageAreaError ? 'text-red-600' : ''}`} style={{ marginBottom: 0, textTransform: 'none' }}>
                                Damage area<span className="dart-req ml-1">*</span>
                                <span className="ml-2 text-[11px] font-normal text-slate-400">Tap all that apply</span>
                              </p>
                              {(v.damage_area?.length ?? 0) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => update(v.id, { damage_area: [] })}
                                  className="text-[11px] font-semibold text-[#007DBA] hover:text-[#00205B] font-['Poppins']"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            <DamageAreaChips value={v.damage_area || []} onChange={val => update(v.id, { damage_area: val })} />
                            {damageAreaError && (
                              <p className="mt-2 text-[11px] font-medium text-red-600 font-['Poppins']">Select at least one damage area.</p>
                            )}
                          </div>
                          );
                        })()}
                        {isPM && v.damage === true && (
                          <BoolRow label="Were there any disabling damages?">
                            <YesNoToggle value={v.disabling_damage} onChange={val => update(v.id, { disabling_damage: val })} />
                          </BoolRow>
                        )}
                        <BoolRow label="Point of impact" required error={showErrors && !v.point_of_impact}>
                          <div className="w-full sm:w-60">
                            <CustomSelect value={v.point_of_impact || ''} onChange={val => update(v.id, { point_of_impact: val })} options={POINTS} placeholder="Select" />
                          </div>
                        </BoolRow>
                        <BoolRow label="Was this vehicle towed away?">
                          <YesNoToggle value={v.tow_away} onChange={val => update(v.id, { tow_away: val })} />
                        </BoolRow>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end border-t border-slate-100 px-4 py-3">
                    <button type="button" onClick={() => setOpenId(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#112458] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0c1a42] focus:outline-none focus:ring-2 focus:ring-[rgba(17,36,88,0.3)] font-['Poppins']">
                      <span className="material-symbols-rounded text-[18px]" aria-hidden="true">check</span> Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addVehicle}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#007DBA]/40 bg-[#f2f8fc] px-3.5 py-2.5 text-sm font-semibold text-[#007DBA] transition-colors hover:border-[#007DBA] hover:bg-[#e8f3fa] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
      >
        <span className="material-symbols-rounded text-[18px]" aria-hidden="true">add</span> Add vehicle
      </button>
    </div>
  );
}
