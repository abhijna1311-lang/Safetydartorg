import { useState } from 'react';
import { CheckCircle2, ChevronDown, FileText, ShieldCheck } from 'lucide-react';
import { GlassButton } from './GlassButton';
import { ActionSelectionScreen } from './actions/ActionSelectionScreen';
import { buildAmActions } from './actions/actionConfigs';
import { EmployeeRecordPanel } from './steps/sections/EmployeeRecordPanel';
import { EMPLOYEE_DB } from '../data/employeeDatabase';
import type { AccidentReportData } from '../types/accident-report';

interface AssistantManagerReviewProps {
  data: AccidentReportData;
  caseId?: string;
  supervisorSubmittedAt?: string | null;
  onBackToHome?: () => void;
  onOpenOperatorReport?: () => void;
  onOpenSupervisorReport?: () => void;
  onOpenActivity?: () => void;
  /**
   * Fired when the AM confirms one of the three actions. The actionId matches
   * the workflow-engine transition; the human dev will wire this to the real
   * POST call when the API contract lands.
   */
  onAction?: (actionId: string, payload: { comment?: string; toBadge?: string; toName?: string }) => void;
}

/**
 * Assistant Manager Review — the "middle reviewer" step.
 *
 * The AM has no form fields of their own; they read what the Field Supervisor
 * (and Operator) filed via the Case References strip, then pick one of three
 * actions per the workflow CSV:
 *  1. Send to Safety Program Manager review (approve to next step).
 *  2. Return to Field Supervisor for rework.
 *  3. Reassign to another Assistant Manager.
 */
export function AssistantManagerReview({
  data,
  caseId,
  supervisorSubmittedAt,
  onBackToHome,
  onOpenOperatorReport,
  onOpenSupervisorReport,
  onOpenActivity,
  onAction,
}: AssistantManagerReviewProps) {
  const [confirmed, setConfirmed] = useState<{ actionId: string; title: string; description: string } | null>(null);

  const supervisorName = [data.supervisor_first_name, data.supervisor_last_name].filter(Boolean).join(' ') || data.supervisor_name || 'Field Supervisor';
  const supervisorArrival = data.supervisor_arrival_date && data.supervisor_arrival_time
    ? `${new Date(data.supervisor_arrival_date).toLocaleDateString()} at ${data.supervisor_arrival_time}`
    : '—';

  const reassignOptions = Object.values(EMPLOYEE_DB).map((emp) => ({
    value: emp.badge,
    label: emp.name,
    description: `${emp.division_work} · Badge ${emp.badge}`,
  }));

  const submissionContext = {
    sectionLabel: 'Field Supervisor submitted',
    submittedAt: supervisorSubmittedAt ?? null,
    caseEvent: `${data.event_type || 'Event pending'} · ${data.mode || 'Mode pending'}`,
  };

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white p-6 md:p-8 shadow-[0_2px_12px_-2px_rgba(16,185,129,0.10)] animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-[#00205B] font-['Poppins']">{confirmed.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-700 font-['Poppins']">{confirmed.description}</p>
            {caseId && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/60 bg-white/80 px-3 py-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-900 font-['Poppins']">Case ID {caseId}</span>
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {onBackToHome && (
                <GlassButton variant="primary" onClick={onBackToHome}>Back to home</GlassButton>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_28px_-14px_rgba(0,32,91,0.14),0_2px_6px_-2px_rgba(0,32,91,0.06)]">
      <EmployeeRecordPanel data={data} submissionContext={submissionContext} />

      <div className="relative -mt-px bg-[linear-gradient(180deg,#003A78_0%,#004B8D_40%,#EEF3F8_72%)]">
        <div className="relative z-10 bg-[#F6F8FB] rounded-t-[36px] pt-2 md:pt-4 shadow-[0_10px_16px_-14px_rgba(2,36,79,0.30)] px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
          <div className="pt-6">
            <div className="mb-6 pb-4">
              <h2 className="text-[22px] text-[#00205B] font-semibold font-['Poppins']">Assistant Manager Review</h2>
              <p className="mt-2 text-sm text-slate-700 font-['Poppins']">
                Review what the Field Supervisor submitted, then decide how this report moves forward.
              </p>
            </div>

            {/* Case references strip */}
            <div className="dart-card dart-card--surface flex flex-wrap items-center justify-between gap-3 px-5 py-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#00205B]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00205B] font-['Poppins']">
                  <ShieldCheck className="h-3 w-3" />
                  Case references
                </span>
                <span className="dart-caption hidden sm:inline">Open any source report while you work.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onOpenOperatorReport && (
                  <button
                    type="button"
                    onClick={onOpenOperatorReport}
                    className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Operator report
                  </button>
                )}
                {onOpenSupervisorReport && (
                  <button
                    type="button"
                    onClick={onOpenSupervisorReport}
                    className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Supervisor report
                  </button>
                )}
                {onOpenActivity && (
                  <button
                    type="button"
                    onClick={onOpenActivity}
                    className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
                  >
                    Activity
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Field Supervisor submission summary */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.02)] mb-6">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 font-['Poppins']">Field Supervisor submission</p>
                <h3 className="mt-1 text-base font-semibold text-[#00205B] font-['Poppins']">
                  {supervisorName}
                  {data.supervisor_badge_number && <span className="ml-2 text-sm font-normal text-slate-500">· Badge {data.supervisor_badge_number}</span>}
                </h3>
              </div>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Supervisor arrival</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{supervisorArrival}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Vehicle</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{data.vehicle_number || data.train_number || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Division</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{data.supervisor_division || '—'}</dd>
                </div>
                <div className="sm:col-span-2 xl:col-span-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Supervisor description</dt>
                  <dd className={`mt-1 text-sm leading-relaxed font-['Poppins'] whitespace-pre-line ${data.supervisor_event_description ? 'text-slate-900' : 'italic text-slate-400'}`}>
                    {data.supervisor_event_description || '—'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Actions screen */}
            <ActionSelectionScreen
              bannerTitle="Ready to decide"
              bannerDescription="Pick what should happen next. Your choice will update the workflow status and assignment."
              title="Choose next action"
              description="Send the report on to the Safety Program Manager, return it to the Field Supervisor for rework, or reassign it to another Assistant Manager."
              actions={buildAmActions({ reassignOptions })}
              onConfirm={(actionId, payload) => {
                let title = 'Action confirmed';
                let description = 'The next step will be handled by the workflow engine.';
                switch (actionId) {
                  case 'send-to-spm':
                    title = 'Sent to Safety Program Manager';
                    description = 'The report has moved to the Agency Safety Review queue. The Safety Program Manager will pick it up next.';
                    break;
                  case 'rework':
                    title = 'Sent for rework';
                    description = 'The report has been returned to the Field Supervisor who worked it. You will be notified when it comes back.';
                    break;
                  case 'reassign':
                    title = 'Report reassigned';
                    description = payload.toName
                      ? `The report has been reassigned to ${payload.toName}. They have been notified.`
                      : 'The report has been reassigned. The new owner has been notified.';
                    break;
                }
                onAction?.(actionId, payload);
                setConfirmed({ actionId, title, description });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
