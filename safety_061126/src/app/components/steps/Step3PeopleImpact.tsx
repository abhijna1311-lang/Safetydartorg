import { useState } from 'react';
import { Info } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { CustomSelect } from '../CustomSelect';
import { YesNoToggle } from '../form/YesNoToggle';
import { PassengerInjurySection } from './sections/PassengerInjurySection';
import { PedestrianInjurySection } from './sections/PedestrianInjurySection';
import { OtherVehicleSection } from './sections/OtherVehicleSection';
import { PoliceSection } from './sections/PoliceSection';
import { OperatorReportDrawer } from './sections/OperatorReportDrawer';
import type { AccidentReportData } from '../../types/accident-report';
import type { UserRole } from '../../context/UserRoleContext';
import type { WorkflowSectionKey, WorkflowSections } from '../../types/workflow-report';

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
}

const BODY_PARTS = ['Head', 'Upper body', 'Lower body'].map(v => ({ value: v, label: v }));
const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

function Card({ title, complete, children }: { title: string; complete?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "dart-input-base";

export function Step3PeopleImpact({
  data,
  onUpdate,
  onNext,
  onBack,
  onSaveDraft,
  workflowStage = 'operator-completion',
  initiatedBy = 'Operator',
  activeSectionKey = 'operator',
  sectionStatuses,
}: Props) {
  // Determine collision type (Bus vs LRV path)
  const collisionType = data.collision_type || data.lrv_collision_type || '';
  const showPedestrian = collisionType === 'Collision – with Pedestrian';
  const showOtherVehicle = collisionType === 'Collision – with Auto';
  const isInitiationStage = workflowStage === 'initiation';
  const isSupervisorReview = activeSectionKey === 'supervisor';
  const canOpenOperatorReport = isSupervisorReview && !isInitiationStage;
  const [isOperatorReportOpen, setIsOperatorReportOpen] = useState(false);

  const canProceed = isInitiationStage || isSupervisorReview ? true : data.operator_injured !== undefined;

  const contextTone = isSupervisorReview
    ? {
        container: 'border-[#0078AE]/30 bg-[#0078AE]/10',
        icon: 'text-[#0078AE]',
        text: 'text-[#00205B]',
      }
    : isInitiationStage
    ? {
        container: 'border-slate-300 bg-slate-50',
        icon: 'text-slate-500',
        text: 'text-slate-700',
      }
    : {
        container: 'border-slate-200 bg-slate-50',
        icon: 'text-slate-500',
        text: 'text-slate-700',
      };

  return (
    <StepContainer
      stepNumber={3}
      title="People and Impact"
      description="Record injuries, passengers, pedestrians, and other vehicles involved."
    >
      {/* Context */}
      <div className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-2.5 ${contextTone.container}`}>
        <Info className={`h-4 w-4 flex-shrink-0 ${contextTone.icon}`} />
        <p className={`text-xs leading-5 font-['Poppins'] ${contextTone.text}`}>
          {isInitiationStage ? (
            <>This case was initiated by a <strong>{initiatedBy}</strong>. People and injury details are completed by the operator after handoff.</>
          ) : isSupervisorReview ? (
            <>Operator people and impact entries are read-only during supervisor review. Refer to the operator report while completing your section.</>
          ) : (
            <>Event: <strong>{data.event_type}</strong> · Mode: <strong>{data.mode}</strong>
            {collisionType && <> · Collision type: <strong>{collisionType}</strong></>}</>
          )}
        </p>
      </div>

      {canOpenOperatorReport && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOperatorReportOpen(true)}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
          >
            Open operator report (read-only)
          </button>
        </div>
      )}

      <div className="space-y-5">
          {isInitiationStage ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 font-['Poppins']">Operator completion happens in the next stage</h3>
            <p className="mt-2 text-sm text-slate-600 font-['Poppins']">
              The starter scenario stops here for people and impact. After handoff, the operator will complete injury, passenger, pedestrian, vehicle, and police details.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Operator injury status', 'Other employee injuries', 'Passenger details', 'Pedestrian details', 'Police and investigation details'].map((item) => (
                <span key={item} className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 font-['Poppins']">
                  {item}
                </span>
              ))}
            </div>
            </div>
          ) : isSupervisorReview ? (
            <>
              <div className="rounded-xl border border-[#0078AE]/30 bg-[#0078AE]/10 px-5 py-4">
                <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">Read-only operator section</p>
                <p className="mt-1 text-xs text-[#0A4F75] font-['Poppins']">Supervisor cannot alter operator people-impact entries in this FIR-style workflow.</p>
              </div>
              <Card title="Operator people and impact summary" complete={data.operator_injured !== undefined}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Operator injured</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.operator_injured === true ? 'Yes' : data.operator_injured === false ? 'No' : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Other employees injured</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.other_employees_injured_count ?? 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Passengers injured</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.passengers_injured ?? 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Pedestrian injuries</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.pedestrian_injuries ?? 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Other vehicle injuries</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.other_vehicle_injuries ?? 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-['Poppins']">Police at scene</p>
                    <p className="mt-1 text-sm text-slate-900 font-['Poppins']">{data.police_at_scene === true ? 'Yes' : data.police_at_scene === false ? 'No' : 'Not provided'}</p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <>

        {/* ── Operator / Employee Injury ── */}
        <Card title="Operator / other employee injury" complete={data.operator_injured !== undefined}>
          <Field label="Was the operator injured?" required>
            <YesNoToggle
              value={data.operator_injured}
              onChange={v => onUpdate({ operator_injured: v, operator_injured_body_part: undefined, operator_transported: undefined })}
            />
          </Field>

          <AnimatePresence>
            {data.operator_injured === true && (
              <motion.div {...fade} key="op-detail" className="space-y-4">
                <Field label="Injured body part">
                  <CustomSelect value={data.operator_injured_body_part || ''} onChange={v => onUpdate({ operator_injured_body_part: v })} options={BODY_PARTS} placeholder="Select body part" />
                </Field>
                <Field label="Was the employee transported to the hospital?">
                  <YesNoToggle value={data.operator_transported} onChange={v => onUpdate({ operator_transported: v })} />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          <Field label="Number of other employees injured (excluding the operator)">
            <input
              type="number" min={0}
              value={data.other_employees_injured_count ?? ''}
              onChange={e => onUpdate({ other_employees_injured_count: parseInt(e.target.value) || 0 })}
              placeholder="0" className={inputCls}
            />
          </Field>
        </Card>

        {/* ── Passenger Injury ── */}
        <PassengerInjurySection data={data} onUpdate={onUpdate} />

        {/* ── Pedestrian Injury (conditional) ── */}
        <AnimatePresence>
          {showPedestrian && (
            <motion.div {...fade} key="ped-section">
              <PedestrianInjurySection data={data} onUpdate={onUpdate} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Other Vehicle (conditional) ── */}
        <AnimatePresence>
          {showOtherVehicle && (
            <motion.div {...fade} key="other-v">
              <OtherVehicleSection data={data} onUpdate={onUpdate} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Police ── */}
        <PoliceSection data={data} onUpdate={onUpdate} />

            </>
          )}

      </div>

      <OperatorReportDrawer
        open={canOpenOperatorReport && isOperatorReportOpen}
        onClose={() => setIsOperatorReportOpen(false)}
        data={data}
        operatorStatus={sectionStatuses?.operator.status}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={onBack}
          className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
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
