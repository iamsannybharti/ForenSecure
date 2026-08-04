// Pure (IO-free) quiz grading for all supported question types.
// Shared by server.ts and quizGrading.selfcheck.ts. No DB, no side effects.
//
// Answer shapes (positional, aligned to questions[]):
//   mcq / tf : number (selected option index; -1 or null = unanswered)
//   multi    : number[] (selected option indices)
//   numeric  : number
//   short    : string

export type QAnswer = number | number[] | string | null | undefined;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const setsEqual = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every(x => sa.has(x));
};

export function isAnswered(question: any, answer: QAnswer): boolean {
  const type = question.questionType || 'mcq';
  switch (type) {
    case 'multi': return Array.isArray(answer) && answer.length > 0;
    case 'short': return typeof answer === 'string' && answer.trim() !== '';
    case 'numeric': return typeof answer === 'number' && !Number.isNaN(answer);
    default: return typeof answer === 'number' && answer >= 0; // mcq / tf
  }
}

export function isCorrect(question: any, answer: QAnswer): boolean {
  const type = question.questionType || 'mcq';
  switch (type) {
    case 'multi':
      return Array.isArray(answer) && setsEqual(answer as number[], question.correctOptionIndices || []);
    case 'numeric':
      return typeof answer === 'number' &&
        typeof question.correctNumeric === 'number' &&
        Math.abs(answer - question.correctNumeric) <= (question.numericTolerance || 0);
    case 'short':
      return typeof answer === 'string' &&
        (question.acceptedAnswers || []).some((a: string) => norm(a) === norm(answer));
    default: // mcq / tf
      return typeof answer === 'number' && answer === question.correctOptionIndex;
  }
}

export interface GradeOptions {
  negativeMarking?: boolean;
  negativeMarkFraction?: number; // fraction of a question's points removed per wrong (answered) question
  passingPercentage?: number;    // default 80
}

export function gradeQuiz(questions: any[], answers: QAnswer[], opts: GradeOptions = {}) {
  const fraction = opts.negativeMarkFraction ?? 0.25;
  const passMark = opts.passingPercentage ?? 80;

  let total = 0;
  let earned = 0;
  let correctCount = 0;

  questions.forEach((q, i) => {
    const points = q.points || 1;
    total += points;
    const answer = answers[i];
    if (isCorrect(q, answer)) {
      earned += points;
      correctCount++;
    } else if (opts.negativeMarking && isAnswered(q, answer)) {
      earned -= fraction * points;
    }
  });

  if (earned < 0) earned = 0;
  const score = total > 0 ? Math.round((earned / total) * 100) : 0;

  return {
    score,
    earned,
    total,
    correctCount,
    totalQuestions: questions.length,
    passed: score >= passMark
  };
}
