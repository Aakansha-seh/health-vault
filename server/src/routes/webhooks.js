// Razorpay webhook handler — POST /api/webhooks/razorpay
// IMPORTANT: mounted with express.raw() BEFORE express.json() so the raw body is
// available for HMAC signature verification.

import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { writeAudit } from '../lib/audit.js';

const router = Router();

const toDate = (unixSeconds) => (unixSeconds ? new Date(unixSeconds * 1000) : null);

// Locate our Subscription row from a Razorpay subscription entity.
async function findSub(entity) {
  if (!entity) return null;
  let sub = await prisma.subscription.findFirst({ where: { gatewaySubscriptionId: entity.id } });
  if (!sub && entity.notes?.credentialId) {
    sub = await prisma.subscription.findUnique({ where: { credentialId: entity.notes.credentialId } });
  }
  return sub;
}

router.post('/razorpay', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  // req.body is a Buffer (express.raw). Verify HMAC-SHA256 signature.
  const signature = req.headers['x-razorpay-signature'];
  const expected  = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  let valid = false;
  try {
    valid = !!signature &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));
  } catch (_) {
    valid = false;
  }
  if (!valid) {
    console.error('[Webhook] Razorpay signature verification failed');
    return res.status(400).send('Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch (_) {
    return res.status(400).send('Invalid payload');
  }

  try {
    const subEntity = event.payload?.subscription?.entity;

    switch (event.event) {
      // First successful authorization → Premium is live.
      case 'subscription.activated':
      case 'subscription.charged': {
        const sub = await findSub(subEntity);
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              tier:                 'PREMIUM',
              status:               'ACTIVE',
              gatewaySubscriptionId: subEntity.id,
              currentPeriodEnd:     toDate(subEntity.current_end) ?? sub.currentPeriodEnd,
            },
          });
          if (event.event === 'subscription.activated') {
            const cred = await prisma.credential.findUnique({
              where: { id: sub.credentialId },
              select: { id: true, label: true, hospitalId: true, role: true },
            });
            if (cred) {
              await writeAudit({
                actor: { type: 'credential', id: cred.id, hospitalId: cred.hospitalId, role: cred.role, label: cred.label },
                action: 'SUBSCRIPTION_UPGRADED',
                details: 'Upgraded to Premium (Razorpay)',
              });
            }
          }
        }
        break;
      }

      // A charge failed; Razorpay is retrying.
      case 'subscription.pending': {
        const sub = await findSub(subEntity);
        if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE' } });
        break;
      }

      // Retries exhausted — subscription paused.
      case 'subscription.halted': {
        const sub = await findSub(subEntity);
        if (sub) await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE' } });
        break;
      }

      // Cancelled or all cycles completed → back to Free.
      case 'subscription.cancelled':
      case 'subscription.completed': {
        const sub = await findSub(subEntity);
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { tier: 'FREE', status: 'CANCELLED', cancelAtPeriodEnd: false },
          });
          const cred = await prisma.credential.findUnique({
            where: { id: sub.credentialId },
            select: { id: true, label: true, hospitalId: true, role: true },
          });
          if (cred) {
            await writeAudit({
              actor: { type: 'credential', id: cred.id, hospitalId: cred.hospitalId, role: cred.role, label: cred.label },
              action: 'SUBSCRIPTION_CANCELLED',
              details: 'Premium ended (Razorpay)',
            });
          }
        }
        break;
      }

      default:
        break; // ignore other events
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Handler error:', err);
    res.status(500).send('Webhook handler error');
  }
});

export default router;
