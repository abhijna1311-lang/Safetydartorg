export const DAMAGE_AREA_GROUPS: { label: string; items: string[] }[] = [
  { label: 'Body', items: ['Front', 'Rear', 'Left Side', 'Right Side', 'Top', 'Underbody'] },
  { label: 'Wheels', items: ['Front Wheel Left', 'Front Wheel Right', 'Rear Wheel Left', 'Rear Wheel Right'] },
];

export function DamageAreaChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (item: string) => {
    if (value.includes(item)) onChange(value.filter((x) => x !== item));
    else onChange([...value, item]);
  };
  return (
    <div className="space-y-3">
      {DAMAGE_AREA_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 min-w-[42px] text-[10px] font-semibold uppercase tracking-wide text-slate-400 font-['Poppins']">
            {group.label}
          </span>
          {group.items.map((item) => {
            const selected = value.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium font-['Poppins'] transition-all ${
                  selected
                    ? 'border-[#112458] bg-[#112458] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#b7cadd] hover:bg-slate-50'
                }`}
              >
                {selected && <span className="material-symbols-rounded text-[14px]" aria-hidden="true">check</span>}
                {item}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
