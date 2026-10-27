import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { OperatorReferenceRail } from './steps/sections/OperatorReferenceRail';
import { CaseTimeline } from './CaseTimeline';
import { VehicleImpactDiagram } from './VehicleImpactDiagram';
import { LocationMapPreview } from './location/LocationMapPreview';
import { supervisorLocationLabel } from './location/locationFields';
import type { AccidentReportData } from '../types/accident-report';
import type { WorkflowReport, WorkflowSectionState, WorkflowSectionStatus } from '../types/workflow-report';

export type ReferenceReportTab = 'operator' | 'supervisor' | 'activity';

interface ReferenceReportDrawerProps {
  open: boolean;
  onClose: () => void;
  data: AccidentReportData;
  defaultTab?: ReferenceReportTab;
  operatorStatus?: WorkflowSectionStatus;
  supervisorSection?: WorkflowSectionState;
  activityReport?: WorkflowReport;
}

function yesNo(value: boolean | undefined) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '—';
}

function nonEmpty(value: string | number | undefined | null) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

// Derive the diagram silhouette from whichever vehicle field the reporter recorded.
function getImpactVariant(vehicleType: string | undefined): 'bus' | 'rail' | 'streetcar' | 'nrv' {
  if (vehicleType === 'Light Rail Vehicle') return 'rail';
  if (vehicleType === 'Streetcar') return 'streetcar';
  if (vehicleType === 'Hi-Rail' || vehicleType === 'Non-Revenue Vehicle' || vehicleType === 'NRV') return 'nrv';
  return 'bus';
}

function Field({ label, value, wide }: { label: string; value: string | undefined | null; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="dart-eyebrow">{label}</p>
      <p className={`mt-1 text-sm font-medium leading-relaxed font-['Poppins'] ${value && value !== '—' ? 'text-slate-900' : 'text-slate-400'}`}>{value || '—'}</p>
    </div>
  );
}

type SupervisorStepNumber = 1 | 2 | 3;

interface SupervisorStep {
  step: SupervisorStepNumber;
  title: string;
  description: string;
  render: (data: AccidentReportData) => React.ReactNode;
  hasContent: (data: AccidentReportData) => boolean;
}

