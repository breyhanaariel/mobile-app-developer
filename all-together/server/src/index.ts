import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { principalFromAuthorization, roleCanManageEvent } from './auth.js';
import { databaseEnabled } from './db.js';
import { createCloudinaryUploadSignature, registerPushToken, savePhoto } from './engagement.js';
import {
  acceptInvitation,
  createEvent,
  getEventBundle,
  getMembership,
  listNotifications,
  listUserEvents,
  postMessage,
  previewInvitation,
  setExpenseShareSettled,
  setTaskComplete,
  updateHouseholdRsvp,
  votePoll,
} from './repository.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const eventCreateSchema = z.object({
  familyGroupId: z.string().uuid().optional(),
  title: z.string().min(2).max(120),
  type: z.enum(['Family Reunion','Birthday','Holiday','Vacation','Graduation','Celebration','Custom']),
  description: z.string().max(2000).optional(),
  locationName: z.string().min(2).max(200),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});
const householdRsvpSchema = z.object({ status: z.enum(['yes','no','maybe','pending']), attendance: z.record(z.string().uuid(), z.boolean()).optional() });
const messageSchema = z.object({ eventId: z.string().uuid(), text: z.string().min(1).max(2000) });
const voteSchema = z.object({ optionIds: z.array(z.string().uuid()).max(20) });
const settledSchema = z.object({ settled: z.boolean() });
const completeSchema = z.object({ complete: z.boolean() });
const pushTokenSchema = z.object({ token: z.string().min(10), platform: z.enum(['ios','android']) });
const photoSchema = z.object({ eventId: z.string().uuid(), publicId: z.string().min(2), secureUrl: z.string().url(), caption: z.string().max(500).optional() });

async function requirePrincipal(request: { headers: { authorization?: string } }, reply: any) {
  const principal = await principalFromAuthorization(request.headers.authorization);
  if (!principal) reply.code(401).send({ error: 'authentication_required' });
  return principal;
}

app.get('/health', async () => ({
  ok: true,
  service: 'all-together-api',
  database: databaseEnabled ? 'configured' : 'missing',
  clerk: process.env.CLERK_SECRET_KEY || process.env.CLERK_JWT_KEY ? 'configured' : 'demo-boundary',
  cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'credential-pending',
  push: process.env.EXPO_ACCESS_TOKEN ? 'configured' : 'credential-pending',
  email: process.env.RESEND_API_KEY ? 'configured' : 'credential-pending',
}));

app.get('/v1/integrations/readiness', async () => ({
  database: databaseEnabled,
  clerk: Boolean(process.env.CLERK_SECRET_KEY || process.env.CLERK_JWT_KEY),
  googleMaps: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  expoPush: Boolean(process.env.EXPO_ACCESS_TOKEN),
  email: Boolean(process.env.RESEND_API_KEY),
}));

app.get('/v1/auth/providers', async () => ({
  provider: 'clerk',
  providers: [{ id: 'email', enabled: true }, { id: 'google', enabled: true }, { id: 'apple', enabled: true }],
  credentialMode: process.env.CLERK_SECRET_KEY ? 'live' : 'demo-boundary',
}));

app.get('/v1/events', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  return { events: await listUserEvents(principal.userId) };
});

app.post('/v1/events', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const parsed = eventCreateSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  if (parsed.data.endsAt <= parsed.data.startsAt) return reply.code(400).send({ error: 'event_end_must_follow_start' });
  const event = await createEvent({ userId: principal.userId, ...parsed.data });
  return reply.code(201).send({ event });
});

app.get('/v1/events/:eventId', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { eventId } = request.params as { eventId: string };
  const membership = await getMembership(eventId, principal.userId);
  if (!membership) return reply.code(403).send({ error: 'event_membership_required' });
  const bundle = await getEventBundle(eventId, principal.userId);
  if (!bundle) return reply.code(404).send({ error: 'event_not_found' });
  return bundle;
});

app.get('/v1/events/:eventId/me', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { eventId } = request.params as { eventId: string };
  const membership = await getMembership(eventId, principal.userId);
  if (!membership) return reply.code(404).send({ error: 'membership_not_found' });
  const bundle = await getEventBundle(eventId, principal.userId);
  return { user: principal, eventId, role: membership.role, householdManager: bundle?.membership?.householdManager ?? false };
});

app.post('/v1/households/:householdId/rsvp', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { householdId } = request.params as { householdId: string };
  const parsed = householdRsvpSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const result = await updateHouseholdRsvp(householdId, principal.userId, parsed.data.status, parsed.data.attendance);
  if (result.kind === 'not_found') return reply.code(404).send({ error: 'household_not_found' });
  if (result.kind === 'forbidden') return reply.code(403).send({ error: 'household_rsvp_not_allowed' });
  return { ok: true };
});

