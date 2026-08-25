import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { FormField as Field } from '../../form/FormField';
import { PeopleImpactSummaryCard } from './PeopleImpactSummaryCard';
import type { AccidentReportData, AssaultPerpetrator } from '../../../types/accident-report';
import {
  ASSAULT_INVOLVES,
  ASSAULT_METHODS,
  ASSAULT_TYPES,
  getVehicle2TypeOptions,
  getAssaultTriggerOptions,
  INJURED_BODY_PARTS,
  PERPETRATOR_AGES,
  PERPETRATOR_GENDERS,
  WHO_ASSAULTED,
  isAssaultTriggerAllowed,
} from './assault/assaultFlow';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  showErrors?: boolean;
}

const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;
const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));
const AGE_LABEL: Record<string, string> = { child: 'Child (12 & under)', teen: 'Teen (13–18)', adult: 'Adult (19–60)', senior: 'Senior (61+)' };
const TRI_STATE_OPTIONS = ['Yes', 'No', 'Unknown'].map((value) => ({ value, label: value }));

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

function FollowUpControl({ children }: { children: React.ReactNode }) {
  return <div className="w-full sm:w-72 [&_.dart-seg]:grid [&_.dart-seg]:w-full">{children}</div>;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 font-['Poppins']">{children}</p>;
}

function Show({ when, children }: { when: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {when && <motion.div key="f" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{children}</motion.div>}
    </AnimatePresence>
  );
}

