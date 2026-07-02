import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { OperatorReferenceRail } from './OperatorReferenceRail';
import type { AccidentReportData } from '../../../types/accident-report';
import type { WorkflowSectionStatus } from '../../../types/workflow-report';

interface Props {
  open: boolean;
  onClose: () => void;
  data: AccidentReportData;
  operatorStatus?: WorkflowSectionStatus;
}

export function OperatorReportDrawer({ open, onClose, data, operatorStatus }: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Operator report">
          <motion.button
            type="button"
            aria-label="Close operator report"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Mobile: bottom sheet */}
          <motion.aside
            className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-[#00205B] font-['Poppins']">Operator report</h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                aria-label="Close operator report"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-3">
              <OperatorReferenceRail
                data={data}
                operatorStatus={operatorStatus}
                className="!border-0 !bg-transparent !shadow-none"
                showHeader={false}
              />
            </div>
            <div className="border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
              >
                Back to your section
              </button>
            </div>
          </motion.aside>

          {/* Desktop: right drawer */}
          <motion.aside
            className="absolute right-0 top-0 hidden h-full w-full max-w-[680px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl md:flex"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-[#00205B] font-['Poppins']">Operator report</h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                aria-label="Close operator report"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <OperatorReferenceRail
                data={data}
                operatorStatus={operatorStatus}
                className="!border-0 !bg-transparent !shadow-none"
                showHeader={false}
              />
            </div>
            <div className="border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#FFCD00] font-['Poppins']"
              >
                Back to your section
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
