import { Check } from 'lucide-react';

interface YesNoToggleProps {
  value: boolean | undefined;
  onChange: (val: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}

export function YesNoToggle({
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
}: YesNoToggleProps) {
  return (
    <div className="dart-seg">
      <button type="button" onClick={() => onChange(true)} className={`dart-seg-btn ${value === true ? 'dart-seg-btn--on' : ''}`}>
        <Check className={`w-[15px] h-[15px] shrink-0 transition-opacity duration-150 ${value === true ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2.5} aria-hidden />
        {yesLabel}
        <span className="w-[15px] shrink-0" aria-hidden />
      </button>
      <button type="button" onClick={() => onChange(false)} className={`dart-seg-btn ${value === false ? 'dart-seg-btn--on' : ''}`}>
        <Check className={`w-[15px] h-[15px] shrink-0 transition-opacity duration-150 ${value === false ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2.5} aria-hidden />
        {noLabel}
        <span className="w-[15px] shrink-0" aria-hidden />
      </button>
    </div>
  );
}
