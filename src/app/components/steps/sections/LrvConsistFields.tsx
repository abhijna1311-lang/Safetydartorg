import { AnimatePresence, motion } from 'motion/react';
import type { AccidentReportData } from '../../../types/accident-report';

type ConsistKey = keyof AccidentReportData;

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  showErrors?: boolean;
  // Field-key overrides so the same UX can drive Operator OR Field Supervisor state.
  countKey?: ConsistKey;
  additionalKeys?: readonly [ConsistKey, ConsistKey, ConsistKey];
  leadNumber?: string;
}

const DEFAULT_COUNT_KEY: ConsistKey = 'lrv_consist_count';
const DEFAULT_ADDITIONAL_KEYS = ['lrv_consist_2', 'lrv_consist_3', 'lrv_consist_4'] as const;
const COUNT_OPTIONS = [1, 2, 3, 4];
// Static class strings so Tailwind can extract them at build time.
const STRIP_COLS_CLASS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

const inputCls = 'dart-input-base';

const rowFade = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 },
};

// Count = 1 means the LRV from the top field is the entire consist.
// The strip always shows the lead LRV as a read-only pill, then editable slots for the rest.
export function LrvConsistFields({
  data,
  onUpdate,
  showErrors = false,
  countKey = DEFAULT_COUNT_KEY,
  additionalKeys = DEFAULT_ADDITIONAL_KEYS,
  leadNumber,
}: Props) {
  const count = (data[countKey] as number | undefined) ?? 0;
  const resolvedLead = leadNumber !== undefined ? leadNumber : (data.train_number || '');

  const setCount = (next: number) => {
    const extras = Math.max(0, next - 1);
    const clear: Partial<AccidentReportData> = {};
    additionalKeys.slice(extras).forEach(k => { clear[k] = undefined; });
    onUpdate({ [countKey]: next, ...clear });
  };

  const countMissing = showErrors && count === 0;
  const leadLabel = resolvedLead || 'Pick the LRV above';

  return (
    <div className={`rounded-xl border bg-slate-50/60 px-4 py-3.5 md:px-5 ${countMissing ? 'border-red-300' : 'border-slate-200'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:w-[220px] md:shrink-0">
          <label className="dart-field-label">
            LRVs in consist <span className="dart-req">*</span>
          </label>
          <div role="radiogroup" aria-label="How many LRVs are in the consist" className="flex gap-2">
            {COUNT_OPTIONS.map(n => {
              const selected = count === n;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCount(n)}
                  className={`flex-1 h-11 min-w-[44px] rounded-lg border-2 text-sm font-['Poppins'] transition-all focus:outline-none focus:ring-2 focus:ring-[rgba(0,32,91,0.16)] ${
                    selected
                      ? 'border-[#00205B] bg-[#EAF1F8] text-[#00205B] font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <label className="dart-field-label text-slate-500">Consist</label>
          <AnimatePresence mode="wait" initial={false}>
            {count === 0 ? (
              <motion.p
                {...rowFade}
                key="empty"
                className="h-11 flex items-center text-xs text-slate-400 font-['Poppins']"
              >
                Pick a count to complete the consist.
              </motion.p>
            ) : (
              <motion.div
                {...rowFade}
                key={`strip-${count}`}
                className={`grid grid-cols-1 gap-2.5 ${STRIP_COLS_CLASS[count]}`}
              >
                {/* Lead LRV — read-only, mirrors the top field. */}
                <div
                  aria-label={`LRV 1 (lead): ${resolvedLead || 'not selected'}`}
                  className={`h-11 rounded-lg border px-3 flex items-center gap-2 font-['Poppins'] text-sm ${
                    resolvedLead
                      ? 'border-[#00205B]/25 bg-[#EAF1F8] text-[#00205B]'
                      : 'border-dashed border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Lead</span>
                  <span className="dart-tabular truncate">{leadLabel}</span>
                </div>

                {additionalKeys.slice(0, Math.max(0, count - 1)).map((key, i) => (
                  <div key={key}>
                    <input
                      type="text"
                      value={(data[key] as string) || ''}
                      onChange={e => onUpdate({ [key]: e.target.value })}
                      placeholder={`LRV ${i + 2} #`}
                      aria-label={`LRV ${i + 2} number`}
                      className={`${inputCls} ${showErrors && !data[key] ? '!border-red-400' : ''}`}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
