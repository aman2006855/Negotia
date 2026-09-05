import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { verifyToken, type AuthUser } from './auth';
import { prisma } from './db';
import { NegotiationError } from './errors';
import { lockJobSchema, joinNegotiationSchema, messageSchema, refSchema } from './validation';
import { lockJob, sendNegotiationMessage, touchNegotiation, markAbandoned, markResumed, declineNegotiation, signAgreement } from './services/negotiation';
import { buildNegotiationState } from './services/state';
import { jobFeedDTO } from './services/jobs';

type Ack = (payload: Record<string, unknown>) => void;

const userSocketCount = new Map<string, number>();

export function initSockets(httpServer: HttpServer) {
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',');
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  io.on('connection', (socket) => {
    const user = verifyToken(socket.handshake.auth?.token as string | undefined);
    if (!user) { socket.disconnect(); return; }
    socket.data.user = user;

    const prev = userSocketCount.get(user.id) ?? 0;
    userSocketCount.set(user.id, prev + 1);

    socket.join(`user:${user.id}`);
    if (user.role === 'FREELANCER') socket.join('feed:freelancers');

    if (user.role === 'FREELANCER') {
      void (async () => {
        const u = await prisma.user.findUnique({ where: { id: user.id }, select: { isNegotiating: true, activeJobId: true } });
        if (!u?.isNegotiating || !u.activeJobId) return;
        const n = await prisma.negotiation.findFirst({ where: { jobId: u.activeJobId, outcome: null } });
        if (!n) return;
        await markResumed(n.id);
        socket.join(`negotiation:${n.id}`);
        try { socket.emit('negotiation:state', await buildNegotiationState(n.id, user.id)); } catch {}
      })();
    }

    socket.on('job:lock', (payload: unknown, ack?: Ack) => {
      void (async () => {
        const parsed = lockJobSchema.safeParse(payload);
        if (!parsed.success) return ack?.({ ok: false, error: 'BAD_REQUEST' });
        if (user.role !== 'FREELANCER') return ack?.({ ok: false, error: 'UNAUTHORIZED' });
        try {
          const result = await lockJob(user.id, parsed.data.jobId);
          if (!result.ok) return ack?.({ ok: false, error: result.error });
          socket.join(`negotiation:${result.negotiation.id}`);
          io.to(`user:${result.job.clientId}`).emit('negotiation:started', await buildNegotiationState(result.negotiation.id, result.job.clientId));
          io.to('feed:freelancers').emit('job:updated', jobFeedDTO(result.job));
          ack?.({ ok: true, negotiation: result.negotiation, job: result.job });
        } catch (err: unknown) {
          if (err instanceof NegotiationError) return ack?.({ ok: false, error: err.code });
          console.error('[lock]', err);
          ack?.({ ok: false, error: 'INTERNAL' });
        }
      })();
    });

    socket.on('negotiation:join', (payload: unknown, ack?: Ack) => {
      void (async () => {
        const parsed = joinNegotiationSchema.safeParse(payload);
        if (!parsed.success) return ack?.({ ok: false, error: 'BAD_REQUEST' });
        try {
          const state = await buildNegotiationState(parsed.data.negotiationId, user.id);
          socket.join(`negotiation:${state.negotiationId}`);
          if (state.myRole === 'FREELANCER' && !state.outcome) await markResumed(state.negotiationId);
          ack?.({ ok: true, state });
        } catch (err: unknown) {
          ack?.({ ok: false, error: err instanceof NegotiationError ? err.code : 'INTERNAL' });
        }
      })();
    });

    socket.on('negotiation:message', (payload: unknown, ack?: Ack) => {
      void (async () => {
        const parsed = messageSchema.safeParse(payload);
        if (!parsed.success) return ack?.({ ok: false, error: 'BAD_REQUEST' });
        try {
          const msg = await sendNegotiationMessage(user.id, parsed.data);
          const dto = { id: msg.id, senderId: msg.senderId, senderName: user.name, body: msg.body, createdAt: msg.createdAt.toISOString() };
          socket.to(`negotiation:${msg.negotiationId}`).emit('negotiation:message', dto);
          ack?.({ ok: true, message: dto });
        } catch (err: unknown) {
          ack?.({ ok: false, error: err instanceof NegotiationError ? err.code : 'INTERNAL' });
        }
      })();
    });

    socket.on('negotiation:decline', (payload: unknown, ack?: Ack) => {
      void (async () => {
        const parsed = refSchema.safeParse(payload);
        if (!parsed.success) return ack?.({ ok: false, error: 'BAD_REQUEST' });
        try {
          const result = await declineNegotiation(parsed.data.negotiationId, user.id);
          if (!result) return ack?.({ ok: false, error: 'ALREADY_CLOSED' });
          io.to(`negotiation:${result.negotiation.id}`).emit('negotiation:closed', { negotiationId: result.negotiation.id, outcome: result.negotiation.outcome });
          io.to('feed:freelancers').emit('job:updated', jobFeedDTO(result.job));
          io.to(`user:${result.negotiation.freelancerId}`).emit('lock:released', { negotiationId: result.negotiation.id, reason: 'declined' });
          ack?.({ ok: true });
        } catch (err: unknown) {
          ack?.({ ok: false, error: err instanceof NegotiationError ? err.code : 'INTERNAL' });
        }
      })();
    });

    socket.on('agreement:sign', (payload: unknown, ack?: Ack) => {
      void (async () => {
        const parsed = refSchema.safeParse(payload);
        if (!parsed.success) return ack?.({ ok: false, error: 'BAD_REQUEST' });
        try {
          const result = await signAgreement(parsed.data.negotiationId, user.id);
          if (!result) return ack?.({ ok: false, error: 'ALREADY_CLOSED' });
          io.to(`negotiation:${result.negotiation.id}`).emit('negotiation:closed', { negotiationId: result.negotiation.id, outcome: 'ACCEPTED' });
          io.to('feed:freelancers').emit('job:updated', jobFeedDTO(result.job));
          io.to(`user:${result.negotiation.freelancerId}`).emit('lock:released', { negotiationId: result.negotiation.id, reason: 'signed' });
          ack?.({ ok: true });
        } catch (err: unknown) {
          ack?.({ ok: false, error: err instanceof NegotiationError ? err.code : 'INTERNAL' });
        }
      })();
    });

    socket.on('presence:heartbeat', () => {
      if (user.role === 'FREELANCER') void touchNegotiation(user.id);
    });

    socket.on('disconnect', () => {
      const count = (userSocketCount.get(user.id) ?? 1) - 1;
      userSocketCount.set(user.id, count);
      if (count === 0 && user.role === 'FREELANCER') {
        void markAbandoned(user.id).catch(() => {});
      }
    });
  });

  return io;
}
