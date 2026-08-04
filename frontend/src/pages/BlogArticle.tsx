import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Paperclip, Tag, User } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

export default function BlogArticle() {
  const { slug } = useParams();
  const { token } = useAuth();
  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`/api/blogs/${encodeURIComponent(slug || '')}`, { headers })
      .then(async response => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Article not found');
        }
        return response.json();
      })
      .then(setBlog)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Unable to load this article'))
      .finally(() => setLoading(false));
  }, [slug, token]);

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center bg-slate-50"><div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  if (!blog) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-6 text-center">
        <div><h1 className="text-2xl font-extrabold">Article unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link to="/blogs" className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"><ArrowLeft className="h-4 w-4" />Back to research</Link></div>
      </div>
    );
  }

  return (
    <>
      <SEO title={blog.title} description={(blog.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155)} canonicalPath={`/blogs/${blog.slug}`} />
      <article className="min-h-screen bg-slate-50 pb-20 pt-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link to="/blogs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4" />Research</Link>

          <header className="rounded-[26px] bg-slate-950 px-7 py-12 text-white shadow-xl sm:px-12 sm:py-16">
            <span className="inline-flex rounded-lg bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">{blog.category || 'Forensic Research'}</span>
            <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">{blog.title}</h1>
            {blog.subtitle && <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{blog.subtitle}</p>}
          </header>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 pb-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-blue-600" />{blog.authorName}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-blue-600" />{new Date(blog.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-blue-600" />{blog.readTimeMinutes || 5} min read</span>
          </div>

          <div className="article-content mt-8 rounded-[18px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10" dangerouslySetInnerHTML={{ __html: blog.content }} />

          {blog.attachments?.length > 0 && (
            <div className="mt-6 rounded-[18px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Attachments</h2>
              <ul className="mt-3 space-y-2">
                {blog.attachments.map((a: { name: string; url: string }, i: number) => (
                  <li key={i}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                      <Paperclip className="h-4 w-4" />{a.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {blog.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {blog.tags.map((tag: string) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"><Tag className="h-3 w-3" />{tag}</span>)}
            </div>
          )}
        </div>
      </article>
    </>
  );
}
