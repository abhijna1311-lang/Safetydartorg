import { CheckCircle, FileText, Eye } from 'lucide-react';
import { GlassButton } from './GlassButton';
import type { AccidentReportData } from '../types/accident-report';

interface SubmissionSuccessInlineProps {
  eventId: string;
  data: AccidentReportData;
  onBackToHome: () => void;
  onViewReport: () => void;
}

export function SubmissionSuccessInline({ 
  eventId, 
  data, 
  onBackToHome,
  onViewReport 
}: SubmissionSuccessInlineProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-blue-50/40 rounded-2xl p-8 border border-emerald-200/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_2px_12px_-2px_rgba(16,185,129,0.12),0_12px_24px_-8px_rgba(16,185,129,0.08)] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl text-emerald-900 font-semibold font-['Poppins'] mb-3">
            Your Operator Section Has Been Submitted
          </h2>
          
          <div className="flex items-center gap-2 text-sm text-slate-700 mb-6 font-['Poppins']">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-lg border border-emerald-200/60">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-emerald-900 font-['Poppins']">Case ID {eventId}</span>
            </span>
            <span className="text-slate-400">·</span>
            <span>{data.mode}</span>
            {data.incident_date && (
              <>
                <span className="text-slate-400">·</span>
                <span>{new Date(data.incident_date).toLocaleDateString()}</span>
              </>
            )}
          </div>

          <div className="bg-white/60 rounded-xl p-4 mb-6 border border-emerald-200/40">
            <p className="text-sm text-slate-700 font-['Poppins'] leading-relaxed">
              Your section has been received. You can track this case from your home page.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <GlassButton 
              variant="primary" 
              onClick={onBackToHome}
            >
              Back to operator home
            </GlassButton>
            <button
              onClick={onViewReport}
              className="inline-flex items-center gap-2 text-sm text-[#007DBA] hover:text-[#00205B] font-['Poppins'] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFCD00] rounded-lg px-3 py-2"
            >
              <Eye className="w-4 h-4" />
              View case summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}