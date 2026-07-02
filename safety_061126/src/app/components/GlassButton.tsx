import { ReactNode } from 'react';

interface GlassButtonProps {
  variant: 'primary' | 'secondary';
  onClick?: (e?: any) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function GlassButton({ variant, onClick, children, disabled, className = '', type = 'button' }: GlassButtonProps) {
  if (variant === 'primary') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
          px-6 py-3 rounded-lg min-h-[44px] min-w-[44px]
          transition-all duration-200
          ${disabled 
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
            : 'bg-[#0078AE] text-white font-bold border border-[#0078AE] shadow-[0_1px_2px_rgba(15,23,42,0.12)] hover:bg-[#006491] hover:border-[#006491] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(0,120,174,0.30)] active:scale-[0.98]'
          }
          ${className}
        `}
      >
        <span className="text-sm font-medium font-['Poppins']">{children}</span>
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-6 py-3 rounded-lg min-h-[44px] min-w-[44px]
        bg-white border border-[#CBD5E1]
        text-[#334155] text-sm font-medium font-['Poppins']
        hover:bg-[#F8FAFC] hover:border-[#94A3B8]
        focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(0,32,91,0.16)] focus-visible:border-[#00205B]
        transition-all duration-200
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}
