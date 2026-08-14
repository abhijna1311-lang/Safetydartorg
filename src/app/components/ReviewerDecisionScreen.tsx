import { useMemo, useState } from 'react';
import { AlertOctagon, Ban, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, RotateCcw, UserCog } from 'lucide-react';
import { GlassButton } from './GlassButton';
import type { AccidentReportData } from '../types/accident-report';
import type { WorkflowSectionState } from '../types/workflow-report';
import type { UserRole } from '../context/UserRoleContext';
import { getReportLocation } from '../types/workflow-report';
import { EMPLOYEE_DB } from '../data/employeeDatabase';

export type ReviewerActionKey = 'approve' | 'return' | 'reassign' | 'reject';

interface ReviewerDecisionScreenProps {
  caseId: string;
  data: AccidentReportData;
  initiatedBy: UserRole;
  currentUserName: string;
  supervisorSection: WorkflowSectionState;
  onApprove: (note: string) => void;
  onReturn: (note: string) => void;
  onReassign: (payload: { toBadge: string; toName: string; note: string }) => void;
  onReject: (reason: string) => void;
  onViewFullReport?: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
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

function Field({ label, value, wide }: { label: string; value: string | undefined | null; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">{label}</p>
      <p className={`mt-1 text-sm font-medium leading-relaxed font-['Poppins'] ${value && value !== '—' ? 'text-slate-900' : 'text-slate-400'}`}>{value || '—'}</p>
    </div>
  );
}

function CollapsibleCard({
  title,
  subtitle,
  right,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_16px_-12px_rgba(15,23,42,0.4)]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCD00]"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">{title}</p>
          {subtitle && <p className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {right}
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-5">{children}</div>}
    </div>
  );
}

