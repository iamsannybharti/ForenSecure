// Runnable self-check for per-type quiz grading + negative marking.
// Run: npx ts-node src/quizGrading.selfcheck.ts   (from backend/)
import assert from 'assert';
import { gradeQuiz, isCorrect, isAnswered } from './quizGrading';

const mcq = { questionType: 'mcq', options: ['a', 'b', 'c'], correctOptionIndex: 1, points: 1 };
const multi = { questionType: 'multi', options: ['a', 'b', 'c', 'd'], correctOptionIndices: [0, 2, 3], points: 2 };
const tf = { questionType: 'tf', options: ['True', 'False'], correctOptionIndex: 0, points: 1 };
const numeric = { questionType: 'numeric', correctNumeric: 45, numericTolerance: 0, points: 1 };
const numericTol = { questionType: 'numeric', correctNumeric: 9.8, numericTolerance: 0.1, points: 1 };
const short = { questionType: 'short', acceptedAnswers: ['netscan', 'net scan'], points: 1 };

// --- isCorrect per type ---
assert.ok(isCorrect(mcq, 1) && !isCorrect(mcq, 0), 'mcq');
assert.ok(isCorrect(multi, [3, 0, 2]), 'multi order-independent exact match');
assert.ok(!isCorrect(multi, [0, 2]), 'multi subset is wrong');
assert.ok(!isCorrect(multi, [0, 1, 2, 3]), 'multi superset is wrong');
assert.ok(isCorrect(tf, 0) && !isCorrect(tf, 1), 'tf');
assert.ok(isCorrect(numeric, 45) && !isCorrect(numeric, 44), 'numeric exact');
assert.ok(isCorrect(numericTol, 9.85) && !isCorrect(numericTol, 9.5), 'numeric within tolerance');
assert.ok(isCorrect(short, ' NetScan ') && isCorrect(short, 'net  scan'), 'short case/space-insensitive');
assert.ok(!isCorrect(short, 'pslist'), 'short wrong');

// --- isAnswered (blank detection) ---
assert.ok(!isAnswered(mcq, -1) && isAnswered(mcq, 0), 'mcq blank vs answered');
assert.ok(!isAnswered(multi, []) && isAnswered(multi, [1]), 'multi blank vs answered');
assert.ok(!isAnswered(short, '  ') && isAnswered(short, 'x'), 'short blank vs answered');
assert.ok(!isAnswered(numeric, null) && isAnswered(numeric, 0), 'numeric blank vs answered (0 is a real answer)');

// --- full quiz, all correct ---
const questions = [mcq, multi, tf, numeric, short]; // total points = 1+2+1+1+1 = 6
const allRight = gradeQuiz(questions, [1, [0, 2, 3], 0, 45, 'netscan'], { passingPercentage: 60 });
assert.strictEqual(allRight.total, 6, 'total points');
assert.strictEqual(allRight.earned, 6, 'earned all');
assert.strictEqual(allRight.score, 100, 'score 100');
assert.strictEqual(allRight.correctCount, 5, 'all five correct');
assert.ok(allRight.passed, 'passed');

// --- partial, no negative marking ---
const partial = gradeQuiz(questions, [1, [0, 2], 0, 45, 'wrong'], { passingPercentage: 60 });
// correct: mcq(1) + tf(1) + numeric(1) = 3 of 6 => 50%
assert.strictEqual(partial.earned, 3, 'earned 3 (multi & short wrong, no penalty)');
assert.strictEqual(partial.score, 50, 'score 50');
assert.ok(!partial.passed, 'not passed at 60% bar');

// --- negative marking penalizes answered-wrong only, not blanks ---
// answers: mcq wrong(0), multi blank([]), tf right(0), numeric wrong(44), short blank('')
// earned = tf(1) - 0.25*mcq(1) - 0.25*numeric(1) = 1 - 0.5 = 0.5 ; blanks not penalized
const neg = gradeQuiz(questions, [0, [], 0, 44, ''], { negativeMarking: true, negativeMarkFraction: 0.25, passingPercentage: 60 });
assert.strictEqual(neg.earned, 0.5, 'negative marking deducts for answered-wrong, spares blanks');
assert.strictEqual(neg.score, Math.round((0.5 / 6) * 100), 'neg score computed from earned/total');

// --- earned never goes below zero ---
const floored = gradeQuiz([mcq], [0], { negativeMarking: true, negativeMarkFraction: 5 });
assert.strictEqual(floored.earned, 0, 'earned floored at 0');

// --- back-compat: missing questionType treated as mcq ---
const legacy = gradeQuiz([{ options: ['a', 'b'], correctOptionIndex: 1 }], [1]);
assert.strictEqual(legacy.score, 100, 'legacy mcq (no questionType) grades correctly');

console.log('quizGrading.selfcheck: all assertions passed ✓');
