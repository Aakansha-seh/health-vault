// Upload routes — issue Azure Blob SAS URLs for direct browser uploads.
// GET  /api/uploads/config  → { configured: boolean }
// POST /api/uploads/sas     → { uploadUrl, blobUrl, blobName }
import { Router } from 'express';
import { z } from 'zod';
import { authenticateCredential } from '../middleware/auth.js';
import { createUploadSas, azureConfigured } from '../lib/azure.js';

const router = Router();

const SasSchema = z.object({
  fileName:    z.string().min(1, 'fileName required'),
  contentType: z.string().optional(),
});

// Lets the UI know whether to show the uploader at all.
router.get('/config', authenticateCredential, (_req, res) => {
  res.json({ configured: azureConfigured() });
});

router.post('/sas', authenticateCredential, async (req, res, next) => {
  try {
    if (!azureConfigured()) {
      return res.status(503).json({
        error: 'File uploads are not configured. Set AZURE_STORAGE_CONNECTION_STRING on the server.',
      });
    }
    const { fileName, contentType } = SasSchema.parse(req.body);
    const result = await createUploadSas(fileName, contentType || 'application/octet-stream');
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    next(err);
  }
});

export default router;
