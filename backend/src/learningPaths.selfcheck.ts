// Runnable self-check for the learning-path completion + sequential-unlock logic.
// Run: npx ts-node src/learningPaths.selfcheck.ts   (from the backend/ dir)
import assert from 'assert';
import { isCourseComplete, computePathProgress } from './learningPathLogic';

// Courses: fp/scene have no subtopics (auto-complete); cyber has one subtopic.
const fp = { id: 'c3', slug: 'fp', title: 'Fingerprints', topics: [] };
const scene = { id: 'c2', slug: 'scene', title: 'Crime Scene', topics: [] };
const cyber = { id: 'c1', slug: 'cyber', title: 'Cyber Forensics', topics: [{ subTopics: [{}] }] };

// --- isCourseComplete ---
assert.strictEqual(isCourseComplete(fp, undefined), true, 'no-content course counts complete');
assert.strictEqual(isCourseComplete(cyber, undefined), false, 'content course not complete without progress');
assert.strictEqual(
  isCourseComplete(cyber, { courseId: 'c1', completedSubTopics: ['Foundational'] }),
  true,
  'completed subtopic => complete'
);

// --- sequential path, fresh learner (no progress) ---
const fresh = [
  { entry: { order: 0, required: true }, course: fp, progress: undefined },
  { entry: { order: 1, required: true }, course: scene, progress: undefined },
  { entry: { order: 2, required: true }, course: cyber, progress: undefined }
];
const r1 = computePathProgress(fresh, true);
assert.strictEqual(r1.items[2].locked, false, 'cyber unlocked (fp+scene auto-complete)');
assert.strictEqual(r1.items[2].complete, false, 'cyber still incomplete');
assert.strictEqual(r1.pathComplete, false, 'path incomplete while cyber pending');
assert.strictEqual(r1.nextCourseSlug, 'cyber', 'next actionable course is cyber');
assert.strictEqual(r1.completedRequired, 2, 'two required courses already complete');

// --- cyber completed => path complete ---
const done = fresh.map(x =>
  x.course === cyber ? { ...x, progress: { courseId: 'c1', completedSubTopics: ['x'] } } : x
);
const r2 = computePathProgress(done, true);
assert.strictEqual(r2.pathComplete, true, 'path complete when all required done');
assert.strictEqual(r2.nextCourseSlug, null, 'no next course when everything complete');

// --- sequential lock: a content course at the front blocks later ones ---
const gate = { id: 'g', slug: 'gate', title: 'Gate', topics: [{ subTopics: [{}] }] };
const gated = computePathProgress(
  [
    { entry: { order: 0, required: true }, course: gate, progress: undefined },
    { entry: { order: 1, required: true }, course: cyber, progress: undefined }
  ],
  true
);
assert.strictEqual(gated.items[1].locked, true, 'second course locked while gate incomplete');

// --- non-sequential: nothing is ever locked ---
const parallel = computePathProgress(
  [
    { entry: { order: 0, required: true }, course: gate, progress: undefined },
    { entry: { order: 1, required: true }, course: cyber, progress: undefined }
  ],
  false
);
assert.strictEqual(parallel.items[1].locked, false, 'no locking when path is not sequential');

// --- electives do not gate completion ---
const withElective = computePathProgress(
  [
    { entry: { order: 0, required: true }, course: fp, progress: undefined },
    { entry: { order: 1, required: false }, course: cyber, progress: undefined } // elective, incomplete
  ],
  false
);
assert.strictEqual(withElective.pathComplete, true, 'incomplete elective does not block path completion');

console.log('learningPaths.selfcheck: all assertions passed ✓');
