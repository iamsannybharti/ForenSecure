// Self-check for lecture video link parsing.
// Run: node --experimental-strip-types src/lib/videoEmbed.selfcheck.ts   (from frontend/)
import assert from 'assert';
import { parseVideoUrl } from './videoEmbed.ts';

// Vimeo: plain, unlisted hash in path, unlisted hash in query, existing player link.
assert.deepStrictEqual(parseVideoUrl('https://vimeo.com/76979871'),
  { provider: 'vimeo', embedUrl: 'https://player.vimeo.com/video/76979871?dnt=1', protected: true });
assert.strictEqual(parseVideoUrl('https://vimeo.com/76979871/a1b2c3d4e5').embedUrl,
  'https://player.vimeo.com/video/76979871?h=a1b2c3d4e5&dnt=1');
assert.strictEqual(parseVideoUrl('https://player.vimeo.com/video/76979871?h=a1b2c3d4e5').embedUrl,
  'https://player.vimeo.com/video/76979871?h=a1b2c3d4e5&dnt=1');

// SproutVideo: account share link and already-embedded link.
assert.strictEqual(parseVideoUrl('https://forensecure.vids.io/videos/abc123/lecture-one').embedUrl,
  'https://videos.sproutvideo.com/embed/abc123/lecture-one');
assert.strictEqual(parseVideoUrl('https://videos.sproutvideo.com/embed/abc123/deadbeef').embedUrl,
  'https://videos.sproutvideo.com/embed/abc123/deadbeef');
assert.strictEqual(parseVideoUrl('https://forensecure.vids.io/videos/abc123/lecture-one').provider, 'sproutvideo');

// YouTube: watch, short link, shorts, embed — playable but flagged unprotected.
for (const link of [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/shorts/dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ'
]) {
  const out = parseVideoUrl(link);
  assert.strictEqual(out.embedUrl, 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1', link);
  assert.strictEqual(out.protected, false, `${link} is not DRM protected`);
}

// Plain media files (including self-hosted uploads) are downloadable — must be flagged, not silently accepted.
assert.strictEqual(parseVideoUrl('/uploads/1234_lecture.mp4').provider, 'file');
assert.strictEqual(parseVideoUrl('https://cdn.example.com/a/b.MOV?token=x').provider, 'file');
assert.strictEqual(parseVideoUrl('/uploads/1234_lecture.mp4').protected, false);

// Junk in, no crash out.
assert.strictEqual(parseVideoUrl('').provider, 'unknown');
assert.strictEqual(parseVideoUrl('   ').provider, 'unknown');
assert.strictEqual(parseVideoUrl('not a url at all').provider, 'unknown');
assert.strictEqual(parseVideoUrl('https://vimeo.com/channels/staffpicks').provider, 'unknown');

console.log('videoEmbed.selfcheck: all assertions passed');
