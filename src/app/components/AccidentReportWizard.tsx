import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { WizardStepper } from './WizardStepper';
import { Step1IncidentBasics } from './steps/Step1IncidentBasics';
import { Step2VehicleLocation } from './steps/Step2VehicleLocation';
import { Step3PeopleImpact } from './steps/Step3PeopleImpact';
import { Step4ReviewSubmit } from './steps/Step4ReviewSubmit';
import EmployeeRecordPanel from './steps/sections/EmployeeRecordPanel';
import { SuccessScreen } from './SuccessScreen';
import { DARTHeader } from './DARTHeader';
import { AssistantManagerReview } from './AssistantManagerReview';
import { DARTFooter } from './DARTFooter';
import { CorrectionResolutionScreen } from './CorrectionResolutionScreen';
import { RoleContextBar } from './RoleContextBar';
import { CaseStatusDrawer } from './CaseStatusDrawer';
import { ReviewerDecisionScreen } from './ReviewerDecisionScreen';
import { ViewReportModal } from './ViewReportModal';
import { ReferenceReportDrawer, type ReferenceReportTab } from './ReferenceReportDrawer';
import type { AccidentReportData } from '../types/accident-report';
import { findPossibleDuplicate } from '../utils/duplicate-report';
import { useUserRole, type UserRole } from '../context/UserRoleContext';
import {
  activateParallelSections,
  areRequiredSectionsComplete,
  createInitialSections,
  createSectionState,
  getLegacyStageFromSections,
  getOverallStatusFromSections,
  getSectionKeyForRole,
  getSectionLabel,
  getSectionRole,
  getWorkflowSections,
  isSectionActionable,
  markSectionSubmitted,
  returnWorkflowSection,
  WORKFLOW_SECTION_ORDER,
  type WorkflowHandoff,
  type WorkflowReport,
  type WorkflowSectionKey,
  type WorkflowSections,
  type WorkflowStage,
} from '../types/workflow-report';

interface AccidentReportWizardProps {
  onNavigate?: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
  onBackToHome?: () => void;
  initialStep?: number;
  initialData?: any;
  initialReport?: WorkflowReport | null;
  onSaveReport?: (report: WorkflowReport) => void;
  existingReports?: WorkflowReport[];
}

const ASSIGNED_SECTION_STEPS: Record<Exclude<WorkflowSectionKey, 'operator'>, { number: number; title: string }[]> = {
  supervisor: [
    { number: 1, title: 'Incident Basics' },
    { number: 2, title: 'Injuries And Police' },
    { number: 3, title: 'Review And Submit' },
  ],
  programManager: [
    { number: 1, title: 'Investigate' },
    { number: 2, title: 'Impact' },
    { number: 3, title: 'Classify' },
    { number: 4, title: 'Review' },
  ],
};

// A supervisor who INITIATES a case walks a 4-step flow: the case intake (Incident Basics)
// then their own three supervisor sub-steps. currentStep maps 1 -> intake, 2-4 -> sub-steps 1-3.
const INITIATING_SUPERVISOR_STEPS = [
  { number: 1, title: 'Incident Basics' },
  { number: 2, title: 'Investigation Details' },
  { number: 3, title: 'Injuries And Police' },
  { number: 4, title: 'Review And Submit' },
];

function getWorkflowStageForSection(sectionKey: WorkflowSectionKey): WorkflowStage {
  switch (sectionKey) {
    case 'supervisor':
      return 'supervisor-review';
    case 'programManager':
      return 'program-manager-review';
    default:
      return 'operator-completion';
  }
}

function getSectionMeta(sectionKey: WorkflowSectionKey, initiatedBy: UserRole, isOnBehalf?: boolean, isComplete = false) {
  if (isComplete) {
    return {
      label: 'Completed report',
      scenarioLabel: 'All required sections submitted',
      summary: 'The case has all required role sections. Each role sees the completed report with their permitted level of detail.',
      responsibilities: ['Review completed status', 'Open role-filtered report details'],
      submitLabel: 'Completed',
      nextRoleLabel: 'Closed',
    };
  }

  switch (sectionKey) {
    case 'operator':
      return {
        label: 'Operator section',
        scenarioLabel: initiatedBy === 'Operator' ? 'Operator initiated scenario' : 'Assigned after leader initiation',
        summary: initiatedBy === 'Operator'
          ? 'Complete the operator facts. Submitting notifies the supervisor and program manager so they can fill their sections in parallel.'
          : 'This case was started for the operator. Complete only the operator facts and submit your section back into the shared case.',
        responsibilities: ['Confirm employee and event facts', 'Complete vehicle, location, and impact details', 'Resolve any operator correction notes'],
        submitLabel: 'Submit operator section',
        nextRoleLabel: 'Field Supervisor and Safety Program Manager',
      };
    case 'supervisor':
      return {
        label: initiatedBy === 'Supervisor' && isOnBehalf !== false ? 'Supervisor section collision initiation' : 'Supervisor section collision',
        scenarioLabel: initiatedBy === 'Supervisor' ? 'Field Supervisor initiated scenario' : 'Assigned after operator initiation',
        summary: initiatedBy === 'Supervisor'
          ? 'Start the case by completing the Field Supervisor collision investigation section, then notify the operator and Safety Program Manager in tandem.'
          : 'Complete the Field Supervisor collision investigation section while the Safety Program Manager can work their section independently.',
        responsibilities: ['Confirm scene and arrival details', 'Capture collision investigation rollups', 'Request operator corrections when needed'],
        submitLabel: 'Submit Field Supervisor section',
        nextRoleLabel: initiatedBy === 'Supervisor' ? 'Operator and Program Manager' : 'Shared case',
      };
    case 'programManager':
      return {
        label: 'Program manager section',
        scenarioLabel: initiatedBy === 'Program Manager' ? 'Program manager initiated scenario' : 'Assigned for final classification',
        summary: 'Complete the classification and program manager review fields. Return only the section that needs correction instead of moving the whole case backward.',
        responsibilities: ['Verify submitted operator and supervisor sections', 'Classify the event', 'Return targeted corrections if needed'],
        submitLabel: 'Submit program manager section',
        nextRoleLabel: 'Completed report',
      };
  }
}

function shouldUseAssignedSectionFlow(report: WorkflowReport | null | undefined, currentRole: UserRole) {
  if (!report) {
    return false;
  }

  const sectionKey = getSectionKeyForRole(currentRole);
  if (sectionKey === 'operator') {
    return false;
  }

  const sections = getWorkflowSections(report);
  return report.initiatedBy !== currentRole && isSectionActionable(sections[sectionKey]);
}

function getInitialStepForCurrentRole(report: WorkflowReport | null | undefined, currentRole: UserRole, fallbackStep?: number) {
  if (shouldUseAssignedSectionFlow(report, currentRole)) {
    return 1;
  }

  return report?.currentStep || fallbackStep || 1;
}

