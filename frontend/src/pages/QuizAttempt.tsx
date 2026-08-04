import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { Timer, CheckCircle, XCircle, Award, ArrowLeft, Save } from 'lucide-react';

export default function QuizAttempt() {
  const { id } = useParams();
  const { token, refreshProfile } = useAuth();
  
  const [quiz, setQuiz] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(0);
  // Answer value varies by question type: number (mcq/tf), number[] (multi), number (numeric), string (short)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, any>>({});
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds default
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/quizzes/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Quiz not found');
        return res.json();
      })
      .then(data => {
        setQuiz(data);
        setTimeLeft(data.timeLimitMinutes * 60);
        setIsLoading(false);
      })
      .catch(reason => {
        setQuiz(null);
        setLoadError(reason instanceof Error ? reason.message : 'Unable to load this quiz');
        setIsLoading(false);
      });
  }, [id]);

  // Countdown timer effect
  useEffect(() => {
    if (quizCompleted || isLoading || !quiz) return;

    if (timeLeft <= 0) {
      handleSubmitQuiz();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, quizCompleted, isLoading, quiz]);

  const setAnswer = (val: any) => {
    setSelectedAnswers(prev => ({ ...prev, [activeQuestion]: val }));
  };

  const handleSelectOption = (optionIndex: number) => setAnswer(optionIndex);

  const toggleMultiOption = (optionIndex: number) => {
    setSelectedAnswers(prev => {
      const cur: number[] = Array.isArray(prev[activeQuestion]) ? prev[activeQuestion] : [];
      const next = cur.includes(optionIndex)
        ? cur.filter(x => x !== optionIndex)
        : [...cur, optionIndex].sort((a, b) => a - b);
      return { ...prev, [activeQuestion]: next };
    });
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);

    const answersArray = quiz.questions.map((q: any, idx: number) => {
      const a = selectedAnswers[idx];
      const type = q.questionType || 'mcq';
      if (type === 'multi') return Array.isArray(a) ? a : [];
      if (type === 'short') return typeof a === 'string' ? a : '';
      if (type === 'numeric') return typeof a === 'number' && !Number.isNaN(a) ? a : null;
      return a !== undefined ? a : -1; // mcq / tf
    });

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answersArray })
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data);
        setQuizCompleted(true);
        await refreshProfile();
      } else {
        throw new Error(data.message || 'Unable to submit this quiz');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to submit this quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-darkBg">
        <div className="w-10 h-10 border-4 border-brand-glowCyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-brand-darkBg p-4">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Quiz Not Found</h2>
        {loadError && <p className="mb-4 text-sm text-red-600">{loadError}</p>}
        <Link to="/quiz" className="text-sm font-semibold text-brand-glowCyan flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </Link>
      </div>
    );
  }

  const currentQuestion = quiz.questions[activeQuestion];
  const qType = currentQuestion.questionType || 'mcq';
  const curAnswer = selectedAnswers[activeQuestion];

  return (
    <>
      <SEO 
        title={`Attempting: ${quiz.title}`} 
        description="Secure environment assessment in progress." 
        canonicalPath={`/quiz/${quiz.id}`}
      />

      <div className="relative min-h-screen pt-8 pb-20 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <span className="text-xs font-bold text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {quiz.title}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 text-xs font-bold">
              <Timer className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Negative marking notice */}
          {!quizCompleted && quiz.negativeMarking && (
            <div className="mb-6 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg px-3 py-2">
              ⚠ Negative marking is enabled: wrong answers deduct a fraction of the question's points. Leave a question blank if unsure.
            </div>
          )}

          {/* Core Card switch */}
          {!quizCompleted ? (
            <div className="space-y-6">
              
              {/* Sequential progress */}
              <div
                className="flex items-center gap-3"
                role="progressbar"
                aria-label={`Question ${activeQuestion + 1} of ${quiz.questions.length}`}
                aria-valuemin={1}
                aria-valuemax={quiz.questions.length}
                aria-valuenow={activeQuestion + 1}
              >
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-brand-darkBorder">
                  <div
                    className="h-full rounded-full bg-brand-deepBlue transition-[width] dark:bg-brand-glowBlue"
                    style={{ width: `${((activeQuestion + 1) / quiz.questions.length) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 rounded-lg bg-brand-deepBlue px-3 py-1.5 text-xs font-bold text-white dark:bg-brand-glowBlue">
                  {activeQuestion + 1}/{quiz.questions.length}
                </span>
              </div>

              {/* Active Question Box */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-brandBorder shadow-sm">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2">
                  Question {activeQuestion + 1} of {quiz.questions.length}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-brand-deepBlue dark:text-white mb-6 leading-snug">
                  {currentQuestion.questionText}
                </h2>

                {/* Type badge + optional hint */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan">
                    {qType === 'multi' ? 'Multi-select' : qType === 'tf' ? 'True / False' : qType === 'numeric' ? 'Numeric' : qType === 'short' ? 'Short answer' : 'Single choice'}
                  </span>
                  {qType === 'multi' && <span className="text-[11px] text-slate-400">Select all that apply</span>}
                </div>

                {/* Single-choice / True-False */}
                {(qType === 'mcq' || qType === 'tf') && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition-all ${
                          curAnswer === idx
                            ? 'border-brand-glowCyan bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan'
                            : 'border-slate-200 dark:border-brand-darkBorder hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-brand-darkBg/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-brand-darkBorder text-[11px] font-bold text-slate-500">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Multi-select */}
                {qType === 'multi' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option: string, idx: number) => {
                      const checked = Array.isArray(curAnswer) && curAnswer.includes(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleMultiOption(idx)}
                          className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition-all ${
                            checked
                              ? 'border-brand-glowCyan bg-brand-deepBlue/5 dark:bg-brand-glowCyan/10 text-brand-deepBlue dark:text-brand-glowCyan'
                              : 'border-slate-200 dark:border-brand-darkBorder hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-brand-darkBg/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-5 h-5 rounded border-2 text-[11px] font-bold ${checked ? 'bg-brand-glowCyan border-brand-glowCyan text-slate-900' : 'border-slate-300 dark:border-brand-darkBorder text-transparent'}`}>
                              ✓
                            </span>
                            <span>{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Numeric */}
                {qType === 'numeric' && (
                  <input
                    type="number"
                    value={typeof curAnswer === 'number' ? curAnswer : ''}
                    onChange={e => setAnswer(e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="Enter a number"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkBg/50 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-glowCyan"
                  />
                )}

                {/* Short answer */}
                {qType === 'short' && (
                  <input
                    type="text"
                    value={typeof curAnswer === 'string' ? curAnswer : ''}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your answer"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-brand-darkBorder bg-slate-50/50 dark:bg-brand-darkBg/50 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-glowCyan"
                  />
                )}
              </div>

              {/* Navigation Actions Row */}
              <div className="flex justify-end items-center gap-4">
                {activeQuestion === quiz.questions.length - 1 ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="flex items-center gap-1 px-5 py-2.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-500 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Finish Assessment'}
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveQuestion(prev => prev + 1)}
                    className="px-4 py-2.5 rounded-lg bg-brand-deepBlue text-white dark:bg-brand-glowBlue text-xs font-bold hover:bg-brand-glowCyan transition-colors"
                  >
                    Next
                  </button>
                )}
              </div>

            </div>
          ) : (
            
            /* Results splash block */
            <div className="p-8 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-xl text-center space-y-6">
              <div className="flex justify-center">
                {results?.passed ? (
                  <CheckCircle className="w-16 h-16 text-green-500" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500" />
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-brand-deepBlue dark:text-white heading-display">
                  {results?.passed ? 'Assessment Passed!' : 'Assessment Failed'}
                </h2>
                <p className="text-xs text-slate-500 mt-2">
                  You scored <span className="font-bold text-slate-800 dark:text-white">{results?.score}%</span>. 
                  ({results?.correctCount} out of {results?.totalQuestions} correct answers).
                </p>
              </div>

              {results?.passed ? (
                <div className="p-5 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 max-w-md mx-auto space-y-4">
                  <div className="flex items-center gap-3 text-left">
                    <Award className="w-10 h-10 text-amber-500" />
                    <div>
                      <span className="block text-xs font-bold text-brand-deepBlue dark:text-white">
                        Digital Credential Secured
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Code: {results.certificate?.certificateId}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/certificates/${results.certificate?.certificateId}`}
                      className="flex-grow py-2 text-center text-xs font-bold text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                    >
                      View Certificate
                    </Link>
                    <Link
                      to="/dashboard"
                      className="px-4 py-2 text-center text-xs font-bold border border-green-300 dark:border-green-900 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100/50"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 max-w-md mx-auto space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You did not reach the required passing score for the verified certificate badge. You can study the curriculum and attempt this challenge again.
                  </p>
                  <button
                    onClick={() => { setQuizCompleted(false); setActiveQuestion(0); setSelectedAnswers({}); setTimeLeft(quiz.timeLimitMinutes * 60); }}
                    className="inline-block text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                  >
                    Retry Assessment
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-brand-darkBorder">
                <Link to="/quiz" className="text-xs text-slate-400 hover:text-brand-glowCyan flex items-center gap-1 justify-center">
                  <ArrowLeft className="w-4 h-4" /> Back to Quizzes
                </Link>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
