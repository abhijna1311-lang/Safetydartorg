import { Lightbulb, CheckCircle } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface SmartCheckDescriptionHelperProps {
  state?: 'default' | 'reviewed';
  onReview?: () => void;
}

export function SmartCheckDescriptionHelper({ 
  state = 'default', 
  onReview 
}: SmartCheckDescriptionHelperProps) {
  
  // Default state - before review
  if (state === 'default') {
    return (
      <div className="mt-3 p-4 bg-blue-50/40 border border-blue-200/50 rounded-lg">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-[#007DBA] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-[#00205B] font-medium font-['Poppins']">
              Smart check for description
            </div>
            <div className="text-xs text-slate-600 mt-1 font-['Poppins']">
              Review this description for missing details or conflicts with other answers.
            </div>
          </div>
          <GlassButton 
            variant="secondary" 
            onClick={onReview}
            className="flex-shrink-0 text-xs px-3 py-1.5"
          >
            Review my description
          </GlassButton>
        </div>
      </div>
    );
  }
  
  // Reviewed state - shows feedback
  return (
    <div className="mt-3 p-4 bg-amber-50/40 border border-amber-200/50 rounded-lg">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-amber-900 font-medium font-['Poppins'] mb-2">
            Smart check suggests a few additions
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 font-['Poppins']">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>Location is not mentioned. Consider adding where this occurred.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>You mention a passenger who fell but the passenger injury section is empty.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}