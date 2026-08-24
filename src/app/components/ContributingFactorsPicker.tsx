import { useMemo, useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Eye,
  RotateCcw,
  ShieldAlert,
  X,
} from 'lucide-react';

// Category schema — factor strings must match the persisted values on AccidentReportData.
interface FactorCategory {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  factors: string[];
}

export const CONTRIBUTING_FACTOR_CATEGORIES: FactorCategory[] = [
  {
    id: 'attention',
    label: 'Driver Attention & Readiness',
    icon: Eye,
    factors: [
      'Cell Phone',
      'Consuming Food',
      'Earpiece',
      'Grooming/Personal Hygiene',
      'Paper',
      'Drowsy/ Falling Asleep',
    ],
  },
  {
    id: 'traffic',
    label: 'Traffic Control & Right of Way',
    icon: AlertTriangle,
    factors: [
      'Failure to obey a stop sign',
      'Disregarded a red traffic signal',
      'Unsafe Railroad Crossing',
      'Failure to Yield to Pedestrian(s)',
      'Failure to Yield to Vehicle(s)',
    ],
  },
  {
    id: 'maneuvers',
    label: 'Vehicle Maneuvers & Control',
    icon: RotateCcw,
    factors: [
      'Unsafe following',
      'Unsafe Lane Change/Merging/Passing',
      'Unsafe Braking',
      'Unsafe Turning',
    ],
  },
  {
    id: 'conduct',
    label: 'Driving Conduct & Safety',
    icon: ShieldAlert,
    factors: [
      'Speeding',
      'Competitive/Aggressive driving',
      'Driving with two hands off the wheel',
      'No Seatbelt',
    ],
  },
];

const RAIL_CONTRIBUTING_FACTOR_CATEGORIES: FactorCategory[] = [
  {
    id: 'rail-human-factors',
    label: 'Operations & Human Factors',
    icon: Eye,
    factors: [
      'Medically Related',
      'Operating Rule Violation/Human Factor',
      'Fatigue',
    ],
  },
  {
    id: 'rail-right-of-way',
    label: 'Right of Way & Public Interaction',
    icon: AlertTriangle,
    factors: ['Action of Motorist', 'Pedestrian Action', 'Trespasser'],
  },
  {
    id: 'rail-equipment',
    label: 'Equipment & Maintenance',
    icon: RotateCcw,
    factors: ['Equipment Failure', 'Poor Maintenance'],
  },
  {
    id: 'rail-safety-other',
    label: 'Passenger Safety & Other',
    icon: ShieldAlert,
    factors: [
      'Imprudent Patron Actions',
      'Slips and Falls',
      'Suicide',
      'Possible Criminal Conduct',
      'Other/TBD',
      'No contributing factor identified',
    ],
  },
];

// Flat list mirrors the pre-existing PROGRAM_MANAGER_CONTRIBUTING_FACTORS shape.
export const CONTRIBUTING_FACTORS_FLAT = CONTRIBUTING_FACTOR_CATEGORIES.flatMap(c => c.factors);

interface Props {
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  mode?: string;
}

