import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware';
import { createJobSchema } from '../validation';
import { jobFeedDTO, listFeedJobs } from '../services/jobs';

export const jobRoutes = Router();

jobRoutes.get('/', requireAuth, async (_req, res) => {
  res.json({ jobs: await listFeedJobs() });
});

jobRoutes.post('/', requireAuth, requireRole('CLIENT'), async (req: AuthedRequest, res) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid job payload', details: parsed.error.flatten() });
  const job = await prisma.job.create({ data: { clientId: req.user!.id, ...parsed.data } });
  res.status(201).json({ job: jobFeedDTO(job) });
});

jobRoutes.get('/mine', requireAuth, requireRole('CLIENT'), async (req: AuthedRequest, res) => {
  const jobs = await prisma.job.findMany({
    where: { clientId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: {
      lockedByFreelancer: { select: { id: true, name: true } },
      negotiations: { where: { outcome: null }, select: { id: true } },
    },
  });
  res.json({ jobs });
});
