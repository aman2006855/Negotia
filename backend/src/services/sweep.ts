import type { Server } from 'socket.io';
import { prisma } from '../db';
import { config } from '../config';
import { finalizeNegotiation } from './negotiation';
import { jobFeedDTO } from './jobs';

export function startSweep(io: Server): () => void {
  const timer = setInterval(() => { void sweepOnce(io); }, config.sweepIntervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

async function sweepOnce(io: Server) {
  const now = Date.now();
  const inactiveBefore = new Date(now - config.inactiveTtlMs);
  const abandonedBefore = new Date(now - config.disconnectGraceMs);

  const stale = await prisma.negotiation.findMany({
    where: {
      outcome: null,
      OR: [
        { lastActivityAt: { lt: inactiveBefore } },
        { abandonedAt: { not: null, lte: abandonedBefore } },
      ],
    },
    include: { job: true },
  });

  for (const n of stale) {
    try {
      const result = await finalizeNegotiation(n.id, 'EXPIRED');
      if (!result) continue;
      io.to('feed:freelancers').emit('job:updated', jobFeedDTO(result.job));
      io.to(`user:${result.negotiation.freelancerId}`).emit('lock:released', { negotiationId: n.id, reason: 'expired' });
      io.to(`user:${result.negotiation.clientId}`).emit('negotiation:closed', { negotiationId: n.id, outcome: 'EXPIRED' });
    } catch (err) {
      console.error('[sweep] failed to release', n.id, err);
    }
  }
}
