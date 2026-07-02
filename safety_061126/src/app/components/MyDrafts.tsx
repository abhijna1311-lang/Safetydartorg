import { useMemo } from 'react';
import { FileText, Clock, Trash2, ArrowRight } from 'lucide-react';
import { DARTHeader } from './DARTHeader';
import { DARTFooter } from './DARTFooter';
import { useUserRole } from '../context/UserRoleContext';
import { formatShortDate, getReportLocation, getStepName, type WorkflowReport } from '../types/workflow-report';

interface DraftReport {
  id: string;
  startedOn: string;
  mode: string;
  step: string;
  stepNumber: number;
  eventType?: string;
  location?: string;
  lastModified?: string;
}

interface MyDraftsProps {
  onNavigate?: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
  onResumeReport?: (reportId: string) => void;
  onDeleteDraft?: (reportId: string) => void;
  drafts?: WorkflowReport[];
  onBackToHome?: () => void;
}

const mockDrafts: DraftReport[] = [
  {
    id: 'AR-2025-0012',
    startedOn: '11/15/2025',
    mode: 'Bus',
    step: 'Vehicle and location',
    stepNumber: 2,
    eventType: 'Collision',
    location: 'Main St & 5th Ave',
    lastModified: '2 hours ago'
  },
  {
    id: 'AR-2025-0009',
    startedOn: '11/12/2025',
    mode: 'Rail',
    step: 'People and impact',
    stepNumber: 3,
    eventType: 'Passenger Injury',
    location: 'Downtown Station',
    lastModified: '3 days ago'
  },
  {
    id: 'AR-2025-0006',
    startedOn: '11/08/2025',
    mode: 'Bus',
    step: 'Basic information',
    stepNumber: 1,
    eventType: 'Property Damage',
    lastModified: '1 week ago'
  },
  {
    id: 'AR-2025-0004',
    startedOn: '11/05/2025',
    mode: 'Streetcar',
    step: 'Vehicle and location',
    stepNumber: 2,
    eventType: 'Equipment Failure',
    location: 'Oak St Station',
    lastModified: '1 week ago'
  }
];

