import { Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface SmartCheckIssue {
  id: string;
  message: string;
  section?: string;
}

interface SmartCheckReviewBannerProps {
  state?: 'default' | 'issues' | 'clear';
  issues?: SmartCheckIssue[];
  onRunCheck?: () => void;
  onIssueClick?: (issue: SmartCheckIssue) => void;
}

export function SmartCheckReviewBanner({ 
  state = 'default', 
  issues = [], 
  onRunCheck,
  onIssueClick 
}: SmartCheckReviewBannerProps) {
  
  // Default state - ready to run check
  if (state === 'default') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#0078AE] p-3 shadow-sm flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg text-[#00205B] font-semibold font-['Poppins'] mb-2">
              Smart check
            </div>
            <div className="text-sm text-slate-700 font-['Poppins']">
              Run smart check to review this section for missing or conflicting details before you submit.
            </div>
          </div>
          <GlassButton 
            variant="primary" 
            onClick={onRunCheck}
            className="flex-shrink-0"
          >
            Run smart check
          </GlassButton>
        </div>
      </div>
    );
  }
  
  // Issues found state
  if (state === 'issues') {
    return (
      <div className="p-6 bg-gradient-to-br from-amber-50/60 to-orange-50/30 rounded-2xl border border-amber-200/40 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-xl shadow-sm flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg text-amber-900 font-semibold font-['Poppins'] mb-3">
              Smart check found {issues.length} {issues.length === 1 ? 'detail' : 'details'} to review
            </div>
            <ul className="space-y-2">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <button
                    onClick={() => onIssueClick?.(issue)}
                    className="w-full text-left p-3 bg-white/60 hover:bg-white rounded-lg border border-amber-200/50 hover:border-amber-300 transition-all text-sm text-slate-700 font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5 flex-shrink-0">•</span>
                      <span>{issue.message}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  // All clear state
  return (
    <div className="p-6 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 rounded-2xl border border-emerald-200/40 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-500 rounded-xl shadow-sm flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-emerald-800 font-['Poppins']">
            Smart check did not find anything that needs attention in this section.
          </div>
        </div>
      </div>
    </div>
  );
}