// Self-check for schedule-derived course status and homepage ordering.
// Run: node --experimental-strip-types src/lib/courseStatus.selfcheck.ts   (from frontend/)
import assert from 'assert';
import { courseStatus, homepageLiveCourses } from './courseStatus.ts';

const NOW = new Date('2026-07-21T12:00:00Z');
const at = (iso: string) => new Date(iso);

// Recorded courses ignore dates entirely.
assert.strictEqual(courseStatus({ courseType: 'recorded' }, NOW), 'self-paced');
assert.strictEqual(courseStatus({ courseType: 'recorded', startDate: '2030-01-01' }, NOW), 'self-paced');
assert.strictEqual(courseStatus({}, NOW), 'self-paced', 'missing type defaults to self-paced');

// A live course with no start date cannot claim a status.
assert.strictEqual(courseStatus({ courseType: 'live' }, NOW), 'unscheduled');
assert.strictEqual(courseStatus({ courseType: 'live', startDate: 'not a date' }, NOW), 'unscheduled');
assert.strictEqual(courseStatus({ courseType: 'live', startDate: null }, NOW), 'unscheduled');

// Before / during / after.
assert.strictEqual(courseStatus({ courseType: 'live', startDate: '2026-08-01T00:00:00Z' }, NOW), 'upcoming');
assert.strictEqual(
  courseStatus({ courseType: 'live', startDate: '2026-07-01T00:00:00Z', endDate: '2026-08-30T00:00:00Z' }, NOW),
  'live'
);
assert.strictEqual(
  courseStatus({ courseType: 'live', startDate: '2026-05-01T00:00:00Z', endDate: '2026-06-01T00:00:00Z' }, NOW),
  'ended'
);

// Boundaries: the instant it starts it is live, the instant after it ends it is over.
assert.strictEqual(courseStatus({ courseType: 'live', startDate: NOW.toISOString() }, NOW), 'live', 'start boundary');
assert.strictEqual(
  courseStatus({ courseType: 'live', startDate: '2026-07-01T00:00:00Z', endDate: NOW.toISOString() }, NOW),
  'live',
  'end boundary is inclusive'
);
assert.strictEqual(
  courseStatus({ courseType: 'live', startDate: '2026-07-01T00:00:00Z', endDate: new Date(NOW.getTime() - 1).toISOString() }, NOW),
  'ended',
  '1ms past the end date'
);

// No end date means the course never expires.
assert.strictEqual(courseStatus({ courseType: 'live', startDate: '2020-01-01T00:00:00Z' }, NOW), 'live');

// --- Homepage ordering ---
const late = { id: 'late', courseType: 'live' as const, startDate: '2026-09-01T00:00:00Z' };
const soon = { id: 'soon', courseType: 'live' as const, startDate: '2026-07-25T00:00:00Z' };
const running = { id: 'running', courseType: 'live' as const, startDate: '2026-07-01T00:00:00Z' };
const expired = { id: 'expired', courseType: 'live' as const, startDate: '2026-01-01T00:00:00Z', endDate: '2026-02-01T00:00:00Z' };
const recorded = { id: 'recorded', courseType: 'recorded' as const };
const tba = { id: 'tba', courseType: 'live' as const };

// Upcoming wins, nearest start first, and nothing else leaks in.
assert.deepStrictEqual(
  homepageLiveCourses([late, expired, recorded, running, soon, tba], NOW).map(c => c.id),
  ['soon', 'late']
);

// With no upcoming course, ongoing ones show instead.
assert.deepStrictEqual(
  homepageLiveCourses([expired, recorded, running, tba], NOW).map(c => c.id),
  ['running']
);

// Nothing to show -> empty, so the caller can hide the whole section.
assert.deepStrictEqual(homepageLiveCourses([expired, recorded, tba], NOW), []);
assert.deepStrictEqual(homepageLiveCourses([], NOW), []);

// Expired courses stay out even when they are the only live-type courses.
assert.strictEqual(homepageLiveCourses([expired], NOW).length, 0, 'expired never shown');

console.log('courseStatus.selfcheck: all assertions passed');
