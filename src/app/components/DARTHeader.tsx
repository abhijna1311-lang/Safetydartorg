import { Bell, Check, ChevronDown, Users, Shield, Briefcase, Menu, X } from 'lucide-react';
import { NotificationPanel, Notification } from './NotificationPanel';
import dartLogo from 'figma:asset/596faef70915e56e9eb4660104f6daec380e23d0.png';
import { useState, useRef, useEffect } from 'react';
import { useUserRole, ROLE_CONFIGS, type UserRole } from '../context/UserRoleContext';
import { createPortal } from 'react-dom';

interface DARTHeaderProps {
  activeNav?: 'home' | 'new-report' | 'drafts' | 'submissions';
  onNavigate?: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  'Operator':        Users,
  'Supervisor':      Shield,
  'Program Manager': Briefcase,
};

const ROLE_COLORS: Record<UserRole, string> = {
  'Operator':        '#007DBA',
  'Supervisor':      '#5C35A8',
  'Program Manager': '#0F7B6C',
};

export function DARTHeader({ activeNav = 'home', onNavigate, onMobileMenuToggle, isMobileMenuOpen }: DARTHeaderProps) {
  const { roleConfig, setRole } = useUserRole();

  const navItems = [
    { id: 'home',        label: 'Home' },
    { id: 'new-report',  label: 'New Accident Case' },
    { id: 'drafts',      label: 'Draft Cases' },
    { id: 'submissions', label: 'Case History' },
  ];

  // ── Notification state ──────────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Case Closed',
      message: 'Your Bus collision case #AR-2024-1156 has been closed by Supervisor Maria Chen.',
      timestamp: '2 hours ago',
      isRead: false,
      actionLabel: 'View Case',
      reportId: 'AR-2024-1156',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Revision Requested',
      message: 'Case #AR-2024-1149 needs additional information. Please update the returned section.',
      timestamp: '5 hours ago',
      isRead: false,
      actionLabel: 'Resolve Correction',
      reportId: 'AR-2024-1149',
    },
    {
      id: '3',
      type: 'comment',
      title: 'New Comment',
      message: 'Supervisor David Park commented on your Rail incident case #AR-2024-1142.',
      timestamp: '1 day ago',
      isRead: true,
      actionLabel: 'View Comment',
      reportId: 'AR-2024-1142',
    },
    {
      id: '4',
      type: 'info',
      title: 'Draft Reminder',
      message: 'You have an incomplete draft from Nov 15. Complete it before it expires in 3 days.',
      timestamp: '2 days ago',
      isRead: true,
      actionLabel: 'Continue Draft',
    },
    {
      id: '5',
      type: 'success',
      title: 'Section Submitted',
      message: 'Your NRV slip/fall Operator Section for case #AR-2024-1138 has been submitted.',
      timestamp: '3 days ago',
      isRead: true,
      reportId: 'AR-2024-1138',
    },
  ]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead      = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const handleMarkAllAsRead   = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  const handleNotificationClick = (n: Notification) => { console.log(n); setShowNotifications(false); };

  // ── Role switcher state ─────────────────────────────────────────────
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const chipRef    = useRef<HTMLButtonElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });

  const openRoleSwitcher = () => {
    if (chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect();
      setDropPos({
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setShowRoleSwitcher(true);
  };

  useEffect(() => {
    if (!showRoleSwitcher) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (chipRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setShowRoleSwitcher(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRoleSwitcher]);

  const handleRoleSelect = (role: UserRole) => {
    setRole(role);
    setShowRoleSwitcher(false);
  };

  const accentColor = ROLE_COLORS[roleConfig.role];

  // ── Role switcher portal ────────────────────────────────────────────
  const roleSwitcherDropdown = showRoleSwitcher ? (
    <div
      ref={dropRef}
      style={{
        position: 'fixed',
        top:   dropPos.top,
        right: dropPos.right,
        zIndex: 10000,
        minWidth: 260,
      maxWidth: 'calc(100vw - 16px)',
      }}
      className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_20px_48px_-8px_rgba(0,0,0,0.10)] overflow-hidden"
    >
      {/* Demo banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide font-['Poppins']">Prototype</span>
        </span>
        <span className="text-xs text-amber-700 font-['Poppins']">Switch role to explore different flows</span>
      </div>

      {/* Current user info */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold font-['Poppins']"
            style={{ backgroundColor: accentColor }}
          >
            {roleConfig.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 font-['Poppins']">{roleConfig.name}</p>
            <p className="text-xs text-slate-500 font-['Poppins']">{roleConfig.sublabel}</p>
          </div>
        </div>
      </div>

      {/* Role options */}
      <div className="py-1.5 px-1.5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-['Poppins'] px-3 pt-1.5 pb-1">
          Select role
        </p>
        {ROLE_CONFIGS.map(cfg => {
          const Icon     = ROLE_ICONS[cfg.role];
          const color    = ROLE_COLORS[cfg.role];
          const isActive = cfg.role === roleConfig.role;
          return (
            <button
              key={cfg.role}
              type="button"
              onClick={() => handleRoleSelect(cfg.role)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              {/* Role icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ backgroundColor: isActive ? color + '18' : '#f1f5f9' }}
              >
                <Icon
                  className="w-4 h-4 transition-colors"
                  style={{ color: isActive ? color : '#94a3b8' }}
                />
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium font-['Poppins'] transition-colors"
                  style={{ color: isActive ? color : '#1e293b' }}
                >
                  {cfg.label}
                </p>
                <p className="text-xs text-slate-400 font-['Poppins'] truncate">{cfg.sublabel}</p>
              </div>

              {/* Active check */}
              {isActive && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <header className="mb-6 bg-[#F5F7FB]">
      {/* Liquid Glass Top Nav Shell */}
      <div className="mx-auto px-6 pt-6">
        <div
          className="max-w-[1200px] mx-auto rounded-3xl relative"
          style={{
            background: 'linear-gradient(110deg, rgba(10, 68, 140, 0.06) 0%, rgba(255, 255, 255, 0.78) 45%, rgba(255, 255, 255, 0.78) 100%)',
            border: '1px solid rgba(216, 228, 246, 0.55)',
            boxShadow: '0 16px 40px 0 rgba(10, 31, 68, 0.10)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
          }}
        >
          <div className="px-6 py-3 flex items-center justify-between gap-6">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <img src={dartLogo} alt="DART Logo" className="h-11 w-auto object-contain" />
              <div className="hidden sm:block w-px h-6 flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.32)' }} />
              <h1 className="hidden sm:block text-base text-[#073366] font-semibold font-['Poppins'] whitespace-nowrap">
                DART Accident Reporting
              </h1>
            </div>

            {/* Right: Hamburger (mobile) + Bell + User chip */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* Hamburger — only rendered when a handler is provided (AppShell) */}
              {onMobileMenuToggle && (
                <button
                  type="button"
                  className="block sm:hidden p-2 rounded-lg text-[#1F4C85] hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  onClick={onMobileMenuToggle}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
              {/* Notification Bell */}
              <div className="relative">
                <button
                  ref={bellButtonRef}
                  className="p-2.5 rounded-full text-[#1F4C85] hover:bg-white/22 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007DBA]"
                  aria-label="Notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                </button>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1 pointer-events-none">
                    <span className="text-[10px] text-white font-semibold font-['Poppins']">{unreadCount}</span>
                  </span>
                )}
                {showNotifications && (
                  <NotificationPanel
                    notifications={notifications}
                    show={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onClick={handleNotificationClick}
                    buttonRef={bellButtonRef}
                  />
                )}
              </div>

              {/* User Chip — clickable role switcher trigger */}
              <button
                ref={chipRef}
                type="button"
                onClick={() => showRoleSwitcher ? setShowRoleSwitcher(false) : openRoleSwitcher()}
                className="flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] focus:ring-offset-1 hover:shadow-md"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.90)',
                  border: '1px solid rgba(216,228,246,0.70)',
                  boxShadow: showRoleSwitcher
                    ? '0 4px 16px rgba(10,31,68,0.14)'
                    : '0 4px 12px rgba(10,31,68,0.08)',
                }}
                aria-label="User profile and role switcher"
                aria-expanded={showRoleSwitcher}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs text-white font-semibold font-['Poppins'] transition-colors"
                  style={{ backgroundColor: accentColor }}
                >
                  {roleConfig.initials}
                </div>

                {/* Name + role (role hidden on mobile) */}
                <div className="text-sm font-['Poppins'] text-slate-700 leading-tight whitespace-nowrap">
                  <span className="font-medium text-[#0B3466]">{roleConfig.name}</span>
                  <span className="hidden sm:inline text-slate-400 mx-1.5">·</span>
                  <span className="hidden sm:inline text-slate-500">{roleConfig.role}</span>
                </div>

                {/* Chevron */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showRoleSwitcher ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="mx-auto px-4 sm:px-6 mt-4 sm:mt-6">
        <div className="max-w-[1200px] mx-auto h-12 px-2 sm:px-6 bg-slate-50/40 border-b border-slate-200/60 rounded-t-lg overflow-x-auto no-scrollbar">
          <nav className="flex items-center justify-start sm:justify-center gap-3 sm:gap-8 h-full min-w-max sm:min-w-0">
            {navItems.map(item => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id as 'home' | 'new-report' | 'drafts' | 'submissions')}
                  className={`
                    relative h-full flex items-center text-sm font-['Poppins'] transition-all px-2
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCD00] rounded-sm
                    ${isActive ? 'text-[#00205B] font-semibold' : 'text-[#00205B] font-normal hover:text-[#007DBA]'}
                  `}
                >
                  {item.label}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#007DBA] rounded-full" />}
                  {!isActive && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#007DBA] opacity-0 hover:opacity-30 rounded-full transition-opacity" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Role switcher portal — renders above everything */}
      {typeof document !== 'undefined' && createPortal(roleSwitcherDropdown, document.body)}
    </header>
  );
}
