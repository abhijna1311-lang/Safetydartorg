import { CheckCircle2, Download, Info } from 'lucide-react';
import type { AccidentReportData } from '../types/accident-report';
import { downloadClassificationReport, formatMdy, getClassificationReportFileName } from '../utils/classificationReportPdf';

interface ClassificationCompleteCardProps {
  data: AccidentReportData;
  caseId: string;
  onBackToHome?: () => void;
}

function classificationTone(value?: string) {
  if (!value) return 'bg-slate-300';
  if (value.startsWith('Preventable')) return 'bg-amber-400';
  if (value.startsWith('Non-Preventable')) return 'bg-emerald-500';
  return 'bg-slate-400';
}

function DocumentThumbnail() {
  return (
    <div aria-hidden="true" className="relative h-[76px] w-[60px] shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_14px_-8px_rgba(15,23,42,0.25)] transition-transform duration-200 group-hover:-translate-y-0.5">
      <div className="h-3.5 border-b-2 border-dart-focus bg-dart-navy" />
      <div className="space-y-1 px-1.5 pt-1.5">
        <div className="h-3 rounded-[2px] border border-slate-300" />
        <div className="h-[3px] w-4/5 rounded-full bg-slate-200" />
        <div className="h-[3px] w-full rounded-full bg-slate-200" />
        <div className="h-[3px] w-3/5 rounded-full bg-slate-200" />
        <div className="h-[3px] w-full rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export function ClassificationCompleteCard({ data, caseId, onBackToHome }: ClassificationCompleteCardProps) {
  const classification = data.program_manager_classification_value || data.program_manager_classification;
  const isPreventable = Boolean(classification?.startsWith('Preventable'));
  const classifiedBy = data.program_manager_classified_by_name;
  const badge = data.program_manager_classified_by_badge || data.program_manager_badge_number;
  const fileName = `${getClassificationReportFileName(caseId)}.pdf`;

  return (
    <section className="dart-card dart-card--primary overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Status */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5 md:px-8">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </span>
          <div className="min-w-0">
            <p className="dart-eyebrow !text-emerald-700">Case closed</p>
            <h3 className="dart-h3 mt-0.5 !text-lg">Classification finalized</h3>
            <p className="dart-body mt-1 max-w-xl">
              Your decision is now part of the permanent record. Share the classification record with the employee and their manager for signature.
            </p>
          </div>
        </div>
        <span className="dart-tabular inline-flex items-center rounded-full border border-slate-200 bg-dart-surface-soft px-3 py-1 text-xs font-medium text-dart-text">
          Case {caseId}
        </span>
      </header>

      <div className="grid gap-6 px-6 py-6 md:px-8 md:py-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
        {/* Decision */}
        <div className="flex min-w-0 flex-col justify-center">
          <p className="dart-eyebrow">Classification</p>
          <div className="mt-2 flex items-center gap-3">
            <span aria-hidden="true" className={`h-9 w-1.5 shrink-0 rounded-full ${classificationTone(classification)}`} />
            <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-dart-navy font-['Poppins']">
              {classification || 'Not entered'}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 border-t border-slate-200/80 pt-4">
            <div>
              <dt className="dart-eyebrow">Date classified</dt>
              <dd className="dart-tabular mt-1 text-sm font-semibold text-dart-text-strong font-['Poppins']">
                {formatMdy(data.program_manager_classification_date) || 'Not entered'}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="dart-eyebrow">Classified by</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-dart-text-strong font-['Poppins']">
                {classifiedBy || 'Not entered'}
              </dd>
              {badge && <dd className="dart-caption dart-tabular">Badge {badge}</dd>}
            </div>
          </dl>
        </div>

        {/* Classification record */}
        <div className="group min-w-0 rounded-xl border border-slate-200 bg-dart-surface-soft p-4 transition-colors duration-200 hover:border-slate-300 sm:p-5">
          <div className="flex items-center gap-4">
            <DocumentThumbnail />
            <div className="min-w-0 flex-1">
              <p className="dart-h4">Classification record</p>
              <p className="dart-caption mt-0.5 truncate" title={fileName}>{fileName}</p>
              <p className="dart-caption">Form OS-1A · Includes signature lines</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { void downloadClassificationReport(data, caseId); }}
            className="dart-press mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-dart-blue px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] hover:bg-dart-blue-hover focus:outline-none focus-visible:ring-[3px] focus-visible:ring-dart-blue/30 font-['Poppins']"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <p className="dart-caption mt-2 text-center">Opens your print dialog. Choose Save as PDF.</p>
        </div>
      </div>

      {/* Next step */}
      {(isPreventable || onBackToHome) && (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-dart-surface-soft/70 px-6 py-3.5 md:px-8">
          {isPreventable ? (
            <p className="dart-caption flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dart-accent-blue" />
              A Preventable classification can be appealed within 5 days of the employee receiving this record.
            </p>
          ) : <span />}
          {onBackToHome && (
            <button type="button" onClick={onBackToHome} className="dart-action-link min-h-[44px] rounded-lg px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-dart-focus">
              Back to home
            </button>
          )}
        </footer>
      )}
    </section>
  );
}
