import { prisma } from '../db';
import type { Job } from '@prisma/client';

export function jobFeedDTO(j: Pick<Job, 'id' | 'title' | 'description' | 'budgetCents' | 'status' | 'lockedAt' | 'createdAt'>) {
  return {
    id: j.id, title: j.title, description: j.description,
    budgetCents: j.budgetCents, status: j.status,
    lockedAt: j.lockedAt, createdAt: j.createdAt,
  };
}

export async function listFeedJobs() {
  const jobs = await prisma.job.findMany({
    where: { status: { in: ['OPEN', 'OCCUPIED'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, description: true, budgetCents: true, status: true, lockedAt: true, createdAt: true },
  });
  return jobs.map(jobFeedDTO);
}
