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
  const base =
    "flex-1 px-4 py-2.5 rounded-lg border-2 text-sm transition-all font-['Poppins'] min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,32,91,0.16)] focus-visible:border-[#00205B]";
  const active = 'border-[#00205B] bg-[#EAF1F8] text-[#00205B] font-semibold';
  const inactive =
    'border-[#CBD5E1] bg-white text-[#334155] hover:border-[#94A3B8] hover:bg-[#F8FAFC]';

  return (
    <div className="flex gap-3">
      <button type="button" onClick={() => onChange(true)} className={`${base} ${value === true ? active : inactive}`}>
        {yesLabel}
      </button>
      <button type="button" onClick={() => onChange(false)} className={`${base} ${value === false ? active : inactive}`}>
        {noLabel}
      </button>
    </div>
  );
}
