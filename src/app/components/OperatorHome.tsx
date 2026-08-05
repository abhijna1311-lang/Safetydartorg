import { useMemo, useState } from 'react';
import { MdAccessTime, MdAdd, MdArrowForward, MdCheckCircle, MdDelete, MdDescription, MdNotifications, MdPendingActions } from 'react-icons/md';
import { DARTFooter } from './DARTFooter';
import { DARTHeader } from './DARTHeader';
import { useUserRole, type UserRole } from '../context/UserRoleContext';
import {
  formatShortDate,
  getActionableSectionForRole,
  getLatestHandoff,
  getPendingSectionLabels,
  getStepName,
  getWorkflowStatus,
  isRoleTurnForReport,
  wasRoleInvolvedInReport,
  type WorkflowReport,
  type WorkflowSectionState,
} from '../types/workflow-report';

function getQueuePresentation(role: UserRole, report: WorkflowReport, section: WorkflowSectionState, wasReturned: boolean) {
  const isLeaderStartedForOperator = section.key === 'operator' && report.initiatedBy !== 'Operator';

  // Assistant Manager: they don't own a section — they review the Field Supervisor's
  // submission. Show a card that reflects "case is ready for your review" rather
  // than the Field Supervisor's own status.
  if (role === 'Assistant Manager') {
    return {
      title: 'Ready for your review',
      contextLabel: 'What happens next',
      contextValue: 'The Field Supervisor has completed their section. Approve to send to the Safety Program Manager, return for rework, or reassign.',
      ownerLabel: 'Sent by',
      priorityLabel: 'Review needed',
    };
  }

  // Station Supervisor: read-only acknowledgment task. They confirm receipt
  // once the operator submits — no workflow gating, no ability to edit.
  if (role === 'Station Supervisor') {
    return {
      title: 'Acknowledge operator submission',
      contextLabel: 'What you need to do',
      contextValue: 'The operator completed their section. Review the report and confirm receipt. This does not change the workflow.',
      ownerLabel: 'Submitted by',
      priorityLabel: 'Acknowledgment needed',
    };
  }

  if (wasReturned || section.status === 'returned') {
    return {
      title: `${section.label} returned for correction`,
      contextLabel: 'Correction requested',
      contextValue: section.correctionNote || report.handoffNote || 'A reviewer sent this section back for updates before the case can complete.',
      ownerLabel: 'Sent back by',
      priorityLabel: 'Correction needed',
    };
  }

  if (section.key === 'operator' && isLeaderStartedForOperator) {
    return {
      title: 'Operator section pending',
      contextLabel: 'Why you are seeing this',
      contextValue: `${report.initiatedBy} opened the case. Complete the operator facts while other assigned sections move in parallel.`,
      ownerLabel: 'Started by',
      priorityLabel: 'Your section',
    };
  }

  if (section.key === 'supervisor' && report.initiatedBy === 'Supervisor' && section.status === 'in-progress') {
    return {
      title: 'Continue Field Supervisor collision section',
      contextLabel: 'What happens next',
      contextValue: 'Submit your Field Supervisor collision section to notify the operator and Safety Program Manager in tandem.',
      ownerLabel: 'Current section owner',
      priorityLabel: 'In progress',
    };
  }

  if (section.key === 'supervisor') {
    return {
      title: 'Field Supervisor section pending',
      contextLabel: 'What needs completion',
      contextValue: 'Complete the Field Supervisor collision investigation section. Safety Program Manager work can happen separately on the same case.',
      ownerLabel: 'Assigned section',
      priorityLabel: 'Investigation needed',
    };
  }

  if (section.key === 'programManager') {
    return {
      title: 'Safety Program Manager section pending',
      contextLabel: 'What needs classification',
      contextValue: `Complete program manager classification. Open sections: ${getPendingSectionLabels(report)}.`,
      ownerLabel: 'Assigned section',
      priorityLabel: 'Final decision',
    };
  }

  return {
    title: 'Continue operator section',
    contextLabel: 'Why you are seeing this',
    contextValue: 'Complete the operator facts. Submitting will notify supervisor and program manager sections in parallel.',
    ownerLabel: 'Started by',
    priorityLabel: role === 'Operator' ? 'Your section' : 'In progress',
  };
}

