// Local file storage — saves report files to a folder on this server's disk.
// Replaces the Azure Blob flow for self-hosted / demo use.
//
// Env:
//   UPLOAD_DIR     folder to store files in (default: <cwd>/uploads)
//   UPLOAD_MAX_MB  max file size in MB (default: 15)
//
// Files are saved with a random unguessable name; the original name and the
// chosen report type are kept in the database (visit.testReports), not on disk.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import zlib from 'zlib';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_BYTES  = (parseInt(process.env.UPLOAD_MAX_MB || '15', 10)) * 1024 * 1024;

// Allowed file extensions → MIME type used when serving the file back.
const MIME = {
  '.pdf':  'application/pdf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.txt':  'text/plain',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const storageConfigured = () => true;          // local disk is always available
export const uploadDir = () => UPLOAD_DIR;

function ensureDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save a base64-encoded file to disk.
 * @returns {{ id: string, url: string, name: string, type: string }}
 */
export function saveBase64File({ fileName, contentType, dataBase64 }) {
  ensureDir();

  // Accept either a raw base64 string or a full "data:...;base64,..." URL.
  const b64 = String(dataBase64).replace(/^data:[^;]*;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  if (!buf.length) {
    throw Object.assign(new Error('Empty or invalid file data'), { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    throw Object.assign(new Error(`File exceeds the ${process.env.UPLOAD_MAX_MB || 15} MB limit`), { status: 413 });
  }

  let ext = path.extname(fileName || '').toLowerCase();
  if (!MIME[ext]) {
    // Fall back to deriving the extension from the content type.
    ext = Object.keys(MIME).find((e) => MIME[e] === contentType) || '';
  }

  const id = crypto.randomUUID() + ext;   // logical id keeps the real extension
  // Store gzip-compressed on disk to save space; served back transparently so
  // the browser sees the original file.
  fs.writeFileSync(path.join(UPLOAD_DIR, id + '.gz'), zlib.gzipSync(buf));

  return {
    id,
    url:  `/api/uploads/file/${id}`,
    name: fileName || id,
    type: contentType || MIME[ext] || 'application/octet-stream',
  };
}

/**
 * Resolve a stored file id to its path on disk, guarding against traversal.
 * Prefers the gzip-compressed copy (new uploads); falls back to an
 * uncompressed copy (files uploaded before compression was added).
 * @returns {{ path: string, gzipped: boolean } | null}
 */
export function resolveStored(id) {
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) return null;   // no slashes / .. allowed
  const gz = path.join(UPLOAD_DIR, id + '.gz');
  if (gz.startsWith(UPLOAD_DIR) && fs.existsSync(gz)) return { path: gz, gzipped: true };
  const raw = path.join(UPLOAD_DIR, id);
  if (raw.startsWith(UPLOAD_DIR) && fs.existsSync(raw)) return { path: raw, gzipped: false };
  return null;
}

export function mimeForId(id) {
  return MIME[path.extname(id).toLowerCase()] || 'application/octet-stream';
}
