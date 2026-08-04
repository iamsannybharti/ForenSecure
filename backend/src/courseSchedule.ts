// Schedule rules for live courses. Status is derived from these dates on the client,
// so bad dates here would produce a course that can never display a correct status.

export function validateSchedule(
  courseType: unknown,
  startDate: unknown,
  endDate: unknown
): string | null {
  if (courseType !== 'live') return null;

  if (!startDate) return 'A live course requires a start date.';

  const start = new Date(startDate as string).getTime();
  if (Number.isNaN(start)) return 'The start date is not a valid date.';

  if (endDate) {
    const end = new Date(endDate as string).getTime();
    if (Number.isNaN(end)) return 'The end date is not a valid date.';
    if (end < start) return 'The end date must be on or after the start date.';
  }

  return null;
}

export interface CourseScheduleInput {
  days: number[];          // 0=Sun … 6=Sat
  time: string;            // 'HH:mm'
}

/**
 * Expands a weekly recurrence into concrete session start times, one per selected
 * weekday from `start` through `end` (inclusive). `end` falls back to
 * start + `durationWeeks` weeks when no explicit end date is given.
 *
 * ponytail: naive day-by-day walk, capped at 366 days so a bad range can't spin
 * forever. Fine for course-length ranges; swap for a week-stride loop only if
 * multi-year schedules ever appear.
 */
export function expandSchedule(
  startDate: string | Date,
  endDate: string | Date | null | undefined,
  durationWeeks: number,
  schedule: CourseScheduleInput
): Date[] {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return [];

  const days = (schedule.days || []).filter(d => d >= 0 && d <= 6);
  if (days.length === 0) return [];

  const [hh, mm] = String(schedule.time || '09:00').split(':').map(Number);
  const hours = Number.isFinite(hh) ? hh : 9;
  const mins = Number.isFinite(mm) ? mm : 0;

  const end = endDate
    ? new Date(endDate)
    : new Date(start.getTime() + Math.max(1, durationWeeks || 1) * 7 * 24 * 60 * 60 * 1000);

  const sessions: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  for (let guard = 0; guard <= 366 && cursor <= end; guard++) {
    if (days.includes(cursor.getDay())) {
      const session = new Date(cursor);
      session.setHours(hours, mins, 0, 0);
      if (session >= start && session <= end) sessions.push(session);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return sessions;
}

// Run with: npx ts-node src/courseSchedule.ts
if (require.main === module) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error('FAIL: ' + m); };
  // Mon 2026-08-03 → 2 weeks, classes Mon(1)+Wed(3) at 18:00 = 4 sessions.
  const out = expandSchedule('2026-08-03T00:00:00', null, 2, { days: [1, 3], time: '18:00' });
  assert(out.length === 4, `expected 4 sessions, got ${out.length}`);
  assert(out[0].getHours() === 18 && out[0].getMinutes() === 0, 'time applied');
  assert(out.every(d => d.getDay() === 1 || d.getDay() === 3), 'only Mon/Wed');
  assert(expandSchedule('2026-08-03', null, 2, { days: [], time: '18:00' }).length === 0, 'no days = none');
  console.log('courseSchedule self-check passed:', out.map(d => d.toISOString()));
}
