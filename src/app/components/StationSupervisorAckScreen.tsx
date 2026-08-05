import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { DARTHeader } from './DARTHeader';
import { DARTFooter } from './DARTFooter';
import { ReferenceReportDrawer } from './ReferenceReportDrawer';
import { EmployeeRecordPanel } from './steps/sections/EmployeeRecordPanel';
import { GlassButton } from './GlassButton';
import { useUserRole } from '../context/UserRoleContext';
import type { AccidentReportData } from '../types/accident-report';
import type { WorkflowReport } from '../types/workflow-report';
import { getWorkflowSections } from '../types/workflow-report';

interface StationSupervisorAckScreenProps {
  data: AccidentReportData;
  report?: WorkflowReport | null;
  alreadyAcknowledged?: boolean;
  onAcknowledge: (note: string) => void;
  onBackToHome: () => void;
  onNavigate?: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
}

export function StationSupervisorAckScreen({
  data,
  report,
  alreadyAcknowledged = false,
  onAcknowledge,
  onBackToHome,
  onNavigate,
}: StationSupervisorAckScreenProps) {
  const { roleConfig } = useUserRole();
  const [selected, setSelected] = useState<'acknowledge' | null>(alreadyAcknowledged ? null : 'acknowledge');
  const [note, setNote] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const sections = report ? getWorkflowSections(report) : null;
  const submissionContext = {
    sectionLabel: 'Operator section submitted',
    submittedAt: sections?.operator.submittedAt ?? report?.lastSavedAt ?? null,
    caseEvent: `${data.event_type || 'Event pending'} · ${data.mode || 'Mode pending'}`,
  };

  const canConfirm = selected === 'acknowledge' && !confirming;

  const handleConfirm = () => {
    if (!canConfirm) return;
    setConfirming(true);
    onAcknowledge(note.trim());
  };

  const existingAck = report?.stationSupervisorAck?.status === 'acknowledged' ? report.stationSupervisorAck : null;

  return (
    <div className="min-h-screen dart-canvas flex flex-col">
      <DARTHeader activeNav="home" onNavigate={onNavigate} />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex-1 w-full">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-[28px] sm:text-[32px] text-[#00205B] font-semibold mb-2">
              Safety Event Report
            </h1>
            <p className="text-sm text-slate-600">
              Review the operator's submission and confirm receipt. This is a record-only step — it does not change the workflow.
            </p>
          </div>

          {/* Unified card — navy case header + white workspace, matches operator/FS/PM actions screen */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_28px_-14px_rgba(0,32,91,0.14),0_2px_6px_-2px_rgba(0,32,91,0.06)]">
            <EmployeeRecordPanel data={data} submissionContext={submissionContext} />

            <div className="relative -mt-px bg-[linear-gradient(180deg,#003A78_0%,#004B8D_40%,#EEF3F8_72%)]">
              <div className="relative z-10 bg-[#F6F8FB] rounded-t-[36px] pt-2 md:pt-4 shadow-[0_10px_16px_-14px_rgba(2,36,79,0.30)] px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
                <div className="pt-6">
                  <div className="mb-6 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <h2 className="text-[22px] text-[#00205B] font-semibold font-['Poppins']">
                        {alreadyAcknowledged ? 'Acknowledgment on file' : 'Acknowledge operator submission'}
                      </h2>
                      {alreadyAcknowledged && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={12} />
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 font-['Poppins'] mb-2">
                      {alreadyAcknowledged
                        ? 'You confirmed receipt of this report. Field Supervisor and Safety Program Manager review continues in parallel.'
                        : 'Confirm you have reviewed this report. Field Supervisor and Safety Program Manager review continues in parallel.'}
                    </p>
                  </div>

                  <div className="dart-card dart-card--surface flex flex-wrap items-center justify-between gap-3 px-5 py-3 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#00205B]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00205B] font-['Poppins']">
                        <ShieldCheck className="h-3 w-3" />
                        Case references
                      </span>
                      <span className="dart-caption hidden sm:inline">Open the operator report while you work.</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Operator report
                      </button>
                    </div>
                  </div>

                  {/* Operator submission snapshot — mirrors the AM's Field Supervisor submission card */}
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.02)] mb-6">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 font-['Poppins']">Operator submission</p>
                      <h3 className="mt-1 text-base font-semibold text-[#00205B] font-['Poppins']">
                        {data.event_type || 'Event pending'}
                        {data.mode && <span className="ml-2 text-sm font-normal text-slate-500">· {data.mode}</span>}
                      </h3>
                    </div>
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Event date &amp; time</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">
                          {data.incident_date && data.incident_time
                            ? `${data.incident_date} at ${data.incident_time}`
                            : data.incident_date || data.incident_time || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Vehicle</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">{data.vehicle_number || data.train_number || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Route / Block</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">
                          {[data.route_number, data.block_number].filter(Boolean).join(' · ') || '—'}
                        </dd>
                      </div>
                      <div className="sm:col-span-2 xl:col-span-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Location</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900 font-['Poppins']">
                          {data.event_at_bus_stop && data.bus_stop_name
                            ? data.bus_stop_name
                            : [data.street_on, data.cross_street].filter(Boolean).join(' & ')
                              || data.address_of_event
                              || '—'}
                        </dd>
                      </div>
                      <div className="sm:col-span-2 xl:col-span-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 font-['Poppins']">Description of event</dt>
                        <dd className={`mt-1 text-sm leading-relaxed font-['Poppins'] whitespace-pre-line ${data.description_of_event ? 'text-slate-900' : 'italic text-slate-400'}`}>
                          {data.description_of_event || '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {alreadyAcknowledged && existingAck && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100">
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-emerald-900 font-['Poppins']">
                            Acknowledged by {existingAck.acknowledgedBy || 'Station Supervisor'}
                            {existingAck.acknowledgedByBadge ? ` · Badge ${existingAck.acknowledgedByBadge}` : ''}
                          </p>
                          {existingAck.acknowledgedAt && (
                            <p className="mt-0.5 text-xs text-emerald-800/80 font-['Poppins']">
                              {new Date(existingAck.acknowledgedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          )}
                          {existingAck.note && (
                            <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-['Poppins']">
                              {existingAck.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!alreadyAcknowledged && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelected('acknowledge')}
                          className={`group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#FFCD00] ${
                            selected === 'acknowledge'
                              ? 'border-[#00205B] shadow-[0_2px_8px_-2px_rgba(0,32,91,0.15)] bg-emerald-50/40'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-emerald-600 bg-emerald-50">
                            <CheckCircle2 className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">I have reviewed this accident report.</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-600 font-['Poppins']">
                              Records your receipt of the operator's submission. Does not change the workflow — Field Supervisor and Safety Program Manager review continue in parallel.
                            </p>
                          </div>
                          <span
                            aria-hidden
                            className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                              selected === 'acknowledge' ? 'border-[#00205B] bg-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {selected === 'acknowledge' && <span className="h-2 w-2 rounded-full bg-[#00205B]" />}
                          </span>
                        </button>
                      </div>

                      <AnimatePresence initial={false} mode="wait">
                        {selected === 'acknowledge' && (
                          <motion.div
                            key="ss-note"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                              height: { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 },
                              opacity: { duration: 0.2, ease: 'easeInOut' },
                            }}
                            className="overflow-hidden"
                          >
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 font-['Poppins']">
                                Add a note (optional)
                              </p>
                              <div className="mt-3">
                                <div className="mb-1.5 text-xs font-semibold text-slate-700 font-['Poppins']">
                                  Notes for the case record
                                </div>
                                <textarea
                                  rows={4}
                                  value={note}
                                  onChange={(e) => setNote(e.target.value)}
                                  placeholder="For example: spoke with operator at end of shift, no additional injuries reported."
                                  maxLength={500}
                                  className="dart-input-base w-full resize-none"
                                />
                                <div className="mt-1 flex items-center justify-between text-[11px] font-['Poppins']">
                                  <span className="text-slate-500">Attached to the report record and visible to reviewers.</span>
                                  <span className="tabular-nums text-slate-400">{note.length}/500</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                    >
                      ← Back to home
                    </button>
                    {!alreadyAcknowledged && (
                      <GlassButton variant="primary" disabled={!canConfirm} onClick={handleConfirm}>
                        {confirming ? 'Acknowledging…' : 'Confirm acknowledgment'}
                      </GlassButton>
                    )}
                  </div>

                  <p className="mt-4 text-xs text-slate-500 font-['Poppins']">
                    Signed in as {roleConfig.name} · Badge {roleConfig.badge}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReferenceReportDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={data}
        defaultTab="operator"
        operatorStatus={sections?.operator.status}
        supervisorSection={sections?.supervisor}
        activityReport={report ?? undefined}
      />

      <DARTFooter />
    </div>
  );
}
