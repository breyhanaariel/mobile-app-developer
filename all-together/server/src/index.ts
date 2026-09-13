import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const householdRsvpSchema = z.object({ householdId: z.string().min(1), status: z.enum(['yes','no','maybe','pending']) });
const messageSchema = z.object({ eventId: z.string().min(1), sender: z.string().min(1), text: z.string().min(1).max(2000) });

app.get('/health', async () => ({ ok: true, service: 'all-together-api' }));

app.get('/v1/events/:eventId', async (request) => {
  const { eventId } = request.params as { eventId: string };
  return { eventId, source: 'demo', message: 'Replace with Neon/Drizzle query once DATABASE_URL is configured.' };
});

app.post('/v1/households/rsvp', async (request, reply) => {
  const parsed = householdRsvpSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  return { ok: true, ...parsed.data };
});

app.post('/v1/chat/messages', async (request, reply) => {
  const parsed = messageSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  return { ok: true, id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...parsed.data };
});

app.get('/v1/invitations/:code/preview', async (request) => {
  const { code } = request.params as { code: string };
  return { code, private: true, previewAllowed: true, participationRequiresAuthentication: true };
});

const port = Number(process.env.PORT ?? 3000);
if (process.env.VERCEL !== '1') {
  await app.listen({ port, host: '0.0.0.0' });
}

export default app;
