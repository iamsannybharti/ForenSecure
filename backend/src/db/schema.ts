import { sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';

/**
 * Postgres schema for ForenSecure.
 *
 * Shape note: the domain is document-shaped — a course owns its topics, a topic
 * owns its subtopics, a subtopic owns its quiz questions and comments, and none
 * of that nesting is ever queried across courses. Normalising it would mean six
 * join tables that only ever get read as a whole, so the nested arrays stay in
 * `jsonb` and the flat string lists in `text[]`, both of which Postgres handles
 * natively. One table per former Mongo collection, fourteen in total.
 *
 * ponytail: jsonb blobs are opaque to SQL. If a report ever needs to filter or
 * aggregate *inside* topics or courseProgress, promote that one field to its own
 * table rather than growing a pile of jsonb path queries.
 */

/* ------------------------------------------------------------------ *
 * Shared column helpers
 * ------------------------------------------------------------------ */

// Every table carried mongoose `{ timestamps: true }`; keep the same two fields.
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
};

const id = () => uuid('id').primaryKey().defaultRandom();

// Drizzle emits `DEFAULT '{}'` for `.default([])` on array columns, which
// Postgres reads as the empty array for any element type.
const emptyTextArray = () => text().array().notNull().default(sql`'{}'`);

/* ------------------------------------------------------------------ *
 * Nested value types — stored as jsonb, typed here so routes stay checked
 * ------------------------------------------------------------------ */

export type QuestionType = 'mcq' | 'multi' | 'tf' | 'numeric' | 'short';

export interface QuizQuestion {
  questionText: string;
  questionType?: QuestionType;        // absent means 'mcq' (back-compat)
  options: string[];                  // mcq / multi / tf
  correctOptionIndex: number;         // mcq / tf
  correctOptionIndices?: number[];    // multi (exact-match set)
  correctNumeric?: number;            // numeric
  numericTolerance?: number;          // numeric (absolute, default 0)
  acceptedAnswers?: string[];         // short (case-insensitive, trimmed)
  points?: number;                    // question weight, default 1
  explanation?: string;
}

export interface LessonComment {
  _id?: string;
  userName: string;
  userRole: 'student' | 'teacher' | 'admin';
  text: string;
  timestampSeconds?: number;
  upvotes?: number;
  isPinned?: boolean;
  isBestAnswer?: boolean;
  createdAt: string | Date;
  replies?: {
    userName: string;
    userRole: 'student' | 'teacher' | 'admin';
    text: string;
    createdAt: string | Date;
  }[];
}

export interface LessonResource {
  name: string;
  url: string;
  type?: string;
  isDownloadable?: boolean;
}

export interface SubTopic {
  title: string;
  type?: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment' | 'link';
  isPreview?: boolean;
  richTextContent?: string;
  videoUrl?: string;
  documentUrl?: string;
  documentName?: string;
  quizQuestions?: QuizQuestion[];
  quizTimeLimit?: number;
  quizNegativeMarking?: boolean;
  quizAttemptsAllowed?: number;
  assignment?: {
    title: string;
    instructionsHtml: string;
    required: boolean;
  };
  resources?: LessonResource[];
  instructorNotes?: {
    summary?: string;
    keyPoints?: string[];
    cheatSheetUrl?: string;
  };
  comments?: LessonComment[];
}

export interface Topic {
  title: string;
  isCollapsed?: boolean;
  subTopics: SubTopic[];
}

export interface CompletedQuiz {
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  date: string | Date;
}

export interface UserCertificate {
  certificateId: string;
  courseName: string;
  issueDate: string | Date;
}

export interface QuizScore {
  topicTitle: string;
  subTopicTitle: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  answers: any[];
}

export interface AssignmentSubmission {
  topicTitle: string;
  subTopicTitle: string;
  assignmentTitle: string;
  submissionType: 'text' | 'file';
  textSubmission?: string;
  fileName?: string;
  status: 'pending' | 'graded';
  grade?: number;
  feedback?: string;
  submittedAt: string | Date;
}

