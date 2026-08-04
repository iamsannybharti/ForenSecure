import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './FsIcons';
import { LogoMark } from './Logo';
import CertificateCanvas from './CertificateCanvas';
import { pickRandomQuestions, FREE_QUIZ_LENGTH, FREE_QUIZ_PASS_MARK, type FreeQuizQuestion } from '../lib/freeQuiz';

const RING_C = 2 * Math.PI * 33; // r=33

const REVEAL_MS = 400;

type QuizState = {
  questions: FreeQuizQuestion[];
  index: number;
  score: number;
  picked: number | null;
};

export default function FreeQuizCard() {
  const { isAuthenticated, user } = useAuth();
  const [dbQuestions, setDbQuestions] = useState<FreeQuizQuestion[]>([]);
  const [quiz, setQuiz] = useState<QuizState | null>(null);

  useEffect(() => {
    fetch('/api/quizzes/free-preview')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('quiz'))))
      .then(data => {
        if (Array.isArray(data.questions)) {
          const formatted: FreeQuizQuestion[] = data.questions
            .filter((q: any) => (q.questionType || 'mcq') === 'mcq')
            .map((q: any) => ({
            q: q.questionText,
            options: q.options,
            answer: q.correctOptionIndex
          }));
          setDbQuestions(formatted);
        }
      })
      .catch(() => {});
  }, []);

  const start = () => {
    if (!dbQuestions.length) return;
    setQuiz({ questions: pickRandomQuestions(dbQuestions), index: 0, score: 0, picked: null });
  };

  const answer = (choice: number) => {
    if (!quiz || quiz.picked !== null) return;
    const correct = choice === quiz.questions[quiz.index].answer;
    setQuiz({ ...quiz, picked: choice, score: quiz.score + (correct ? 1 : 0) });
    setTimeout(
      () => setQuiz(current => (current ? { ...current, index: current.index + 1, picked: null } : current)),
      REVEAL_MS
    );
  };

  const total = quiz?.questions.length ?? Math.min(dbQuestions.length, FREE_QUIZ_LENGTH);
  const finished = quiz !== null && quiz.index >= total;
  const passed = finished && quiz.score >= FREE_QUIZ_PASS_MARK;
  const scorePercent = finished ? Math.round((quiz.score / total) * 100) : 0;
  const passPercent = Math.round((FREE_QUIZ_PASS_MARK / (total || FREE_QUIZ_LENGTH)) * 100);

  const current = quiz && !finished ? quiz.questions[quiz.index] : dbQuestions[0] ?? null;

  const claimUrl = isAuthenticated 
    ? '/certificates?claim=free-quiz'
    : `/login?redirect=${encodeURIComponent('/certificates?claim=free-quiz')}`;

  return (
    <>
      <div className={`quiz-mock${finished ? '' : ' quiz-mock--answering'}`}>
        <div className="quiz-mock__head">
          <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-glowCyan">
            <LogoMark className="w-4 h-4" /> Forensic Quiz Dashboard
          </span>
          <span className="text-xs font-bold text-slate-400">
            {finished ? 'Results' : total ? `Question ${(quiz?.index ?? 0) + 1}/${total}` : 'Loading quiz'}
          </span>
        </div>

        {finished ? (
          <div className="quiz-mock__question quiz-result space-y-3 py-2" aria-live="polite">
            <p className="quiz-result__title text-lg font-extrabold text-white">
              {passed ? '🎉 Congratulations!' : 'Good Effort!'}
            </p>
            <div className="quiz-result__score text-3xl font-extrabold text-brand-glowCyan">
              {quiz.score} <span className="text-sm font-normal text-slate-400">/ {total} Questions</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              {passed
                ? `Awesome! You solved ${quiz.score}/${total} questions (${FREE_QUIZ_PASS_MARK}/${total} required). Your Free Forensic Science Certificate is unlocked!`
                : `You scored ${quiz.score}/${total}. Score ${FREE_QUIZ_PASS_MARK}/${total} or higher to qualify for your free certificate.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {passed ? (
                <>
                  <Link
                    to={claimUrl}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    Claim &amp; Download Free Certificate <Icon id="i-arrow" />
                  </Link>
                  <Link
                    to="/quiz"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    Explore More Quizzes
                  </Link>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    onClick={start} 
                    className="px-4 py-2.5 rounded-xl bg-brand-deepBlue hover:bg-brand-glowBlue text-white text-xs font-bold transition-colors"
                  >
                    Retake Free Quiz
                  </button>
                  <Link
                    to="/quiz"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    Explore More Quizzes
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="quiz-mock__question space-y-3">
            <p className="text-xs font-extrabold text-white leading-relaxed">
              {current ? `Q${(quiz?.index ?? 0) + 1}. ${current.q}` : 'No quiz is available yet.'}
            </p>

            <div className="space-y-2">
              {(current?.options ?? []).map((option, i) => {
                const revealed = quiz?.picked !== null && quiz !== null;
                const isPicked = revealed && quiz.picked === i;
                const isAnswer = revealed && current !== null && current.answer === i;
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => (quiz ? answer(i) : start())}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2.5 ${
                      isAnswer
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                        : isPicked && !isAnswer
                        ? 'bg-red-950/60 border-red-500 text-red-300 font-bold'
                        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
                      isAnswer ? 'bg-emerald-500 border-emerald-400' : isPicked ? 'bg-red-500 border-red-400' : 'border-slate-500'
                    }`} />
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {finished && (
          <div className="quiz-mock__side pt-2">
            <div className="progress-ring">
              <svg width="78" height="78" viewBox="0 0 78 78" aria-hidden="true">
                <circle className="progress-ring__bg" cx="39" cy="39" r="33" fill="none" strokeWidth="7" />
                <circle
                  className="progress-ring__val"
                  cx="39" cy="39" r="33" fill="none" strokeWidth="7"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - scorePercent / 100)}
                />
              </svg>
              <span className="progress-ring__label">{scorePercent}%</span>
            </div>
            <span className="quiz-mock__side-label text-[11px] font-bold text-slate-400 mt-1 block text-center">Final accuracy</span>
          </div>
        )}

        <Link to="/quiz" className="btn btn--primary btn--sm quiz-mock__btn">
          All Quizzes
        </Link>
      </div>

      <div className="quiz-promo__mid">
        <div className="eyebrow">Free Baseline Quiz</div>
        <h2>Test. Learn. Earn.<br />Grow your career.</h2>
        <p>Take our free forensic quiz, score 8/10 or higher, and earn your verified certificate instantly.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={start} disabled={!dbQuestions.length} className="btn btn--primary disabled:opacity-50">
            {!dbQuestions.length ? 'Quiz Unavailable' : quiz === null ? 'Take Quiz Now' : 'Restart Quiz'} <Icon id="i-arrow" />
          </button>
          <Link to="/quiz" className="btn btn--secondary">
            Explore All Quizzes
          </Link>
        </div>
      </div>

      {/* Preview of what a pass earns. */}
      <div className="certificate-preview" aria-label="Certificate preview">
        <CertificateCanvas
          cert={{
            studentName: user?.name || 'Student Name',
            courseName: 'Forensic Science Baseline Quiz',
            certificateId: 'FSC-CERTIFICATE-PREVIEW',
            issueDate: new Date().toISOString(),
            grade: finished ? `Score: ${scorePercent}%` : `Pass mark: ${passPercent}%`,
            mode: 'Online'
          }}
        />
      </div>
    </>
  );
}
