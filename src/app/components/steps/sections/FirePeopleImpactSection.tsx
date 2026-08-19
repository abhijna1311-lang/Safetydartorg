import { useState } from 'react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { StepContainer } from '../../StepContainer';
import { GlassButton } from '../../GlassButton';
import type { AccidentReportData } from '../../../types/accident-report';
import type { UserRole } from '../../../context/UserRoleContext';
import type { WorkflowSectionKey, WorkflowSections } from '../../../types/workflow-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  workflowStage?: 'initiation' | 'operator-completion' | 'supervisor-review' | 'program-manager-review' | 'closed';
  initiatedBy?: UserRole;
  activeSectionKey?: WorkflowSectionKey;
  sectionStatuses?: WorkflowSections;
  showErrors?: boolean;
}

const BODY_PARTS = ['Head', 'Upper body', 'Lower body'].map(value => ({ value, label: value }));

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">{title}</h3>
        {help && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-['Poppins']">{help}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function BoolRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3">
      <p className="dart-field-label sm:flex-1" style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function FirePeopleImpactSection({ data, onUpdate, onNext, onBack, onSaveDraft, workflowStage = 'operator-completion', activeSectionKey = 'operator', showErrors = false }: Props) {
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const operatorInjured = data.operator_injured === true;
  const passengersInjured = (data.fire_passengers_injured ?? 0) > 0;
  const pedestriansInjured = (data.fire_pedestrians_injured ?? 0) > 0;
  const isReadOnly = workflowStage === 'supervisor-review' || activeSectionKey !== 'operator';
  const shouldShowErrors = showErrors || hasAttemptedNext;
  const canProceed = workflowStage === 'initiation' || isReadOnly || (
    data.operator_injured !== undefined
    && (!operatorInjured || (data.operator_injured_body_part && data.operator_transported !== undefined))
    && data.fire_other_employees_injured !== undefined
    && data.fire_passengers_injured !== undefined
    && (!passengersInjured || data.fire_passengers_transported !== undefined)
    && data.fire_pedestrians_injured !== undefined
    && (!pedestriansInjured || data.fire_pedestrians_transported !== undefined)
  );

  const handleNext = () => {
    if (canProceed) {
      onNext();
      return;
    }
    setHasAttemptedNext(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StepContainer stepNumber={3} title="People And Impact" description="Record injuries and hospital transport counts for the fire event.">
      <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-700 font-['Poppins']">
        Fire reports use counts for other employees, passengers, and pedestrians. Operator injury details remain separate so the totals are unambiguous.
      </div>
      <div className={`dart-card dart-card--surface overflow-hidden ${isReadOnly ? 'opacity-90' : ''}`}>
      <Section title="Operator injury" help="Record the operator's injury status and response.">
        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Operator injured" required>
            <YesNoToggle value={data.operator_injured} onChange={value => onUpdate({ operator_injured: value, operator_injured_body_part: value ? data.operator_injured_body_part : undefined, operator_transported: value ? data.operator_transported : undefined })} />
          </BoolRow>
          {operatorInjured && (
            <>
              <BoolRow label="Injured body part" required>
                <div className="w-full sm:w-60"><CustomSelect value={data.operator_injured_body_part || ''} onChange={value => onUpdate({ operator_injured_body_part: value })} options={BODY_PARTS} placeholder="Select" error={shouldShowErrors && !data.operator_injured_body_part} /></div>
              </BoolRow>
              <BoolRow label="Was employee transported to the hospital" required><YesNoToggle value={data.operator_transported} onChange={value => onUpdate({ operator_transported: value })} /></BoolRow>
            </>
          )}
          <BoolRow label="Number of other employees injured" required>
            <div className="w-full sm:w-60"><input type="number" min={0} inputMode="numeric" value={data.fire_other_employees_injured ?? ''} onChange={event => onUpdate({ fire_other_employees_injured: event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0) })} placeholder="Enter count" className="dart-input-base" /></div>
          </BoolRow>
        </div>
      </Section>

      <Section title="Passenger injury" help="Passenger transport appears when at least one passenger is injured.">
        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Number of passengers injured" required>
            <div className="w-full sm:w-60"><input type="number" min={0} inputMode="numeric" value={data.fire_passengers_injured ?? ''} onChange={event => { const value = event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0); onUpdate({ fire_passengers_injured: value, fire_passengers_transported: value && value > 0 ? data.fire_passengers_transported : undefined }); }} placeholder="Enter count" className="dart-input-base" /></div>
          </BoolRow>
          {passengersInjured && <BoolRow label="Number of passengers transported to the hospital" required><div className="w-full sm:w-60"><input type="number" min={0} inputMode="numeric" value={data.fire_passengers_transported ?? ''} onChange={event => onUpdate({ fire_passengers_transported: event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0) })} placeholder="Enter count" className="dart-input-base" /></div></BoolRow>}
        </div>
      </Section>

      <Section title="Pedestrian injury" help="Pedestrian transport appears when at least one pedestrian is injured.">
        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
          <BoolRow label="Number of pedestrian injuries" required>
            <div className="w-full sm:w-60"><input type="number" min={0} inputMode="numeric" value={data.fire_pedestrians_injured ?? ''} onChange={event => { const value = event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0); onUpdate({ fire_pedestrians_injured: value, fire_pedestrians_transported: value && value > 0 ? data.fire_pedestrians_transported : undefined }); }} placeholder="Enter count" className="dart-input-base" /></div>
          </BoolRow>
          {pedestriansInjured && <BoolRow label="Number of pedestrians transported to the hospital" required><div className="w-full sm:w-60"><input type="number" min={0} inputMode="numeric" value={data.fire_pedestrians_transported ?? ''} onChange={event => onUpdate({ fire_pedestrians_transported: event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0) })} placeholder="Enter count" className="dart-input-base" /></div></BoolRow>}
        </div>
      </Section>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-y-3 mt-8 pt-6 border-t border-slate-200">
        <button onClick={onBack} className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]">← Back</button>
        <div className="flex items-center gap-4">
          <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
          <GlassButton variant="primary" onClick={handleNext}>Next</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}
