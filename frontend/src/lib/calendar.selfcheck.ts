// Self-check for live lecture calendar maths.
// Run: node --experimental-strip-types src/lib/calendar.selfcheck.ts   (from frontend/)
import assert from 'assert';
import { buildMonthGrid, isSameDay, addMonths, sessionTimeRange } from './calendar.ts';

// Grid is always six weeks, and always starts on a Sunday.
for (const [y, m] of [[2026, 0], [2026, 1], [2026, 6], [2024, 1]] as [number, number][]) {
  const grid = buildMonthGrid(y, m);
  assert.strictEqual(grid.length, 42, `${y}-${m + 1} has 42 cells`);
  assert.strictEqual(grid[0].getDay(), 0, `${y}-${m + 1} starts on Sunday`);
  assert.ok(grid.some(d => d.getMonth() === m && d.getDate() === 1), `${y}-${m + 1} contains the 1st`);
  // Cells are consecutive days.
  for (let i = 1; i < grid.length; i++) {
    const gap = (grid[i].getTime() - grid[i - 1].getTime()) / 3600000;
    assert.ok(gap >= 23 && gap <= 25, `consecutive days around ${grid[i].toDateString()} (DST safe)`);
  }
}

// Feb 2026 starts on a Sunday, so the grid opens exactly on the 1st with no leading spill.
const feb26 = buildMonthGrid(2026, 1);
assert.ok(isSameDay(feb26[0], new Date(2026, 1, 1)), 'Feb 2026 grid opens on Feb 1');

// July 2026 starts on a Wednesday — three trailing June days lead the grid.
const jul26 = buildMonthGrid(2026, 6);
assert.ok(isSameDay(jul26[0], new Date(2026, 5, 28)), 'July 2026 grid opens on Jun 28');
assert.ok(isSameDay(jul26[3], new Date(2026, 6, 1)), 'July 1 lands in the fourth cell');

// Leap day is present in Feb 2024 and absent in Feb 2026.
assert.ok(buildMonthGrid(2024, 1).some(d => d.getMonth() === 1 && d.getDate() === 29), 'Feb 29 2024 present');
assert.ok(!buildMonthGrid(2026, 1).some(d => d.getMonth() === 1 && d.getDate() === 29), 'no Feb 29 in 2026');

// Year rollover in both directions.
assert.ok(isSameDay(addMonths(new Date(2026, 11, 15), 1), new Date(2027, 0, 1)), 'Dec -> Jan next year');
assert.ok(isSameDay(addMonths(new Date(2026, 0, 15), -1), new Date(2025, 11, 1)), 'Jan -> Dec previous year');
// Stepping from a long month must not skip February.
assert.ok(isSameDay(addMonths(new Date(2026, 0, 31), 1), new Date(2026, 1, 1)), 'Jan 31 -> Feb 1');

// isSameDay ignores the time of day but not the date.
assert.ok(isSameDay(new Date(2026, 6, 21, 23, 59), new Date(2026, 6, 21, 0, 0)), 'same date, different time');
assert.ok(!isSameDay(new Date(2026, 6, 21), new Date(2025, 6, 21)), 'different year');
assert.ok(!isSameDay(new Date(2026, 6, 21), new Date(2026, 7, 21)), 'different month');

// --- Session time ranges (local time, 24h) ---
const local = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m, d, h, min);
assert.strictEqual(sessionTimeRange(local(2026, 9, 24, 14, 0), 150), '14:00 - 16:30');
assert.strictEqual(sessionTimeRange(local(2026, 9, 24, 9, 5), 55), '09:05 - 10:00', 'zero padded');
assert.strictEqual(sessionTimeRange(local(2026, 9, 24, 14, 0)), '14:00', 'no duration, start only');
// Past midnight the clock wraps but the range is still right, because the end is a real date.
assert.strictEqual(sessionTimeRange(local(2026, 9, 24, 23, 30), 60), '23:30 - 00:30', 'crosses midnight');
assert.strictEqual(sessionTimeRange('not a date', 60), '', 'unparseable input is blank, not "Invalid Date"');

console.log('calendar.selfcheck: all assertions passed');
