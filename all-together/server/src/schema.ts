import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['organizer','co-organizer','family-member','guest']);
export const rsvpEnum = pgEnum('rsvp_status', ['yes','no','maybe','pending']);
export const pollModeEnum = pgEnum('poll_mode', ['single','multiple']);
export const splitModeEnum = pgEnum('split_mode', ['equal','selected','custom']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const familyGroups = pgTable('family_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
});

export const familyMemberships = pgTable('family_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyGroupId: uuid('family_group_id').notNull().references(() => familyGroups.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: roleEnum('role').notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyGroupId: uuid('family_group_id').notNull().references(() => familyGroups.id),
  title: text('title').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull().default(''),
  locationName: text('location_name').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  isPrivate: boolean('is_private').notNull().default(true),
  inviteCode: text('invite_code').notNull().unique(),
});

export const households = pgTable('households', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  managerUserId: uuid('manager_user_id').references(() => users.id),
  name: text('name').notNull(),
  rsvp: rsvpEnum('rsvp').notNull().default('pending'),
});

export const householdPeople = pgTable('household_people', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id),
  name: text('name').notNull(),
  linkedUserId: uuid('linked_user_id').references(() => users.id),
  ageGroup: text('age_group'),
});

export const scheduleItems = pgTable('schedule_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  title: text('title').notNull(),
  locationName: text('location_name').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  notes: text('notes'),
  optionalRsvp: boolean('optional_rsvp').notNull().default(false),
});

export const polls = pgTable('polls', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  question: text('question').notNull(),
  mode: pollModeEnum('mode').notNull(),
  closesAt: timestamp('closes_at', { withTimezone: true }),
});

export const pollOptions = pgTable('poll_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  pollId: uuid('poll_id').notNull().references(() => polls.id),
  label: text('label').notNull(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  title: text('title').notNull(),
  payerUserId: uuid('payer_user_id').references(() => users.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  splitMode: splitModeEnum('split_mode').notNull(),
  settled: boolean('settled').notNull().default(false),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  title: text('title').notNull(),
  assigneeUserId: uuid('assignee_user_id').references(() => users.id),
  dueAt: timestamp('due_at', { withTimezone: true }),
  complete: boolean('complete').notNull().default(false),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  senderUserId: uuid('sender_user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  uploaderUserId: uuid('uploader_user_id').notNull().references(() => users.id),
  cloudinaryPublicId: text('cloudinary_public_id').notNull(),
  caption: text('caption'),
});
