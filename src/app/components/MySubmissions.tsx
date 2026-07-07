import { Search, Filter, Calendar, Eye, AlertCircle, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DARTHeader } from './DARTHeader';
import { DARTFooter } from './DARTFooter';
import { ViewReportModal } from './ViewReportModal';
import { FilterDropdown, type FilterOption } from './FilterDropdown';
import { toast } from 'sonner';
import { useUserRole } from '../context/UserRoleContext';
import { formatShortDate, getPendingSectionLabels, getReportLocation, getWorkflowStatus, wasRoleInvolvedInReport, type WorkflowReport } from '../types/workflow-report';

interface CaseHistoryItem {
  id: string;
  submittedDate: string;
  submittedTime: string;
  mode: string;
  eventType: string;
  location: string;
  status: 'Closed' | 'Waiting on sections' | 'Active' | 'Correction needed';
  waitingOn?: string;
}

interface MySubmissionsProps {
  onNavigate?: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
  onBackToHome?: () => void;
  reports?: WorkflowReport[];
}

const mockSubmissions: CaseHistoryItem[] = [
  {
    id: 'AE-2024-1891',
    submittedDate: 'Nov 17, 2024',
    submittedTime: '2:45 PM',
    mode: 'Bus',
    eventType: 'Collision',
    location: 'Main St & 5th Ave',
    status: 'Closed',
    waitingOn: '—'
  },
  {
    id: 'AE-2024-1876',
    submittedDate: 'Nov 15, 2024',
    submittedTime: '10:20 AM',
    mode: 'Rail',
    eventType: 'Passenger Injury',
    location: 'Downtown Station',
    status: 'Waiting on sections',
    waitingOn: 'Supervisor Section'
  },
  {
    id: 'AE-2024-1854',
    submittedDate: 'Nov 12, 2024',
    submittedTime: '4:15 PM',
    mode: 'Bus',
    eventType: 'Property Damage',
    location: 'Cedar Blvd',
    status: 'Active',
    waitingOn: 'Operator Section'
  },
  {
    id: 'AE-2024-1832',
    submittedDate: 'Nov 10, 2024',
    submittedTime: '1:30 PM',
    mode: 'Streetcar',
    eventType: 'Collision',
    location: 'Oak St Station',
    status: 'Closed',
    waitingOn: '—'
  },
  {
    id: 'AE-2024-1819',
    submittedDate: 'Nov 8, 2024',
    submittedTime: '9:05 AM',
    mode: 'Bus',
    eventType: 'Collision',
    location: 'Elm St & 2nd Ave',
    status: 'Correction needed',
    waitingOn: 'Operator Section'
  },
  {
    id: 'AE-2024-1801',
    submittedDate: 'Nov 5, 2024',
    submittedTime: '3:50 PM',
    mode: 'Rail',
    eventType: 'Equipment Failure',
    location: 'North Terminal',
    status: 'Closed',
    waitingOn: '—'
  },
  {
    id: 'AE-2024-1787',
    submittedDate: 'Nov 3, 2024',
    submittedTime: '11:25 AM',
    mode: 'Bus',
    eventType: 'Passenger Injury',
    location: 'Market St',
    status: 'Active',
    waitingOn: 'Program Manager Section'
  },
  {
    id: 'AE-2024-1765',
    submittedDate: 'Oct 31, 2024',
    submittedTime: '5:40 PM',
    mode: 'Bus',
    eventType: 'Collision',
    location: 'Pine Ave & 8th St',
    status: 'Closed',
    waitingOn: '—'
  }
];

