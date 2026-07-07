import { Info } from 'lucide-react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { BusCollisionDetailsSection } from './sections/BusCollisionDetailsSection';
import { LRVCollisionDetailsSection } from './sections/LRVCollisionDetailsSection';
import type { AccidentReportData } from '../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

// Modes that follow the LRV form path
const LRV_MODES = ['Light Rail Vehicle', 'Streetcar', 'Hi-Rail'];

export function Step2CollisionInformation({ data, onUpdate, onNext, onBack, onSaveDraft }: Props) {
  const isLRV = LRV_MODES.includes(data.mode || '');
  const isBus = !isLRV; // Bus + Non-Revenue Vehicle

  // Check if this is a collision event
  const isCollision = data.event_type === 'Collision';

  // Minimum required to proceed (collision-specific fields)
  const canProceed = isCollision
    ? !!(data.collision_type || data.lrv_collision_type)
    : true; // Non-collision events can proceed immediately

  return (
    <StepContainer
      stepNumber={2}
      title={isCollision ? "Collision information" : "Event details"}
      description={isCollision
        ? `Collision details for the ${data.mode || 'selected mode'}.`
        : `No collision details needed for ${data.event_type || 'this event type'}.`
      }
    >
      {isCollision ? (
        <>
          {/* Context banner */}
          <div className="flex items-center gap-2 mb-5 px-4 py-2.5 bg-blue-50/70 rounded-lg border border-blue-200/50">
            <Info className="w-4 h-4 text-[#007DBA] flex-shrink-0" />
            <p className="text-xs text-[#00205B] font-['Poppins']">
              Showing <strong>{data.mode}</strong> collision form.
            </p>
          </div>

          <div className="space-y-5">
            {isBus && <BusCollisionDetailsSection data={data} onUpdate={onUpdate} />}
            {isLRV && <LRVCollisionDetailsSection data={data} onUpdate={onUpdate} />}
          </div>
        </>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200/60 px-6 py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-6 h-6 text-[#007DBA]" />
            </div>
            <h3 className="text-base text-slate-900 font-semibold mb-2 font-['Poppins']">
              No collision details needed
            </h3>
            <p className="text-sm text-slate-600 font-['Poppins']">
              This is a <strong>{data.event_type}</strong> event. Collision-specific information is not required.
              Click Next to continue to vehicle and location details.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={onBack}
          className="text-sm text-[#007DBA] hover:text-[#00205B] transition-colors font-['Poppins'] min-h-[44px] px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] rounded-lg"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
          <GlassButton variant="primary" onClick={onNext} disabled={!canProceed}>Next</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}
