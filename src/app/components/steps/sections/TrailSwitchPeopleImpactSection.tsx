import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { StepContainer } from '../../StepContainer';
import { GlassButton } from '../../GlassButton';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { PersonListEditor } from '../../PersonListEditor';
import type { AccidentReportData, Person } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  workflowStage?: 'initiation' | 'operator-completion' | 'supervisor-review' | 'program-manager-review' | 'closed';
  activeSectionKey?: string;
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

export function TrailSwitchPeopleImpactSection({ data, onUpdate, onNext, onBack, onSaveDraft, workflowStage = 'operator-completion', activeSectionKey = 'operator', showErrors = false }: Props) {
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const isReadOnly = workflowStage === 'supervisor-review' || activeSectionKey !== 'operator';
  const shouldShowErrors = showErrors || hasAttemptedNext;
  const operatorInjured = data.trail_operator_injured === true;
  const people = data.people ?? [];
  const personComplete = (person: Person) => (
    !!person.gender
    && person.is_dart_employee !== undefined
    && (person.role !== 'Pedestrian' || (!!person.pedestrian_type && !!person.pedestrian_action))
    && !!person.injured_body_part
    && person.transported_to_hospital !== undefined
  );
  const peopleComplete = data.people_involved !== undefined
    && (data.people_involved === false || (people.length > 0 && people.every(personComplete)));
  const updateTrailPeople = (nextPeople: Person[]) => {
    const passengers = nextPeople.filter(person => person.role === 'Passenger');
    const pedestrians = nextPeople.filter(person => person.role === 'Pedestrian');
    onUpdate({
      people: nextPeople,
      trail_passengers_injured: passengers.filter(person => person.injured).length,
      trail_passengers_transported: passengers.filter(person => person.transported_to_hospital === true).length,
      trail_pedestrian_injuries: pedestrians.filter(person => person.injured).length,
      trail_pedestrians_transported: pedestrians.filter(person => person.transported_to_hospital === true).length,
    });
  };
  const canProceed = workflowStage === 'initiation' || isReadOnly || (
    data.trail_operator_injured !== undefined
    && (!operatorInjured || (!!data.trail_operator_injured_body_part && data.trail_operator_transported !== undefined))
    && peopleComplete
  );

  const handleNext = () => {
    if (canProceed) {
      setHasAttemptedNext(false);
      onNext();
      return;
    }
    setHasAttemptedNext(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StepContainer stepNumber={3} title="People And Impact" description="Record aggregate employee, passenger, and pedestrian injury counts for this Trail a Switch event.">
      {shouldShowErrors && !canProceed && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-800 font-['Poppins']">Please complete the required fields highlighted below to continue.</p>
        </div>
      )}

      <div className={`dart-card dart-card--surface overflow-hidden ${isReadOnly ? 'opacity-90' : ''}`}>
        <Section title="Employee Who Submitted The Report" help="Record the employee who submitted the Trail a Switch report.">
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="Was the employee injured?" required>
              <YesNoToggle
                value={data.trail_operator_injured}
                onChange={value => onUpdate({ trail_operator_injured: value, trail_operator_injured_body_part: value ? data.trail_operator_injured_body_part : undefined, trail_operator_transported: value ? data.trail_operator_transported : undefined })}
              />
            </BoolRow>
            {operatorInjured && (
              <>
                <BoolRow label="Injured body part" required>
                  <div className="w-full sm:w-60"><CustomSelect value={data.trail_operator_injured_body_part || ''} onChange={value => onUpdate({ trail_operator_injured_body_part: value })} options={BODY_PARTS} placeholder="Select" error={shouldShowErrors && !data.trail_operator_injured_body_part} /></div>
                </BoolRow>
                <BoolRow label="Was employee transported to the hospital?" required>
                  <YesNoToggle value={data.trail_operator_transported} onChange={value => onUpdate({ trail_operator_transported: value })} />
                </BoolRow>
              </>
            )}
          </div>
        </Section>

        <Section title="Other People Involved in the Event" help="Record each passenger or pedestrian involved so injury and hospital transport details are captured consistently.">
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
            <BoolRow label="How many passengers were on board?">
              <input type="number" min={0} inputMode="numeric" value={data.passengers_on_board ?? ''} onChange={event => onUpdate({ passengers_on_board: event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0) })} placeholder="Enter count" className="dart-input-base w-full text-center sm:w-24" />
            </BoolRow>
            <BoolRow label="Was anyone else involved in this event?" required>
              <YesNoToggle value={data.people_involved} onChange={value => onUpdate({ people_involved: value, people: value ? people : [], ...(value ? {} : { trail_passengers_injured: 0, trail_passengers_transported: 0, trail_pedestrian_injuries: 0, trail_pedestrians_transported: 0 }) })} />
            </BoolRow>
          </div>
          {data.people_involved === true && (
            <div className="pt-1">
              <PersonListEditor people={people} onChange={updateTrailPeople} showErrors={shouldShowErrors} injuryDetailsRequired showFollowUpFields={false} showPassengerAction={false} />
            </div>
          )}
          {shouldShowErrors && data.people_involved === true && people.length === 0 && <p className="text-xs font-medium text-red-600 font-['Poppins']">Add at least one passenger or pedestrian.</p>}
        </Section>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-y-3 border-t border-slate-200 pt-6">
        <button onClick={onBack} className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]">← Back</button>
        <div className="flex items-center gap-4">
          <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
          <GlassButton variant="primary" onClick={handleNext}>Next</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}