export function MySubmissions({ onNavigate, onBackToHome, reports }: MySubmissionsProps) {
  const { roleConfig } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);

  const submissionItems = useMemo<CaseHistoryItem[]>(() => {
    if (!reports) {
      return mockSubmissions;
    }

    return reports
      .filter((report) => wasRoleInvolvedInReport(report, roleConfig.role))
      .sort((a, b) => (b.closedAt || b.lastSavedAt).localeCompare(a.closedAt || a.lastSavedAt))
      .map((report) => ({
        id: report.id,
        submittedDate: formatShortDate(report.closedAt || report.lastSavedAt),
        submittedTime: report.formData.incident_time || '—',
        mode: report.formData.mode || 'Unspecified',
        eventType: report.formData.event_type || 'Unspecified',
        location: getReportLocation(report.formData),
        status:
          report.workflowStage === 'closed'
            ? 'Closed'
            : getWorkflowStatus(report) === 'Correction requested'
            ? 'Correction needed'
            : getWorkflowStatus(report).startsWith('Waiting on')
            ? 'Waiting on sections'
            : 'Active',
        waitingOn: report.workflowStage === 'closed' ? '—' : getPendingSectionLabels(report),
      }));
  }, [reports, roleConfig.role]);

  const viewingReport = viewingEventId && reports ? reports.find((report) => report.id === viewingEventId) || null : null;

  const statusOptions: FilterOption[] = [
    { value: 'all',                  label: 'All Statuses' },
    { value: 'Closed',               label: 'Closed',                color: 'bg-emerald-500' },
    { value: 'Waiting on sections',  label: 'Waiting on sections',   color: 'bg-blue-500' },
    { value: 'Active',               label: 'Active',                color: 'bg-slate-400' },
    { value: 'Correction needed',    label: 'Correction needed',     color: 'bg-amber-500' },
  ];

  const modeOptions: FilterOption[] = [
    { value: 'all',        label: 'All Modes' },
    { value: 'Bus',        label: 'Bus' },
    { value: 'Rail',       label: 'Rail' },
    { value: 'Streetcar',  label: 'Streetcar' },
  ];

  // Handle download
  const handleDownload = (eventId: string) => {
    toast.success(`Preparing report ${eventId}...`, {
      description: 'Your PDF report will be ready shortly',
      duration: 3000,
    });
    // In production, this would trigger actual PDF generation/download
    console.log('Downloading report:', eventId);
  };

  // Filter submissions
  const filteredSubmissions = submissionItems.filter(submission => {
    const matchesSearch = 
      submission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesMode = modeFilter === 'all' || submission.mode === modeFilter;
    
    return matchesSearch && matchesStatus && matchesMode;
  });

  // Calculate statistics
  const totalSubmissions = submissionItems.length;
  const waitingOnSections = submissionItems.filter(s => s.status === 'Waiting on sections').length;
  const needsClarification = submissionItems.filter(s => s.status === 'Correction needed').length;

  const getStatusColor = (status: CaseHistoryItem['status']) => {
    switch (status) {
      case 'Closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Active':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'Waiting on sections':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Correction needed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DARTHeader activeNav="submissions" onNavigate={onNavigate} />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[32px] text-[#00205B] font-semibold font-['Poppins'] mb-2">
            Case History
          </h1>
          <p className="text-sm text-slate-600 font-['Poppins']">
            View and track accident cases you are part of.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-['Poppins'] mb-1">Total Cases</p>
                <p className="text-2xl text-[#00205B] font-semibold font-['Poppins']">{totalSubmissions}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-['Poppins'] mb-1">Waiting on Sections</p>
                <p className="text-2xl text-[#007DBA] font-semibold font-['Poppins']">{waitingOnSections}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#007DBA]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-['Poppins'] mb-1">Correction Needed</p>
                <p className="text-2xl text-amber-600 font-semibold font-['Poppins']">{needsClarification}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Case ID, location, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 text-sm font-['Poppins'] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007DBA]/30 focus:border-[#007DBA] transition-all"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <FilterDropdown
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
              />
              <FilterDropdown
                label="Mode"
                value={modeFilter}
                onChange={setModeFilter}
                options={modeOptions}
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-600 font-['Poppins']">
            Showing <span className="font-medium text-slate-900">{filteredSubmissions.length}</span> of{' '}
            <span className="font-medium text-slate-900">{totalSubmissions}</span> cases
          </p>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider font-['Poppins']">Case ID</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider font-['Poppins']">Last activity</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider font-['Poppins']">Mode</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider font-['Poppins']">Event Type</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider font-['Poppins']">Location</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider font-['Poppins']">Status</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider font-['Poppins']">Waiting on</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-600 uppercase tracking-wider font-['Poppins']">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium font-['Poppins']">
                      {submission.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Poppins']">
                      <div className="flex flex-col">
                        <span>{submission.submittedDate}</span>
                        <span className="text-xs text-slate-500">{submission.submittedTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-['Poppins']">
                      {submission.mode}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Poppins']">
                      {submission.eventType}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Poppins']">
                      {submission.location}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-medium font-['Poppins'] ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-['Poppins']">
                      {submission.waitingOn || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium font-['Poppins'] hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/50"
                          onClick={() => setViewingEventId(submission.id)}
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                          View
                        </button>
                        <button
                          className="p-2 rounded-lg text-slate-400 hover:text-[#007DBA] hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/50"
                          aria-label="Download report"
                          onClick={() => handleDownload(submission.id)}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredSubmissions.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base text-slate-900 font-semibold font-['Poppins'] mb-2">
                No cases found
              </h3>
              <p className="text-sm text-slate-600 font-['Poppins']">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      <DARTFooter />

      {/* View Case Modal */}
      {viewingEventId && (
        <ViewReportModal
          eventId={viewingEventId}
          report={viewingReport || undefined}
          onClose={() => setViewingEventId(null)}
        />
      )}
    </div>
  );
}