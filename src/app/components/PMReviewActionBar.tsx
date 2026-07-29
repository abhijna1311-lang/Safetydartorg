import { useMemo, useState } from 'react';
import { AlertOctagon, Ban, CheckCircle2, ChevronDown, FileText, MessageSquarePlus, PauseCircle, RotateCcw, ShieldCheck, UserCog } from 'lucide-react';
import { GlassButton } from './GlassButton';
import type { AccidentReportData } from '../types/accident-report';
import type { WorkflowSectionState } from '../types/workflow-report';
import { EMPLOYEE_DB } from '../data/employeeDatabase';

export type PMActionKey = 'comment' | 'hold' | 'return' | 'reassign' | 'reject' | 'approve';

interface PMReviewActionBarProps {
  data: AccidentReportData;
  isOnHold?: boolean;
  supervisorSection: WorkflowSectionState;
  canApprove: boolean;
  approveDisabledReason?: string;
  missingFields?: Array<{ label: string; step: number; stepName: string }>;
  onJumpToStep?: (step: number) => void;
  variant?: 'full' | 'compact';
  onOpenOperatorReport: () => void;
  onOpenSupervisorReport: () => void;
  onOpenActivity?: () => void;
  onComment: (note: string) => void;
  onHold: (note: string) => void;
  onReturn: (note: string) => void;
  onReassign: (payload: { toBadge: string; toName: string; note: string }) => void;
  onReject: (reason: string) => void;
  onApprove: (note: string) => void;
}

const ACTION_META: Record<PMActionKey, {
  label: string;
  noteLabel: string;
  noteHint: string;
  confirmLabel: string;
  placeholder: string;
  tone: 'emerald' | 'amber' | 'sky' | 'red' | 'slate' | 'indigo';
}> = {
  comment: {
    label: 'Add comment',
    noteLabel: 'Comment (required)',
    noteHint: 'Adds an entry to the case activity trail. Nothing else changes in the workflow.',
    confirmLabel: 'Post comment',
    placeholder: 'e.g. Waiting on video from bus 2045 before I finalize classification.',
    tone: 'slate',
  },
  hold: {
    label: 'Place case on hold',
    noteLabel: 'Hold reason (required)',
    noteHint: 'Parks the case in your queue without routing it anywhere. It stays put until you act again.',
    confirmLabel: 'Place on hold',
    placeholder: 'e.g. Holding for CCTV from bus 2045 and the field supervisor statement before I classify.',
    tone: 'indigo',
  },
  return: {
    label: 'Return for correction',
    noteLabel: 'Correction note (required)',
    noteHint: 'Sends the Field Supervisor section back with your note. Your classification work is preserved.',
    confirmLabel: 'Send back to Supervisor',
    placeholder: 'e.g. Add field supervisor statement and confirm passenger injury severity.',
    tone: 'amber',
  },
  reassign: {
    label: 'Reassign supervisor',
    noteLabel: 'Reassignment note (required)',
    noteHint: 'Routes the Field Supervisor section to a different Field Supervisor. Your classification work is preserved.',
    confirmLabel: 'Reassign supervisor',
    placeholder: 'e.g. Original supervisor is out on leave. Please pick this up.',
    tone: 'sky',
  },
  reject: {
    label: 'Reject case',
    noteLabel: 'Rejection reason (required)',
    noteHint: 'Closes the case as rejected. No rework is possible after this.',
    confirmLabel: 'Reject case',
    placeholder: 'e.g. Duplicate of AE-2026-1029. Case filed in error.',
    tone: 'red',
  },
  approve: {
    label: 'Approve & close case',
    noteLabel: 'Approval note (required)',
    noteHint: 'Records final approval and closes the case. This is the last workflow step.',
    confirmLabel: 'Approve & close case',
    placeholder: 'e.g. Findings verified and classification recorded. Approving to close.',
    tone: 'emerald',
  },
};

