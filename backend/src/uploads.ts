// Naming + type rules for teacher-uploaded course media.
import path from 'path';

export const ALLOWED_UPLOAD_EXT = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.csv', '.zip',
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.mp4', '.webm', '.mov', '.m4v', '.mp3', '.wav'
];

export function isAllowedUpload(originalName: string): boolean {
  return ALLOWED_UPLOAD_EXT.includes(path.extname(originalName).toLowerCase());
}

// Builds a collision-free, path-traversal-free stored filename.
export function safeUploadName(originalName: string, unique: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 60) || 'file';
  return `${unique}_${base}${ext}`;
}