export function MyDrafts({ onNavigate, onResumeReport, onDeleteDraft, drafts, onBackToHome }: MyDraftsProps) {
  const { roleConfig } = useUserRole();
  const draftItems = useMemo<DraftReport[]>(() => {
    if (!drafts) {
      return mockDrafts;
    }

    return drafts
      .filter((report) => report.workflowStage !== 'closed' && report.initiatedBy === roleConfig.role)
      .sort((a, b) => b.lastSavedAt.localeCompare(a.lastSavedAt))
      .map((report) => ({
        id: report.id,
        startedOn: formatShortDate(report.createdAt),
        mode: report.formData.mode || 'Unspecified',
        step: getStepName(report),
        stepNumber: report.currentStep,
        eventType: report.formData.event_type,
        location: getReportLocation(report.formData),
        lastModified: formatShortDate(report.lastSavedAt),
      }));
  }, [drafts, roleConfig.role]);

  const getStepProgress = (stepNumber: number) => {
    const percentage = (stepNumber / 4) * 100;
    return percentage;
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'Bus':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rail':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Streetcar':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DARTHeader activeNav="drafts" onNavigate={onNavigate} />

      <div className="max-w-[1920px] mx-auto px-8 py-8 flex-1">
        {/* Page Header with Stats */}
        <div className="mb-8 flex items-start justify-between gap-8">
          {/* Left: Page Title */}
          <div>
            <h1 className="text-[32px] text-[#00205B] font-semibold font-['Poppins'] mb-2">
              Draft Cases
            </h1>
            <p className="text-sm text-slate-600 font-['Poppins']">
              Resume or delete unfinished case sections.
            </p>
          </div>

          {/* Right: Statistics */}
          <div className="bg-white rounded-xl border border-slate-200/60 px-6 py-4 shadow-sm">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium font-['Poppins'] mb-0.5">Total Draft Cases</p>
                <p className="text-2xl text-[#00205B] font-semibold font-['Poppins']">{draftItems.length}</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium font-['Poppins'] mb-0.5">In Progress</p>
                <p className="text-2xl text-[#007DBA] font-semibold font-['Poppins']">
                  {draftItems.filter(d => d.stepNumber > 1).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {draftItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base text-slate-900 font-semibold font-['Poppins'] mb-2">
                No draft cases
              </h3>
              <p className="text-sm text-slate-600 font-['Poppins'] mb-6">
                Start a new accident case to get started
              </p>
              <button
                onClick={() => onNavigate?.('new-report')}
                className="px-6 py-3 rounded-xl bg-[#007DBA] text-white font-medium font-['Poppins'] hover:bg-[#006BA0] transition-all focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/50"
              >
                Start New Case
              </button>
            </div>
          </div>
        ) : (
          /* Drafts Grid - Responsive: 1 mobile, 2 tablet, 3-4 desktop */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {draftItems.map((draft) => (
              <div
                key={draft.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group w-full"
                style={{ minWidth: '320px', maxWidth: '340px' }}
              >
                <div className="p-6 flex flex-col h-full">
                  {/* HEADER: Row 1 - Case ID + Delete Icon */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base text-[#00205B] font-semibold font-['Poppins']">
                      {draft.id}
                    </h3>
                    {/* Delete icon - single action in top right */}
                    <button
                      onClick={() => onDeleteDraft?.(draft.id)}
                      className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 shrink-0"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600 transition-colors" />
                    </button>
                  </div>

                  {/* HEADER: Row 2 - Tags (dedicated row, 24px spacing below) */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border font-['Poppins'] ${getModeColor(draft.mode)}`}>
                      {draft.mode}
                    </span>
                    {draft.eventType && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-50 text-slate-700 border border-slate-200 font-['Poppins']">
                        {draft.eventType}
                      </span>
                    )}
                  </div>

                  {/* BODY: Block 1 - Start / Modified Info */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-['Poppins'] mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      Started {draft.startedOn}
                    </div>
                    {draft.lastModified && (
                      <p className="text-xs text-slate-400 font-['Poppins']">
                        Modified {draft.lastModified}
                      </p>
                    )}
                  </div>

                  {/* BODY: Block 2 - Incident Summary */}
                  {draft.location && (
                    <div className="mb-3 pb-3 border-b border-slate-100">
                      <p className="text-xs text-slate-700 font-['Poppins'] line-clamp-2">
                        <span className="text-slate-500">Location:</span> {draft.location}
                      </p>
                    </div>
                  )}

                  {/* BODY: Block 3 - Current Step Section */}
                  <div className="mb-6 flex-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2 font-semibold font-['Poppins']">
                      Section step
                    </p>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-7 h-7 rounded-full bg-[#007DBA] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {draft.stepNumber}
                      </div>
                      <span className="text-sm text-slate-700 font-medium line-clamp-2 font-['Poppins']">
                        {draft.step}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#007DBA] to-[#0099E6] rounded-full transition-all duration-300"
                          style={{ width: `${getStepProgress(draft.stepNumber)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 font-medium font-['Poppins']">
                        Section step {draft.stepNumber} of 4
                      </p>
                    </div>
                  </div>

                  {/* FOOTER: CTA Button */}
                  <button
                    onClick={() => onResumeReport?.(draft.id)}
                    className="group/resume relative w-full h-12 px-5 text-sm font-medium text-white bg-gradient-to-br from-[#005A8F] to-[#007DBA] hover:from-[#006BA0] hover:to-[#0088CC] rounded-xl shadow-md hover:shadow-lg ease-in-out overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#005A8F] focus:ring-offset-2 font-['Poppins']"
                    style={{ transition: 'background-color 600ms ease-in-out, box-shadow 600ms ease-in-out' }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/resume:opacity-100 ease-in-out" style={{ transition: 'opacity 600ms ease-in-out' }} />
                    <span className="relative flex items-center justify-between">
                      <span>Resume section</span>
                      <ArrowRight className="w-4 h-4 group-hover/resume:translate-x-1 ease-in-out" style={{ transition: 'transform 600ms ease-in-out' }} />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DARTFooter />
    </div>
  );
}