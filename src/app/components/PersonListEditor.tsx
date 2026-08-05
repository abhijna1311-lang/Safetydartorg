import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { YesNoToggle } from './form/YesNoToggle';
import type { Person } from '../types/accident-report';

const opt = (arr: string[]) => arr.map(v => ({ value: v, label: v }));
const ROLES = opt(['Passenger', 'Pedestrian']);
const GENDERS = opt(['Female', 'Male']);
const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const BODY_PARTS = opt(['Head', 'Upper body', 'Lower body']);
const PASSENGER_ACTIONS = opt(['Boarding Bus', 'Alighting Bus', 'On Board']);
const DOORS = opt(['Front doors', 'Rear doors']);
const PEDESTRIAN_TYPES = opt(['On Foot/Wheelchair/Walker/Cane/Crutches', 'Using Micro Mobility']);
const PED_ACTIONS_FOOT = opt(['Standing', 'Walking', 'Jogging/Running', 'Mobility Assistance', 'Laying', 'Sitting']);
const PED_ACTIONS_MICRO = opt(['Going Straight', 'Making a Left Turn', 'Making a Right Turn', 'Going Backwards', 'Changing Lanes', 'Stopped', 'Negotiating a Curve']);

const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;
const ROLE_GLYPH: Record<string, string> = { Operator: 'badge', Passenger: 'event_seat', Pedestrian: 'directions_walk' };

// Field wrapper matching the rest of the form (dart-field-label + dart-req).
function Field({ label, required, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="dart-field-label">{label}{required && <span className="dart-req ml-1">*</span>}</label>
      {children}
    </div>
  );
}

// Small eyebrow that titles each chunk of the editor.
function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 font-['Poppins']">{children}</p>;
}

