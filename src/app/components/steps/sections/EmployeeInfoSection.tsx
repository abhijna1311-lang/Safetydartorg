import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Lock, X, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect } from '../../CustomSelect';
import { DatePickerInput } from '../../DatePickerInput';
import { YesNoToggle } from '../../form/YesNoToggle';
import { EMPLOYEE_DB } from '../../../data/employeeDatabase';
import type { AccidentReportData } from '../../../types/accident-report';
import { useUserRole } from '../../../context/UserRoleContext';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  isOnBehalf?: boolean;
}

type LookupState = 'idle' | 'loading' | 'found' | 'not-found';

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: { duration: 0.22 },
};

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(v => ({ value: v, label: v }));
const STATUS_OPTIONS = ['Active', 'Probationary', 'Leave of Absence', 'Part-time', 'Temporary'].map(v => ({ value: v, label: v }));
const DEPT_OPTIONS = ['Operations', 'Maintenance', 'Administration', 'Safety', 'IT', 'Finance', 'HR', 'Customer Service'].map(v => ({ value: v, label: v }));
const DIVISION_OPTIONS = ['North Dallas', 'South Dallas', 'East Dallas', 'West Dallas', 'Downtown', 'Garland', 'Plano', 'Irving'].map(v => ({ value: v, label: v }));
const RDO_CONSECUTIVE = ['Sun/Mon', 'Mon/Tue', 'Tue/Wed', 'Wed/Thu', 'Thu/Fri', 'Fri/Sat', 'Sat/Sun'].map(v => ({ value: v, label: v }));
const RDO_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(v => ({ value: v, label: v }));

// Shared input class variants
const inputBase = "w-full px-4 py-3 rounded-lg border-2 transition-all min-h-[44px] font-['Poppins'] text-sm";
const inputEditable = `${inputBase} border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] focus:border-[#00205B] bg-white text-slate-800 placeholder:text-slate-400`;
const inputLocked = `${inputBase} border-slate-200 bg-slate-50 text-slate-700 cursor-default select-none`;
const readOnlyValueCls = "min-h-[44px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-['Poppins'] flex items-center";

// ── sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="col-span-2 pt-2 pb-1 border-b border-slate-100 mb-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-['Poppins']">{title}</p>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  locked?: boolean;
  children: React.ReactNode;
}
function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="dart-field-label">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {children}
    </div>
  );
}

function ReadOnlyValue({ value }: { value?: string | number | null }) {
  return <div className={readOnlyValueCls}>{value || '—'}</div>;
}