function getSectionCtaLabel(section: WorkflowSectionState, role: UserRole) {
  if (role === 'Assistant Manager') {
    return 'Open review';
  }
  if (role === 'Station Supervisor') {
    return 'Acknowledge report';
  }
  if (section.status === 'returned') {
    return 'Resolve correction';
  }

  if (section.key === 'operator') {
    return 'Continue Operator Section';
  }

  if (section.key === 'supervisor') {
    return section.status === 'in-progress' ? 'Continue Field Supervisor Section' : 'Start Field Supervisor Section';
  }

  return section.status === 'in-progress' ? 'Continue Safety Program Manager Section' : 'Open Safety Program Manager Section';
}

interface OperatorHomeProps {
  onNavigate?: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
  onStartNewReport?: () => void;
  onOpenReport?: (reportId: string) => void;
  onDeleteDraft?: (reportId: string) => void;
  reports?: WorkflowReport[];
}

interface HomeDraftReport {
  eventId: string;
  mode: string;
  lastSaved: string;
  currentStep: number;
  stepName: string;
  sectionName?: string;
  nextRequiredField?: string;
  savedData: Record<string, unknown>;
}

interface HomeQueueReport {
  eventId: string;
  title: string;
  ownerLabel: string;
  ownerValue: string;
  contextLabel: string;
  contextValue: string;
  dueBy: string;
  priorityLabel: string;
  reportFor?: string;
  requiredSection?: string;
  ctaLabel?: string;
  currentStep: number;
  savedData: Record<string, unknown>;
}

interface HomeActivityReport {
  eventId: string;
  date: string;
  mode: string;
  status: string;
  injury: string;
}

