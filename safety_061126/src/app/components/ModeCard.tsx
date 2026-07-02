import { LucideIcon } from 'lucide-react';

interface ModeCardProps {
  icon: LucideIcon;
  label: string;
  sublabel: string;
  selected: boolean;
  onClick: () => void;
}

export function ModeCard({ icon: Icon, label, sublabel, selected, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-2xl transition-all duration-300 text-left min-h-[44px]
        ${selected 
          ? 'bg-[#00205B] border-2 border-[#00205B]' 
          : 'bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:bg-slate-50/50 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]'
        }
        focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(0,32,91,0.16)] focus-visible:ring-offset-2
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2.5 rounded-xl transition-all duration-300
          ${selected 
            ? 'bg-white/15 text-white' 
            : 'bg-slate-100/80 text-slate-600'
          }
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium font-['Poppins'] transition-colors ${selected ? 'text-white' : 'text-slate-900'}`}>
            {label}
          </div>
          <div className={`text-xs mt-0.5 font-['Poppins'] ${selected ? 'text-white/80' : 'text-slate-500'}`}>{sublabel}</div>
        </div>
      </div>
    </button>
  );
}