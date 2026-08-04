// Pure (IO-free) RBAC resolution against the editable AccessMatrix.
// Shared by server.ts and permissions.selfcheck.ts. No DB, no side effects.

export type PermAction = 'create' | 'read' | 'update';

export interface MatrixRow {
  role: string;
  feature: string;
  create: boolean;
  read: boolean;
  update: boolean;
}

export const ADMIN_ROLE = 'admin';

// The User model allows a 'faculty' role that the matrix does not enumerate;
// it has always been treated as an instructor, so alias it to 'teacher'.
const effectiveRole = (role: string) => (role === 'faculty' ? 'teacher' : role);

export function isAllowed(matrix: MatrixRow[], role: string, feature: string, action: PermAction): boolean {
  if (role === ADMIN_ROLE) return true; // admin is a superuser and cannot be locked out
  const eff = effectiveRole(role);
  const row = matrix.find(r => r.role === eff && r.feature === feature);
  return !!(row && row[action]);
}

// Single source of truth for the default matrix (was duplicated 3x in server.ts).
export const DEFAULT_MATRIX: MatrixRow[] = [
  { role: 'student', feature: 'course_player', create: false, read: true, update: false },
  { role: 'student', feature: 'course_builder', create: false, read: false, update: false },
  { role: 'student', feature: 'grading_panel', create: false, read: false, update: false },
  { role: 'student', feature: 'seminars_scheduler', create: false, read: false, update: false },
  { role: 'student', feature: 'user_registry', create: false, read: false, update: false },

  { role: 'teacher', feature: 'course_player', create: false, read: true, update: false },
  { role: 'teacher', feature: 'course_builder', create: true, read: true, update: true },
  { role: 'teacher', feature: 'grading_panel', create: true, read: true, update: true },
  { role: 'teacher', feature: 'seminars_scheduler', create: true, read: true, update: true },
  { role: 'teacher', feature: 'user_registry', create: false, read: false, update: false },

  { role: 'admin', feature: 'course_player', create: true, read: true, update: true },
  { role: 'admin', feature: 'course_builder', create: true, read: true, update: true },
  { role: 'admin', feature: 'grading_panel', create: true, read: true, update: true },
  { role: 'admin', feature: 'seminars_scheduler', create: true, read: true, update: true },
  { role: 'admin', feature: 'user_registry', create: true, read: true, update: true }
];
