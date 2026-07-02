import { AlertCircle, Lightbulb, CheckCircle, PlayCircle } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface SmartCheckIssue {
  message: string;
}

interface SmartCheckBannerProps {
  state?: 'default' | 'issues' | 'clear';
  issues?: SmartCheckIssue[];
  onRunCheck?: () => void;
}

export function SmartCheckBanner({ state = 'default', issues = [], onRunCheck }: SmartCheckBannerProps) {
  // Default state - ready to run check
  if (state === 'default') {
    return (
      <div className="px-5 py-4 bg-gradient-to-br from-blue-50/40 to-blue-50/20 border border-blue-100/60 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm text-blue-900 font-medium font-['Poppins'] mb-1">
              Smart check
            </div>
            <p className="text-xs text-blue-800/90 font-['Poppins']">
              Run smart check to review this step for missing or conflicting details before you move on.
            </p>
          </div>
        </div>
        <button
          onClick={onRunCheck}
          className="px-4 py-2 bg-white/90 border border-blue-200/60 text-blue-700 rounded-xl hover:bg-white hover:shadow-sm transition-all text-xs font-medium font-['Poppins'] whitespace-nowrap min-h-[36px] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#FFCD00]/50"
        >
          Run smart check
        </button>
      </div>
    );
  }

  // Issues found state
  if (state === 'issues') {
    return (
      <div className="px-5 py-4 bg-gradient-to-br from-amber-50/40 to-amber-50/20 border border-amber-200/60 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm text-amber-900 font-medium font-['Poppins'] mb-2">
              Smart check found {issues.length} {issues.length === 1 ? 'detail' : 'details'} to review.
            </div>
            <ul className="space-y-1.5">
              {issues.map((issue, index) => (
                <li key={index} className="text-xs text-amber-800/90 font-['Poppins'] flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // All clear state
  if (state === 'clear') {
    return (
      <div className="px-5 py-4 bg-gradient-to-br from-emerald-50/40 to-emerald-50/20 border border-emerald-200/60 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.04)] flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-emerald-900 font-medium font-['Poppins']">
            Smart check did not find anything that needs attention on this step.
          </p>
        </div>
      </div>
    );
  }

  return null;
}