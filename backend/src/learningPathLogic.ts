// Pure (IO-free) learning-path completion + sequential-unlock logic.
// Shared by server.ts and learningPaths.selfcheck.ts. No DB, no side effects.

// A course is complete when the learner has finished at least as many subtopics
// as the course contains. Matches the semantics already used by claim-certificate
// in server.ts: a course with zero subtopics counts as complete (0 >= 0).
export const totalSubTopics = (course: any): number =>
  course?.topics?.reduce((acc: number, t: any) => acc + (t.subTopics?.length || 0), 0) || 0;

export const isCourseComplete = (course: any, progress: any): boolean =>
  (progress?.completedSubTopics?.length || 0) >= totalSubTopics(course);

export interface ResolvedPathCourse {
  entry: { order: number; required: boolean };
  course: any;
  progress: any;
}

// `resolved` must already be sorted by entry.order.
export function computePathProgress(resolved: ResolvedPathCourse[], sequential: boolean) {
  const items: any[] = [];
  let allEarlierComplete = true;
  let completedRequired = 0;
  let requiredCount = 0;
  let nextCourseSlug: string | null = null;

  for (const { entry, course, progress } of resolved) {
    const complete = isCourseComplete(course, progress);
    const locked = sequential ? !allEarlierComplete : false;

    if (entry.required) {
      requiredCount++;
      if (complete) completedRequired++;
    }
    if (!complete && !locked && !nextCourseSlug) nextCourseSlug = course.slug || null;

    items.push({
      courseId: String(course.id),
      title: course.title,
      slug: course.slug,
      order: entry.order,
      required: entry.required,
      complete,
      locked
    });

    if (sequential && !complete) allEarlierComplete = false;
  }

  const pathComplete = requiredCount > 0
    ? completedRequired >= requiredCount
    : items.length > 0 && items.every(i => i.complete);

  return { items, completedRequired, requiredCount, nextCourseSlug, pathComplete };
}
