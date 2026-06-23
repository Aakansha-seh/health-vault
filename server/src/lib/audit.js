// Central audit writer — call this after every significant action.
// Fire-and-forget: errors are swallowed so audit failure never breaks the API.

import prisma from './prisma.js';

/**
 * writeAudit({ actor, action, target?, details?, ipAddress? })
 *
 * actor  — req.actor from auth middleware
 * action — AuditAction enum value
 * target — optional { type: string, id: string, label: string }
 * details — optional free-text context
 * ipAddress — req.ip
 */
export async function writeAudit({ actor, action, target, details, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorLabel: actor.label ?? actor.name ?? 'Unknown',
        actorRole: actor.type === 'admin' ? 'ADMIN' : actor.role,
        adminId:      actor.type === 'admin'       ? actor.id : null,
        credentialId: actor.type === 'credential'  ? actor.id : null,
        targetType:  target?.type  ?? null,
        targetId:    target?.id    ?? null,
        targetLabel: target?.label ?? null,
        details:     details       ?? null,
        hospitalId:  actor.hospitalId,
        ipAddress:   ipAddress     ?? null,
      },
    });
  } catch (err) {
    // Non-fatal — log to stderr but never propagate
    console.error('[Audit] Failed to write audit log:', err.message);
  }
}
