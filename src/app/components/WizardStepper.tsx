import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface WizardStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  steps?: WizardStep[];
}

interface WizardStep {
  number: number;
  title: string;
}

const DEFAULT_STEPS: WizardStep[] = [
  { number: 1, title: 'Incident Basics' },
  { number: 2, title: 'Vehicle And Location' },
  { number: 3, title: 'People And Impact' },
  { number: 4, title: 'Review' },
];

export function WizardStepper({ currentStep, onStepClick, steps = DEFAULT_STEPS }: WizardStepperProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const currentStepData = steps[currentStep - 1] || steps[0];
  const nextStepData = steps[currentStep];
  const railProgressPercent = steps.length <= 1 ? 100 : ((currentStep - 1) / (steps.length - 1)) * 100;
  const mobileProgressPercent = steps.length <= 1 ? 100 : (currentStep / steps.length) * 100;

  return (
    <>
      {/* Desktop: Horizontal Compact Band */}
      <div 
        className="hidden md:block"
        role="navigation"
        aria-label="Your section progress"
      >
        <div className="px-8 py-5">
          {/* Top Row: Label + Autosave */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Your Section Progress
            </p>
            <p className="text-xs text-slate-500 italic">
              These steps apply only to your section.
            </p>
          </div>

          {/* Capsule Rail Stepper */}
          <div className="relative">
            {/* Background Track */}
            <div className="absolute top-[14px] left-0 right-0 h-[3px] bg-[#D7DEE7] rounded-full" />
            
            {/* Active Progress Track */}
            <div 
              className="absolute top-[14px] left-0 h-[3px] bg-gradient-to-r from-[#008E9F] to-[#005EA8] rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${railProgressPercent}%`
              }}
            />

            {/* Steps Grid */}
            <div className="relative grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
              {steps.map((step) => {
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                const isUpcoming = step.number > currentStep;
                
                return (
                  <div 
                    key={step.number}
                    className="flex flex-col items-center"
                  >
                    {/* Circle Node - Smaller */}
                    <button
                      onClick={() => onStepClick?.(step.number)}
                      disabled={isUpcoming}
                      aria-current={isActive ? 'step' : undefined}
                      aria-label={`Step ${step.number}: ${step.title}${isCompleted ? ' - Completed' : isActive ? ' - Current' : ''}`}
                      className={`
                        relative rounded-full transition-all duration-300 ease-out
                        ${isActive 
                          ? 'w-[30px] h-[30px] bg-[#00205B] shadow-[0_0_0_3px_rgba(0,164,181,0.10),0_3px_10px_rgba(0,32,91,0.2)]' 
                          : isCompleted
                          ? 'w-[28px] h-[28px] bg-[#008E9F] shadow-[0_2px_6px_rgba(0,142,159,0.16)] cursor-pointer hover:shadow-[0_3px_10px_rgba(0,142,159,0.24)] hover:scale-105'
                          : 'w-[28px] h-[28px] bg-white border border-slate-300 shadow-[0_1px_3px_rgba(16,44,73,0.05)] cursor-not-allowed'
                        }
                        focus:outline-none focus:ring-2 focus:ring-[#007DBA] focus:ring-offset-2
                      `}
                    >
                      <div className="relative z-10 flex items-center justify-center w-full h-full">
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                        ) : (
                          <span 
                            className={`text-[11px] font-semibold ${
                              isActive 
                                ? 'text-white' 
                                : isUpcoming
                                ? 'text-slate-500'
                                : 'text-white'
                            }`}
                          >
                            {step.number}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Step Label - Tighter spacing */}
                    <div className="mt-2 text-center px-1">
                      <p 
                        className={`text-[12px] leading-tight transition-all duration-300 ${
                          isActive 
                            ? 'text-[#00205B] font-semibold' 
                            : isCompleted
                            ? 'text-[#006E9A] font-medium'
                            : 'text-slate-600 font-normal'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tablet: Vertical List (768px and below) */}
      <div 
        className="hidden sm:block md:hidden"
        role="navigation"
        aria-label="Your section progress"
      >
        <div className="px-6 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#00205B]">
                Your Section Progress
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs font-semibold text-[#00205B]">Step {currentStep} of {steps.length}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs font-medium text-[#007DBA]">
                {currentStepData.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 italic">
              These steps apply only to your section.
            </p>
          </div>

          {/* Vertical Step List */}
          <div className="space-y-3">
            {steps.map((step) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;
              const isUpcoming = step.number > currentStep;
              
              return (
                <button
                  key={step.number}
                  onClick={() => !isUpcoming && onStepClick?.(step.number)}
                  disabled={isUpcoming}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                    ${isActive ? 'bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)]' : 'hover:bg-slate-50'}
                    ${isUpcoming ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  `}
                >
                  {/* Circle */}
                  <div
                    className={`
                      flex-shrink-0 rounded-full flex items-center justify-center
                      ${isActive 
                        ? 'w-7 h-7 bg-[#00205B] shadow-sm' 
                        : isCompleted
                        ? 'w-7 h-7 bg-[#008E9F]'
                        : 'w-7 h-7 bg-white border border-slate-300'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                    ) : (
                      <span 
                        className={`text-[11px] font-semibold ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span 
                    className={`text-sm ${
                      isActive 
                        ? 'text-[#00205B] font-semibold' 
                          : isCompleted
                          ? 'text-[#006E9A] font-medium'
                          : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Compressed (480px and below) */}
      <div 
        className="block sm:hidden"
        role="navigation"
        aria-label="Your section progress"
      >
        <div className="px-4 py-4">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Your Section Progress
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#00205B] text-white text-[10px] font-semibold">
                  Step {currentStep} of {steps.length}
                </span>
                <span className="text-sm font-semibold text-[#00205B]">
                  {currentStepData.title}
                </span>
              </div>
              {nextStepData && (
                <p className="text-xs text-slate-500">
                  Next: {nextStepData.title}
                </p>
              )}
            </div>
            
            {/* Expand button */}
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="flex items-center gap-1 text-xs text-[#007DBA] font-medium px-2 py-1 rounded hover:bg-slate-100"
            >
              View all
              <ChevronDown className={`w-3 h-3 transition-transform ${mobileExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expandable Full List */}
          {mobileExpanded && (
            <div className="space-y-2 pt-3 border-t border-slate-200/60">
              {steps.map((step) => {
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                const isUpcoming = step.number > currentStep;
                
                return (
                  <div
                    key={step.number}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded
                      ${isActive ? 'bg-slate-100' : ''}
                    `}
                  >
                    {/* Small circle */}
                    <div
                      className={`
                        flex-shrink-0 rounded-full flex items-center justify-center w-5 h-5
                        ${isActive 
                          ? 'bg-[#00205B]' 
                          : isCompleted
                          ? 'bg-[#008E9F]'
                          : 'bg-white border border-slate-300'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                      ) : (
                        <span 
                          className={`text-[9px] font-semibold ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {step.number}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <span 
                      className={`text-xs ${
                        isActive 
                          ? 'text-[#00205B] font-semibold' 
                          : isCompleted
                          ? 'text-[#007DBA] font-medium'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-[#D7DEE7] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00A4B5] to-[#007DBA] transition-all duration-500"
              style={{ width: `${mobileProgressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
