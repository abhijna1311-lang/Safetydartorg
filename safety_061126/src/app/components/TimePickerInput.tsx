import { useState, useRef, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerInputProps {
  value: string; // HH:MM (24-hr)
  onChange: (value: string) => void;
  placeholder?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10..55

function parse24(val: string): { h12: number; minute: number; period: 'AM' | 'PM' } {
  if (!val) return { h12: 12, minute: 0, period: 'AM' };
  const [hStr, mStr] = val.split(':');
  const h24 = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  // snap minute to nearest 5
  const snappedMinute = Math.round(m / 5) * 5;
  return { h12, minute: snappedMinute % 60, period };
}

function to24(h12: number, minute: number, period: 'AM' | 'PM'): string {
  let h24 = h12;
  if (period === 'AM' && h12 === 12) h24 = 0;
  else if (period === 'PM' && h12 !== 12) h24 = h12 + 12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const emit = useCallback(
    (h: number, m: number, p: 'AM' | 'PM') => {
      onChange(to24(h, m, p));
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

  const handleNow = () => {
    const now = new Date();
    const h24 = now.getHours();
    const snapped = Math.round(now.getMinutes() / 5) * 5;
    onChange(
      `${String(h24).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`
    );
    setIsOpen(false);
  };

  const displayValue = value
    ? `${String(selHour).padStart(2, '0')}:${String(selMinute).padStart(2, '0')} ${selPeriod}`
    : '';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open time picker"
        className={[
          'w-full px-4 py-3 rounded-xl border bg-white shadow-sm transition-all min-h-[44px]',
          'flex items-center justify-between gap-2 font-[\'Poppins\'] text-sm text-left',
          isOpen
            ? 'border-[#00205B] ring-2 ring-[rgba(0,32,91,0.16)]'
            : 'border-slate-200 hover:border-slate-300',
          'focus:outline-none focus-visible:border-[#00205B] focus-visible:ring-2 focus-visible:ring-[rgba(0,32,91,0.16)]',
        ].join(' ')}
      >
        <span className={displayValue ? 'text-slate-900' : 'text-slate-400'}>
          {displayValue || placeholder}
        </span>
        <Clock
          className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
            isOpen ? 'text-[#00205B]' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Time picker popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_20px_48px_-8px_rgba(0,0,0,0.08)] p-4 w-[220px]">
          {/* Column headers + scrollable lists */}
          <div className="flex gap-1 items-start">
            <ScrollColumn
              items={HOURS}
              selected={selHour}
              onSelect={handleHour}
              label="Hr"
              formatItem={(v) => String(v).padStart(2, '0')}
            />

            {/* Separator */}
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

            {/* Thin divider */}
            <div className="w-px bg-slate-100 self-stretch mx-1 mt-6" />

            {/* AM / PM toggle */}
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

          {/* Now shortcut */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={handleNow}
              className="text-xs text-[#00205B] font-['Poppins'] hover:underline px-2 py-1 rounded transition-colors hover:bg-[#EAF1F8]"
            >
              Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
