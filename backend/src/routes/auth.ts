import { Router } from 'express';
import { prisma } from '../db';
import { signToken, verifyPassword, type AuthUser } from '../auth';
import { loginSchema } from '../validation';
import { requireAuth, type AuthedRequest } from '../middleware';

export const authRoutes = Router();

authRoutes.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials format' });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const authUser: AuthUser = { id: user.id, role: user.role, name: user.name, email: user.email };
  res.json({ token: signToken(authUser), user: authUser });
});

authRoutes.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const id = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isNegotiating: true, activeJobId: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let activeJob: { jobId: string; negotiationId: string } | null = null;
  if (user.role === 'FREELANCER' && user.isNegotiating && user.activeJobId) {
    const n = await prisma.negotiation.findFirst({ where: { jobId: user.activeJobId, outcome: null }, select: { id: true } });
    if (n) activeJob = { jobId: user.activeJobId, negotiationId: n.id };
    else await prisma.user.update({ where: { id }, data: { isNegotiating: false, activeJobId: null } });
  }
  res.json({ user, activeJob });
});