export interface CourseProgress {
  courseId: string;
  completedSubTopics: string[];
  lastAccessedSubTopicTitle?: string;
  timeSpentSeconds?: number;
  quizScores: QuizScore[];
  assignmentSubmissions: AssignmentSubmission[];
}

export interface CourseVersion {
  version: number;
  changeLog: string;
  updatedBy: string;
  timestamp: string | Date;
}

export interface CourseQnA {
  _id?: string;
  studentName: string;
  question: string;
  answer?: string;
  isAnswered: boolean;
  upvotes: number;
  createdAt: string | Date;
}

export interface PathCourse {
  courseId: string;
  order: number;
  required: boolean;
}

export interface AssessmentItem {
  name: string;
  weightage: string;
}

// Recurrence for a live course: which weekdays, at what time, over the course's
// week range. Expanded into individual `seminars` rows on save (see courseSchedule.ts).
export interface CourseSchedule {
  days: number[];          // 0=Sun … 6=Sat
  time: string;            // 'HH:mm' (24h)
  meetLink: string;        // Google Meet / Teams / Zoom URL, reused for every session
  durationMinutes: number; // length of each session
}

/* ------------------------------------------------------------------ *
 * Tables
 * ------------------------------------------------------------------ */

export const users = pgTable('users', {
  id: id(),
  name: text().notNull(),
  email: text().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text().notNull().default('student').$type<'student' | 'admin' | 'teacher' | 'faculty'>(),
  avatar: text(),
  bio: text(),
  // Enrolment is a plain id list, never joined on in SQL — a uuid[] with a GIN
  // index answers "who is in this course" without a membership table.
  enrolledCourses: uuid('enrolled_courses').array().notNull().default(sql`'{}'`),
  enrolledPaths: uuid('enrolled_paths').array().notNull().default(sql`'{}'`),
  successfulPayments: uuid('successful_payments').array().notNull().default(sql`'{}'`),
  completedQuizzes: jsonb('completed_quizzes').$type<CompletedQuiz[]>().notNull().default([]),
  certificates: jsonb().$type<UserCertificate[]>().notNull().default([]),
  courseProgress: jsonb('course_progress').$type<CourseProgress[]>().notNull().default([]),
  magicToken: text('magic_token'),
  magicTokenExpires: timestamp('magic_token_expires', { withTimezone: true }),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: text('mfa_secret'),
  ...timestamps
}, table => [
  uniqueIndex('users_email_idx').on(table.email),
  index('users_enrolled_courses_idx').using('gin', table.enrolledCourses)
]);

export const studentNotes = pgTable('student_notes', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  courseSlug: text('course_slug').notNull(),
  topicTitle: text('topic_title').notNull().default(''),
  subTopicTitle: text('sub_topic_title').notNull().default(''),
  timestamp: text().notNull().default(''),
  text: text().notNull(),
  ...timestamps
}, table => [
  index('student_notes_user_course_idx').on(table.userId, table.courseSlug, table.createdAt)
]);

