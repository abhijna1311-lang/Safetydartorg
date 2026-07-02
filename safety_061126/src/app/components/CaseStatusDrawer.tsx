import { X } from 'lucide-react';
import { CaseTimeline } from './CaseTimeline';
import { SectionStatusCard } from './SectionStatusCard';
import type { AccidentReportData } from '../types/accident-report';
import type { UserRole } from '../context/UserRoleContext';
import {
  areRequiredSectionsComplete,
  getSectionKeyForRole,
  WORKFLOW_SECTION_ORDER,
  type WorkflowReport,
  type WorkflowSectionKey,
  type WorkflowSectionState,
  type WorkflowSections,
} from '../types/workflow-report';

interface CaseStatusDrawerProps {
  open: boolean;
  onClose: () => void;
  caseId: string;
  data: AccidentReportData;
  initiatedBy: UserRole;
  currentRole: UserRole;
  currentUserName?: string;
  sections: WorkflowSections;
  activeSectionKey?: WorkflowSectionKey;
  timelineReport?: WorkflowReport;
}

const SECTION_OWNER_FALLBACK: Record<WorkflowSectionKey, string> = {
  operator: 'Operator',
  supervisor: 'Supervisor queue',
  programManager: 'PM queue',
};

function getSectionOwner(sectionKey: WorkflowSectionKey, data: AccidentReportData, currentRole: UserRole, currentUserName?: string) {
  if (sectionKey === getSectionKeyForRole(currentRole) && currentUserName) {
    return currentUserName;
  }

  if (sectionKey === 'operator') {
    return data.employee_name || data.on_behalf_employee || SECTION_OWNER_FALLBACK.operator;
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

function getCaseStatus(sections: WorkflowSections, timelineReport?: WorkflowReport) {
  if (timelineReport?.workflowStage === 'closed') {
    return 'Closed';
  }

  if (areRequiredSectionsComplete(sections)) {
    return 'Complete';
  }

  if (WORKFLOW_SECTION_ORDER.some((key) => sections[key].status === 'returned')) {
    return 'Returned for correction';
  }

  if (WORKFLOW_SECTION_ORDER.some((key) => sections[key].status === 'pending')) {
    return 'Waiting on sections';
  }

  return 'In progress';
}

function getWaitingOn(sections: WorkflowSections) {
  const waitingOn = WORKFLOW_SECTION_ORDER
    .map((key) => sections[key])
    .filter((section) => ['pending', 'in-progress', 'returned'].includes(section.status))
    .map((section) => section.label);

  return waitingOn.length > 0 ? waitingOn.join(', ') : 'All required sections complete';
}

function getStartedBy(initiatedBy: UserRole, currentRole: UserRole, currentUserName?: string) {
  return initiatedBy === currentRole && currentUserName ? currentUserName : initiatedBy;
}

export function CaseStatusDrawer({
  open,
  onClose,
  caseId,
  data,
  initiatedBy,
  currentRole,
  currentUserName,
  sections,
  activeSectionKey = getSectionKeyForRole(currentRole),
  timelineReport,
}: CaseStatusDrawerProps) {
  if (!open) {
    return null;
  }

  const caseFor = data.employee_name || data.on_behalf_employee || 'Employee pending';
  const caseStatus = getCaseStatus(sections, timelineReport);
  const waitingOn = getWaitingOn(sections);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Case status">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close case status" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Shared case</p>
            <h2 className="mt-1 text-xl font-semibold text-[#00205B] font-['Poppins']">{caseId}</h2>
            <p className="mt-1 text-sm text-slate-600 font-['Poppins']">{data.event_type || 'Event type pending'} · {data.mode || 'Mode pending'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60"
            aria-label="Close case status"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Case status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{caseStatus}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Waiting on</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{waitingOn}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Started by</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{getStartedBy(initiatedBy, currentRole, currentUserName)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Case for</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{caseFor}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Current role</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{currentRole}</p>
            </div>
          </div>

          {currentRole === 'Operator' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600 font-['Poppins']">Some reviewer details are hidden based on your role permissions.</p>
            </div>
          )}

          <div className="space-y-3">
            {WORKFLOW_SECTION_ORDER.map((sectionKey) => {
              const section = sections[sectionKey];
              const isCurrentUserSection = sectionKey === getSectionKeyForRole(currentRole);

              return (
                <SectionStatusCard
                  key={sectionKey}
                  section={section}
                  owner={getSectionOwner(sectionKey, data, currentRole, currentUserName)}
                  message={getSectionMessage(section, isCurrentUserSection)}
                  active={sectionKey === activeSectionKey}
                />
              );
            })}
          </div>

          {timelineReport && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CaseTimeline report={timelineReport} title="Timeline preview" compact />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}