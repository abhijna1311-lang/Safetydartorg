import { CheckCircle, Clock, Lock } from 'lucide-react';
import { formatSectionStatus, type WorkflowSectionState, type WorkflowSectionStatus } from '../types/workflow-report';

interface SectionStatusCardProps {
  section: WorkflowSectionState;
  owner: string;
  message: string;
  active?: boolean;
}

function statusClasses(status: WorkflowSectionStatus) {
  switch (status) {
    case 'returned':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'pending':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'in-progress':
      return 'border-cyan-200 bg-cyan-50 text-cyan-800';
    case 'submitted':
    case 'resubmitted':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'accepted':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function StatusIcon({ status }: { status: WorkflowSectionStatus }) {
  if (status === 'accepted' || status === 'submitted' || status === 'resubmitted') {
    return <CheckCircle className="h-4 w-4 text-emerald-600" />;
  }

  if (status === 'not-required') {
    return <Lock className="h-4 w-4 text-slate-400" />;
  }

  return <Clock className="h-4 w-4 text-slate-400" />;
}

export function SectionStatusCard({ section, owner, message, active = false }: SectionStatusCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${active ? 'border-[#007DBA]/40 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">{section.label}</p>
          <p className="mt-1 text-xs text-slate-500 font-['Poppins']">Owner: {owner}</p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium font-['Poppins'] ${statusClasses(section.status)}`}>
          {formatSectionStatus(section.status)}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 font-['Poppins']">
        <StatusIcon status={section.status} />
        <p>{message}</p>
      </div>
    </div>
  );
}