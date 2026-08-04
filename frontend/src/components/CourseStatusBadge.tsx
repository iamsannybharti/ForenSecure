import { CourseStatus, STATUS_LABEL } from '../lib/courseStatus';

// Colour is never the only signal: every badge carries its label, and the dot style
// (pulsing / solid / ring / hollow) differs per status for anyone who cannot separate the hues.
const STYLES: Record<CourseStatus, { box: string; dot: string }> = {
  live: {
    box: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    dot: 'bg-red-600 live-dot'
  },
  upcoming: {
    box: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900',
    dot: 'bg-amber-500'
  },
  ended: {
    box: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500'
  },
  unscheduled: {
    box: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700',
    dot: 'border border-slate-500'
  },
  'self-paced': {
    box: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900',
    dot: 'ring-2 ring-sky-500 ring-offset-1 ring-offset-transparent bg-transparent'
  }
};

export default function CourseStatusBadge({ status, className = '' }: { status: CourseStatus; className?: string }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${style.box} ${className}`}
      // Announced as a status so screen readers report "Live now" rather than a bare colour swatch.
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}