const HOME_COPY: Record<UserRole, {
  intro: string;
  heroTitle: string;
  heroDescription: string;
  heroButtonLabel: string;
  queueMetricLabel: string;
  queueMetricHelper: string;
  completedMetricLabel: string;
  completedMetricHelper: string;
  queueSectionTitle: string;
  queueSectionDescription: string;
  draftsDescription: string;
  activityTitle: string;
  activityDescription: string;
}> = {
  Operator: {
    intro: 'Finish case sections that were assigned to you, or start a case yourself when reporting directly from the field.',
    heroTitle: 'Start a new Safety Event',
    heroDescription: 'Record what happened and fill in your section. Your progress saves automatically as you go.',
    heroButtonLabel: 'Start New Case',
    queueMetricLabel: 'Awaiting your action',
    queueMetricHelper: 'Your section tasks',
    completedMetricLabel: 'Closed this month',
    completedMetricHelper: 'Cases completed',
    queueSectionTitle: 'Your queue',
    queueSectionDescription: 'Cases waiting for your Operator Section or correction.',
    draftsDescription: 'Section drafts you started and can resume.',
    activityTitle: 'Recent case activity',
    activityDescription: 'Cases you have touched recently.',
  },
  Supervisor: {
    intro: 'Start cases when operators cannot, then complete Field Supervisor collision sections assigned to you.',
    heroTitle: 'Start a new Safety Event',
    heroDescription: 'Record what happened and fill in your section. Your progress saves automatically as you go.',
    heroButtonLabel: 'Start New Case',
    queueMetricLabel: 'Awaiting your section',
    queueMetricHelper: 'Supervisor action',
    completedMetricLabel: 'Forwarded this month',
    completedMetricHelper: 'Last 30 days',
    queueSectionTitle: 'Your queue',
    queueSectionDescription: 'Cases waiting for your Field Supervisor section or correction.',
    draftsDescription: 'In progress',
    activityTitle: 'Recent supervisor activity',
    activityDescription: 'Cases you recently reviewed or routed.',
  },
  'Program Manager': {
    intro: 'Complete classification sections, request targeted corrections, and close cases when all role sections are in.',
    heroTitle: 'Start a new Safety Event',
    heroDescription: 'Record what happened and fill in your section. Your progress saves automatically as you go.',
    heroButtonLabel: 'Start New Case',
    queueMetricLabel: 'Awaiting your section',
    queueMetricHelper: 'Classification action',
    completedMetricLabel: 'Closed this month',
    completedMetricHelper: 'Last 30 days',
    queueSectionTitle: 'Your queue',
    queueSectionDescription: 'Cases waiting for Safety Program Manager classification or targeted correction.',
    draftsDescription: 'In progress',
    activityTitle: 'Recent manager activity',
    activityDescription: 'Cases you recently finalized or sent back.',
  },
  'Assistant Manager': {
    intro: 'Review Field Supervisor reports and route them to the Safety Program Manager for classification.',
    heroTitle: 'Start a new Safety Event',
    heroDescription: 'Cases sent by a Field Supervisor land here for your review. Approve to move the report along, return for rework, or reassign.',
    heroButtonLabel: 'Start New Case',
    queueMetricLabel: 'Awaiting your review',
    queueMetricHelper: 'Field Supervisor submissions',
    completedMetricLabel: 'Reviewed this month',
    completedMetricHelper: 'Last 30 days',
    queueSectionTitle: 'Your queue',
    queueSectionDescription: 'Cases waiting for your review before Safety Program Manager classification.',
    draftsDescription: 'In progress',
    activityTitle: 'Recent review activity',
    activityDescription: 'Cases you recently reviewed or routed.',
  },
  'Station Supervisor': {
    intro: 'Confirm receipt of operator submissions. Your acknowledgment is recorded on the case — no workflow action needed.',
    heroTitle: 'Acknowledgments only',
    heroDescription: 'This role is receipt-only. Reports appear here after the operator submits. Field Supervisor and Safety Program Manager review continues in parallel.',
    heroButtonLabel: 'Start New Case',
    queueMetricLabel: 'Awaiting your acknowledgment',
    queueMetricHelper: 'Operator submissions',
    completedMetricLabel: 'Acknowledged this month',
    completedMetricHelper: 'Last 30 days',
    queueSectionTitle: 'Pending acknowledgments',
    queueSectionDescription: 'Reports where the operator has submitted and you have not yet acknowledged.',
    draftsDescription: 'In progress',
    activityTitle: 'Recent acknowledgments',
    activityDescription: 'Reports you recently acknowledged.',
  },
};

const DRAFT_REPORTS_BY_ROLE: Record<UserRole, HomeDraftReport[]> = {
  Operator: [
    {
      eventId: 'AR-2025-0012',
      mode: 'Bus',
      lastSaved: '11/15/2025',
      currentStep: 2,
      stepName: 'Incident details',
      savedData: {
        step1: { vehicleMode: 'Bus', eventType: 'Collision' },
        step2: { vehicleNumber: '2045', route: '15', location: '123 Main St & 5th Ave' },
      },
    },
    {
      eventId: 'AR-2025-0009',
      mode: 'Rail',
      lastSaved: '11/12/2025',
      currentStep: 3,
      stepName: 'People and impact',
      savedData: {
        step1: { vehicleMode: 'Rail', eventType: 'Passenger incident' },
        step2: { vehicleNumber: 'R-301', route: 'Green Line', location: 'Downtown Station' },
      },
    },
  ],
  Supervisor: [
    {
      eventId: 'AR-2025-0013',
      mode: 'Bus',
      lastSaved: '11/16/2025',
      currentStep: 1,
      stepName: 'Initial intake started',
      savedData: {
        step1: { vehicleMode: 'Bus', eventType: 'Collision', incidentDate: '2025-11-16' },
      },
    },
  ],
  'Program Manager': [
    {
      eventId: 'AR-2025-0015',
      mode: 'Rail',
      lastSaved: '11/17/2025',
      currentStep: 4,
      stepName: 'Final classification notes',
      savedData: {
        step1: { vehicleMode: 'Rail', eventType: 'Passenger injury', incidentDate: '2025-11-17' },
      },
    },
  ],
  'Assistant Manager': [],
  'Station Supervisor': [],
};

