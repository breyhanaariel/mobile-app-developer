# Bite Route

**Status:** In Active Build / Full-Stack Implementation Present  
**Type:** Independent concept project based on a realistic food-truck brief

**Tagline:** *Good food. Find the next stop.*

Bite Route is a Flutter iOS + Android food-truck ordering app paired with a responsive Owner/Staff operations dashboard. The concept uses one fictional globally inspired street-food brand operating around St. Petersburg and Tampa Bay.

## Signature feature — Find the Truck

The customer home screen prioritizes the truck's current/next location, open/closed ordering state, today's stop, estimated pickup time, optional user-to-truck distance, next scheduled stops, and Google Maps directions.

## Customer app

Implemented in `lib/` with Flutter + Riverpod:

- Find the Truck home experience
- optional device location for distance calculations
- upcoming stop schedule
- rotating stop-aware menu
- dietary labels and availability states
- modifier-ready cart model
- integer-cent price calculations
- guest checkout architecture
- Email/Google/Apple Firebase authentication service
- ASAP and scheduled pickup model
- capacity-aware pickup estimates
- Stripe sandbox payment architecture
- tips, tax, promo and loyalty calculations
- order tracking states
- points rewards
- favorites API boundary
- offline seeded portfolio fallback
- Google Maps universal-link handoff

## API

`server/` contains the Fastify + TypeScript backend:

- Neon PostgreSQL 17
- Drizzle ORM schema/config
- Firebase Admin token verification
- customer / Owner / Staff authorization
- truck stops and ordering pause/resume
- menu categories/items/modifiers
- sold-out / limited / available states
- order quote validation
- server-authoritative tax/tip/promo/loyalty totals
- pickup-capacity calculations
- Stripe PaymentIntent sandbox boundary
- order state transitions
- loyalty accrual and redemption
- favorites
- Cloudinary signed menu-media uploads
- admin analytics derived only from stored orders

A real Neon project named `bite-route` has been created and seeded with fictional Tampa Bay stops, globally inspired menu items, modifier groups, a demo customer, owner account, promo, and loyalty balance. Real database credentials are not committed.

## Admin dashboard

`admin/` is a responsive Next.js + TypeScript dashboard for Owner + Staff operations:

- live order queue
- Received → Preparing → Ready → Completed workflow
- open-order counts
- sandbox/demo gross-sales totals
- average order value
- stop ordering pause/resume
- menu operations boundary
- wait-time override architecture
- promo / loyalty operations boundary
- Cloudinary media boundary
- owner-only staff access endpoint
- seeded fallback so the portfolio UI remains reviewable before deployment

No fictional analytics are presented as actual business results. Any seeded numbers are explicitly portfolio/demo data.

## Automated tests

Flutter and server tests cover:

- modifier pricing
- cart totals
- promo discounts
- tax and tip math
- loyalty earning/redemption rules
- order state transitions
- pickup-capacity timing

CI is scoped to `bite-route/**` and validates Flutter, API, and admin code before publishing numbered Android prereleases as `bite-route-v###.apk`.

## External credentials

Production-like integrations require account-owned credentials that must stay outside GitHub:

- Firebase project configuration for Email/Google/Apple auth and push
- Stripe sandbox publishable + secret keys
- Cloudinary credentials
- optional restricted Google Maps SDK/API keys
- Neon `DATABASE_URL`
- Apple Developer credentials for signed iOS distribution
- Android release signing credentials

The customer app still supports Google Maps directions through universal URLs without embedding a Maps secret.

## Development boundary

The repository is designed so missing provider credentials degrade to explicit demo/integration-pending behavior rather than pretending production services are live.