// The FS wizard is 3 steps (Incident Basics → Injuries And Police → Review); we mirror
// that here so reviewers see the report in the same shape the FS filled it out in.
const SUPERVISOR_STEPS: SupervisorStep[] = [
  {
    step: 1,
    title: 'Incident basics',
    description: 'Identity, arrival, vehicle, and where the event happened.',
    hasContent: () => true,
    render: (data) => {
      const supervisorName = [data.supervisor_first_name, data.supervisor_last_name].filter(Boolean).join(' ') || data.supervisor_name || '—';
      const supervisorArrival = data.supervisor_arrival_date && data.supervisor_arrival_time
        ? `${data.supervisor_arrival_date} at ${data.supervisor_arrival_time}`
        : data.supervisor_arrival_date || '—';
      return (
        <div className="space-y-4">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">Field Supervisor identity and arrival</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Field Supervisor" value={supervisorName !== '—' ? `${supervisorName}${data.supervisor_badge_number ? ` · ${data.supervisor_badge_number}` : ''}` : '—'} />
              <Field label="Division" value={data.supervisor_division} />
              <Field label="Arrival on scene" value={supervisorArrival} />
              <Field label="Incident recorded" value={(data.supervisor_incident_date || data.incident_date) && (data.supervisor_incident_time || data.incident_time) ? `${data.supervisor_incident_date || data.incident_date} at ${data.supervisor_incident_time || data.incident_time}` : (data.supervisor_incident_date || data.incident_date)} />
              <Field label="DART vehicle type" value={data.supervisor_dart_vehicle_type || data.mode} />
              <Field label="Revenue service" value={yesNo(data.supervisor_revenue_service)} />
              <Field label="Operating route" value={data.supervisor_operating_route_number} />
              <Field label="Block" value={data.supervisor_block_number} />
              <Field label="Rail line" value={data.supervisor_rail_line} />
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">Location as recorded</p>
            <LocationMapPreview lat={data.supervisor_location_lat} lng={data.supervisor_location_lng} label={supervisorLocationLabel(data)} className="mb-4" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Street on" value={data.supervisor_street_on} />
              <Field label="Cross street" value={data.supervisor_cross_street} />
              <Field label="City / ZIP" value={[data.supervisor_city, data.supervisor_zip].filter(Boolean).join(', ')} />
              <Field label="Location category" value={data.supervisor_location_category} />
              <Field label="Station" value={data.supervisor_station_applicable} />
              <Field label="Grade crossing" value={data.supervisor_grade_crossing_applicable} />
              <Field label="Tunnel location" value={data.supervisor_tunnel_location} />
              <Field label="Address of event" value={data.supervisor_address_of_event} wide />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    step: 2,
    title: 'Injuries and police',
    description: 'Damage, tow, derailment, injuries, and police response.',
    hasContent: () => true,
    render: (data) => (
      <div className="space-y-4">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">Damage, tow, and derailment</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="DART vehicle damaged" value={yesNo(data.supervisor_dart_vehicle_damaged)} />
            <Field label="DART vehicles damaged count" value={nonEmpty(data.supervisor_damage_count)} />
            <Field label="Damage requires tow" value={yesNo(data.supervisor_damage_requires_tow)} />
            <Field label="DART vehicles towed" value={nonEmpty(data.supervisor_tow_count)} />
            <Field label="Other vehicles involved" value={yesNo(data.supervisor_other_vehicles_involved)} />
            <Field label="Other vehicles count" value={nonEmpty(data.supervisor_other_vehicle_count)} />
            <Field label="Other vehicles damaged" value={nonEmpty(data.supervisor_other_vehicle_damage_count)} />
            <Field label="Other vehicles towed" value={nonEmpty(data.supervisor_other_vehicle_tow_count)} />
            <Field label="Collision between DART vehicles" value={yesNo(data.supervisor_collision_between_dart_vehicles)} />
            <Field label="Derailment confirmed" value={yesNo(data.supervisor_derailment_confirmed)} />
            <Field label="Scene diagram completed" value={yesNo(data.supervisor_scene_diagram_completed)} />
            <Field label="Scene photos taken" value={yesNo(data.supervisor_scene_photos_taken)} />
          </div>
          {data.supervisor_derailment_details && (
            <div className="mt-3">
              <p className="dart-eyebrow">Derailment details</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800 font-['Poppins']">{data.supervisor_derailment_details}</p>
            </div>
          )}
          {data.supervisor_equipment_damage_description && (
            <div className="mt-3">
              <p className="dart-eyebrow">Equipment / property damage</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800 font-['Poppins']">{data.supervisor_equipment_damage_description}</p>
            </div>
          )}
          {(data.supervisor_impact_markers?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="dart-eyebrow">Damage areas marked</p>
              <div className="mt-2">
                <VehicleImpactDiagram
                  variant={getImpactVariant(data.supervisor_dart_vehicle_type || data.mode)}
                  markers={data.supervisor_impact_markers || []}
                  onChange={() => {}}
                  readOnly
                  title=""
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">Injuries recorded by supervisor</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Employee fatalities" value={data.supervisor_dart_employee_fatalities === true ? nonEmpty(data.supervisor_dart_employee_fatality_count) : yesNo(data.supervisor_dart_employee_fatalities)} />
            <Field label="Employees injured" value={data.supervisor_dart_employee_injuries === true ? nonEmpty(data.supervisor_dart_employee_injury_count) : yesNo(data.supervisor_dart_employee_injuries)} />
            <Field label="Employees transported" value={nonEmpty(data.supervisor_dart_employee_hospital_transport_count)} />
            <Field label="Passenger fatalities" value={data.supervisor_passenger_fatalities === true ? nonEmpty(data.supervisor_passenger_fatality_count) : yesNo(data.supervisor_passenger_fatalities)} />
            <Field label="Passengers injured" value={data.supervisor_passenger_injuries === true ? nonEmpty(data.supervisor_passenger_injury_count) : yesNo(data.supervisor_passenger_injuries)} />
            <Field label="Pedestrian fatalities" value={data.supervisor_pedestrian_fatalities === true ? nonEmpty(data.supervisor_pedestrian_fatality_count) : yesNo(data.supervisor_pedestrian_fatalities)} />
            <Field label="Pedestrians injured" value={data.supervisor_pedestrian_injuries === true ? nonEmpty(data.supervisor_pedestrian_injury_count) : yesNo(data.supervisor_pedestrian_injuries)} />
          </div>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">Police</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Police called" value={yesNo(data.supervisor_police_called)} />
            <Field label="Officer name" value={data.supervisor_police_officer_name} />
            <Field label="Notified by" value={data.supervisor_police_notified_by} />
            <Field label="Report city" value={data.supervisor_report_city} />
            <Field label="Report number" value={data.supervisor_police_report_number} />
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 3,
    title: 'Description',
    description: 'The narrative the Field Supervisor wrote for this event.',
    hasContent: (data) => Boolean(data.supervisor_event_description && data.supervisor_event_description.trim()),
    render: (data) =>
      data.supervisor_event_description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800 font-['Poppins']">
          {data.supervisor_event_description}
        </p>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500 font-['Poppins']">
          The Field Supervisor did not write a description.
        </p>
      ),
  },
];

function SupervisorContent({ data, supervisorSection }: { data: AccidentReportData; supervisorSection?: WorkflowSectionState }) {
  const supervisorName = [data.supervisor_first_name, data.supervisor_last_name].filter(Boolean).join(' ') || data.supervisor_name || '—';

  const submittedLabel = supervisorSection?.status === 'resubmitted'
    ? 'Resubmitted'
    : supervisorSection?.status === 'submitted' || supervisorSection?.status === 'accepted'
      ? 'Submitted'
      : 'In progress';
  const submittedTime = supervisorSection?.submittedAt
    ? new Date(supervisorSection.submittedAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : '—';

  const [activeStep, setActiveStep] = useState<SupervisorStepNumber>(1);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const activeIndex = SUPERVISOR_STEPS.findIndex((s) => s.step === activeStep);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeStepDef = SUPERVISOR_STEPS[safeIndex];
  const canGoBack = safeIndex > 0;
  const canGoForward = safeIndex < SUPERVISOR_STEPS.length - 1;

  const goToStepAtIndex = (nextIndex: number) => {
    const bounded = Math.min(Math.max(nextIndex, 0), SUPERVISOR_STEPS.length - 1);
    if (bounded === safeIndex) {
      return;
    }
    setSlideDirection(bounded > safeIndex ? 1 : -1);
    setActiveStep(SUPERVISOR_STEPS[bounded].step);
  };

  const goToPreviousStep = () => goToStepAtIndex(safeIndex - 1);
  const goToNextStep = () => goToStepAtIndex(safeIndex + 1);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const distance = info.offset.x;
    const velocity = info.velocity.x;
    if ((distance < -70 || velocity < -450) && canGoForward) {
      goToNextStep();
      return;
    }
    if ((distance > 70 || velocity > 450) && canGoBack) {
      goToPreviousStep();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">{submittedLabel} by</p>
        <p className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{supervisorName}</p>
        <p className="mt-0.5 text-xs text-slate-500 font-['Poppins']">{submittedTime}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">
              Step {activeStepDef.step} of {SUPERVISOR_STEPS.length}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[#00205B] font-['Poppins']">
              {activeStepDef.title}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={!canGoBack}
              aria-label="Previous step"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToNextStep}
              disabled={!canGoForward}
              aria-label="Next step"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-hidden">
          <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
            <motion.div
              key={activeStepDef.step}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection > 0 ? 32 : -32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection > 0 ? -32 : 32 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              onDragEnd={handleDragEnd}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4 sm:py-4"
            >
              <div className="border-b border-slate-200 pb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">
                  Step {activeStepDef.step}
                </p>
                <h4 className="mt-0.5 text-base font-semibold text-[#00205B] font-['Poppins']">
                  {activeStepDef.title}
                </h4>
                <p className="mt-1 text-xs text-slate-500 font-['Poppins']">
                  {activeStepDef.description}
                </p>
              </div>

              <div className="mt-3 max-h-[440px] overflow-y-auto pr-1">
                {activeStepDef.render(data)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {SUPERVISOR_STEPS.map((step, index) => (
            <button
              key={step.step}
              type="button"
              onClick={() => goToStepAtIndex(index)}
              aria-label={`Go to Step ${step.step}: ${step.title}`}
              className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#FFCD00] ${
                index === safeIndex ? 'w-8 bg-[#00205B]' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReferenceReportDrawer({
  open,
  onClose,
  data,
  defaultTab = 'operator',
  operatorStatus,
  supervisorSection,
  activityReport,
}: ReferenceReportDrawerProps) {
  const [tab, setTab] = useState<ReferenceReportTab>(defaultTab);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
    }
  }, [defaultTab, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const tabButtonClass = (key: ReferenceReportTab) => (
    `flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins'] ${
      tab === key
        ? 'bg-[#00205B] text-white'
        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
    }`
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Reference reports">
          <motion.button
            type="button"
            aria-label="Close reference reports"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Mobile: bottom sheet */}
          <motion.aside
            className="dart-elev-3 absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#00205B] font-['Poppins']">Reference reports</h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                aria-label="Close reference reports"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex gap-2">
                <button type="button" className={tabButtonClass('operator')} onClick={() => setTab('operator')}>Operator report</button>
                <button type="button" className={tabButtonClass('supervisor')} onClick={() => setTab('supervisor')}>Field Supervisor report</button>
                <button type="button" className={tabButtonClass('activity')} onClick={() => setTab('activity')}>Activity</button>
              </div>
            </div>
            <div className="overflow-y-auto p-3">
              {tab === 'operator' && (
                <OperatorReferenceRail
                  data={data}
                  operatorStatus={operatorStatus}
                  className="!border-0 !bg-transparent !shadow-none"
                  showHeader={false}
                />
              )}
              {tab === 'supervisor' && (
                <SupervisorContent data={data} supervisorSection={supervisorSection} />
              )}
              {tab === 'activity' && (
                activityReport ? (
                  <CaseTimeline report={activityReport} title="Activity history" compact />
                ) : (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Activity history is not available for this case.</p>
                )
              )}
            </div>
          </motion.aside>

          {/* Desktop: right drawer */}
          <motion.aside
            className="dart-elev-3 absolute right-0 top-0 hidden h-full w-full max-w-[720px] flex-col overflow-hidden border-l border-slate-200 bg-white md:flex"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Reference</p>
                <h3 className="mt-0.5 text-base font-semibold text-[#00205B] font-['Poppins']">
                  {tab === 'operator' ? 'Operator report' : tab === 'supervisor' ? 'Field Supervisor report' : 'Activity history'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                aria-label="Close reference reports"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex gap-2">
                <button type="button" className={tabButtonClass('operator')} onClick={() => setTab('operator')}>Operator report</button>
                <button type="button" className={tabButtonClass('supervisor')} onClick={() => setTab('supervisor')}>Field Supervisor report</button>
                <button type="button" className={tabButtonClass('activity')} onClick={() => setTab('activity')}>Activity</button>
              </div>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              {tab === 'operator' && (
                <OperatorReferenceRail
                  data={data}
                  operatorStatus={operatorStatus}
                  className="!border-0 !bg-transparent !shadow-none"
                  showHeader={false}
                />
              )}
              {tab === 'supervisor' && (
                <SupervisorContent data={data} supervisorSection={supervisorSection} />
              )}
              {tab === 'activity' && (
                activityReport ? (
                  <CaseTimeline report={activityReport} title="Activity history" compact />
                ) : (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Activity history is not available for this case.</p>
                )
              )}
            </div>
            <div className="border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
              >
                Back to your section
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
