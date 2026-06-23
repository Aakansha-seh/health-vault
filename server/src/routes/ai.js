// AI summary routes
// GET  /api/ai/models                 (list available models for user's tier)
// POST /api/ai/summary                (generate patient summary)

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticateCredential } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';
import { generateSummary, AI_MODELS, listModels, modelAvailable } from '../lib/ai.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

const FREE_MONTHLY_LIMIT = parseInt(process.env.AI_FREE_MONTHLY_LIMIT || '10', 10);

// ─── GET /api/ai/models ───────────────────────────────────────────────────────

router.get('/models', authenticateCredential, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { credentialId: req.actor.id },
      select: { tier: true, status: true },
    });

    const isPremium = sub?.tier === 'PREMIUM' && sub?.status === 'ACTIVE';

    // Only models whose provider API key is configured on the server.
    const models = listModels(isPremium);

    // Add monthly usage for free users
    let usage = null;
    if (!isPremium) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const used = await prisma.aIUsage.count({
        where: { credentialId: req.actor.id, createdAt: { gte: startOfMonth } },
      });
      usage = { used, limit: FREE_MONTHLY_LIMIT };
    }

    res.json({ models, tier: sub?.tier ?? 'FREE', usage });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/ai/summary ─────────────────────────────────────────────────────

const SummarySchema = z.object({
  patientId: z.string().min(1),
  model:     z.string().min(1),
});

router.post('/summary', aiLimiter, authenticateCredential, requireRole('DOCTOR'), async (req, res, next) => {
  try {
    const { patientId, model } = SummarySchema.parse(req.body);

    // Validate model exists
    if (!AI_MODELS[model]) {
      return res.status(400).json({ error: 'Invalid model', validModels: Object.keys(AI_MODELS) });
    }
    // Reject models whose provider isn't configured on the server.
    if (!modelAvailable(model)) {
      return res.status(503).json({ error: 'This AI model is not available right now (provider not configured).' });
    }

    // Check subscription and tier
    const sub = await prisma.subscription.findUnique({
      where: { credentialId: req.actor.id },
      select: { tier: true, status: true },
    });
    const isPremium = sub?.tier === 'PREMIUM' && sub?.status === 'ACTIVE';

    // Block free users from premium models
    if (!isPremium && AI_MODELS[model].tier === 'premium') {
      return res.status(403).json({
        error: 'This model requires a Premium subscription',
        upgradeRequired: true,
      });
    }

    // Enforce free tier monthly limit
    if (!isPremium) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const usedThisMonth = await prisma.aIUsage.count({
        where: { credentialId: req.actor.id, createdAt: { gte: startOfMonth } },
      });
      if (usedThisMonth >= FREE_MONTHLY_LIMIT) {
        return res.status(429).json({
          error: `Free tier limit reached (${FREE_MONTHLY_LIMIT} summaries/month). Upgrade to Premium for unlimited access.`,
          upgradeRequired: true,
          used: usedThisMonth,
          limit: FREE_MONTHLY_LIMIT,
        });
      }
    }

    // Fetch patient data — scoped to hospital AND the doctor's granted profiles,
    // so a doctor can't summarize a patient they have no access to.
    const accesses = await prisma.profileAccess.findMany({
      where: { credentialId: req.actor.id },
      select: { doctorProfileId: true },
    });
    const accessibleIds = accesses.map((a) => a.doctorProfileId);

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        hospitalId: req.actor.hospitalId,
        OR: [
          { visits:       { some: { doctorProfileId: { in: accessibleIds } } } },
          { appointments: { some: { doctorProfileId: { in: accessibleIds } } } },
        ],
      },
      include: {
        visits: {
          where: { doctorProfileId: { in: accessibleIds } },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found or you do not have access to it' });

    // Call AI
    const { summary, promptTokens, outputTokens } = await generateSummary({
      model,
      patientData: {
        demographics: {
          age:               patient.age,
          gender:            patient.gender,
          bloodGroup:        patient.bloodGroup,
          allergies:         patient.allergies,
          chronicConditions: patient.chronicConditions,
        },
        visits: patient.visits,
      },
    });

    // Log usage
    await prisma.aIUsage.create({
      data: {
        credentialId: req.actor.id,
        patientId,
        model,
        promptTokens,
        outputTokens,
      },
    });

    await writeAudit({
      actor: req.actor, action: 'AI_SUMMARY_GENERATED',
      target: { type: 'Patient', id: patientId, label: patient.name },
      details: `Model: ${model}`,
      ipAddress: req.ip,
    });

    res.json({ summary, model, promptTokens, outputTokens });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.issues });
    // AI provider errors
    if (err.status === 429) return res.status(429).json({ error: 'AI provider rate limit hit. Try again shortly.' });
    next(err);
  }
});

export default router;
