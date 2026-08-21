import { Info } from 'lucide-react';
import { StepContainer } from '../../StepContainer';
import { GlassButton } from '../../GlassButton';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

function value(value: string | number | boolean | undefined) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return value === undefined || value === '' ? 'Not provided' : String(value);
}

export function OperatorPassengerPeopleImpactSection({ data, onNext, onBack, onSaveDraft }: Props) {
  const isEmployee = data.operator_passenger_event_relating_to === 'DART Employee';
  const hasInjuryDetails = data.operator_passenger_event_type && [
    'Slip, Trips, Fall', 'Sprains and Strains', 'Fractures', 'Cuts and Lacerations',
    'Bruises (Contusions)', 'Burns', 'Crush Injury', 'Puncture Wounds',
    'Medical Emergency (e.g., fainting, seizure, heart attack)', 'Sickness/Occupational Illness',
  ].includes(data.operator_passenger_event_type);

  return (
    <StepContainer
      stepNumber={3}
      title="People And Impact"
      description="Review the people and injury information recorded for this event."
    >
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
        <Info className="h-4 w-4 flex-shrink-0 text-slate-500" />
        <p className="text-xs leading-5 text-slate-700 font-['Poppins']">
          Injury and transport details for this event are captured in <strong>What Happened</strong>.
        </p>
      </div>

      <div className="dart-card dart-card--surface overflow-hidden">
        <section className="px-6 py-6 md:px-7 md:py-7">
          <div className="mb-6">
            <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Event impact summary</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 font-['Poppins']">These values come from the completed event details.</p>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="dart-field-label">Event relates to</dt>
              <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_event_relating_to)}</dd>
            </div>
            <div>
              <dt className="dart-field-label">Type of event</dt>
              <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_event_type)}</dd>
            </div>
            {hasInjuryDetails && isEmployee && (
              <>
                <div>
                  <dt className="dart-field-label">DART employee injured</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_employee_injured)}</dd>
                </div>
                {data.operator_passenger_employee_injured === true && (
                  <>
                    <div>
                      <dt className="dart-field-label">Transported to hospital</dt>
                      <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_employee_transported)}</dd>
                    </div>
                    <div>
                      <dt className="dart-field-label">Body part</dt>
                      <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_employee_body_part)}</dd>
                    </div>
                  </>
                )}
              </>
            )}
            {hasInjuryDetails && !isEmployee && (
              <>
                <div>
                  <dt className="dart-field-label">Injured non-transit employees</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-['Poppins'] dart-tabular">{value(data.operator_passenger_injured_non_transit_employees)}</dd>
                </div>
                <div>
                  <dt className="dart-field-label">Non-transit employees transported</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-['Poppins'] dart-tabular">{value(data.operator_passenger_non_transit_employees_transported)}</dd>
                </div>
              </>
            )}
            {data.operator_passenger_event_type === 'Passenger Self-Evacuation' && (
              <>
                <div>
                  <dt className="dart-field-label">Evacuation location</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_evacuation_location)}</dd>
                </div>
                <div>
                  <dt className="dart-field-label">Reason for evacuation</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_evacuation_reason)}</dd>
                </div>
              </>
            )}
            {data.operator_passenger_event_type === 'Transit Equipment Defect' && (
              <>
                <div>
                  <dt className="dart-field-label">Replacement vehicle used</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_defective_vehicle_exchanged)}</dd>
                </div>
                {data.operator_passenger_defective_vehicle_exchanged === true && (
                  <div>
                    <dt className="dart-field-label">Replacement vehicle number</dt>
                    <dd className="mt-1 text-sm text-slate-900 font-['Poppins']">{value(data.operator_passenger_replacement_vehicle_number)}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-y-3 border-t border-slate-200 pt-6">
        <button type="button" onClick={onBack} className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]">← Back</button>
        <div className="flex items-center gap-4">
          <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
          <GlassButton variant="primary" onClick={onNext}>Next</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}
