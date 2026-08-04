import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { Route, Lock, CheckCircle2, Circle, Award, ArrowRight } from 'lucide-react';

export default function LearningPathDetails() {
  const { slug } = useParams();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  const [path, setPath] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const loadProgress = useCallback((pathId: string) => {
    if (!isAuthenticated || !token) return;
    fetch(`/api/learning-paths/${pathId}/progress`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => data && setProgress(data))
      .catch(() => {});
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetch(`/api/learning-paths/${slug}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setPath(data);
        if (data?.id) loadProgress(data.id);
      })
      .catch(() => setPath(null))
      .finally(() => setLoading(false));
  }, [slug, loadProgress]);

  const handleEnroll = async () => {
    if (!isAuthenticated) return navigate('/login');
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/learning-paths/${path.id}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessage(data.message || 'Enrolled');
      loadProgress(path.id);
    } catch {
      setMessage('Enrollment failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/learning-paths/${path.id}/claim-certificate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessage(data.message || (res.ok ? 'Certificate issued' : 'Could not claim certificate'));
    } catch {
      setMessage('Certificate request failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="w-8 h-8 border-2 border-brand-glowCyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 bg-slate-50 dark:bg-brand-darkBg">
        <h2 className="text-lg font-bold text-brand-deepBlue dark:text-white mb-2">Learning path not found</h2>
        <Link to="/paths" className="text-xs font-semibold text-brand-glowBlue hover:underline">Back to all paths</Link>
      </div>
    );
  }

  // Prefer live progress items (has locked/complete); fall back to static course summaries.
  const courses = progress?.items || path.courseSummaries || [];
  const enrolled = !!progress?.enrolled;
  const requiredCount = progress?.requiredCount ?? courses.filter((c: any) => c.required).length;
  const completedRequired = progress?.completedRequired ?? 0;
  const pct = requiredCount > 0 ? Math.round((completedRequired / requiredCount) * 100) : 0;
  const pathComplete = !!progress?.pathComplete;

  return (
    <>
      <SEO title={path.title} description={path.description} canonicalPath={`/paths/${path.slug}`} />

      <div className="min-h-screen pt-10 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-4xl mx-auto" data-reveal-stagger>
          <Link to="/paths" className="text-xs font-semibold text-slate-400 hover:text-brand-glowCyan flex items-center gap-1 mb-6">
            ← All Learning Paths
          </Link>

          {/* Header */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm mb-8">
            <span className="text-[11px] text-brand-glowCyan font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Route className="w-3.5 h-3.5" /> {path.category}{path.sequential ? ' · Sequential' : ''}
            </span>
            <h1 className="text-2xl font-extrabold heading-display text-brand-deepBlue dark:text-white mb-3">{path.title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{path.description}</p>

            {/* Progress bar (only meaningful once enrolled) */}
            {enrolled && (
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                  <span>Track Progress</span>
                  <span>{completedRequired}/{requiredCount} required · {pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-brand-darkBg overflow-hidden">
                  <div className="h-full bg-brand-glowCyan transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {!enrolled ? (
                <button
                  onClick={handleEnroll}
                  disabled={busy}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan transition-colors disabled:opacity-60"
                >
                  {busy ? 'Enrolling…' : 'Enroll in Track'}
                </button>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={busy || !pathComplete}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-slate-900 bg-brand-glowCyan hover:bg-brand-glowBlue hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={pathComplete ? 'Claim your track certificate' : 'Complete all required courses first'}
                >
                  <Award className="w-4 h-4" /> {busy ? 'Processing…' : 'Claim Certificate'}
                </button>
              )}
              {message && <span className="text-xs font-semibold text-brand-glowBlue dark:text-brand-glowCyan">{message}</span>}
            </div>
          </div>

          {/* Course sequence */}
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Course Sequence</h2>
          <ol className="space-y-3">
            {courses.map((c: any, idx: number) => {
              const complete = !!c.complete;
              const locked = !!c.locked;
              return (
                <li
                  key={c.courseId || c.id || idx}
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-brand-darkCard border transition-colors ${
                    complete ? 'border-brand-glowCyan/50' : 'border-slate-200 dark:border-brand-darkBorder'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-brand-darkBg text-xs font-bold text-slate-500 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white line-clamp-1">{c.title}</h3>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {c.required === false ? 'Elective' : 'Required'}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {complete ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Done</span>
                    ) : locked ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-400"><Lock className="w-4 h-4" /> Locked</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-400"><Circle className="w-4 h-4" /> Open</span>
                    )}
                    {!locked && c.slug && (
                      <Link
                        to={`/courses/${c.slug}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan transition-colors"
                      >
                        Go <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </>
  );
}
