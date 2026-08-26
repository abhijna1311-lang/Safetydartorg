import { useState } from 'react';
import { CustomSelect } from '../../CustomSelect';
import { YesNoToggle } from '../../form/YesNoToggle';
import { StepContainer } from '../../StepContainer';
import { GlassButton } from '../../GlassButton';
import { PersonListEditor } from '../../PersonListEditor';
import type { AccidentReportData, Person } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

const BODY_PARTS = ['Head', 'Upper body', 'Lower body'].map(value => ({ value, label: value }));

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 first:border-t-0 px-6 py-6 md:px-7 md:py-7">
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">{title}</h3>
        {help && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-['Poppins']">{help}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function BoolRow({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3 ${error ? 'bg-red-50/50' : ''}`}>
      <p className={`dart-field-label sm:flex-1 ${error ? 'text-red-600' : ''}`} style={{ marginBottom: 0 }}>{label}{required && <span className="dart-req ml-1">*</span>}</p>
      <div className={`shrink-0 ${error ? 'dart-field-error' : ''}`}>{children}</div>
    </div>
  );
}

export function OperatorPassengerPeopleImpactSection({ data, onUpdate, onNext, onBack, onSaveDraft }: Props) {
  const [showErrors, setShowErrors] = useState(false);
  const people = data.people ?? [];
  const isDartEmployee = data.operator_passenger_event_relating_to === 'DART Employee';
  const isNonDartEmployee = data.operator_passenger_event_relating_to === 'Passenger/Non-Dart Employee';
  const employeeComplete = isNonDartEmployee || (data.operator_passenger_employee_injured !== undefined
    && (!data.operator_passenger_employee_injured || (!!data.operator_passenger_employee_body_part && data.operator_passenger_employee_transported !== undefined)));
  const personComplete = (person: Person) => {
    const pedestrianComplete = person.role !== 'Pedestrian' || (!!person.pedestrian_type && !!person.pedestrian_action);
    return pedestrianComplete
      && !!person.gender
      && person.is_dart_employee !== undefined;
  };
  const peopleComplete = isDartEmployee || (data.people_involved !== undefined
    && (data.people_involved === false || (people.length > 0 && people.every(personComplete))));
  const canProceed = employeeComplete && peopleComplete;
  const handleNext = () => {
    if (canProceed) {
      setShowErrors(false);
      onNext();
      return;
    }
    setShowErrors(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StepContainer
      stepNumber={3}
      title="People And Impact"
      description={isDartEmployee ? 'Record the employee injury information for this event.' : isNonDartEmployee ? 'Record other people and injury information for this event.' : 'Record the employee, other people, and injury information for this event.'}
    >
      <div className="dart-card dart-card--surface overflow-hidden">
        {!isNonDartEmployee && (
          <Section title="Employee Who Submitted The Report" help="Record the employee's injury status and response.">
            <div className={`overflow-hidden rounded-xl border bg-white divide-y divide-slate-100 ${showErrors && !employeeComplete ? 'border-red-300' : 'border-slate-200/70'}`}>
              <BoolRow label="Was the employee injured?" required error={showErrors && data.operator_passenger_employee_injured === undefined}>
                <YesNoToggle value={data.operator_passenger_employee_injured} onChange={value => onUpdate({ operator_passenger_employee_injured: value, operator_passenger_employee_body_part: value ? data.operator_passenger_employee_body_part : undefined, operator_passenger_employee_transported: value ? data.operator_passenger_employee_transported : undefined })} />
              </BoolRow>
              {data.operator_passenger_employee_injured === true && (
                <>
                  <BoolRow label="Injured body part" required error={showErrors && !data.operator_passenger_employee_body_part}>
                    <div className="w-full sm:w-60"><CustomSelect value={data.operator_passenger_employee_body_part || ''} onChange={value => onUpdate({ operator_passenger_employee_body_part: value })} options={BODY_PARTS} placeholder="Select" error={showErrors && !data.operator_passenger_employee_body_part} /></div>
                  </BoolRow>
                  <BoolRow label="Was the employee transported to hospital?" required error={showErrors && data.operator_passenger_employee_transported === undefined}>
                    <YesNoToggle value={data.operator_passenger_employee_transported} onChange={value => onUpdate({ operator_passenger_employee_transported: value })} />
                  </BoolRow>
                </>
              )}
            </div>
          </Section>
        )}

        {!isDartEmployee && (
          <Section title="Other People Involved in the Event" help="Record passengers and pedestrians involved so follow-up and care can be handled properly.">
            <div className={`overflow-hidden rounded-xl border bg-white divide-y divide-slate-100 ${showErrors && data.people_involved === undefined ? 'border-red-300' : 'border-slate-200/70'}`}>
              <BoolRow label="Was anyone else involved in this event?" required error={showErrors && data.people_involved === undefined}>
                <YesNoToggle value={data.people_involved} onChange={value => onUpdate({ people_involved: value, people: value ? people : [] })} />
              </BoolRow>
            </div>
            {data.people_involved === true && (
              <div className="pt-1">
                <PersonListEditor people={people} onChange={people => onUpdate({ people })} showErrors={showErrors} injuryDetailsRequired={false} showFollowUpFields={false} showPassengerAction={false} showInjuryBodyPart={false} showAge />
              </div>
            )}
            {showErrors && data.people_involved === true && people.length === 0 && <p className="text-xs font-medium text-red-600 font-['Poppins']">Add at least one passenger or pedestrian.</p>}
          </Section>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-y-3 border-t border-slate-200 pt-6">
        <button type="button" onClick={onBack} className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]">← Back</button>
        <div className="flex items-center gap-4">
          <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
          <GlassButton variant="primary" onClick={handleNext}>Next</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}
