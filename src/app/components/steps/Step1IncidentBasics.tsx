import { useState, useRef, useEffect, useMemo } from 'react';
import { Lock, AlertTriangle, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { CustomSelect } from '../CustomSelect';
import { DatePickerInput } from '../DatePickerInput';
import { TimePickerInput } from '../TimePickerInput';
import { YesNoToggle } from '../form/YesNoToggle';
import type { AccidentReportData } from '../../types/accident-report';
import { EMPLOYEE_DB } from '../../data/employeeDatabase';
import { useUserRole } from '../../context/UserRoleContext';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  nextLabel?: string;
  showStepBadge?: boolean;
  lockEventAndMode?: boolean;
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

// The multi-role case workflow only applies to collisions and derailments, so a Program
// Manager initiating a case on behalf of an operator/employee can only pick those two.
const WORKFLOW_EVENT_TYPES = EVENT_TYPES.filter(o => o.value === 'Collision' || o.value === 'Derailment');

const SHOW_DRIVING_QUESTION = ['Assault (Verbal or Physical)', 'Fire', 'Operator/Passenger Events (non-collision)'];

const MODES = [
  { value: 'Bus',                  label: 'Bus',        sublabel: 'Fixed route bus',           glyph: 'directions_bus' },
  { value: 'Light Rail Vehicle',   label: 'Light Rail', sublabel: 'Light rail vehicle',         glyph: 'directions_railway' },
  { value: 'Streetcar',            label: 'Streetcar',  sublabel: 'Urban streetcar',            glyph: 'tram' },
  { value: 'Hi-Rail',              label: 'Hi-Rail',    sublabel: 'On-rail maintenance truck',  glyph: 'local_shipping' },
  { value: 'Non-Revenue Vehicle',  label: 'Non-Revenue',sublabel: 'Non-revenue vehicle',        glyph: 'directions_car' },
] as const;

const DERAILMENT_MODES = ['Light Rail Vehicle', 'Streetcar', 'Hi-Rail'];

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
const RDO_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const RDO_DAYS = RDO_DAY_NAMES.map(v => ({ value: v, label: v }));

function areSplitDaysValid(day1?: string, day2?: string) {
  if (!day1 || !day2) return false;
  const firstIndex = RDO_DAY_NAMES.indexOf(day1);
  const secondIndex = RDO_DAY_NAMES.indexOf(day2);
  if (firstIndex < 0 || secondIndex < 0) return false;
  const distance = Math.abs(firstIndex - secondIndex);
  return distance !== 0 && distance !== 1 && distance !== RDO_DAY_NAMES.length - 1;
}

function splitDayOptions(otherDay?: string) {
  if (!otherDay) return RDO_DAYS;
  return RDO_DAYS.filter(({ value }) => areSplitDaysValid(value, otherDay));
}

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

// Spring for the Schedule row's layout reflow so the toggles glide to their new width
// (instead of snapping) as RDO selects appear and disappear.
const layoutSpring = { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } as const;

// ── helpers ───────────────────────────────────────────────────────────────────
// Section block. Renders as a divider-separated block on one shared surface (no per-section
// card chrome) so Step 1 reads as a single continuous form rather than stacked cards.
function Section({ title, help, children }: { title: React.ReactNode; help?: string; complete?: boolean; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">
          {title}
        </h3>
        {help && (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-['Poppins']">{help}</p>
        )}
      </div>
      <div>
        {children}
      </div>
    </section>
  );
}

// ── component ─────────────────────────────────────────────────────────────────
export function Step1IncidentBasics({ data, onUpdate, onNext, onSaveDraft, nextLabel, showStepBadge = true, lockEventAndMode = false }: Props) {
  const { roleConfig } = useUserRole();
  const isSupervisor = roleConfig.role === 'Supervisor';
  const isProgramManager = roleConfig.role === 'Program Manager';
  const effectiveIsOnBehalf = isProgramManager || data.is_on_behalf === true;
  const [showErrors, setShowErrors] = useState(false);

  const hasEventType = !!data.event_type;
  const isDerailmentEvent = data.event_type?.trim().toLowerCase() === 'derailment';
  const needsDrivingQ = hasEventType && SHOW_DRIVING_QUESTION.includes(data.event_type!);
  const modeIsAllowed = !isDerailmentEvent || DERAILMENT_MODES.includes(data.mode || '');
  const hasMode = !!data.mode && modeIsAllowed;
  const hasIncidentDate = !!data.incident_date;
  const hasIncidentTime = !!data.incident_time;
  const hasEmployee = !!(data.employee_badge_number && data.employee_name);
  const splitDaysAreValid = areSplitDaysValid(data.rdo_split_1, data.rdo_split_2);
  const hasSchedule = data.is_student_employee !== undefined
    && !!data.regular_day_off_type
    && (data.regular_day_off_type === 'Consecutive'
      ? !!data.rdo_consecutive
      : splitDaysAreValid);
  const hasFilingChoice = !isSupervisor || data.is_on_behalf !== undefined;
  // When a PM (always) or an on-behalf Supervisor initiates, they must state whether the
  // operator can file their own section. "No" waives the operator section and requires a reason.
  const needsOperatorAvailability = isProgramManager || (isSupervisor && data.is_on_behalf === true);
  const hasOperatorAvailability = !needsOperatorAvailability
    || data.operator_availability_confirmed === true
    || (data.operator_availability_confirmed === false && !!data.operator_unavailable_reason?.trim());

  const canProceed = hasFilingChoice && hasEventType && hasMode && hasIncidentDate && hasIncidentTime && hasEmployee && hasSchedule && hasOperatorAvailability && (!needsDrivingQ || data.operating_dart_vehicle !== undefined);

  useEffect(() => {
    if (!isProgramManager || data.is_on_behalf === true) return;
    onUpdate({
      is_on_behalf: true,
      ...EMPTY_EMPLOYEE_FIELDS,
    });
  }, [isProgramManager, data.is_on_behalf, onUpdate]);

  // Restored drafts can contain a legacy Derailment + non-rail mode combination. Enforce the
  // same rule after hydration instead of relying only on the event dropdown change handler.
  useEffect(() => {
    if (isDerailmentEvent && data.mode && !DERAILMENT_MODES.includes(data.mode)) {
      onUpdate({
        mode: undefined,
        vehicle_number: undefined,
        fleet_type: undefined,
        trip_id: undefined,
        block_number: undefined,
        train_number: undefined,
        lrv_fleet_type: undefined,
      });
    }
  }, [data.mode, isDerailmentEvent, onUpdate]);

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
  // All selectable employees for the on-behalf search — excludes the signed-in supervisor and is
  // sorted alphabetically by name so the list stays easy to scan when there are hundreds of names.
  const behalfAllEmployees = useMemo(
    () => Object.values(EMPLOYEE_DB)
      .filter(e => e.badge !== roleConfig.badge)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [roleConfig.badge],
  );

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
      const matches = behalfAllEmployees.filter(
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

  // Clear a mistakenly-picked employee and reopen the full list so they can search again.
  const handleBehalfClear = () => {
    setBehalfQuery('');
    setBehalfSuggestions(behalfAllEmployees);
    setShowBehalfDropdown(true);
    onUpdate({ ...EMPTY_EMPLOYEE_FIELDS });
  };

  const handleEventTypeChange = (val: string) => {
    const modeRemainsAllowed = val !== 'Derailment' || DERAILMENT_MODES.includes(data.mode || '');
    onUpdate({
      event_type: val,
      ...(!modeRemainsAllowed ? {
        mode: undefined,
        vehicle_number: undefined,
        fleet_type: undefined,
        trip_id: undefined,
        block_number: undefined,
        train_number: undefined,
        lrv_fleet_type: undefined,
      } : {}),
      // Reset driving question when event type changes
      operating_dart_vehicle: SHOW_DRIVING_QUESTION.includes(val) ? data.operating_dart_vehicle : undefined,
    });
  };

  const handleModeChange = (val: string) => {
    if (isDerailmentEvent && !DERAILMENT_MODES.includes(val)) return;
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
  if ((isProgramManager || data.is_on_behalf === true) && !hasEmployee) missing.push('employee this case is for');
  if (needsOperatorAvailability && !hasOperatorAvailability) missing.push('operator availability');
  if (!hasEventType) missing.push('event type');
  if (!hasIncidentDate) missing.push('incident date');
  if (!hasIncidentTime) missing.push('incident time');
  if (needsDrivingQ && data.operating_dart_vehicle === undefined) missing.push('vehicle question');
  if (!hasMode) missing.push('vehicle mode');
  if (data.is_student_employee === undefined) missing.push('student employee');
  if (!data.regular_day_off_type) missing.push('regular day off');
  if (data.regular_day_off_type === 'Consecutive' && !data.rdo_consecutive) missing.push('regular days off');
  if (data.regular_day_off_type === 'Split' && !splitDaysAreValid) missing.push('valid split regular days off');

  const errFilingChoice = showErrors && isSupervisor && !hasFilingChoice;
  const errEmployee = showErrors && (isProgramManager || data.is_on_behalf === true) && !hasEmployee;
  const errAvailability = showErrors && needsOperatorAvailability && !hasOperatorAvailability;
  const errEventType = showErrors && !hasEventType;
  const errIncidentDate = showErrors && !hasIncidentDate;
  const errIncidentTime = showErrors && !hasIncidentTime;
  const errDriving = showErrors && needsDrivingQ && data.operating_dart_vehicle === undefined;
  const errMode = showErrors && !hasMode;
  const errStudentEmployee = showErrors && data.is_student_employee === undefined;
  const errRegularDayOff = showErrors && !data.regular_day_off_type;
  const errSplitDays = showErrors && data.regular_day_off_type === 'Split' && !splitDaysAreValid;

  const handleSplitDay1Change = (value: string) => {
    onUpdate({
      rdo_split_1: value,
      rdo_split_2: data.rdo_split_2 && !areSplitDaysValid(value, data.rdo_split_2)
        ? undefined
        : data.rdo_split_2,
    });
  };

  const handleSplitDay2Change = (value: string) => {
    onUpdate({
      rdo_split_1: data.rdo_split_1 && !areSplitDaysValid(data.rdo_split_1, value)
        ? undefined
        : data.rdo_split_1,
      rdo_split_2: value,
    });
  };

  const handleNextClick = () => {
    if (canProceed) {
      setShowErrors(false);
      onNext();
    } else {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Extracted so the same controls can render as a 2-col Schedule section (operator /
  // supervisor) or share one 3-col row with the employee field (program manager).
  const studentEmployeeField = (
    <div>
      <p className="dart-field-label">Student employee? <span className="dart-req">*</span></p>
      <div className={`dart-seg ${errStudentEmployee ? 'dart-field-error' : ''}`}>
        <button type="button" onClick={() => onUpdate({ is_student_employee: true })} className={`dart-seg-btn ${data.is_student_employee === true ? 'dart-seg-btn--on' : ''}`}>
          {data.is_student_employee === true && <Check className="w-[15px] h-[15px]" strokeWidth={2.5} />}Yes
        </button>
        <button type="button" onClick={() => onUpdate({ is_student_employee: false })} className={`dart-seg-btn ${data.is_student_employee === false ? 'dart-seg-btn--on' : ''}`}>
          {data.is_student_employee === false && <Check className="w-[15px] h-[15px]" strokeWidth={2.5} />}No
        </button>
      </div>
    </div>
  );

  const regularDayOffField = (
    <div>
      <p className="dart-field-label">Regular day off <span className="dart-req">*</span></p>
      <div className={`dart-seg ${errRegularDayOff ? 'dart-field-error' : ''}`}>
        <button type="button" onClick={() => onUpdate({ regular_day_off_type: 'Consecutive', rdo_consecutive: undefined, rdo_split_1: undefined, rdo_split_2: undefined })} className={`dart-seg-btn ${data.regular_day_off_type === 'Consecutive' ? 'dart-seg-btn--on' : ''}`}>
          {data.regular_day_off_type === 'Consecutive' && <Check className="w-[15px] h-[15px]" strokeWidth={2.5} />}Consecutive days
        </button>
        <button type="button" onClick={() => onUpdate({ regular_day_off_type: 'Split', rdo_consecutive: undefined, rdo_split_1: undefined, rdo_split_2: undefined })} className={`dart-seg-btn ${data.regular_day_off_type === 'Split' ? 'dart-seg-btn--on' : ''}`}>
          {data.regular_day_off_type === 'Split' && <Check className="w-[15px] h-[15px]" strokeWidth={2.5} />}Split days
        </button>
      </div>
    </div>
  );

  const rdoConditional = (
    <AnimatePresence>
      {data.regular_day_off_type === 'Consecutive' && (
        <motion.div {...fade} key="rdo-consec" className="w-full sm:w-[240px]">
          <label className="dart-field-label">Regular days off (RDO) – Consecutive <span className="dart-req">*</span></label>
          <CustomSelect value={data.rdo_consecutive || ''} onChange={v => onUpdate({ rdo_consecutive: v })} options={RDO_CONSECUTIVE} placeholder="Select RDO pair" error={showErrors && !data.rdo_consecutive} />
        </motion.div>
      )}
      {data.regular_day_off_type === 'Split' && (
        <motion.div {...fade} key="rdo-split" className="flex flex-wrap items-start gap-x-6 gap-y-5">
          <div className="w-full sm:w-[200px]">
            <label className="dart-field-label">RDO Split – Day 1 <span className="dart-req">*</span></label>
            <CustomSelect value={data.rdo_split_1 || ''} onChange={handleSplitDay1Change} options={splitDayOptions(data.rdo_split_2)} placeholder="Select day" error={errSplitDays} />
          </div>
          <div className="w-full sm:w-[200px]">
            <label className="dart-field-label">RDO Split – Day 2 <span className="dart-req">*</span></label>
            <CustomSelect value={data.rdo_split_2 || ''} onChange={handleSplitDay2Change} options={splitDayOptions(data.rdo_split_1)} placeholder="Select day" error={errSplitDays} />
          </div>
          <p className={`w-full text-xs font-['Poppins'] ${errSplitDays ? 'font-medium text-red-600' : 'text-slate-500'}`}>
            Split days must be different and cannot be consecutive.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const employeeSearchField = (
    <>
      <label className="dart-field-label">
        Employee name or badge number <span className="dart-req">*</span>
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
              setBehalfSuggestions(behalfAllEmployees);
              setShowBehalfDropdown(true);
            }
          }}
          placeholder="Search DART employee…"
          className={`w-full pl-4 pr-10 py-3 rounded-[0.625rem] border-[1.5px] shadow-[0_1px_2px_rgba(15,23,42,0.05)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] focus:border-[#00205B] bg-white text-slate-800 placeholder:text-slate-400 transition-all duration-200 min-h-[44px] font-['Poppins'] text-sm ${errEmployee ? 'border-red-400' : 'border-[#dbe3ec] hover:border-[#b8c4d3] hover:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.1)]'}`}
        />
        {(data.on_behalf_employee || behalfQuery) && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); handleBehalfClear(); }}
            aria-label="Clear selected employee"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00205B]/30"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
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
                  {behalfQuery ? 'Matching employees' : 'All employees'}
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
      {errEmployee && <p className="mt-1.5 text-xs font-medium text-red-600 font-['Poppins']">Select the employee this case is for.</p>}
    </>
  );

  const operatorAvailabilityToggle = (
    <div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <label className="dart-field-label" style={{ marginBottom: 0 }}>
            Is the operator available to complete their own section? <span className="dart-req">*</span>
          </label>
        </div>
        <div className="shrink-0">
          <YesNoToggle
            value={data.operator_availability_confirmed}
            onChange={v => onUpdate({
              operator_availability_confirmed: v,
              operator_unavailable_reason: v ? undefined : data.operator_unavailable_reason,
            })}
          />
        </div>
      </div>
      {errAvailability && data.operator_availability_confirmed === undefined && (
        <p className="mt-1.5 text-xs font-medium text-red-600 font-['Poppins']">Select whether the operator can file their own section.</p>
      )}
    </div>
  );

  const operatorUnavailableReason = (
    <AnimatePresence>
      {data.operator_availability_confirmed === false && (
        <motion.div {...fade} key="operator-unavailable-reason" className="mt-5">
          <label className="dart-field-label">
            Why is the operator unavailable? <span className="dart-req">*</span>
          </label>
          <textarea
            value={data.operator_unavailable_reason || ''}
            onChange={e => onUpdate({ operator_unavailable_reason: e.target.value })}
            placeholder="e.g. Operator was transported to the hospital after the incident and cannot file."
            rows={3}
            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] focus:border-[#00205B] bg-white text-slate-800 placeholder:text-slate-400 transition-all font-['Poppins'] text-sm resize-none ${showErrors && !data.operator_unavailable_reason?.trim() ? 'border-red-400' : 'border-slate-300'}`}
          />
          {showErrors && !data.operator_unavailable_reason?.trim() && (
            <p className="mt-1.5 text-xs font-medium text-red-600 font-['Poppins']">A reason is required to waive the operator.</p>
          )}
          <p className="mt-2 text-xs text-slate-500 font-['Poppins']">
            The operator section will be waived — this report will not require the operator to file it themselves.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <StepContainer stepNumber={1} showStepBadge={showStepBadge} title="Incident Basics" description="Confirm the schedule, then select the event type and vehicle mode.">
      {showErrors && !canProceed && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-800 font-['Poppins']">
            Please complete the {missing.length} required {missing.length === 1 ? 'field' : 'fields'} below to continue.
          </p>
        </div>
      )}
      <div className="dart-card dart-card--surface overflow-hidden">

        {/* Supervisor: the two toggles sit side by side; the employee search reveals below once
            the operator-availability toggle is answered. */}
        {isSupervisor && (
          <Section
            title="Who is this case for?"
            complete={data.is_on_behalf !== undefined && (data.is_on_behalf === false || !!data.on_behalf_employee)}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-x-8 gap-y-5">
              <motion.div layout transition={layoutSpring} className="md:flex-1">
                <label className="dart-field-label">
                  Is this case for another DART employee? <span className="dart-req">*</span>
                </label>
                <YesNoToggle
                  value={data.is_on_behalf}
                  yesLabel="Yes, for another employee"
                  noLabel="No, this case is for me"
                  onChange={v => onUpdate({ is_on_behalf: v, on_behalf_employee: v ? data.on_behalf_employee : undefined })}
                />
                {errFilingChoice && <p className="mt-1.5 text-xs font-medium text-red-600 font-['Poppins']">Select whether this case is for another employee.</p>}
              </motion.div>
              <AnimatePresence mode="popLayout">
                {data.is_on_behalf === true && (
                  <motion.div
                    layout
                    key="op-avail"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ layout: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' }, scale: { duration: 0.24, ease: 'easeInOut' } }}
                    className="md:flex-1 min-w-0"
                  >
                    {operatorAvailabilityToggle}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {data.is_on_behalf === true && (
                <motion.div {...fade} key="behalf-emp" className="mt-5 pt-5 border-t border-slate-100">
                  {employeeSearchField}
                </motion.div>
              )}
            </AnimatePresence>
            {operatorUnavailableReason}
          </Section>
        )}

        {/* Program manager: subject + schedule share one row (PM always files on behalf) */}
        {isProgramManager && (
          <Section
            title="Who is this case for?"
            help="Program managers open cases on behalf of a DART employee. Select who this case is for, then confirm their schedule."
            complete={!!data.on_behalf_employee}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-5 md:items-start">
              <div className="md:col-span-2">{employeeSearchField}</div>
              {studentEmployeeField}
              {regularDayOffField}
            </div>
            <div className="mt-4">{rdoConditional}</div>
            <div className="mt-5 pt-5 border-t border-slate-100">
              {operatorAvailabilityToggle}
              {operatorUnavailableReason}
            </div>
          </Section>
        )}

        {/* Schedule — operators and supervisors (PM's schedule sits in the row above) */}
        {!isProgramManager && (
          <Section
            title="Schedule"
            help="Confirm the operator's schedule details."
            complete={false}
          >
            <div className="dart-schedule-row">
              <motion.div layout transition={layoutSpring}>{studentEmployeeField}</motion.div>
              <motion.div layout transition={layoutSpring}>{regularDayOffField}</motion.div>
              <AnimatePresence mode="popLayout">
                {data.regular_day_off_type === 'Consecutive' && (
                  <motion.div
                    layout
                    key="sched-rdo-consec"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ layout: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' }, scale: { duration: 0.24, ease: 'easeInOut' } }}
                  >
                    <label className="dart-field-label">Regular days off (RDO) – Consecutive <span className="dart-req">*</span></label>
                    <CustomSelect value={data.rdo_consecutive || ''} onChange={v => onUpdate({ rdo_consecutive: v })} options={RDO_CONSECUTIVE} placeholder="Select RDO pair" error={showErrors && !data.rdo_consecutive} />
                  </motion.div>
                )}
                {data.regular_day_off_type === 'Split' && (
                  <motion.div
                    layout
                    key="sched-rdo-1"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ layout: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' }, scale: { duration: 0.24, ease: 'easeInOut' } }}
                  >
                    <label className="dart-field-label">RDO Split – Day 1 <span className="dart-req">*</span></label>
                    <CustomSelect value={data.rdo_split_1 || ''} onChange={handleSplitDay1Change} options={splitDayOptions(data.rdo_split_2)} placeholder="Select day" error={errSplitDays} />
                  </motion.div>
                )}
                {data.regular_day_off_type === 'Split' && (
                  <motion.div
                    layout
                    key="sched-rdo-2"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ layout: layoutSpring, opacity: { duration: 0.2, ease: 'easeInOut' }, scale: { duration: 0.24, ease: 'easeInOut' } }}
                  >
                    <label className="dart-field-label">RDO Split – Day 2 <span className="dart-req">*</span></label>
                    <CustomSelect value={data.rdo_split_2 || ''} onChange={handleSplitDay2Change} options={splitDayOptions(data.rdo_split_1)} placeholder="Select day" error={errSplitDays} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {data.regular_day_off_type === 'Split' && (
              <p className={`mt-2 text-xs font-['Poppins'] ${errSplitDays ? 'font-medium text-red-600' : 'text-slate-500'}`}>
                Split days must be different and cannot be consecutive.
              </p>
            )}
          </Section>
        )}

        {/* Type of event + incident timing (+ conditional driving sub-question) */}
        <Section
          title="Event classification"
          help="Select the type of incident and confirm when it occurred. These details determine the information required later in the report."
          complete={hasEventType && hasIncidentDate && hasIncidentTime && (!needsDrivingQ || data.operating_dart_vehicle !== undefined)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-start">
            <div>
              <label className="dart-field-label">
                Incident type <span className="dart-req">*</span>
              </label>
              <CustomSelect
                value={data.event_type || ''}
                onChange={handleEventTypeChange}
                options={isProgramManager ? WORKFLOW_EVENT_TYPES : EVENT_TYPES}
                placeholder="Select incident type"
                disabled={lockEventAndMode}
                error={errEventType}
              />
              {errEventType && <p className="mt-1.5 text-xs font-medium text-red-600 font-['Poppins']">Select the type of event to continue.</p>}
              {lockEventAndMode && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-['Poppins']">
                  <Lock className="w-3 h-3" /> Set when the case was opened.
                </p>
              )}
            </div>

            <div>
              <label className="dart-field-label">
                Date of incident <span className="dart-req">*</span>
              </label>
              <div className={errIncidentDate ? 'dart-field-error' : ''}>
                <DatePickerInput value={data.incident_date || ''} onChange={v => onUpdate({ incident_date: v })} maxDate={new Date()} />
              </div>
              {errIncidentDate && <p className="mt-1.5 text-xs font-medium text-red-600 font-['Poppins']">Enter the incident date to continue.</p>}
            </div>

            <div>
              <label className="dart-field-label">
                Time of incident <span className="dart-req">*</span>
              </label>
              <div className={errIncidentTime ? 'dart-field-error' : ''}>
                <TimePickerInput value={data.incident_time || ''} onChange={v => onUpdate({ incident_time: v })} />
              </div>
              {errIncidentTime && <p className="mt-1.5 text-xs font-medium text-red-600 font-['Poppins']">Enter the incident time to continue.</p>}
            </div>
          </div>

          <AnimatePresence>
            {needsDrivingQ && (
              <motion.div {...fade} key="driving-q" className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-sm font-medium text-[#00205B] font-['Poppins'] mb-1">
                  Were you operating a DART vehicle? <span className="dart-req">*</span>
                </p>
                <p className="text-xs text-slate-500 font-['Poppins'] mb-3">
                  Were you driving, operating, or in possession of a DART vehicle at the time of the event?
                </p>
                <YesNoToggle value={data.operating_dart_vehicle} onChange={v => onUpdate({ operating_dart_vehicle: v })} />
                {errDriving && <p className="mt-2 text-xs font-medium text-red-600 font-['Poppins']">Answer this question to continue.</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* Vehicle mode */}
        <Section
          title={<>Vehicle mode <span className="dart-req">*</span></>}
          help={isDerailmentEvent
            ? 'Derailment reports are available only for Light Rail Vehicle, Streetcar, and Hi-Rail.'
            : 'Which DART vehicle mode is involved?'}
          complete={hasMode}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MODES.map(m => {
              const selected = data.mode === m.value;
              const unavailableForDerailment = isDerailmentEvent && !DERAILMENT_MODES.includes(m.value);
              const disabled = lockEventAndMode || unavailableForDerailment;
              return (
                <button
                  key={m.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleModeChange(m.value)}
                  aria-describedby={unavailableForDerailment ? 'derailment-mode-guidance' : undefined}
                  title={unavailableForDerailment ? 'Not available for Derailment' : undefined}
                  className={`dart-mode-card ${selected ? 'dart-mode-card--on' : ''} ${unavailableForDerailment ? 'grayscale bg-slate-100/80 border-slate-200' : ''} ${errMode && !selected && !unavailableForDerailment ? 'dart-mode-card--error' : ''}`}
                >
                  {selected && (
                    <span className="dart-mode-badge">
                      <span className="material-symbols-rounded">check</span>
                    </span>
                  )}
                  <span className={`dart-mode-tile ${selected ? 'dart-mode-tile--on' : ''}`}>
                    <span className="material-symbols-rounded">{m.glyph}</span>
                  </span>
                  <span className="dart-mode-title">{m.label}</span>
                  <span className="dart-mode-sub">{unavailableForDerailment ? 'Not available for Derailment' : m.sublabel}</span>
                </button>
              );
            })}
          </div>
          {isDerailmentEvent && (
            <p id="derailment-mode-guidance" className="mt-3 text-xs leading-relaxed text-slate-500 font-['Poppins']">
              Bus and Non-Revenue Vehicle cannot be selected for this event type.
            </p>
          )}
          {errMode && <p className="mt-2 text-xs font-medium text-red-600 font-['Poppins']">Select the vehicle mode involved.</p>}
          {lockEventAndMode && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-['Poppins']">
              <Lock className="w-3 h-3" /> Set when the case was opened.
            </p>
          )}
        </Section>
      </div>

      {/* Footer — Next validates the step; field-level errors surface on attempt. */}
      <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4 flex-wrap">
        <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
        <div className="flex items-center gap-3 ml-auto">
          <GlassButton variant="primary" onClick={handleNextClick}>{nextLabel || 'Next'}</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}