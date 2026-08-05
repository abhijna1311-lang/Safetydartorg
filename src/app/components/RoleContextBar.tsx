import { CheckCircle, FileText } from 'lucide-react';
import type { AccidentReportData } from '../types/accident-report';
import type { UserRole } from '../context/UserRoleContext';
import { formatSectionStatus, type WorkflowSectionKey, type WorkflowSectionState } from '../types/workflow-report';

interface RoleContextBarProps {
  caseId: string;
  data: AccidentReportData;
  initiatedBy: UserRole;
  currentRole: UserRole;
  currentUserName?: string;
  activeSectionKey: WorkflowSectionKey;
  activeSection: WorkflowSectionState;
  currentStep: number;
  onViewCaseStatus: () => void;
}

const STEP_TITLES = ['Incident Basics', 'Incident Details', 'People And Impact', 'Review'];

function getStartedByName(initiatedBy: UserRole, currentRole: UserRole, currentUserName?: string, data?: AccidentReportData) {
  if (initiatedBy === currentRole && currentUserName) {
    return currentUserName;
  }

  if (initiatedBy === 'Supervisor') {
    return data?.supervisor_name || 'Supervisor';
  }

  if (initiatedBy === 'Operator') {
    return data?.employee_name || 'Operator';
  }

  return 'Program Manager';
}

function getCurrentTask(sectionKey: WorkflowSectionKey, section: WorkflowSectionState, currentStep: number) {
  if (section.status === 'returned') {
    return `Resolve correction in ${section.label}`;
  }

  if (['submitted', 'resubmitted', 'accepted'].includes(section.status)) {
    return formatSectionStatus(section.status);
  }

  if (sectionKey === 'supervisor') {
    return 'Complete Field Supervisor Collision Investigation';
  }

  if (sectionKey === 'programManager') {
    return 'Complete Program Manager Classification';
  }

  if (currentStep === 4) {
    return 'Review and submit section';
  }

  return `Complete ${STEP_TITLES[currentStep - 1] || STEP_TITLES[0]}`;
}

function getContextNote(initiatedBy: UserRole, currentRole: UserRole, currentUserName?: string, data?: AccidentReportData) {
  if (currentRole === 'Operator' && initiatedBy !== 'Operator') {
    return `Started for you by ${getStartedByName(initiatedBy, currentRole, currentUserName, data)}`;
  }

  if (currentRole === 'Supervisor' && initiatedBy === 'Supervisor' && data?.is_on_behalf === true) {
    return 'You are completing the Field Supervisor section. The employee will complete their Operator section separately.';
  }

  if (currentRole === 'Program Manager') {
    return 'You are completing the Program Manager section.';
  }

  return null;
}

export function RoleContextBar({
  caseId,
  data,
  initiatedBy,
  currentRole,
  currentUserName,
  activeSectionKey,
  activeSection,
  currentStep,
  onViewCaseStatus,
}: RoleContextBarProps) {
  const eventSummary = `${data.event_type || 'Event type pending'} · ${data.mode || 'Mode pending'}`;
  const caseFor = data.employee_name || data.on_behalf_employee || (currentRole === 'Operator' ? currentUserName : null) || 'Employee pending';
  const currentTask = getCurrentTask(activeSectionKey, activeSection, currentStep);
  const contextNote = getContextNote(initiatedBy, currentRole, currentUserName, data);
  const shouldShowCaseFor = currentRole === 'Supervisor' || currentRole === 'Program Manager';

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Current section context">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-5">
        {/* Identity cluster — grounded by a leading icon tile */}
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#00205B]/[0.06] text-[#00205B]">
            <FileText className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-['Poppins']">Case</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#00205B] font-['Poppins'] dart-tabular">{caseId}</p>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <p className="truncate text-sm text-slate-600 font-['Poppins']">{eventSummary}</p>
            </div>
            {(shouldShowCaseFor || contextNote) && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 font-['Poppins']">
                {shouldShowCaseFor && <span>Case for: {caseFor}</span>}
                {contextNote && <span>{contextNote}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Divider between identity and action */}
        <div className="hidden h-10 w-px flex-shrink-0 bg-slate-200 lg:block" />

        {/* Action cluster */}
        <div className="flex items-center justify-between gap-5 lg:justify-end">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-['Poppins']">Your task</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#00205B] font-['Poppins']">{currentTask}</p>
            {activeSection.status === 'returned' ? (
              <p className="mt-1 text-xs font-semibold text-amber-700 font-['Poppins']">Returned for correction</p>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 font-['Poppins']">
                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                Draft saved automatically
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onViewCaseStatus}
            className="inline-flex min-h-[38px] flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#007DBA] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60 font-['Poppins']"
          >
            View case status
          </button>
        </div>
      </div>
    </section>
  );
}