export function ContributingFactorsPicker({ selected, onSelectedChange, mode }: Props) {
  const isRailMode = mode === 'Light Rail Vehicle' || mode === 'Streetcar' || mode === 'Hi-Rail';
  const factorCategories = isRailMode ? RAIL_CONTRIBUTING_FACTOR_CATEGORIES : CONTRIBUTING_FACTOR_CATEGORIES;
  const availableFactors = useMemo(() => new Set(factorCategories.flatMap(category => category.factors)), [factorCategories]);
  const visibleSelected = selected.filter(factor => availableFactors.has(factor));
  // A category is always active — no empty-editor state.
  const [activeId, setActiveId] = useState<string>('attention');
  // Mobile review sheet (persistent summary is visible on desktop).
  const [showSheet, setShowSheet] = useState(false);

  const selectedSet = useMemo(() => new Set(visibleSelected), [visibleSelected]);
  const totalSelected = visibleSelected.length;

  const activeCategory =
    factorCategories.find(c => c.id === activeId) ??
    factorCategories[0];
  const ActiveIcon = activeCategory.icon;
  const activeSelectedInCat = activeCategory.factors.filter(f => selectedSet.has(f));

  const toggle = (factor: string) => {
    const next = new Set(selectedSet);
    if (next.has(factor)) {
      next.delete(factor);
    } else {
      next.add(factor);
    }
    onSelectedChange(Array.from(next));
  };

  const clearAll = () => {
    onSelectedChange([]);
  };

  const removeFactor = (factor: string) => {
    onSelectedChange(selected.filter(f => f !== factor));
  };

  // Shared chip renderer for the active-category panel.
  const renderChip = (factor: string) => {
    const isSelected = selectedSet.has(factor);
    return (
      <button
        key={factor}
        type="button"
        onClick={() => toggle(factor)}
        aria-pressed={isSelected}
        className={`dart-press group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all font-['Poppins'] ${
          isSelected
            ? 'border-[#00205B]/60 bg-[#00205B] text-white shadow-[0_6px_16px_-10px_rgba(0,32,91,0.5)]'
            : 'border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:border-[#00205B]/40 hover:bg-white hover:shadow-[0_4px_12px_-4px_rgba(15,23,42,0.15)]'
        }`}
      >
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
            isSelected
              ? 'border-white/40 bg-white/10 text-white'
              : 'border-slate-300 bg-white text-transparent group-hover:border-[#00205B]/50'
          }`}
        >
          <Check className={`h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] leading-snug">{factor}</span>
      </button>
    );
  };

  // Review drawer contents — grouped list of everything selected across all categories.
  const renderSummary = () => (
    <div className="font-['Poppins']">
      {totalSelected === 0 ? (
        <p className="px-5 py-8 text-[13px] leading-relaxed text-slate-500">
          Nothing selected yet. Pick a category and choose the factors that apply.
        </p>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {factorCategories.map(cat => {
              const chosen = cat.factors.filter(f => selectedSet.has(f));
              return (
                <div key={cat.id} className="px-5 py-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#00205B]/80">{cat.label}</div>
                    <div className={`text-[12px] font-semibold ${chosen.length > 0 ? 'text-[#00205B]' : 'text-slate-300'}`}>{chosen.length}</div>
                  </div>
                  {chosen.length === 0 ? (
                    <p className="mt-1.5 text-[12.5px] text-slate-400">None selected</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {chosen.map(f => (
                        <li key={f} className="group flex items-center gap-2 text-[13px] text-slate-700">
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#00205B]" strokeWidth={3} />
                          <span className="min-w-0 flex-1 truncate">{f}</span>
                          <button
                            type="button"
                            onClick={() => removeFactor(f)}
                            aria-label={`Remove ${f}`}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 focus:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-semibold text-slate-500 transition-colors hover:text-[#00205B]"
              >
                Clear all
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-[#EEF2F8] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_0_rgba(15,23,42,0.04)] sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#00205B] font-['Poppins'] leading-tight">Contributing Factors</h3>
          <p className="mt-0.5 text-xs text-slate-500 font-['Poppins']">Pick a category, then select all that apply.</p>
        </div>
        {/* Global review pill — the only place the full selected list lives. Compact even when there's nothing. */}
        {totalSelected > 0 ? (
          <button
            type="button"
            onClick={() => setShowSheet(true)}
            className="dart-press inline-flex items-center gap-1.5 rounded-full bg-[#00205B]/[0.10] px-3 py-1 text-xs font-semibold text-[#00205B] transition-colors hover:bg-[#00205B]/[0.14] font-['Poppins']"
          >
            Review {totalSelected} selected
            <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-200 font-['Poppins']">
            Not selected
          </span>
        )}
      </div>

      {/* Category navigation — cards carry the label and a count. No factor names, no preview. */}
      <div className="mt-4 grid grid-cols-1 items-start gap-2 sm:grid-cols-2 md:gap-3" role="tablist" aria-label="Contributing factor categories">
        {factorCategories.map((cat) => {
          const isActive = cat.id === activeId;
          const catSelectedCount = cat.factors.filter(f => selectedSet.has(f)).length;
          const hasSelection = catSelectedCount > 0;
          const CategoryIcon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(cat.id)}
              className={`dart-press relative flex items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left transition-all font-['Poppins'] ${
                isActive
                  ? 'border-[#8FACD1] bg-[#F7FAFF] shadow-[0_0_0_1px_rgba(22,57,120,0.08),0_6px_16px_rgba(22,57,120,0.07)]'
                  : 'border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-[#8FACD1]/70 hover:bg-[#F7FAFF]/60 hover:shadow-[0_4px_12px_-4px_rgba(15,23,42,0.12)]'
              }`}
            >
              {/* Active-state connector strip pointing at the editing workspace below */}
              {isActive && (
                <span aria-hidden className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-[3px] bg-[#163978]" />
              )}
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 transition-colors ${hasSelection ? 'bg-[#00205B]/[0.10] text-[#00205B] ring-[#00205B]/20' : isActive ? 'bg-[#00205B]/[0.06] text-[#00205B] ring-[#00205B]/15' : 'bg-slate-50 text-slate-500 ring-slate-200'}`}>
                <CategoryIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{cat.label}</span>
                <span className={`mt-0.5 block text-[12px] leading-none ${hasSelection ? 'font-semibold text-[#00205B]' : 'text-slate-400'}`}>
                  {hasSelection ? `${catSelectedCount} selected` : 'Not selected'}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Editing workspace — full width, wraps content. No sidebar to distort its height. */}
      <div className="relative mt-4 overflow-hidden rounded-xl border border-[#8FACD1] bg-gradient-to-b from-[#F7FAFF] to-white shadow-[0_0_0_1px_rgba(22,57,120,0.06),0_2px_6px_-2px_rgba(22,57,120,0.08)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeCategory.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <div className="flex items-start gap-2.5 border-b border-[#8FACD1]/40 bg-white/60 px-4 py-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#00205B]/[0.08] text-[#00205B] ring-1 ring-[#00205B]/15">
                <ActiveIcon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#00205B]/70 font-['Poppins']">Editing</div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                  <div className="text-sm font-semibold text-slate-800 font-['Poppins']">{activeCategory.label}</div>
                  {activeSelectedInCat.length > 0 && (
                    <span className="text-[11px] font-semibold text-[#00205B] font-['Poppins']">{activeSelectedInCat.length} selected</span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 font-['Poppins']">Select all that apply.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {activeCategory.factors.map(renderChip)}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Review drawer — right-side slide-in on desktop, effectively full-width on small screens */}
      <AnimatePresence>
        {showSheet && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={() => setShowSheet(false)}
          >
            <motion.div
              className="flex h-full w-full max-w-md flex-col bg-white shadow-[0_0_28px_rgba(15,23,42,0.18)]"
              initial={{ x: 32 }}
              animate={{ x: 0 }}
              exit={{ x: 32 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-baseline justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <div className="text-[15px] font-semibold text-slate-800 font-['Poppins']">Selected factors</div>
                  <p className="mt-0.5 text-[11px] text-slate-500 font-['Poppins']">Review your choices across every category.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#00205B] font-['Poppins']">{totalSelected}</span>
                  <button
                    type="button"
                    onClick={() => setShowSheet(false)}
                    aria-label="Close review"
                    className="dart-press grid h-7 w-7 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {renderSummary()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
