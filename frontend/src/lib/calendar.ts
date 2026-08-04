// Month grid maths for the instructor's live lecture calendar.

// Six fixed weeks (42 cells) starting on the Sunday on or before the 1st, so the grid
// never changes height between months. Cells outside the month are still real dates.
export function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

// "14:00 - 16:30" in the viewer's own timezone. A session running past midnight still
// reads correctly because the end is computed from a real date, not by adding to the hour.
export function sessionTimeRange(start: string | Date, durationMinutes?: number): string {
  const from = new Date(start);
  if (Number.isNaN(from.getTime())) return '';
  const hhmm = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  if (!durationMinutes) return hhmm(from);
  const to = new Date(from.getTime() + durationMinutes * 60000);
  return `${hhmm(from)} - ${hhmm(to)}`;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
