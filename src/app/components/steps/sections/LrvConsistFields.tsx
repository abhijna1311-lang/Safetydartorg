import { AnimatePresence, motion } from 'motion/react';
import type { AccidentReportData } from '../../../types/accident-report';

interface Props {
  data: AccidentReportData;
  onUpdate: (d: Partial<AccidentReportData>) => void;
  showErrors?: boolean;
}

const CONSIST_KEYS = ['lrv_consist_1', 'lrv_consist_2', 'lrv_consist_3', 'lrv_consist_4'] as const;
const COUNT_OPTIONS = [1, 2, 3, 4];
// Static class strings so Tailwind can extract them at build time.
const COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
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

// Groups the "how many LRVs" picker with the LRV number inputs so they read as one unit,
// not a count that dangles above an isolated number field.
export function LrvConsistFields({ data, onUpdate, showErrors = false }: Props) {
  const count = data.lrv_consist_count ?? 0;

  const setCount = (next: number) => {
    const clear: Partial<AccidentReportData> = {};
    CONSIST_KEYS.slice(next).forEach(k => { clear[k] = undefined; });
    onUpdate({ lrv_consist_count: next, ...clear });
  };

  const countMissing = showErrors && count === 0;

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
          <label className="dart-field-label text-slate-500">
            LRV numbers
          </label>
          <AnimatePresence mode="wait" initial={false}>
            {count === 0 ? (
              <motion.p
                {...rowFade}
                key="empty"
                className="h-11 flex items-center text-xs text-slate-400 font-['Poppins']"
              >
                Pick a count to enter each LRV number.
              </motion.p>
            ) : (
              <motion.div
                {...rowFade}
                key={`inputs-${count}`}
                className={`grid grid-cols-1 gap-2.5 ${COLS_CLASS[count]}`}
              >
                {CONSIST_KEYS.slice(0, count).map((key, i) => (
                  <div key={key}>
                    <input
                      type="text"
                      value={(data[key] as string) || ''}
                      onChange={e => onUpdate({ [key]: e.target.value })}
                      placeholder={`LRV ${i + 1} #`}
                      aria-label={`LRV ${i + 1} number`}
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
