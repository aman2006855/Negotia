export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtTtl: '7d',
  inactiveTtlMs: 15 * 60 * 1000,
  disconnectGraceMs: 60 * 1000,
  sweepIntervalMs: 30 * 1000,
  maxMessageLength: 2000,
} as const;
