import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, BookOpen, Search, User, Plus, X, Paperclip, CheckCircle, Trash2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from '../components/RichTextEditor';

interface Attachment { name: string; url: string }

const emptyForm = { title: '', subtitle: '', category: 'Digital Forensics', readTimeMinutes: 5, content: '' };

export default function Blogs() {
  const { user, token } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStaff = !!user && ['teacher', 'faculty', 'admin'].includes(user.role);

  const fetchBlogs = () => {
    setLoading(true);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch('/api/blogs', { headers })
      .then(async response => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Unable to load research articles');
        }
        return response.json();
      })
      .then(data => setBlogs(Array.isArray(data) ? data : []))
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Unable to load research articles'))
      .finally(() => setLoading(false));
  };

  // Refetch when auth resolves so staff see their pending drafts.
  useEffect(() => { fetchBlogs(); }, [token]);

  // Uploads one file to the shared uploads endpoint, returns {name, url}.
  const uploadFile = async (file: File): Promise<Attachment | null> => {
    if (!token) return null;
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      alert(b.message || 'Upload failed');
      return null;
    }
    const data = await res.json();
    return { name: data.name, url: data.url };
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const uploaded = await uploadFile(file);
      if (uploaded) setAttachments(prev => [...prev, uploaded]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Passed to the editor's image button: pick a file, upload, hand back the URL.
  const requestImage = (): Promise<string | null> =>
    new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const uploaded = await uploadFile(file);
        resolve(uploaded?.url || null);
      };
      input.click();
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.content.trim()) { alert('Article body is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, authorName: user?.name, attachments })
      });
      const data = await res.json();
      if (res.ok) {
        setNotice(data.message || 'Article submitted.');
        setShowModal(false);
        setForm(emptyForm);
        setAttachments([]);
        fetchBlogs();
      } else {
        alert(data.message || 'Failed to publish article.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string, approvalStatus: 'approved' | 'rejected') => {
    if (!token) return;
    const res = await fetch(`/api/admin/blogs/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ approvalStatus })
    });
    if (res.ok) {
      setNotice(`Article ${approvalStatus}.`);
      fetchBlogs();
    } else {
      alert('Failed to update article.');
    }
  };

  const visibleBlogs = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return blogs;
    return blogs.filter(blog => [blog.title, blog.subtitle, blog.category, blog.authorName, ...(blog.tags || [])].some(item => String(item || '').toLowerCase().includes(value)));
  }, [blogs, query]);

  return (
    <>
      <SEO title="Forensic Research & Insights" description="Explore database-published forensic case studies, technical articles and investigation research." canonicalPath="/blogs" />
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">Research &amp; Insights</span>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">The ForenSecure Blog</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">Field notes, case studies and research published by forensic practitioners.</p>
            </div>
            {isStaff && (
              <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Write Article
              </button>
            )}
          </div>

          <label className="relative mt-7 block max-w-2xl">
            <span className="sr-only">Search articles</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search articles" className="h-14 w-full rounded-full border border-slate-200 bg-white pl-11 pr-5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </label>

          {notice && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {notice}</span>
              <button onClick={() => setNotice('')} className="rounded-full p-1 hover:bg-green-100"><X className="h-4 w-4" /></button>
            </div>
          )}

          {showModal ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Research & Articles
                </button>
                <h2 className="text-base font-extrabold text-slate-950">Write a Research Article</h2>
              </div>

              <p className="text-xs text-slate-500">Submitted articles are published once an admin approves them.</p>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Deciphering NTFS MFT Artifacts" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Subtitle</label>
                  <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="One-line summary shown under the title" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Category</label>
                    <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Read time (minutes)</label>
                    <input type="number" min={1} max={120} value={form.readTimeMinutes} onChange={e => setForm({ ...form, readTimeMinutes: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Article body</label>
                  <RichTextEditor value={form.content} onChange={html => setForm({ ...form, content: html })} onRequestImage={requestImage} minHeight="14rem" placeholder="Write your article. Use the image button to embed figures." />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Attachments</label>
                  <input ref={fileInputRef} type="file" multiple onChange={handleAttach} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
                    <Paperclip className="h-3.5 w-3.5" /> Add files
                  </button>
                  {attachments.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {attachments.map((a, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
                          <span className="truncate text-slate-600">{a.name}</span>
                          <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Submitting...' : 'Submit Article'}</button>
                </div>
              </form>
            </div>
          ) : loading ? (
            <div className="grid min-h-[320px] place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
          ) : error ? (
            <div className="mt-10 rounded-[18px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
          ) : visibleBlogs.length > 0 ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleBlogs.map(blog => (
                <article key={blog.id} className="flex min-h-72 flex-col rounded-[18px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-700">{blog.category || 'Research'}</span>
                    <span className="flex items-center gap-1 text-slate-400"><BookOpen className="h-3.5 w-3.5" />{blog.readTimeMinutes || 5} min</span>
                  </div>
                  {isStaff && blog.approvalStatus && blog.approvalStatus !== 'approved' && (
                    <span className={`mt-3 w-fit rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${blog.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                      {blog.approvalStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}
                    </span>
                  )}
                  <h2 className="mt-4 text-xl font-extrabold leading-snug text-slate-950">{blog.title}</h2>
                  {blog.subtitle && <p className="mt-1.5 text-sm font-medium text-slate-500">{blog.subtitle}</p>}
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{String(blog.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}</p>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500"><User className="h-3.5 w-3.5 text-blue-600" />{blog.authorName}</span>
                    <Link to={`/blogs/${blog.slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">Read <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                  {user?.role === 'admin' && blog.approvalStatus === 'pending' && (
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                      <button onClick={() => handleApprove(blog.id, 'approved')} className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700">Approve</button>
                      <button onClick={() => handleApprove(blog.id, 'rejected')} className="flex-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100">Reject</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-[18px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No published articles match your search.</div>
          )}
        </div>
      </div>
    </>
  );
}
