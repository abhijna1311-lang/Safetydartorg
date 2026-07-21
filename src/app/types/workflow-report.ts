import type { UserRole } from '../context/UserRoleContext';
import type { AccidentReportData } from './accident-report';

export type WorkflowStage = 'initiation' | 'operator-completion' | 'supervisor-review' | 'program-manager-review' | 'closed';
export type WorkflowHandoffAction = 'forwarded' | 'returned' | 'closed' | 'section-submitted' | 'section-resubmitted' | 'section-returned' | 'section-approved' | 'section-reassigned' | 'section-commented' | 'operator-waived' | 'rejected' | 'held';
export type WorkflowSectionKey = 'operator' | 'supervisor' | 'programManager';
export type WorkflowSectionStatus = 'not-required' | 'not-started' | 'pending' | 'in-progress' | 'submitted' | 'returned' | 'resubmitted' | 'accepted';
export type WorkflowOverallStatus = 'draft' | 'open' | 'waiting-on-sections' | 'correction-requested' | 'complete' | 'closed' | 'rejected';

export const STAGE_ORDER: WorkflowStage[] = [
  'initiation',
  'operator-completion',
  'supervisor-review',
  'program-manager-review',
  'closed',
];

export interface WorkflowHandoff {
  id: string;
  fromRole: UserRole;
  toRole: UserRole | null;
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  action: WorkflowHandoffAction;
  note?: string;
  targetSection?: WorkflowSectionKey;
  targetSections?: WorkflowSectionKey[];
  createdAt: string;
}

export interface WorkflowSectionState {
  key: WorkflowSectionKey;
  ownerRole: UserRole;
  label: string;
  status: WorkflowSectionStatus;
  submittedBy?: UserRole | null;
  submittedAt?: string | null;
  returnedBy?: UserRole | null;
  returnedAt?: string | null;
  correctionNote?: string | null;
  lastUpdatedAt?: string | null;
}

export type WorkflowSections = Record<WorkflowSectionKey, WorkflowSectionState>;

export interface WorkflowReport {
  id: string;
  initiatedBy: UserRole;
  workflowStage: WorkflowStage;
  overallStatus?: WorkflowOverallStatus;
  sections?: WorkflowSections;
  currentStep: number;
  formData: AccidentReportData;
  createdAt: string;
  lastSavedAt: string;
  dueBy?: string;
  lastSubmittedBy?: UserRole | null;
  handoffNote?: string | null;
  handoffHistory?: WorkflowHandoff[];
  closedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: UserRole | null;
}

export function getInitialStage(role: UserRole): WorkflowStage {
  return role === 'Operator' ? 'operator-completion' : 'initiation';
}

export function getAssignedRole(stage: WorkflowStage, initiatedBy: UserRole, isOnBehalf?: boolean): UserRole | null {
  switch (stage) {
    case 'initiation':
      return initiatedBy === 'Operator' ? 'Operator' : initiatedBy;
    case 'operator-completion':
      if (initiatedBy === 'Supervisor' && isOnBehalf === false) {
        return 'Supervisor';
      }
      return 'Operator';
    case 'supervisor-review':
      return 'Supervisor';
    case 'program-manager-review':
      return 'Program Manager';
    case 'closed':
      return null;
  }
}

export function getNextStage(stage: WorkflowStage, initiatedBy: UserRole, isOnBehalf?: boolean): WorkflowStage | null {
  switch (stage) {
    case 'initiation':
      return 'operator-completion';
    case 'operator-completion':
      if (initiatedBy === 'Supervisor' && isOnBehalf === false) {
        return 'program-manager-review';
      }
      return 'supervisor-review';
    case 'supervisor-review':
      return 'program-manager-review';
    case 'program-manager-review':
      return 'closed';
    case 'closed':
      return null;
  }
}