export function AccidentReportWizard({ onNavigate, onBackToHome, initialStep, initialData, initialReport, onSaveReport, existingReports = [] }: AccidentReportWizardProps) {
  const { roleConfig } = useUserRole();
  const [currentStep, setCurrentStep] = useState(() => getInitialStepForCurrentRole(initialReport, roleConfig.role, initialStep));
  const [formData, setFormData] = useState<AccidentReportData>(initialReport?.formData || initialData || {});
  const [reportId] = useState(() => initialReport?.id || `AE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [createdAt] = useState(() => initialReport?.createdAt || new Date().toISOString());
  const [initiatedBy] = useState<UserRole>(initialReport?.initiatedBy || roleConfig.role);
  const [sections, setSections] = useState<WorkflowSections>(() => initialReport ? getWorkflowSections(initialReport) : createInitialSections(roleConfig.role, initialData?.is_on_behalf));
  const activeSectionKey = getSectionKeyForRole(roleConfig.role);
  const activeSection = sections[activeSectionKey];
  const supervisorSectionSubmitted = ['submitted', 'resubmitted'].includes(sections.supervisor.status);
  // A PM who INITIATED the case returns to REVIEW their own section once the supervisor has submitted.
  const isPmInitiatorReturning = roleConfig.role === 'Program Manager'
    && initiatedBy === 'Program Manager'
    && activeSectionKey === 'programManager'
    && supervisorSectionSubmitted
    && isSectionActionable(activeSection);
  const isAssignedSectionFlow = shouldUseAssignedSectionFlow(initialReport, roleConfig.role) || isPmInitiatorReturning;
  const assignedSectionSteps = isAssignedSectionFlow && activeSectionKey !== 'operator' ? ASSIGNED_SECTION_STEPS[activeSectionKey] : undefined;
  // A supervisor who INITIATES a case fills the case setup (Incident Basics) and then completes their
  // OWN supervisor section in the SAME continuous flow — the operator gets their task on submit. This
  // differs from the PM, who initiates then hands off and completes their section on the return trip.
  const isInitiatingSupervisor = roleConfig.role === 'Supervisor' && !isAssignedSectionFlow && activeSectionKey === 'supervisor';
  // A PM who INITIATES a case fills the case intake (Incident Basics) only; their own section is
  // completed on the return trip after the operator/supervisor sections are done.
  const isInitiatingPM = roleConfig.role === 'Program Manager' && !isAssignedSectionFlow && activeSectionKey === 'programManager';
  const operatorSectionStatus = sections.operator.status;
  const isOperatorSectionEditableByCurrentRole = activeSectionKey === 'operator' && ['pending', 'in-progress', 'returned'].includes(operatorSectionStatus);
  const isOperatorNarrativeLocked = !isOperatorSectionEditableByCurrentRole;
  const isComplete = areRequiredSectionsComplete(sections);
  const workflowStage = getWorkflowStageForSection(activeSectionKey);
  const [lastSubmittedBy, setLastSubmittedBy] = useState<UserRole | null>(initialReport?.lastSubmittedBy || null);
  const [handoffNote, setHandoffNote] = useState<string | null>(initialReport?.handoffNote || null);
  const [handoffHistory, setHandoffHistory] = useState<WorkflowHandoff[]>(initialReport?.handoffHistory || []);
  const [returnReason, setReturnReason] = useState('');
  const [returnTargetSection, setReturnTargetSection] = useState<WorkflowSectionKey>('operator');
  const [isCaseStatusOpen, setIsCaseStatusOpen] = useState(false);
  const [rejectedAt, setRejectedAt] = useState<string | null>(initialReport?.rejectedAt || null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(initialReport?.rejectionReason || null);
  const [rejectedBy, setRejectedBy] = useState<UserRole | null>(initialReport?.rejectedBy || null);
  const [isFullReportOpen, setIsFullReportOpen] = useState(false);
  const [duplicateReportToReview, setDuplicateReportToReview] = useState<WorkflowReport | null>(null);
  const duplicateReviewButtonRef = useRef<HTMLButtonElement>(null);
  const [referenceDrawerOpen, setReferenceDrawerOpen] = useState(false);
  const [referenceDrawerTab, setReferenceDrawerTab] = useState<ReferenceReportTab>('operator');
  const [programManagerInActionsMode, setProgramManagerInActionsMode] = useState(false);
  const [submitResult, setSubmitResult] = useState<null | {
    submittedSectionKey: WorkflowSectionKey;
    sections: WorkflowSections;
    activatedSections: WorkflowSectionKey[];
    isComplete: boolean;
  }>(null);
  const [rejectResult, setRejectResult] = useState<{ reason: string; rejectedAt: string } | null>(null);

  const stageMeta = useMemo(
    () => getSectionMeta(activeSectionKey, initiatedBy, formData.is_on_behalf, isComplete),
    [activeSectionKey, initiatedBy, formData.is_on_behalf, isComplete],
  );
  const isCaseRejected = Boolean(rejectedAt);
  const pmCanTakeReviewAction = roleConfig.role === 'Program Manager'
    && isAssignedSectionFlow
    && !isCaseRejected;
  const isRoleAllowedToAdvance = !isCaseRejected && !isComplete && isSectionActionable(activeSection);
  const showSectionStepper = !isInitiatingPM && !programManagerInActionsMode && (!isAssignedSectionFlow || (
    Boolean(assignedSectionSteps && assignedSectionSteps.length > 1)
    && !isCaseRejected
  ));
  const currentStepperStep = isAssignedSectionFlow ? Math.min(currentStep, assignedSectionSteps?.length || 1) : currentStep;
  const sectionStepperSteps = isInitiatingSupervisor ? INITIATING_SUPERVISOR_STEPS : assignedSectionSteps;
  const activeAssignedStepTitle = assignedSectionSteps?.find((step) => step.number === currentStepperStep)?.title;
  // Return-for-correction routing:
  // - Operator sections lock on submit; no reviewer can send them back.
  // - Supervisor cannot return anything (their upstream is the Operator, which is locked).
  // - Program Manager can only return the Supervisor section for clarification.
  const returnableSections = WORKFLOW_SECTION_ORDER.filter((sectionKey) => {
    const section = sections[sectionKey];
    if (section.status !== 'submitted' || section.ownerRole === roleConfig.role) {
      return false;
    }

    if (roleConfig.role === 'Program Manager') {
      return sectionKey === 'supervisor';
    }

    return false;
  });
  const returnRole = returnableSections.length > 0 ? getSectionRole(returnTargetSection) : null;
  const liveReport = useMemo<WorkflowReport>(() => {
    const nextStage = getLegacyStageFromSections(sections);
    return {
      id: reportId,
      initiatedBy,
      workflowStage: nextStage,
      overallStatus: getOverallStatusFromSections(sections, nextStage === 'closed'),
      sections,
      currentStep,
      formData,
      createdAt,
      lastSavedAt: initialReport?.lastSavedAt || new Date().toISOString(),
      dueBy: initialReport?.dueBy,
      lastSubmittedBy,
      handoffNote,
      handoffHistory,
      closedAt: initialReport?.closedAt || null,
      rejectedAt,
      rejectionReason,
      rejectedBy,
    };
  }, [createdAt, currentStep, formData, handoffHistory, handoffNote, initialReport?.closedAt, initialReport?.dueBy, initialReport?.lastSavedAt, initiatedBy, lastSubmittedBy, rejectedAt, rejectedBy, rejectionReason, reportId, sections]);

  // Duplicate detection applies while a case is being initiated by an Operator, Supervisor,
  // or Program Manager. Assigned reviewers are working inside an existing case and should not
  // receive a new-record warning.
  const possibleDuplicate = useMemo(
    () => isAssignedSectionFlow ? null : findPossibleDuplicate(formData, existingReports, reportId),
    [existingReports, formData, isAssignedSectionFlow, reportId],
  );
  const duplicateNeedsConfirmation = Boolean(
    possibleDuplicate
    && formData.duplicate_record_confirmation?.existing_report_id !== possibleDuplicate.report.id,
  );

  useEffect(() => {
    if (duplicateNeedsConfirmation && !duplicateReportToReview) {
      requestAnimationFrame(() => duplicateReviewButtonRef.current?.focus());
    }
  }, [duplicateNeedsConfirmation, duplicateReportToReview]);

  useEffect(() => {
    if (initialReport || roleConfig.role !== 'Supervisor') {
      return;
    }

    setSections(createInitialSections(roleConfig.role, formData.is_on_behalf));
  }, [formData.is_on_behalf, initialReport, roleConfig.role]);

  useEffect(() => {
    if (returnableSections.length > 0 && !returnableSections.includes(returnTargetSection)) {
      setReturnTargetSection(returnableSections[0]);
    }
  }, [returnTargetSection, returnableSections]);

  const persistReport = ({
    nextSections,
    nextStep,
    nextLastSubmittedBy,
    nextClosedAt,
    nextHandoffNote,
    nextHandoffHistory,
    nextFormData,
    nextRejectedAt,
    nextRejectionReason,
    nextRejectedBy,
  }: {
    nextSections: WorkflowSections;
    nextStep: number;
    nextLastSubmittedBy: UserRole | null;
    nextClosedAt: string | null;
    nextHandoffNote: string | null;
    nextHandoffHistory: WorkflowHandoff[];
    nextFormData?: AccidentReportData;
    nextRejectedAt?: string | null;
    nextRejectionReason?: string | null;
    nextRejectedBy?: UserRole | null;
  }) => {
    const nextStage = getLegacyStageFromSections(nextSections);
    const dataToPersist = nextFormData ?? formData;
    const rejectedAtToPersist = nextRejectedAt !== undefined ? nextRejectedAt : rejectedAt;
    const rejectionReasonToPersist = nextRejectionReason !== undefined ? nextRejectionReason : rejectionReason;
    const rejectedByToPersist = nextRejectedBy !== undefined ? nextRejectedBy : rejectedBy;
    const isRejected = Boolean(rejectedAtToPersist);
    onSaveReport?.({
      id: reportId,
      initiatedBy,
      workflowStage: isRejected ? 'closed' : nextStage,
      overallStatus: isRejected ? 'rejected' : getOverallStatusFromSections(nextSections, nextStage === 'closed'),
      sections: nextSections,
      currentStep: nextStep,
      formData: dataToPersist,
      createdAt,
      lastSavedAt: new Date().toISOString(),
      dueBy: initialReport?.dueBy,
      lastSubmittedBy: nextLastSubmittedBy,
      handoffNote: nextHandoffNote,
      handoffHistory: nextHandoffHistory,
      closedAt: isRejected ? rejectedAtToPersist : nextClosedAt,
      rejectedAt: rejectedAtToPersist,
      rejectionReason: rejectionReasonToPersist,
      rejectedBy: rejectedByToPersist,
    });
  };

  const buildHandoff = (action: WorkflowHandoff['action'], targetSection: WorkflowSectionKey | null, note?: string, targetSections?: WorkflowSectionKey[]): WorkflowHandoff => ({
    id: `${reportId}-${Date.now()}`,
    fromRole: roleConfig.role,
    toRole: targetSection ? getSectionRole(targetSection) : null,
    fromStage: workflowStage,
    toStage: targetSection ? getWorkflowStageForSection(targetSection) : 'closed',
    action,
    note,
    targetSection: targetSection || undefined,
    targetSections,
    createdAt: new Date().toISOString(),
  });

  const handleUpdate = (data: Partial<AccidentReportData>) => {
    const nextData = { ...data };

    // FIR-style integrity: once the operator section is no longer actionable,
    // their narrative fields cannot be changed by any role.
    if (isOperatorNarrativeLocked) {
      delete nextData.description_of_event;
      delete nextData.incident_description;
    }

    setFormData((prev) => ({ ...prev, ...nextData }));
  };

  const guardAgainstPossibleDuplicate = () => {
    if (!duplicateNeedsConfirmation) return true;
    return false;
  };

  const handleConfirmNewRecord = () => {
    if (!possibleDuplicate) return;
    setFormData((previous) => ({
      ...previous,
      duplicate_record_confirmation: {
        existing_report_id: possibleDuplicate.report.id,
        confirmed_at: new Date().toISOString(),
        confirmed_by_role: roleConfig.role,
        confirmed_by_name: roleConfig.name,
      },
    }));
  };

  const handleNext = () => {
    if (!guardAgainstPossibleDuplicate()) return;
    const maxStep = 4;
    if (currentStep < maxStep) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = () => {
    console.log('Saving draft:', { reportId, workflowStage, activeSectionKey, formData });
    persistReport({
      nextSections: sections,
      nextStep: currentStep,
      nextLastSubmittedBy: lastSubmittedBy,
      nextClosedAt: initialReport?.closedAt || null,
      nextHandoffNote: handoffNote,
      nextHandoffHistory: handoffHistory,
    });
    // In a real app, this would save to a backend/database
  };

  // Program manager initiating: they fill the case intake (Incident Basics) on behalf of an
  // operator who has not / cannot file yet, then route the case out. Their own PM section is
  // completed on the return trip, after the operator (if available) and supervisor submit.
  const handleInitiatePmCase = () => {
    if (!guardAgainstPossibleDuplicate()) return;
    const timestamp = new Date().toISOString();
    const operatorAvailable = formData.operator_availability_confirmed !== false;
    const nextSections: WorkflowSections = {
      operator: createSectionState('operator', operatorAvailable ? 'pending' : 'not-required', timestamp),
      supervisor: createSectionState('supervisor', 'pending', timestamp),
      programManager: createSectionState('programManager', 'pending', timestamp),
    };
    const nextFormData: AccidentReportData = operatorAvailable
      ? formData
      : { ...formData, operator_waived_by: roleConfig.name, operator_waived_at: timestamp };
    const nextHistory: WorkflowHandoff[] = [
      ...handoffHistory,
      ...(operatorAvailable ? [] : [buildHandoff('operator-waived', null, formData.operator_unavailable_reason || undefined)]),
      buildHandoff('forwarded', operatorAvailable ? 'operator' : 'supervisor', undefined, operatorAvailable ? ['operator'] : ['supervisor']),
    ];
    setSections(nextSections);
    setFormData(nextFormData);
    setLastSubmittedBy(roleConfig.role);
    setHandoffHistory(nextHistory);
    persistReport({
      nextSections,
      nextStep: 1,
      nextLastSubmittedBy: roleConfig.role,
      nextClosedAt: null,
      nextHandoffNote: null,
      nextHandoffHistory: nextHistory,
      nextFormData,
    });
    onBackToHome?.();
  };

  const handleSubmit = () => {
    if (!isRoleAllowedToAdvance || !guardAgainstPossibleDuplicate()) {
      return;
    }

    console.log('Submitting case section:', {
      reportId,
      workflowStage,
      activeSectionKey,
      submittedBy: roleConfig.role,
      formData,
    });

    const timestamp = new Date().toISOString();
    const wasCorrection = sections[activeSectionKey].status === 'returned';
    const submittedSections = markSectionSubmitted(sections, activeSectionKey, roleConfig.role, timestamp);
    const activatedRaw = activateParallelSections(submittedSections, initiatedBy, formData.is_on_behalf, timestamp);
    // If the initiator waived the operator (operator unavailable to file), their section is not
    // required — keep it out of the queue instead of activating it into a pending state.
    const operatorWaived = formData.operator_availability_confirmed === false;
    const nextSections = operatorWaived && activatedRaw.operator.status === 'pending'
      ? { ...activatedRaw, operator: { ...activatedRaw.operator, status: 'not-required', lastUpdatedAt: timestamp } }
      : activatedRaw;
    const nextIsComplete = areRequiredSectionsComplete(nextSections);
    const activatedSections = WORKFLOW_SECTION_ORDER.filter(
      (sectionKey) => sections[sectionKey].status === 'not-started' && nextSections[sectionKey].status === 'pending',
    );
    const nextHistory = [
      ...handoffHistory,
      buildHandoff(nextIsComplete ? 'closed' : wasCorrection ? 'section-resubmitted' : 'section-submitted', nextIsComplete ? null : activeSectionKey, undefined, activatedSections),
    ];

    // If Supervisor is resubmitting after a correction, clear any prior PM decision
    // so the PM sees the reviewer decision screen again on the resubmitted content.
    const shouldResetPmReview = activeSectionKey === 'supervisor' && wasCorrection;
    const nextFormData: AccidentReportData = shouldResetPmReview
      ? { ...formData, pm_supervisor_review_decision: undefined, pm_supervisor_reviewed_at: undefined, pm_supervisor_review_note: undefined }
      : formData;

    if (shouldResetPmReview) {
      setFormData(nextFormData);
    }

    setLastSubmittedBy(roleConfig.role);
    setHandoffNote(null);
    setReturnReason('');
    setSections(nextSections);
    setHandoffHistory(nextHistory);

    setSubmitResult({ submittedSectionKey: activeSectionKey, sections: nextSections, activatedSections, isComplete: nextIsComplete });

    setCurrentStep(4);
    persistReport({
      nextSections,
      nextStep: 4,
      nextLastSubmittedBy: roleConfig.role,
      nextClosedAt: nextIsComplete ? timestamp : null,
      nextHandoffNote: null,
      nextHandoffHistory: nextHistory,
      nextFormData,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturn = () => {
    if (!returnRole || returnableSections.length === 0) {
      return;
    }

    const trimmedReason = returnReason.trim();
    if (!trimmedReason) {
      return;
    }

    const timestamp = new Date().toISOString();
    const nextSections = returnWorkflowSection(sections, returnTargetSection, roleConfig.role, trimmedReason, timestamp);
    const nextHistory = [...handoffHistory, buildHandoff('section-returned', returnTargetSection, trimmedReason)];

    setLastSubmittedBy(roleConfig.role);
    setHandoffHistory(nextHistory);
    setHandoffNote(trimmedReason);
    setSections(nextSections);
    setCurrentStep(4);
    setReturnReason('');

    persistReport({
      nextSections,
      nextStep: 4,
      nextLastSubmittedBy: roleConfig.role,
      nextClosedAt: null,
      nextHandoffNote: trimmedReason,
      nextHandoffHistory: nextHistory,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApproveSupervisor = (note: string) => {
    if (roleConfig.role !== 'Program Manager') {
      return;
    }
    const trimmed = note.trim();
    if (!trimmed) {
      return;
    }
    const timestamp = new Date().toISOString();
    const nextFormData: AccidentReportData = {
      ...formData,
      pm_supervisor_review_decision: 'approved',
      pm_supervisor_reviewed_at: timestamp,
      pm_supervisor_review_note: trimmed,
    };
    const nextHistory = [
      ...handoffHistory,
      buildHandoff('section-approved', 'supervisor', trimmed),
    ];
    setFormData(nextFormData);
    setHandoffHistory(nextHistory);
    setCurrentStep(4);
    persistReport({
      nextSections: sections,
      nextStep: 4,
      nextLastSubmittedBy: lastSubmittedBy,
      nextClosedAt: null,
      nextHandoffNote: handoffNote,
      nextHandoffHistory: nextHistory,
      nextFormData,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommentOnly = (note: string) => {
    if (roleConfig.role !== 'Program Manager') {
      return;
    }
    const trimmed = note.trim();
    if (!trimmed) {
      return;
    }
    const nextHistory = [
      ...handoffHistory,
      buildHandoff('section-commented', 'supervisor', trimmed),
    ];
    setHandoffHistory(nextHistory);
    persistReport({
      nextSections: sections,
      nextStep: currentStep,
      nextLastSubmittedBy: lastSubmittedBy,
      nextClosedAt: initialReport?.closedAt || null,
      nextHandoffNote: handoffNote,
      nextHandoffHistory: nextHistory,
    });
  };

  const handleHoldCase = (note: string) => {
    if (roleConfig.role !== 'Program Manager') {
      return;
    }
    const trimmed = note.trim();
    if (!trimmed) {
      return;
    }
    const timestamp = new Date().toISOString();
    // Hold parks the case in place: no section or stage change, no routing.
    // The case stays in the PM queue, flagged on-hold, until the PM acts again.
    const nextFormData: AccidentReportData = {
      ...formData,
      pm_on_hold: true,
      pm_hold_note: trimmed,
      pm_held_at: timestamp,
    };
    const nextHistory = [
      ...handoffHistory,
      buildHandoff('held', 'programManager', trimmed),
    ];
    setFormData(nextFormData);
    setHandoffHistory(nextHistory);
    persistReport({
      nextSections: sections,
      nextStep: currentStep,
      nextLastSubmittedBy: lastSubmittedBy,
      nextClosedAt: initialReport?.closedAt || null,
      nextHandoffNote: handoffNote,
      nextHandoffHistory: nextHistory,
      nextFormData,
    });
    onBackToHome?.();
  };

  const handleResumeFromHold = () => {
    if (roleConfig.role !== 'Program Manager') {
      return;
    }
    const timestamp = new Date().toISOString();
    const operatorWasWaived = sections.operator.status === 'not-required' && formData.operator_availability_confirmed === false;

    if (operatorWasWaived) {
      // The operator has returned: reopen their section and route the case to them so they
      // complete it, then it comes back to the PM to finalize. Clears the waiver and logs it.
      const nextSections: WorkflowSections = {
        ...sections,
        operator: createSectionState('operator', 'pending', timestamp),
      };
      const nextFormData: AccidentReportData = {
        ...formData,
        pm_on_hold: false,
        pm_hold_note: undefined,
        pm_held_at: undefined,
        operator_availability_confirmed: true,
        operator_waived_by: undefined,
        operator_waived_at: undefined,
      };
      const nextHistory = [
        ...handoffHistory,
        buildHandoff('forwarded', 'operator', 'Operator returned — section reopened for completion.', ['operator']),
      ];
      setSections(nextSections);
      setFormData(nextFormData);
      setHandoffHistory(nextHistory);
      persistReport({
        nextSections,
        nextStep: 1,
        nextLastSubmittedBy: roleConfig.role,
        nextClosedAt: null,
        nextHandoffNote: null,
        nextHandoffHistory: nextHistory,
        nextFormData,
      });
      onBackToHome?.();
      return;
    }

    // Plain resume: clear the hold flag and stay in place.
    const nextFormData: AccidentReportData = {
      ...formData,
      pm_on_hold: false,
      pm_hold_note: undefined,
      pm_held_at: undefined,
    };
    setFormData(nextFormData);
    persistReport({
      nextSections: sections,
      nextStep: currentStep,
      nextLastSubmittedBy: lastSubmittedBy,
      nextClosedAt: initialReport?.closedAt || null,
      nextHandoffNote: handoffNote,
      nextHandoffHistory: handoffHistory,
      nextFormData,
    });
  };

  const handleApproveAndCloseCase = (note: string) => {
    if (roleConfig.role !== 'Program Manager') {
      return;
    }
    const trimmed = note.trim();
    if (!trimmed) {
      return;
    }
    if (!isRoleAllowedToAdvance) {
      return;
    }
    // Record the approval marker on the supervisor section, then run the standard submit
    // (which marks PM section submitted and closes the case if all required sections are done).
    const timestamp = new Date().toISOString();
    const decisionData: AccidentReportData = {
      ...formData,
      pm_supervisor_review_decision: 'approved',
      pm_supervisor_reviewed_at: timestamp,
      pm_supervisor_review_note: trimmed,
      pm_on_hold: false,
      pm_hold_note: undefined,
      pm_held_at: undefined,
    };
    setFormData(decisionData);
    const wasCorrection = sections[activeSectionKey].status === 'returned';
    const submittedSections = markSectionSubmitted(sections, activeSectionKey, roleConfig.role, timestamp);
    const nextSections = activateParallelSections(submittedSections, initiatedBy, formData.is_on_behalf, timestamp);
    const nextIsComplete = areRequiredSectionsComplete(nextSections);
    const activatedSections = WORKFLOW_SECTION_ORDER.filter(
      (sectionKey) => sections[sectionKey].status === 'not-started' && nextSections[sectionKey].status === 'pending',
    );
    const nextHistory: WorkflowHandoff[] = [
      ...handoffHistory,
      buildHandoff('section-approved', 'supervisor', trimmed),
      buildHandoff(nextIsComplete ? 'closed' : wasCorrection ? 'section-resubmitted' : 'section-submitted', nextIsComplete ? null : activeSectionKey, undefined, activatedSections),
    ];
    setLastSubmittedBy(roleConfig.role);
    setHandoffNote(null);
    setReturnReason('');
    setSections(nextSections);
    setHandoffHistory(nextHistory);
    setSubmitResult({ submittedSectionKey: activeSectionKey, sections: nextSections, activatedSections, isComplete: nextIsComplete });
    setCurrentStep(4);
    persistReport({
      nextSections,
      nextStep: 4,
      nextLastSubmittedBy: roleConfig.role,
      nextClosedAt: nextIsComplete ? timestamp : null,
      nextHandoffNote: null,
      nextHandoffHistory: nextHistory,
      nextFormData: decisionData,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReassignSupervisorFromDecision = ({ toBadge, toName, note }: { toBadge: string; toName: string; note: string }) => {
    if (roleConfig.role !== 'Program Manager') {
      return;
    }
    const trimmed = note.trim();
    if (!trimmed || !toBadge) {
      return;
    }
    const timestamp = new Date().toISOString();
    const [firstName, ...restName] = toName.trim().split(/\s+/);
    const lastName = restName.join(' ');
    const noteWithAssignee = `Reassigned to ${toName} (badge ${toBadge}). ${trimmed}`;
    const nextSections = returnWorkflowSection(sections, 'supervisor', roleConfig.role, noteWithAssignee, timestamp);
    const nextHistory = [...handoffHistory, buildHandoff('section-reassigned', 'supervisor', noteWithAssignee)];
    const nextFormData: AccidentReportData = {
      ...formData,
      pm_supervisor_review_decision: 'reassigned',
      pm_supervisor_reviewed_at: timestamp,
      pm_supervisor_review_note: trimmed,
      pm_supervisor_reassigned_to_badge: toBadge,
      pm_supervisor_reassigned_to_name: toName,
      pm_on_hold: false,
      pm_hold_note: undefined,
      pm_held_at: undefined,
      // Rewrite supervisor identity so the new assignee owns the section going forward
      supervisor_badge_number: toBadge,
      supervisor_name: toName,
      supervisor_first_name: firstName,
      supervisor_last_name: lastName,
    };

    setFormData(nextFormData);
    setLastSubmittedBy(roleConfig.role);
    setHandoffHistory(nextHistory);
    setHandoffNote(noteWithAssignee);
    setSections(nextSections);
    setCurrentStep(4);

    persistReport({
      nextSections,
      nextStep: 4,
      nextLastSubmittedBy: roleConfig.role,
      nextClosedAt: null,
      nextHandoffNote: noteWithAssignee,
      nextHandoffHistory: nextHistory,
      nextFormData,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnSupervisorFromDecision = (note: string) => {
    if (roleConfig.role !== 'Program Manager') {
      return;
    }
    const trimmedReason = note.trim();
    if (!trimmedReason) {
      return;
    }
    const timestamp = new Date().toISOString();
    const nextSections = returnWorkflowSection(sections, 'supervisor', roleConfig.role, trimmedReason, timestamp);
    const nextHistory = [...handoffHistory, buildHandoff('section-returned', 'supervisor', trimmedReason)];
    const nextFormData: AccidentReportData = {
      ...formData,
      pm_supervisor_review_decision: 'returned',
      pm_supervisor_reviewed_at: timestamp,
      pm_supervisor_review_note: trimmedReason,
      pm_on_hold: false,
      pm_hold_note: undefined,
      pm_held_at: undefined,
    };

    setFormData(nextFormData);
    setLastSubmittedBy(roleConfig.role);
    setHandoffHistory(nextHistory);
    setHandoffNote(trimmedReason);
    setSections(nextSections);
    setCurrentStep(4);

    persistReport({
      nextSections,
      nextStep: 4,
      nextLastSubmittedBy: roleConfig.role,
      nextClosedAt: null,
      nextHandoffNote: trimmedReason,
      nextHandoffHistory: nextHistory,
      nextFormData,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRejectCase = (reason: string) => {
    if (roleConfig.role !== 'Program Manager') {
      return;
    }
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return;
    }
    const timestamp = new Date().toISOString();
    const nextHistory = [...handoffHistory, buildHandoff('rejected', null, trimmedReason)];
    const nextFormData: AccidentReportData = {
      ...formData,
      pm_supervisor_review_decision: 'rejected',
      pm_supervisor_reviewed_at: timestamp,
      pm_supervisor_review_note: trimmedReason,
      pm_on_hold: false,
      pm_hold_note: undefined,
      pm_held_at: undefined,
    };

    setFormData(nextFormData);
    setRejectedAt(timestamp);
    setRejectionReason(trimmedReason);
    setRejectedBy(roleConfig.role);
    setLastSubmittedBy(roleConfig.role);
    setHandoffHistory(nextHistory);
    setHandoffNote(trimmedReason);
    setRejectResult({ reason: trimmedReason, rejectedAt: timestamp });

    persistReport({
      nextSections: sections,
      nextStep: currentStep,
      nextLastSubmittedBy: roleConfig.role,
      nextClosedAt: timestamp,
      nextHandoffNote: trimmedReason,
      nextHandoffHistory: nextHistory,
      nextFormData,
      nextRejectedAt: timestamp,
      nextRejectionReason: trimmedReason,
      nextRejectedBy: roleConfig.role,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitResult) {
    return (
      <SuccessScreen
        accidentEventId={reportId}
        data={formData}
        initiatedBy={initiatedBy}
        currentRole={roleConfig.role}
        currentUserName={roleConfig.name}
        submittedSectionKey={submitResult.submittedSectionKey}
        sections={submitResult.sections}
        activatedSections={submitResult.activatedSections}
        isComplete={submitResult.isComplete}
        onBackToHome={onBackToHome}
        onViewCaseStatus={() => setSubmitResult(null)}
      />
    );
  }

  if (rejectResult) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <DARTHeader activeNav="new-report" onNavigate={onNavigate} />
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex-1 w-full">
          <div className="max-w-[880px] mx-auto">
            <div className="rounded-2xl border border-red-200 bg-white shadow-[0_10px_28px_-14px_rgba(153,27,27,0.35)] overflow-hidden">
              <div className="bg-gradient-to-br from-red-50 to-white px-6 py-8 sm:px-10 sm:py-10 border-b border-red-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 font-['Poppins']">Case rejected</p>
                <h2 className="mt-2 text-[24px] sm:text-[28px] font-semibold text-[#00205B] font-['Poppins']">
                  Case {reportId} closed as rejected
                </h2>
                <p className="mt-3 text-sm text-slate-600 font-['Poppins']">
                  Rejected by {roleConfig.name} on {new Date(rejectResult.rejectedAt).toLocaleString()}. Rework is not permitted after rejection.
                </p>
              </div>
              <div className="px-6 py-6 sm:px-10 sm:py-8 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Reason for rejection</p>
                  <p className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 font-['Poppins']">
                    {rejectResult.reason}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectResult(null)}
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
                  >
                    View case record
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectResult(null);
                      onBackToHome?.();
                    }}
                    className="inline-flex min-h-[44px] items-center rounded-lg bg-[#00205B] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#001a49] focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
                  >
                    Back to home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DARTFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen dart-canvas flex flex-col">
      <DARTHeader activeNav="new-report" onNavigate={onNavigate} />

      {/* Assistant Manager Review — a lightweight "middle reviewer" flow.
          AM has no form fields of their own; they read what the Field Supervisor
          (and Operator) filed, then pick one of three CSV-defined actions. */}
      {roleConfig.role === 'Assistant Manager' ? (
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex-1 w-full">
          <div className="max-w-[900px] mx-auto">
            <AssistantManagerReview
              data={formData}
              caseId={reportId}
              onBackToHome={onBackToHome}
              onOpenOperatorReport={() => { setReferenceDrawerTab('operator'); setReferenceDrawerOpen(true); }}
              onOpenSupervisorReport={() => { setReferenceDrawerTab('supervisor'); setReferenceDrawerOpen(true); }}
              onOpenActivity={() => { setReferenceDrawerTab('activity'); setReferenceDrawerOpen(true); }}
              onAction={(actionId, payload) => {
                // TODO: swap for workflow engine call when the API contract lands.
                // eslint-disable-next-line no-console
                console.info('[stub] Assistant Manager action', { actionId, payload });
              }}
            />
          </div>
          <ReferenceReportDrawer
            open={referenceDrawerOpen}
            onClose={() => setReferenceDrawerOpen(false)}
            data={formData}
            defaultTab={referenceDrawerTab}
            operatorStatus={sections.operator.status}
            supervisorSection={sections.supervisor}
            activityReport={liveReport}
          />
        </div>
      ) : (
        <>

      {/* Match header's max-width and padding structure for alignment */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex-1 w-full">
        {/* Inner content constraint for readability - centered for better balance */}
        <div className="max-w-[1600px] mx-auto">
          {/* Page Title - aligned with nav menu */}
          <div className="mb-8">
            <h1 className="text-[28px] sm:text-[32px] text-[#00205B] font-semibold mb-2">
              Accident case workspace
            </h1>
            <p className="text-sm text-slate-600">
              Complete your owned section. Case workflow details are available when you need them.
            </p>
          </div>

          {/* Case-context bar: shown for handoff / review scenarios. Hidden for an operator
              filing their own report (no multi-party context to surface) — except when their
              section was returned for correction, where the case history genuinely matters. */}
          {initialReport && !isAssignedSectionFlow
            && !(roleConfig.role === 'Operator' && initiatedBy === 'Operator' && activeSection.status !== 'returned') && (
            <div className="mb-4">
              <RoleContextBar
                caseId={reportId}
                data={formData}
                initiatedBy={initiatedBy}
                currentRole={roleConfig.role}
                currentUserName={roleConfig.name}
                activeSectionKey={activeSectionKey}
                activeSection={activeSection}
                currentStep={currentStep}
                onViewCaseStatus={() => setIsCaseStatusOpen(true)}
              />
            </div>
          )}

          {/* Persistent case-header context now lives inside the unified wizard card below */}

          {activeSectionKey === 'supervisor' && initiatedBy === 'Supervisor' && formData.is_on_behalf !== false && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">Field Supervisor Section</p>
              <p className="mt-1 text-sm text-slate-700 font-['Poppins']">
                You are completing the Field Supervisor portion of this case. The employee will complete their Operator Section separately.
              </p>
            </div>
          )}

          {activeSection.correctionNote && activeSection.status === 'returned' && (
            <div className="mb-6">
              <CorrectionResolutionScreen
                data={formData}
                sectionKey={activeSectionKey}
                sectionLabel={getSectionLabel(activeSectionKey)}
                caseId={reportId}
                reviewerName={activeSection.returnedBy}
                note={activeSection.correctionNote}
                onUpdate={handleUpdate}
                onReviewAndSubmit={() => setCurrentStep(4)}
              />
            </div>
          )}

          {/* One unified surface: employee header → stepper → step content, all as a single card */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_28px_-14px_rgba(0,32,91,0.14),0_2px_6px_-2px_rgba(0,32,91,0.06)]">

            {/* Case header: who this case is about (persistent across steps) */}
            <EmployeeRecordPanel
              data={formData}
              submissionContext={isAssignedSectionFlow ? {
                sectionLabel: 'Operator section submitted',
                submittedAt: sections.operator.submittedAt,
                caseEvent: `${formData.event_type || 'Event pending'} · ${formData.mode || 'Mode pending'}`,
              } : undefined}
            />

            {/* Form workspace: continuous blue ramp from header into workspace with no
                color break or seam before the rounded foreground deck. */}
            <div className="relative -mt-px bg-[linear-gradient(180deg,#003A78_0%,#004B8D_40%,#EEF3F8_72%)]">

              {/* Section progress — rounded foreground deck pulled upward over the header */}
              {showSectionStepper && (
                <div className="relative z-20 -mt-1 md:-mt-2 bg-[#F6F8FB] rounded-t-[36px] shadow-[0_10px_16px_-14px_rgba(2,36,79,0.30)]">
                  <WizardStepper currentStep={currentStepperStep} onStepClick={handleStepClick} steps={sectionStepperSteps} />
                </div>
              )}

              {/* Form Content - tinted work surface so section cards float above the floor */}
              <div className={`bg-[#F6F8FB] px-4 sm:px-6 md:px-8 pb-6 md:pb-8 ${isAssignedSectionFlow && !showSectionStepper ? 'relative z-20 -mt-1 md:-mt-2 rounded-t-[36px] pt-2 md:pt-4 shadow-[0_10px_16px_-14px_rgba(2,36,79,0.30)]' : 'relative z-10'}`}>
              {isCaseRejected && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                  <p className="text-sm font-semibold text-red-900 font-['Poppins']">Case rejected</p>
                  <p className="mt-1 text-xs text-red-800 font-['Poppins']">
                    Closed as rejected by {rejectedBy || 'a Safety Program Manager'}
                    {rejectedAt ? ` on ${new Date(rejectedAt).toLocaleString()}` : ''}. No further edits are permitted.
                  </p>
                  {rejectionReason && (
                    <p className="mt-2 text-xs text-red-900 font-['Poppins']">
                      <span className="font-semibold">Reason:</span> {rejectionReason}
                    </p>
                  )}
                </div>
              )}
              {/* Step Content */}
              {/* Step Content */}
              {isAssignedSectionFlow && (
                <Step4ReviewSubmit
                  data={formData}
                  onUpdate={handleUpdate}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  onSaveDraft={handleSaveDraft}
                  onJumpToStep={(step) => {
                    setCurrentStep(step);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  stepNumber={1}
                  totalSteps={assignedSectionSteps?.length || 1}
                  title={programManagerInActionsMode ? 'Choose next action' : (activeAssignedStepTitle || stageMeta.label)}
                  description={activeSectionKey === 'supervisor'
                    ? 'Complete the Field Supervisor investigation fields for this case. The operator report is available as read-only reference.'
                    : programManagerInActionsMode
                    ? 'Select what should happen next. Your choice will update the workflow status and assignment.'
                    : currentStepperStep === 1
                    ? 'Confirm the case context and record your investigation notes. Field supervisor and police statements go here.'
                    : currentStepperStep === 2
                    ? 'Analyze contributing factors, log damage and tow details, and record any fatalities or injuries.'
                    : currentStepperStep === 3
                    ? 'Record your final classification decision, then continue to review.'
                    : 'Review everything you entered before confirming the next workflow action.'}
                  showStepBadge={false}
                  showBackButton={false}
                  submitLabel={stageMeta.submitLabel}
                  stageName={stageMeta.label}
                  nextRoleLabel={stageMeta.nextRoleLabel}
                  isRoleAllowedToAdvance={isRoleAllowedToAdvance}
                  workflowStage={workflowStage}
                  activeSectionKey={activeSectionKey}
                  activeSectionStatus={activeSection.status}
                  sectionStatuses={sections}
                  initiatedBy={initiatedBy}
                  handoffNote={handoffNote}
                  canReturn={false}
                  supervisorSectionStep={activeSectionKey === 'supervisor' ? currentStepperStep : undefined}
                  supervisorSectionStepCount={assignedSectionSteps?.length}
                  onSupervisorSectionStepChange={activeSectionKey === 'supervisor' ? (step) => {
                    setCurrentStep(step);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } : undefined}
                  programManagerSectionStep={activeSectionKey === 'programManager' ? currentStepperStep : undefined}
                  programManagerSectionStepCount={assignedSectionSteps?.length}
                  onProgramManagerSectionStepChange={activeSectionKey === 'programManager' ? (step) => {
                    setCurrentStep(step);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } : undefined}
                  onProgramManagerActionsModeChange={activeSectionKey === 'programManager' ? setProgramManagerInActionsMode : undefined}
                  pmReviewEnabled={pmCanTakeReviewAction && supervisorSectionSubmitted}
                  pmSupervisorSection={sections.supervisor}
                  pmOnOpenOperatorReport={() => { setReferenceDrawerTab('operator'); setReferenceDrawerOpen(true); }}
                  pmOnOpenSupervisorReport={() => { setReferenceDrawerTab('supervisor'); setReferenceDrawerOpen(true); }}
                  pmOnOpenActivity={() => { setReferenceDrawerTab('activity'); setReferenceDrawerOpen(true); }}
                  pmOnComment={handleCommentOnly}
                  pmOnHold={handleHoldCase}
                  pmOnReturn={handleReturnSupervisorFromDecision}
                  pmOnReassign={handleReassignSupervisorFromDecision}
                  pmOnReject={handleRejectCase}
                  pmOnApproveAndClose={handleApproveAndCloseCase}
                  pmOnResume={handleResumeFromHold}
                />
              )}

              {!isAssignedSectionFlow && currentStep === 1 && (
                <Step1IncidentBasics
                  data={formData}
                  onUpdate={handleUpdate}
                  onNext={isInitiatingPM ? handleInitiatePmCase : handleNext}
                  nextLabel={isInitiatingPM ? 'Initiate case' : undefined}
                  showStepBadge={!isInitiatingPM && !isInitiatingSupervisor}
                  lockEventAndMode={roleConfig.role === 'Operator' && initiatedBy !== 'Operator'}
                  onSaveDraft={handleSaveDraft}
                />
              )}

              {/* Initiating supervisor: after case setup, fill their OWN supervisor section in the
                  same flow (not the operator's Vehicle/People steps). Section self-manages its sub-steps.
                  On submit, the operator gets their task. */}
              {!isAssignedSectionFlow && isInitiatingSupervisor && currentStep >= 2 && (
                <Step4ReviewSubmit
                  data={formData}
                  onUpdate={handleUpdate}
                  onBack={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onSubmit={handleSubmit}
                  onSaveDraft={handleSaveDraft}
                  submitLabel={stageMeta.submitLabel}
                  stageName={stageMeta.label}
                  nextRoleLabel={stageMeta.nextRoleLabel}
                  isRoleAllowedToAdvance={isRoleAllowedToAdvance}
                  workflowStage={workflowStage}
                  activeSectionKey={activeSectionKey}
                  activeSectionStatus={activeSection.status}
                  sectionStatuses={sections}
                  initiatedBy={initiatedBy}
                  handoffNote={handoffNote}
                  canReturn={false}
                  stepNumber={currentStep}
                  totalSteps={INITIATING_SUPERVISOR_STEPS.length}
                  showStepBadge={false}
                  title={INITIATING_SUPERVISOR_STEPS[currentStep - 1]?.title || stageMeta.label}
                  supervisorSectionStep={currentStep - 1}
                  supervisorSectionStepCount={3}
                  onSupervisorSectionStepChange={(step) => { setCurrentStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              )}

              {!isAssignedSectionFlow && !isInitiatingSupervisor && currentStep === 2 && (
                <Step2VehicleLocation
                  data={formData}
                  onUpdate={handleUpdate}
                  onNext={handleNext}
                  onBack={handleBack}
                  onSaveDraft={handleSaveDraft}
                  workflowStage={workflowStage}
                  initiatedBy={initiatedBy}
                  activeSectionKey={activeSectionKey}
                  sectionStatuses={sections}
                  isOperatorNarrativeLocked={isOperatorNarrativeLocked}
                />
              )}

              {!isAssignedSectionFlow && !isInitiatingSupervisor && currentStep === 3 && (
                <Step3PeopleImpact
                  data={formData}
                  onUpdate={handleUpdate}
                  onNext={handleNext}
                  onBack={handleBack}
                  onSaveDraft={handleSaveDraft}
                  workflowStage={workflowStage}
                  initiatedBy={initiatedBy}
                  activeSectionKey={activeSectionKey}
                  sectionStatuses={sections}
                />
              )}

              {!isAssignedSectionFlow && !isInitiatingSupervisor && currentStep === 4 && (
                <Step4ReviewSubmit
                  data={formData}
                  onUpdate={handleUpdate}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  onSaveDraft={handleSaveDraft}
                  submitLabel={stageMeta.submitLabel}
                  stageName={stageMeta.label}
                  nextRoleLabel={stageMeta.nextRoleLabel}
                  isRoleAllowedToAdvance={isRoleAllowedToAdvance}
                  workflowStage={workflowStage}
                  activeSectionKey={activeSectionKey}
                  activeSectionStatus={activeSection.status}
                  sectionStatuses={sections}
                  initiatedBy={initiatedBy}
                  handoffNote={handoffNote}
                  canReturn={false}
                  onJumpToStep={(step) => {
                    setCurrentStep(step);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
              </div>
            </div>
          </div>

          <CaseStatusDrawer
            open={isCaseStatusOpen}
            onClose={() => setIsCaseStatusOpen(false)}
            caseId={reportId}
            data={formData}
            initiatedBy={initiatedBy}
            currentRole={roleConfig.role}
            currentUserName={roleConfig.name}
            sections={sections}
            activeSectionKey={activeSectionKey}
            timelineReport={liveReport}
          />

          {isFullReportOpen && (
            <ViewReportModal
              eventId={reportId}
              onClose={() => setIsFullReportOpen(false)}
              report={liveReport}
            />
          )}

          {duplicateReportToReview && (
            <ViewReportModal
              eventId={duplicateReportToReview.id}
              onClose={() => setDuplicateReportToReview(null)}
              report={duplicateReportToReview}
            />
          )}

          {possibleDuplicate && duplicateNeedsConfirmation && !duplicateReportToReview && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="duplicate-dialog-title"
              aria-describedby="duplicate-dialog-description"
            >
              <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)]">
                <div className="flex items-start gap-4 border-b border-amber-100 bg-amber-50 px-6 py-5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h2 id="duplicate-dialog-title" className="text-lg font-semibold text-amber-950 font-['Poppins']">
                      Possible Duplicate Record Detected.
                    </h2>
                    <p className="mt-1 text-xs text-amber-800 font-['Poppins']">
                      Matching details: {possibleDuplicate.matchingFields.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <p id="duplicate-dialog-description" className="text-sm leading-6 text-slate-700 font-['Poppins']">
                    A record with similar details already exists in the system (Unique ID:{' '}
                    <span className="dart-tabular font-semibold text-[#00205B]">{possibleDuplicate.report.id}</span>). Please review the existing record before proceeding. If this new entry represents a different event, you may confirm and continue creating a new record.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      ref={duplicateReviewButtonRef}
                      type="button"
                      onClick={() => setDuplicateReportToReview(possibleDuplicate.report)}
                      className="dart-press inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#00205B] transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00205B]/30 font-['Poppins']"
                    >
                      Review Existing Record (Unique ID: {possibleDuplicate.report.id})
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmNewRecord}
                      className="dart-press inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#00205B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003478] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00205B]/40 font-['Poppins']"
                    >
                      Confirm and Create New Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ReferenceReportDrawer
            open={referenceDrawerOpen}
            onClose={() => setReferenceDrawerOpen(false)}
            data={formData}
            defaultTab={referenceDrawerTab}
            operatorStatus={sections.operator.status}
            supervisorSection={sections.supervisor}
            activityReport={liveReport}
          />
        </div>
      </div>
      </>
      )}

      <DARTFooter />
    </div>
  );
}