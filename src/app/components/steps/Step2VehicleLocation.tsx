import { useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { StepContainer } from '../StepContainer';
import { GlassButton } from '../GlassButton';
import { BusCollisionSection, BUS_ROUTE_STATUSES, BUS_STATUS_OPTIONS } from './sections/BusCollisionSection';
import { LRVCollisionSection } from './sections/LRVCollisionSection';
import { NRVCollisionSection } from './sections/NRVCollisionSection';
import { DerailmentSection } from './sections/DerailmentSection';
import { SignalViolationSection } from './sections/SignalViolationSection';
import { AssaultSection } from './sections/AssaultSection';
import { BasicIncidentSection } from './sections/BasicIncidentSection';
import { FireSection } from './sections/FireSection';
import { NearMissSection } from './sections/NearMissSection';
import { TrailSwitchSection } from './sections/TrailSwitchSection';
import { OperatorPassengerEventSection, operatorPassengerEventComplete } from './sections/OperatorPassengerEventSection';
import { OperatorReportDrawer } from './sections/OperatorReportDrawer';
import { RAIL_LINE_STATUSES } from './sections/RailVehicleFields';
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
  // the leader-started intake phase (which stays lean). Events that ask whether the user
  // was operating a DART vehicle show Schedule only after a Yes answer.
  const asksOperatingQuestion = ['Assault (Verbal or Physical)', 'Fire', 'Operator/Passenger Events (non-collision)'].includes(data.event_type || '');
  const showSchedule = activeSectionKey === 'operator' && !isInitiationStage
    && (!asksOperatingQuestion || data.operating_dart_vehicle === true);
  const [isOperatorReportOpen, setIsOperatorReportOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Check which event-specific form to render
  const isCollision = data.event_type === 'Collision';
  const isDerailment = data.event_type === 'Derailment';
  const isSignalViolation = data.event_type === 'Signal Violation';
  const hideRailStatusFields = data.mode === 'Non-Revenue Vehicle' || data.mode === 'Hi-Rail';
  const isHiRail = data.mode === 'Hi-Rail';
  const isAssault = data.event_type === 'Assault (Verbal or Physical)';
  const isFire = data.event_type === 'Fire';
  const isNearMiss = data.event_type === 'Near Miss';
  const isTrailSwitch = data.event_type === 'Trail a Switch';
  const isOperatorPassengerEvent = data.event_type === 'Operator/Passenger Events (non-collision)';

  // Dynamic title and description based on event type
  const stepTitle = isCollision ? 'Collision information' : `${data.event_type || 'Event'} details`;
  const stepDescription = isCollision
    ? `Vehicle and collision details for the ${data.mode || 'selected mode'}.`
    : `Vehicle and event details for the ${data.mode || 'selected mode'}.`;
  const narrativeRequirementMet = isOperatorNarrativeLocked ? true : Boolean(data.description_of_event);
  const answered = (value: unknown) => value !== undefined && value !== null && value !== '';
  // LRV consist: count 1 = the top LRV field alone; counts 2–4 also require each additional LRV #.
  const lrvConsistComplete = (() => {
    const n = data.lrv_consist_count ?? 0;
    if (n <= 0) return false;
    if (n === 1) return true;
    const additional = [data.lrv_consist_2, data.lrv_consist_3, data.lrv_consist_4];
    return additional.slice(0, n - 1).every(Boolean);
  })();
  const railVehicleComplete = data.mode === 'Hi-Rail'
    ? !!data.vehicle_number
    : data.mode === 'Streetcar' ? !!data.car_number : lrvConsistComplete;
  const railVehicleNumber = data.mode === 'Hi-Rail' ? data.vehicle_number : data.train_number;
  const railStatusBefore = data.mode === 'Hi-Rail' ? data.vehicle_status_before : data.train_status_before;
  const railStatusAfter = data.mode === 'Hi-Rail' ? data.vehicle_status_after : data.train_status_after;
  const lrvDetailsComplete = data.mode !== 'Light Rail Vehicle'
    || (!!data.block_number && (!RAIL_LINE_STATUSES.has(data.train_status_before || '') || !!data.rail_line));
  const requiredWeatherComplete = !!(
    data.weather && data.road_conditions && data.lighting_conditions
    && data.traffic_conditions && data.traffic_controls && data.roadway_configuration
  );
  const busCollisionComplete = !!(
    data.vehicle_number && data.trip_id && data.block_number
    && (!BUS_ROUTE_STATUSES.has(data.bus_status_before || '') || data.route_number)
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
    railVehicleNumber && railVehicleComplete
    && lrvDetailsComplete
    && (hideRailStatusFields || (railStatusBefore && railStatusAfter))
    && data.lrv_collision_type && data.train_action && data.lrv_point_of_impact && answered(data.train_speed)
    && data.location_category && (data.street_on || data.address_of_event) && data.cross_street && data.city && data.zip
    && (data.location_category !== 'Rail Station' || data.station_applicable)
    && (!['Grade Crossing', 'Bridge'].includes(data.location_category || '') || (data.station_applicable && data.grade_crossing_applicable))
    && (data.location_category !== 'Tunnel' || data.tunnel_location)
    && answered(data.lrv_evacuation) && answered(data.runaway_train)
    && (data.runaway_train !== true || data.operator_in_train_runaway)
    && answered(data.collision_resulted_in_derailment) && answered(data.train_damage)
    && (data.train_damage !== true || (data.impact_markers?.length || 0) > 0)
    && requiredWeatherComplete
  );
  const nrvCollisionComplete = !!(
    data.vehicle_number
    && (hideRailStatusFields || (data.vehicle_status_before && data.vehicle_status_after))
    && data.collision_type && data.bus_action && data.point_of_impact && answered(data.bus_speed)
    && data.street_on && data.cross_street && data.city && data.zip && answered(data.runaway_vehicle)
    && (data.runaway_vehicle !== true || data.operator_in_vehicle_runaway)
    && answered(data.bus_damage)
    && (data.bus_damage !== true || (answered(data.bus_damage_confirmed) && (data.impact_markers?.length || 0) > 0))
    && requiredWeatherComplete
  );
  const derailmentComplete = !!(
    data.train_number && data.derailment_type && data.location_category
    && (data.street_on || data.address_of_event) && data.cross_street && data.city && data.zip
    && (data.location_category !== 'Revenue Facility: Transit Station' || data.station_applicable)
    && (data.location_category !== 'Right-of-Way: Grade Crossing' || data.grade_crossing_applicable)
    && (hideRailStatusFields || (data.train_status_before && data.train_status_after))
    && (data.mode !== 'Light Rail Vehicle' || lrvConsistComplete)
    && lrvDetailsComplete
    && data.train_action && answered(data.train_speed)
    && answered(data.train_damage) && answered(data.runaway_train)
    && (data.runaway_train !== true || data.operator_in_train_runaway)
    && answered(data.lrv_evacuation) && requiredWeatherComplete
  );
  const signalViolationComplete = !!(
    data.train_number
    && lrvDetailsComplete
    && (data.mode !== 'Light Rail Vehicle' || lrvConsistComplete)
    && data.signal_date && data.signal_number
    && data.signal_displaying_properly && data.signal_territory
    && (hideRailStatusFields || (data.train_status_before && data.train_status_after))
    && (data.street_on || data.address_of_event) && data.cross_street && data.city && data.zip
    && requiredWeatherComplete
  );

  // Assault (Step 2): event details, vehicle, location, weather. Employee injury and the
  // perpetrator groups live in Step 3 (People & Impact), so they are NOT gated here.
  const assaultComplete = (() => {
    if (!isAssault) return true;
    const inPossession = data.operating_dart_vehicle === true;
    const base = !!(
      data.assault_location && data.street_on && data.cross_street && data.city && data.zip
      && data.assault_description?.trim()
      && data.weather && data.road_conditions && data.lighting_conditions && data.streetlights
    );
    if (!base) return false;
    if (inPossession) {
      if (!((hideRailStatusFields || (data.vehicle_status_before && data.vehicle_status_after)) && answered(data.driver_window_assault))) return false;
      if (data.mode === 'Bus' && !data.vehicle_number) return false;
      if (isLRV && data.mode !== 'Hi-Rail' && !data.train_number) return false;
      if (isLRV && !lrvDetailsComplete) return false;
      if (data.mode === 'Hi-Rail' && !data.vehicle_number) return false;
      if (isNRV && !data.vehicle_number) return false;
      if (['Bus', 'Light Rail Vehicle', 'Streetcar'].includes(data.mode || '')) {
        if (data.assault_in_operator_driving_area === undefined) return false;
        if (data.assault_in_operator_driving_area === true && !data.operator_driving_area_security) return false;
      }
      if (data.mode === 'Streetcar' && data.line_description !== 'Streetcar') return false;
      if (data.mode === 'Light Rail Vehicle' && !lrvConsistComplete) return false;
    }
    if (data.operating_dart_vehicle === false && data.assault_location === 'in_transit_vehicle' && !data.transit_vehicle_on) return false;
    return true;
  })();
  const fireComplete = (() => {
    if (!isFire) return true;
    const base = !!(
      data.description_of_event?.trim()
      && (data.fire_location !== 'Bus Stop/Train Station/Revenue Transit Center' || data.fire_station_transit_center)
      && (data.street_on || data.fire_address)
      && data.cross_street
      && data.city
      && data.zip
      && data.fire_type
      && data.fire_location
      && data.fire_started_how
      && data.fire_suppressed !== undefined
      && data.evacuation_life_safety !== undefined
      && data.weather && data.road_conditions && data.lighting_conditions
    );
    if (!base) return false;
    if (data.operating_dart_vehicle === true) {
      if (data.mode === 'Hi-Rail' || data.mode === 'Non-Revenue Vehicle') {
        if (!data.vehicle_number) return false;
      } else if (!(data.mode === 'Bus'
        ? data.vehicle_number && data.bus_status_before && data.bus_status_after
        : hideRailStatusFields
          ? data.train_number
          : data.train_number && data.train_status_before && data.train_status_after
            && (data.mode !== 'Light Rail Vehicle' || lrvDetailsComplete))) {
        return false;
      }
      if (data.mode === 'Light Rail Vehicle' && !lrvDetailsComplete) return false;
      if (data.mode === 'Bus' && BUS_ROUTE_STATUSES.has(data.bus_status_before || '')) {
        if (data.mode === 'Bus' && (!data.route_number || !data.block_number)) return false;
      }
    }
    if (data.fire_started_how === 'Arson' && !data.fire_responsible_for_starting) return false;
    if (data.fire_suppressed === true && !data.fire_responsible_for_suppressing) return false;
    if (data.operating_dart_vehicle === false && data.fire_location === 'In or on Transit Vehicle') {
      if (!data.fire_transit_vehicle_on || !data.fire_transit_vehicle_number) return false;
      if (['Bus', 'Light Rail Vehicle', 'Streetcar'].includes(data.fire_transit_vehicle_on) && !data.fire_transit_route_or_line) return false;
    }
    if (['Light Rail Vehicle', 'Streetcar', 'Hi-Rail'].includes(data.mode || '') && data.evacuation_life_safety === true && data.fire_evacuation_rail_right_of_way === undefined) return false;
    return true;
  })();
  const nearMissComplete = (() => {
    if (!isNearMiss) return true;
    const experienced = data.near_miss_reason === 'Near-Miss Experienced';
    const base = !!(
      data.near_miss_description?.trim()
      && data.incident_date
      && data.incident_time
      && data.near_miss_street_on?.trim()
      && data.near_miss_cross_street?.trim()
      && data.near_miss_city?.trim()
      && data.near_miss_zip?.trim()
      && data.near_miss_location_category
      && data.near_miss_reason
      && data.near_miss_category
      && data.near_miss_vehicle_action
      && data.near_miss_fleet_type
      && data.near_miss_weather
      && data.near_miss_road_conditions
      && data.near_miss_lighting_conditions
      && data.near_miss_traffic_conditions
      && data.near_miss_traffic_controls
      && data.near_miss_roadway_configuration
    );
    if (['Bus', 'Light Rail Vehicle', 'Streetcar'].includes(data.mode || '')
      && (!(data.mode === 'Bus' ? data.bus_status_before : data.train_status_before)
        || !(data.mode === 'Bus' ? data.bus_status_after : data.train_status_after))) return false;
    if (!base || !experienced) return base;
    if (!data.near_miss_vehicle_number || !data.near_miss_speed) return false;
    if (['Non-Revenue Vehicle', 'Hi-Rail'].includes(data.mode || '')) return true;
    if (data.mode === 'Light Rail Vehicle') return !!data.near_miss_block && (!RAIL_LINE_STATUSES.has(data.train_status_before || '') || !!data.near_miss_rail_line);
    if (data.mode === 'Streetcar') return !!data.near_miss_rail_line;
    return (!BUS_ROUTE_STATUSES.has(data.bus_status_before || '') || !!data.near_miss_route) && !!data.near_miss_run && !!data.near_miss_block;
  })();
  const trailSwitchComplete = (() => {
    if (!isTrailSwitch) return true;
    const hasVehicle = isHiRail ? !!data.vehicle_number : !!data.train_number;
    const consistComplete = data.mode !== 'Light Rail Vehicle' || lrvConsistComplete;
    const statusesComplete = isHiRail || !!(data.train_status_before && data.train_status_after);
    const lineComplete = !isLRV || (lrvDetailsComplete && (!RAIL_LINE_STATUSES.has(data.train_status_before || '') || !!data.trail_line_description));
    return !!(
      hasVehicle
      && consistComplete
      && statusesComplete
      && lineComplete
      && data.trail_description?.trim()
      && data.incident_date
      && data.incident_time
      && data.trail_employee_pullout_date
      && data.trail_employee_pullout_time
      && data.street_on?.trim()
      && data.cross_street?.trim()
      && data.city?.trim()
      && data.zip?.trim()
      && data.trail_location_category
      && data.trail_switch_configuration
      && data.trail_switch_number_known !== undefined
      && (data.trail_switch_number_known !== true || data.trail_switch_number?.trim())
      && (!isLRV && !isHiRail ? data.trail_car_number || data.car_number : true)
      && data.trail_train_speed?.trim()
      && data.trail_train_damage !== undefined
      && data.trail_train_action
      && requiredWeatherComplete
    );
  })();

  // Minimum required to proceed
  const hasSchedule = !showSchedule || hasScheduleAnswers(data);
  const nonRailPulloutComplete = (!isNRV && !isHiRail)
    || (!!data.employee_pullout_date && !!data.employee_pullout_time);
  const canProceedWithoutPullout = isInitiationStage
    ? !!(
        data.incident_date &&
        data.incident_time &&
        (isBus
          ? data.vehicle_number && data.street_on && data.cross_street && data.city && data.zip && data.block_number
            && data.bus_status_before && data.bus_status_after
          : isNRV || data.mode === 'Hi-Rail'
            ? data.vehicle_number && data.street_on
            : data.train_number && (data.address_of_event || data.station_applicable || data.grade_crossing_applicable))
      )
    : isAssault
      ? !!(hasSchedule && data.incident_date && data.incident_time && assaultComplete)
      : isFire
        ? !!(hasSchedule && data.incident_date && data.incident_time && fireComplete)
      : isNearMiss
        ? !!(hasSchedule && nearMissComplete)
      : isTrailSwitch
        ? !!(hasSchedule && trailSwitchComplete)
      : isOperatorPassengerEvent
        ? !!(hasSchedule && operatorPassengerEventComplete(data))
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
                  : isBus || isNRV ? data.street_on : data.train_number));
  const canProceed = nonRailPulloutComplete && canProceedWithoutPullout;

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
                    <IntakeField label="Status before event" required>
                      <CustomSelect value={data.bus_status_before || ''} onChange={(value) => onUpdate({ bus_status_before: value })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
                    </IntakeField>
                    <IntakeField label="Status after event" required>
                      <CustomSelect value={data.bus_status_after || ''} onChange={(value) => onUpdate({ bus_status_after: value })} options={BUS_STATUS_OPTIONS} placeholder="Select status" />
                    </IntakeField>
                    <IntakeField label="Vehicle number" required>
                      <input type="text" value={data.vehicle_number || ''} onChange={(e) => onUpdate({ vehicle_number: e.target.value })} placeholder="Enter vehicle number" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="Block" required>
                      <input type="text" value={data.block_number || ''} onChange={(e) => onUpdate({ block_number: e.target.value })} placeholder="Enter block number" className={inputCls} />
                    </IntakeField>
                    {BUS_ROUTE_STATUSES.has(data.bus_status_before || '') && <IntakeField label="Route">
                      <input type="text" value={data.route_number || ''} onChange={(e) => onUpdate({ route_number: e.target.value })} placeholder="Enter route" className={inputCls} />
                    </IntakeField>}
                    <IntakeField label="Street On" required>
                      <input type="text" value={data.street_on || ''} onChange={(e) => onUpdate({ street_on: e.target.value })} placeholder="e.g. Main St" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="Cross Street" required>
                      <input type="text" value={data.cross_street || ''} onChange={(e) => onUpdate({ cross_street: e.target.value })} placeholder="e.g. Elm Ave" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="City" required>
                      <input type="text" value={data.city || ''} onChange={(e) => onUpdate({ city: e.target.value })} placeholder="e.g. Dallas" className={inputCls} />
                    </IntakeField>
                    <IntakeField label="ZIP Code" required>
                      <input type="text" inputMode="numeric" maxLength={5} value={data.zip || ''} onChange={(e) => onUpdate({ zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="e.g. 75201" className={inputCls} />
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
                    <IntakeField label="LRV number" required>
                      <input type="text" value={data.train_number || ''} onChange={(e) => onUpdate({ train_number: e.target.value })} placeholder="Enter LRV number" className={inputCls} />
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
                if (isAssault) {
                  return <AssaultSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                }
                if (isFire) {
                  return <FireSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                }
                if (isNearMiss) {
                  return <NearMissSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                }
                if (isTrailSwitch) {
                  return <TrailSwitchSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                }
                if (isOperatorPassengerEvent) {
                  return <OperatorPassengerEventSection data={data} onUpdate={onUpdate} narrativeReadOnly={isOperatorNarrativeLocked} showErrors={showErrors} headerSection={schedule} />;
                }
                // Other non-collision / non-derailment / non-assault events use the generic incident form.
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
