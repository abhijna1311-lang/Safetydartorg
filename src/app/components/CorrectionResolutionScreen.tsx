import { RotateCcw } from 'lucide-react';
import type { AccidentReportData } from '../types/accident-report';
import { getReportLocation, type WorkflowSectionKey } from '../types/workflow-report';

interface CorrectionResolutionScreenProps {
  caseId?: string;
  data: AccidentReportData;
  sectionKey: WorkflowSectionKey;
  sectionLabel: string;
  reviewerName?: string | null;
  note?: string | null;
  onUpdate: (data: Partial<AccidentReportData>) => void;
  onReviewAndSubmit: () => void;
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] focus:border-[#007DBA] font-['Poppins']";

export function CorrectionResolutionScreen({ caseId, data, sectionKey, sectionLabel, reviewerName, note, onUpdate, onReviewAndSubmit }: CorrectionResolutionScreenProps) {
  const isOperatorSection = sectionKey === 'operator';
  const isSupervisorSection = sectionKey === 'supervisor';

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm" aria-label="Correction resolution">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <RotateCcw className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            {caseId && <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 font-['Poppins']">Case {caseId}</p>}
            <h2 className="text-base font-semibold text-amber-950 font-['Poppins']">Your {sectionLabel} was returned for correction.</h2>
            <p className="mt-1 text-sm text-amber-900 font-['Poppins']">Only the fields below need your attention. Other sections are not affected.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReviewAndSubmit}
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#007DBA] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006BA0] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]/60 font-['Poppins']"
        >
          Review and resubmit section
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Reviewer</p>
            <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{reviewerName || 'Reviewer'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Returned section</p>
            <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{sectionLabel}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 font-['Poppins']">Correction reason</p>
            <p className="mt-1 text-sm font-medium text-slate-900 font-['Poppins']">{note || 'Reviewer requested updates before this section can be completed.'}</p>
          </div>
        </div>
      </div>

      {isOperatorSection && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900 font-['Poppins']">Returned field: Location and event description</p>
          <p className="mt-1 text-xs text-slate-500 font-['Poppins']">Original submitted value: {getReportLocation(data)}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={data.street_on || ''} onChange={(event) => onUpdate({ street_on: event.target.value })} placeholder="Street on" className={inputCls} />
            <input value={data.cross_street || ''} onChange={(event) => onUpdate({ cross_street: event.target.value })} placeholder="Cross street" className={inputCls} />
            <input value={data.city || ''} onChange={(event) => onUpdate({ city: event.target.value })} placeholder="City" className={inputCls} />
            <input value={data.zip || ''} onChange={(event) => onUpdate({ zip: event.target.value })} placeholder="ZIP" className={inputCls} />
            <textarea value={data.description_of_event || ''} onChange={(event) => onUpdate({ description_of_event: event.target.value })} placeholder="Updated event description" rows={3} className={`${inputCls} md:col-span-2 resize-none`} />
          </div>
        </div>
      )}

      {isSupervisorSection && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900 font-['Poppins']">Returned field: Supervisor investigation notes</p>
          <textarea value={data.supervisor_event_description || ''} onChange={(event) => onUpdate({ supervisor_event_description: event.target.value })} placeholder="Update supervisor investigation notes" rows={4} className={`${inputCls} mt-3 resize-none`} />
        </div>
      )}

      {sectionKey === 'programManager' && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900 font-['Poppins']">Returned field: Safety Program Manager classification</p>
          <textarea value={data.program_manager_classification || ''} onChange={(event) => onUpdate({ program_manager_classification: event.target.value })} placeholder="Update classification" rows={4} className={`${inputCls} mt-3 resize-none`} />
        </div>
      )}
    </section>
  );
}