import { and, asc, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from './db.js';
import {
  eventMemberships,
  events,
  expenseShares,
  expenses,
  householdPeople,
  households,
  invitations,
  messages,
  notifications,
  pollOptions,
  polls,
  pollVotes,
  scheduleItems,
  tasks,
  users,
} from './schema.js';
import type { EventRole } from './auth.js';

function requireDb() {
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

export async function getEventBundle(eventId: string, userId?: string) {
  const database = requireDb();
  const [event] = await database.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;

  const schedule = await database.select().from(scheduleItems).where(eq(scheduleItems.eventId, eventId)).orderBy(asc(scheduleItems.startsAt));
  const householdRows = await database.select().from(households).where(eq(households.eventId, eventId));
  const householdIds = householdRows.map((h) => h.id);
  const people = householdIds.length
    ? await database.select().from(householdPeople).where(sql`${householdPeople.householdId} = ANY(${householdIds})`)
    : [];
  const pollRows = await database.select().from(polls).where(eq(polls.eventId, eventId)).orderBy(asc(polls.closesAt));
  const pollIds = pollRows.map((p) => p.id);
  const options = pollIds.length
    ? await database.select().from(pollOptions).where(sql`${pollOptions.pollId} = ANY(${pollIds})`)
    : [];
  const expenseRows = await database.select().from(expenses).where(eq(expenses.eventId, eventId)).orderBy(desc(expenses.createdAt));
  const expenseIds = expenseRows.map((e) => e.id);
  const shares = expenseIds.length
    ? await database.select().from(expenseShares).where(sql`${expenseShares.expenseId} = ANY(${expenseIds})`)
    : [];
  const taskRows = await database.select().from(tasks).where(eq(tasks.eventId, eventId)).orderBy(asc(tasks.dueAt));
  const chat = await database
    .select({ id: messages.id, body: messages.body, createdAt: messages.createdAt, senderUserId: messages.senderUserId, senderName: users.displayName })
    .from(messages)
    .innerJoin(users, eq(messages.senderUserId, users.id))
    .where(and(eq(messages.eventId, eventId), isNull(messages.removedAt)))
    .orderBy(asc(messages.createdAt));

  let membership: { role: EventRole; householdManager: boolean } | null = null;
  if (userId) {
    const [member] = await database.select().from(eventMemberships).where(and(eq(eventMemberships.eventId, eventId), eq(eventMemberships.userId, userId))).limit(1);
    const [managed] = await database.select({ id: households.id }).from(households).where(and(eq(households.eventId, eventId), eq(households.managerUserId, userId))).limit(1);
    if (member) membership = { role: member.role as EventRole, householdManager: Boolean(managed) };
  }

  return {
    event,
    membership,
    schedule,
    households: householdRows.map((household) => ({
      ...household,
      people: people.filter((person) => person.householdId === household.id),
    })),
    polls: pollRows.map((poll) => ({
      ...poll,
      options: options.filter((option) => option.pollId === poll.id),
    })),
    expenses: expenseRows.map((expense) => ({
      ...expense,
      shares: shares.filter((share) => share.expenseId === expense.id),
    })),
    tasks: taskRows,
    chat,
  };
}

export async function getMembership(eventId: string, userId: string) {
  const database = requireDb();
  const [membership] = await database.select().from(eventMemberships).where(and(eq(eventMemberships.eventId, eventId), eq(eventMemberships.userId, userId))).limit(1);
  return membership ?? null;
}

export async function updateHouseholdRsvp(householdId: string, userId: string, status: 'yes' | 'no' | 'maybe' | 'pending', attendance?: Record<string, boolean>) {
  const database = requireDb();
  const [household] = await database.select().from(households).where(eq(households.id, householdId)).limit(1);
  if (!household) return { kind: 'not_found' as const };
  const membership = await getMembership(household.eventId, userId);
  const canManage = household.managerUserId === userId || membership?.role === 'organizer' || membership?.role === 'co-organizer';
  if (!canManage) return { kind: 'forbidden' as const };

  await database.update(households).set({ rsvp: status }).where(eq(households.id, householdId));
  if (attendance) {
    for (const [personId, attending] of Object.entries(attendance)) {
      await database.update(householdPeople).set({ attending }).where(and(eq(householdPeople.id, personId), eq(householdPeople.householdId, householdId)));
    }
  }
  return { kind: 'ok' as const };
}

export async function postMessage(eventId: string, userId: string, body: string) {
  const database = requireDb();
  const membership = await getMembership(eventId, userId);
  if (!membership) return { kind: 'forbidden' as const };
  const [created] = await database.insert(messages).values({ eventId, senderUserId: userId, body }).returning();
  return { kind: 'ok' as const, message: created };
}

export async function acceptInvitation(code: string, userId: string, email: string) {
  const database = requireDb();
  const [invitation] = await database.select().from(invitations).where(eq(invitations.code, code.toUpperCase())).limit(1);
  if (!invitation || invitation.revokedAt) return { kind: 'not_found' as const };
  if (invitation.expiresAt && invitation.expiresAt < new Date()) return { kind: 'expired' as const };
  if (invitation.maxUses != null && invitation.useCount >= invitation.maxUses) return { kind: 'exhausted' as const };
  if (invitation.email && invitation.email.toLowerCase() !== email.toLowerCase()) return { kind: 'email_mismatch' as const };

  await database.insert(eventMemberships).values({ eventId: invitation.eventId, userId, role: invitation.role }).onConflictDoUpdate({
    target: [eventMemberships.eventId, eventMemberships.userId],
    set: { role: invitation.role },
  });
  await database.update(invitations).set({ useCount: sql`${invitations.useCount} + 1` }).where(eq(invitations.id, invitation.id));
  return { kind: 'ok' as const, eventId: invitation.eventId, role: invitation.role as EventRole };
}

export async function previewInvitation(code: string) {
  const database = requireDb();
  const [row] = await database
    .select({ invitation: invitations, event: events })
    .from(invitations)
    .innerJoin(events, eq(invitations.eventId, events.id))
    .where(and(eq(invitations.code, code.toUpperCase()), isNull(invitations.revokedAt)))
    .limit(1);
  return row ?? null;
}

export async function votePoll(pollId: string, optionIds: string[], userId: string) {
  const database = requireDb();
  const [poll] = await database.select().from(polls).where(eq(polls.id, pollId)).limit(1);
  if (!poll) return { kind: 'not_found' as const };
  if (poll.closesAt && poll.closesAt < new Date()) return { kind: 'closed' as const };
  if (!(await getMembership(poll.eventId, userId))) return { kind: 'forbidden' as const };
  if (poll.mode === 'single' && optionIds.length !== 1) return { kind: 'invalid' as const };

  await database.delete(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)));
  if (optionIds.length) await database.insert(pollVotes).values(optionIds.map((optionId) => ({ pollId, optionId, userId })));
  return { kind: 'ok' as const };
}

