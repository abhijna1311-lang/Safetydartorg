import { ArrowRight, CheckCircle } from 'lucide-react';
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

const STEP_TITLES = ['Incident Basics', 'Vehicle and Location', 'People and Impact', 'Review and Submit'];

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
    return 'Complete Supervisor Collision Investigation';
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
    return 'You are completing the Supervisor section. The employee will complete their Operator section separately.';
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
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm" aria-label="Current section context">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">{caseId}</p>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <p className="text-sm text-slate-600 font-['Poppins']">{eventSummary}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-['Poppins']">
            {shouldShowCaseFor && <span>Case for: {caseFor}</span>}
            {contextNote && <span>{contextNote}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#00205B] font-['Poppins']">
              <ArrowRight className="h-4 w-4 text-[#007DBA]" />
              <span>{currentTask}</span>
            </div>
            {activeSection.status === 'returned' && (
              <div className="mt-1 text-xs font-semibold text-amber-800 font-['Poppins']">Returned for correction</div>
            )}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-['Poppins']">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Draft saved automatically</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewCaseStatus}
            className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#007DBA] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60 font-['Poppins']"
          >
            View case status
          </button>
        </div>
      </div>
    </section>
  );
}