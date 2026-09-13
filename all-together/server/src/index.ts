import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { principalFromAuthorization, type EventRole } from './auth.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const householdRsvpSchema = z.object({ householdId: z.string().min(1), status: z.enum(['yes','no','maybe','pending']) });
const messageSchema = z.object({ eventId: z.string().min(1), sender: z.string().min(1), text: z.string().min(1).max(2000) });

const demoEvent = {
  eventId: '22222222-2222-4222-8222-222222222222',
  familyGroupId: '33333333-3333-4333-8333-333333333333',
  eventTitle: 'The Carter Family Reunion 2027',
  eventType: 'Family Reunion',
  locationName: 'St. Petersburg, Florida',
  startsAt: '2027-07-16T16:00:00-04:00',
  endsAt: '2027-07-18T15:00:00-04:00',
} as const;

const demoInvitations: Record<string, { role: EventRole }> = {
  CARTER2027: { role: 'family-member' },
  CARTERGUEST: { role: 'guest' },
};

app.get('/health', async () => ({ ok: true, service: 'all-together-api' }));

app.get('/v1/auth/providers', async () => ({
  providers: [
    { id: 'email', enabled: true, mode: 'demo-boundary' },
    { id: 'google', enabled: true, mode: 'credential-pending' },
    { id: 'apple', enabled: true, mode: 'credential-pending' },
  ],
}));

app.get('/v1/events/:eventId', async (request) => {
  const { eventId } = request.params as { eventId: string };
  return { eventId, source: 'demo', message: 'Replace with Neon/Drizzle query once DATABASE_URL is configured.' };
});

app.get('/v1/events/:eventId/me', async (request, reply) => {
  const principal = principalFromAuthorization(request.headers.authorization);
  if (!principal) return reply.code(401).send({ error: 'authentication_required' });

  const { eventId } = request.params as { eventId: string };
  if (eventId !== demoEvent.eventId) return reply.code(404).send({ error: 'event_not_found' });

  return {
    user: principal,
    eventId,
    role: 'family-member' satisfies EventRole,
    householdManager: true,
  };
});

app.post('/v1/households/rsvp', async (request, reply) => {
  const principal = principalFromAuthorization(request.headers.authorization);
  if (!principal) return reply.code(401).send({ error: 'authentication_required' });

  const parsed = householdRsvpSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  return { ok: true, updatedByUserId: principal.userId, ...parsed.data };
});

app.post('/v1/chat/messages', async (request, reply) => {
  const principal = principalFromAuthorization(request.headers.authorization);
  if (!principal) return reply.code(401).send({ error: 'authentication_required' });

  const parsed = messageSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  return {
    ok: true,
    id: crypto.randomUUID(),
    senderUserId: principal.userId,
    createdAt: new Date().toISOString(),
    ...parsed.data,
  };
});

app.get('/v1/invitations/:code/preview', async (request, reply) => {
  const { code } = request.params as { code: string };
  const invitation = demoInvitations[code.toUpperCase()];
  if (!invitation) return reply.code(404).send({ error: 'invitation_not_found' });

  return {
    code: code.toUpperCase(),
    ...demoEvent,
    private: true,
    previewAllowed: true,
    participationRequiresAuthentication: true,
  };
});

app.post('/v1/invitations/:code/accept', async (request, reply) => {
  const principal = principalFromAuthorization(request.headers.authorization);
  if (!principal) return reply.code(401).send({ error: 'authentication_required' });

  const { code } = request.params as { code: string };
  const invitation = demoInvitations[code.toUpperCase()];
  if (!invitation) return reply.code(404).send({ error: 'invitation_not_found' });

  return {
    accepted: true,
    userId: principal.userId,
    eventId: demoEvent.eventId,
    familyGroupId: demoEvent.familyGroupId,
    role: invitation.role,
  };
});

const port = Number(process.env.PORT ?? 3000);
if (process.env.VERCEL !== '1') {
  await app.listen({ port, host: '0.0.0.0' });
}

export default app;
