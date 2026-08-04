// Lecture videos are served from a hosting provider (encrypted HLS / DRM, no direct file access)
// rather than as a downloadable file. This maps a pasted share/embed link to a player URL.

export type VideoProvider = 'vimeo' | 'sproutvideo' | 'youtube' | 'file' | 'unknown';

export interface VideoEmbed {
  provider: VideoProvider;
  embedUrl: string;
  // true when the provider streams fragmented, key-protected media that cannot be right-click saved.
  protected: boolean;
}

const FILE_EXT = /\.(mp4|webm|mov|m4v|ogv|avi|mkv)(\?|#|$)/i;

export function parseVideoUrl(raw: string): VideoEmbed {
  const url = (raw || '').trim();
  if (!url) return { provider: 'unknown', embedUrl: '', protected: false };

  let parsed: URL;
  try {
    parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://localhost');
  } catch {
    return { provider: 'unknown', embedUrl: url, protected: false };
  }

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);

  // Vimeo — https://vimeo.com/<id>[/<unlisted hash>] or an existing player link.
  if (host.endsWith('vimeo.com')) {
    const id = segments.find(s => /^\d+$/.test(s));
    if (id) {
      const hash = parsed.searchParams.get('h') || segments[segments.indexOf(id) + 1];
      const query = hash && /^[a-zA-Z0-9]+$/.test(hash) ? `?h=${hash}&dnt=1` : '?dnt=1';
      return { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}${query}`, protected: true };
    }
  }

  // SproutVideo — https://<account>.vids.io/videos/<id>/<key> or a videos.sproutvideo.com/embed link.
  if (host.endsWith('sproutvideo.com') || host.endsWith('vids.io')) {
    if (segments[0] === 'embed') return { provider: 'sproutvideo', embedUrl: parsed.toString(), protected: true };
    if (segments[0] === 'videos' && segments[1]) {
      const tail = segments.slice(1).join('/');
      return { provider: 'sproutvideo', embedUrl: `https://videos.sproutvideo.com/embed/${tail}`, protected: true };
    }
  }

  // YouTube — unlisted links work, but the stream itself is not DRM protected.
  if (host.endsWith('youtube.com') || host === 'youtu.be') {
    const id = host === 'youtu.be'
      ? segments[0]
      : parsed.searchParams.get('v') || (segments[0] === 'embed' || segments[0] === 'shorts' ? segments[1] : '');
    if (id) return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`, protected: false };
  }

  // Anything that resolves to a plain media file is downloadable by whoever can play it.
  if (FILE_EXT.test(parsed.pathname)) return { provider: 'file', embedUrl: url, protected: false };

  return { provider: 'unknown', embedUrl: url, protected: false };
}

export const PROVIDER_LABEL: Record<VideoProvider, string> = {
  vimeo: 'Vimeo (encrypted streaming)',
  sproutvideo: 'SproutVideo (AES-128 / DRM)',
  youtube: 'YouTube embed',
  file: 'Stored on the course server — streams with seeking',
  unknown: 'Unrecognised link — students may not be able to play this'
};
