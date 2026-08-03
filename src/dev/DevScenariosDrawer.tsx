import { useEffect, useMemo, useState } from 'react';
import { DEV_SCENARIOS, type DevScenario } from './scenarios';
import { ROLE_CONFIGS, useUserRole, type UserRole } from '../app/context/UserRoleContext';
import type { WorkflowReport } from '../app/types/workflow-report';

interface DevScenariosDrawerProps {
  activeReport: WorkflowReport | null;
  currentView: string;
  onApply: (scenario: DevScenario) => void;
}

export function DevScenariosDrawer({ activeReport, currentView, onApply }: DevScenariosDrawerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { roleConfig, setRole } = useUserRole();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const grouped = useMemo(() => {
    const groups: Record<string, DevScenario[]> = {};
    for (const s of DEV_SCENARIOS) {
      (groups[s.group] ||= []).push(s);
    }
    return groups;
  }, []);

  const handleCopyState = () => {
    if (!activeReport) return;
    void navigator.clipboard.writeText(JSON.stringify(activeReport, null, 2));
    setCopied(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle developer scenarios"
        className="fixed bottom-4 right-4 z-[999] flex h-11 w-11 items-center justify-center rounded-full bg-[#112458] text-white shadow-lg ring-2 ring-white transition-transform hover:scale-105 active:scale-95"
        title="Dev scenarios"
      >
        <span className="material-symbols-rounded text-[22px]" aria-hidden="true">bolt</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[998] bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-[999] flex h-full w-[380px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-['Poppins']">Dev only</p>
            <h2 className="text-sm font-bold text-[#00205B] font-['Poppins']">Scenarios</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <span className="material-symbols-rounded text-[18px]" aria-hidden="true">close</span>
          </button>
        </header>

        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-['Poppins']">Active role</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_CONFIGS.map(r => {
              const selected = roleConfig.role === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setRole(r.role as UserRole)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium font-['Poppins'] transition-all ${
                    selected
                      ? 'border-[#112458] bg-[#112458] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#b7cadd]'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {Object.entries(grouped).map(([groupName, items]) => {
            const isStory = groupName.startsWith('Story');
            return (
              <div key={groupName} className="mb-5 last:mb-0">
                <p className={`mb-2 text-[10px] font-semibold uppercase tracking-wider font-['Poppins'] ${isStory ? 'text-[#112458]' : 'text-slate-400'}`}>
                  {groupName}
                </p>
                <div className={`space-y-1.5 ${isStory ? 'border-l-2 border-[#112458]/15 pl-3' : ''}`}>
                  {items.map(scenario => (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => {
                        onApply(scenario);
                        setOpen(false);
                      }}
                      className="group flex w-full items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-[#112458] hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#00205B] font-['Poppins']">{scenario.name}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500 font-['Poppins']">{scenario.description}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider text-slate-600 font-['Poppins']">
                            {scenario.role}
                          </span>
                          {scenario.phase && (
                            <span className="inline-flex items-center rounded-full bg-[#eaf1fb] px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider text-[#112458] font-['Poppins']">
                              {scenario.phase}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className="material-symbols-rounded mt-0.5 flex-shrink-0 text-[18px] text-slate-300 transition-colors group-hover:text-[#112458]"
                        aria-hidden="true"
                      >
                        chevron_right
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-['Poppins']">Current state</p>
          <div className="mb-2 text-[11px] text-slate-600 font-['Poppins']">
            <span className="font-semibold text-slate-700">{currentView}</span>
            {activeReport && <> · <code className="text-[10px]">{activeReport.id}</code> · step {activeReport.currentStep}</>}
          </div>
          <button
            type="button"
            onClick={handleCopyState}
            disabled={!activeReport}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 font-['Poppins'] transition-all hover:border-[#112458] hover:text-[#112458] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span
              className={`material-symbols-rounded text-[14px] ${copied ? 'text-emerald-600' : ''}`}
              aria-hidden="true"
            >
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copied' : 'Copy current report as JSON'}
          </button>
          <p className="mt-1.5 text-[10px] leading-snug text-slate-400 font-['Poppins']">
            Paste into <code>src/dev/scenarios.ts</code> to add a new preset.
          </p>
        </footer>
      </aside>
    </>
  );
}
