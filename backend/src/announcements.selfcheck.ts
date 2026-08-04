// Self-check for announcement ordering. Run: npx ts-node src/announcements.selfcheck.ts
import assert from 'assert';
import { sortAnnouncements } from './announcements';

const list = [
  { id: 'old-unpinned', pinned: false, createdAt: '2026-01-01' },
  { id: 'new-unpinned', pinned: false, createdAt: '2026-06-01' },
  { id: 'old-pinned', pinned: true, createdAt: '2026-01-15' },
  { id: 'new-pinned', pinned: true, createdAt: '2026-06-15' }
];

const order = sortAnnouncements(list).map(a => a.id);
// Pinned first (newest pinned before older pinned), then unpinned newest-first.
assert.deepStrictEqual(order, ['new-pinned', 'old-pinned', 'new-unpinned', 'old-unpinned'], 'pinned-first then newest-first');

// Does not mutate the input.
assert.strictEqual(list[0].id, 'old-unpinned', 'input array untouched');

console.log('announcements.selfcheck: all assertions passed ✓');
