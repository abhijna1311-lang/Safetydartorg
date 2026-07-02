import { useState, useRef, useEffect } from 'react';
import { Bus, Train, TramFront, Truck, Car } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { CustomSelect } from '../CustomSelect';
import { YesNoToggle } from '../form/YesNoToggle';
import type { AccidentReportData } from '../../types/accident-report';
import { EMPLOYEE_DB } from '../../data/employeeDatabase';
import { useUserRole } from '../../context/UserRoleContext';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
}

// ── constants ─────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  'Collision',
  'Assault (Verbal or Physical)',
  'Near Miss',
  'Derailment',
  'Fire',
  'Operator/Passenger Events (non-collision)',
  'Trail a Switch',
  'Signal Violation',
].map(v => ({ value: v, label: v }));

const SHOW_DRIVING_QUESTION = ['Assault (Verbal or Physical)', 'Fire', 'Operator/Passenger Events (non-collision)'];

const MODES = [
  { value: 'Bus',                  label: 'Bus',        sublabel: 'Fixed route bus',           icon: Bus },
  { value: 'Light Rail Vehicle',   label: 'Light Rail', sublabel: 'Light rail vehicle',         icon: Train },
  { value: 'Streetcar',            label: 'Streetcar',  sublabel: 'Urban streetcar',            icon: TramFront },
  { value: 'Hi-Rail',              label: 'Hi-Rail',    sublabel: 'On-rail maintenance truck',  icon: Truck },
  { value: 'Non-Revenue Vehicle',  label: 'Non-Revenue',sublabel: 'Non-revenue vehicle',        icon: Car },
] as const;

const EMPTY_EMPLOYEE_FIELDS: Partial<AccidentReportData> = {
  on_behalf_employee: '',
  employee_badge_number: '',
  employee_name: '',
  employee_phone: '',
  employee_gender: '',
  employee_address: '',
  employee_age: '',
  date_of_hire: '',
  employee_status: '',
  department: '',
  assigned_division: '',
  division_supervisor: '',
  division_work: '',
  cost_center: '',
  service_years: '',
  service_months: '',
  service_days: '',
  is_student_employee: undefined,
};

const RDO_CONSECUTIVE = ['Sun/Mon', 'Mon/Tue', 'Tue/Wed', 'Wed/Thu', 'Thu/Fri', 'Fri/Sat', 'Sat/Sun'].map(v => ({ value: v, label: v }));
const RDO_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(v => ({ value: v, label: v }));

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};

