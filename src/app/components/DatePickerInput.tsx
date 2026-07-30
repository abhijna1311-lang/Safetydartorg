import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';

interface DatePickerInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
  maxDate?: Date;
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'MM/DD/YYYY',
  align = 'left',
  maxDate,
}: DatePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const validSelected = selectedDate && isValid(selectedDate) ? selectedDate : null;

  const [viewDate, setViewDate] = useState<Date>(validSelected ?? new Date());

  // keep viewDate in sync when value changes externally
  useEffect(() => {
    if (validSelected) setViewDate(validSelected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate)),
    end: endOfWeek(endOfMonth(viewDate)),
  });

  const handleSelect = (day: Date) => {
    if (maxDate && day > maxDate) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setViewDate(day);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    if (maxDate && today > maxDate) return;
    onChange(format(today, 'yyyy-MM-dd'));
    setViewDate(today);
    setIsOpen(false);
  };

  const displayValue = validSelected ? format(validSelected, 'MM/dd/yyyy') : '';

  const popover = isOpen ? (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: popoverPos.openUpward ? undefined : popoverPos.top,
        bottom: popoverPos.openUpward ? window.innerHeight - popoverPos.top : undefined,
        left: popoverPos.left,
        width: Math.max(popoverPos.width, 296),
        zIndex: 9999,
      }}
      className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_20px_48px_-8px_rgba(0,0,0,0.08)] p-4"
    >
      {/* Month / Year header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800 font-['Poppins'] select-none">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium text-slate-400 font-['Poppins'] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {calendarDays.map((day, idx) => {
          const inMonth = isSameMonth(day, viewDate);
          const selected = validSelected ? isSameDay(day, validSelected) : false;
          const todayFlag = isToday(day);
          const disabled = Boolean(maxDate && day > maxDate);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(day)}
              disabled={disabled}
              aria-disabled={disabled}
              className={[
                'aspect-square flex items-center justify-center rounded-lg text-[13px] font-[\'Poppins\'] transition-all',
                disabled ? 'text-slate-300 cursor-not-allowed opacity-60' : '',
                !inMonth && !disabled ? 'text-slate-300 hover:bg-slate-50' : '',
                !disabled && selected
                  ? 'bg-[#EAF1F8] text-[#00205B] font-semibold ring-1 ring-inset ring-[#00205B]'
                  : !disabled && inMonth
                  ? 'text-slate-700 hover:bg-[#EAF1F8] hover:text-[#00205B]'
                  : '',
                !disabled && todayFlag && !selected
                  ? 'ring-1 ring-inset ring-[#00205B] font-semibold text-[#00205B]'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={format(day, 'MMMM d, yyyy')}
              aria-pressed={selected}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
        <button
          type="button"
          onClick={handleToday}
          className="text-xs text-[#00205B] font-['Poppins'] hover:underline px-2 py-1 rounded transition-colors hover:bg-[#EAF1F8]"
        >
          Today
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open date picker"
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
        <Calendar
          className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
            isOpen ? 'text-[#00205B]' : 'text-slate-400'
          }`}
        />
      </button>

      {typeof document !== 'undefined' && createPortal(popover, document.body)}
    </div>
  );
}
