import { Link } from 'react-router-dom';
import { Clock, User, Calendar, ArrowRight } from 'lucide-react';
import CourseThumbnail from './CourseThumbnail';
import CourseStatusBadge from './CourseStatusBadge';
import { courseStatus } from '../lib/courseStatus';

const dateFmt = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function CourseCard({ course }: { course: any }) {
  const status = courseStatus(course);
  const isLive = course.courseType === 'live';

  return (
    <article className="group flex flex-col bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-brand-glowCyan focus-within:border-brand-glowCyan transition-all duration-300">
      <div className="relative aspect-[16/9] bg-slate-900">
        <CourseThumbnail src={course.thumbnailUrl} title={course.title} seed={course.slug || course.id} />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <CourseStatusBadge status={status} />
        </div>
        <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm">
          {course.category}
        </span>
      </div>

      <div className="p-4 sm:p-5 flex-grow space-y-2">
        <h3 className="text-base font-bold text-brand-deepBlue dark:text-white leading-snug line-clamp-2">
          {course.title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 flex-shrink-0 text-brand-glowCyan" aria-hidden="true" />
          <span className="truncate">{course.instructorName || 'ForenSecure Faculty'}</span>
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          {isLive ? (
            <>
              <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-brand-glowCyan" aria-hidden="true" />
              <span className="truncate">
                {course.startDate
                  ? `${dateFmt(course.startDate)}${course.endDate ? ` – ${dateFmt(course.endDate)}` : ''}`
                  : 'Schedule to be announced'}
              </span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-brand-glowCyan" aria-hidden="true" />
              <span>{course.durationWeeks || 6} weeks · learn at your own pace</span>
            </>
          )}
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pt-1">
          {course.description}
        </p>
      </div>

      <div className="px-4 sm:px-5 py-4 border-t border-slate-100 dark:border-brand-darkBorder flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-brand-darkBg/30">
        <span className="text-sm font-extrabold text-brand-deepBlue dark:text-white">
          ₹{course.priceINR?.toLocaleString('en-IN') || '9,999'}
        </span>
        <Link
          to={`/courses/${course.slug}`}
          className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowBlue dark:hover:bg-brand-glowCyan transition-colors flex items-center gap-1.5"
        >
          {status === 'live' ? 'Join now' : status === 'upcoming' ? 'Reserve seat' : 'View course'}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