const TONE_STYLES: Record<'emerald' | 'amber' | 'sky' | 'red' | 'slate' | 'indigo', {
  panel: string;
  header: string;
  hint: string;
}> = {
  emerald: { panel: 'border-emerald-300 bg-emerald-50/60', header: 'text-emerald-900', hint: 'text-emerald-800/80' },
  amber: { panel: 'border-amber-300 bg-amber-50/60', header: 'text-amber-900', hint: 'text-amber-800/80' },
  sky: { panel: 'border-sky-300 bg-sky-50/60', header: 'text-sky-900', hint: 'text-sky-800/80' },
  red: { panel: 'border-red-300 bg-red-50/60', header: 'text-red-900', hint: 'text-red-800/80' },
  slate: { panel: 'border-slate-300 bg-slate-50', header: 'text-slate-900', hint: 'text-slate-600' },
  indigo: { panel: 'border-indigo-300 bg-indigo-50/60', header: 'text-indigo-900', hint: 'text-indigo-800/80' },
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function PMReviewActionBar({
  data,
  isOnHold = false,
  supervisorSection,
  canApprove,
  approveDisabledReason,
  missingFields,
  onJumpToStep,
  variant = 'full',
  onOpenOperatorReport,
  onOpenSupervisorReport,
  onOpenActivity,
  onComment,
  onHold,
  onReturn,
  onReassign,
  onReject,
  onApprove,
}: PMReviewActionBarProps) {
  const [pendingAction, setPendingAction] = useState<PMActionKey | null>(null);
  const [note, setNote] = useState('');
  const [reassignBadge, setReassignBadge] = useState('');
  const [approveAttested, setApproveAttested] = useState(false);

  const supervisorName = [data.supervisor_first_name, data.supervisor_last_name].filter(Boolean).join(' ') || data.supervisor_name || 'Supervisor';
  const statusLabel = supervisorSection.status === 'resubmitted'
    ? `Resubmitted by ${supervisorName}`
    : `Submitted by ${supervisorName}`;
  const statusTime = formatDate(supervisorSection.submittedAt);

  const supervisorOptions = useMemo(() => (
    Object.values(EMPLOYEE_DB)
      .filter((record) => record.division_work?.toLowerCase().includes('supervisor'))
      .filter((record) => record.badge !== data.supervisor_badge_number)
      .map((record) => ({ badge: record.badge, name: record.name, division: record.division }))
  ), [data.supervisor_badge_number]);

  const commentTouched = note.trim().length > 0;
  const reassignReady = pendingAction === 'reassign' ? Boolean(reassignBadge) && commentTouched : true;
  const approveReady = pendingAction === 'approve' ? approveAttested && commentTouched : true;
  const confirmDisabled = !commentTouched || !reassignReady || !approveReady;

  const openAction = (key: PMActionKey) => {
    if (pendingAction === key) {
      handleCancel();
      return;
    }
    if (key === 'approve' && !canApprove) return;
    setPendingAction(key);
    setNote('');
    setReassignBadge('');
    setApproveAttested(false);
  };

  const handleCancel = () => {
    setPendingAction(null);
    setNote('');
    setReassignBadge('');
    setApproveAttested(false);
  };

  const handleConfirm = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    if (pendingAction === 'comment') onComment(trimmed);
    else if (pendingAction === 'hold') onHold(trimmed);
    else if (pendingAction === 'return') onReturn(trimmed);
    else if (pendingAction === 'reassign') {
      const selected = supervisorOptions.find((option) => option.badge === reassignBadge);
      if (!selected) return;
      onReassign({ toBadge: selected.badge, toName: selected.name, note: trimmed });
    }
    else if (pendingAction === 'reject') onReject(trimmed);
    else if (pendingAction === 'approve') {
      if (!approveAttested) return;
      onApprove(trimmed);
    }
    handleCancel();
  };

  const meta = pendingAction ? ACTION_META[pendingAction] : null;
  const toneStyle = meta ? TONE_STYLES[meta.tone] : null;

  return (
    <div className="dart-card dart-card--floating overflow-hidden">
      {/* Header strip — only in full variant */}
      {variant === 'full' && (
      <div className="dart-card-header flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#00205B]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00205B] font-['Poppins']">
              <ShieldCheck className="h-3 w-3" />
              Reviewer actions
            </span>
            <span className="dart-caption">{statusLabel} · {statusTime}</span>
          </div>
          <p className="dart-body mt-1">
            Read the operator and supervisor content, complete your classification below, then approve to close. Corrections and reassignments can happen at any time without losing your work.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenOperatorReport}
            className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
          >
            <FileText className="h-3.5 w-3.5" />
            Operator report
          </button>
          <button
            type="button"
            onClick={onOpenSupervisorReport}
            className="dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-['Poppins']"
          >
            <FileText className="h-3.5 w-3.5" />
            Supervisor report
          </button>
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
      )}

      {/* Compact-variant lead-in copy */}
      {variant === 'compact' && (
        <div className="dart-card-header">
          <p className="dart-eyebrow text-[#00205B]">Ready to decide?</p>
          <p className="dart-body mt-1">
            Approve to close the case, or take one of the other actions before closing.
          </p>
        </div>
      )}

      {/* Missing-fields hint — appears above the action row when Approve is blocked, grouped by step, click-to-jump */}
      {!canApprove && missingFields && missingFields.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-50/70 px-5 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-900 font-['Poppins']">
                {missingFields.length} required {missingFields.length === 1 ? 'field is' : 'fields are'} missing before you can approve
              </p>
              <ul className="mt-1.5 space-y-1">
                {Object.entries(missingFields.reduce<Record<string, { step: number; items: string[] }>>((acc, field) => {
                  const key = `${field.step}-${field.stepName}`;
                  if (!acc[key]) acc[key] = { step: field.step, items: [] };
                  acc[key].items.push(field.label);
                  return acc;
                }, {})).map(([key, group]) => (
                  <li key={key} className="flex flex-wrap items-start gap-x-2 gap-y-1 text-xs text-amber-900 font-['Poppins']">
                    <span className="inline-flex min-h-[24px] items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                      Step {group.step} · {missingFields.find((f) => f.step === group.step)?.stepName}
                    </span>
                    <span>{group.items.join(' · ')}</span>
                    {onJumpToStep && (
                      <button
                        type="button"
                        onClick={() => onJumpToStep(group.step)}
                        className="dart-action-link text-xs"
                      >
                        Go to step →
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openAction('comment')}
            className={`dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold font-['Poppins'] ${pendingAction === 'comment' ? 'border-slate-500 bg-slate-100 text-slate-900' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'}`}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Comment only
          </button>
          {!isOnHold && (
            <button
              type="button"
              onClick={() => openAction('hold')}
              className={`dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold font-['Poppins'] ${pendingAction === 'hold' ? 'border-indigo-500 bg-indigo-100 text-indigo-900' : 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:border-indigo-400 hover:bg-indigo-100'}`}
            >
              <PauseCircle className="h-3.5 w-3.5" />
              Hold
            </button>
          )}
          <button
            type="button"
            onClick={() => openAction('return')}
            className={`dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold font-['Poppins'] ${pendingAction === 'return' ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100'}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Return for correction
          </button>
          <button
            type="button"
            onClick={() => openAction('reassign')}
            className={`dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold font-['Poppins'] ${pendingAction === 'reassign' ? 'border-sky-500 bg-sky-100 text-sky-900' : 'border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400 hover:bg-sky-100'}`}
          >
            <UserCog className="h-3.5 w-3.5" />
            Reassign
          </button>
          <button
            type="button"
            onClick={() => openAction('reject')}
            className={`dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold font-['Poppins'] ${pendingAction === 'reject' ? 'border-red-500 bg-red-100 text-red-900' : 'border-red-200 bg-red-50 text-red-800 hover:border-red-400 hover:bg-red-100'}`}
          >
            <Ban className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!canApprove && !missingFields?.length && approveDisabledReason && (
            <span className="dart-caption">{approveDisabledReason}</span>
          )}
          <button
            type="button"
            onClick={() => openAction('approve')}
            disabled={!canApprove}
            className={`dart-press dart-focus-ring inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold font-['Poppins'] ${
              canApprove
                ? pendingAction === 'approve'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-[0_6px_16px_-8px_rgba(5,150,105,0.5)]'
                  : 'border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_6px_16px_-8px_rgba(5,150,105,0.5)]'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve &amp; close case
          </button>
        </div>
      </div>

      {/* Inline confirmation panel */}
      {pendingAction && meta && toneStyle && (
        <div className={`border-t ${toneStyle.panel} px-5 py-5`}>
          <div className="mb-3 flex items-center gap-2">
            {pendingAction === 'approve' && <CheckCircle2 className={`h-5 w-5 ${toneStyle.header}`} />}
            {pendingAction === 'return' && <RotateCcw className={`h-5 w-5 ${toneStyle.header}`} />}
            {pendingAction === 'reassign' && <UserCog className={`h-5 w-5 ${toneStyle.header}`} />}
            {pendingAction === 'reject' && <AlertOctagon className={`h-5 w-5 ${toneStyle.header}`} />}
            {pendingAction === 'comment' && <MessageSquarePlus className={`h-5 w-5 ${toneStyle.header}`} />}
            {pendingAction === 'hold' && <PauseCircle className={`h-5 w-5 ${toneStyle.header}`} />}
            <p className={`text-sm font-semibold font-['Poppins'] ${toneStyle.header}`}>{meta.label}</p>
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

          <label className={`text-[10px] font-semibold uppercase tracking-wide font-['Poppins'] ${toneStyle.header}`}>{meta.noteLabel}</label>
          <p className={`mb-2 text-xs font-['Poppins'] ${toneStyle.hint}`}>{meta.noteHint}</p>
          <textarea
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={meta.placeholder}
            className="dart-input-base resize-none"
            autoFocus
          />

          {pendingAction === 'approve' && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-emerald-300 bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={approveAttested}
                onChange={(event) => setApproveAttested(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-400"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-emerald-900 font-['Poppins']">
                  I confirm the program manager review and classification are complete and accurate
                </div>
                <div className="mt-0.5 text-xs text-emerald-800/80 font-['Poppins']">
                  Closing this case records the final classification and completes the workflow. Your name and this note become part of the audit trail.
                </div>
              </div>
            </label>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="dart-action-link min-h-[44px] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
            >
              Cancel
            </button>
            <GlassButton variant="primary" onClick={handleConfirm} disabled={confirmDisabled}>
              {meta.confirmLabel}
            </GlassButton>
          </div>
        </div>
      )}
    </div>
  );
}
