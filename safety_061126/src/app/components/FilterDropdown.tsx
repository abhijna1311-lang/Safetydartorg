import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  /** Optional dot colour class e.g. "bg-emerald-500" */
  color?: string;
}

interface FilterDropdownProps {
  /** Short label shown before the value e.g. "Status" */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  icon?: React.ReactNode;
}

export function FilterDropdown({ label, value, onChange, options, icon }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);
  const isFiltered = value !== 'all' && value !== '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(options.findIndex(o => o.value === value) ?? 0);
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(options.length - 1);
        break;
    }
  };

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && panelRef.current) {
      const el = panelRef.current.children[focusedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex, isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { setIsOpen(v => !v); setFocusedIndex(options.findIndex(o => o.value === value)); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          inline-flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-200
          font-['Poppins'] text-sm whitespace-nowrap min-h-[36px]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,32,91,0.16)]
          ${isOpen || isFiltered
            ? 'border-[#00205B] bg-[#EAF1F8] text-[#00205B] shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
          }
        `}
      >
        {/* Optional leading icon */}
        {icon && (
          <span className={`flex-shrink-0 ${isOpen || isFiltered ? 'text-[#00205B]' : 'text-slate-400'}`}>
            {icon}
          </span>
        )}

        {/* Label prefix */}
        <span className={`text-xs font-medium ${isOpen || isFiltered ? 'text-[#00205B]' : 'text-slate-400'}`}>
          {label}:
        </span>

        {/* Selected value with optional dot */}
        <span className="flex items-center gap-1.5">
          {selected?.color && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.color}`} />
          )}
          <span className={`font-medium ${isOpen || isFiltered ? 'text-[#00205B]' : 'text-slate-700'}`}>
            {selected?.label ?? label}
          </span>
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#00205B]' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          ref={panelRef}
          role="listbox"
          className="absolute z-50 top-[calc(100%+6px)] left-0 min-w-[180px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.10),0_2px_8px_-2px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="py-1.5 sleek-scrollbar max-h-[260px] overflow-y-auto">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => { onChange(option.value); setIsOpen(false); buttonRef.current?.focus(); }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`
                    w-full px-4 py-2.5 flex items-center gap-3 text-sm font-['Poppins'] text-left
                    transition-colors duration-100
                    ${isSelected
                      ? 'bg-[#EAF1F8] text-[#00205B]'
                      : isFocused
                        ? 'bg-slate-50 text-slate-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  {/* Status dot */}
                  <span className="w-5 flex items-center justify-center flex-shrink-0">
                    {option.color
                      ? <span className={`w-2 h-2 rounded-full ${option.color}`} />
                      : null
                    }
                  </span>

                  <span className={`flex-1 ${isSelected ? 'font-medium' : ''}`}>
                    {option.label}
                  </span>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#00205B] flex-shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
