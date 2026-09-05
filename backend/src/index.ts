import http from 'http';
import express from 'express';
import { config } from './config';
import { initSockets } from './sockets';
import { authRoutes } from './routes/auth';
import { jobRoutes } from './routes/jobs';
import { startSweep } from './services/sweep';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

const server = http.createServer(app);
const io = initSockets(server);
const stopSweep = startSweep(io);

server.listen(config.port, () => {
  console.log(`✦ Negotia API + Socket.IO on http://localhost:${config.port}`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => { stopSweep(); io.close(); server.close(() => process.exit(0)); });
}
