import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique(),
  phone: text('phone'),
  displayName: text('display_name').notNull(),
  authSubject: text('auth_subject').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const staffMembers = pgTable('staff_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  active: boolean('active').default(true).notNull(),
});

export const truckStops = pgTable('truck_stops', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  venue: text('venue'),
  address: text('address').notNull(),
  city: text('city').notNull(),
  latitude: numeric('latitude', { precision: 9, scale: 6 }).notNull(),
  longitude: numeric('longitude', { precision: 9, scale: 6 }).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  orderingOpensAt: timestamp('ordering_opens_at', { withTimezone: true }),
  orderingClosesAt: timestamp('ordering_closes_at', { withTimezone: true }),
  capacityPer15Min: integer('capacity_per_15_min').default(8).notNull(),
  acceptingOrders: boolean('accepting_orders').default(true).notNull(),
  waitTimeOverrideMin: integer('wait_time_override_min'),
});

export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').defaultRandom().primaryKey(), name: text('name').notNull(), sortOrder: integer('sort_order').default(0).notNull(),
});

export const menuItems = pgTable('menu_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => menuCategories.id),
  name: text('name').notNull(), description: text('description').notNull(), priceCents: integer('price_cents').notNull(),
  imageUrl: text('image_url'), status: text('status').default('available').notNull(),
  vegetarian: boolean('vegetarian').default(false).notNull(), vegan: boolean('vegan').default(false).notNull(),
  glutenFree: boolean('gluten_free').default(false).notNull(), spicy: boolean('spicy').default(false).notNull(),
  containsNuts: boolean('contains_nuts').default(false).notNull(), featured: boolean('featured').default(false).notNull(), active: boolean('active').default(true).notNull(),
});

export const stopMenuItems = pgTable('stop_menu_items', {
  stopId: uuid('stop_id').notNull().references(() => truckStops.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  available: boolean('available').default(true).notNull(),
});

export const modifierGroups = pgTable('modifier_groups', {
  id: uuid('id').defaultRandom().primaryKey(), menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), required: boolean('required').default(false).notNull(), minSelect: integer('min_select').default(0).notNull(), maxSelect: integer('max_select').default(1).notNull(),
});
export const modifierOptions = pgTable('modifier_options', {
  id: uuid('id').defaultRandom().primaryKey(), groupId: uuid('group_id').notNull().references(() => modifierGroups.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), priceDeltaCents: integer('price_delta_cents').default(0).notNull(), available: boolean('available').default(true).notNull(),
});

export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').defaultRandom().primaryKey(), code: text('code').notNull().unique(), description: text('description').notNull(), discountType: text('discount_type').notNull(), discountValue: integer('discount_value').notNull(), startsAt: timestamp('starts_at',{withTimezone:true}), endsAt: timestamp('ends_at',{withTimezone:true}), active:boolean('active').default(true).notNull(), maxUses:integer('max_uses'), useCount:integer('use_count').default(0).notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id').references(() => users.id), guestEmail: text('guest_email'), guestPhone: text('guest_phone'),
  stopId: uuid('stop_id').notNull().references(() => truckStops.id), status: text('status').default('received').notNull(), pickupMode: text('pickup_mode').notNull(), pickupAt: timestamp('pickup_at',{withTimezone:true}).notNull(),
  subtotalCents: integer('subtotal_cents').notNull(), discountCents: integer('discount_cents').default(0).notNull(), taxCents: integer('tax_cents').notNull(), tipCents: integer('tip_cents').default(0).notNull(), totalCents: integer('total_cents').notNull(), promoCode:text('promo_code'), stripePaymentIntentId:text('stripe_payment_intent_id'), paymentStatus:text('payment_status').default('pending').notNull(), loyaltyPointsEarned:integer('loyalty_points_earned').default(0).notNull(), loyaltyPointsRedeemed:integer('loyalty_points_redeemed').default(0).notNull(), customerName:text('customer_name').notNull(), createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(), updatedAt:timestamp('updated_at',{withTimezone:true}).defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(), orderId: uuid('order_id').notNull().references(() => orders.id,{onDelete:'cascade'}), menuItemId:uuid('menu_item_id').notNull().references(() => menuItems.id), itemName:text('item_name').notNull(), quantity:integer('quantity').notNull(), unitPriceCents:integer('unit_price_cents').notNull(), lineTotalCents:integer('line_total_cents').notNull(), notes:text('notes'),
});
export const orderItemModifiers = pgTable('order_item_modifiers', {
  id:uuid('id').defaultRandom().primaryKey(), orderItemId:uuid('order_item_id').notNull().references(()=>orderItems.id,{onDelete:'cascade'}), modifierOptionId:uuid('modifier_option_id').references(()=>modifierOptions.id), name:text('name').notNull(), priceDeltaCents:integer('price_delta_cents').default(0).notNull(),
});

export const loyaltyAccounts = pgTable('loyalty_accounts', { userId:uuid('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}), points:integer('points').default(0).notNull(), lifetimePoints:integer('lifetime_points').default(0).notNull(), updatedAt:timestamp('updated_at',{withTimezone:true}).defaultNow().notNull() });
export const favorites = pgTable('favorites', { userId:uuid('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}), menuItemId:uuid('menu_item_id').references(()=>menuItems.id,{onDelete:'cascade'}), stopId:uuid('stop_id').references(()=>truckStops.id,{onDelete:'cascade'}), createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull() });
export const notifications = pgTable('notifications', { id:uuid('id').defaultRandom().primaryKey(), userId:uuid('user_id').references(()=>users.id,{onDelete:'cascade'}), guestKey:text('guest_key'), title:text('title').notNull(), body:text('body').notNull(), type:text('type').notNull(), readAt:timestamp('read_at',{withTimezone:true}), createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull() });
