// Pure (IO-free) analytics aggregation over courses + user progress.
// Shared by server.ts and analytics.selfcheck.ts. No DB, no side effects.
// Reuses the same completion definition as certificates / learning paths.
import { isCourseComplete } from './learningPathLogic';

export interface CourseAnalytics {
  courseId: string;
  title: string;
  enrolled: number;
  completed: number;
  completionRate: number;      // percent 0-100
  avgQuizScore: number | null; // null when no quiz attempts recorded
  pendingAssignments: number;
  gradedAssignments: number;
}

// One course's metrics across the users enrolled in it.
export function computeCourseAnalytics(course: any, users: any[]): CourseAnalytics {
  const cid = String(course.id);
  const enrolled = users.filter(u => (u.enrolledCourses || []).some((c: any) => String(c) === cid));

  let completed = 0;
  let quizSum = 0;
  let quizCount = 0;
  let pending = 0;
  let graded = 0;

  for (const u of enrolled) {
    const prog = (u.courseProgress || []).find((p: any) => String(p.courseId) === cid);
    if (isCourseComplete(course, prog)) completed++;
    for (const q of prog?.quizScores || []) { quizSum += q.score; quizCount++; }
    for (const a of prog?.assignmentSubmissions || []) {
      if (a.status === 'graded') graded++; else pending++;
    }
  }

  return {
    courseId: cid,
    title: course.title,
    enrolled: enrolled.length,
    completed,
    completionRate: enrolled.length ? Math.round((completed / enrolled.length) * 100) : 0,
    avgQuizScore: quizCount ? Math.round(quizSum / quizCount) : null,
    pendingAssignments: pending,
    gradedAssignments: graded
  };
}

export interface Overview {
  courses: number;
  totalEnrollments: number;
  totalCompletions: number;
  overallCompletionRate: number;
  pendingAssignments: number;
  topCourses: Array<{ title: string; enrolled: number; completionRate: number }>;
}

// Platform rollup from the per-course rows.
export function computeOverview(rows: CourseAnalytics[]): Overview {
  const totalEnrollments = rows.reduce((a, r) => a + r.enrolled, 0);
  const totalCompletions = rows.reduce((a, r) => a + r.completed, 0);
  const pendingAssignments = rows.reduce((a, r) => a + r.pendingAssignments, 0);
  const topCourses = [...rows]
    .sort((a, b) => b.enrolled - a.enrolled)
    .slice(0, 5)
    .map(r => ({ title: r.title, enrolled: r.enrolled, completionRate: r.completionRate }));

  return {
    courses: rows.length,
    totalEnrollments,
    totalCompletions,
    overallCompletionRate: totalEnrollments ? Math.round((totalCompletions / totalEnrollments) * 100) : 0,
    pendingAssignments,
    topCourses
  };
}
