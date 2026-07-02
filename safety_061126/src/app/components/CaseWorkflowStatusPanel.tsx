import { ArrowRight, CheckCircle, Clock, Lock, RotateCcw } from 'lucide-react';
import type { AccidentReportData } from '../types/accident-report';
import type { UserRole } from '../context/UserRoleContext';
import {
  formatSectionStatus,
  getSectionKeyForRole,
  isSectionActionable,
  WORKFLOW_SECTION_ORDER,
  type WorkflowSectionKey,
  type WorkflowSectionState,
  type WorkflowSectionStatus,
  type WorkflowSections,
} from '../types/workflow-report';

interface CaseWorkflowStatusPanelProps {
  caseId: string;
  data: AccidentReportData;
  initiatedBy: UserRole;
  currentRole: UserRole;
  currentUserName?: string;
  sections: WorkflowSections;
  activeSectionKey?: WorkflowSectionKey;
  readonly?: boolean;
  compact?: boolean;
  onOpenSection?: (sectionKey: WorkflowSectionKey) => void;
}

const SECTION_OWNER_FALLBACK: Record<WorkflowSectionKey, string> = {
  operator: 'Operator',
  supervisor: 'Supervisor queue',
  programManager: 'PM queue',
};

function statusClasses(status: WorkflowSectionStatus) {
  switch (status) {
    case 'returned':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'pending':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'in-progress':
      return 'border-cyan-200 bg-cyan-50 text-cyan-800';
    case 'submitted':
    case 'resubmitted':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'accepted':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function getSectionOwner(sectionKey: WorkflowSectionKey, data: AccidentReportData, currentRole: UserRole, currentUserName?: string) {
  if (sectionKey === getSectionKeyForRole(currentRole) && currentUserName) {
    return currentUserName;
  }

  if (sectionKey === 'operator') {
    return data.employee_name || SECTION_OWNER_FALLBACK.operator;
  }

  if (sectionKey === 'supervisor') {
    return data.supervisor_name || SECTION_OWNER_FALLBACK.supervisor;
  }

  return SECTION_OWNER_FALLBACK.programManager;
}

function getSectionMessage(section: WorkflowSectionState, isCurrentUserSection: boolean) {
  switch (section.status) {
    case 'not-required':
      return 'This section is not required for this case.';
    case 'not-started':
      return 'This section has not started yet.';
    case 'pending':
      return isCurrentUserSection ? 'This section is waiting for your action.' : `Waiting for ${section.ownerRole}.`;
    case 'in-progress':
      return isCurrentUserSection ? 'You are completing this section.' : `${section.ownerRole} has started this section.`;
    case 'submitted':
      return 'This section has been submitted.';
    case 'resubmitted':
      return 'Corrections were resubmitted.';
    case 'returned':
      return isCurrentUserSection ? 'Only this section needs correction.' : `Returned to ${section.ownerRole} for correction.`;
    case 'accepted':
      return 'This section is complete.';
  }
}

function getNextBestAction(sections: WorkflowSections, currentRole: UserRole) {
  const currentSection = sections[getSectionKeyForRole(currentRole)];

  if (currentSection.status === 'returned') {
    return `Resolve correction in your ${currentSection.label}.`;
  }

  if (currentSection.status === 'pending') {
    return `Start your ${currentSection.label}.`;
  }

  if (currentSection.status === 'in-progress') {
    return `Continue your ${currentSection.label}.`;
  }

  const openSections = WORKFLOW_SECTION_ORDER
    .map((key) => sections[key])
    .filter((section) => ['pending', 'in-progress', 'returned'].includes(section.status));

  if (openSections.length > 0) {
    return `Waiting on ${openSections.map((section) => section.label).join(', ')}.`;
  }

  return 'All required sections are complete.';
}

function getSectionCta(section: WorkflowSectionState) {
  if (section.status === 'returned') {
    return 'Resolve correction';
  }

  if (section.status === 'pending') {
    return 'Start section';
  }

  if (section.status === 'in-progress') {
    return 'Continue section';
  }

  return null;
}

export function CaseWorkflowStatusPanel({
  caseId,
  data,
  initiatedBy,
  currentRole,
  currentUserName,
  sections,
  activeSectionKey = getSectionKeyForRole(currentRole),
  readonly = false,
  compact = false,
  onOpenSection,
}: CaseWorkflowStatusPanelProps) {
  const currentUserSection = sections[getSectionKeyForRole(currentRole)];
  const reportFor = data.employee_name || data.on_behalf_employee || 'Employee pending';
  const startedBy = initiatedBy === currentRole && currentUserName ? currentUserName : initiatedBy;
  const nextBestAction = getNextBestAction(sections, currentRole);
  const isClosed = WORKFLOW_SECTION_ORDER.every((key) => ['not-required', 'accepted', 'submitted', 'resubmitted'].includes(sections[key].status));

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5 md:p-6'}`} aria-label="Case workflow status">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">
              Shared case
            </span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold font-['Poppins'] ${isClosed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
              {isClosed ? 'Closed-ready' : 'Active'}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-[#00205B] font-['Poppins']">{caseId}</h2>
          <p className="mt-1 text-sm text-slate-600 font-['Poppins']">
            {data.event_type || 'Event type pending'} · {data.mode || 'Mode pending'}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 lg:max-w-sm">
          <div className="flex items-start gap-3">
            {currentUserSection.status === 'returned' ? <RotateCcw className="mt-0.5 h-4 w-4 text-amber-600" /> : <ArrowRight className="mt-0.5 h-4 w-4 text-[#007DBA]" />}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Your next action</p>
              <p className="mt-1 text-sm font-medium text-[#00205B] font-['Poppins']">{nextBestAction}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Started by</p>
          <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{startedBy}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Case for</p>
          <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{reportFor}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Current role</p>
          <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{currentRole}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Your section</p>
          <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">
            {currentUserSection.status === 'not-required' ? 'No section required' : currentUserSection.label}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {WORKFLOW_SECTION_ORDER.map((sectionKey) => {
          const section = sections[sectionKey];
          const isCurrentUserSection = sectionKey === getSectionKeyForRole(currentRole);
          const cta = isCurrentUserSection && isSectionActionable(section) ? getSectionCta(section) : null;

          return (
            <div key={sectionKey} className={`rounded-xl border p-4 ${sectionKey === activeSectionKey ? 'border-[#007DBA]/40 bg-blue-50/30' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">{section.label}</p>
                  <p className="mt-1 text-xs text-slate-500 font-['Poppins']">Owner: {getSectionOwner(sectionKey, data, currentRole, currentUserName)}</p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium font-['Poppins'] ${statusClasses(section.status)}`}>
                  {formatSectionStatus(section.status)}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 font-['Poppins']">
                {section.status === 'accepted' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : section.status === 'not-required' ? <Lock className="h-4 w-4 text-slate-400" /> : <Clock className="h-4 w-4 text-slate-400" />}
                <p>{getSectionMessage(section, isCurrentUserSection)}</p>
              </div>

              {!readonly && cta && (
                <button
                  type="button"
                  onClick={() => onOpenSection?.(sectionKey)}
                  className="mt-4 inline-flex min-h-[36px] items-center rounded-lg bg-[#007DBA] px-3 py-2 text-xs font-semibold text-white hover:bg-[#006BA0] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60 font-['Poppins']"
                >
                  {cta}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}