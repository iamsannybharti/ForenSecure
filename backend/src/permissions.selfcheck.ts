// Runnable self-check for RBAC resolution.
// Run: npx ts-node src/permissions.selfcheck.ts   (from backend/)
import assert from 'assert';
import { isAllowed, DEFAULT_MATRIX } from './permissions';

const M = DEFAULT_MATRIX;

// --- student: read-only course_player, nothing else ---
assert.strictEqual(isAllowed(M, 'student', 'course_player', 'read'), true, 'student can read course_player');
assert.strictEqual(isAllowed(M, 'student', 'course_builder', 'create'), false, 'student cannot build courses');
assert.strictEqual(isAllowed(M, 'student', 'grading_panel', 'create'), false, 'student cannot grade');
assert.strictEqual(isAllowed(M, 'student', 'seminars_scheduler', 'create'), false, 'student cannot schedule seminars');

// --- teacher: full course_builder / grading / seminars ---
assert.strictEqual(isAllowed(M, 'teacher', 'course_builder', 'create'), true, 'teacher can build');
assert.strictEqual(isAllowed(M, 'teacher', 'course_builder', 'update'), true, 'teacher can edit');
assert.strictEqual(isAllowed(M, 'teacher', 'grading_panel', 'read'), true, 'teacher can read grading');
assert.strictEqual(isAllowed(M, 'teacher', 'grading_panel', 'create'), true, 'teacher can grade');
assert.strictEqual(isAllowed(M, 'teacher', 'user_registry', 'read'), false, 'teacher cannot read user registry');

// --- faculty aliases to teacher ---
assert.strictEqual(isAllowed(M, 'faculty', 'course_builder', 'create'), true, 'faculty treated as teacher (build)');
assert.strictEqual(isAllowed(M, 'faculty', 'user_registry', 'update'), false, 'faculty cannot touch user registry');

// --- admin superuser: allowed even for features absent from the matrix ---
assert.strictEqual(isAllowed(M, 'admin', 'course_builder', 'create'), true, 'admin can build');
assert.strictEqual(isAllowed(M, 'admin', 'nonexistent_feature', 'update'), true, 'admin allowed regardless of matrix');

// --- unknown role / feature => denied ---
assert.strictEqual(isAllowed(M, 'ghost', 'course_builder', 'create'), false, 'unknown role denied');
assert.strictEqual(isAllowed(M, 'teacher', 'no_such_feature', 'read'), false, 'unknown feature denied');

// --- revoking a permission in the matrix takes effect (data-driven) ---
const revoked = M.map(r =>
  r.role === 'teacher' && r.feature === 'course_builder' ? { ...r, create: false } : r
);
assert.strictEqual(isAllowed(revoked, 'teacher', 'course_builder', 'create'), false, 'revoked teacher build permission');
assert.strictEqual(isAllowed(revoked, 'admin', 'course_builder', 'create'), true, 'admin unaffected by revoke');

console.log('permissions.selfcheck: all assertions passed ✓');
