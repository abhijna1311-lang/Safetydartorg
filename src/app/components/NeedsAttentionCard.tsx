import { Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface NeedsAttentionCardProps {
  eventId: string;
  startedBy: string;
  startedByRole: string;
  note: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  dueIn: string;
  onContinue: () => void;
  onClick?: () => void;
}

export function NeedsAttentionCard({
  eventId,
  startedBy,
  startedByRole,
  note,
  priority,
  dueDate,
  dueIn,
  onContinue,
  onClick
}: NeedsAttentionCardProps) {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking the button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-gradient-to-br from-orange-50/40 via-amber-50/30 to-orange-50/40 rounded-xl border border-orange-200/60 shadow-sm hover:shadow-md hover:border-orange-300/80 transition-all duration-300 cursor-pointer overflow-hidden"
      role="article"
      aria-label={`${priority} priority accident case started on your behalf, due ${dueDate}. Continue section.`}
    >
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Desktop: 2-column layout | Mobile: stacked */}
      <div className="relative grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 lg:gap-8 px-6 py-5 lg:px-16 lg:py-8">
        {/* LEFT COLUMN - Info */}
        <div className="space-y-5">
          {/* Row 1: Title + Case ID on same line */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-6">
            {/* Title with priority pill (mobile only) */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h3 className="text-lg text-[#00205B] font-semibold font-['Poppins']">
                  Started on your behalf
                </h3>
                {/* Priority pill - visible on mobile/tablet only */}
                <span className={`lg:hidden inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityStyle(priority)} w-fit`}>
                  {priority} priority
                </span>
              </div>
            </div>

            {/* Case ID - aligned right on desktop */}
            <div className="lg:text-right shrink-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium font-['Poppins'] mb-1">
                Case ID
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="text-sm text-[#007DBA] font-semibold font-['Poppins'] hover:text-[#0099E6] hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#007DBA] focus:ring-offset-2 rounded"
              >
                {eventId}
              </button>
            </div>
          </div>

          {/* Row 2: Who and Why - 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {/* Column A: Started By */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium font-['Poppins'] mb-1.5">
                Started by
              </p>
              <p className="text-sm text-slate-900 font-['Poppins']">
                {startedBy}{' '}
                <span className="text-slate-600">({startedByRole})</span>
              </p>
            </div>

            {/* Column B: Note or Reason */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium font-['Poppins'] mb-1.5">
                Note or Reason
              </p>
              <p className="text-sm text-slate-700 font-['Poppins'] line-clamp-2">
                {note}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Urgency + Action (desktop only) */}
        <div className="hidden lg:flex lg:flex-col lg:items-end lg:justify-between gap-5">
          {/* Urgency cluster: Priority + Due Date */}
          <div className="flex flex-col items-end gap-3 w-full">
            {/* Priority pill */}
            <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full border ${getPriorityStyle(priority)}`}>
              {priority} priority
            </span>

            {/* Due date */}
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium font-['Poppins'] mb-1">
                Due by
              </p>
              <div className="flex items-center gap-1.5 text-red-600 mb-1">
                <Clock className="w-4 h-4" />
                <p className="text-sm font-semibold font-['Poppins']">
                  {dueDate}
                </p>
              </div>
              <p className="text-xs text-slate-500 font-['Poppins']">
                {dueIn}
              </p>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContinue();
            }}
            className="group/btn relative px-6 py-3 text-sm font-semibold text-white bg-gradient-to-br from-[#005A8F] to-[#007DBA] hover:from-[#006BA0] hover:to-[#0088CC] rounded-xl shadow-md hover:shadow-lg ease-in-out overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#005A8F] focus:ring-offset-2 font-['Poppins'] w-full max-w-[200px]"
            style={{ transition: 'background-color 600ms ease-in-out, box-shadow 600ms ease-in-out' }}
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 ease-in-out" style={{ transition: 'opacity 600ms ease-in-out' }} />
            <span className="relative flex items-center justify-between gap-2">
              <span>Continue section</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 ease-in-out" style={{ transition: 'transform 600ms ease-in-out' }} />
            </span>
          </button>
        </div>

        {/* MOBILE/TABLET: Due date + CTA stacked below */}
        <div className="lg:hidden space-y-4 pt-2 border-t border-orange-200/50">
          {/* Due date */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium font-['Poppins'] mb-1.5">
              Due by
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-red-600">
                <Clock className="w-4 h-4" />
                <p className="text-sm font-semibold font-['Poppins']">
                  {dueDate}
                </p>
              </div>
              <span className="text-xs text-slate-500 font-['Poppins']">
                ({dueIn})
              </span>
            </div>
          </div>

          {/* Primary CTA - full width on mobile */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContinue();
            }}
            className="group/btn relative w-full px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-br from-[#007DBA] to-[#0099E6] hover:from-[#0099E6] hover:to-[#00B4FF] rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#007DBA] focus:ring-offset-2 font-['Poppins']"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              <span>Continue section</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}