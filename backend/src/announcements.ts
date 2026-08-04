// Pure (IO-free) ordering for announcements: pinned first, then newest.
// Shared by server.ts and announcements.selfcheck.ts.

export function sortAnnouncements<T extends { pinned?: boolean; createdAt?: any }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;      // pinned before unpinned
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); // newest first
  });
}
