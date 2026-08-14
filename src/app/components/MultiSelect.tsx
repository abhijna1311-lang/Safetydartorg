import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option { value: string; label: string }

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

interface DropdownPos { top: number; left: number; width: number; openUpward: boolean }

const DROPDOWN_MAX_H = 320;

// Multi-select variant of CustomSelect: portal-rendered popover, checkbox toggle rows,
// closes on outside click / Escape (not on each pick, so users can grab several areas at once).
export function MultiSelect({ value, onChange, options, placeholder = 'Select…', className = '', disabled = false, error = false }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0, openUpward: false });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const sortedOptions = [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
  const selectedLabels = sortedOptions.filter(o => value.includes(o.value)).map(o => o.label);

  const calcPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < DROPDOWN_MAX_H + 8 && spaceAbove > spaceBelow;
    setPos({
      top: openUpward ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUpward,
    });
  }, []);

  const open = () => {
    calcPos();
    setIsOpen(true);
    setFocusedIndex(0);
  };

  const close = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [isOpen, calcPos]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && panelRef.current) {
      const el = panelRef.current.querySelectorAll('[role="option"]')[focusedIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex, isOpen]);

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        open();
      }
      return;
    }
    switch (e.key) {
      case 'Escape': e.preventDefault(); close(); buttonRef.current?.focus(); break;
      case 'ArrowDown': e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, sortedOptions.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); break;
      case 'Home': e.preventDefault(); setFocusedIndex(0); break;
      case 'End': e.preventDefault(); setFocusedIndex(sortedOptions.length - 1); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) toggle(sortedOptions[focusedIndex].value);
        break;
    }
  };

  const buttonLabel = selectedLabels.length === 0
    ? placeholder
    : selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;

  const dropdown = isOpen ? (
    <div
      ref={panelRef}
      role="listbox"
      aria-multiselectable
      style={{
        position: 'fixed',
        top: pos.openUpward ? undefined : pos.top,
        bottom: pos.openUpward ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-[0_8px_24px_-4px_rgba(0,0,0,0.10),0_16px_40px_-8px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/70">
        <span className="text-[11px] font-semibold text-slate-500 font-['Poppins']">
          {value.length === 0 ? 'Select one or more' : `${value.length} selected`}
        </span>
        {value.length > 0 && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onChange([]); }}
            className="text-[11px] font-semibold text-[#007DBA] hover:text-[#00205B] font-['Poppins']"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-h-[288px] overflow-y-auto py-1">
            {sortedOptions.map((option, index) => {
          const isSelected = value.includes(option.value);
          const isFocused = index === focusedIndex;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setFocusedIndex(index)}
              onMouseDown={e => { e.preventDefault(); toggle(option.value); }}
              className={`
                w-full px-3.5 py-2.5 min-h-[38px] flex items-start gap-2.5
                text-sm font-['Poppins'] text-left transition-colors
                ${isSelected ? 'text-[#00205B] font-semibold bg-[#EAF1F8]' : 'text-slate-700'}
                ${isFocused && !isSelected ? 'bg-slate-50' : ''}
                hover:bg-slate-50
              `}
            >
              <span
                aria-hidden
                className={`mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded border transition-colors ${
                  isSelected ? 'border-[#00205B] bg-[#00205B]' : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          w-full px-3.5 py-3 rounded-[11px] border-[1.5px] transition-all min-h-[44px]
          flex items-center justify-between gap-2
          font-['Poppins'] text-sm text-left shadow-[0_1px_2px_rgba(15,45,74,0.045)]
          ${disabled
            ? 'border-[#dbe4ee] bg-slate-50 cursor-not-allowed'
            : isOpen
            ? 'border-[#112458] bg-white ring-2 ring-[rgba(17,36,88,0.15)]'
            : error
            ? 'border-red-400 bg-white hover:border-red-500'
            : 'border-[#dbe4ee] bg-white hover:border-[#b7cadd]'
          }
          focus:outline-none focus-visible:border-[#112458] focus-visible:ring-2 focus-visible:ring-[rgba(17,36,88,0.15)]
        `}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedLabels.length > 0 ? 'text-slate-900' : 'text-slate-500'}`}>
          {buttonLabel}
        </span>
        <ChevronDown className={`w-4 h-4 transition-all duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-[#00205B]' : 'text-slate-400'}`} />
      </button>

      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