function ActionTile({
  tone,
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  tone: 'emerald' | 'amber' | 'blue' | 'red';
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  const palette = {
    emerald: {
      base: 'border-emerald-200 bg-emerald-50/60',
      hover: 'hover:border-emerald-400 hover:bg-emerald-50',
      activeCls: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-700',
      titleCls: 'text-emerald-900',
      descCls: 'text-emerald-800/80',
      focus: 'focus-visible:ring-emerald-400',
    },
    amber: {
      base: 'border-amber-200 bg-amber-50/60',
      hover: 'hover:border-amber-400 hover:bg-amber-50',
      activeCls: 'border-amber-500 bg-amber-50 ring-2 ring-amber-300',
      iconBg: 'bg-amber-100 text-amber-700',
      titleCls: 'text-amber-900',
      descCls: 'text-amber-800/80',
      focus: 'focus-visible:ring-amber-400',
    },
    blue: {
      base: 'border-sky-200 bg-sky-50/60',
      hover: 'hover:border-sky-400 hover:bg-sky-50',
      activeCls: 'border-sky-500 bg-sky-50 ring-2 ring-sky-300',
      iconBg: 'bg-sky-100 text-sky-700',
      titleCls: 'text-sky-900',
      descCls: 'text-sky-800/80',
      focus: 'focus-visible:ring-sky-400',
    },
    red: {
      base: 'border-red-200 bg-red-50/60',
      hover: 'hover:border-red-400 hover:bg-red-50',
      activeCls: 'border-red-500 bg-red-50 ring-2 ring-red-300',
      iconBg: 'bg-red-100 text-red-700',
      titleCls: 'text-red-900',
      descCls: 'text-red-800/80',
      focus: 'focus-visible:ring-red-400',
    },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all focus:outline-none focus-visible:ring-2 ${active ? palette.activeCls : `${palette.base} ${palette.hover}`} ${palette.focus}`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${palette.iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={`text-sm font-semibold font-['Poppins'] ${palette.titleCls}`}>{title}</span>
      <span className={`text-xs leading-relaxed font-['Poppins'] ${palette.descCls}`}>{description}</span>
    </button>
  );
}

export function ReviewerDecisionScreen({
  caseId,
  data,
  initiatedBy,
  currentUserName,
  supervisorSection,
  onApprove,
  onReturn,
  onReassign,
  onReject,
  onViewFullReport,
}: ReviewerDecisionScreenProps) {
  const [pendingAction, setPendingAction] = useState<ReviewerActionKey | null>(null);
  const [note, setNote] = useState('');
  const [reassignBadge, setReassignBadge] = useState<string>('');

  const wasReturnedBefore = supervisorSection.status === 'resubmitted';
  const eventSummary = `${data.event_type || 'Event'} · ${data.mode || 'Mode pending'}`;
  const location = getReportLocation(data);
  const incidentDateTime = data.incident_date && data.incident_time
    ? `${data.incident_date} at ${data.incident_time}`
    : data.incident_date || '—';
  const supervisorName = [data.supervisor_first_name, data.supervisor_last_name].filter(Boolean).join(' ') || data.supervisor_name || '—';
  const supervisorArrival = data.supervisor_arrival_date && data.supervisor_arrival_time
    ? `${data.supervisor_arrival_date} at ${data.supervisor_arrival_time}`
    : data.supervisor_arrival_date || '—';

  const supervisorOptions = useMemo(() => (
    Object.values(EMPLOYEE_DB)
      .filter((record) => record.division_work?.toLowerCase().includes('supervisor'))
      .filter((record) => record.badge !== data.supervisor_badge_number)
      .map((record) => ({
        badge: record.badge,
        name: record.name,
        division: record.division,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  ), [data.supervisor_badge_number]);

  const commentTouched = note.trim().length > 0;
  const reassignReady = pendingAction === 'reassign' ? Boolean(reassignBadge) && commentTouched : true;
  const confirmDisabled = !commentTouched || !reassignReady;

  const actionMeta: Record<ReviewerActionKey, { title: string; noteLabel: string; noteHint: string; confirmLabel: string; placeholder: string; tone: 'emerald' | 'amber' | 'blue' | 'red' }> = {
    approve: {
      title: 'Note for approval',
      noteLabel: 'Approval note (required)',
      noteHint: 'Record why you are advancing this case. This becomes part of the audit trail.',
      confirmLabel: 'Approve & continue',
      placeholder: 'e.g. Findings are complete and consistent with the operator report. Proceeding to classification.',
      tone: 'emerald',
    },
    return: {
      title: 'Return note for the Supervisor',
      noteLabel: 'Correction note (required)',
      noteHint: 'Be specific about what needs to change. Supervisor will see this in their case queue.',
      confirmLabel: 'Send back to Supervisor',
      placeholder: 'e.g. Add field supervisor statement and confirm the passenger injury severity.',
      tone: 'amber',
    },
    reassign: {
      title: 'Reassign Field Supervisor section',
      noteLabel: 'Reassignment note (required)',
      noteHint: 'Explain why the case needs a different supervisor to complete this section.',
      confirmLabel: 'Reassign supervisor',
      placeholder: 'e.g. Original supervisor is out on leave. Please pick this up for review.',
      tone: 'blue',
    },
    reject: {
      title: 'Reason for rejecting this case',
      noteLabel: 'Rejection reason (required)',
      noteHint: 'This closes the case as rejected. The reason is permanent on the case record.',
      confirmLabel: 'Reject case',
      placeholder: 'e.g. Duplicate of AE-2026-1029. Case filed in error.',
      tone: 'red',
    },
  };

  const handleActionClick = (action: ReviewerActionKey) => {
    if (pendingAction === action) {
      setPendingAction(null);
      setNote('');
      setReassignBadge('');
      return;
    }
    setPendingAction(action);
    setNote('');
    setReassignBadge('');
  };

  const handleConfirm = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    if (pendingAction === 'approve') {
      onApprove(trimmed);
    } else if (pendingAction === 'return') {
      onReturn(trimmed);
    } else if (pendingAction === 'reassign') {
      const selected = supervisorOptions.find((option) => option.badge === reassignBadge);
      if (!selected) return;
      onReassign({ toBadge: selected.badge, toName: selected.name, note: trimmed });
    } else if (pendingAction === 'reject') {
      onReject(trimmed);
    }
    setPendingAction(null);
    setNote('');
    setReassignBadge('');
  };

  const handleCancel = () => {
    setPendingAction(null);
    setNote('');
    setReassignBadge('');
  };

  const jumpToDecision = () => {
    const el = document.getElementById('reviewer-decision-panel');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#00205B]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00205B] font-['Poppins']">
              Reviewer decision
            </span>
            <span className="text-xs text-slate-500 font-['Poppins']">Case {caseId}</span>
          </div>
          <h2 className="mt-3 text-[22px] sm:text-[26px] font-semibold text-[#00205B] font-['Poppins']">
            Review supervisor's submission
          </h2>
          <p className="mt-2 text-sm text-slate-600 font-['Poppins']">
            {wasReturnedBefore
              ? `${supervisorName} resubmitted this section after your correction request. Read the full report below, then choose an action.`
              : 'Read the full operator and supervisor content below, then choose an action. All decisions require a note.'}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            onClick={jumpToDecision}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
          >
            Jump to decision
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {onViewFullReport && (
            <button
              type="button"
              onClick={onViewFullReport}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
            >
              Open full case record
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Case at a glance */}
      <CollapsibleCard title="Case at a glance" subtitle={eventSummary} defaultOpen>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Incident date & time" value={incidentDateTime} />
          <Field label="Location" value={location} />
          <Field label="Initiated by" value={initiatedBy} />
          <Field label="Employee" value={data.employee_name ? `${data.employee_name}${data.employee_badge_number ? ` · ${data.employee_badge_number}` : ''}` : '—'} />
          <Field label="Vehicle number" value={data.vehicle_number || data.train_number} />
          <Field label="Route" value={data.route_number || data.operating_route || data.rail_line} />
        </div>
      </CollapsibleCard>

      {/* Operator submission */}
      <CollapsibleCard title="Operator submission" subtitle="What the operator reported" defaultOpen>
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Incident basics</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Event type" value={data.event_type} />
              <Field label="Mode" value={data.mode} />
              <Field label="Collision type" value={data.collision_type || data.lrv_collision_type} />
              <Field label="Bus stop event?" value={yesNo(data.event_at_bus_stop)} />
              {data.event_at_bus_stop && <Field label="Bus stop name" value={data.bus_stop_name} />}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Vehicle and route</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Fleet type" value={data.fleet_type || data.lrv_fleet_type} />
              <Field label="Trip ID" value={data.trip_id} />
              <Field label="Block number" value={data.block_number} />
              <Field label="Run number" value={data.run_number} />
              <Field label="End of line" value={data.end_of_line_destination || data.lrv_end_of_line} />
              <Field label="Bike lane" value={yesNo(data.has_bike_lane)} />
              <Field label="Status before event" value={data.bus_status_before || data.train_status_before} />
              <Field label="Status after event" value={data.bus_status_after || data.train_status_after} />
              <Field label="Speed at event" value={data.bus_speed || data.train_speed} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Impact</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Point of impact" value={data.point_of_impact || data.lrv_point_of_impact} />
              <Field label="Vehicle action" value={data.bus_action || data.train_action} />
              <Field label="Vehicle damage" value={yesNo(data.bus_damage || data.train_damage)} />
              <Field label="Runaway" value={yesNo(data.runaway_vehicle || data.runaway_train)} />
              <Field label="Life-safety evacuation" value={yesNo(data.evacuation_life_safety || data.lrv_evacuation)} />
              <Field label="Collision resulted in derailment" value={yesNo(data.collision_resulted_in_derailment)} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Injuries reported by operator</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Operator injured" value={yesNo(data.operator_injured)} />
              {data.operator_injured && <Field label="Operator injured body part" value={data.operator_injured_body_part} />}
              {data.operator_injured && <Field label="Operator transported to hospital" value={yesNo(data.operator_transported)} />}
              <Field label="Other employees injured" value={nonEmpty(data.other_employees_injured_count)} />
              <Field label="Passengers on board" value={nonEmpty(data.passengers_on_board)} />
              <Field label="Passengers injured" value={nonEmpty(data.passengers_injured)} />
              <Field label="Passengers transported" value={nonEmpty(data.passengers_transported)} />
              <Field label="Pedestrians involved" value={nonEmpty(data.pedestrians_involved)} />
              <Field label="Pedestrian injuries" value={nonEmpty(data.pedestrian_injuries)} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Weather and scene</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Weather" value={data.weather} />
              <Field label="Road/track conditions" value={data.road_conditions} />
              <Field label="Lighting" value={data.lighting_conditions} />
              <Field label="Streetlights" value={data.streetlights} />
              <Field label="Traffic conditions" value={data.traffic_conditions} />
              <Field label="Traffic controls" value={data.traffic_controls} />
              <Field label="Roadway configuration" value={data.roadway_configuration} />
              <Field label="Police at scene" value={yesNo(data.police_at_scene)} />
              {data.police_at_scene && <Field label="Police type" value={data.police_type} />}
            </div>
          </div>
          {(data.description_of_event || data.incident_description) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Operator description</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800 font-['Poppins']">
                {data.description_of_event || data.incident_description}
              </p>
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Supervisor findings */}
      <CollapsibleCard
        title="Supervisor findings"
        subtitle={`Submitted by ${supervisorName}`}
        right={
          <span className="text-xs text-slate-500 font-['Poppins']">
            {wasReturnedBefore ? 'Resubmitted' : 'Submitted'} {formatDate(supervisorSection.submittedAt)}
          </span>
        }
        defaultOpen
      >
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Field Supervisor identity and arrival</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Location as recorded by supervisor</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Damage, tow, and derailment</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Derailment details</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800 font-['Poppins']">{data.supervisor_derailment_details}</p>
              </div>
            )}
            {data.supervisor_equipment_damage_description && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Equipment / property damage</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800 font-['Poppins']">{data.supervisor_equipment_damage_description}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Injuries recorded by supervisor</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Police</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Police called" value={yesNo(data.supervisor_police_called)} />
              <Field label="Officer name" value={data.supervisor_police_officer_name} />
              <Field label="Notified by" value={data.supervisor_police_notified_by} />
              <Field label="Report city" value={data.supervisor_report_city} />
              <Field label="Report number" value={data.supervisor_police_report_number} />
            </div>
          </div>
          {data.supervisor_event_description && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Field Supervisor description</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800 font-['Poppins']">{data.supervisor_event_description}</p>
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Decision panel */}
      <div
        id="reviewer-decision-panel"
        className="rounded-2xl border-2 border-[#00205B]/15 bg-gradient-to-br from-white to-[#F6F8FB] p-5 shadow-[0_10px_28px_-14px_rgba(0,32,91,0.35)]"
      >
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#00205B] font-['Poppins']">Choose an action</p>
          <p className="mt-1 text-sm text-slate-600 font-['Poppins']">
            Every action is recorded in the audit trail with your note. You're reviewing as <span className="font-semibold text-slate-800">{currentUserName}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionTile
            tone="emerald"
            icon={CheckCircle2}
            title="Approve"
            description="Findings are complete. Continue to your classification section."
            active={pendingAction === 'approve'}
            onClick={() => handleActionClick('approve')}
          />
          <ActionTile
            tone="amber"
            icon={RotateCcw}
            title="Return for correction"
            description="Send back to the same Supervisor with a note."
            active={pendingAction === 'return'}
            onClick={() => handleActionClick('return')}
          />
          <ActionTile
            tone="blue"
            icon={UserCog}
            title="Reassign"
            description="Route the Field Supervisor section to a different Field Supervisor."
            active={pendingAction === 'reassign'}
            onClick={() => handleActionClick('reassign')}
          />
          <ActionTile
            tone="red"
            icon={Ban}
            title="Reject"
            description="Close the case without classification. No rework after this."
            active={pendingAction === 'reject'}
            onClick={() => handleActionClick('reject')}
          />
        </div>

        {pendingAction && (
          <div
            className={`mt-5 rounded-xl border p-5 ${
              pendingAction === 'approve' ? 'border-emerald-300 bg-emerald-50/60'
              : pendingAction === 'return' ? 'border-amber-300 bg-amber-50/60'
              : pendingAction === 'reassign' ? 'border-sky-300 bg-sky-50/60'
              : 'border-red-300 bg-red-50/60'
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              {pendingAction === 'approve' && <CheckCircle2 className="h-5 w-5 text-emerald-700" />}
              {pendingAction === 'return' && <RotateCcw className="h-5 w-5 text-amber-700" />}
              {pendingAction === 'reassign' && <UserCog className="h-5 w-5 text-sky-700" />}
              {pendingAction === 'reject' && <AlertOctagon className="h-5 w-5 text-red-700" />}
              <p
                className={`text-sm font-semibold font-['Poppins'] ${
                  pendingAction === 'approve' ? 'text-emerald-900'
                  : pendingAction === 'return' ? 'text-amber-900'
                  : pendingAction === 'reassign' ? 'text-sky-900'
                  : 'text-red-900'
                }`}
              >
                {actionMeta[pendingAction].title}
              </p>
            </div>

            {pendingAction === 'reassign' && (
              <div className="mb-4">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Reassign to (required)</label>
                <select
                  value={reassignBadge}
                  onChange={(event) => setReassignBadge(event.target.value)}
                  className="dart-input-base mt-1"
                >
                  <option value="">Select a supervisor</option>
                  {supervisorOptions.map((option) => (
                    <option key={option.badge} value={option.badge}>
                      {option.name} · {option.division} · #{option.badge}
                    </option>
                  ))}
                </select>
                {supervisorOptions.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500 font-['Poppins']">No other supervisors available in the directory.</p>
                )}
              </div>
            )}

            <label className={`text-[10px] font-semibold uppercase tracking-wide font-['Poppins'] ${
              pendingAction === 'approve' ? 'text-emerald-800'
              : pendingAction === 'return' ? 'text-amber-800'
              : pendingAction === 'reassign' ? 'text-sky-800'
              : 'text-red-800'
            }`}>{actionMeta[pendingAction].noteLabel}</label>
            <p className={`mb-2 text-xs font-['Poppins'] ${
              pendingAction === 'approve' ? 'text-emerald-800/80'
              : pendingAction === 'return' ? 'text-amber-800/80'
              : pendingAction === 'reassign' ? 'text-sky-800/80'
              : 'text-red-800/80'
            }`}>
              {actionMeta[pendingAction].noteHint}
            </p>
            <textarea
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={actionMeta[pendingAction].placeholder}
              className="dart-input-base resize-none"
              autoFocus
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="dart-action-link min-h-[44px] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
              >
                Cancel
              </button>
              <GlassButton variant="primary" onClick={handleConfirm} disabled={confirmDisabled}>
                {actionMeta[pendingAction].confirmLabel}
              </GlassButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
