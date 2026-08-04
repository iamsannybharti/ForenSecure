// Self-check for upload naming/type rules.
// Run: npx ts-node src/uploads.selfcheck.ts   (from backend/)
import assert from 'assert';
import { isAllowedUpload, safeUploadName } from './uploads';

// Type allowlist: course media in, executable/markup out.
assert.ok(isAllowedUpload('handbook.pdf'), 'pdf allowed');
assert.ok(isAllowedUpload('Slides 1.PPTX'), 'uppercase ext allowed');
assert.ok(isAllowedUpload('lecture.mp4'), 'lecture video allowed');
assert.ok(isAllowedUpload('lecture.MOV'), 'lecture video allowed, any case');
assert.ok(!isAllowedUpload('payload.html'), 'html rejected (stored XSS)');
assert.ok(!isAllowedUpload('logo.svg'), 'svg rejected (stored XSS)');
assert.ok(!isAllowedUpload('shell.exe'), 'exe rejected');
assert.ok(!isAllowedUpload('README'), 'extensionless rejected');

// Stored name never escapes the upload dir and keeps a readable base.
assert.strictEqual(safeUploadName('chain of custody.pdf', 'u1'), 'u1_chain_of_custody.pdf');
assert.strictEqual(safeUploadName('../../etc/passwd.txt', 'u1'), 'u1_passwd.txt');
// Backslashes: path.basename only splits them on win32, so assert the invariant, not the exact string.
assert.ok(/^u1_[a-zA-Z0-9-_]+\.txt$/.test(safeUploadName('..\\..\\win.ini.txt', 'u1')), 'backslash path flattened');
assert.ok(!safeUploadName('../../evil.pdf', 'u1').includes('/'), 'no slash in stored name');
assert.ok(!safeUploadName('..\\evil.pdf', 'u1').includes('\\'), 'no backslash in stored name');
// Dotfiles have no extension as far as path.extname is concerned, so the allowlist rejects them first.
assert.ok(!isAllowedUpload('.pdf'), 'dotfile rejected');
assert.strictEqual(safeUploadName('', 'u1'), 'u1_file', 'empty name falls back');
assert.ok(safeUploadName('a'.repeat(200) + '.pdf', 'u1').length <= 68, 'base truncated');

console.log('uploads.selfcheck: all assertions passed');
