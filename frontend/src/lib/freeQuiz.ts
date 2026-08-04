export interface FreeQuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

export const FREE_QUIZ_PASS_MARK = 8;
export const FREE_QUIZ_LENGTH = 10;

export function pickRandomQuestions(
  bank: FreeQuizQuestion[],
  count = FREE_QUIZ_LENGTH
): FreeQuizQuestion[] {
  const pool = bank.slice();
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
