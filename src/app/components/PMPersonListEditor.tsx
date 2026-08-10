import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { YesNoToggle } from './form/YesNoToggle';
import type {
  PMPersonRecord,
  PMInjurySeverity,
  PMInjuryBodyPart,
  SupervisorDemographicRecord,
} from '../types/accident-report';

const opt = (arr: string[]) => arr.map(v => ({ value: v, label: v }));
const ROLES = opt(['Passenger', 'Pedestrian']);
const OUTCOMES = opt(['Fatality', 'Injured']);
const GENDERS = opt(['Female', 'Male']);
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const BODY_PARTS: { value: PMInjuryBodyPart; label: PMInjuryBodyPart }[] = [
  { value: 'Head', label: 'Head' },
  { value: 'Upper body', label: 'Upper body' },
  { value: 'Lower body', label: 'Lower body' },
];
const SEVERITIES: { value: PMInjurySeverity; label: PMInjurySeverity }[] = [
  { value: 'Injured – Non-Serious', label: 'Injured – Non-Serious' },
  { value: 'Injured - Serious', label: 'Injured - Serious' },
];
const AGE_GROUPS: { value: NonNullable<SupervisorDemographicRecord['age_group']>; label: string }[] = [
  { value: 'Child (12 and under)', label: 'Child (12 and under)' },
  { value: 'Teen (13 to 18)', label: 'Teen (13 to 18)' },
  { value: 'Adult (19 to 60)', label: 'Adult (19 to 60)' },
  { value: 'Senior Citizen (61 and up)', label: 'Senior Citizen (61 and up)' },
];

const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;
const ROLE_GLYPH: Record<string, string> = { Passenger: 'event_seat', Pedestrian: 'directions_walk', Operator: 'badge' };

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
  people: PMPersonRecord[];
  onChange: (people: PMPersonRecord[]) => void;
  showErrors?: boolean;
  // When set, the role is fixed and the role dropdown is hidden. Operator mode also
  // hides the DART-employee question and drops the Child age group.
  roleLock?: NonNullable<PMPersonRecord['role']>;
  // Copy overrides for the empty state.
  emptyTitle?: string;
  emptyHint?: string;
  addLabel?: string;
  // Supervisor variant: hides the "Injury severity" row (severity is a PM-only classification).
  hideSeverity?: boolean;
  // Supervisor variant: age group is optional (label loses the required marker; completeness ignores it).
  ageOptional?: boolean;
}

