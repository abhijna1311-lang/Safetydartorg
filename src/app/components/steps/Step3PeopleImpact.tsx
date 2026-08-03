import { useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { CustomSelect } from '../CustomSelect';
import { YesNoToggle } from '../form/YesNoToggle';
import { PersonListEditor } from '../PersonListEditor';
import { OtherVehiclesEditor } from '../OtherVehiclesEditor';
import { OperatorReportDrawer } from './sections/OperatorReportDrawer';
import type { AccidentReportData, Person } from '../../types/accident-report';
import type { UserRole } from '../../context/UserRoleContext';
import type { WorkflowSectionKey, WorkflowSections } from '../../types/workflow-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  workflowStage?: 'initiation' | 'operator-completion' | 'supervisor-review' | 'program-manager-review' | 'closed';
  initiatedBy?: UserRole;
  activeSectionKey?: WorkflowSectionKey;
  sectionStatuses?: WorkflowSections;
}

const BODY_PARTS = ['Head', 'Upper body', 'Lower body'].map(v => ({ value: v, label: v }));
const POLICE_TYPE = ['DART', 'Other'].map(v => ({ value: v, label: v }));
const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };
const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;
const inputCls = "dart-input-base";

// Read-only summary card (supervisor review).
function Card({ title, complete, children }: { title: string; complete?: boolean; children: React.ReactNode }) {
  return (
    <div className="dart-card dart-card--surface">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

// Divider section on one shared surface — matches the rest of the form.
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

// Inline yes/no (or short-control) row, grouped in a bordered card.
function BoolRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={error ? 'dart-field-error' : ''}>{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600 font-['Poppins']">{label} is required.</p>}
    </div>
  );
}

// A KPI card. The optional per-type breakdown sits inline to the right of the icon + number.
function SummaryCard({ glyph, tone, total, label, parts }: { glyph: string; tone: string; total: number; label: string; parts?: { key: string; glyph: string; title: string; value: number }[] }) {
  return (
    <div className="h-full rounded-xl border border-slate-200/70 bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
            <span className="material-symbols-rounded text-[19px]">{glyph}</span>
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-none text-slate-800 font-['Poppins'] dart-tabular">{total}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 font-['Poppins']">{label}</p>
          </div>
        </div>
        {parts && parts.length > 0 && (
          <div className="ml-auto grid grid-cols-3 divide-x divide-slate-100 border-l border-slate-100 pl-2">
            {parts.map(p => (
              <div key={p.key} aria-label={p.title} className="group relative flex flex-col items-center gap-0.5 px-6">
                <span className={`material-symbols-rounded text-[15px] ${p.value > 0 ? 'text-[#1c3570]' : 'text-slate-300'}`}>{p.glyph}</span>
                <span className={`text-[13px] font-semibold font-['Poppins'] dart-tabular ${p.value > 0 ? 'text-slate-700' : 'text-slate-300'}`}>{p.value}</span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 font-['Poppins']">
                  {p.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Step3PeopleImpact({
  data,
  onUpdate,
  onNext,
  onBack,
  onSaveDraft,
  workflowStage = 'operator-completion',
  initiatedBy = 'Operator',
  activeSectionKey = 'operator',
  sectionStatuses,
}: Props) {
  // Determine collision type (Bus vs LRV path) — used in the context banner.
  const collisionType = data.collision_type || data.lrv_collision_type || '';
  const isAutoCollision = /auto/i.test(collisionType);
  const isRevenueMode = ['Bus', 'Light Rail Vehicle', 'Streetcar'].includes(data.mode || '');
  const isHiRail = data.mode === 'Hi-Rail';
  const isInitiationStage = workflowStage === 'initiation';
  const isSupervisorReview = activeSectionKey === 'supervisor';
  const canOpenOperatorReport = isSupervisorReview && !isInitiationStage;
  const [isOperatorReportOpen, setIsOperatorReportOpen] = useState(false);

  // People involved — top-line KPIs summarize the whole step (operator + employees + passengers + pedestrians).
  const people = data.people ?? [];
  const pedestrianCount = people.filter(p => p.role === 'Pedestrian').length;
  const employeesInjured = (data.operator_injured ? 1 : 0) + (data.other_employees_injured_count || 0);
  const employeesTransported = data.operator_transported ? 1 : 0;
  const passengersInjuredCount = people.filter(p => p.role === 'Passenger' && p.injured).length;
  const totalPeople = 1 /* operator */ + (data.other_employees_injured_count || 0) + (data.passengers_on_board || 0) + pedestrianCount;
  const withInjuries = employeesInjured + people.filter(p => p.injured).length;
  const transportedCount = employeesTransported + people.filter(p => p.transported_to_hospital).length;
  const byRole = (role: Person['role'], pred: (p: Person) => boolean) => people.filter(p => p.role === role && pred(p)).length;
  const injuredParts = [
    { key: 'emp', glyph: 'badge', title: 'Employees', value: employeesInjured },
    { key: 'pax', glyph: 'event_seat', title: 'Passengers', value: byRole('Passenger', p => !!p.injured) },
    { key: 'ped', glyph: 'directions_walk', title: 'Pedestrians', value: byRole('Pedestrian', p => !!p.injured) },
  ];
  const transportedParts = [
    { key: 'emp', glyph: 'badge', title: 'Employees', value: employeesTransported },
    { key: 'pax', glyph: 'event_seat', title: 'Passengers', value: byRole('Passenger', p => p.transported_to_hospital) },
    { key: 'ped', glyph: 'directions_walk', title: 'Pedestrians', value: byRole('Pedestrian', p => p.transported_to_hospital) },
  ];

  const personComplete = (person: Person) => {
    const passengerComplete = person.role !== 'Passenger' || !!person.passenger_action
      && (!['Boarding Bus', 'Alighting Bus'].includes(person.passenger_action) || !!person.which_door);
    const pedestrianComplete = person.role !== 'Pedestrian' || !!person.pedestrian_type && !!person.pedestrian_action;
    const injuryComplete = isHiRail || (person.injured !== undefined
      && (!person.injured || (person.fatal !== undefined && !!person.injured_body_part && person.transported_to_hospital !== undefined)));
    const followUpComplete = isHiRail || (person.fled_scene !== undefined
      && (person.role !== 'Passenger' || !person.injured || person.courtesy_card !== undefined));
    return passengerComplete && pedestrianComplete && injuryComplete && followUpComplete;
  };
  const vehicleComplete = (vehicle: NonNullable<AccidentReportData['other_vehicles']>[number]) => (
    vehicle.occupants !== undefined
    && ((vehicle.occupants || 0) < 1 || (
      vehicle.fatalities !== undefined
      && (isHiRail || (vehicle.injuries !== undefined && vehicle.fled !== undefined
      && ((vehicle.injuries || 0) < 1 || vehicle.transported !== undefined)))
    ))
    && vehicle.dart_dart !== undefined && !!vehicle.vehicle_type && !!vehicle.action
    && !!vehicle.point_of_impact && !!vehicle.direction && vehicle.damage !== undefined
    && (!vehicle.damage || (Array.isArray(vehicle.damage_area) && vehicle.damage_area.length > 0))
  );
  const operatorAnswered = isHiRail || (data.operator_injured !== undefined
    && (!data.operator_injured || (!!data.operator_injured_body_part && data.operator_transported !== undefined))
    && data.other_employees_injured_count !== undefined);
  const passengersAnswered = data.passengers_on_board !== undefined;
  const peopleAnswered = data.people_involved !== undefined
    && (data.people_involved !== true || (people.length > 0 && people.every(personComplete)));
  const vehiclesAnswered = !isAutoCollision
    || ((data.other_vehicles?.length || 0) > 0 && (data.other_vehicles || []).every(vehicleComplete));
  const canProceed = isInitiationStage || isSupervisorReview
    ? true
    : (operatorAnswered && passengersAnswered && peopleAnswered && vehiclesAnswered);
  const [showErrors, setShowErrors] = useState(false);
  const handleNextClick = () => {
    if (canProceed) {
      setShowErrors(false);
      onNext();
    } else {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const contextTone = isSupervisorReview
    ? {
        container: 'border-[#0078AE]/30 bg-[#0078AE]/10',
        icon: 'text-[#0078AE]',
        text: 'text-[#00205B]',
      }
    : isInitiationStage
    ? {
        container: 'border-slate-300 bg-slate-50',
        icon: 'text-slate-500',
        text: 'text-slate-700',
      }
    : {
        container: 'border-slate-200 bg-slate-50',
        icon: 'text-slate-500',
        text: 'text-slate-700',
      };

  return (
    <StepContainer
      stepNumber={3}
      title="People And Impact"
      description="Record injuries, passengers, pedestrians, and other vehicles involved."
    >
      {showErrors && !canProceed && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-800 font-['Poppins']">Please complete the required fields highlighted below to continue.</p>
        </div>
      )}
      {/* Context */}
      <div className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-2.5 ${contextTone.container}`}>
        <Info className={`h-4 w-4 flex-shrink-0 ${contextTone.icon}`} />
        <p className={`text-xs leading-5 font-['Poppins'] ${contextTone.text}`}>
          {isInitiationStage ? (
            <>This case was initiated by a <strong>{initiatedBy}</strong>. People and injury details are completed by the operator after handoff.</>
          ) : isSupervisorReview ? (
            <>Operator people and impact entries are read-only during supervisor review. Refer to the operator report while completing your section.</>
          ) : (
            <>Event: <strong>{data.event_type}</strong> · Mode: <strong>{data.mode}</strong>
            {collisionType && <> · Collision type: <strong>{collisionType}</strong></>}</>
          )}
        </p>
      </div>

      {canOpenOperatorReport && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOperatorReportOpen(true)}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
          >
            Open operator report (read-only)
          </button>
        </div>
      )}

      <div className="space-y-5">
          {isInitiationStage ? (
            <div className="dart-card dart-card--surface p-6">
            <h3 className="text-sm font-semibold text-slate-900 font-['Poppins']">Operator completion happens in the next stage</h3>
            <p className="mt-2 text-sm text-slate-600 font-['Poppins']">
              The starter scenario stops here for people and impact. After handoff, the operator will complete injury, passenger, pedestrian, vehicle, and police details.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Operator injury status', 'Other employee injuries', 'Passenger details', 'Pedestrian details', 'Police and investigation details'].map((item) => (
                <span key={item} className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 font-['Poppins']">
                  {item}
                </span>
              ))}
            </div>
            </div>
          ) : isSupervisorReview ? (
            <>
              <div className="rounded-xl border border-[#0078AE]/30 bg-[#0078AE]/10 px-5 py-4">
                <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">Read-only operator section</p>
                <p className="mt-1 text-xs text-[#0A4F75] font-['Poppins']">Field Supervisor cannot alter operator people-impact entries in this FIR-style workflow.</p>
              </div>
              <Card title="Operator people and impact summary" complete={data.operator_injured !== undefined}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Operator injured</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.operator_injured === true ? 'Yes' : data.operator_injured === false ? 'No' : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Other employees injured</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.other_employees_injured_count ?? 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Total people</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins'] dart-tabular">{totalPeople}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">With injuries</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins'] dart-tabular">{withInjuries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Transported to hospital</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins'] dart-tabular">{transportedCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Police at scene</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.police_at_scene === true ? 'Yes' : data.police_at_scene === false ? 'No' : 'Not provided'}</p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="dart-card dart-card--surface overflow-hidden">

              {/* Top-line summary — sits above all sections */}
              <div className="px-6 py-6 md:px-7 md:py-7">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="lg:w-52 lg:shrink-0">
                    <SummaryCard glyph="groups" tone="bg-[#eaf1fb] text-[#1c3570]" total={totalPeople} label="Total people" />
                  </div>
                  <div className="lg:flex-1">
                    <SummaryCard glyph="personal_injury" tone="bg-amber-50 text-amber-600" total={withInjuries} label="With injuries" parts={injuredParts} />
                  </div>
                  <div className="lg:flex-1">
                    <SummaryCard glyph="local_hospital" tone="bg-red-50 text-red-500" total={transportedCount} label="Transported" parts={transportedParts} />
                  </div>
                </div>
              </div>

              {/* 1 — Operator and employees */}
              <Section title="Operator and employees" help="Your injury status is required. Other DART employees on board are recorded as a count.">
                <div className={`overflow-hidden rounded-xl border bg-white divide-y divide-slate-100 ${showErrors && !operatorAnswered ? 'border-red-300' : 'border-slate-200/70'}`}>
                  <BoolRow label="Were you injured in this event?" required={!isHiRail}>
                    <YesNoToggle value={data.operator_injured} onChange={v => onUpdate({ operator_injured: v, operator_injured_body_part: v ? data.operator_injured_body_part : undefined, operator_transported: v ? data.operator_transported : undefined })} />
                  </BoolRow>
                  <AnimatePresence initial={false}>
                    {data.operator_injured === true && (
                      <motion.div
                        key="operator-injury"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                        className="overflow-hidden divide-y divide-slate-100 bg-slate-50/50"
                      >
                        <BoolRow label="Injured body part" required={!isHiRail}>
                          <div className="w-full sm:w-60">
                            <CustomSelect value={data.operator_injured_body_part || ''} onChange={v => onUpdate({ operator_injured_body_part: v })} options={BODY_PARTS} placeholder="Select" error={showErrors && !data.operator_injured_body_part} />
                          </div>
                        </BoolRow>
                        <BoolRow label="Were you transported to hospital?" required={!isHiRail}>
                          <YesNoToggle value={data.operator_transported} onChange={v => onUpdate({ operator_transported: v })} />
                        </BoolRow>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <BoolRow label="Other employees injured (excluding you)" required={!isHiRail}>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={data.other_employees_injured_count ?? ''}
                      onChange={e => onUpdate({ other_employees_injured_count: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      placeholder="Enter count"
                      className="dart-input-base w-full text-center sm:w-24"
                    />
                  </BoolRow>
                </div>
              </Section>

              {/* 2 — People involved */}
              <Section title="People involved" help="Record passengers and pedestrians involved so follow-up and care can be handled properly.">
                <div className={`overflow-hidden rounded-xl border bg-white divide-y divide-slate-100 ${showErrors && (data.passengers_on_board === undefined || data.people_involved === undefined) ? 'border-red-300' : 'border-slate-200/70'}`}>
                  {(
                    <BoolRow label="How many passengers were on board?" required>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={data.passengers_on_board ?? ''}
                        onChange={e => onUpdate({ passengers_on_board: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                        placeholder="Enter count"
                        className={`dart-input-base w-full text-center sm:w-24 ${showErrors && data.passengers_on_board === undefined ? 'border-red-400' : ''}`}
                      />
                    </BoolRow>
                  )}
                  <BoolRow label="Was anyone involved in this event?" required>
                    <YesNoToggle value={data.people_involved} onChange={v => onUpdate({ people_involved: v, people: v ? (data.people ?? []) : [] })} />
                  </BoolRow>
                </div>
                {isRevenueMode && data.passengers_on_board !== undefined && passengersInjuredCount > data.passengers_on_board && (
                  <p className="text-xs font-medium text-amber-600 font-['Poppins']">Injured passengers ({passengersInjuredCount}) exceed passengers on board — please verify.</p>
                )}

                <AnimatePresence initial={false}>
                  {data.people_involved === true && (
                    <motion.div
                      key="people-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1">
                        <PersonListEditor people={people} onChange={list => onUpdate({ people: list })} showErrors={showErrors} injuryDetailsRequired={!isHiRail} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Section>

              {/* 3 — Other vehicles (auto collisions only) */}
              {isAutoCollision && (
                <Section title="Other vehicles" help="Add each vehicle involved besides the DART vehicle. Occupants are recorded as counts, not by name.">
                  <OtherVehiclesEditor vehicles={data.other_vehicles ?? []} onChange={list => onUpdate({ other_vehicles: list })} showErrors={showErrors} injuryDetailsRequired={!isHiRail} />
                </Section>
              )}

              {/* 4 — Police */}
              <Section title="Police" help="Police presence and DART supervisor investigation.">
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
                  <BoolRow label="Were police at the scene?">
                    <YesNoToggle value={data.police_at_scene} onChange={v => onUpdate({ police_at_scene: v, police_type: undefined })} />
                  </BoolRow>

                  <AnimatePresence initial={false}>
                    {data.police_at_scene === true && (
                      <motion.div
                        key="police-type"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' } }}
                        className="overflow-hidden bg-slate-50/60 divide-y divide-slate-100"
                      >
                        <BoolRow label="Whose police were they?">
                          <div className="w-full sm:w-56">
                            <CustomSelect value={data.police_type || ''} onChange={v => onUpdate({ police_type: v })} options={POLICE_TYPE} placeholder="Select" />
                          </div>
                        </BoolRow>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <BoolRow label="Was a DART supervisor investigating?">
                    <YesNoToggle value={data.dart_supervisor_investigating} onChange={v => onUpdate({ dart_supervisor_investigating: v })} />
                  </BoolRow>
                </div>
              </Section>

            </div>
          )}

      </div>

      <OperatorReportDrawer
        open={canOpenOperatorReport && isOperatorReportOpen}
        onClose={() => setIsOperatorReportOpen(false)}
        data={data}
        operatorStatus={sectionStatuses?.operator.status}
      />

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={onBack}
          className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
          <GlassButton variant="primary" onClick={handleNextClick}>Next</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}
