import assert from 'assert';
import { pickRandomQuestions } from './freeQuiz.ts';

const bank = Array.from({ length: 20 }, (_, i) => ({
  q: `Question ${i + 1}`,
  options: ['A', 'B', 'C', 'D'],
  answer: i % 4
}));
const before = bank.map(item => item.q).join('|');
const picked = pickRandomQuestions(bank, 10);

assert.strictEqual(picked.length, 10);
assert.strictEqual(new Set(picked.map(item => item.q)).size, 10);
assert.strictEqual(bank.map(item => item.q).join('|'), before, 'bank order was mutated');
assert.strictEqual(pickRandomQuestions(bank, 999).length, bank.length);

console.log('freeQuiz.selfcheck: all assertions passed');
