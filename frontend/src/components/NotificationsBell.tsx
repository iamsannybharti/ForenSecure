import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'critical';
  actionUrl?: string;
  read: boolean;
  createdAt: string;
};

const typeClass: Record<string, string> = {
  info: 'border-brand-glowCyan/30 bg-brand-glowCyan/5',
  success: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20',
  warning: 'border-amber-300 bg-amber-50 dark:bg-amber-950/20',
  critical: 'border-red-300 bg-red-50 dark:bg-red-950/20'
};

export default function NotificationsBell() {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const unread = useMemo(() => items.filter(i => !i.read).length, [items]);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setItems(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
    else setItems([]);
  }, [isAuthenticated, token]);

  const markRead = async (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
  };

  const markAllRead = async () => {
    setItems(prev => prev.map(i => ({ ...i, read: true })));
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-brand-darkBg transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 font-bold text-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-brand-darkBorder">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Notifications</span>
            <button
              onClick={markAllRead}
              className="text-[11px] font-bold text-brand-glowBlue hover:text-brand-deepBlue flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Read all
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2 space-y-2">
            {items.length === 0 && (
              <div className="p-5 text-center text-xs text-slate-400">No notifications yet.</div>
            )}

            {items.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border ${typeClass[item.type] || typeClass.info} ${item.read ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => markRead(item.id)} className="text-left min-w-0 flex-1">
                    <span className="block text-xs font-extrabold text-brand-deepBlue dark:text-white leading-snug">
                      {!item.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-glowCyan mr-1.5 align-middle"></span>}
                      {item.title}
                    </span>
                    <span className="block text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{item.body}</span>
                    <span className="block text-[11px] text-slate-400 mt-2">
                      {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>

                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="text-slate-300 hover:text-red-500 p-1"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {item.actionUrl && (
                  <Link
                    to={item.actionUrl}
                    onClick={() => {
                      markRead(item.id);
                      setOpen(false);
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-glowBlue hover:text-brand-deepBlue"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
