import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'password123';

async function main() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: 'client@demo.dev' },
    update: {},
    create: { email: 'client@demo.dev', name: 'Ava (Client)', passwordHash: hash, role: Role.CLIENT },
  });

  await prisma.user.upsert({
    where: { email: 'freelancer@demo.dev' },
    update: {},
    create: { email: 'freelancer@demo.dev', name: 'Sam (Freelancer)', passwordHash: hash, role: Role.FREELANCER },
  });

  await prisma.user.upsert({
    where: { email: 'jordan@demo.dev' },
    update: {},
    create: { email: 'jordan@demo.dev', name: 'Jordan (Freelancer)', passwordHash: hash, role: Role.FREELANCER },
  });

  const client = await prisma.user.findUnique({ where: { email: 'client@demo.dev' } });
  if (!client) throw new Error('Client user not found after upsert');

  const existing = await prisma.job.count({ where: { clientId: client.id } });
  if (existing === 0) {
    await prisma.job.createMany({
      data: [
        {
          clientId: client.id,
          title: 'Design a mobile onboarding flow',
          description: 'Create 4–5 screen mobile onboarding flow with illustrations, progress indicators, and a final CTA. Figma handoff included. Must be accessible (WCAG 2.1 AA).',
          budgetCents: 180000,
          agreementText: 'Payment on delivery. 2 revision rounds included. NDA required before project start. Timeline: 14 calendar days from kickoff. All source files transferred upon final payment. Late delivery penalty: 5% per day after deadline.',
        },
        {
          clientId: client.id,
          title: 'Build a REST API for a booking system',
          description: 'Node.js/Express REST API for appointment booking. Features: user auth (JWT), availability slots, booking CRUD, email notifications, rate limiting. PostgreSQL database.',
          budgetCents: 320000,
          agreementText: 'Full ownership of code transfers to client upon payment. 30-day bug-fix warranty post-delivery. Bi-weekly progress check-ins via video call. Must include automated test suite (>80% coverage). Deployment support for 1 week after delivery.',
        },
        {
          clientId: client.id,
          title: 'Refactor jQuery dashboard to React',
          description: 'Migrate legacy jQuery-based admin dashboard to React 18 with TypeScript. ~15 pages, data tables, charts, form builders. Must maintain pixel-perfect UI parity.',
          budgetCents: 540000,
          agreementText: 'Phased delivery: Phase 1 (core layout + auth) in 2 weeks, Phase 2 (main tables) in 2 weeks, Phase 3 (charts + forms) in 2 weeks. Client provides test environment access. Code reviews required at each phase boundary. 10% holdback until UAT sign-off.',
        },
      ],
    });
  }

  console.log('✓ Seed complete');
  console.log('  client@demo.dev / password123 (CLIENT)');
  console.log('  freelancer@demo.dev / password123 (FREELANCER)');
  console.log('  jordan@demo.dev / password123 (FREELANCER)');
}

main().finally(() => prisma.$disconnect());
