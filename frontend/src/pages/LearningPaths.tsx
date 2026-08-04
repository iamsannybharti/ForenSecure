import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Route, Layers, Lock, ShieldAlert } from 'lucide-react';

export default function LearningPaths() {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learning-paths')
      .then(res => res.json())
      .then(data => setPaths(Array.isArray(data) ? data : []))
      .catch(() => setPaths([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="Learning Paths & Career Tracks"
        description="Structured, multi-course forensic career tracks with sequential unlocks, milestones, and a completion certificate."
        canonicalPath="/paths"
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-7xl mx-auto" data-reveal-stagger>
          <div className="mb-12">
            <span className="text-[11px] text-brand-glowCyan font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Route className="w-3.5 h-3.5" /> Structured Programs
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-3">
              Learning Paths
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl">
              Follow a guided sequence of courses from foundation to mastery. Enroll once to unlock every course in the
              track, progress step by step, and earn a track completion certificate.
            </p>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="w-8 h-8 border-2 border-brand-glowCyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paths.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paths.map(path => (
                <div
                  key={path.id}
                  className="flex flex-col bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-brand-glowCyan transition-all duration-300"
                >
                  <div className="p-5 flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                        {path.category}
                      </span>
                      {path.sequential && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <Lock className="w-3 h-3" /> Sequential
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-brand-deepBlue dark:text-white line-clamp-2 leading-snug mb-2">
                      {path.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {path.description}
                    </p>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Layers className="w-3.5 h-3.5 text-brand-glowCyan" />
                      {path.courses?.length || 0} courses
                    </span>
                  </div>
                  <div className="p-5 border-t border-slate-100 dark:border-brand-darkBorder flex items-center justify-end bg-slate-50/50 dark:bg-brand-darkBg/30">
                    <Link
                      to={`/paths/${path.slug}`}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-deepBlue dark:bg-brand-glowBlue hover:bg-brand-glowCyan transition-colors"
                    >
                      View Track
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder rounded-2xl">
              <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white mb-1">No learning paths published yet</h3>
              <p className="text-xs text-slate-500">Check back soon — structured tracks are being prepared.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