export const courses = pgTable('courses', {
  id: id(),
  title: text().notNull(),
  slug: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  subcategory: text(),
  instructorName: text('instructor_name').notNull(),
  instructorTitle: text('instructor_title').notNull(),
  durationWeeks: integer('duration_weeks').notNull(),
  // 'recorded' is the self-paced premade syllabus; 'live' is taught through scheduled sessions.
  courseType: text('course_type').notNull().default('recorded').$type<'recorded' | 'live'>(),
  // Diplomas are long-form programs listed on /diplomas; everything else is a catalog course.
  format: text().notNull().default('course').$type<'course' | 'diploma'>(),
  // Required for live courses — status (upcoming / live / ended) is derived from these, never stored.
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  thumbnailUrl: text('thumbnail_url'),
  difficulty: text().notNull().default('Beginner').$type<'Beginner' | 'Intermediate' | 'Advanced'>(),
  rating: doublePrecision().notNull().default(4.8),
  ratingCount: integer('rating_count').notNull().default(120),
  studentsCount: integer('students_count').notNull().default(1250),
  priceINR: integer('price_inr').notNull(),
  discountPriceINR: integer('discount_price_inr'),
  discountPercentage: integer('discount_percentage').default(0),
  approvalStatus: text('approval_status').default('approved').$type<'pending' | 'approved' | 'rejected'>(),
  syllabus: emptyTextArray(),
  features: emptyTextArray(),
  bannerSvgType: text('banner_svg_type').notNull().default('fingerprint'),
  promoVideoUrl: text('promo_video_url'),
  visibility: text().notNull().default('published').$type<'draft' | 'published' | 'unlisted' | 'archived'>(),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  learningObjectives: emptyTextArray(),
  prerequisites: emptyTextArray(),
  targetAudience: emptyTextArray(),
  // Marketing/landing-page content the teacher fills in from the CMS. Each maps
  // 1:1 to a section rendered on the course details page.
  subTitle: text('sub_title'),
  overview: text(),
  level: text(),
  highlights: emptyTextArray(),
  eligibility: emptyTextArray(),
  learningResources: emptyTextArray(),
  careerBenefits: emptyTextArray(),
  practicalLabs: emptyTextArray(),
  assessmentStructure: jsonb('assessment_structure').$type<AssessmentItem[]>().notNull().default([]),
  passingCriteria: text('passing_criteria'),
  // Set only for live courses; drives auto-generation of the session schedule.
  schedule: jsonb().$type<CourseSchedule | null>(),
  language: text().notNull().default('English'),
  seekingMode: text('seeking_mode').notNull().default('free').$type<'free' | 'sequential' | 'strict'>(),
  version: integer().notNull().default(1),
  versionHistory: jsonb('version_history').$type<CourseVersion[]>().notNull().default([]),
  courseQnA: jsonb('course_qna').$type<CourseQnA[]>().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  targetPercentage: integer('target_percentage').notNull().default(60),
  topics: jsonb().$type<Topic[]>().notNull().default([]),
  ...timestamps
}, table => [
  uniqueIndex('courses_slug_idx').on(table.slug),
  index('courses_format_idx').on(table.format)
]);

export const quizzes = pgTable('quizzes', {
  id: id(),
  title: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  timeLimitMinutes: integer('time_limit_minutes').notNull().default(15),
  questions: jsonb().$type<QuizQuestion[]>().notNull().default([]),
  passingPercentage: integer('passing_percentage').notNull().default(80),
  negativeMarking: boolean('negative_marking').notNull().default(false),
  // Fraction of a question's points lost per wrong answer.
  negativeMarkFraction: doublePrecision('negative_mark_fraction').notNull().default(0.25),
  attemptsAllowed: integer('attempts_allowed').notNull().default(0), // 0 = unlimited
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps
});

export const certificates = pgTable('certificates', {
  id: id(),
  certificateId: text('certificate_id').notNull(),
  studentName: text('student_name').notNull(),
  studentEmail: text('student_email').notNull(),
  courseName: text('course_name').notNull(),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull().defaultNow(),
  cryptographicHash: text('cryptographic_hash').notNull(),
  grade: text().notNull().default('A+'),
  ...timestamps
}, table => [
  uniqueIndex('certificates_certificate_id_idx').on(table.certificateId)
]);

