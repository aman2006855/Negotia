import { prisma } from '../db';
import { NegotiationError } from '../errors';

export interface ChatMessageDTO {
  id: string; senderId: string; senderName: string; body: string; createdAt: string;
}

export interface NegotiationStateDTO {
  negotiationId: string;
  myRole: 'CLIENT' | 'FREELANCER';
  outcome: string | null;
  closedAt: string | null;
  job: { id: string; title: string; description: string; budgetCents: number; agreementText: string; clientName: string };
  messages: ChatMessageDTO[];
}

export async function buildNegotiationState(negotiationId: string, viewerId: string): Promise<NegotiationStateDTO> {
  const n = await prisma.negotiation.findUnique({
    where: { id: negotiationId },
    include: {
      job: true,
      client: { select: { name: true } },
      freelancer: { select: { name: true } },
      messages: { orderBy: { createdAt: 'asc' }, take: 200, include: { sender: { select: { name: true } } } },
    },
  });
  if (!n) throw new NegotiationError('NOT_FOUND', 'Negotiation not found');
  if (n.clientId !== viewerId && n.freelancerId !== viewerId) {
    throw new NegotiationError('NOT_PARTICIPANT', 'Not a participant');
  }

  return {
    negotiationId: n.id,
    myRole: n.freelancerId === viewerId ? 'FREELANCER' : 'CLIENT',
    outcome: n.outcome,
    closedAt: n.closedAt?.toISOString() ?? null,
    job: {
      id: n.job.id, title: n.job.title, description: n.job.description,
      budgetCents: n.job.budgetCents, agreementText: n.job.agreementText,
      clientName: n.client.name,
    },
    messages: n.messages.map((m) => ({
      id: m.id, senderId: m.senderId, senderName: m.sender.name,
      body: m.body, createdAt: m.createdAt.toISOString(),
    })),
  };
}
