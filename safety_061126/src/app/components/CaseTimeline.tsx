import { Clock } from 'lucide-react';
import {
  formatSectionStatus,
  getSectionLabel,
  getWorkflowSections,
  WORKFLOW_SECTION_ORDER,
  type WorkflowHandoff,
  type WorkflowReport,
  type WorkflowSectionKey,
} from '../types/workflow-report';

interface CaseTimelineProps {
  report: WorkflowReport;
  title?: string;
  compact?: boolean;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  section?: WorkflowSectionKey;
  note?: string | null;
}

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function handoffActionLabel(handoff: WorkflowHandoff) {
  const sectionLabel = handoff.targetSection ? getSectionLabel(handoff.targetSection) : 'case';
  switch (handoff.action) {
    case 'section-submitted':
      return `${sectionLabel} submitted`;
    case 'section-resubmitted':
      return `${sectionLabel} resubmitted`;
    case 'section-returned':
    case 'returned':
      return `${sectionLabel} returned for correction`;
    case 'closed':
      return 'Case closed';
    case 'forwarded':
      return `${sectionLabel} routed`;
  }
}

function buildTimelineEvents(report: WorkflowReport): TimelineEvent[] {
  const sections = getWorkflowSections(report);
  const events: TimelineEvent[] = [
    {
      id: `${report.id}-created`,
      timestamp: report.createdAt,
      actor: report.initiatedBy,
      action: 'Case created',
    },
  ];

  WORKFLOW_SECTION_ORDER.forEach((sectionKey) => {
    const section = sections[sectionKey];
    if (section.status === 'not-required') {
      events.push({
        id: `${report.id}-${sectionKey}-not-required`,
        timestamp: section.lastUpdatedAt || report.createdAt,
        actor: 'System',
        action: `${section.label} marked not required`,
        section: sectionKey,
      });
      return;
    }

    if (section.status === 'pending') {
      events.push({
        id: `${report.id}-${sectionKey}-pending`,
        timestamp: section.lastUpdatedAt || report.lastSavedAt,
        actor: 'System',
        action: `${section.label} pending`,
        section: sectionKey,
      });
    }

    if (section.status === 'in-progress') {
      events.push({
        id: `${report.id}-${sectionKey}-in-progress`,
        timestamp: section.lastUpdatedAt || report.lastSavedAt,
        actor: section.ownerRole,
        action: `${section.label} in progress`,
        section: sectionKey,
      });
    }

    if (section.submittedAt && ['submitted', 'resubmitted', 'accepted'].includes(section.status)) {
      events.push({
        id: `${report.id}-${sectionKey}-submitted`,
        timestamp: section.submittedAt,
        actor: section.submittedBy || section.ownerRole,
        action: `${section.label} ${formatSectionStatus(section.status).toLowerCase()}`,
        section: sectionKey,
      });
    }

    if (section.returnedAt) {
      events.push({
        id: `${report.id}-${sectionKey}-returned`,
        timestamp: section.returnedAt,
        actor: section.returnedBy || 'Reviewer',
        action: `${section.label} returned for correction`,
        section: sectionKey,
        note: section.correctionNote,
      });
    }
  });

  report.handoffHistory?.forEach((handoff) => {
    events.push({
      id: handoff.id,
      timestamp: handoff.createdAt,
      actor: handoff.fromRole,
      action: handoffActionLabel(handoff),
      section: handoff.targetSection,
      note: handoff.note,
    });
  });

  if (report.closedAt) {
    events.push({
      id: `${report.id}-closed`,
      timestamp: report.closedAt,
      actor: report.lastSubmittedBy || 'System',
      action: 'Case closed',
    });
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function CaseTimeline({ report, title = 'Case timeline', compact = false }: CaseTimelineProps) {
  const events = buildTimelineEvents(report);

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5'}`} aria-label="Case timeline">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
          <Clock className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#00205B] font-['Poppins']">{title}</h3>
          <p className="text-xs text-slate-500 font-['Poppins']">Who did what, and when.</p>
        </div>
      </div>

      <ol className="space-y-3">
        {events.map((event) => (
          <li key={event.id} className="relative rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 font-['Poppins']">{event.action}</p>
                <p className="text-xs text-slate-500 font-['Poppins']">Actor: {event.actor}</p>
              </div>
              <p className="text-xs text-slate-500 font-['Poppins']">{formatTimestamp(event.timestamp)}</p>
            </div>
            {event.note && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 font-['Poppins']">{event.note}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}