app.post('/v1/chat/messages', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const parsed = messageSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const result = await postMessage(parsed.data.eventId, principal.userId, parsed.data.text);
  if (result.kind === 'forbidden') return reply.code(403).send({ error: 'event_membership_required' });
  return reply.code(201).send(result.message);
});

app.get('/v1/invitations/:code/preview', async (request, reply) => {
  const { code } = request.params as { code: string };
  const row = await previewInvitation(code);
  if (!row) return reply.code(404).send({ error: 'invitation_not_found' });
  if (row.invitation.expiresAt && row.invitation.expiresAt < new Date()) return reply.code(410).send({ error: 'invitation_expired' });
  return { code: row.invitation.code, eventId: row.event.id, familyGroupId: row.event.familyGroupId, eventTitle: row.event.title, eventType: row.event.type, locationName: row.event.locationName, startsAt: row.event.startsAt, endsAt: row.event.endsAt, private: row.event.isPrivate, previewAllowed: true, participationRequiresAuthentication: true };
});

app.post('/v1/invitations/:code/accept', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { code } = request.params as { code: string };
  const result = await acceptInvitation(code, principal.userId, principal.email);
  if (result.kind === 'not_found') return reply.code(404).send({ error: 'invitation_not_found' });
  if (result.kind === 'expired') return reply.code(410).send({ error: 'invitation_expired' });
  if (result.kind === 'exhausted') return reply.code(409).send({ error: 'invitation_limit_reached' });
  if (result.kind === 'email_mismatch') return reply.code(403).send({ error: 'invitation_email_mismatch' });
  return { accepted: true, eventId: result.eventId, role: result.role };
});

app.post('/v1/polls/:pollId/votes', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { pollId } = request.params as { pollId: string };
  const parsed = voteSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const result = await votePoll(pollId, parsed.data.optionIds, principal.userId);
  if (result.kind === 'not_found') return reply.code(404).send({ error: 'poll_not_found' });
  if (result.kind === 'closed') return reply.code(409).send({ error: 'poll_closed' });
  if (result.kind === 'forbidden') return reply.code(403).send({ error: 'event_membership_required' });
  if (result.kind === 'invalid') return reply.code(400).send({ error: 'invalid_poll_vote' });
  return { ok: true };
});

app.patch('/v1/expense-shares/:shareId', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { shareId } = request.params as { shareId: string };
  const parsed = settledSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const result = await setExpenseShareSettled(shareId, principal.userId, parsed.data.settled);
  if (result.kind === 'not_found') return reply.code(404).send({ error: 'expense_share_not_found' });
  if (result.kind === 'forbidden') return reply.code(403).send({ error: 'expense_update_not_allowed' });
  return { ok: true };
});

app.patch('/v1/tasks/:taskId', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { taskId } = request.params as { taskId: string };
  const parsed = completeSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const result = await setTaskComplete(taskId, principal.userId, parsed.data.complete);
  if (result.kind === 'not_found') return reply.code(404).send({ error: 'task_not_found' });
  if (result.kind === 'forbidden') return reply.code(403).send({ error: 'task_update_not_allowed' });
  return { ok: true };
});

app.get('/v1/notifications', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  return { notifications: await listNotifications(principal.userId) };
});

app.post('/v1/push-tokens', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const parsed = pushTokenSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  return registerPushToken(principal.userId, parsed.data.token, parsed.data.platform);
});

app.post('/v1/photos/sign-upload', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const eventId = z.string().uuid().safeParse((request.body as any)?.eventId);
  if (!eventId.success) return reply.code(400).send({ error: 'valid_event_id_required' });
  if (!(await getMembership(eventId.data, principal.userId))) return reply.code(403).send({ error: 'event_membership_required' });
  const signature = createCloudinaryUploadSignature(eventId.data, principal.userId);
  if (!signature) return reply.code(503).send({ error: 'cloudinary_credentials_missing' });
  return signature;
});

app.post('/v1/photos', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const parsed = photoSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const result = await savePhoto({ ...parsed.data, userId: principal.userId });
  if (result.kind === 'forbidden') return reply.code(403).send({ error: 'event_membership_required' });
  return reply.code(201).send(result.photo);
});

app.get('/v1/events/:eventId/changes', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { eventId } = request.params as { eventId: string };
  const membership = await getMembership(eventId, principal.userId);
  if (!membership) return reply.code(403).send({ error: 'event_membership_required' });
  const bundle = await getEventBundle(eventId, principal.userId);
  return { serverTime: new Date().toISOString(), event: bundle };
});

app.get('/v1/events/:eventId/admin', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const { eventId } = request.params as { eventId: string };
  const membership = await getMembership(eventId, principal.userId);
  if (!membership || !roleCanManageEvent(membership.role)) return reply.code(403).send({ error: 'organizer_required' });
  return { event: await getEventBundle(eventId, principal.userId), management: true };
});

const port = Number(process.env.PORT ?? 3000);
if (process.env.VERCEL !== '1') await app.listen({ port, host: '0.0.0.0' });
export default app;
