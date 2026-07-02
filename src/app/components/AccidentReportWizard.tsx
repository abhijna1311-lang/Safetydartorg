import { useEffect, useMemo, useState } from 'react';
import { WizardStepper } from './WizardStepper';
import { Step1IncidentBasics } from './steps/Step1IncidentBasics';
import { Step2VehicleLocation } from './steps/Step2VehicleLocation';
import { Step3PeopleImpact } from './steps/Step3PeopleImpact';
import { Step4ReviewSubmit } from './steps/Step4ReviewSubmit';
import EmployeeRecordPanel from './steps/sections/EmployeeRecordPanel';
import { SuccessScreen } from './SuccessScreen';
import { DARTHeader } from './DARTHeader';
import { DARTFooter } from './DARTFooter';
import { CorrectionResolutionScreen } from './CorrectionResolutionScreen';
import { RoleContextBar } from './RoleContextBar';
import { CaseStatusDrawer } from './CaseStatusDrawer';
import type { AccidentReportData } from '../types/accident-report';
import { useUserRole, type UserRole } from '../context/UserRoleContext';
import {
  activateParallelSections,
  areRequiredSectionsComplete,
  createInitialSections,
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
}

const ASSIGNED_SECTION_STEPS: Record<Exclude<WorkflowSectionKey, 'operator'>, { number: number; title: string }[]> = {
  supervisor: [
    { number: 1, title: 'Incident Basics' },
    { number: 2, title: 'Injuries and Police' },
    { number: 3, title: 'Review and Submit' },
  ],
  programManager: [{ number: 1, title: 'Program Manager Section' }],
};

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
        nextRoleLabel: 'Supervisor and Program Manager',
      };
    case 'supervisor':
      return {
        label: initiatedBy === 'Supervisor' && isOnBehalf !== false ? 'Supervisor section collision initiation' : 'Supervisor section collision',
        scenarioLabel: initiatedBy === 'Supervisor' ? 'Supervisor initiated scenario' : 'Assigned after operator initiation',
        summary: initiatedBy === 'Supervisor'
          ? 'Start the case by completing the supervisor collision investigation section, then notify the operator and program manager in tandem.'
          : 'Complete the supervisor collision investigation section while the program manager can work their section independently.',
        responsibilities: ['Confirm scene and arrival details', 'Capture collision investigation rollups', 'Request operator corrections when needed'],
        submitLabel: 'Submit supervisor section',
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

export function AccidentReportWizard({ onNavigate, onBackToHome, initialStep, initialData, initialReport, onSaveReport }: AccidentReportWizardProps) {
  const { roleConfig } = useUserRole();
  const [currentStep, setCurrentStep] = useState(() => getInitialStepForCurrentRole(initialReport, roleConfig.role, initialStep));
  const [formData, setFormData] = useState<AccidentReportData>(initialReport?.formData || initialData || {});
  const [reportId] = useState(() => initialReport?.id || `AE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [createdAt] = useState(() => initialReport?.createdAt || new Date().toISOString());
  const [initiatedBy] = useState<UserRole>(initialReport?.initiatedBy || roleConfig.role);
  const [sections, setSections] = useState<WorkflowSections>(() => initialReport ? getWorkflowSections(initialReport) : createInitialSections(roleConfig.role, initialData?.is_on_behalf));
  const activeSectionKey = getSectionKeyForRole(roleConfig.role);
  const activeSection = sections[activeSectionKey];
  const isAssignedSectionFlow = shouldUseAssignedSectionFlow(initialReport, roleConfig.role);
  const assignedSectionSteps = isAssignedSectionFlow && activeSectionKey !== 'operator' ? ASSIGNED_SECTION_STEPS[activeSectionKey] : undefined;
  const showSectionStepper = !isAssignedSectionFlow || Boolean(assignedSectionSteps && assignedSectionSteps.length > 1);
  const currentStepperStep = isAssignedSectionFlow ? Math.min(currentStep, assignedSectionSteps?.length || 1) : currentStep;
  const activeAssignedStepTitle = assignedSectionSteps?.find((step) => step.number === currentStepperStep)?.title;
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
  const [submitResult, setSubmitResult] = useState<null | {
    submittedSectionKey: WorkflowSectionKey;
    sections: WorkflowSections;
    activatedSections: WorkflowSectionKey[];
    isComplete: boolean;
  }>(null);

  const stageMeta = useMemo(
    () => getSectionMeta(activeSectionKey, initiatedBy, formData.is_on_behalf, isComplete),
    [activeSectionKey, initiatedBy, formData.is_on_behalf, isComplete],
  );
  const isRoleAllowedToAdvance = !isComplete && isSectionActionable(activeSection);
  const returnableSections = WORKFLOW_SECTION_ORDER.filter((sectionKey) => {
    const section = sections[sectionKey];
    if (section.status !== 'submitted' || section.ownerRole === roleConfig.role || roleConfig.role === 'Operator') {
      return false;
    }

    if (roleConfig.role === 'Supervisor') {
      return sectionKey === 'operator';
    }

    return true;
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
    };
  }, [createdAt, currentStep, formData, handoffHistory, handoffNote, initialReport?.closedAt, initialReport?.dueBy, initialReport?.lastSavedAt, initiatedBy, lastSubmittedBy, reportId, sections]);

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
  }: {
    nextSections: WorkflowSections;
    nextStep: number;
    nextLastSubmittedBy: UserRole | null;
    nextClosedAt: string | null;
    nextHandoffNote: string | null;
    nextHandoffHistory: WorkflowHandoff[];
  }) => {
    const nextStage = getLegacyStageFromSections(nextSections);
    onSaveReport?.({
      id: reportId,
      initiatedBy,
      workflowStage: nextStage,
      overallStatus: getOverallStatusFromSections(nextSections, nextStage === 'closed'),
      sections: nextSections,
      currentStep: nextStep,
      formData,
      createdAt,
      lastSavedAt: new Date().toISOString(),
      dueBy: initialReport?.dueBy,
      lastSubmittedBy: nextLastSubmittedBy,
      handoffNote: nextHandoffNote,
      handoffHistory: nextHandoffHistory,
      closedAt: nextClosedAt,
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

  const handleNext = () => {
    if (currentStep < 4) {
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

  const handleSubmit = () => {
    if (!isRoleAllowedToAdvance) {
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
    const nextSections = activateParallelSections(submittedSections, initiatedBy, formData.is_on_behalf, timestamp);
    const nextIsComplete = areRequiredSectionsComplete(nextSections);
    const activatedSections = WORKFLOW_SECTION_ORDER.filter(
      (sectionKey) => sections[sectionKey].status === 'not-started' && nextSections[sectionKey].status === 'pending',
    );
    const nextHistory = [
      ...handoffHistory,
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DARTHeader activeNav="new-report" onNavigate={onNavigate} />

      {/* Match header's max-width and padding structure for alignment */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex-1 w-full">
        {/* Inner content constraint for readability - centered for better balance */}
        <div className="max-w-[1200px] mx-auto">
          {/* Page Title - aligned with nav menu */}
          <div className="mb-8">
            <h1 className="text-[28px] sm:text-[32px] text-[#00205B] font-semibold mb-2">
              Accident Case Workspace
            </h1>
            <p className="text-sm text-slate-600">
              Complete your owned section. Case workflow details are available when you need them.
            </p>
          </div>

          {/* Case-context bar: only when there's a real persisted case (post-handoff).
              Fresh forms have no ID yet and no multi-party context to show. */}
          {initialReport && !isAssignedSectionFlow && (
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
              <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">Supervisor Section</p>
              <p className="mt-1 text-sm text-slate-700 font-['Poppins']">
                You are completing the Supervisor-owned portion of this case. The employee will complete their Operator Section separately.
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
                  <WizardStepper currentStep={currentStepperStep} onStepClick={handleStepClick} steps={assignedSectionSteps} />
                </div>
              )}

              {/* Form Content - dedicated white work surface below the navigation deck */}
              <div className={`bg-white px-4 sm:px-6 md:px-8 pb-6 md:pb-8 ${isAssignedSectionFlow && !showSectionStepper ? 'relative z-20 -mt-1 md:-mt-2 rounded-t-[36px] pt-2 md:pt-4 shadow-[0_10px_16px_-14px_rgba(2,36,79,0.30)]' : 'relative z-10'}`}>
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
                  title={activeSectionKey === 'supervisor' ? activeAssignedStepTitle || stageMeta.label : stageMeta.label}
                  description={activeSectionKey === 'supervisor'
                    ? 'Complete the supervisor-owned investigation fields for this case. The operator report is available as read-only reference.'
                    : 'Complete the program manager-owned classification fields for this case.'}
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
                />
              )}

              {!isAssignedSectionFlow && currentStep === 1 && (
                <Step1IncidentBasics
                  data={formData}
                  onUpdate={handleUpdate}
                  onNext={handleNext}
                  onSaveDraft={handleSaveDraft}
                />
              )}

              {!isAssignedSectionFlow && currentStep === 2 && (
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

              {!isAssignedSectionFlow && currentStep === 3 && (
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

              {!isAssignedSectionFlow && currentStep === 4 && (
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
        </div>
      </div>

      <DARTFooter />
    </div>
  );
}