// ── main component ────────────────────────────────────────────────────────────
export function EmployeeInfoSection({ data, onUpdate, isOnBehalf }: Props) {
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [suggestions, setSuggestions] = useState<typeof EMPLOYEE_DB[string][]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const suggestRef = useRef<HTMLDivElement>(null);
  const locked = lookupState === 'found' || !isOnBehalf;

  const { roleConfig } = useUserRole();

  // Detect data pre-populated (from logged-in user auto-fill OR on-behalf lookup)
  useEffect(() => {
    if (data.employee_badge_number && data.employee_name && lookupState === 'idle') {
      setLookupState('found');
    }
  }, [data.employee_badge_number, data.employee_name]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      clearTimeout(debounceRef.current);
    };
  }, []);

  const handleBadgeChange = (val: string) => {
    onUpdate({ employee_badge_number: val });
    setLookupState('idle');
    clearTimeout(debounceRef.current);

    const trimmed = val.trim().toLowerCase();

    // Live suggestions: match badge OR name
    if (trimmed.length >= 1) {
      const matches = Object.values(EMPLOYEE_DB).filter(
        emp =>
          emp.badge.startsWith(trimmed) ||
          emp.name.toLowerCase().includes(trimmed)
      );
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    if (trimmed.length >= 4) {
      debounceRef.current = setTimeout(() => triggerLookup(trimmed), 700);
    }
  };

  const handleSelectSuggestion = (badge: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    onUpdate({ employee_badge_number: badge });
    triggerLookup(badge);
  };

  const triggerLookup = (badge: string) => {
    setLookupState('loading');
    // Simulate Workday API call
    setTimeout(() => {
      const emp = EMPLOYEE_DB[badge];
      if (emp) {
        setLookupState('found');
        onUpdate({
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
      } else {
        setLookupState('not-found');
      }
    }, 900);
  };

  const handleClearLookup = () => {
    setLookupState('idle');
    onUpdate({
      employee_badge_number: '',
      employee_name: '', employee_phone: '', employee_gender: '',
      employee_address: '', employee_age: '', date_of_hire: '',
      employee_status: '', department: '', assigned_division: '',
      division_supervisor: '',
      division_work: '', cost_center: '',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${lookupState === 'found' ? 'bg-[#007DBA]' : data.employee_badge_number && data.employee_name ? 'bg-[#007DBA]' : 'bg-slate-300'}`} />
        <span className="text-sm font-semibold text-slate-800 font-['Poppins']">Employee information</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 font-['Poppins']">
          <Lock className="w-3 h-3" /> Workday record
        </span>
      </div>

      <div className="px-6 pt-5 pb-3">

        <AnimatePresence>
          {lookupState === 'found' && (
            <motion.div
              key="wd-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {isOnBehalf ? (
                  <>
                    <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">
                      Filing on behalf of {data.employee_name}
                    </p>
                    <p className="text-xs text-slate-600 font-['Poppins'] mt-0.5">
                      Badge #{data.employee_badge_number} - details are pulled from Workday and displayed read-only.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">
                      Logged in as {roleConfig.name} · {roleConfig.role}
                    </p>
                    <p className="text-xs text-slate-600 font-['Poppins'] mt-0.5">
                      Badge #{data.employee_badge_number} - employee details are pulled from Workday and cannot be edited here.
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isOnBehalf && (
                  <button
                    type="button"
                    onClick={handleClearLookup}
                    className="p-1.5 rounded-lg text-[#007DBA]/60 hover:text-[#00205B] hover:bg-[#007DBA]/10 transition-colors focus:outline-none"
                    aria-label="Clear lookup"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Badge number field ──────────────────────────────────── */}
        <div className="mb-5">
          <label className="dart-field-label">
            Employee badge number <span className="text-red-500">*</span>
          </label>

          {!isOnBehalf ? (
            /* Filing for yourself - LOCKED badge from Workday login */
            <div>
              <div className="relative">
                <div className={`${inputLocked} flex items-center gap-2 pr-10`}>
                  <Lock className="w-4 h-4 text-[#007DBA]/50 flex-shrink-0" />
                  <span className="flex-1">{data.employee_badge_number || '—'}</span>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-4 h-4 text-[#007DBA]" />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-[#007DBA]/80 font-['Poppins'] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked - auto-filled from your Workday login for data integrity
              </p>
            </div>
          ) : (
            /* Filing on behalf - SEARCHABLE badge with autocomplete */
            <div className="relative" ref={suggestRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={data.employee_badge_number || ''}
                  onChange={e => handleBadgeChange(e.target.value)}
                  onFocus={() => {
                    if (!data.employee_badge_number) {
                      setSuggestions(Object.values(EMPLOYEE_DB));
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Search badge number or name..."
                  className={`${inputEditable} pl-10 pr-20`}
                />
                {lookupState === 'loading' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-[#007DBA] animate-spin" />
                  </div>
                )}
                {lookupState === 'found' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-4 h-4 text-[#007DBA]" />
                  </div>
                )}
                {lookupState === 'not-found' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden max-h-64"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-['Poppins']">
                        {data.employee_badge_number ? 'Matching employees' : 'Search employees'}
                      </p>
                    </div>
                    <ul className="max-h-52 overflow-y-auto py-1">
                      {suggestions.slice(0, 8).map(emp => (
                        <li key={emp.badge}>
                          <button
                            type="button"
                            onMouseDown={() => handleSelectSuggestion(emp.badge)}
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

              {/* Status messages */}
              {lookupState === 'not-found' && (
                <p className="mt-1.5 text-xs text-amber-600 font-['Poppins'] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Badge not found in Workday. You can proceed manually.
                </p>
              )}
              {lookupState === 'found' && (
                <p className="mt-1.5 text-xs text-[#007DBA]/80 font-['Poppins'] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto-filled from Workday
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Auto-filled + manual fields ──────────────────────────────── */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

          {/* ── Basic Identity ── */}
          <SectionHeader title="Basic information" />

          <Field label="Employee name" required locked={locked}>
            {locked ? <ReadOnlyValue value={data.employee_name} /> : <input type="text" value={data.employee_name || ''} onChange={e => onUpdate({ employee_name: e.target.value })} placeholder="Full name" className={inputEditable} />}
          </Field>

          <Field label="Employee address" locked={locked}>
            {locked ? <ReadOnlyValue value={data.employee_address} /> : <input type="text" value={data.employee_address || ''} onChange={e => onUpdate({ employee_address: e.target.value })} placeholder="Street address" className={inputEditable} />}
          </Field>

          <Field label="Employee phone number" locked={locked}>
            {locked ? <ReadOnlyValue value={data.employee_phone} /> : <input type="tel" value={data.employee_phone || ''} onChange={e => onUpdate({ employee_phone: e.target.value })} placeholder="(214) 000-0000" className={inputEditable} />}
          </Field>

          <Field label="Employee age" locked={locked}>
            {locked ? <ReadOnlyValue value={data.employee_age} /> : <input type="number" min={16} max={80} value={data.employee_age || ''} onChange={e => onUpdate({ employee_age: e.target.value })} placeholder="Age" className={inputEditable} />}
          </Field>

          <Field label="Employee gender" locked={locked}>
            {locked ? (
              <ReadOnlyValue value={data.employee_gender} />
            ) : (
              <CustomSelect value={data.employee_gender || ''} onChange={v => onUpdate({ employee_gender: v })} options={GENDER_OPTIONS} placeholder="Select gender" />
            )}
          </Field>

          {/* ── Employment Details ── */}
          <SectionHeader title="Employment details" />

          <Field label="Date of hire" locked={locked}>
            {locked ? (
              <ReadOnlyValue value={data.date_of_hire ? new Date(data.date_of_hire + 'T00:00:00').toLocaleDateString('en-US') : undefined} />
            ) : (
              <DatePickerInput value={data.date_of_hire || ''} onChange={v => onUpdate({ date_of_hire: v })} />
            )}
          </Field>

          <Field label="Employee status" locked={locked}>
            {locked ? (
              <ReadOnlyValue value={data.employee_status} />
            ) : (
              <CustomSelect value={data.employee_status || ''} onChange={v => onUpdate({ employee_status: v })} options={STATUS_OPTIONS} placeholder="Select status" />
            )}
          </Field>

          <Field label="Department" locked={locked}>
            {locked ? (
              <ReadOnlyValue value={data.department} />
            ) : (
              <CustomSelect value={data.department || ''} onChange={v => onUpdate({ department: v })} options={DEPT_OPTIONS} placeholder="Select department" />
            )}
          </Field>

          <Field label="Assigned division" locked={locked}>
            {locked ? (
              <ReadOnlyValue value={data.assigned_division} />
            ) : (
              <CustomSelect value={data.assigned_division || ''} onChange={v => onUpdate({ assigned_division: v })} options={DIVISION_OPTIONS} placeholder="Select division" />
            )}
          </Field>

          <Field label="Division work" locked={locked}>
            {locked ? <ReadOnlyValue value={data.division_work} /> : <input type="text" value={data.division_work || ''} onChange={e => onUpdate({ division_work: e.target.value })} placeholder="e.g. Bus Operator" className={inputEditable} />}
          </Field>

          <Field label="Cost center" locked={locked}>
            {locked ? <ReadOnlyValue value={data.cost_center} /> : <input type="text" value={data.cost_center || ''} onChange={e => onUpdate({ cost_center: e.target.value })} placeholder="e.g. CC-4021" className={inputEditable} />}
          </Field>

          {/* ── Length of Service ── */}
          <SectionHeader title="Length of service in current job title" />

          <Field label="Years" locked={locked}>
            {locked ? <ReadOnlyValue value={data.service_years} /> : <input type="number" min={0} value={data.service_years || ''} onChange={e => onUpdate({ service_years: e.target.value })} placeholder="0" className={inputEditable} />}
          </Field>

          <Field label="Months" locked={locked}>
            {locked ? <ReadOnlyValue value={data.service_months} /> : <input type="number" min={0} max={11} value={data.service_months || ''} onChange={e => onUpdate({ service_months: e.target.value })} placeholder="0" className={inputEditable} />}
          </Field>

          <Field label="Days" locked={locked}>
            {locked ? <ReadOnlyValue value={data.service_days} /> : <input type="number" min={0} max={30} value={data.service_days || ''} onChange={e => onUpdate({ service_days: e.target.value })} placeholder="0" className={inputEditable} />}
          </Field>

          {/* ── Schedule ── */}
          <SectionHeader title="Schedule" />

          <div className="col-span-2">
            <Field label="Student employee?">
              <YesNoToggle value={data.is_student_employee} onChange={v => onUpdate({ is_student_employee: v })} />
            </Field>
          </div>

          <div className="col-span-2">
            <Field label="What is your regular day off?">
              <div className="flex gap-3">
                {(['Consecutive', 'Split'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onUpdate({ regular_day_off_type: opt, rdo_consecutive: undefined, rdo_split_1: undefined, rdo_split_2: undefined })}
                    className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm transition-all font-['Poppins'] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] ${data.regular_day_off_type === opt ? 'border-[#00205B] bg-[#EAF1F8] text-[#00205B] font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                  >
                    {opt === 'Consecutive' ? 'Consecutive days' : 'Split days'}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <AnimatePresence>
            {data.regular_day_off_type === 'Consecutive' && (
              <motion.div {...fade} key="rdo-consec" className="col-span-2">
                <Field label="Regular days off (RDO) – Consecutive">
                  <CustomSelect value={data.rdo_consecutive || ''} onChange={v => onUpdate({ rdo_consecutive: v })} options={RDO_CONSECUTIVE} placeholder="Select RDO pair" />
                </Field>
              </motion.div>
            )}
            {data.regular_day_off_type === 'Split' && (
              <motion.div {...fade} key="rdo-split" className="col-span-2 grid grid-cols-2 gap-5">
                <Field label="RDO Split – Day 1">
                  <CustomSelect value={data.rdo_split_1 || ''} onChange={v => onUpdate({ rdo_split_1: v })} options={RDO_DAYS} placeholder="Select day" />
                </Field>
                <Field label="RDO Split – Day 2">
                  <CustomSelect value={data.rdo_split_2 || ''} onChange={v => onUpdate({ rdo_split_2: v })} options={RDO_DAYS} placeholder="Select day" />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}