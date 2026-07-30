import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

interface TimePickerInputProps {
  value: string; // HH:MM (24-hr)
  onChange: (value: string) => void;
  placeholder?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // exact minute, 0..59

function parse24(val: string): { h12: number; minute: number; period: 'AM' | 'PM' } {
  if (!val) return { h12: 12, minute: 0, period: 'AM' };
  const [hStr, mStr] = val.split(':');
  const h24 = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { h12, minute: Math.min(Math.max(m, 0), 59), period };
}

function to24(h12: number, minute: number, period: 'AM' | 'PM'): string {
  let h24 = h12;
  if (period === 'AM' && h12 === 12) h24 = 0;
  else if (period === 'PM' && h12 !== 12) h24 = h12 + 12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatDisplay(val: string) {
  if (!val) return '';
  const { h12, minute, period } = parse24(val);
  return `${String(h12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

function parseTypedTime(input: string): string | null {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, ' ');
  const twelveHour = normalized.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/);
  if (twelveHour) {
    const hour = Number(twelveHour[1]);
    if (hour < 1 || hour > 12) return null;
    return to24(hour, Number(twelveHour[2]), twelveHour[3] as 'AM' | 'PM');
  }

  const twentyFourHour = normalized.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHour) {
    return `${String(Number(twentyFourHour[1])).padStart(2, '0')}:${twentyFourHour[2]}`;
  }

  return null;
}

interface ScrollColumnProps {
  items: (string | number)[];
  selected: string | number;
  onSelect: (item: string | number) => void;
  label: string;
  formatItem?: (item: string | number) => string;
}

function ScrollColumn({ items, selected, onSelect, label, formatItem }: ScrollColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view when opened or selection changes
  useEffect(() => {
    if (!listRef.current) return;
    const idx = items.indexOf(selected);
    if (idx === -1) return;
    const child = listRef.current.children[idx] as HTMLElement;
    if (child) {
      child.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selected, items]);

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <span className="text-[11px] font-medium text-slate-400 font-['Poppins'] mb-2 uppercase tracking-wide">
        {label}
      </span>
      <div
        ref={listRef}
        className="h-[188px] overflow-y-auto w-full space-y-0.5 pr-0.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((item) => {
          const display = formatItem ? formatItem(item) : String(item);
          const isSelected = item === selected;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={[
                'w-full py-2 rounded-lg text-sm font-[\'Poppins\'] transition-all text-center leading-none',
                isSelected
                  ? 'bg-[#EAF1F8] text-[#00205B] font-semibold ring-1 ring-inset ring-[#00205B]'
                  : 'text-slate-600 hover:bg-[#EAF1F8] hover:text-[#00205B]',
              ].join(' ')}
              aria-pressed={isSelected}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TimePickerInput({
  value,
  onChange,
  placeholder = 'HH:MM AM',
}: TimePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(formatDisplay(value));
  const [inputError, setInputError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({ top: 0, left: 0, width: 0, openUpward: false });

  const POPOVER_HEIGHT = 360;

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < POPOVER_HEIGHT + 12 && spaceAbove > spaceBelow;
    setPopoverPos({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      openUpward,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    calcPos();
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [isOpen, calcPos]);

  const { h12, minute, period } = parse24(value);
  const [selHour, setSelHour] = useState(h12);
  const [selMinute, setSelMinute] = useState(minute);
  const [selPeriod, setSelPeriod] = useState<'AM' | 'PM'>(period);

  // Sync local state when external value changes
  useEffect(() => {
    const p = parse24(value);
    setSelHour(p.h12);
    setSelMinute(p.minute);
    setSelPeriod(p.period);
    setInputValue(formatDisplay(value));
    setInputError(false);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const emit = useCallback(
    (h: number, m: number, p: 'AM' | 'PM') => {
      const nextValue = to24(h, m, p);
      onChange(nextValue);
      setInputValue(formatDisplay(nextValue));
      setInputError(false);
    },
    [onChange]
  );

  const handleHour = (item: string | number) => {
    const h = item as number;
    setSelHour(h);
    emit(h, selMinute, selPeriod);
  };

  const handleMinute = (item: string | number) => {
    const m = item as number;
    setSelMinute(m);
    emit(selHour, m, selPeriod);
  };

  const handlePeriod = (item: string | number) => {
    const p = item as 'AM' | 'PM';
    setSelPeriod(p);
    emit(selHour, selMinute, p);
  };

  const handleConfirm = () => {
    emit(selHour, selMinute, selPeriod);
    setIsOpen(false);
  };

  const commitTypedTime = () => {
    if (!inputValue.trim()) {
      setInputError(false);
      return true;
    }
    const parsed = parseTypedTime(inputValue);
    if (!parsed) {
      setInputError(true);
      return false;
    }
    onChange(parsed);
    setInputValue(formatDisplay(parsed));
    setInputError(false);
    return true;
  };

  const popover = isOpen ? (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: popoverPos.openUpward ? undefined : popoverPos.top,
        bottom: popoverPos.openUpward ? window.innerHeight - popoverPos.top : undefined,
        left: popoverPos.left,
        width: popoverPos.width,
        zIndex: 9999,
      }}
      className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_20px_48px_-8px_rgba(0,0,0,0.08)] p-4"
    >
      <div className="flex gap-1 items-start">
        <ScrollColumn
          items={HOURS}
          selected={selHour}
          onSelect={handleHour}
          label="Hr"
          formatItem={(v) => String(v).padStart(2, '0')}
        />

        <div className="flex items-center justify-center pt-8 text-slate-300 text-base font-semibold select-none px-0.5">
          :
        </div>

        <ScrollColumn
          items={MINUTES}
          selected={selMinute}
          onSelect={handleMinute}
          label="Min"
          formatItem={(v) => String(v).padStart(2, '0')}
        />

        <div className="w-px bg-slate-100 self-stretch mx-1 mt-6" />

        <div className="flex flex-col items-center w-12 flex-shrink-0">
          <span className="text-[11px] font-medium text-slate-400 font-['Poppins'] mb-2 uppercase tracking-wide">
            &nbsp;
          </span>
          <div className="flex flex-col gap-1 mt-0.5">
            {(['AM', 'PM'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriod(p)}
                className={[
                  'w-full px-2 py-2 rounded-lg text-sm font-[\'Poppins\'] transition-all text-center leading-none',
                  selPeriod === p
                    ? 'bg-[#EAF1F8] text-[#00205B] font-semibold ring-1 ring-inset ring-[#00205B]'
                    : 'text-slate-600 hover:bg-[#EAF1F8] hover:text-[#00205B]',
                ].join(' ')}
                aria-pressed={selPeriod === p}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={handleConfirm}
          className="dart-press flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[#00205B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003478] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00205B]/40 font-['Poppins']"
        >
          OK
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Editable trigger: operators can type an exact minute or open the picker. */}
      <div
        ref={triggerRef}
        className={[
          'w-full px-4 py-3 rounded-xl border bg-white shadow-sm transition-all min-h-[44px]',
          'flex items-center justify-between gap-2 font-[\'Poppins\'] text-sm text-left',
          inputError
            ? 'border-red-400 ring-2 ring-red-100'
            : isOpen
            ? 'border-[#00205B] ring-2 ring-[rgba(0,32,91,0.16)]'
            : 'border-slate-200 hover:border-slate-300',
          'focus-within:border-[#00205B] focus-within:ring-2 focus-within:ring-[rgba(0,32,91,0.16)]',
        ].join(' ')}
      >
        <input
          type="text"
          inputMode="text"
          value={inputValue}
          onChange={(event) => {
            const nextInput = event.target.value;
            setInputValue(nextInput);
            setInputError(false);
            if (!nextInput.trim() && value) onChange('');
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => commitTypedTime()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && commitTypedTime()) {
              setIsOpen(false);
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              setInputValue(formatDisplay(value));
              setInputError(false);
              setIsOpen(false);
              event.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
          aria-label="Time. Enter as hour, minute, AM or PM"
          aria-invalid={inputError}
          className="min-w-0 flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? 'Close time picker' : 'Open time picker'}
          className="-m-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#EAF1F8] hover:text-[#00205B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,32,91,0.2)]"
        >
          <Clock className={`h-[18px] w-[18px] ${isOpen ? 'text-[#00205B]' : ''}`} />
        </button>
      </div>
      {inputError && (
        <p className="mt-1.5 text-xs font-medium text-red-600 font-['Poppins']">
          Enter a valid time, such as 2:47 PM.
        </p>
      )}

      {typeof document !== 'undefined' && createPortal(popover, document.body)}
    </div>
  );
}
