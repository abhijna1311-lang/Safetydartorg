import { useState, useEffect } from 'react';
import { DARTHeader } from './DARTHeader';
import { LeftNavigation } from './LeftNavigation';

interface AppShellProps {
  activeNav: 'home' | 'new-report' | 'drafts' | 'submissions';
  onNavigate: (view: 'home' | 'new-report' | 'drafts' | 'submissions') => void;
  children: React.ReactNode;
}

export function AppShell({ activeNav, onNavigate, children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isMobileNavOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen, isMobile]);

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* AppShell / Page Container */}
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">

        {/* Header */}
        <DARTHeader
          activeNav={activeNav}
          onNavigate={onNavigate}
          onMobileMenuToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
          isMobileMenuOpen={isMobileNavOpen}
        />

        {/* AppShell / Body Grid */}
        <div className="flex gap-6 mt-6">
          {/* Left Navigation - Desktop */}
          {!isMobile && (
            <LeftNavigation
              activeNav={activeNav}
              onNavigate={onNavigate}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Left Navigation - Mobile Drawer */}
      {isMobile && (
        <LeftNavigation
          activeNav={activeNav}
          onNavigate={onNavigate}
          isMobile
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />
      )}
    </div>
  );
}
