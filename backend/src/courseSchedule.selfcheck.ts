// Self-check for live course schedule validation.
// Run: npx ts-node src/courseSchedule.selfcheck.ts   (from backend/)
import assert from 'assert';
import { validateSchedule } from './courseSchedule';

// Recorded courses are never schedule-checked.
assert.strictEqual(validateSchedule('recorded', undefined, undefined), null);
assert.strictEqual(validateSchedule('recorded', 'garbage', 'garbage'), null);
assert.strictEqual(validateSchedule(undefined, undefined, undefined), null);

// Live courses must carry a usable start date.
assert.ok(validateSchedule('live', undefined, undefined), 'missing start rejected');
assert.ok(validateSchedule('live', '', undefined), 'empty start rejected');
assert.ok(validateSchedule('live', 'next tuesday', undefined), 'unparseable start rejected');

// A valid start is enough on its own — an open-ended live course is allowed.
assert.strictEqual(validateSchedule('live', '2026-08-01T09:00:00Z', undefined), null);
assert.strictEqual(validateSchedule('live', '2026-08-01T09:00:00Z', ''), null);

// End date must parse and must not precede the start.
assert.ok(validateSchedule('live', '2026-08-01T09:00:00Z', 'whenever'), 'unparseable end rejected');
assert.ok(validateSchedule('live', '2026-08-01T09:00:00Z', '2026-07-01T09:00:00Z'), 'end before start rejected');
assert.strictEqual(validateSchedule('live', '2026-08-01T09:00:00Z', '2026-09-01T09:00:00Z'), null);
// Same instant is a legitimate single-session course.
assert.strictEqual(validateSchedule('live', '2026-08-01T09:00:00Z', '2026-08-01T09:00:00Z'), null);

console.log('courseSchedule.selfcheck: all assertions passed');
