import { ReactNode } from 'react';

interface StepContainerProps {
  stepNumber: number;
  totalSteps?: number;
  showStepBadge?: boolean;
  title: string;
  description: string | ReactNode;
  children: ReactNode;
  showBeforeYouBegin?: boolean;
}

export function StepContainer({ stepNumber, totalSteps = 4, showStepBadge = true, title, description, children, showBeforeYouBegin = false }: StepContainerProps) {
  return (
    <div className="pt-6">
      {/* Form Section Header */}
      <div className="mb-6 pb-4 border-b border-slate-200/60">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-[22px] text-[#00205B] font-semibold font-['Poppins']">
            {title}
          </h2>
          {showStepBadge && (
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-blue-200 bg-white text-xs text-slate-600 font-medium whitespace-nowrap ml-4">
              Step {stepNumber} of {totalSteps}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-700 font-['Poppins'] mb-2">{description}</p>
        <p className="text-xs text-slate-600 font-['Poppins']">
          Fields marked with <span className="text-red-500">*</span> are required.
        </p>
      </div>
      
      {children}
    </div>
  );
}