import assert from 'assert';
import { sortNotifications } from './notifications';

const original = [
  { id: 'old-read', read: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'new-unread', read: false, createdAt: '2026-01-03T00:00:00Z' },
  { id: 'old-unread', read: false, createdAt: '2026-01-02T00:00:00Z' },
  { id: 'new-read', read: true, createdAt: '2026-01-04T00:00:00Z' }
];

const sorted = sortNotifications(original);

assert.deepStrictEqual(sorted.map(i => i.id), ['new-unread', 'old-unread', 'new-read', 'old-read']);
assert.deepStrictEqual(original.map(i => i.id), ['old-read', 'new-unread', 'old-unread', 'new-read']);

console.log('notifications.selfcheck: all assertions passed');
