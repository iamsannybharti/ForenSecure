// Course status is derived from the schedule, never stored, so a course can never be
// "Live" in the database while its dates say otherwise.

export type CourseStatus = 'self-paced' | 'unscheduled' | 'upcoming' | 'live' | 'ended';

export interface SchedulableCourse {
  courseType?: 'recorded' | 'live';
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}

function asTime(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function courseStatus(course: SchedulableCourse, now: Date = new Date()): CourseStatus {
  if (course.courseType !== 'live') return 'self-paced';

  const start = asTime(course.startDate);
  if (start === null) return 'unscheduled';

  const current = now.getTime();
  if (current < start) return 'upcoming';

  // An open-ended live course stays in progress; it only expires once an end date passes.
  const end = asTime(course.endDate);
  if (end !== null && current > end) return 'ended';

  return 'live';
}

// Homepage rule: nearest upcoming course first; fall back to whatever is running right now;
// show nothing (so the section can hide) when neither exists. Expired courses never appear.
export function homepageLiveCourses<T extends SchedulableCourse>(courses: T[], now: Date = new Date()): T[] {
  const byStart = (a: T, b: T) => (asTime(a.startDate) ?? 0) - (asTime(b.startDate) ?? 0);
  const upcoming = courses.filter(c => courseStatus(c, now) === 'upcoming').sort(byStart);
  if (upcoming.length > 0) return upcoming;
  return courses.filter(c => courseStatus(c, now) === 'live').sort(byStart);
}

export const STATUS_LABEL: Record<CourseStatus, string> = {
  'self-paced': 'Self-paced',
  unscheduled: 'Dates to be announced',
  upcoming: 'Upcoming',
  live: 'Live now',
  ended: 'Completed'
};
