// Compact KPI tile used in the "People and Impact" step by Operator, Field Supervisor, and Safety Program Manager flows.
export function PeopleImpactSummaryCard({ glyph, tone, total, label, parts }: {
  glyph: string;
  tone: string;
  total: number;
  label: string;
  parts?: { key: string; glyph: string; title: string; value: number }[];
}) {
  const partCount = parts?.length ?? 0;
  const gridColsClass = partCount === 4 ? 'grid-cols-4' : partCount === 2 ? 'grid-cols-2' : 'grid-cols-3';
  const partPxClass = partCount === 4 ? 'px-3' : 'px-6';
  return (
    <div className="h-full rounded-xl border border-slate-200/70 bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
            <span className="material-symbols-rounded text-[19px]">{glyph}</span>
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-none text-slate-800 font-['Poppins'] dart-tabular">{total}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 font-['Poppins']">{label}</p>
          </div>
        </div>
        {parts && parts.length > 0 && (
          <div className={`ml-auto grid ${gridColsClass} divide-x divide-slate-100 border-l border-slate-100 pl-2`}>
            {parts.map(p => (
              <div key={p.key} aria-label={p.title} className={`group relative flex flex-col items-center gap-0.5 ${partPxClass}`}>
                <span className={`material-symbols-rounded text-[15px] ${p.value > 0 ? 'text-[#1c3570]' : 'text-slate-300'}`}>{p.glyph}</span>
                <span className={`text-[13px] font-semibold font-['Poppins'] dart-tabular ${p.value > 0 ? 'text-slate-700' : 'text-slate-300'}`}>{p.value}</span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 font-['Poppins']">
                  {p.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
