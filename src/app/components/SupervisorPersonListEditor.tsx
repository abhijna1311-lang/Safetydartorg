import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { YesNoToggle } from './form/YesNoToggle';
import type { SupervisorDemographicRecord } from '../types/accident-report';

const opt = (arr: string[]) => arr.map(v => ({ value: v, label: v }));
const AGE_GROUPS = opt(['Child (12 and under)', 'Teen (13 to 18)', 'Adult (19 to 60)', 'Senior Citizen (61 and up)']);
const GENDERS = opt(['Female', 'Male']);
const BODY_PARTS = opt(['Head', 'Upper body', 'Lower body']);
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

const ROLE_GLYPH: Record<Role, string> = { Employee: 'badge', Passenger: 'event_seat', Pedestrian: 'directions_walk' };

export type SupervisorPersonKind = 'injury' | 'fatality';
export type Role = 'Employee' | 'Passenger' | 'Pedestrian';

function Field({ label, required, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="dart-field-label">{label}{required && <span className="dart-req ml-1">*</span>}</label>
      {children}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 font-['Poppins']">{children}</p>;
}

function BoolRow({ label, required, error = false, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3 ${error ? 'bg-red-50/50' : ''}`}>
      <p className={`dart-field-label sm:flex-1 ${error ? 'text-red-600' : ''}`} style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className={`shrink-0 ${error ? 'dart-field-error' : ''}`}>{children}</div>
    </div>
  );
}

interface Props {
  records: SupervisorDemographicRecord[];
  onChange: (records: SupervisorDemographicRecord[]) => void;
  role: Role;
  kind: SupervisorPersonKind;
  showErrors?: boolean;
}

export function SupervisorPersonListEditor({ records, onChange, role, kind, showErrors = false }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const isFatality = kind === 'fatality';
  const isEmployeeSection = role === 'Employee';
  const singular = role.toLowerCase();
  const kindLabel = isFatality ? (isEmployeeSection ? 'fatality' : `${singular} fatality`) : (isEmployeeSection ? 'injury' : `injured ${singular}`);
  const addLabel = `Add ${kindLabel}`;

  const withId = (r: SupervisorDemographicRecord): SupervisorDemographicRecord =>
    r.id ? r : { ...r, id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };

  const normalized = records.map(withId);

  const update = (id: string, patch: Partial<SupervisorDemographicRecord>) =>
    onChange(normalized.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const add = () => {
    const id = `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const seed: SupervisorDemographicRecord = { id };
    if (isEmployeeSection) seed.is_dart_employee = true;
    onChange([...normalized, seed]);
    setOpenId(id);
  };

  const remove = (id: string) => {
    onChange(normalized.filter(r => r.id !== id));
    if (openId === id) setOpenId(null);
  };

  const recordComplete = (r: SupervisorDemographicRecord) => {
    if (!r.age_group || !r.gender || !r.injured_body_part) return false;
    if (!isEmployeeSection && r.is_dart_employee === undefined) return false;
    if (!isFatality && r.transported_to_hospital === undefined) return false;
    return true;
  };

  const AddButton = (
    <button
      type="button"
      onClick={add}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#007DBA]/40 bg-[#f2f8fc] px-3.5 py-2.5 text-sm font-semibold text-[#007DBA] transition-colors hover:border-[#007DBA] hover:bg-[#e8f3fa] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
    >
      <Plus className="h-4 w-4" /> {addLabel}
    </button>
  );

  if (normalized.length === 0) {
    return (
      <button
        type="button"
        onClick={add}
        className={`group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50/70 px-6 py-10 text-center transition-colors hover:border-[#007DBA]/40 hover:bg-[#f2f8fc] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] ${showErrors ? 'border-red-300' : 'border-slate-200'}`}
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-all group-hover:ring-[#007DBA]/30 group-hover:shadow-md">
          <span className="material-symbols-rounded text-[26px] text-[#007DBA]/70">group_add</span>
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-700 font-['Poppins']">No {isFatality ? 'fatalities' : 'injured people'} added yet <span className="dart-req">*</span></p>
        <p className="mt-1 text-xs text-slate-400 font-['Poppins']">Click to add each {kindLabel} on scene.</p>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {normalized.map((r, idx) => {
        const open = openId === r.id;
        const complete = recordComplete(r);
        const displayName = `${isEmployeeSection ? 'Employee' : role} ${idx + 1}`;
        const details: string[] = [];
        if (r.age_group) details.push(r.age_group);
        if (r.gender) details.push(r.gender);
        if (r.injured_body_part) details.push(r.injured_body_part);
        if (!isEmployeeSection && r.is_dart_employee) details.push('DART employee');
        const subtitle = details.join(' · ');

        return (
          <div key={r.id} className={`overflow-hidden rounded-xl border bg-white transition-shadow ${showErrors && !complete ? 'border-red-300' : open ? 'border-[#112458]/30 shadow-sm' : 'border-slate-200/70'}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf1fb] text-[#1c3570]">
                <span className="material-symbols-rounded text-[19px]">{ROLE_GLYPH[role]}</span>
              </span>
              <button type="button" onClick={() => setOpenId(open ? null : (r.id ?? null))} className="min-w-0 flex-1 text-left focus:outline-none">
                <p className="truncate text-sm font-semibold text-slate-800 font-['Poppins']">{displayName}</p>
                <p className={`truncate text-xs font-['Poppins'] ${subtitle ? 'text-slate-500' : 'italic text-slate-400'}`}>{subtitle || 'No details added yet'}</p>
              </button>
              {!isFatality && r.transported_to_hospital && (
                <span className="hidden items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 font-['Poppins'] sm:inline-flex">
                  <span className="material-symbols-rounded text-[14px]">local_hospital</span> Transported
                </span>
              )}
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold font-['Poppins'] ${isFatality ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{isFatality ? 'Fatal' : 'Injured'}</span>
              <button type="button" onClick={() => setOpenId(open ? null : (r.id ?? null))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[rgba(17,36,88,0.2)]" aria-label={open ? `Collapse ${displayName}` : `Edit ${displayName}`}>
                {open ? <Check className="h-4 w-4 text-emerald-600" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => r.id && remove(r.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-300" aria-label={`Remove ${displayName}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

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
                    <div>
                      <GroupLabel>Details</GroupLabel>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-12">
                        <Field label="Age group" required className="lg:col-span-4">
                          <CustomSelect value={r.age_group || ''} onChange={v => update(r.id!, { age_group: v as SupervisorDemographicRecord['age_group'] })} options={AGE_GROUPS} placeholder="Select age" error={showErrors && !r.age_group} />
                        </Field>
                        <Field label="Gender" required className="lg:col-span-3">
                          <CustomSelect value={r.gender || ''} onChange={v => update(r.id!, { gender: v as 'Female' | 'Male' })} options={GENDERS} placeholder="Select" error={showErrors && !r.gender} />
                        </Field>
                        {!isEmployeeSection && (
                          <Field label="DART employee?" required className="lg:col-span-5">
                            <CustomSelect
                              value={r.is_dart_employee === undefined ? '' : (r.is_dart_employee ? 'yes' : 'no')}
                              onChange={v => update(r.id!, { is_dart_employee: v === 'yes' })}
                              options={YES_NO}
                              placeholder="Select"
                              error={showErrors && r.is_dart_employee === undefined}
                            />
                          </Field>
                        )}
                      </div>
                    </div>

                    <div>
                      <GroupLabel>{isFatality ? 'Impact' : 'Injury'}</GroupLabel>
                      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                        <BoolRow label={isFatality ? 'Primary impact body part' : 'Injured body part'} required error={showErrors && !r.injured_body_part}>
                          <div className="w-full sm:w-60">
                            <CustomSelect value={r.injured_body_part || ''} onChange={v => update(r.id!, { injured_body_part: v as SupervisorDemographicRecord['injured_body_part'] })} options={BODY_PARTS} placeholder="Select" error={showErrors && !r.injured_body_part} />
                          </div>
                        </BoolRow>
                        {!isFatality && (
                          <BoolRow label="Transported to hospital?" required error={showErrors && r.transported_to_hospital === undefined}>
                            <YesNoToggle value={r.transported_to_hospital} onChange={v => update(r.id!, { transported_to_hospital: v })} />
                          </BoolRow>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end border-t border-slate-100 px-4 py-3">
                    <button type="button" onClick={() => setOpenId(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#112458] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0c1a42] focus:outline-none focus:ring-2 focus:ring-[rgba(17,36,88,0.3)] font-['Poppins']">
                      <Check className="h-4 w-4" /> Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {AddButton}
    </div>
  );
}
