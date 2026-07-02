import { CheckCircle, FileText, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { GlassButton } from './GlassButton';
import { CaseWorkflowStatusPanel } from './CaseWorkflowStatusPanel';
import type { AccidentReportData } from '../types/accident-report';
import type { UserRole } from '../context/UserRoleContext';
import { getSectionLabel, type WorkflowSectionKey, type WorkflowSections } from '../types/workflow-report';

interface SuccessScreenProps {
  accidentEventId?: string;
  data: AccidentReportData;
  initiatedBy: UserRole;
  currentRole: UserRole;
  currentUserName?: string;
  submittedSectionKey: WorkflowSectionKey;
  sections: WorkflowSections;
  activatedSections?: WorkflowSectionKey[];
  isComplete?: boolean;
  onBackToHome?: () => void;
  onViewCaseStatus?: () => void;
}

function getSuccessCopy(sectionKey: WorkflowSectionKey, isComplete?: boolean) {
  if (isComplete) {
    return {
      title: 'All required sections are complete',
      body: 'This case is now ready to close. The completed case view shows each section based on role permissions.',
    };
  }

  switch (sectionKey) {
    case 'operator':
      return {
        title: 'Your Operator Section has been submitted',
        body: 'Supervisor and Program Manager sections are now pending. You are done for now unless your section is returned for correction.',
      };
    case 'supervisor':
      return {
        title: 'Your Supervisor Section has been submitted',
        body: 'The case will remain open until all required sections are complete.',
      };
    case 'programManager':
      return {
        title: 'Your Program Manager Section has been submitted',
        body: 'The case will close when all required sections are complete.',
      };
  }
}

export function SuccessScreen({
  accidentEventId = 'AE-2024-1234',
  data,
  initiatedBy,
  currentRole,
  currentUserName,
  submittedSectionKey,
  sections,
  activatedSections = [],
  isComplete = false,
  onBackToHome,
  onViewCaseStatus,
}: SuccessScreenProps) {
  const [copied, setCopied] = useState(false);
  const copy = getSuccessCopy(submittedSectionKey, isComplete);

  const handleCopy = () => {
    navigator.clipboard.writeText(accidentEventId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewReport = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-8 py-12 text-center">
            <div className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-white mb-2">{copy.title}</h2>
            <p className="text-emerald-50">
              {copy.body}
            </p>
          </div>

          {/* Case ID */}
          <div className="px-8 py-6 bg-gradient-to-br from-slate-50 to-blue-50/30 border-b border-slate-200">
            <div className="text-center">
              <div className="text-xs text-slate-600 mb-2 uppercase tracking-wider">
                Case ID
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="px-6 py-3 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                  <code className="text-lg text-blue-700">{accidentEventId}</code>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-all"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Save this ID for your records and future reference
              </p>
            </div>
          </div>

          {/* What's Next */}
          <div className="px-8 py-6">
            <CaseWorkflowStatusPanel
              caseId={accidentEventId}
              data={data}
              initiatedBy={initiatedBy}
              currentRole={currentRole}
              currentUserName={currentUserName}
              sections={sections}
              activeSectionKey={submittedSectionKey}
              readonly
              compact
            />

            {activatedSections.length > 0 && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-medium text-[#00205B]">Sections now pending</p>
                <p className="mt-1 text-xs text-slate-600">
                  {activatedSections.map((sectionKey) => getSectionLabel(sectionKey)).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              You will be notified if your section is returned for correction
            </div>
            <div className="flex items-center gap-3">
              {onViewCaseStatus && (
                <GlassButton variant="secondary" onClick={onViewCaseStatus}>
                  View case status
                </GlassButton>
              )}
              <GlassButton variant="primary" onClick={handleNewReport}>
                Back to dashboard
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-600">
              Need help? Contact your supervisor or safety department
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
