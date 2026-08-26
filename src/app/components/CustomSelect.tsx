import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Lock } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; group?: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

const DROPDOWN_MAX_H = 288; // matches max-h-[288px] below

export function CustomSelect({ value, onChange, options, placeholder = 'Select...', className = '', disabled = false, error = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0, openUpward: false });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  const groupOrder = new Map<string, number>();
  options.forEach(option => {
    if (option.group && !groupOrder.has(option.group)) groupOrder.set(option.group, groupOrder.size);
  });
  const sortedOptions = [...options].sort((a, b) => {
    const groupDifference = (groupOrder.get(a.group || '') ?? -1) - (groupOrder.get(b.group || '') ?? -1);
    return groupDifference || a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
  });
  const selectedOption = sortedOptions.find(opt => opt.value === value);

  // Calculate portal position from the trigger button rect
  const calcPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < DROPDOWN_MAX_H + 8 && spaceAbove > spaceBelow;
    setPos({
      top:        openUpward ? rect.top - 4  : rect.bottom + 4,
      left:       rect.left,
      width:      rect.width,
      openUpward,
    });
  }, []);

  const open = () => {
    calcPos();
    setIsOpen(true);
    setFocusedIndex(selectedOption ? sortedOptions.findIndex(o => o.value === value) : 0);
  };

  const close = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', handler);
    // Reposition on scroll / resize
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [isOpen, calcPos]);

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && panelRef.current) {
      const el = panelRef.current.querySelector(`[data-option-index="${focusedIndex}"]`) as HTMLElement | null;
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        open();
      }
      return;
    }
    switch (e.key) {
      case 'Escape':    e.preventDefault(); close(); buttonRef.current?.focus(); break;
      case 'ArrowDown': e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, sortedOptions.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); break;
      case 'Home':      e.preventDefault(); setFocusedIndex(0); break;
      case 'End':       e.preventDefault(); setFocusedIndex(sortedOptions.length - 1); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) { onChange(sortedOptions[focusedIndex].value); close(); buttonRef.current?.focus(); }
        break;
    }
  };

  const dropdown = isOpen ? (
    <div
      ref={panelRef}
      role="listbox"
      style={{
        position:  'fixed',
        top:       pos.openUpward ? undefined : pos.top,
        bottom:    pos.openUpward ? window.innerHeight - pos.top : undefined,
        left:      pos.left,
        width:     pos.width,
        zIndex:    9999,
      }}
      className="bg-white rounded-xl shadow-[0_8px_24px_-4px_rgba(0,0,0,0.10),0_16px_40px_-8px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden"
    >
      <div className="max-h-[288px] overflow-y-auto py-1">
        {sortedOptions.map((option, index) => {
          const isSelected = option.value === value;
          const isFocused  = index === focusedIndex;
          return (
            <div key={option.value}>
              {(index === 0 || option.group !== sortedOptions[index - 1]?.group) && option.group && (
                <div role="presentation" className="flex items-center gap-2 px-3.5 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0078AE]">
                  <span>{option.group}</span>
                  <span className="h-px flex-1 bg-[#dbe4ee]" />
                </div>
              )}
              <button
                data-option-index={index}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setFocusedIndex(index)}
                onMouseDown={e => {
                  e.preventDefault(); // prevent blur before click
                  onChange(option.value);
                  close();
                  buttonRef.current?.focus();
                }}
                className={`
                  w-full px-3.5 py-2.5 min-h-[38px] flex items-start gap-2.5
                  text-sm font-['Poppins'] text-left transition-colors
                  ${isSelected ? 'text-[#00205B] font-semibold bg-[#EAF1F8]' : 'text-slate-700'}
                  ${isFocused && !isSelected ? 'bg-slate-50' : ''}
                  hover:bg-slate-50
                `}
              >
                <div className="w-4 h-5 flex items-center justify-center flex-shrink-0">
                  {isSelected && <Check className="w-4 h-4 text-[#00205B]" strokeWidth={2.5} />}
                </div>
                <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">{option.label}</span>
              </button>
            </div>
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
        onClick={() => isOpen ? close() : open()}
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
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? (disabled ? 'text-slate-600' : 'text-slate-900') : 'text-slate-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {disabled ? (
          <Lock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
        ) : (
          <ChevronDown
            className={`w-4 h-4 transition-all duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-[#00205B]' : 'text-slate-400'}`}
          />
        )}
      </button>

      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
