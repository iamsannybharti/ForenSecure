import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Bell, Send } from 'lucide-react';

type Props = {
  token: string | null;
};

export default function AdminNotificationsPanel({ token }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'info',
    actionUrl: '',
    target: 'all',
    role: 'student',
    userId: ''
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, [token]);

  const targetCount = useMemo(() => {
    if (form.target === 'user') return form.userId ? 1 : 0;
    if (form.target === 'role') return users.filter(u => u.role === form.role).length;
    return users.length;
  }, [form.target, form.userId, form.role, users]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !form.title.trim() || !form.body.trim()) return;
    setSending(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Notification failed');
      setMessage(`${data.message}: ${data.count} recipient${data.count === 1 ? '' : 's'}`);
      setForm(prev => ({ ...prev, title: '', body: '', actionUrl: '' }));
    } catch (err: any) {
      setMessage(err.message || 'Notification failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="fs-eyebrow">In-App Messages</div>
        <h2 className="fs-page-title">Notifications</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Send a short in-app notification to every account, one role, or one user.
        </p>
      </div>

      <form onSubmit={submit} className="p-5 rounded-2xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Title</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-sm"
              placeholder="Certificate ready"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Action URL</label>
            <input
              value={form.actionUrl}
              onChange={e => setForm({ ...form, actionUrl: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-sm"
              placeholder="/certificates"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Body</label>
          <textarea
            required
            rows={3}
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-sm"
            placeholder="Your requested certificate has been issued."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-sm"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">Target</label>
            <select
              value={form.target}
              onChange={e => setForm({ ...form, target: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-sm"
            >
              <option value="all">All users</option>
              <option value="role">By role</option>
              <option value="user">One user</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
              {form.target === 'user' ? 'User' : 'Role'}
            </label>
            {form.target === 'user' ? (
              <select
                value={form.userId}
                onChange={e => setForm({ ...form, userId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-sm"
              >
                <option value="">Select user</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            ) : (
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                disabled={form.target === 'all'}
                className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-sm disabled:opacity-50"
              >
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admins</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-brand-glowCyan" /> {targetCount} matched recipient{targetCount === 1 ? '' : 's'}
          </span>
          <button
            type="submit"
            disabled={sending || targetCount === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-deepBlue text-white hover:bg-brand-glowBlue text-xs font-bold disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>

        {message && <p className="text-xs font-semibold text-brand-glowBlue">{message}</p>}
      </form>
    </div>
  );
}
