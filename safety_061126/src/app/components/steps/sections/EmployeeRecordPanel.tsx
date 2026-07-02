import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import type { AccidentReportData } from '../../../types/accident-report';
import { useUserRole } from '../../../context/UserRoleContext';
import { EMPLOYEE_DB } from '../../../data/employeeDatabase';

interface EmployeeRecordPanelProps {
  data: AccidentReportData;
  submissionContext?: {
    sectionLabel?: string;
    submittedAt?: string | null;
    caseEvent?: string;
  };
}

// ── helpers ───────────────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-blue-100/70 font-semibold font-['Poppins']">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-white/95 font-medium font-['Poppins']">
        {value || <span className="text-blue-100/40">—</span>}
      </dd>
    </div>
  );
}

function formatTenure(years?: string | number | null, months?: string | number | null) {
  const y = Number(years) || 0;
  const m = Number(months) || 0;
  if (!y && !m) return '';
  const parts: string[] = [];
  if (y) parts.push(`${y} ${y === 1 ? 'yr' : 'yrs'}`);
  if (m) parts.push(`${m} ${m === 1 ? 'mo' : 'mos'}`);
  return parts.join(' ');
}

function formatSubmittedAt(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── component ─────────────────────────────────────────────────────────────────
// Compact read-only context strip. Full Workday details behind an expand,
// because the operator rarely needs to re-verify their own address mid-form.
export function EmployeeRecordPanel({ data, submissionContext }: EmployeeRecordPanelProps) {
  const { roleConfig } = useUserRole();
  const [expanded, setExpanded] = useState(false);
  const workdayRecord = data.employee_badge_number ? EMPLOYEE_DB[data.employee_badge_number] : undefined;
  const badgeNumber = data.employee_badge_number || workdayRecord?.badge;
  const name = data.employee_name || workdayRecord?.name || roleConfig.name;
  const divisionWork = data.division_work || workdayRecord?.division_work || 'Employee';
  const division = data.assigned_division || workdayRecord?.division;
  const divisionSupervisor = data.division_supervisor || workdayRecord?.division_supervisor || data.supervisor_name;
  const dateOfHire = data.date_of_hire || workdayRecord?.hire_date;
  const hireDate = dateOfHire
    ? new Date(dateOfHire + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : undefined;
  const tenure = formatTenure(data.service_years || workdayRecord?.service_years, data.service_months || workdayRecord?.service_months);
  const submittedAt = formatSubmittedAt(submissionContext?.submittedAt);
  const panelDescriptor = submissionContext?.sectionLabel || 'From Workday';
  const secondaryContext = [
    submittedAt ? { label: 'Submitted', value: submittedAt } : null,
    submissionContext?.caseEvent ? { label: 'Case event', value: submissionContext.caseEvent } : null,
    hireDate ? { label: 'Hired', value: hireDate } : null,
    division ? { label: 'Division', value: division, paired: divisionSupervisor ? { label: 'Supervisor', value: divisionSupervisor } : undefined } : null,
    !division && divisionSupervisor ? { label: 'Supervisor', value: divisionSupervisor } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; paired?: { label: string; value: string } }>;

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(135deg,#00244F_0%,#00458F_45%,#0067B3_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_95%_at_8%_0%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_56%),radial-gradient(88%_80%_at_100%_100%,rgba(0,174,255,0.16)_0%,rgba(0,174,255,0)_70%)]"
        aria-hidden="true"
      />
      {/* Compact strip — layer in front. Always carries a subtle bottom inset shadow
          (hint of a card tucked behind), intensifies when the card is pulled out. */}
      <div
        className={`relative z-10 flex items-start gap-4 px-6 md:px-7 pt-5 pb-6 md:pt-6 md:pb-7 bg-[linear-gradient(180deg,rgba(4,44,89,0.58)_0%,rgba(2,35,74,0.52)_100%)] supports-[backdrop-filter]:bg-[#032C59]/58 backdrop-blur-[3px] transition-shadow duration-300 ${
          expanded
            ? 'shadow-[0_12px_20px_-16px_rgba(0,10,28,0.65),inset_0_1px_0_rgba(255,255,255,0.12)]'
            : 'shadow-[inset_0_-8px_14px_-12px_rgba(0,183,255,0.28),inset_0_1px_0_rgba(255,255,255,0.10)]'
        }`}
      >
        {/* Material icon only: filled account_box without an extra avatar background */}
        <span
          className="material-symbols-rounded text-white/95 flex-shrink-0 mt-0.5"
          style={{ fontSize: 34, lineHeight: 1, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          aria-hidden="true"
        >
          account_box
        </span>

        {/* Identity block: primary row for orientation, secondary row for submission context */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm font-['Poppins']">
            <span className="font-semibold text-white">{name || '—'}</span>
            <span className="text-white/30">·</span>
            <span className="text-blue-100/85">{divisionWork}</span>
            {badgeNumber && (
              <>
                <span className="text-white/30">·</span>
                <span className="text-blue-100/82">Badge #{badgeNumber}</span>
              </>
            )}
          </div>

          {secondaryContext.length > 0 && (
            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-['Poppins']">
              {secondaryContext.map((item, index) => (
                <div key={`${item.label}-${item.value}-${index}`} className="inline-flex shrink-0 items-center gap-2">
                  {index > 0 && <span className="h-3.5 w-px shrink-0 rounded-full bg-white/24" aria-hidden="true" />}
                  <span className="shrink-0 text-[11px] text-blue-100/65 font-semibold">{item.label}</span>
                  <span className="text-[12px] text-white/90 font-medium">{item.value}</span>
                  {item.paired && (
                    <>
                      <span className="h-3.5 w-px shrink-0 rounded-full bg-white/24" aria-hidden="true" />
                      <span className="shrink-0 text-[11px] text-blue-100/65 font-semibold">{item.paired.label}</span>
                      <span className="text-[12px] text-white/90 font-medium">{item.paired.value}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workday tag + expand toggle */}
        <div className="flex items-start gap-3 flex-shrink-0 pt-0.5 md:pt-1">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-blue-100/80 font-['Poppins']">
            <span
              className="material-symbols-rounded text-blue-100/85"
              style={{ fontSize: 14, lineHeight: 1, fontVariationSettings: "'FILL' 1, 'wght' 500, 'opsz' 20" }}
              aria-hidden="true"
            >
              lock
            </span>
            {panelDescriptor}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-[#CDE7FF] font-medium font-['Poppins'] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#7BC5FF] focus:ring-offset-0 rounded px-1.5 py-1"
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'Show full record'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded details — bottom-to-top slide: container grows first (makes room),
          then the panel visibly rises up from below into that space, spring-settled */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details-wrapper"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="relative z-10 overflow-hidden border-t border-white/18 bg-[linear-gradient(180deg,rgba(6,48,95,0.66)_0%,rgba(8,56,108,0.62)_100%)] supports-[backdrop-filter]:backdrop-blur-[2.5px]"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 32,
                mass: 0.9,
                delay: 0.08,
              }}
              className="px-5 py-4"
            >
              <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-5">
                <Detail label="Phone" value={data.employee_phone || workdayRecord?.phone} />
                <Detail label="Department" value={data.department || workdayRecord?.department} />
                <Detail label="Cost Center" value={data.cost_center || workdayRecord?.cost_center} />
                <Detail label="Length Of Service" value={tenure} />
                <div className="sm:col-span-2 xl:col-span-4 pt-1 border-t border-white/20">
                  <Detail label="Address" value={data.employee_address || workdayRecord?.address} />
                </div>
              </dl>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EmployeeRecordPanel;
