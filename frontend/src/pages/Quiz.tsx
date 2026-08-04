import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { Timer, BookOpen, AlertCircle } from 'lucide-react';

export default function Quiz() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/quizzes')
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Unable to load quizzes');
        }
        return res.json();
      })
      .then(data => setQuizzes(Array.isArray(data) ? data : []))
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Unable to load quizzes'))
      .finally(() => setIsLoading(false));
  }, []);

  // The ScrollReveal observer fires once on route mount — before async data lands.
  // Force-reveal the stagger container after the fetch completes so cards aren't stuck at opacity:0.
  useEffect(() => {
    if (isLoading) return;
    const frame = requestAnimationFrame(() => {
      document.querySelectorAll('[data-reveal-stagger]').forEach(el => {
        el.classList.add('is-visible');
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [isLoading]);

  const handleStartQuiz = (quizId: string) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(`/quiz/${quizId}`));
      return;
    }
    navigate(`/quiz/${quizId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="w-10 h-10 border-4 border-brand-glowCyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Forensic Assessment Quizzes"
        description="Challenge your forensic science knowledge. Complete our assessments with 80% score or higher to earn credentials."
        canonicalPath="/quiz"
      />

      <div className="relative min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-4xl mx-auto" data-reveal-stagger>

          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold tracking-tight heading-display text-brand-deepBlue dark:text-white mb-3">
              Assessment Quizzes
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl mx-auto">
              Secure certification credentials by demonstrating core knowledge. Score 80% or higher to trigger an automatic credential certificate.
            </p>
          </div>

          <div className="space-y-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
            ) : quizzes.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No active quizzes are currently published.</div>
            ) : quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder hover:border-brand-glowCyan hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-grow space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                      {quiz.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <Timer className="w-3.5 h-3.5 text-brand-glowCyan" />
                      {quiz.timeLimitMinutes} Mins
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-brand-glowCyan" />
                      {quiz.questionsCount ?? quiz.questions?.length ?? 0} Questions
                    </span>
                  </div>

                  <h2 className="text-base font-extrabold text-brand-deepBlue dark:text-white">
                    {quiz.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                    {quiz.description}
                  </p>
                </div>

                <div className="flex-shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-deepBlue to-brand-glowBlue hover:from-brand-glowBlue hover:to-brand-glowCyan transition-all duration-300 text-center"
                  >
                    Attempt Assessment
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium text-center flex items-center gap-1 justify-center">
                    <AlertCircle className="w-3 h-3 text-brand-glowCyan" />
                    Passing threshold: 80%
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
