// Upload routes — store report files on this server's disk, scoped per hospital.
//
//   GET  /api/uploads/config     → { configured }                       (auth)
//   POST /api/uploads            → { name, type, reportType, fileId }    (auth) — base64 body
//   GET  /api/uploads/file/:id   → streams the file                      (auth)
//
// Isolation: every file has an Attachment row recording its owning hospital.
// The /file route requires a logged-in session and only serves the file if the
// caller's hospital owns it. The frontend fetches it with its auth header (as a
// blob) and opens that, so no public/token links are needed. Files uploaded
// before access control existed have no Attachment and are served by their
// unguessable stored name to any authenticated user (legacy fallback).
import { Router } from 'express';
import fs from 'fs';
import zlib from 'zlib';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, authenticateCredential } from '../middleware/auth.js';
import { saveBase64File, resolveStored, mimeForId, storageConfigured } from '../lib/storage.js';

const router = Router();

// Lets the UI know uploads are available.
router.get('/config', authenticateCredential, (_req, res) => {
  res.json({ configured: storageConfigured() });
});

const UploadSchema = z.object({
  fileName:    z.string().min(1, 'fileName required'),
  contentType: z.string().optional(),
  dataBase64:  z.string().min(1, 'file data required'),
  reportType:  z.string().optional(),
});

// Receive a file (base64), write it to disk, and record its owning hospital.
router.post('/', authenticateCredential, async (req, res, next) => {
  try {
    const { fileName, contentType, dataBase64, reportType } = UploadSchema.parse(req.body);
    const saved = saveBase64File({ fileName, contentType, dataBase64 });

    const attachment = await prisma.attachment.create({
      data: {
        hospitalId: req.actor.hospitalId,
        storedName: saved.id,
        fileName:   saved.name,
        type:       saved.type,
        reportType: reportType || null,
        uploadedBy: req.actor.id,
      },
    });

    res.status(201).json({
      name:       saved.name,
      type:       saved.type,
      reportType: reportType || null,
      fileId:     attachment.id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

// Serve a file to an authenticated caller from the owning hospital.
// Files are stored gzip-compressed; browsers that accept gzip get the compressed
// bytes and decompress transparently (less bandwidth, no server CPU).
router.get('/file/:id', authenticate, async (req, res) => {
  try {
    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });

    let storedName, mime;
    if (attachment) {
      if (attachment.hospitalId !== req.actor.hospitalId) {
        return res.status(403).json({ error: 'You do not have access to this file' });
      }
      storedName = attachment.storedName;
      mime       = attachment.type || mimeForId(attachment.storedName);
    } else {
      // Legacy file (uploaded before access control): the id is the stored name.
      storedName = req.params.id;
      mime       = mimeForId(req.params.id);
    }

    const found = resolveStored(storedName);
    if (!found) return res.status(404).json({ error: 'File not found' });

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Vary', 'Accept-Encoding');

    const stream = fs.createReadStream(found.path);
    stream.on('error', () => { if (!res.headersSent) res.status(500).end(); });

    if (!found.gzipped) return stream.pipe(res);

    const acceptsGzip = (req.headers['accept-encoding'] || '').includes('gzip');
    if (acceptsGzip) {
      res.setHeader('Content-Encoding', 'gzip');
      return stream.pipe(res);
    }
    return stream.pipe(zlib.createGunzip()).pipe(res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: 'Could not serve file' });
  }
});

export default router;