// ── Perpetrator card-list editor — mirrors PersonListEditor's card anatomy ─────
// Collapsible card per perpetrator: avatar + title + subtitle + delete, an inline
// editor (Details / Follow-up) and a Done button, with an "Add perpetrator" affordance.
function PerpetratorListEditor({ list, onChange, showErrors, assaultType, assaultTrigger, assaultInvolves, mode, onAssaultChange, vehicle2IsDartVehicle, vehicle2Type, onVehicle2Change }: {
  list: AssaultPerpetrator[] | undefined;
  onChange: (next: AssaultPerpetrator[]) => void;
  showErrors: boolean;
  assaultType?: AccidentReportData['assault_type'];
  assaultTrigger?: string;
  assaultInvolves?: AccidentReportData['assault_involves'];
  mode?: string;
  onAssaultChange: (patch: Partial<AccidentReportData>) => void;
  vehicle2IsDartVehicle?: boolean;
  vehicle2Type?: string;
  onVehicle2Change: (patch: Partial<AccidentReportData>) => void;
}) {
  const people = list ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const update = (id: string, patch: Partial<AssaultPerpetrator>) => onChange(people.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => { onChange(people.filter((p) => p.id !== id)); if (openId === id) setOpenId(null); };
  const addPerson = () => {
    const id = `perp-${Date.now()}`;
    onChange([...people, { id }]);
    setOpenId(id);
  };
  const complete = (p: AssaultPerpetrator) => (
    !!p.who_assaulted
    && (assaultType === 'Verbal Assault' || !!p.assault_method)
    && !!p.age
    && !!p.gender
    && (assaultType === 'Verbal Assault' || p.spat_on !== undefined)
    && p.fled_scene !== undefined
    && !!p.perpetrator_arrested
    && (p.who_assaulted === 'motorist' || p.fled_scene === true || !!p.perpetrator_removed_from_dart_vehicle)
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
        <p className="mt-4 text-sm font-semibold text-slate-700 font-['Poppins']">No perpetrators added yet <span className="dart-req">*</span></p>
        <p className="mt-1 text-xs text-slate-400 font-['Poppins']">Click to add each person who assaulted the employee.</p>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {people.map((p, idx) => {
        const open = openId === p.id;
        const details: string[] = [];
        const whoLabel = WHO_ASSAULTED.find((option) => option.value === p.who_assaulted)?.label;
        if (whoLabel) details.push(whoLabel);
        if (p.assault_method) details.push(p.assault_method);
        if (p.age) details.push(AGE_LABEL[p.age] || p.age);
        if (p.gender) details.push(p.gender);
        if (p.spat_on !== undefined) details.push(p.spat_on ? 'Spat on' : 'No spitting');
        if (p.fled_scene) details.push('Fled scene');
        const subtitle = details.join(' · ');
        const displayName = `Perpetrator ${idx + 1}`;
        return (
          <div key={p.id} className={`overflow-hidden rounded-xl border bg-white transition-shadow ${showErrors && !complete(p) ? 'border-red-300' : open ? 'border-[#112458]/30 shadow-sm' : 'border-slate-200/70'}`}>
            {/* Summary row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf1fb] text-[#1c3570]">
                <span className="material-symbols-rounded text-[19px]">person</span>
              </span>
              <button type="button" onClick={() => setOpenId(open ? null : p.id)} className="min-w-0 flex-1 text-left focus:outline-none">
                <p className="truncate text-sm font-semibold text-slate-800 font-['Poppins']">{displayName}</p>
                <p className={`truncate text-xs font-['Poppins'] ${subtitle ? 'text-slate-500' : 'italic text-slate-400'}`}>{subtitle || 'No details added yet'}</p>
              </button>
              {p.fled_scene === true && (
                <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold font-['Poppins'] bg-amber-100 text-amber-700">Fled</span>
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
                    <div>
                      <GroupLabel>Assault information</GroupLabel>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                        <Field label="Assault type" required error={showErrors && !assaultType}>
                          <CustomSelect value={assaultType || ''} onChange={(v) => onAssaultChange({ assault_type: v as AccidentReportData['assault_type'] })} options={ASSAULT_TYPES.map((option) => ({ value: option.value, label: option.label }))} placeholder="Select" />
                        </Field>
                        <Field label="Assault involves" required error={showErrors && !assaultInvolves}>
                          <CustomSelect value={assaultInvolves || ''} onChange={(v) => onAssaultChange({ assault_involves: v as AccidentReportData['assault_involves'], who_assaulted: undefined })} options={ASSAULT_INVOLVES.map((option) => ({ value: option.value, label: option.label }))} placeholder="Select" />
                        </Field>
                      </div>
                    </div>
                    <div>
                      <GroupLabel>Assault behavior</GroupLabel>
                      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                        <BoolRow label="Assault trigger" required>
                          <FollowUpControl>
                            <CustomSelect value={assaultTrigger || ''} onChange={(v) => onAssaultChange({ assault_trigger: v })} options={toOptions(getAssaultTriggerOptions(mode))} placeholder="Select" error={showErrors && !assaultTrigger} />
                          </FollowUpControl>
                        </BoolRow>
                        {assaultType !== 'Verbal Assault' && (
                          <>
                          <BoolRow label="Assault method" required>
                            <FollowUpControl>
                              <CustomSelect value={p.assault_method || ''} onChange={(v) => update(p.id, { assault_method: v })} options={ASSAULT_METHODS.map((m) => ({ value: m, label: m }))} placeholder="Select" error={showErrors && !p.assault_method} />
                            </FollowUpControl>
                          </BoolRow>
                          <BoolRow label="Spat on?" required>
                            <FollowUpControl>
                              <YesNoToggle value={p.spat_on} onChange={(v) => update(p.id, { spat_on: v })} />
                            </FollowUpControl>
                          </BoolRow>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <GroupLabel>Person details</GroupLabel>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Who assaulted the employee" required error={showErrors && !p.who_assaulted}>
                          <CustomSelect value={p.who_assaulted || ''} onChange={(v) => update(p.id, { who_assaulted: v as AssaultPerpetrator['who_assaulted'], ...(v === 'motorist' ? { perpetrator_removed_from_dart_vehicle: undefined } : {}) })} options={WHO_ASSAULTED.map((o) => ({ value: o.value, label: o.label }))} placeholder="Select" />
                        </Field>
                        <Field label="Age" required>
                          <CustomSelect value={p.age || ''} onChange={(v) => update(p.id, { age: v as AssaultPerpetrator['age'] })} options={PERPETRATOR_AGES.map((o) => ({ value: o.value, label: o.label }))} placeholder="Select" />
                        </Field>
                        <Field label="Gender" required>
                          <CustomSelect value={p.gender || ''} onChange={(v) => update(p.id, { gender: v as AssaultPerpetrator['gender'] })} options={PERPETRATOR_GENDERS.map((o) => ({ value: o.value, label: o.label }))} placeholder="Select" />
                        </Field>
                      </div>
                    </div>
                    {p.who_assaulted === 'motorist' && (
                      <div>
                        <GroupLabel>Vehicle</GroupLabel>
                        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                          <BoolRow label="Was the other vehicle #2 a DART vehicle?" required>
                            <FollowUpControl>
                              <YesNoToggle value={vehicle2IsDartVehicle} onChange={(value) => onVehicle2Change({ vehicle2_is_dart_vehicle: value, vehicle2_type: undefined })} />
                            </FollowUpControl>
                          </BoolRow>
                          <BoolRow label="Other vehicle #2 type" required>
                            <FollowUpControl>
                              <CustomSelect value={vehicle2Type || ''} onChange={(value) => onVehicle2Change({ vehicle2_type: value })} options={getVehicle2TypeOptions(vehicle2IsDartVehicle)} placeholder="Select vehicle type" error={showErrors && !vehicle2Type} />
                            </FollowUpControl>
                          </BoolRow>
                        </div>
                      </div>
                    )}
                    <div>
                      <GroupLabel>Follow-up</GroupLabel>
                      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                        <BoolRow label="Did the perpetrator flee the scene?" required>
                          <FollowUpControl>
                            <YesNoToggle value={p.fled_scene} onChange={(v) => update(p.id, { fled_scene: v, ...(v ? { perpetrator_removed_from_dart_vehicle: undefined } : {}) })} />
                          </FollowUpControl>
                        </BoolRow>
                        <BoolRow label="Was the perpetrator arrested?" required>
                          <FollowUpControl>
                            <CustomSelect value={p.perpetrator_arrested || ''} onChange={(v) => update(p.id, { perpetrator_arrested: v as AssaultPerpetrator['perpetrator_arrested'] })} options={TRI_STATE_OPTIONS} placeholder="Select" error={showErrors && !p.perpetrator_arrested} />
                          </FollowUpControl>
                        </BoolRow>
                        {p.who_assaulted !== 'motorist' && p.fled_scene !== true && (
                          <BoolRow label="Was the perpetrator removed from the DART vehicle?" required>
                            <FollowUpControl>
                              <CustomSelect value={p.perpetrator_removed_from_dart_vehicle || ''} onChange={(v) => update(p.id, { perpetrator_removed_from_dart_vehicle: v as AssaultPerpetrator['perpetrator_removed_from_dart_vehicle'] })} options={TRI_STATE_OPTIONS} placeholder="Select" error={showErrors && !p.perpetrator_removed_from_dart_vehicle} />
                            </FollowUpControl>
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

      <button
        type="button"
        onClick={addPerson}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#007DBA]/40 bg-[#f2f8fc] px-3.5 py-2.5 text-sm font-semibold text-[#007DBA] transition-colors hover:border-[#007DBA] hover:bg-[#e8f3fa] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
      >
        <Plus className="h-4 w-4" /> Add perpetrator
      </button>
    </div>
  );
}

export function AssaultPeopleImpactSection({ data, onUpdate, showErrors = false }: Props) {
  const allPerps = data.assault_perpetrators ?? [];
  const totalPerpetrators = allPerps.length;
  const fledCount = allPerps.filter((p) => p.fled_scene === true).length;
  const perpetratorParts = WHO_ASSAULTED.map((option) => ({
    key: option.value,
    glyph: option.value === 'motorist' ? 'directions_car' : option.value === 'customer_on_board' ? 'event_seat' : 'directions_walk',
    title: option.label,
    value: allPerps.filter((p) => p.who_assaulted === option.value).length,
  }));

  useEffect(() => {
    const hasInvalidTrigger = allPerps.some((person) => !isAssaultTriggerAllowed(person.assault_trigger, data.mode));
    if (!hasInvalidTrigger) return;
    onUpdate({
      assault_perpetrators: allPerps.map((person) => (
        !isAssaultTriggerAllowed(person.assault_trigger, data.mode)
        ? { ...person, assault_trigger: undefined }
        : person
      )),
    });
  }, [allPerps, data.mode, onUpdate]);

  return (
    <div className="dart-card dart-card--surface overflow-hidden">
      {/* Top-line summary */}
      <div className="px-6 py-6 md:px-7 md:py-7">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="lg:flex-1">
            <PeopleImpactSummaryCard glyph="groups" tone="bg-[#eaf1fb] text-[#1c3570]" total={totalPerpetrators} label="Perpetrators" parts={perpetratorParts} />
          </div>
          <div className="lg:flex-1">
            <PeopleImpactSummaryCard glyph="directions_run" tone="bg-red-50 text-red-500" total={fledCount} label="Fled the scene" />
          </div>
        </div>
      </div>

      {/* 1 — Employee who submitted the report */}
      <Section title="Employee Who Submitted The Report" help="Record the employee's injury status and response.">
        <div className={`overflow-hidden rounded-xl border bg-white divide-y divide-slate-100 ${showErrors && data.operator_injured === undefined ? 'border-red-300' : 'border-slate-200/70'}`}>
          <BoolRow label="Was the employee injured?" required>
            <YesNoToggle value={data.operator_injured} onChange={(v) => onUpdate({ operator_injured: v, ...(v ? {} : { operator_injured_body_part: undefined }) })} />
          </BoolRow>
          <AnimatePresence initial={false}>
            {data.operator_injured === true && (
              <motion.div key="inj" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }} className="overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                <BoolRow label="Injured Body Part of Employee" required>
                  <div className="w-full sm:w-60">
                    <CustomSelect value={data.operator_injured_body_part || ''} onChange={(v) => onUpdate({ operator_injured_body_part: v })} options={toOptions(INJURED_BODY_PARTS)} placeholder="Select" error={showErrors && !data.operator_injured_body_part} />
                  </div>
                </BoolRow>
              </motion.div>
            )}
          </AnimatePresence>
          <BoolRow label="Was the employee transported to the hospital?" required>
            <YesNoToggle value={data.operator_transported} onChange={(v) => onUpdate({ operator_transported: v })} />
          </BoolRow>
          <BoolRow label="Did the employee notify law enforcement?" required>
            <YesNoToggle value={data.notified_law_enforcement} onChange={(v) => onUpdate({ notified_law_enforcement: v })} />
          </BoolRow>
          <BoolRow label="Did the employee contact a supervisor?" required>
            <YesNoToggle value={data.contacted_supervisor} onChange={(v) => onUpdate({ contacted_supervisor: v })} />
          </BoolRow>
        </div>
      </Section>

      {/* 2 — Perpetrators. Every card owns the complete perpetrator answer set. */}
      <Section title="Perpetrator who assaulted DART employee" help="Who assaulted the employee, how, and each person involved — one card per perpetrator.">
          {data.assault_involves !== 'worker_assaulted_worker' && (
            <PerpetratorListEditor
              list={data.assault_perpetrators}
              onChange={(next) => onUpdate({ assault_perpetrators: next })}
              showErrors={showErrors}
              assaultType={data.assault_type}
              assaultTrigger={data.assault_trigger}
              assaultInvolves={data.assault_involves}
              mode={data.mode}
              vehicle2IsDartVehicle={data.vehicle2_is_dart_vehicle}
              vehicle2Type={data.vehicle2_type}
              onVehicle2Change={onUpdate}
              onAssaultChange={(patch) => {
                if (patch.assault_type === 'Verbal Assault') {
                  onUpdate({
                    ...patch,
                    assault_perpetrators: (data.assault_perpetrators || []).map((person) => ({ ...person, assault_method: undefined, spat_on: undefined })),
                  });
                  return;
                }
                onUpdate(patch);
              }}
            />
          )}
      </Section>
    </div>
  );
}
