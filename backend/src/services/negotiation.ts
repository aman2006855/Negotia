import { type Negotiation, type Job } from '@prisma/client';
import { prisma } from '../db';
import { NegotiationError, type NegotiationErrorCode } from '../errors';

export type LockResult =
  | { ok: true; negotiation: Negotiation; job: Job }
  | { ok: false; error: NegotiationErrorCode };

export async function lockJob(freelancerId: string, jobId: string): Promise<LockResult> {
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.findUnique({ where: { id: jobId } });
    if (!job) return { ok: false, error: 'NOT_FOUND' };
    if (job.status === 'CLOSED') return { ok: false, error: 'NOT_OPEN' };

    if (job.status === 'OCCUPIED' && job.lockedByFreelancerId === freelancerId) {
      const existing = await tx.negotiation.findFirst({ where: { jobId: job.id, outcome: null } });
      if (existing) return { ok: true, negotiation: existing, job };
    }
    if (job.status !== 'OPEN') return { ok: false, error: 'JOB_TAKEN' };

    const jobClaim = await tx.job.updateMany({
      where: { id: job.id, status: 'OPEN' },
      data: { status: 'OCCUPIED', lockedByFreelancerId: freelancerId, lockedAt: new Date() },
    });
    if (jobClaim.count === 0) return { ok: false, error: 'JOB_TAKEN' };

    const userClaim = await tx.user.updateMany({
      where: { id: freelancerId, isNegotiating: false, activeJobId: null },
      data: { isNegotiating: true, activeJobId: job.id },
    });
    if (userClaim.count === 0) throw new NegotiationError('ALREADY_NEGOTIATING', 'Already negotiating');

    const negotiation = await tx.negotiation.create({
      data: { jobId: job.id, clientId: job.clientId, freelancerId },
    });

    return { ok: true, negotiation, job: { ...job, status: 'OCCUPIED' as const, lockedByFreelancerId: freelancerId, lockedAt: new Date() } };
  }, { timeout: 5000, maxWait: 2000 });
}

export interface FinalizeResult {
  negotiation: Negotiation;
  job: Job;
  released: boolean;
}

export async function finalizeNegotiation(
  negotiationId: string,
  outcome: 'ACCEPTED' | 'DECLINED' | 'EXPIRED',
  opts: { byUserId?: string } = {},
): Promise<FinalizeResult | null> {
  return prisma.$transaction(async (tx) => {
    const n = await tx.negotiation.findUnique({ where: { id: negotiationId }, include: { job: true } });
    if (!n || n.outcome) return null;
    if (opts.byUserId && n.freelancerId !== opts.byUserId) {
      throw new NegotiationError('NOT_PARTICIPANT', 'Only the assigned freelancer can close this');
    }

    let released = false;
    if (n.job.status === 'OCCUPIED' && n.job.lockedByFreelancerId === n.freelancerId) {
      const r = await tx.job.updateMany({
        where: { id: n.jobId, status: 'OCCUPIED', lockedByFreelancerId: n.freelancerId },
        data: {
          status: outcome === 'ACCEPTED' ? 'CLOSED' : 'OPEN',
          lockedByFreelancerId: null,
          lockedAt: null,
          closedAt: outcome === 'ACCEPTED' ? new Date() : null,
        },
      });
      released = r.count === 1;
    }

    const negotiation = await tx.negotiation.update({
      where: { id: negotiationId },
      data: { outcome, closedAt: new Date(), abandonedAt: null },
    });

    if (outcome === 'ACCEPTED') {
      await tx.signedAgreement.create({
        data: { negotiationId, agreementText: n.job.agreementText, signedById: n.freelancerId },
      });
    }

    await tx.user.updateMany({
      where: { id: n.freelancerId, activeJobId: n.jobId },
      data: { isNegotiating: false, activeJobId: null },
    });

    const job = await tx.job.findUniqueOrThrow({ where: { id: n.jobId } });
    return { negotiation, job, released };
  });
}

export const declineNegotiation = (id: string, byUserId: string) =>
  finalizeNegotiation(id, 'DECLINED', { byUserId });

export const signAgreement = (id: string, byUserId: string) =>
  finalizeNegotiation(id, 'ACCEPTED', { byUserId });

export async function sendNegotiationMessage(userId: string, data: { negotiationId: string; body: string }) {
  return prisma.$transaction(async (tx) => {
    const n = await tx.negotiation.findFirst({ where: { id: data.negotiationId, outcome: null } });
    if (!n) throw new NegotiationError('ALREADY_CLOSED', 'This negotiation has ended');
    if (n.freelancerId !== userId && n.clientId !== userId) {
      throw new NegotiationError('NOT_PARTICIPANT', 'Not a participant');
    }
    const message = await tx.message.create({
      data: { negotiationId: n.id, senderId: userId, body: data.body },
    });
    await tx.negotiation.update({ where: { id: n.id }, data: { lastActivityAt: new Date() } });
    return message;
  });
}

export async function touchNegotiation(freelancerId: string) {
  await prisma.negotiation.updateMany({
    where: { freelancerId, outcome: null },
    data: { lastActivityAt: new Date() },
  });
}

export async function markAbandoned(freelancerId: string) {
  await prisma.negotiation.updateMany({
    where: { freelancerId, outcome: null, abandonedAt: null },
    data: { abandonedAt: new Date() },
  });
}

export async function markResumed(negotiationId: string) {
  await prisma.negotiation.updateMany({
    where: { id: negotiationId, outcome: null },
    data: { abandonedAt: null },
  });
}