const QUEUE_REPORTS_BY_ROLE: Record<UserRole, HomeQueueReport[]> = {
  Operator: [
    {
      eventId: 'AR-2025-0010',
      title: 'Started on your behalf',
      ownerLabel: 'Started by',
      ownerValue: 'Aitana Bonmati (Supervisor)',
      contextLabel: 'Why you are seeing this',
      contextValue: 'Control center called this in. Finish the operator details before supervisor review.',
      dueBy: '11/20/2025',
      priorityLabel: 'High priority',
      currentStep: 1,
      savedData: {
        step1: { vehicleMode: 'Bus', eventType: 'Collision', incidentDate: '2025-11-18', incidentTime: '14:30' },
      },
    },
  ],
  Supervisor: [
    {
      eventId: 'AR-2025-0011',
      title: 'Ready for supervisor review',
      ownerLabel: 'Submitted by',
      ownerValue: 'Bukayo Saka (Operator)',
      contextLabel: 'What needs review',
      contextValue: 'Operator completed the narrative and people impact section. Confirm scene facts and forward it.',
      dueBy: '11/19/2025',
      priorityLabel: 'Needs review',
      currentStep: 4,
      savedData: {
        step1: { vehicleMode: 'Bus', eventType: 'Collision' },
      },
    },
  ],
  'Program Manager': [
    {
      eventId: 'AR-2025-0014',
      title: 'Ready for final review',
      ownerLabel: 'Forwarded by',
      ownerValue: 'Alexia Putellas (Supervisor)',
      contextLabel: 'What needs classification',
      contextValue: 'Supervisor completed investigation notes. Finalize classification and close the case.',
      dueBy: '11/21/2025',
      priorityLabel: 'Final decision',
      currentStep: 4,
      savedData: {
        step1: { vehicleMode: 'Rail', eventType: 'Passenger injury' },
      },
    },
  ],
  'Assistant Manager': [],
  'Station Supervisor': [],
};

const RECENT_ACTIVITY_BY_ROLE: Record<UserRole, HomeActivityReport[]> = {
  Operator: [
    { eventId: 'AR-2025-0008', date: '11/10/2025', mode: 'Bus', status: 'Under supervisor review', injury: 'No' },
    { eventId: 'AR-2025-0007', date: '11/08/2025', mode: 'Rail', status: 'Closed', injury: 'Minor injury' },
  ],
  Supervisor: [
    { eventId: 'AR-2025-0006', date: '11/09/2025', mode: 'Bus', status: 'Sent to program manager', injury: 'No' },
    { eventId: 'AR-2025-0005', date: '11/06/2025', mode: 'Streetcar', status: 'Returned to operator', injury: 'No' },
  ],
  'Program Manager': [
    { eventId: 'AR-2025-0003', date: '11/05/2025', mode: 'Rail', status: 'Closed', injury: 'Medical treatment' },
    { eventId: 'AR-2025-0002', date: '11/02/2025', mode: 'Bus', status: 'Pending clarification', injury: 'No' },
  ],
  'Assistant Manager': [],
  'Station Supervisor': [],
};

