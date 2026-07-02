import { Home, FileText, Clock, CheckCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface LeftNavigationProps {
  activeNav: 'home' | 'new-report' | 'drafts' | 'submissions';
  onNavigate: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'new-report', label: 'New Accident Case', icon: FileText },
  { id: 'drafts', label: 'Draft Cases', icon: Clock, badge: 3 },
  { id: 'submissions', label: 'Case History', icon: CheckCircle },
] as const;

export function LeftNavigation({ activeNav, onNavigate, isMobile = false, isOpen = false, onClose }: LeftNavigationProps) {
  // Handle escape key to close mobile drawer
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isOpen, onClose]);

  // Handle focus trap for mobile drawer
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const focusableElements = document.querySelectorAll(
      '[data-mobile-nav] button, [data-mobile-nav] a'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isMobile, isOpen]);

  const handleNavClick = (id: 'home' | 'new-report' | 'drafts' | 'submissions') => {
    onNavigate(id);
    if (isMobile) onClose?.();
  };

  const navContent = (
    <nav className="flex flex-col gap-1.5 p-3" data-mobile-nav>
      {isMobile && (
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <h2 className="text-sm font-semibold text-slate-700 font-['Poppins']">Navigation</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeNav === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`
              relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              font-['Poppins'] text-sm group focus:outline-none focus:ring-2 focus:ring-[#FFCD00]
              ${isActive
                ? 'bg-[rgba(0,113,188,0.12)] text-[#002B5C] font-semibold'
                : 'text-[#0B2E63] hover:bg-[rgba(0,113,188,0.08)] hover:text-[#003B73]'
              }
            `}
          >
            {/* Active indicator */}
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#0072B8] rounded-r-full"
                aria-hidden="true"
              />
            )}

            {/* Icon */}
            <Icon
              className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive
                  ? 'text-[#0072B8]'
                  : 'text-[#46607F] group-hover:text-[#0072B8]'
              }`}
            />

            {/* Label */}
            <span className="flex-1 text-left">{item.label}</span>

            {/* Optional badge */}
            {item.badge && item.badge > 0 && (
              <span
                className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#0072B8] text-white text-[11px] font-semibold font-['Poppins'] flex items-center justify-center"
                aria-label={`${item.badge} items`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998] transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Drawer */}
        <aside
          className={`
            fixed top-0 left-0 bottom-0 z-[9999] w-[300px] max-w-[85vw]
            bg-white shadow-2xl transition-transform duration-300 ease-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          aria-label="Navigation menu"
          role="dialog"
          aria-modal="true"
        >
          <div className="h-full overflow-y-auto py-4">
            {navContent}
          </div>
        </aside>
      </>
    );
  }

  // Desktop navigation
  return (
    <aside
      className="flex-shrink-0 sticky top-6"
      style={{
        width: '240px',
      }}
      aria-label="Main navigation"
    >
      <div
        className="rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.78)',
          border: '1px solid rgba(216, 228, 246, 0.55)',
          boxShadow: '0 12px 32px rgba(10, 31, 68, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {navContent}
      </div>
    </aside>
  );
}
