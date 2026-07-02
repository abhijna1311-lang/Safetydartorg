import { MdAccessTime, MdCheckCircle, MdClose, MdDescription, MdLocationOn, MdPerson } from 'react-icons/md';
import { CaseTimeline } from './CaseTimeline';
import { CaseWorkflowStatusPanel } from './CaseWorkflowStatusPanel';
import { useUserRole } from '../context/UserRoleContext';
import {
  formatShortDate,
  getReportLocation,
  getWorkflowSections,
  type WorkflowReport,
} from '../types/workflow-report';

interface ViewReportModalProps {
  eventId: string;
  onClose: () => void;
  report?: WorkflowReport;
}

function FieldValue({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 font-medium">{label}</p>
      <p className="text-sm text-[#00205B] font-medium">{displayValue ?? '—'}</p>
    </div>
  );
}

function SectionCard({ title, sectionNumber, children }: { title: string; sectionNumber: number; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
      <h3 className="text-base text-[#00205B] font-semibold mb-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#007DBA] text-white flex items-center justify-center text-xs font-semibold">
          {sectionNumber}
        </div>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ViewReportModal({ eventId, onClose, report }: ViewReportModalProps) {
  const { roleConfig } = useUserRole();
  const data = report?.formData;
  const sections = report ? getWorkflowSections(report) : null;
  const canSeeSupervisorDetails = roleConfig.role === 'Supervisor' || roleConfig.role === 'Program Manager';
  const canSeeProgramManagerDetails = roleConfig.role === 'Supervisor' || roleConfig.role === 'Program Manager';

  const fallbackReport = {
    status: 'Closed',
    submittedDate: 'Nov 17, 2024',
    submittedTime: '2:45 PM',
    reviewedBy: 'Sarah Johnson',
    mode: 'Bus',
    eventType: 'Collision',
    location: 'Main St & 5th Ave',
    description: 'No live report data is attached to this demo row.',
  };

  const status = report?.workflowStage === 'closed' ? 'Closed' : report?.overallStatus || fallbackReport.status;
  const submittedDate = report ? formatShortDate(report.closedAt || report.lastSavedAt) : fallbackReport.submittedDate;
  const submittedTime = data?.incident_time || fallbackReport.submittedTime;
  const reviewedBy = report?.lastSubmittedBy || fallbackReport.reviewedBy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-br from-[#00205B] to-[#003d7a] flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl text-white font-semibold">Accident Case Details</h2>
                <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                  {status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Case ID:</span>
                  <span className="font-semibold text-white">{eventId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdAccessTime className="w-4 h-4" />
                  <span>Last activity {submittedDate} at {submittedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdPerson className="w-4 h-4" />
                  <span>Last updated by {reviewedBy}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 shrink-0"
              aria-label="Close"
            >
              <MdClose className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {sections && report && data && (
              <CaseWorkflowStatusPanel
                caseId={eventId}
                data={data}
                initiatedBy={report.initiatedBy}
                currentRole={roleConfig.role}
                currentUserName={roleConfig.name}
                sections={sections}
                readonly
                compact
              />
            )}

            <SectionCard title="Incident Basics" sectionNumber={1}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FieldValue label="Vehicle Mode" value={data?.mode || fallbackReport.mode} />
                <FieldValue label="Event Type" value={data?.event_type || fallbackReport.eventType} />
                <FieldValue label="Event Date" value={data?.incident_date} />
                <FieldValue label="Event Time" value={data?.incident_time} />
                <FieldValue label="Employee" value={data?.employee_name} />
                <FieldValue label="Badge" value={data?.employee_badge_number} />
              </div>
            </SectionCard>

            <SectionCard title="Operator Section" sectionNumber={2}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FieldValue label="Vehicle Number" value={data?.vehicle_number || data?.train_number} />
                <FieldValue label="Route / Rail Line" value={data?.route_number || data?.rail_line} />
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1 font-medium">Location</p>
                  <div className="flex items-start gap-2">
                    <MdLocationOn className="w-4 h-4 text-[#007DBA] mt-0.5 shrink-0" />
                    <p className="text-sm text-[#00205B] font-medium">{data ? getReportLocation(data) : fallbackReport.location}</p>
                  </div>
                </div>
                <FieldValue label="Operator injured" value={data?.operator_injured} />
                <FieldValue label="Passenger injuries" value={data?.passengers_injured} />
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">Operator description</p>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-lg p-4 border border-slate-200">
                    {data?.description_of_event || data?.incident_description || fallbackReport.description}
                  </p>
                </div>
              </div>
            </SectionCard>

            {canSeeSupervisorDetails ? (
              <SectionCard title="Supervisor Section Collision" sectionNumber={3}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldValue label="Supervisor" value={data?.supervisor_name} />
                  <FieldValue label="Supervisor badge" value={data?.supervisor_badge_number} />
                  <FieldValue label="Division" value={data?.supervisor_division} />
                  <FieldValue label="Arrival" value={data?.supervisor_arrival_date && data?.supervisor_arrival_time ? `${data.supervisor_arrival_date} at ${data.supervisor_arrival_time}` : undefined} />
                  <FieldValue label="Damage count" value={data?.supervisor_damage_count} />
                  <FieldValue label="Tow count" value={data?.supervisor_tow_count} />
                  <FieldValue label="Police report" value={data?.supervisor_police_report_number} />
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">Supervisor description</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-lg p-4 border border-slate-200">
                      {data?.supervisor_event_description || '—'}
                    </p>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <h3 className="text-base text-[#00205B] font-semibold mb-2 flex items-center gap-2">
                  <MdCheckCircle className="w-5 h-5 text-emerald-600" />
                  Supervisor section
                </h3>
                <p className="text-sm text-slate-600">Some reviewer details are hidden based on your role permissions.</p>
              </div>
            )}

            {canSeeProgramManagerDetails ? (
              <SectionCard title="Program Manager Section" sectionNumber={4}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldValue label="Operator date/time correct" value={data?.operator_datetime_correct} />
                  <FieldValue label="Employee contacted" value={data?.employee_contacted_program_manager_date} />
                  <FieldValue label="Collision with" value={data?.program_manager_collision_with} />
                  <FieldValue label="Damage to property" value={data?.damage_to_property} />
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">Classification</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-lg p-4 border border-slate-200">
                      {data?.program_manager_classification || '—'}
                    </p>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <h3 className="text-base text-[#00205B] font-semibold mb-2 flex items-center gap-2">
                  <MdDescription className="w-5 h-5 text-slate-500" />
                  Program manager section
                </h3>
                <p className="text-sm text-slate-600">Some reviewer details are hidden based on your role permissions.</p>
              </div>
            )}

            {report && <CaseTimeline report={report} compact />}

            {roleConfig.role === 'Program Manager' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base text-[#00205B] font-semibold mb-2">Export</h3>
                <p className="text-sm text-slate-600">Download PDF and export case summary will be connected in production.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