export function getReturnStage(stage: WorkflowStage, initiatedBy: UserRole, isOnBehalf?: boolean): WorkflowStage | null {
  switch (stage) {
    case 'supervisor-review':
      return 'operator-completion';
    case 'program-manager-review':
      if (initiatedBy === 'Supervisor' && isOnBehalf === false) {
        return 'operator-completion';
      }
      return 'supervisor-review';
    default:
      return null;
  }
}

export function getLatestHandoff(report: WorkflowReport): WorkflowHandoff | null {
  const history = report.handoffHistory;
  if (!history || history.length === 0) {
    return null;
  }

  return history[history.length - 1] || null;
}

export function formatShortDate(value?: string): string {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

export function getStepName(report: WorkflowReport): string {
  const sections = getWorkflowSections(report);
  const returnedSection = WORKFLOW_SECTION_ORDER.find((key) => sections[key].status === 'returned');
  if (returnedSection) {
    return `${getSectionLabel(returnedSection)} correction`;
  }

  const actionableSection = WORKFLOW_SECTION_ORDER.find((key) => isSectionActionable(sections[key]));
  if (actionableSection) {
    return sections[actionableSection].label;
  }

  if (areRequiredSectionsComplete(sections)) {
    return 'Completed report';
  }

  const latestHandoff = getLatestHandoff(report);

  if (latestHandoff?.action === 'returned') {
    switch (report.workflowStage) {
      case 'operator-completion':
        return 'Correction requested';
      case 'supervisor-review':
        return 'Supervisor clarification';
    }
  }

  if (report.currentStep === 4) {
    switch (report.workflowStage) {
      case 'supervisor-review':
        return 'Supervisor review';
      case 'program-manager-review':
        return 'Program manager review';
      case 'closed':
        return 'Closed';
      default:
        return 'Review and submit';
    }
  }

  switch (report.currentStep) {
    case 1:
      return report.workflowStage === 'initiation' ? 'Initial intake started' : 'Incident basics';
    case 2:
      return 'Vehicle and location';
    case 3:
      return 'People and impact';
    default:
      return 'Review and submit';
  }
}

export function getReportLocation(data: AccidentReportData): string {
  const streetLocation = [data.street_on, data.cross_street].filter(Boolean).join(' & ');
  return streetLocation || data.address_of_event || data.station_applicable || data.grade_crossing_applicable || data.city || 'Location pending';
}

export function getWorkflowStatus(report: WorkflowReport): string {
  if (report.rejectionReason || report.overallStatus === 'rejected') {
    return 'Rejected';
  }

  const sections = getWorkflowSections(report);
  const overallStatus = report.overallStatus || getOverallStatusFromSections(sections, report.workflowStage === 'closed');

  switch (overallStatus) {
    case 'rejected':
      return 'Rejected';
    case 'closed':
      return 'Closed';
    case 'complete':
      return 'All sections complete';
    case 'correction-requested':
      return 'Correction requested';
    case 'waiting-on-sections':
      return `Waiting on ${getPendingSectionLabels(report)}`;
    case 'open':
      return `Open sections: ${getPendingSectionLabels(report)}`;
    case 'draft':
      return 'Draft';
  }

  const latestHandoff = getLatestHandoff(report);

  if (latestHandoff?.action === 'returned') {
    switch (report.workflowStage) {
      case 'operator-completion':
        return 'Returned to operator';
      case 'supervisor-review':
        return 'Returned to supervisor';
    }
  }

  switch (report.workflowStage) {
    case 'initiation':
      return 'Initiation in progress';
    case 'operator-completion':
      if (report.initiatedBy === 'Supervisor' && report.formData.is_on_behalf === false) {
        return 'In progress';
      }
      return report.initiatedBy === 'Operator' ? 'In progress' : 'Awaiting operator completion';
    case 'supervisor-review':
      return 'Under supervisor review';
    case 'program-manager-review':
      return 'Under final review';
    case 'closed':
      return 'Closed';
  }
}

export const WORKFLOW_SECTION_ORDER: WorkflowSectionKey[] = ['operator', 'supervisor', 'programManager'];

const SECTION_META: Record<WorkflowSectionKey, { ownerRole: UserRole; label: string }> = {
  operator: { ownerRole: 'Operator', label: 'Operator section' },
  supervisor: { ownerRole: 'Supervisor', label: 'Supervisor section collision' },
  programManager: { ownerRole: 'Program Manager', label: 'Program manager section' },
};

const ACTIONABLE_SECTION_STATUSES: WorkflowSectionStatus[] = ['pending', 'in-progress', 'returned'];

export function getSectionKeyForRole(role: UserRole): WorkflowSectionKey {
  switch (role) {
    case 'Supervisor':
      return 'supervisor';
    case 'Program Manager':
      return 'programManager';
    default:
      return 'operator';
  }
}

export function getSectionRole(sectionKey: WorkflowSectionKey): UserRole {
  return SECTION_META[sectionKey].ownerRole;
}

export function getSectionLabel(sectionKey: WorkflowSectionKey): string {
  return SECTION_META[sectionKey].label;
}

export function getRequiredSectionKeys(initiatedBy: UserRole, isOnBehalf?: boolean): WorkflowSectionKey[] {
  if (initiatedBy === 'Supervisor' && isOnBehalf === false) {
    return ['supervisor', 'programManager'];
  }

  return ['operator', 'supervisor', 'programManager'];
}

export function createSectionState(key: WorkflowSectionKey, status: WorkflowSectionStatus = 'not-started', timestamp?: string | null): WorkflowSectionState {
  return {
    key,
    ownerRole: SECTION_META[key].ownerRole,
    label: SECTION_META[key].label,
    status,
    submittedBy: null,
    submittedAt: null,
    returnedBy: null,
    returnedAt: null,
    correctionNote: null,
    lastUpdatedAt: timestamp || null,
  };
}

export function createInitialSections(initiatedBy: UserRole, isOnBehalf?: boolean, timestamp = new Date().toISOString()): WorkflowSections {
  const required = new Set(getRequiredSectionKeys(initiatedBy, isOnBehalf));
  const sections = WORKFLOW_SECTION_ORDER.reduce((acc, key) => {
    acc[key] = createSectionState(key, required.has(key) ? 'not-started' : 'not-required', timestamp);
    return acc;
  }, {} as WorkflowSections);

  const starterKey = getSectionKeyForRole(initiatedBy);
  if (required.has(starterKey)) {
    sections[starterKey] = {
      ...sections[starterKey],
      status: 'in-progress',
      lastUpdatedAt: timestamp,
    };
  }

  return sections;
}

function mergeSectionDefaults(sections: Partial<WorkflowSections> | undefined, initiatedBy: UserRole, isOnBehalf?: boolean, timestamp?: string): WorkflowSections {
  const base = createInitialSections(initiatedBy, isOnBehalf, timestamp || new Date().toISOString());
  if (!sections) {
    return base;
  }

  return WORKFLOW_SECTION_ORDER.reduce((acc, key) => {
    acc[key] = {
      ...base[key],
      ...sections[key],
      key,
      ownerRole: SECTION_META[key].ownerRole,
      label: SECTION_META[key].label,
    };
    return acc;
  }, {} as WorkflowSections);
}

function legacySectionsFromStage(report: WorkflowReport): WorkflowSections {
  const timestamp = report.lastSavedAt || report.createdAt;
  const sections = createInitialSections(report.initiatedBy, report.formData.is_on_behalf, timestamp);
  const latestHandoff = getLatestHandoff(report);
  const markSubmitted = (key: WorkflowSectionKey, role: UserRole | null = getSectionRole(key)) => {
    sections[key] = {
      ...sections[key],
      status: 'submitted',
      submittedBy: role,
      submittedAt: timestamp,
      lastUpdatedAt: timestamp,
    };
  };
  const markActionable = (key: WorkflowSectionKey, status: WorkflowSectionStatus = 'pending') => {
    if (sections[key].status !== 'not-required') {
      sections[key] = {
        ...sections[key],
        status,
        returnedBy: status === 'returned' ? latestHandoff?.fromRole || null : sections[key].returnedBy,
        returnedAt: status === 'returned' ? latestHandoff?.createdAt || timestamp : sections[key].returnedAt,
        correctionNote: status === 'returned' ? latestHandoff?.note || report.handoffNote || null : sections[key].correctionNote,
        lastUpdatedAt: timestamp,
      };
    }
  };

  switch (report.workflowStage) {
    case 'initiation':
      markActionable(getSectionKeyForRole(report.initiatedBy), 'in-progress');
      break;
    case 'operator-completion':
      if (report.initiatedBy !== 'Operator') {
        markSubmitted(getSectionKeyForRole(report.initiatedBy), report.initiatedBy);
      }
      if (report.initiatedBy === 'Supervisor' && report.formData.is_on_behalf === false) {
        markActionable('supervisor', latestHandoff?.action === 'returned' ? 'returned' : 'in-progress');
      } else {
        markActionable('operator', latestHandoff?.action === 'returned' ? 'returned' : report.lastSubmittedBy ? 'pending' : 'in-progress');
        if (report.initiatedBy !== 'Operator' && sections.programManager.status !== 'not-required') {
          markActionable('programManager', 'pending');
        }
      }
      break;
    case 'supervisor-review':
      markSubmitted('operator', 'Operator');
      markActionable('supervisor', latestHandoff?.action === 'returned' ? 'returned' : 'pending');
      markActionable('programManager', 'pending');
      break;
    case 'program-manager-review':
      markSubmitted('operator', 'Operator');
      if (sections.supervisor.status !== 'not-required') {
        markSubmitted('supervisor', 'Supervisor');
      }
      markActionable('programManager', latestHandoff?.action === 'returned' ? 'returned' : 'pending');
      break;
    case 'closed':
      WORKFLOW_SECTION_ORDER.forEach((key) => {
        if (sections[key].status !== 'not-required') {
          sections[key] = {
            ...sections[key],
            status: 'accepted',
            submittedBy: sections[key].ownerRole,
            submittedAt: report.closedAt || timestamp,
            lastUpdatedAt: report.closedAt || timestamp,
          };
        }
      });
      break;
  }

  return sections;
}

export function getWorkflowSections(report: WorkflowReport): WorkflowSections {
  if (report.sections) {
    return mergeSectionDefaults(report.sections, report.initiatedBy, report.formData.is_on_behalf, report.createdAt);
  }

  return legacySectionsFromStage(report);
}

export function isSectionActionable(section: WorkflowSectionState): boolean {
  return ACTIONABLE_SECTION_STATUSES.includes(section.status);
}

export function getActionableSectionForRole(report: WorkflowReport, role: UserRole): WorkflowSectionState | null {
  const section = getWorkflowSections(report)[getSectionKeyForRole(role)];
  return isSectionActionable(section) ? section : null;
}

// A case is in a role's action queue only when it is genuinely their turn — their section is
// actionable AND it is the FIRST open section (everyone earlier in the chain is done). This keeps
// a case out of the PM/supervisor queue until the sections ahead of it close.
export function isRoleTurnForReport(report: WorkflowReport, role: UserRole): boolean {
  const sections = getWorkflowSections(report);
  const roleKey = getSectionKeyForRole(role);
  if (!isSectionActionable(sections[roleKey])) return false;
  return WORKFLOW_SECTION_ORDER.find((key) => isSectionActionable(sections[key])) === roleKey;
}

export function wasRoleInvolvedInReport(report: WorkflowReport, role: UserRole): boolean {
  const section = getWorkflowSections(report)[getSectionKeyForRole(role)];
  return report.initiatedBy === role || report.lastSubmittedBy === role || section.status !== 'not-required';
}

export function markSectionSubmitted(sections: WorkflowSections, sectionKey: WorkflowSectionKey, submittedBy: UserRole, timestamp = new Date().toISOString()): WorkflowSections {
  const wasReturned = sections[sectionKey].status === 'returned';

  return {
    ...sections,
    [sectionKey]: {
      ...sections[sectionKey],
      status: wasReturned ? 'resubmitted' : 'submitted',
      submittedBy,
      submittedAt: timestamp,
      returnedBy: null,
      returnedAt: null,
      correctionNote: null,
      lastUpdatedAt: timestamp,
    },
  };
}

export function activateParallelSections(sections: WorkflowSections, initiatedBy: UserRole, isOnBehalf?: boolean, timestamp = new Date().toISOString()): WorkflowSections {
  const required = new Set(getRequiredSectionKeys(initiatedBy, isOnBehalf));

  return WORKFLOW_SECTION_ORDER.reduce((acc, key) => {
    const section = acc[key];
    if (!required.has(key)) {
      acc[key] = { ...section, status: 'not-required', lastUpdatedAt: timestamp };
      return acc;
    }

    if (section.status === 'not-started') {
      acc[key] = { ...section, status: 'pending', lastUpdatedAt: timestamp };
    }

    return acc;
  }, { ...sections } as WorkflowSections);
}

export function returnWorkflowSection(sections: WorkflowSections, sectionKey: WorkflowSectionKey, returnedBy: UserRole, note: string, timestamp = new Date().toISOString()): WorkflowSections {
  return {
    ...sections,
    [sectionKey]: {
      ...sections[sectionKey],
      status: 'returned',
      returnedBy,
      returnedAt: timestamp,
      correctionNote: note,
      lastUpdatedAt: timestamp,
    },
  };
}

export function areRequiredSectionsComplete(sections: WorkflowSections): boolean {
  return WORKFLOW_SECTION_ORDER.every((key) => ['not-required', 'submitted', 'resubmitted', 'accepted'].includes(sections[key].status));
}

export function getOverallStatusFromSections(sections: WorkflowSections, isClosed = false): WorkflowOverallStatus {
  if (isClosed) {
    return 'closed';
  }

  if (WORKFLOW_SECTION_ORDER.some((key) => sections[key].status === 'returned')) {
    return 'correction-requested';
  }

  if (areRequiredSectionsComplete(sections)) {
    return 'complete';
  }

  if (WORKFLOW_SECTION_ORDER.some((key) => sections[key].status === 'pending')) {
    return 'waiting-on-sections';
  }

  return 'open';
}

export function getLegacyStageFromSections(sections: WorkflowSections): WorkflowStage {
  if (areRequiredSectionsComplete(sections)) {
    return 'closed';
  }

  const actionableKey = WORKFLOW_SECTION_ORDER.find((key) => isSectionActionable(sections[key]));
  switch (actionableKey) {
    case 'operator':
      return 'operator-completion';
    case 'supervisor':
      return 'supervisor-review';
    case 'programManager':
      return 'program-manager-review';
    default:
      return 'initiation';
  }
}

export function getPendingSectionLabels(report: WorkflowReport): string {
  const sections = getWorkflowSections(report);
  const pending = WORKFLOW_SECTION_ORDER
    .map((key) => sections[key])
    .filter((section) => ['pending', 'in-progress', 'returned'].includes(section.status))
    .map((section) => section.label.replace(' section', ''));

  return pending.length > 0 ? pending.join(', ') : 'All sections complete';
}

export function formatSectionStatus(status: WorkflowSectionStatus): string {
  switch (status) {
    case 'not-required':
      return 'Not required';
    case 'not-started':
      return 'Not started';
    case 'pending':
      return 'Pending';
    case 'in-progress':
      return 'In progress';
    case 'submitted':
      return 'Submitted';
    case 'returned':
      return 'Returned for correction';
    case 'resubmitted':
      return 'Resubmitted';
    case 'accepted':
      return 'Complete';
  }
}