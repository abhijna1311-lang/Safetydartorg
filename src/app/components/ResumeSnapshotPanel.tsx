import { AlertCircle, ArrowRight, CheckCircle, Clock, X } from 'lucide-react';
import type { UserRole } from '../context/UserRoleContext';
import {
  formatSectionStatus,
  getReportLocation,
  getSectionKeyForRole,
  getWorkflowSections,
  type WorkflowReport,
} from '../types/workflow-report';

interface ResumeSnapshotPanelProps {
  report: WorkflowReport;
  currentRole: UserRole;
  currentUserName?: string;
  onGoToNext: () => void;
  onReviewDetails: () => void;
  onCancel: () => void;
}

const STEPS = ['Incident Basics', 'Incident Details', 'People And Impact', 'Review'];

function countMissingCommonFields(report: WorkflowReport) {
  const data = report.formData;
  const required = [
    data.employee_name,
    data.employee_badge_number,
    data.event_type,
    data.mode,
    data.incident_date,
    data.incident_time,
    data.description_of_event || data.incident_description,
  ];

  if (data.mode === 'Light Rail Vehicle' || data.mode === 'Streetcar' || data.mode === 'Hi-Rail') {
    required.push(data.train_number || data.address_of_event || data.station_applicable || data.grade_crossing_applicable);
  } else {
    required.push(data.vehicle_number, data.street_on || data.address_of_event, data.city);
  }

  return required.filter((value) => !value).length;
}

export function ResumeSnapshotPanel({ report, currentRole, currentUserName, onGoToNext, onReviewDetails, onCancel }: ResumeSnapshotPanelProps) {
  const sections = getWorkflowSections(report);
  const currentSection = sections[getSectionKeyForRole(currentRole)];
  const missingCount = countMissingCommonFields(report);
  const startedBy = report.initiatedBy === currentRole && currentUserName ? currentUserName : report.initiatedBy;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Resume case snapshot">
      <div className="w-full max-w-2xl rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#00205B] font-['Poppins']">Resume {report.id}</h2>
            <p className="mt-1 text-sm text-slate-600 font-['Poppins']">
              Started by {startedBy}{report.formData.employee_name ? ` for ${report.formData.employee_name}` : ''}.
            </p>
          </div>
          <button onClick={onCancel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60" aria-label="Close resume snapshot">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 text-[#007DBA]" />
              <div>
                <p className="text-sm font-medium text-[#00205B] font-['Poppins']">
                  {currentSection.label} is {formatSectionStatus(currentSection.status).toLowerCase()}.
                </p>
                <p className="mt-1 text-xs text-slate-600 font-['Poppins']">
                  {missingCount > 0 ? `${missingCount} common required ${missingCount === 1 ? 'field is' : 'fields are'} still missing.` : 'The common required fields look complete.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Event</p>
              <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{report.formData.event_type || 'Pending'} · {report.formData.mode || 'Mode pending'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Location</p>
              <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{getReportLocation(report.formData)}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Section progress</p>
            <div className="space-y-2">
              {STEPS.map((step, index) => {
                const stepNumber = index + 1;
                const complete = stepNumber < report.currentStep;
                const active = stepNumber === report.currentStep;
                return (
                  <div key={step} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    {complete ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className={`h-4 w-4 ${active ? 'text-[#007DBA]' : 'text-slate-400'}`} />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 font-['Poppins']">{step}</p>
                      <p className="text-xs text-slate-500 font-['Poppins']">{complete ? 'Complete' : active ? 'Needs your input' : 'Not started'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
          <button onClick={onCancel} className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60 font-['Poppins']">Cancel</button>
          <button onClick={onReviewDetails} className="min-h-[44px] rounded-lg border border-[#007DBA] bg-white px-4 py-2 text-sm font-medium text-[#007DBA] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60 font-['Poppins']">Review filled details</button>
          <button onClick={onGoToNext} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#007DBA] px-5 py-2 text-sm font-semibold text-white hover:bg-[#006BA0] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60 font-['Poppins']">
            Go to next required field
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}