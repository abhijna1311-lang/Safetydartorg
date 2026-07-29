import { useState, useRef, useEffect } from 'react';
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
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'MM/DD/YYYY',
  align = 'left',
}: DatePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate)),
    end: endOfWeek(endOfMonth(viewDate)),
  });

  const handleSelect = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setViewDate(day);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    onChange(format(today, 'yyyy-MM-dd'));
    setViewDate(today);
    setIsOpen(false);
  };

  const displayValue = validSelected ? format(validSelected, 'MM/dd/yyyy') : '';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
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

      {/* Calendar popover */}
      {isOpen && (
        <div className={`absolute z-50 mt-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_20px_48px_-8px_rgba(0,0,0,0.08)] p-4 w-[296px]`}>
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

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={[
                    'aspect-square flex items-center justify-center rounded-lg text-[13px] font-[\'Poppins\'] transition-all',
                    !inMonth ? 'text-slate-300 hover:bg-slate-50' : '',
                    selected
                      ? 'bg-[#EAF1F8] text-[#00205B] font-semibold ring-1 ring-inset ring-[#00205B]'
                      : inMonth
                      ? 'text-slate-700 hover:bg-[#EAF1F8] hover:text-[#00205B]'
                      : '',
                    todayFlag && !selected
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
      )}
    </div>
  );
}