// A stacked question row: label on the left, control on the right (matches the Police section).
function BoolRow({ label, required, error = false, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3 ${error ? 'bg-red-50/50' : ''}`}>
      <p className={`dart-field-label sm:flex-1 ${error ? 'text-red-600' : ''}`} style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className={`shrink-0 ${error ? 'dart-field-error' : ''}`}>{children}</div>
    </div>
  );
}

interface Props {
  people: Person[];
  onChange: (people: Person[]) => void;
  showErrors?: boolean;
  injuryDetailsRequired?: boolean;
}

export function PersonListEditor({ people, onChange, showErrors = false, injuryDetailsRequired = true }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Person>) =>
    onChange(people.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const addPerson = () => {
    const id = `person-${Date.now()}`;
    onChange([...people, { id, role: 'Passenger', name: '' }]);
    setOpenId(id);
  };

  const remove = (id: string) => {
    onChange(people.filter(p => p.id !== id));
    if (openId === id) setOpenId(null);
  };

  // Changing the role clears the fields that only apply to another role.
  const changeRole = (id: string, r: string) =>
    update(id, { role: r as Person['role'], passenger_action: undefined, which_door: undefined, courtesy_card: undefined, pedestrian_type: undefined, pedestrian_action: undefined });

  // Not injured clears everything that only applies to an injured person.
  const setInjured = (id: string, v: boolean) =>
    update(id, v ? { injured: true } : { injured: false, fatal: undefined, injured_body_part: undefined, courtesy_card: undefined, transported_to_hospital: false });

  const AddButton = (
    <button
      type="button"
      onClick={addPerson}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#007DBA]/40 bg-[#f2f8fc] px-3.5 py-2.5 text-sm font-semibold text-[#007DBA] transition-colors hover:border-[#007DBA] hover:bg-[#e8f3fa] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
    >
      <Plus className="h-4 w-4" /> Add person
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
        <p className="mt-4 text-sm font-semibold text-slate-700 font-['Poppins']">No people added yet <span className="dart-req">*</span></p>
        <p className="mt-1 text-xs text-slate-400 font-['Poppins']">Click to add each person involved &mdash; operator, passengers, or pedestrians.</p>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {people.map((p, idx) => {
        const open = openId === p.id;
        const role = p.role;
        const injured = !!p.injured;
        const isPassenger = role === 'Passenger';
        const isPedestrian = role === 'Pedestrian';
        const showFled = isPassenger || isPedestrian;
        const showDoor = isPassenger && (p.passenger_action === 'Boarding Bus' || p.passenger_action === 'Alighting Bus');
        const recordComplete = (
          (!isPassenger || (!!p.passenger_action && (!showDoor || !!p.which_door)))
          && (!isPedestrian || (!!p.pedestrian_type && !!p.pedestrian_action))
          && !!p.gender
          && p.is_dart_employee !== undefined
          && (!injuryDetailsRequired || (
            p.injured !== undefined
            && (!p.injured || (!!p.injured_body_part && p.transported_to_hospital !== undefined))
            && p.fled_scene !== undefined
            && (!isPassenger || !p.injured || p.courtesy_card !== undefined)
          ))
        );
        const pedActions = p.pedestrian_type === 'Using Micro Mobility' ? PED_ACTIONS_MICRO : PED_ACTIONS_FOOT;
        const displayName = p.name || `${role} ${idx + 1}`;
        const pedTypeShort = p.pedestrian_type === 'Using Micro Mobility'
          ? 'Micro-mobility'
          : p.pedestrian_type === 'On Foot/Wheelchair/Walker/Cane/Crutches'
            ? 'On foot'
            : p.pedestrian_type;
        const details: string[] = [];
        if (p.name) details.push(role); // role only needed when the title is a name
        if (isPassenger) {
          if (p.passenger_action) details.push(p.passenger_action);
          if (p.which_door) details.push(p.which_door);
        }
        if (isPedestrian) {
          if (pedTypeShort) details.push(pedTypeShort);
          if (p.pedestrian_action) details.push(p.pedestrian_action);
        }
        if (p.injured && p.injured_body_part) details.push(p.injured_body_part);
        if (p.fled_scene) details.push('Fled scene');
        if (isPassenger && p.courtesy_card) details.push('Courtesy card');
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
              {p.transported_to_hospital && (
                <span className="hidden items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 font-['Poppins'] sm:inline-flex">
                  <span className="material-symbols-rounded text-[14px]">local_hospital</span> Transported
                </span>
              )}
              {(p.fatal || p.injured) && (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold font-['Poppins'] ${p.fatal ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{p.fatal ? 'Fatal' : 'Injured'}</span>
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
                    {/* Details */}
                    <div>
                      <GroupLabel>Details</GroupLabel>
                      {(() => {
                        // Uneven spans on a 12-col grid so the long "At the time of the event" label gets more room; short fields (Role, DART, Which door) shrink to keep everything on one line.
                        const roleSpan = 'lg:col-span-2';
                        const dartSpan = 'lg:col-span-2';
                        const genderSpan = isPassenger && !showDoor ? 'lg:col-span-3' : 'lg:col-span-2';
                        const actionSpan = isPassenger && !showDoor ? 'lg:col-span-5' : 'lg:col-span-4';
                        const doorSpan = 'lg:col-span-2';
                        const pedTypeSpan = 'lg:col-span-3';
                        const pedActionSpan = 'lg:col-span-3';
                        return (
                        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-12">
                          <Field label="Role" required className={roleSpan}>
                            <CustomSelect value={role} onChange={v => changeRole(p.id, v)} options={ROLES} placeholder="Select role" />
                          </Field>
                          <Field label="DART employee?" required className={dartSpan}>
                            <CustomSelect
                              value={p.is_dart_employee === undefined ? '' : (p.is_dart_employee ? 'yes' : 'no')}
                              onChange={v => update(p.id, { is_dart_employee: v === 'yes' })}
                              options={YES_NO}
                              placeholder="Select"
                              error={showErrors && p.is_dart_employee === undefined}
                            />
                          </Field>
                          <Field label="Gender" required className={genderSpan}>
                            <CustomSelect value={p.gender || ''} onChange={v => update(p.id, { gender: v as 'Female' | 'Male' })} options={GENDERS} placeholder="Select" error={showErrors && !p.gender} />
                          </Field>

                          {isPassenger && (
                            <>
                              <Field label="At the time of the event, the passenger was" required className={actionSpan}>
                                <CustomSelect value={p.passenger_action || ''} onChange={v => update(p.id, { passenger_action: v, which_door: undefined })} options={PASSENGER_ACTIONS} placeholder="Select" error={showErrors && !p.passenger_action} />
                              </Field>
                              {showDoor && (
                                <Field label="Which door?" required className={doorSpan}>
                                  <CustomSelect value={p.which_door || ''} onChange={v => update(p.id, { which_door: v })} options={DOORS} placeholder="Select" error={showErrors && !p.which_door} />
                                </Field>
                              )}
                            </>
                          )}

                          {isPedestrian && (
                            <>
                              <Field label="Pedestrian type" required className={pedTypeSpan}>
                                <CustomSelect value={p.pedestrian_type || ''} onChange={v => update(p.id, { pedestrian_type: v, pedestrian_action: undefined })} options={PEDESTRIAN_TYPES} placeholder="Select" error={showErrors && !p.pedestrian_type} />
                              </Field>
                              <Field label="Pedestrian action" required className={pedActionSpan}>
                                <CustomSelect value={p.pedestrian_action || ''} onChange={v => update(p.id, { pedestrian_action: v })} options={pedActions} placeholder="Select" error={showErrors && !p.pedestrian_action} />
                              </Field>
                            </>
                          )}
                        </div>
                        );
                      })()}
                    </div>

                    {/* Injury */}
                    <div>
                      <GroupLabel>Injury</GroupLabel>
                      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                        <BoolRow label="Was this person injured?" required={injuryDetailsRequired} error={showErrors && injuryDetailsRequired && p.injured === undefined}>
                          <YesNoToggle value={p.injured} onChange={v => setInjured(p.id, v)} />
                        </BoolRow>
                        <AnimatePresence initial={false}>
                          {injured && (
                            <motion.div
                              key="injury-sub"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                              className="overflow-hidden divide-y divide-slate-100 bg-slate-50/50"
                            >
                              <BoolRow label="Injured body part" required={injuryDetailsRequired} error={showErrors && injuryDetailsRequired && !p.injured_body_part}>
                                <div className="w-full sm:w-60">
                                  <CustomSelect value={p.injured_body_part || ''} onChange={v => update(p.id, { injured_body_part: v })} options={BODY_PARTS} placeholder="Select" error={showErrors && !p.injured_body_part} />
                                </div>
                              </BoolRow>
                              <BoolRow label="Transported to hospital?" required={injuryDetailsRequired} error={showErrors && injuryDetailsRequired && p.transported_to_hospital === undefined}>
                                <YesNoToggle value={p.transported_to_hospital} onChange={v => update(p.id, { transported_to_hospital: v })} />
                              </BoolRow>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Follow-up */}
                    {(showFled || (isPassenger && injured)) && (
                      <div>
                        <GroupLabel>Follow-up</GroupLabel>
                        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                          {showFled && (
                            <BoolRow label="Did they flee the scene?" required={injuryDetailsRequired} error={showErrors && injuryDetailsRequired && p.fled_scene === undefined}>
                              <YesNoToggle value={p.fled_scene} onChange={v => update(p.id, { fled_scene: v })} />
                            </BoolRow>
                          )}
                          {isPassenger && injured && (
                            <BoolRow label="Courtesy card obtained?" required={injuryDetailsRequired} error={showErrors && injuryDetailsRequired && p.courtesy_card === undefined}>
                              <YesNoToggle value={p.courtesy_card} onChange={v => update(p.id, { courtesy_card: v })} />
                            </BoolRow>
                          )}
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