function getModeColor(mode: string) {
  switch (mode) {
    case 'Bus':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Rail':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'Streetcar':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function OperatorHome({ onNavigate, onStartNewReport, onOpenReport, onDeleteDraft, reports }: OperatorHomeProps) {
  const { roleConfig } = useUserRole();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const firstName = roleConfig.name.split(' ')[0] || roleConfig.name;
  const copy = HOME_COPY[roleConfig.role];
  const draftReports = useMemo(() => {
    if (!reports) {
      return DRAFT_REPORTS_BY_ROLE[roleConfig.role];
    }

    return reports
      .filter((report) => report.workflowStage !== 'closed' && report.initiatedBy === roleConfig.role && getActionableSectionForRole(report, roleConfig.role)?.status === 'in-progress')
      .sort((a, b) => b.lastSavedAt.localeCompare(a.lastSavedAt))
      .map((report) => ({
        eventId: report.id,
        mode: report.formData.mode || 'Unspecified',
        lastSaved: formatShortDate(report.lastSavedAt),
        currentStep: report.currentStep,
        stepName: getStepName(report),
        sectionName: getActionableSectionForRole(report, roleConfig.role)?.label,
        nextRequiredField: report.currentStep <= 1 ? 'Incident Basics' : report.currentStep === 2 ? 'Incident Details' : report.currentStep === 3 ? 'People And Impact' : 'Review',
        savedData: report.formData,
      }));
  }, [reports, roleConfig.role]);

  const queueReports = useMemo(() => {
    if (!reports) {
      return QUEUE_REPORTS_BY_ROLE[roleConfig.role];
    }

    return reports
      .map((report) => ({ report, section: getActionableSectionForRole(report, roleConfig.role) }))
      .filter((item): item is { report: WorkflowReport; section: WorkflowSectionState } => Boolean(item.section) && item.report.workflowStage !== 'closed' && isRoleTurnForReport(item.report, roleConfig.role))
      .sort((a, b) => b.report.lastSavedAt.localeCompare(a.report.lastSavedAt))
      .map(({ report, section }) => {
        const latestHandoff = getLatestHandoff(report);
        const wasReturned = latestHandoff?.action === 'returned' || latestHandoff?.action === 'section-returned' || section.status === 'returned';
        const presentation = getQueuePresentation(roleConfig.role, report, section, wasReturned);

        return {
          eventId: report.id,
          title: presentation.title,
          ownerLabel: presentation.ownerLabel,
          ownerValue: wasReturned ? section.returnedBy || latestHandoff?.fromRole || report.lastSubmittedBy || report.initiatedBy : section.ownerRole,
          contextLabel: presentation.contextLabel,
          contextValue: presentation.contextValue,
          dueBy: report.dueBy || formatShortDate(report.lastSavedAt),
          priorityLabel: report.formData.pm_on_hold && roleConfig.role === 'Program Manager'
            ? 'On hold'
            : section.status === 'returned' ? 'Correction needed' : presentation.priorityLabel,
          reportFor: report.formData.employee_name || 'Employee pending',
          requiredSection: section.label,
          ctaLabel: getSectionCtaLabel(section, roleConfig.role),
          currentStep: report.currentStep,
          savedData: report.formData,
        };
      });
  }, [reports, roleConfig.role]);

  const openReport = (reportId: string) => {
    onOpenReport?.(reportId);
  };

  const recentActivity = useMemo(() => {
    if (!reports) {
      return RECENT_ACTIVITY_BY_ROLE[roleConfig.role];
    }

    return reports
      .filter((report) => wasRoleInvolvedInReport(report, roleConfig.role))
      .sort((a, b) => (b.closedAt || b.lastSavedAt).localeCompare(a.closedAt || a.lastSavedAt))
      .slice(0, 6)
      .map((report) => ({
        eventId: report.id,
        date: formatShortDate(report.closedAt || report.lastSavedAt),
        mode: report.formData.mode || 'Unspecified',
        status: getWorkflowStatus(report),
        injury: report.formData.operator_injured ? 'Injury reported' : 'No',
      }));
  }, [reports, roleConfig.role]);

  const completedCount = reports
    ? reports.filter((report) => report.workflowStage === 'closed' && wasRoleInvolvedInReport(report, roleConfig.role)).length
    : recentActivity.filter((report) => ['Closed', 'Sent to program manager'].includes(report.status)).length;

  return (
    <div className="min-h-screen dart-canvas flex flex-col">
      <DARTHeader activeNav="home" onNavigate={onNavigate} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-6 flex-1 w-full">
        <div className="mb-6">
          <h1 className="text-xl text-[#00205B] font-semibold text-[20px]">Welcome back, {firstName}</h1>
          <p className="text-xs text-slate-600 mt-1">{copy.intro}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="lg:w-[57%] flex-shrink-0">
            <button
              onClick={() => onStartNewReport?.()}
              className="hero-card w-full rounded-2xl transition-all duration-200 p-5 relative overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-[#007DBA] focus:ring-offset-2 active:brightness-95 group cursor-pointer min-h-[140px] sm:min-h-[174px]"
              style={{
                background: 'linear-gradient(135deg, #00244F 0%, #00458F 45%, #0067B3 100%)',
                boxShadow: '0 12px 30px 0 rgba(5, 33, 74, 0.18)',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, rgba(0, 11, 30, 0.2) 0%, transparent 70%)' }}
              />
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#00A4B5]/20 rounded-full blur-2xl" />

              <div className="relative z-10 flex items-center justify-between gap-6 h-full">
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div>
                    <h2 className="text-lg text-white font-semibold mb-1.5">{copy.heroTitle}</h2>
                    <p className="text-xs text-white/80 leading-relaxed">{copy.heroDescription}</p>
                  </div>
                  <div className="inline-flex">
                    <span className="hero-button px-5 py-2.5 text-xs text-[#007DBA] bg-white hover:bg-white/95 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 group-hover:scale-105">
                      <MdAdd className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                      {copy.heroButtonLabel}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-center relative" style={{ width: '120px', height: '120px' }}>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(11, 141, 255, 0.14) 0%, transparent 70%)',
                      filter: 'blur(70px)',
                      transform: 'scale(1.5)',
                      opacity: 0.38,
                    }}
                  />
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full border border-white/18 pointer-events-none"
                    style={{ filter: 'blur(2.5px)', opacity: 0.35 }}
                  />
                  <MdDescription
                    className="hero-icon-glyph w-14 h-14 text-white relative z-10"
                    style={{ filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.16))' }}
                  />
                </div>
              </div>
            </button>
          </div>

          <div className="lg:w-[43%] flex flex-col gap-3">
            <button
              onClick={() => onNavigate?.('drafts')}
              className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 p-4 h-[50px] flex items-center justify-between gap-3 hover:bg-slate-50/50 hover:border-slate-300/60 focus:outline-none focus:ring-2 focus:ring-[#007DBA] focus:ring-offset-1 group cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-50/60 to-amber-100/40 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0 border border-amber-200/30 shadow-[0_2px_8px_rgba(251,191,36,0.15)]">
                  <MdAccessTime className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-slate-700 font-medium leading-tight text-[12px] capitalize">Draft cases</p>
                  <p className="text-slate-500 leading-tight text-[10px] mt-1">{copy.draftsDescription}</p>
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#00205B] shrink-0 text-[20px] dart-tabular">{draftReports.length}</div>
            </button>

            <button
              onClick={() => document.querySelector('[data-section="work-queue"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="bg-white rounded-xl border border-blue-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 p-4 h-[50px] flex items-center justify-between gap-3 hover:bg-blue-50/30 hover:border-blue-300/60 focus:outline-none focus:ring-2 focus:ring-[#007DBA] focus:ring-offset-1 group cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-50/60 to-blue-100/40 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0 border border-blue-200/30 shadow-[0_2px_8px_rgba(59,130,246,0.15)]">
                  <MdNotifications className="w-5 h-5 text-[#007DBA]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-slate-700 font-medium leading-tight text-[12px] capitalize">{copy.queueMetricLabel}</p>
                  <p className="text-slate-500 leading-tight text-[10px] mt-1">{copy.queueMetricHelper}</p>
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#00205B] shrink-0 text-[20px] dart-tabular">{queueReports.length}</div>
            </button>

            <button
              onClick={() => onNavigate?.('submissions')}
              className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 p-4 h-[50px] flex items-center justify-between gap-3 hover:bg-emerald-50/30 hover:border-emerald-200/60 focus:outline-none focus:ring-2 focus:ring-[#007DBA] focus:ring-offset-1 group cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-50/60 to-emerald-100/40 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0 border border-emerald-200/30 shadow-[0_2px_8px_rgba(16,185,129,0.15)]">
                  <MdCheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-slate-700 font-medium leading-tight text-[12px] capitalize">{copy.completedMetricLabel}</p>
                  <p className="text-slate-500 leading-tight text-[10px] mt-1">{copy.completedMetricHelper}</p>
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#00205B] shrink-0 text-[20px] dart-tabular">{completedCount}</div>
            </button>
          </div>
        </div>

        <div className="border-t border-[#E5ECF5] mb-8" />

        <div className="bg-[#FEFEFE] rounded-2xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.06)] p-5 mb-10" data-section="work-queue">
          <div className="mb-5 pb-4 border-b border-[#EDF1F7] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-50/60 to-amber-100/40 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0 border border-amber-200/30 shadow-[0_2px_8px_rgba(251,191,36,0.15)]">
                <MdNotifications className="w-5 h-5 text-[#C57311]" />
              </div>
              <div>
                <h2 className="text-base text-[#00205B] font-semibold">{copy.queueSectionTitle}</h2>
                <p className="text-xs text-slate-600 mt-0.5">{copy.queueSectionDescription}</p>
              </div>
            </div>
            {queueReports.length > 5 && (
              <button onClick={() => onNavigate?.('submissions')} className="text-sm text-[#007DBA] hover:text-[#00549F] font-medium transition-colors shrink-0">
                View more →
              </button>
            )}
          </div>

          {queueReports.length > 0 ? (
            <div className="space-y-4">
              {queueReports.slice(0, 5).map((report) => (
                <div
                  key={report.eventId}
                  className="w-full bg-[#FFF9F1] rounded-2xl border border-[#E3E7EE] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 mb-5">
                    <div className="flex items-center gap-6">
                      <div>
                        <h3 className="text-[15px] text-[#00205B] font-semibold mb-1">{report.title}</h3>
                        <div className="flex items-baseline gap-2">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Case ID</p>
                          <p className="text-sm text-[#007DBA] font-semibold dart-tabular">{report.eventId}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <span className={`inline-flex px-3 py-1.5 text-[11px] rounded-full font-medium ${report.priorityLabel === 'On hold' ? 'text-indigo-700 bg-indigo-100' : 'text-[#C57311] bg-[#FFE6C4]'}`}>{report.priorityLabel}</span>
                      <button
                        onClick={() => openReport(report.eventId)}
                        className="group/btn relative w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-[#005A8F] to-[#007DBA] hover:from-[#006BA0] hover:to-[#0088CC] rounded-xl shadow-md hover:shadow-lg ease-in-out overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#005A8F] focus:ring-offset-2"
                      >
                        <span className="relative flex items-center gap-2">
                          {report.ctaLabel || 'Open case'}
                          <MdArrowForward className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1.5">{report.ownerLabel}</p>
                      <p className="text-sm text-slate-900">{report.ownerValue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1.5">Case for</p>
                      <p className="text-sm text-slate-900">{report.reportFor || 'Employee pending'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1.5">Your required section</p>
                      <p className="text-sm text-slate-900">{report.requiredSection || 'Assigned section'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1.5">{report.contextLabel}</p>
                      <p className="text-sm text-slate-700">{report.contextValue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#E3E8F2]">
              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <MdPendingActions className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">Nothing is waiting on you right now</p>
              <p className="text-xs text-slate-500 mt-1">Switch roles in the header to inspect another point in the workflow.</p>
            </div>
          )}
        </div>

        <div className="bg-slate-50/40 rounded-2xl border border-[#E3E8F2] shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-5 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base text-[#00205B] font-semibold">Continue where you left off</h3>
              <p className="text-xs text-slate-600 mt-0.5">{copy.draftsDescription}</p>
            </div>
            <button onClick={() => onNavigate?.('drafts')} className="text-sm text-[#007DBA] hover:text-[#00549F] font-medium transition-colors">
              View All Drafts →
            </button>
          </div>

          {draftReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftReports.map((report) => (
                <div key={report.eventId} className="bg-white rounded-2xl border border-[#E3E8F2] shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden group relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(report.eventId);
                    }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-300/60 hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    title="Delete draft"
                  >
                    <MdDelete className="w-5 h-5 text-slate-500 hover:text-red-600 transition-colors" />
                  </button>

                  <div className="p-5 flex flex-col h-full">
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base text-[#00205B] font-semibold">{report.eventId}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-md border ${getModeColor(report.mode)}`}>
                          {report.mode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MdAccessTime className="w-4 h-4" />
                        Last saved {report.lastSaved}
                      </div>
                    </div>

                    <div className="mb-5 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2 font-semibold">Draft section</p>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-[#007DBA] text-white flex items-center justify-center text-xs font-semibold shrink-0">{report.currentStep}</div>
                        <span className="text-sm text-slate-700 font-medium line-clamp-2">{report.sectionName || report.stepName}</span>
                      </div>
                      <p className="mb-2 text-xs text-slate-500">Next field group: {report.nextRequiredField || report.stepName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#007DBA] to-[#0099E6] rounded-full transition-all duration-300" style={{ width: `${(report.currentStep / 4) * 100}%` }} />
                        </div>
                        <span className="text-[11px] font-medium shrink-0">Section step {report.currentStep} of 4</span>
                      </div>
                    </div>

                    <button
                      onClick={() => openReport(report.eventId)}
                      className="group/resume relative w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-[#005A8F] to-[#007DBA] hover:from-[#006BA0] hover:to-[#0088CC] rounded-lg shadow-md hover:shadow-lg transition-[background-color] duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#005A8F] focus:ring-offset-1"
                    >
                      <span className="relative flex items-center justify-center gap-1.5">
                        Resume section
                        <MdArrowForward className="w-4 h-4 group-hover/resume:translate-x-0.5 transition-transform duration-300" />
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#E3E8F2]">
              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <MdAccessTime className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">No cases in progress</p>
              <p className="text-xs text-slate-500 mt-1">Start a new case to get started</p>
            </div>
          )}
        </div>

        <div className="bg-[#F7F9FC] rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base text-[#00205B] font-semibold">{copy.activityTitle}</h2>
              <p className="text-xs text-slate-600 mt-0.5">{copy.activityDescription}</p>
            </div>
            <button onClick={() => onNavigate?.('submissions')} className="text-sm text-[#007DBA] hover:text-[#00549F] font-medium transition-colors shrink-0">
              View All →
            </button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((submission) => (
                <button
                  key={submission.eventId}
                  onClick={() => onNavigate?.('submissions')}
                  className="w-full bg-white rounded-2xl border border-[#E3E8F2] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-slate-50/50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#007DBA] focus:ring-offset-2 text-left"
                >
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-[0.95fr_0.8fr_0.75fr_1.35fr_1.15fr] gap-4 items-center">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-medium">Case ID</p>
                        <p className="text-sm text-[#00205B] font-semibold">{submission.eventId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-medium">Date</p>
                        <p className="text-sm text-slate-700">{submission.date}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-medium">Mode</p>
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border ${getModeColor(submission.mode)}`}>
                          {submission.mode}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-medium">Status</p>
                        <p className={`text-sm font-medium ${submission.status === 'Closed' ? 'text-emerald-700' : 'text-slate-700'}`}>{submission.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-medium">Injury</p>
                        {submission.injury === 'No' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <MdCheckCircle className="w-4 h-4 text-emerald-500" />
                            No
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <MdNotifications className="w-4 h-4 text-amber-500" />
                            {submission.injury}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#E3E8F2]">
              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-200">
                <MdCheckCircle className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">No recent activity</p>
              <p className="text-xs text-slate-500 mt-1">Route a case through the workflow to see it here.</p>
            </div>
          )}
        </div>
      </div>

      <DARTFooter />

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <MdDelete className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#00205B]">Delete draft case?</h3>
                <p className="text-sm text-slate-600 mt-1">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-5 border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-medium">Case ID</p>
              <p className="text-sm text-[#00205B] font-semibold">{deleteConfirmId}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteDraft?.(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-1 shadow-sm hover:shadow-md"
              >
                Delete Draft Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}