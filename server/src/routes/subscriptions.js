// Subscription & billing routes (Razorpay)
// GET    /api/subscriptions/me         (current subscription status)
// POST   /api/subscriptions/checkout   (create a Razorpay subscription → open in checkout)
// POST   /api/subscriptions/cancel     (cancel at end of current cycle)

import { Router } from 'express';
import Razorpay from 'razorpay';
import prisma from '../lib/prisma.js';
import { authenticateCredential } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw Object.assign(new Error('Razorpay keys not configured'), { status: 503 });
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Default billing cycles before the mandate must be renewed (12 = ~1 year monthly).
const TOTAL_CYCLES = parseInt(process.env.RAZORPAY_TOTAL_CYCLES || '12', 10);

// ─── GET /api/subscriptions/me ────────────────────────────────────────────────

router.get('/me', authenticateCredential, async (req, res, next) => {
  try {
    let sub = await prisma.subscription.findUnique({ where: { credentialId: req.actor.id } });
    if (!sub) sub = await prisma.subscription.create({ data: { credentialId: req.actor.id } });
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/subscriptions/checkout ────────────────────────────────────────
// Creates a Razorpay subscription and returns the bits the frontend needs to
// open the Razorpay Checkout modal (keyId + subscriptionId). The plan/price is
// defined once in the Razorpay dashboard as RAZORPAY_PLAN_ID.

router.post('/checkout', authenticateCredential, async (req, res, next) => {
  try {
    const razorpay = getRazorpay();
    if (!process.env.RAZORPAY_PLAN_ID) {
      return res.status(503).json({ error: 'Billing is not fully configured (missing plan). Contact support.' });
    }

    const existing = await prisma.subscription.findUnique({ where: { credentialId: req.actor.id } });
    if (existing?.tier === 'PREMIUM' && existing?.status === 'ACTIVE') {
      return res.status(400).json({ error: 'You already have an active Premium subscription' });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id:         process.env.RAZORPAY_PLAN_ID,
      total_count:     TOTAL_CYCLES,
      customer_notify: 1,
      notes:           { credentialId: req.actor.id, hospitalId: req.actor.hospitalId },
    });

    // Remember the gateway subscription id so the webhook can match it back.
    await prisma.subscription.upsert({
      where:  { credentialId: req.actor.id },
      update: { gatewaySubscriptionId: subscription.id },
      create: { credentialId: req.actor.id, gatewaySubscriptionId: subscription.id },
    });

    res.json({
      subscriptionId: subscription.id,
      keyId:          process.env.RAZORPAY_KEY_ID,
      shortUrl:       subscription.short_url, // fallback: hosted page if modal isn't used
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/subscriptions/cancel ──────────────────────────────────────────
// Cancels at the end of the current billing cycle (user keeps Premium until then).

router.post('/cancel', authenticateCredential, async (req, res, next) => {
  try {
    const razorpay = getRazorpay();
    const sub = await prisma.subscription.findUnique({ where: { credentialId: req.actor.id } });
    if (!sub?.gatewaySubscriptionId) {
      return res.status(400).json({ error: 'No active subscription to cancel.' });
    }

    // second arg true = cancel at cycle end (not immediately)
    await razorpay.subscriptions.cancel(sub.gatewaySubscriptionId, true);

    await prisma.subscription.update({
      where: { credentialId: req.actor.id },
      data:  { cancelAtPeriodEnd: true },
    });

    await writeAudit({
      actor: req.actor, action: 'SUBSCRIPTION_CANCELLED',
      details: 'Premium cancellation scheduled at period end',
      ipAddress: req.ip,
    });

    res.json({ message: 'Your subscription will end at the close of the current billing period.' });
  } catch (err) {
    next(err);
  }
});

export default router;
