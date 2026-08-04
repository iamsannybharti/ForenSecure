import { useState, useEffect } from 'react';
import { Info, AlertTriangle, AlertOctagon, X } from 'lucide-react';

// Site-wide platform announcements. Fetches active announcements and shows the
// non-dismissed ones as a stacked banner. Dismissals persist in localStorage.
const DISMISS_KEY = 'fs_dismissed_announcements';

const readDismissed = (): string[] => {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch { return []; }
};

const styleFor = (level: string) => {
  switch (level) {
    case 'critical': return { wrap: 'bg-red-50 border-red-200 text-red-800', Icon: AlertOctagon };
    case 'warning': return { wrap: 'bg-amber-50 border-amber-200 text-amber-800', Icon: AlertTriangle };
    default: return { wrap: 'bg-blue-50 border-blue-200 text-blue-800', Icon: Info };
  }
};

export default function AnnouncementsBanner() {
  const [items, setItems] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(readDismissed());

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const visible = items.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="w-full">
      {visible.map(a => {
        const { wrap, Icon } = styleFor(a.level);
        return (
          <div key={a.id} className={`border-b ${wrap}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-start gap-3">
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-grow min-w-0 text-xs">
                <span className="font-bold">{a.pinned ? '📌 ' : ''}{a.title}</span>
                <span className="opacity-80"> — {a.body}</span>
              </div>
              <button
                onClick={() => dismiss(a.id)}
                className="shrink-0 rounded p-0.5 hover:bg-black/5"
                aria-label="Dismiss announcement"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
