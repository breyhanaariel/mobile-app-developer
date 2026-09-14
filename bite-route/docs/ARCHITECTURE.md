# Bite Route Architecture

## Product surfaces

1. **Flutter customer app** (`bite-route/lib`) — iOS + Android
2. **Fastify API** (`bite-route/server`) — authoritative ordering/business rules
3. **Next.js admin dashboard** (`bite-route/admin`) — responsive Owner + Staff operations
4. **Neon PostgreSQL** — persistent operational data

## Customer flow

Find Truck → Select stop → Browse menu → Customize → Cart → Choose pickup → Quote → Stripe sandbox payment → Track → Pickup → Earn points.

Guest checkout stores contact data plus a device guest key so order history can be recovered without forcing account creation. Signed-in customers use Firebase Auth and can retain history, favorites and loyalty.

## Ordering invariants

The server—not Flutter—owns final validation for:

- menu availability
- modifier min/max rules
- promo validity
- loyalty balance
- subtotal/discount/tax/tip totals
- pickup capacity
- stop closing time
- state transitions

All currency math is integer cents.

## Pickup capacity

Stops have `capacity_per_15_min` and optional wait-time overrides. The API counts open Received/Preparing orders and produces the next safe ASAP pickup estimate. Scheduled pickup requests must fall inside the stop window.

## Roles

- **Customer** — orders, favorites, rewards, history
- **Staff** — queue, order status, menu availability, stop operations
- **Owner** — all Staff capabilities plus staff/business settings

Role authorization is checked by the API even if the UI hides unavailable controls.

## Authentication

Firebase Authentication is the identity provider boundary for Email/password, Google and Apple. Guest ordering does not require authentication. Firebase ID tokens are verified server-side with Firebase Admin. Provider configuration/credentials remain outside GitHub.

## Payments

Stripe is sandbox-first. The API creates PaymentIntents from server-authoritative totals. The Flutter app uses Stripe PaymentSheet when publishable/secret credentials are configured. Apple Pay / Google Pay can be enabled through Stripe's platform configuration without changing order-domain logic.

## Media

Cloudinary signed uploads support menu/product imagery. The signing secret remains API-only.

## Maps

Google Maps universal URLs provide directions without an API key. Restricted SDK/API keys can be added for richer embedded maps and server geocoding.

## Realtime strategy

The admin dashboard polls the order queue at a short interval; customer order tracking can do the same. This is deliberately compatible with serverless deployment while still providing near-real-time operational behavior. Firebase Cloud Messaging is the push-notification path for status changes and location/reward alerts.

## Portfolio integrity

All business/customer/order records are fictional demo data. Dashboard metrics are calculations over those records and are labeled as sandbox/demo results, never real client outcomes.
