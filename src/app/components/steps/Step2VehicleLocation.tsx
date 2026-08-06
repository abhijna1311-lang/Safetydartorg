import { useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { BusCollisionSection } from './sections/BusCollisionSection';
import { LRVCollisionSection } from './sections/LRVCollisionSection';
import { NRVCollisionSection } from './sections/NRVCollisionSection';
import { DerailmentSection } from './sections/DerailmentSection';
import { SignalViolationSection } from './sections/SignalViolationSection';
import { BasicIncidentSection } from './sections/BasicIncidentSection';
import { OperatorReportDrawer } from './sections/OperatorReportDrawer';
import { ScheduleSection, hasScheduleAnswers } from './sections/ScheduleSection';
import { DatePickerInput } from '../DatePickerInput';
import { TimePickerInput } from '../TimePickerInput';
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
  isOperatorNarrativeLocked?: boolean;
}

// Modes that follow the LRV form path
const LRV_MODES = ['Light Rail Vehicle', 'Streetcar', 'Hi-Rail'];
const inputCls = 'dart-input-base';

function IntakeCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dart-card dart-card--surface">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#0078AE]" />
        <h3 className="text-sm font-semibold text-slate-800 font-['Poppins']">{title}</h3>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function IntakeField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="dart-field-label">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export function Step2VehicleLocation({
  data,
  onUpdate,
  onNext,
  onBack,
  onSaveDraft,
  workflowStage = 'operator-completion',
  initiatedBy,
  activeSectionKey = 'operator',
  sectionStatuses,
  isOperatorNarrativeLocked = false,
}: Props) {
  const isLRV = LRV_MODES.includes(data.mode || '');
  const isNRV = data.mode === 'Non-Revenue Vehicle';
  const isBus = !isLRV && !isNRV;
  const isStreetcar = data.mode === 'Streetcar';
  const isInitiationStage = workflowStage === 'initiation';
  const isSupervisorReview = activeSectionKey === 'supervisor';
  const canOpenOperatorReport = isSupervisorReview && !isInitiationStage;
  // Schedule was moved here from Step 1. Only the operator answers it, and only outside
  // the leader-started intake phase (which stays lean).
  const showSchedule = activeSectionKey === 'operator' && !isInitiationStage;
  const [isOperatorReportOpen, setIsOperatorReportOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Check if this is a collision event
  const isCollision = data.event_type === 'Collision';
  const isDerailment = data.event_type === 'Derailment';
  const isSignalViolation = data.event_type === 'Signal Violation';

  // Dynamic title and description based on event type
  const stepTitle = isCollision ? 'Collision information' : `${data.event_type || 'Event'} details`;
  const stepDescription = isCollision
    ? `Vehicle and collision details for the ${data.mode || 'selected mode'}.`
    : `Vehicle and event details for the ${data.mode || 'selected mode'}.`;
  const narrativeRequirementMet = isOperatorNarrativeLocked ? true : Boolean(data.description_of_event);
  const answered = (value: unknown) => value !== undefined && value !== null && value !== '';
  const requiredWeatherComplete = !!(
    data.weather && data.road_conditions && data.lighting_conditions
    && data.traffic_conditions && data.traffic_controls && data.roadway_configuration
  );
  const busCollisionComplete = !!(
    data.vehicle_number && data.trip_id && data.block_number
    && data.bus_status_before && data.bus_status_after
    && data.collision_type && data.bus_action && data.point_of_impact && answered(data.bus_speed)
    && data.street_on && data.cross_street && data.city && data.zip
    && answered(data.event_at_bus_stop)
    && (data.event_at_bus_stop !== true || data.bus_stop_name)
    && answered(data.has_bike_lane)
    && answered(data.evacuation_life_safety)
    && answered(data.runaway_vehicle)
    && (data.runaway_vehicle !== true || (data.operator_in_vehicle_runaway && answered(data.parking_brake_engaged)))
    && answered(data.bus_damage)
    && (data.bus_damage !== true || (data.impact_markers?.length || 0) > 0)
    && requiredWeatherComplete
  );
  const railCollisionComplete = !!(
    data.train_number && data.car_number
    && data.train_status_before && data.train_status_after
    && data.lrv_collision_type && data.train_action && data.lrv_point_of_impact && answered(data.train_speed)
    && data.location_category && data.address_of_event && data.city && data.zip
    && (data.location_category !== 'Rail Station' || data.station_applicable)
    && (!['Grade Crossing', 'Bridge'].includes(data.location_category || '') || (data.station_applicable && data.grade_crossing_applicable))
    && (data.location_category !== 'Tunnel' || data.tunnel_location)
    && answered(data.lrv_evacuation) && answered(data.runaway_train)
    && (data.runaway_train !== true || data.operator_in_train_runaway)
    && answered(data.collision_resulted_in_derailment) && answered(data.train_damage)
    && (data.train_damage !== true || (answered(data.disabling_damage) && (data.impact_markers?.length || 0) > 0))
    && requiredWeatherComplete
  );
  const nrvCollisionComplete = !!(
    data.vehicle_number && data.collision_type && data.bus_action && data.point_of_impact && answered(data.bus_speed)
    && data.street_on && data.city && data.zip && answered(data.runaway_vehicle)
    && (data.runaway_vehicle !== true || data.operator_in_vehicle_runaway)
    && answered(data.bus_damage)
    && (data.bus_damage !== true || (answered(data.bus_damage_confirmed) && (data.impact_markers?.length || 0) > 0))
    && requiredWeatherComplete
  );
  const derailmentComplete = !!(
    data.train_number && data.derailment_type && data.location_category
    && (data.location_category !== 'Revenue Facility: Transit Station' || data.station_applicable)
    && (data.location_category !== 'Right-of-Way: Grade Crossing' || data.grade_crossing_applicable)
    && data.train_status_before && data.train_status_after
    && (data.mode !== 'Light Rail Vehicle' || data.car_number)
    && (!['In Service', 'Pull-In', 'Pull-Out'].includes(data.train_status_before || '') || data.mode !== 'Light Rail Vehicle' || data.rail_line)
    && data.train_action && answered(data.train_speed)
    && answered(data.train_damage) && answered(data.runaway_train)
    && (data.runaway_train !== true || data.operator_in_train_runaway)
    && answered(data.lrv_evacuation) && requiredWeatherComplete
  );
  const signalViolationComplete = !!(
    data.train_number
    && (data.mode !== 'Light Rail Vehicle' || data.car_number)
    && data.signal_date && data.signal_number
    && data.signal_displaying_properly && data.signal_territory
    && data.train_status_before && data.train_status_after
    && data.address_of_event
    && requiredWeatherComplete
  );

  // Minimum required to proceed
  const hasSchedule = !showSchedule || hasScheduleAnswers(data);
  const canProceed = isInitiationStage
    ? !!(
        data.incident_date &&
        data.incident_time &&
        (isBus
          ? data.vehicle_number && data.street_on && data.cross_street && data.city && data.zip && data.route_number && data.block_number
          : isNRV
            ? data.vehicle_number && data.street_on
            : data.train_number && (data.address_of_event || data.station_applicable || data.grade_crossing_applicable))
      )
    : !!(
        hasSchedule &&
        narrativeRequirementMet &&
        data.incident_date &&
        data.incident_time &&
        (isDerailment
          ? derailmentComplete
          : isSignalViolation
            ? signalViolationComplete
            : isCollision && isBus
              ? busCollisionComplete
              : isCollision && isNRV
                ? nrvCollisionComplete
                : isCollision && isLRV
                  ? railCollisionComplete
                  : isBus || isNRV ? data.street_on : data.train_number)
      );

  const handleNextClick = () => {
    if (canProceed) {
      setShowErrors(false);
      onNext();
    } else {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
      stepNumber={2}
      title={stepTitle}
      description={stepDescription}
    >
      {showErrors && !canProceed && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-800 font-['Poppins']">Please complete the required fields highlighted below to continue.</p>
        </div>
      )}
      {/* Context banner */}
      <div className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-2.5 ${contextTone.container}`}>
        <Info className={`h-4 w-4 flex-shrink-0 ${contextTone.icon}`} />
        <p className={`text-xs leading-5 font-['Poppins'] ${contextTone.text}`}>
          {isInitiationStage
            ? <>Showing the <strong>intake-only</strong> field set for a {initiatedBy === 'Program Manager' ? 'program manager' : 'supervisor'}-started case.</>
            : isSupervisorReview
            ? <>Complete supervisor fields and refer to the operator report when needed. The operator description is <strong>read-only</strong>.</>
            : <>Showing <strong>{data.mode}</strong> {isCollision ? 'collision' : 'incident'} form for a <strong>{data.event_type}</strong> event.</>}
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
            <>
            <IntakeCard title="Starter intake required before handoff">
              <p className="text-sm text-slate-600 font-['Poppins']">
                Leader-started cases only capture the minimum intake needed to open the case. The operator completes the narrative, injury, and impact details in their section.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IntakeField label="Event date" required>
                  <DatePickerInput value={data.incident_date || ''} onChange={(value) => onUpdate({ incident_date: value })} maxDate={new Date()} />
                </IntakeField>
                <IntakeField label="Event time" required>
                  <TimePickerInput value={data.incident_time || ''} onChange={(value) => onUpdate({ incident_time: value })} />
                </IntakeField>
                {isBus ? (
                  <>
                    <IntakeField label="Vehicle number" required>
                      <input type="text" value={data.vehicle_number || ''} onChange={(e) => onUpdate({ vehicle_number: e.target.value })} placeholder="Enter vehicle number" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="Route" required>
                      <input type="text" value={data.route_number || ''} onChange={(e) => onUpdate({ route_number: e.target.value })} placeholder="Enter route" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="Block" required>
                      <input type="text" value={data.block_number || ''} onChange={(e) => onUpdate({ block_number: e.target.value })} placeholder="Enter block number" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="Street on" required>
                      <input type="text" value={data.street_on || ''} onChange={(e) => onUpdate({ street_on: e.target.value })} placeholder="Enter street" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="Cross street" required>
                      <input type="text" value={data.cross_street || ''} onChange={(e) => onUpdate({ cross_street: e.target.value })} placeholder="Enter cross street" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="City" required>
                      <input type="text" value={data.city || ''} onChange={(e) => onUpdate({ city: e.target.value })} placeholder="Enter city" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="ZIP code" required>
                      <input type="text" value={data.zip || ''} onChange={(e) => onUpdate({ zip: e.target.value })} placeholder="Enter ZIP code" className={inputCls} />
                    </IntakeField>
                  </>
                ) : isNRV ? (
                  <>
                    <IntakeField label="NRV number" required>
                      <input type="text" value={data.vehicle_number || ''} onChange={(e) => onUpdate({ vehicle_number: e.target.value })} placeholder="Enter NRV number" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="Event location" required>
                      <input type="text" value={data.street_on || ''} onChange={(e) => onUpdate({ street_on: e.target.value })} placeholder="Enter street address" className={inputCls} />
                    </IntakeField>
                  </>
                ) : (
                  <>
                    <IntakeField label="Train number" required>
                      <input type="text" value={data.train_number || ''} onChange={(e) => onUpdate({ train_number: e.target.value })} placeholder="Enter train number" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="Event location" required>
                      <input type="text" value={data.address_of_event || ''} onChange={(e) => onUpdate({ address_of_event: e.target.value })} placeholder="Enter location" className={inputCls} />
                    </IntakeField>
                  </>
                )}
              </div>
            </IntakeCard>
            </>
          ) : (
            <>
              {(() => {
                const schedule = showSchedule ? (
                  <ScheduleSection data={data} onUpdate={onUpdate} showErrors={showErrors} />
                ) : undefined;
                if (isCollision) {
                  if (isBus) return <BusCollisionSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                  if (isNRV) return <NRVCollisionSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                  if (isLRV) return <LRVCollisionSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                }
                if (isDerailment) {
                  return <DerailmentSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                }
                if (isSignalViolation && (isLRV || isStreetcar)) {
                  return <SignalViolationSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                }
                // Non-collision / non-derailment (Assault, Near Miss, Fire, Operator/Passenger Events,
                // Trail a Switch) render under the same unified card as Bus/Rail/NRV via
                // BasicIncidentSection, with Schedule injected as the header section and Weather
                // embedded inside as its own subsection.
                return <BasicIncidentSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
              })()}
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
      <div className="flex flex-wrap items-center justify-between gap-y-3 mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={onBack}
          className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <GlassButton variant="secondary" onClick={onSaveDraft}>Save as draft</GlassButton>
          <GlassButton variant="primary" onClick={handleNextClick}>Next</GlassButton>
        </div>
      </div>
    </StepContainer>
  );
}
