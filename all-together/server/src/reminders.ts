import { and, eq, gte, inArray, lte, or } from 'drizzle-orm';
import { db } from './db.js';
import { deliverNotification } from './engagement.js';
import { eventMemberships, events, households, polls, scheduleItems, tasks } from './schema.js';

function requireDb() {
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

async function memberIds(eventId: string) {
  const rows = await requireDb().select({ userId: eventMemberships.userId }).from(eventMemberships).where(eq(eventMemberships.eventId, eventId));
  return rows.map((row) => row.userId);
}

export async function runReminderSweep(now = new Date()) {
  const database = requireDb();
  const day = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  let delivered = 0;

  const upcomingActivities = await database.select().from(scheduleItems).where(and(gte(scheduleItems.startsAt, now), lte(scheduleItems.startsAt, day)));
  for (const item of upcomingActivities) {
    for (const userId of await memberIds(item.eventId)) {
      await deliverNotification({ userId, eventId: item.eventId, type: 'upcoming_activity', title: `Upcoming: ${item.title}`, body: `${item.locationName} starts within the next 24 hours.`, data: { eventId: item.eventId, scheduleItemId: item.id }, email: true });
      delivered += 1;
    }
  }

  const closingPolls = await database.select().from(polls).where(and(gte(polls.closesAt, now), lte(polls.closesAt, day)));
  for (const poll of closingPolls) {
    for (const userId of await memberIds(poll.eventId)) {
      await deliverNotification({ userId, eventId: poll.eventId, type: 'poll_closing', title: 'Poll closing soon', body: poll.question, data: { eventId: poll.eventId, pollId: poll.id }, email: true });
      delivered += 1;
    }
  }

  const dueTasks = await database.select().from(tasks).where(and(eq(tasks.complete, false), gte(tasks.dueAt, now), lte(tasks.dueAt, day)));
  for (const task of dueTasks) {
    if (!task.assigneeUserId) continue;
    await deliverNotification({ userId: task.assigneeUserId, eventId: task.eventId, type: 'task_due', title: 'Task due soon', body: task.title, data: { eventId: task.eventId, taskId: task.id }, email: true });
    delivered += 1;
  }

  const nearEvents = await database.select({ id: events.id }).from(events).where(and(gte(events.startsAt, now), lte(events.startsAt, twoWeeks)));
  const nearEventIds = nearEvents.map((event) => event.id);
  if (nearEventIds.length) {
    const pending = await database.select().from(households).where(and(inArray(households.eventId, nearEventIds), or(eq(households.rsvp, 'pending'), eq(households.rsvp, 'maybe'))));
    for (const household of pending) {
      if (!household.managerUserId) continue;
      await deliverNotification({ userId: household.managerUserId, eventId: household.eventId, type: 'rsvp_reminder', title: 'Please finalize your household RSVP', body: `${household.name} still needs a final response.`, data: { eventId: household.eventId, householdId: household.id }, email: true });
      delivered += 1;
    }
  }

  return { ok: true, delivered, checkedAt: now.toISOString() };
}
