import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Info } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GlassButton } from '../GlassButton';
import { SearchableCombobox, type ComboboxOption } from '../SearchableCombobox';

/**
 * ActionSelectionScreen — the reviewer's "choose next action" pane.
 *
 * Config-driven so every role (Operator, Station Supervisor, Field Supervisor,
 * Assistant Manager, Safety Program Manager) can plug in their own action list
 * without duplicating UI. Handlers stay client-side for the prototype; when the
 * workflow engine contract lands, the caller wires onConfirm to a real POST.
 */

export type ActionTone = 'emerald' | 'amber' | 'indigo' | 'sky' | 'teal' | 'red' | 'slate';

export type ActionContext =
  | { kind: 'none' }
  | {
      kind: 'comment';
      label: string;
      placeholder?: string;
      required?: boolean;
      maxLength?: number;
      hint?: string;
    }
  | {
      kind: 'user-picker';
      label: string;
      placeholder?: string;
      required?: boolean;
      options: ComboboxOption[];
      hint?: string;
    };

export interface ActionCard {
  id: string;
  icon: LucideIcon;
  tone: ActionTone;
  title: string;
  description: string;
  context?: ActionContext;
  disabled?: boolean;
  disabledReason?: string;
}

export interface ActionPayload {
  comment?: string;
  toBadge?: string;
  toName?: string;
}

interface Props {
  bannerTitle?: string;
  bannerDescription?: string;
  title: string;
  description?: string;
  actions: ActionCard[];
  onBack?: () => void;
  backLabel?: string;
  onConfirm: (actionId: string, payload: ActionPayload) => void;
  confirmLabel?: string;
}

const TONE_STYLES: Record<ActionTone, { icon: string; bg: string }> = {
  emerald: { icon: 'text-emerald-600 bg-emerald-50', bg: 'bg-emerald-50/40' },
  amber:   { icon: 'text-amber-600 bg-amber-50',     bg: 'bg-amber-50/40'   },
  indigo:  { icon: 'text-indigo-600 bg-indigo-50',   bg: 'bg-indigo-50/40'  },
  sky:     { icon: 'text-sky-600 bg-sky-50',         bg: 'bg-sky-50/40'     },
  teal:    { icon: 'text-teal-600 bg-teal-50',       bg: 'bg-teal-50/40'    },
  red:     { icon: 'text-red-600 bg-red-50',         bg: 'bg-red-50/40'     },
  slate:   { icon: 'text-slate-600 bg-slate-100',    bg: 'bg-slate-50'      },
};

export function ActionSelectionScreen({
  bannerTitle = 'Your review is complete.',
  bannerDescription = 'Select what should happen next. Your choice will update the workflow status and assignment.',
  title,
  description,
  actions,
  onBack,
  backLabel = 'Back to review',
  onConfirm,
  confirmLabel = 'Confirm action',
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [pickedBadge, setPickedBadge] = useState('');

  const selected = actions.find((a) => a.id === selectedId);
  const context: ActionContext = selected?.context ?? { kind: 'none' };

  const pickedName = useMemo(() => {
    if (context.kind !== 'user-picker') return '';
    return context.options.find((o) => o.value === pickedBadge)?.label ?? '';
  }, [context, pickedBadge]);

  const canConfirm = (() => {
    if (!selected || selected.disabled) return false;
    if (context.kind === 'comment' && context.required && !comment.trim()) return false;
    if (context.kind === 'user-picker' && context.required && !pickedBadge) return false;
    return true;
  })();

  const handleSelect = (id: string) => {
    setSelectedId(id);
    // Reset context state when switching cards so the next reveal starts clean.
    setComment('');
    setPickedBadge('');
  };

  const handleConfirm = () => {
    if (!selected || !canConfirm) return;
    onConfirm(selected.id, {
      comment: context.kind === 'comment' ? comment.trim() : undefined,
      toBadge: context.kind === 'user-picker' ? pickedBadge : undefined,
      toName: context.kind === 'user-picker' ? pickedName : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-200/70 bg-sky-50/60 px-5 py-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <div>
          <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">{bannerTitle}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600 font-['Poppins']">{bannerDescription}</p>
        </div>
      </div>

      {/* Section title */}
      <div>
        <h3 className="text-lg font-semibold text-[#00205B] font-['Poppins']">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500 font-['Poppins']">{description}</p>
        )}
      </div>

      {/* Grid of action cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const tone = TONE_STYLES[action.tone];
          const isSelected = action.id === selectedId;
          const isDisabled = Boolean(action.disabled);
          return (
            <button
              key={action.id}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(action.id)}
              className={`group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#FFCD00] ${
                isSelected
                  ? `border-[#00205B] shadow-[0_2px_8px_-2px_rgba(0,32,91,0.15)] ${tone.bg}`
                  : isDisabled
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]'
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone.icon}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#00205B] font-['Poppins']">{action.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 font-['Poppins']">{action.description}</p>
                {isDisabled && action.disabledReason && (
                  <p className="mt-1 text-[11px] italic text-slate-500 font-['Poppins']">{action.disabledReason}</p>
                )}
              </div>
              <span
                aria-hidden
                className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                  isSelected ? 'border-[#00205B] bg-white' : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <span className="h-2 w-2 rounded-full bg-[#00205B]" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Conditional context panel */}
      <AnimatePresence initial={false} mode="wait">
        {selected && context.kind !== 'none' && (
          <motion.div
            key={selected.id + context.kind}
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
                When &ldquo;{selected.title}&rdquo; is selected
              </p>
              <div className="mt-3">
                {context.kind === 'user-picker' && (
                  <div>
                    <div className="mb-1.5 text-xs font-semibold text-slate-700 font-['Poppins']">
                      {context.label}
                      {context.required && <span className="ml-1 text-red-500">*</span>}
                    </div>
                    <SearchableCombobox
                      value={pickedBadge}
                      onChange={(v) => setPickedBadge(v)}
                      options={context.options}
                      placeholder={context.placeholder || 'Select a user'}
                    />
                    {context.hint && (
                      <p className="mt-1.5 text-[11px] text-slate-500 font-['Poppins']">{context.hint}</p>
                    )}
                  </div>
                )}
                {context.kind === 'comment' && (
                  <div>
                    <div className="mb-1.5 text-xs font-semibold text-slate-700 font-['Poppins']">
                      {context.label}
                      {context.required && <span className="ml-1 text-red-500">*</span>}
                    </div>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={context.placeholder || 'Enter comments (required)'}
                      maxLength={context.maxLength}
                      className="dart-input-base w-full resize-none"
                    />
                    <div className="mt-1 flex items-center justify-between text-[11px] font-['Poppins']">
                      <span className="text-slate-500">{context.hint || ''}</span>
                      {context.maxLength && (
                        <span className="tabular-nums text-slate-400">
                          {comment.length}/{context.maxLength}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="dart-action-link min-h-[44px] rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
          >
            ← {backLabel}
          </button>
        ) : (
          <div />
        )}
        <GlassButton variant="primary" disabled={!canConfirm} onClick={handleConfirm}>
          {confirmLabel}
        </GlassButton>
      </div>
    </div>
  );
}