export const research = pgTable('research', {
  id: id(),
  title: text().notNull(),
  slug: text().notNull(),
  abstract: text().notNull(),
  content: text().notNull(),
  category: text().notNull(),
  authors: emptyTextArray(),
  readTimeMinutes: integer('read_time_minutes').notNull().default(8),
  citation: text().notNull(),
  publishedDate: timestamp('published_date', { withTimezone: true }).notNull().defaultNow(),
  downloadsCount: integer('downloads_count').notNull().default(0),
  references: emptyTextArray(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps
}, table => [
  uniqueIndex('research_slug_idx').on(table.slug)
]);

export const contacts = pgTable('contacts', {
  id: id(),
  name: text().notNull(),
  email: text().notNull(),
  subject: text(),
  message: text().notNull(),
  isResolved: boolean('is_resolved').notNull().default(false),
  ...timestamps
});

export const seminars = pgTable('seminars', {
  id: id(),
  title: text().notNull(),
  description: text().notNull(),
  instructorName: text('instructor_name').notNull(),
  // Set when the session is a lecture of a live course rather than a standalone webinar.
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  courseTitle: text('course_title'),
  date: timestamp({ withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  link: text().notNull(),
  maxParticipants: integer('max_participants').notNull().default(50),
  approvalStatus: text('approval_status').default('approved').$type<'pending' | 'approved' | 'rejected'>(),
  // Emails, not user ids — registration predates accounts being required.
  registeredStudents: emptyTextArray(),
  attendees: emptyTextArray(),
  ...timestamps
}, table => [
  index('seminars_course_id_idx').on(table.courseId)
]);

export const blogs = pgTable('blogs', {
  id: id(),
  title: text().notNull(),
  subtitle: text(),
  slug: text().notNull(),
  content: text().notNull(),
  authorName: text('author_name').notNull(),
  // Set to the creating user so a teacher can find their own drafts; nullable
  // because the seeded demo blogs predate accounts.
  authorId: uuid('author_id'),
  category: text().notNull(),
  tags: emptyTextArray(),
  attachments: jsonb().$type<{ name: string; url: string }[]>().notNull().default([]),
  readTimeMinutes: integer('read_time_minutes').notNull().default(5),
  likes: integer().notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  // Teacher posts land 'pending' and only go public once an admin approves.
  approvalStatus: text('approval_status').default('approved').$type<'pending' | 'approved' | 'rejected'>(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps
}, table => [
  uniqueIndex('blogs_slug_idx').on(table.slug)
]);

// Editable "Meet the Experts" roster on the About page. Admin-managed; only
// active rows show publicly.
export const teamMembers = pgTable('team_members', {
  id: id(),
  name: text().notNull(),
  role: text().notNull(),
  description: text().notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps
});

export const accessMatrix = pgTable('access_matrix', {
  id: id(),
  role: text().notNull().$type<'student' | 'teacher' | 'admin'>(),
  feature: text().notNull().$type<'course_player' | 'course_builder' | 'grading_panel' | 'seminars_scheduler' | 'user_registry'>(),
  create: boolean().notNull().default(false),
  read: boolean().notNull().default(false),
  update: boolean().notNull().default(false),
  ...timestamps
}, table => [
  // The matrix is upserted per (role, feature); the pair has to be unique for
  // ON CONFLICT to target it.
  uniqueIndex('access_matrix_role_feature_idx').on(table.role, table.feature)
]);

export const dropdownOptions = pgTable('dropdown_options', {
  id: id(),
  category: text().notNull(),
  label: text().notNull(),
  value: text().notNull(),
  relatedTo: text('related_to').notNull().default(''),
  ...timestamps
});

export const learningPaths = pgTable('learning_paths', {
  id: id(),
  title: text().notNull(),
  slug: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  courses: jsonb().$type<PathCourse[]>().notNull().default([]),
  sequential: boolean().notNull().default(false),
  issueCertificate: boolean('issue_certificate').notNull().default(true),
  certificateTitle: text('certificate_title').notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps
}, table => [
  uniqueIndex('learning_paths_slug_idx').on(table.slug)
]);

export const announcements = pgTable('announcements', {
  id: id(),
  title: text().notNull(),
  body: text().notNull(),
  authorName: text('author_name').notNull(),
  level: text().notNull().default('info').$type<'info' | 'warning' | 'critical'>(),
  pinned: boolean().notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps
});

export const notifications = pgTable('notifications', {
  id: id(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  body: text().notNull(),
  type: text().notNull().default('info').$type<'info' | 'success' | 'warning' | 'critical'>(),
  actionUrl: text('action_url').notNull().default(''),
  read: boolean().notNull().default(false),
  ...timestamps
}, table => [
  index('notifications_user_read_idx').on(table.userId, table.read, table.createdAt)
]);

/* ------------------------------------------------------------------ *
 * Row types
 * ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type Research = typeof research.$inferSelect;
export type Seminar = typeof seminars.$inferSelect;
export type Blog = typeof blogs.$inferSelect;
export type LearningPath = typeof learningPaths.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type StudentNote = typeof studentNotes.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