export function PMPersonListEditor({ people, onChange, showErrors = false, roleLock, emptyTitle, emptyHint, addLabel, hideSeverity = false, ageOptional = false }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const isOperatorMode = roleLock === 'Operator';

  const update = (id: string, patch: Partial<PMPersonRecord>) =>
    onChange(people.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const addPerson = () => {
    const id = `pm-person-${Date.now()}`;
    const defaultRole: PMPersonRecord['role'] = roleLock || 'Passenger';
    // Operators are DART employees by definition, so seed the flag.
    const seed: Partial<PMPersonRecord> = isOperatorMode ? { is_dart_employee: true } : {};
    onChange([...people, { id, role: defaultRole, outcome: 'Injured', ...seed }]);
    setOpenId(id);
  };

  const remove = (id: string) => {
    onChange(people.filter(p => p.id !== id));
    if (openId === id) setOpenId(null);
  };

  // Switching outcome clears the fields that don't apply.
  const changeOutcome = (id: string, o: string) => {
    if (o === 'Fatality') {
      update(id, { outcome: 'Fatality', severity: undefined, body_part: undefined, transported_to_hospital: undefined });
    } else {
      update(id, { outcome: 'Injured' });
    }
  };

  const AddButton = (
    <button
      type="button"
      onClick={addPerson}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#007DBA]/40 bg-[#f2f8fc] px-3.5 py-2.5 text-sm font-semibold text-[#007DBA] transition-colors hover:border-[#007DBA] hover:bg-[#e8f3fa] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
    >
      <Plus className="h-4 w-4" /> {addLabel || 'Add person'}
    </button>
  );

  if (people.length === 0) {
    return (
      <button
        type="button"
        onClick={addPerson}
        className={`group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50/70 px-6 py-11 text-center transition-colors hover:border-[#007DBA]/40 hover:bg-[#f2f8fc] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] ${showErrors ? 'border-red-300' : 'border-slate-200'}`}
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition-all group-hover:ring-[#007DBA]/30 group-hover:shadow-md">
          <span className="material-symbols-rounded text-[26px] text-[#007DBA]/70">group_add</span>
        </span>
        <p className="mt-4 text-sm font-semibold text-slate-700 font-['Poppins']">{emptyTitle || 'No people added yet'}</p>
        <p className="mt-1 text-xs text-slate-400 font-['Poppins']">{emptyHint || 'Click to add each passenger or pedestrian affected — one record per person.'}</p>
      </button>
    );
  }

  // Per-role counters keep titles like "Passenger 1", "Pedestrian 2" in add order.
  const roleCounts: Record<string, number> = {};

  return (
    <div className="space-y-2">
      {people.map((p) => {
        const open = openId === p.id;
        const role = p.role || 'Passenger';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        const displayName = `${role} ${roleCounts[role]}`;
        const isInjured = p.outcome === 'Injured';
        const isFatal = p.outcome === 'Fatality';
        const recordComplete = (
          !!p.role
          && !!p.outcome
          && (isOperatorMode || p.is_dart_employee !== undefined)
          && (isOperatorMode || ageOptional || !!p.age_group)
          && (isOperatorMode || !!p.gender)
          && (!isInjured || ((hideSeverity || !!p.severity) && !!p.body_part && p.transported_to_hospital !== undefined))
        );
        const details: string[] = [];
        if (isInjured && !hideSeverity && p.severity) details.push(p.severity);
        if (isInjured && p.body_part) details.push(p.body_part);
        if (!isOperatorMode && p.age_group) details.push(p.age_group);
        if (!isOperatorMode && p.gender) details.push(p.gender);
        const subtitle = details.join(' · ');

        return (
          <div key={p.id} className={`overflow-hidden rounded-xl border bg-white transition-shadow ${showErrors && !recordComplete ? 'border-red-300' : open ? 'border-[#112458]/30 shadow-sm' : 'border-slate-200/70'}`}>
            {/* Summary row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf1fb] text-[#1c3570]">
                <span className="material-symbols-rounded text-[19px]">{ROLE_GLYPH[role] || 'person'}</span>
              </span>
              <button type="button" onClick={() => setOpenId(open ? null : p.id)} className="min-w-0 flex-1 text-left focus:outline-none">
                <p className="truncate text-sm font-semibold text-slate-800 font-['Poppins']">{displayName}</p>
                <p className={`truncate text-xs font-['Poppins'] ${subtitle ? 'text-slate-500' : 'italic text-slate-400'}`}>{subtitle || 'No details added yet'}</p>
              </button>
              {isInjured && p.transported_to_hospital && (
                <span className="hidden items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 font-['Poppins'] sm:inline-flex">
                  <span className="material-symbols-rounded text-[14px]">local_hospital</span> Transported
                </span>
              )}
              {(isFatal || isInjured) && (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold font-['Poppins'] ${isFatal ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{isFatal ? 'Fatal' : 'Injured'}</span>
              )}
              <button type="button" onClick={() => setOpenId(open ? null : p.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[rgba(17,36,88,0.2)]" aria-label={open ? `Collapse ${displayName}` : `Edit ${displayName}`}>
                {open ? <Check className="h-4 w-4 text-emerald-600" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => remove(p.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-300" aria-label={`Remove ${displayName}`}>
                <Trash2 className="h-3.5 w-3.5" />
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
                    {/* Details — operators only need Outcome; injury depth handles the rest. */}
                    <div>
                      <GroupLabel>Details</GroupLabel>
                      <div className={`grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 ${isOperatorMode ? '' : 'lg:grid-cols-5'}`}>
                        {!roleLock && (
                          <Field label="Role" required>
                            <CustomSelect value={role} onChange={v => update(p.id, { role: v as PMPersonRecord['role'] })} options={ROLES} placeholder="Select role" />
                          </Field>
                        )}
                        <Field label="Outcome" required>
                          <CustomSelect value={p.outcome || ''} onChange={v => changeOutcome(p.id, v)} options={OUTCOMES} placeholder="Select outcome" error={showErrors && !p.outcome} />
                        </Field>
                        {!isOperatorMode && (
                          <Field label="DART employee?" required>
                            <CustomSelect
                              value={p.is_dart_employee === undefined ? '' : (p.is_dart_employee ? 'yes' : 'no')}
                              onChange={v => {
                                const isEmployee = v === 'yes';
                                const clearChild = isEmployee && p.age_group === 'Child (12 and under)';
                                update(p.id, { is_dart_employee: isEmployee, ...(clearChild ? { age_group: undefined } : {}) });
                              }}
                              options={YES_NO}
                              placeholder="Select"
                              error={showErrors && p.is_dart_employee === undefined}
                            />
                          </Field>
                        )}
                        {!isOperatorMode && (
                          <Field label={ageOptional ? 'Age group (optional)' : 'Age group'} required={!ageOptional}>
                            <CustomSelect
                              value={p.age_group || ''}
                              onChange={v => update(p.id, { age_group: (v || undefined) as PMPersonRecord['age_group'] })}
                              options={p.is_dart_employee ? AGE_GROUPS.filter(o => o.value !== 'Child (12 and under)') : AGE_GROUPS}
                              placeholder="Select age"
                              error={showErrors && !ageOptional && !p.age_group}
                            />
                          </Field>
                        )}
                        {!isOperatorMode && (
                          <Field label="Gender" required>
                            <CustomSelect value={p.gender || ''} onChange={v => update(p.id, { gender: (v || undefined) as PMPersonRecord['gender'] })} options={GENDERS} placeholder="Select" error={showErrors && !p.gender} />
                          </Field>
                        )}
                      </div>
                    </div>

                    {/* Injury — only when outcome is Injured. */}
                    {isInjured && (
                      <div>
                        <GroupLabel>Injury</GroupLabel>
                        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                          {!hideSeverity && (
                            <BoolRow label="Injury severity" required error={showErrors && !p.severity}>
                              <div className="w-full sm:w-60">
                                <CustomSelect value={p.severity || ''} onChange={v => update(p.id, { severity: (v || undefined) as PMInjurySeverity })} options={SEVERITIES} placeholder="Select severity" error={showErrors && !p.severity} />
                              </div>
                            </BoolRow>
                          )}
                          <BoolRow label="Injured body part" required error={showErrors && !p.body_part}>
                            <div className="w-full sm:w-60">
                              <CustomSelect value={p.body_part || ''} onChange={v => update(p.id, { body_part: (v || undefined) as PMInjuryBodyPart })} options={BODY_PARTS} placeholder="Select" error={showErrors && !p.body_part} />
                            </div>
                          </BoolRow>
                          <BoolRow label="Transported to hospital?" required error={showErrors && p.transported_to_hospital === undefined}>
                            <YesNoToggle value={p.transported_to_hospital} onChange={v => update(p.id, { transported_to_hospital: v })} />
                          </BoolRow>
                        </div>
                      </div>
                    )}
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
