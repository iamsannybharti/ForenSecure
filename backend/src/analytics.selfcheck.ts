// Runnable self-check for analytics aggregation.
// Run: npx ts-node src/analytics.selfcheck.ts   (from backend/)
import assert from 'assert';
import { computeCourseAnalytics, computeOverview } from './analytics';

// Course with two subtopics => completion requires 2 completed subtopics.
const course = { id: 'c1', title: 'C1', topics: [{ subTopics: [{}, {}] }] };
const empty = { id: 'c2', title: 'C2 (no enrollees)', topics: [{ subTopics: [{}] }] };

const u1 = {
  enrolledCourses: ['c1'],
  courseProgress: [{ courseId: 'c1', completedSubTopics: ['a', 'b'], quizScores: [{ score: 90 }], assignmentSubmissions: [{ status: 'graded' }] }]
};
const u2 = {
  enrolledCourses: ['c1'],
  courseProgress: [{ courseId: 'c1', completedSubTopics: ['a'], quizScores: [{ score: 70 }], assignmentSubmissions: [{ status: 'pending' }] }]
};
const u3 = { enrolledCourses: ['other'], courseProgress: [] };
const users = [u1, u2, u3];

const a = computeCourseAnalytics(course, users);
assert.strictEqual(a.enrolled, 2, 'only enrolled users counted');
assert.strictEqual(a.completed, 1, 'u1 complete, u2 not');
assert.strictEqual(a.completionRate, 50, 'completion rate');
assert.strictEqual(a.avgQuizScore, 80, 'avg of 90 and 70');
assert.strictEqual(a.pendingAssignments, 1, 'one pending');
assert.strictEqual(a.gradedAssignments, 1, 'one graded');

const b = computeCourseAnalytics(empty, users);
assert.strictEqual(b.enrolled, 0, 'no enrollees');
assert.strictEqual(b.completionRate, 0, 'no divide-by-zero');
assert.strictEqual(b.avgQuizScore, null, 'null avg when no quiz attempts');

const ov = computeOverview([a, b]);
assert.strictEqual(ov.courses, 2, 'two courses');
assert.strictEqual(ov.totalEnrollments, 2, 'total enrollments');
assert.strictEqual(ov.totalCompletions, 1, 'total completions');
assert.strictEqual(ov.overallCompletionRate, 50, 'overall rate');
assert.strictEqual(ov.pendingAssignments, 1, 'pending rolled up');
assert.strictEqual(ov.topCourses[0].title, 'C1', 'top course by enrollment first');
assert.strictEqual(ov.topCourses[0].enrolled, 2, 'top course enrolled count');

console.log('analytics.selfcheck: all assertions passed ✓');