// ── helpers ───────────────────────────────────────────────────────────────────
// Numbered section block. Renders as a divider-separated row within the form
// surface — no card chrome, so the whole page reads as one task list.
function Section({ title, help, children }: { title: string; help?: string; complete?: boolean; children: React.ReactNode }) {
  return (
    <div className="py-6 first:pt-0">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-[#00205B] font-['Poppins'] leading-tight">
          {title}
        </h3>
        {help && (
          <p className="text-xs text-slate-500 font-['Poppins'] mt-1">{help}</p>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────
export function Step1IncidentBasics({ data, onUpdate, onNext, onSaveDraft }: Props) {
  const { roleConfig } = useUserRole();
  const isSupervisor = roleConfig.role === 'Supervisor';
  const isProgramManager = roleConfig.role === 'Program Manager';
  const effectiveIsOnBehalf = isProgramManager || data.is_on_behalf === true;

  const hasEventType = !!data.event_type;
  const needsDrivingQ = hasEventType && SHOW_DRIVING_QUESTION.includes(data.event_type!);
  const hasMode = !!data.mode;
  const hasEmployee = !!(data.employee_badge_number && data.employee_name);
  const hasFilingChoice = !isSupervisor || data.is_on_behalf !== undefined;

  const canProceed = hasFilingChoice && hasEventType && hasMode && hasEmployee && (!needsDrivingQ || data.operating_dart_vehicle !== undefined);
  useEffect(() => {
    if (!isProgramManager || data.is_on_behalf === true) return;
    onUpdate({
      is_on_behalf: true,
      ...EMPTY_EMPLOYEE_FIELDS,
    });
  }, [isProgramManager, data.is_on_behalf, onUpdate]);

  // ── Auto-fill employee info from logged-in user ────────────────
  // Runs on mount and whenever the role changes (badge changes)
  // Skipped when filing on behalf of someone else
  const prevBadgeRef       = useRef<string>('');
  const prevIsOnBehalfRef  = useRef<boolean>(effectiveIsOnBehalf);
  useEffect(() => {
    if (effectiveIsOnBehalf) {
      prevIsOnBehalfRef.current = true;
      return; // on-behalf flow fills its own data
    }

    const roleChanged          = prevBadgeRef.current !== roleConfig.badge;
    const switchedFromOnBehalf = prevIsOnBehalfRef.current === true;

    if (!roleChanged && !switchedFromOnBehalf) return; // nothing to do

    prevBadgeRef.current      = roleConfig.badge;
    prevIsOnBehalfRef.current = false;

    const emp = EMPLOYEE_DB[roleConfig.badge];
    if (!emp) return;
    onUpdate({
      employee_badge_number: emp.badge,
      employee_name:         emp.name,
      employee_phone:        emp.phone,
      employee_gender:       emp.gender,
      employee_address:      emp.address,
      employee_age:          emp.age,
      date_of_hire:          emp.hire_date,
      employee_status:       emp.status,
      department:            emp.department,
      assigned_division:     emp.division,
      division_supervisor:   emp.division_supervisor,
      division_work:         emp.division_work,
      cost_center:           emp.cost_center,
      service_years:         emp.service_years,
      service_months:        emp.service_months,
      service_days:          emp.service_days,
      is_student_employee:   emp.is_student,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleConfig.badge, effectiveIsOnBehalf]);

  // ── "On behalf of" combobox state ──────────────────────────────
  const [behalfQuery, setBehalfQuery]           = useState('');
  const [behalfSuggestions, setBehalfSuggestions] = useState<typeof EMPLOYEE_DB[string][]>([]);
  const [showBehalfDropdown, setShowBehalfDropdown] = useState(false);
  const behalfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (behalfRef.current && !behalfRef.current.contains(e.target as Node)) {
        setShowBehalfDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBehalfInput = (val: string) => {
    setBehalfQuery(val);
    const q = val.trim().toLowerCase();
    if (q.length >= 1) {
      const matches = Object.values(EMPLOYEE_DB).filter(
        emp => emp.badge.startsWith(q) || emp.name.toLowerCase().includes(q)
      );
      setBehalfSuggestions(matches);
      setShowBehalfDropdown(matches.length > 0);
    } else {
      setBehalfSuggestions([]);
      setShowBehalfDropdown(false);
    }
    // If user clears, reset employee fields
    if (!val.trim()) {
      onUpdate({ ...EMPTY_EMPLOYEE_FIELDS });
    }
  };

  const handleBehalfSelect = (badge: string) => {
    const emp = EMPLOYEE_DB[badge];
    if (!emp) return;
    setBehalfQuery(`${emp.name} · #${emp.badge}`);
    setShowBehalfDropdown(false);
    setBehalfSuggestions([]);
    onUpdate({
      on_behalf_employee:  badge,
      employee_badge_number: emp.badge,
      employee_name:       emp.name,
      employee_phone:      emp.phone,
      employee_gender:     emp.gender,
      employee_address:    emp.address,
      employee_age:        emp.age,
      date_of_hire:        emp.hire_date,
      employee_status:     emp.status,
      department:          emp.department,
      assigned_division:   emp.division,
      division_supervisor: emp.division_supervisor,
      division_work:       emp.division_work,
      cost_center:         emp.cost_center,
      service_years:       emp.service_years,
      service_months:      emp.service_months,
      service_days:        emp.service_days,
      is_student_employee: emp.is_student,
    });
  };

  const handleEventTypeChange = (val: string) => {
    onUpdate({
      event_type: val,
      // Reset driving question when event type changes
      operating_dart_vehicle: SHOW_DRIVING_QUESTION.includes(val) ? data.operating_dart_vehicle : undefined,
    });
  };

  const handleModeChange = (val: string) => {
    if (val !== data.mode) {
      onUpdate({
        mode: val,
        // Clear mode-specific Step-2 fields when mode changes
        vehicle_number: undefined, fleet_type: undefined, trip_id: undefined, block_number: undefined,
        train_number: undefined, lrv_fleet_type: undefined,
      });
    }
  };

  const missing: string[] = [];
  if (isSupervisor && !hasFilingChoice) missing.push('filing on behalf');
  if (!hasEventType) missing.push('event type');
  if (needsDrivingQ && data.operating_dart_vehicle === undefined) missing.push('vehicle question');
  if (!hasMode) missing.push('vehicle mode');

  return (
    <StepContainer stepNumber={1} title="Incident Basics" description="Confirm the schedule, then select the event type and vehicle mode.">
      <div className="divide-y divide-slate-100">

        {/* Filing on behalf — Supervisors only */}
        {isSupervisor && (
          <Section
            title="Filing on behalf"
            help="Is this case for another DART employee?"
            complete={data.is_on_behalf !== undefined && (data.is_on_behalf === false || !!data.on_behalf_employee)}
          >
            <YesNoToggle
              value={data.is_on_behalf}
              yesLabel="Yes — for another employee"
              noLabel="No — this case is for me"
              onChange={v => onUpdate({ is_on_behalf: v, on_behalf_employee: v ? data.on_behalf_employee : undefined })}
            />
            <AnimatePresence>
              {data.is_on_behalf === true && (
                <motion.div {...fade} key="behalf-name" className="mt-4">
                  <label className="dart-field-label">
                    Employee name or badge number
                  </label>
                  <div className="relative" ref={behalfRef}>
                    <input
                      type="text"
                      value={behalfQuery || (data.on_behalf_employee ? `${data.employee_name} · #${data.on_behalf_employee}` : '')}
                      onChange={e => handleBehalfInput(e.target.value)}
                      onFocus={() => {
                        if (behalfSuggestions.length > 0) {
                          setShowBehalfDropdown(true);
                        } else if (!behalfQuery) {
                          setBehalfSuggestions(Object.values(EMPLOYEE_DB));
                          setShowBehalfDropdown(true);
                        }
                      }}
                      placeholder="Search DART employee…"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] focus:border-[#00205B] bg-white text-slate-800 placeholder:text-slate-400 transition-all min-h-[44px] font-['Poppins'] text-sm"
                    />
                    <AnimatePresence>
                      {showBehalfDropdown && (
                        <motion.div
                          key="behalf-dd"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden"
                        >
                          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-['Poppins']">
                              {behalfQuery ? 'Matching employees' : 'All employees (demo)'}
                            </p>
                          </div>
                          <ul className="max-h-52 overflow-y-auto py-1">
                            {behalfSuggestions.map(emp => (
                              <li key={emp.badge}>
                                <button
                                  type="button"
                                  onMouseDown={() => handleBehalfSelect(emp.badge)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left group"
                                >
                                  <div className="w-7 h-7 rounded-full bg-[#007DBA]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-[#007DBA] font-['Poppins']">
                                      {emp.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-800 font-medium font-['Poppins'] truncate group-hover:text-[#00205B]">{emp.name}</p>
                                    <p className="text-xs text-slate-400 font-['Poppins']">Badge #{emp.badge} · {emp.division_work}</p>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>
        )}

        {/* Schedule — pre-filled from Workday, no green check (user isn't deciding here) */}
        <Section
          title="Schedule"
          help="Confirm the operator's schedule details."
          complete={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="dart-field-label">Student employee?</p>
              <div className="inline-flex gap-2">
                <button type="button" onClick={() => onUpdate({ is_student_employee: true })} className={`px-3 py-2 rounded-md text-sm font-['Poppins'] transition-colors ${data.is_student_employee === true ? 'bg-[#EAF1F8] border border-[#00205B] text-[#00205B] font-semibold' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}`}>Yes</button>
                <button type="button" onClick={() => onUpdate({ is_student_employee: false })} className={`px-3 py-2 rounded-md text-sm font-['Poppins'] transition-colors ${data.is_student_employee === false ? 'bg-[#EAF1F8] border border-[#00205B] text-[#00205B] font-semibold' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}`}>No</button>
              </div>
            </div>

            <div>
              <p className="dart-field-label">Regular day off</p>
              <div className="inline-flex gap-2">
                <button type="button" onClick={() => onUpdate({ regular_day_off_type: 'Consecutive', rdo_consecutive: undefined, rdo_split_1: undefined, rdo_split_2: undefined })} className={`px-3 py-2 rounded-md text-sm font-['Poppins'] transition-colors ${data.regular_day_off_type === 'Consecutive' ? 'bg-[#EAF1F8] border border-[#00205B] text-[#00205B] font-semibold' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}`}>Consecutive days</button>
                <button type="button" onClick={() => onUpdate({ regular_day_off_type: 'Split', rdo_consecutive: undefined, rdo_split_1: undefined, rdo_split_2: undefined })} className={`px-3 py-2 rounded-md text-sm font-['Poppins'] transition-colors ${data.regular_day_off_type === 'Split' ? 'bg-[#EAF1F8] border border-[#00205B] text-[#00205B] font-semibold' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}`}>Split days</button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {data.regular_day_off_type === 'Consecutive' && (
              <motion.div {...fade} key="rdo-consec" className="mt-3">
                <label className="dart-field-label">Regular days off (RDO) – Consecutive</label>
                <CustomSelect value={data.rdo_consecutive || ''} onChange={v => onUpdate({ rdo_consecutive: v })} options={RDO_CONSECUTIVE} placeholder="Select RDO pair" />
              </motion.div>
            )}
            {data.regular_day_off_type === 'Split' && (
              <motion.div {...fade} key="rdo-split" className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="dart-field-label">RDO Split – Day 1</label>
                  <CustomSelect value={data.rdo_split_1 || ''} onChange={v => onUpdate({ rdo_split_1: v })} options={RDO_DAYS} placeholder="Select day" />
                </div>
                <div>
                  <label className="dart-field-label">RDO Split – Day 2</label>
                  <CustomSelect value={data.rdo_split_2 || ''} onChange={v => onUpdate({ rdo_split_2: v })} options={RDO_DAYS} placeholder="Select day" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* Type of event (+ conditional driving sub-question) */}
        <Section
          title="Type of event"
          help="This determines which questions appear next."
          complete={hasEventType && (!needsDrivingQ || data.operating_dart_vehicle !== undefined)}
        >
          <div>
            <label className="dart-field-label">
              Type of event <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={data.event_type || ''}
              onChange={handleEventTypeChange}
              options={EVENT_TYPES}
              placeholder="Select event type"
            />
          </div>

          <AnimatePresence>
            {needsDrivingQ && (
              <motion.div {...fade} key="driving-q" className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-sm font-medium text-[#00205B] font-['Poppins'] mb-1">
                  Were you operating a DART vehicle? <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-slate-500 font-['Poppins'] mb-3">
                  Were you driving, operating, or in possession of a DART vehicle at the time of the event?
                </p>
                <YesNoToggle value={data.operating_dart_vehicle} onChange={v => onUpdate({ operating_dart_vehicle: v })} />
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* Vehicle mode */}
        <Section
          title="Vehicle mode"
          help="Which DART vehicle mode is involved?"
          complete={hasMode}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MODES.map(m => {
              const Icon = m.icon;
              const selected = data.mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleModeChange(m.value)}
                  className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,32,91,0.16)] ${
                    selected
                      ? 'border-[#00205B] bg-[#00205B]'
                      : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg transition-colors ${
                      selected ? 'bg-white/15' : 'bg-[#F1F5F9]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-[#64748B]'}`} />
                  </div>
                  <span className={`text-xs font-semibold font-['Poppins'] ${selected ? 'text-white' : 'text-[#233B57]'}`}>{m.label}</span>
                  <span className={`text-[10px] font-['Poppins'] ${selected ? 'text-white/80' : 'text-[#5B6B82]'}`}>{m.sublabel}</span>
                </button>
              );
            })}
          </div>
        </Section>

      </div>

      {/* Footer — attached to form. Disabled Next tells the operator what's missing. */}
      <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4 flex-wrap">
        <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
        <div className="flex items-center gap-3 ml-auto">
          {!canProceed && missing.length > 0 && (
            <p className="text-xs text-slate-500 font-['Poppins'] hidden sm:block">
              Missing: <span className="text-slate-700 font-medium">{missing.join(' · ')}</span>
            </p>
          )}
          <GlassButton variant="primary" onClick={onNext} disabled={!canProceed}>Next</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}