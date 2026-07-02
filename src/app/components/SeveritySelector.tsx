import { Info, AlertCircle, AlertTriangle, AlertOctagon, Skull } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SeveritySelectorProps {
  value?: 'Minor' | 'Moderate' | 'Serious' | 'Critical';
  onChange: (value: 'Minor' | 'Moderate' | 'Serious' | 'Critical') => void;
}

const severityLevels = [
  { 
    value: 'Minor', 
    label: 'Minor',
    color: 'minor',
    description: 'No injuries, minimal property damage',
    icon: AlertCircle,
  },
  { 
    value: 'Moderate', 
    label: 'Moderate',
    color: 'moderate',
    description: 'Minor injuries, moderate property damage',
    icon: AlertTriangle,
  },
  { 
    value: 'Serious', 
    label: 'Serious',
    color: 'serious',
    description: 'Serious injuries or significant damage',
    icon: AlertOctagon,
  },
  { 
    value: 'Critical', 
    label: 'Critical',
    color: 'critical',
    description: 'Life-threatening injuries or major damage',
    icon: Skull,
  },
] as const;

// Severity color tokens following the calm design spec
const severityColors = {
  minor: {
    base: '#00A4B5',      // Teal base - avoiding "good" green connotation
    dark: '#006A71',      // Dark teal for text contrast
    tint: '#E5F7F7',      // Light teal fill
  },
  moderate: {
    base: '#FF9F2A',      // Soft amber
    dark: '#00205B',      // Navy text for contrast
    tint: '#FFF4E1',      // Light amber fill
  },
  serious: {
    base: '#FF7A2F',      // Light orange
    dark: '#00205B',      // Navy text for contrast
    tint: '#FFEDE4',      // Light orange fill
  },
  critical: {
    base: '#FF4B5A',      // Light red
    dark: '#00205B',      // Navy text for contrast
    tint: '#FFE8EB',      // Light red fill
  },
  neutral: {
    bg: '#F7FAFD',
    border: 'rgba(0, 33, 71, 0.12)',
    text: '#344766',
  },
};

const colorClasses = {
  minor: {
    // Unselected: neutral colors, thin border, no glow
    default: 'bg-[#F7FAFD] text-[#344766] border-[rgba(0,33,71,0.12)] border',
    // Hover: neutral bg, base color border at 25% opacity, soft shadow
    hover: 'hover:bg-[#F7FAFD] hover:border-[rgba(0,164,181,0.25)] hover:shadow-[0_0_6px_rgba(15,23,42,0.08)]',
    // Selected: solid tint bg with liquid glass feel - thicker border, inner highlight, soft float shadow
    selected: 'bg-[#E5F7F7] text-[#006A71] border-[#00A4B5] border-2 shadow-[0_0_18px_rgba(0,0,0,0.08)] relative',
  },
  moderate: {
    default: 'bg-[#F7FAFD] text-[#344766] border-[rgba(0,33,71,0.12)] border',
    hover: 'hover:bg-[#F7FAFD] hover:border-[rgba(255,159,42,0.25)] hover:shadow-[0_0_6px_rgba(15,23,42,0.08)]',
    selected: 'bg-[#FFF4E1] text-[#00205B] border-[#FF9F2A] border-2 shadow-[0_0_18px_rgba(0,0,0,0.08)] relative',
  },
  serious: {
    default: 'bg-[#F7FAFD] text-[#344766] border-[rgba(0,33,71,0.12)] border',
    hover: 'hover:bg-[#F7FAFD] hover:border-[rgba(255,122,47,0.25)] hover:shadow-[0_0_6px_rgba(15,23,42,0.08)]',
    selected: 'bg-[#FFEDE4] text-[#00205B] border-[#FF7A2F] border-2 shadow-[0_0_18px_rgba(0,0,0,0.08)] relative',
  },
  critical: {
    default: 'bg-[#F7FAFD] text-[#344766] border-[rgba(0,33,71,0.12)] border',
    hover: 'hover:bg-[#F7FAFD] hover:border-[rgba(255,75,90,0.25)] hover:shadow-[0_0_6px_rgba(15,23,42,0.08)]',
    selected: 'bg-[#FFE8EB] text-[#00205B] border-[#FF4B5A] border-2 shadow-[0_0_18px_rgba(0,0,0,0.08)] relative',
  },
};

export function SeveritySelector({ value, onChange }: SeveritySelectorProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Label and info icon */}
      <div className="flex items-center gap-2">
        <label className="block text-sm text-slate-800 font-['Poppins']" id="severity-label">
          How serious was the incident? <span className="text-red-500">*</span>
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button"
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
              >
                <Info className="w-4 h-4 text-slate-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2 text-xs font-['Poppins']">
                {severityLevels.map((level) => (
                  <div key={level.value}>
                    <span className="font-semibold">{level.label}:</span> {level.description}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Row 2: The four pills */}
      <div 
        className="flex items-center gap-3"
        role="group"
        aria-labelledby="severity-label"
      >
        {severityLevels.map((level) => {
          const isSelected = value === level.value;
          const colors = colorClasses[level.color];
          const Icon = level.icon;
          
          return (
            <TooltipProvider key={level.value}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onChange(level.value as any)}
                    aria-label={`${level.label} severity: ${level.description}`}
                    aria-pressed={isSelected}
                    className={`
                      px-4 py-2.5 rounded-lg transition-all duration-200 min-h-[44px]
                      flex items-center gap-2 flex-1 overflow-hidden
                      focus:outline-none focus:outline-2 focus:outline-offset-2 focus:outline-[#00A4B5]
                      active:scale-[0.98]
                      ${isSelected ? colors.selected : `${colors.default} ${colors.hover}`}
                    `}
                  >
                    {/* Inner highlight for liquid glass depth effect - only on selected */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
                    )}
                    <Icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isSelected ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                    <span className={`text-sm font-['Poppins'] whitespace-nowrap relative z-10 ${isSelected ? 'font-medium' : ''}`}>{level.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-['Poppins']">{level.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}