export async function setExpenseShareSettled(shareId: string, userId: string, settled: boolean) {
  const database = requireDb();
  const [share] = await database.select().from(expenseShares).where(eq(expenseShares.id, shareId)).limit(1);
  if (!share) return { kind: 'not_found' as const };
  const [expense] = await database.select().from(expenses).where(eq(expenses.id, share.expenseId)).limit(1);
  if (!expense) return { kind: 'not_found' as const };
  const membership = await getMembership(expense.eventId, userId);
  const canManage = share.userId === userId || expense.payerUserId === userId || membership?.role === 'organizer' || membership?.role === 'co-organizer';
  if (!canManage) return { kind: 'forbidden' as const };
  await database.update(expenseShares).set({ settled }).where(eq(expenseShares.id, shareId));
  const outstanding = await database.select({ count: sql<number>`count(*)` }).from(expenseShares).where(and(eq(expenseShares.expenseId, expense.id), eq(expenseShares.settled, false)));
  await database.update(expenses).set({ settled: Number(outstanding[0]?.count ?? 0) === 0 }).where(eq(expenses.id, expense.id));
  return { kind: 'ok' as const };
}

export async function setTaskComplete(taskId: string, userId: string, complete: boolean) {
  const database = requireDb();
  const [task] = await database.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) return { kind: 'not_found' as const };
  const membership = await getMembership(task.eventId, userId);
  const canManage = task.assigneeUserId === userId || membership?.role === 'organizer' || membership?.role === 'co-organizer';
  if (!canManage) return { kind: 'forbidden' as const };
  await database.update(tasks).set({ complete }).where(eq(tasks.id, taskId));
  return { kind: 'ok' as const };
}

export async function listNotifications(userId: string) {
  return requireDb().select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}
