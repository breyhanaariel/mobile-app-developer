# Bite Route

**Status:** Code Complete / Live Neon Persistence / External Provider Setup Pending  
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
- persistent guest checkout and order recovery
- Email/Google/Apple Firebase authentication service
- ASAP and scheduled pickup model
- capacity-aware pickup estimates
- Stripe sandbox PaymentSheet architecture with Apple Pay / Google Pay configuration
- tips, tax, promo and loyalty calculations
- order tracking states and reorder flow
- points rewards
- favorites
- Firebase Cloud Messaging registration
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
- stop-specific menu availability
- order quote validation
- server-authoritative tax/tip/promo/loyalty totals
- pickup-capacity calculations
- Stripe PaymentIntent sandbox integration boundary
- guest-order recovery
- order state transitions
- payment confirmation
- loyalty accrual and redemption
- favorites
- FCM order-status notification delivery
- persisted notification history
- promo management
- Cloudinary signed menu-media uploads
- admin analytics derived only from stored orders

A real Neon project named `bite-route` has been created and seeded with fictional Tampa Bay stops, globally inspired menu items, modifier groups, realistic fictional orders, a demo customer, owner account, promo, and loyalty balance. Real database credentials are not committed.

## Admin dashboard

`admin/` is a responsive Next.js + TypeScript + Tailwind dashboard for Owner + Staff operations:

- Firebase Email/Google/Apple sign-in boundary
- server-enforced Owner / Staff permissions
- live order queue
- Received → Preparing → Ready → Completed workflow
- open-order counts
- sandbox/demo gross-sales totals
- average order value
- popular-item analytics
- stop ordering pause/resume
- wait-time override controls
- menu availability management
- promo creation
- loyalty guidance
- Cloudinary media boundary
- owner-only staff access endpoint
- seeded fallback so the portfolio UI remains reviewable before deployment

No fictional analytics are presented as actual business results. Any seeded numbers are explicitly portfolio/demo data.

## Automated verification

The final acceptance workflow passed on the completed codebase:

- iOS + Android native-project generation
- Flutter dependency resolution
- Flutter analyzer
- Flutter customer/domain tests
- Android APK build
- Fastify API dependency install
- API TypeScript check
- API tests
- API production build
- Next.js admin dependency install
- admin TypeScript check
- admin production build
- numbered APK packaging
- GitHub Actions artifact upload
- GitHub prerelease publication

The first verified prerelease is `bite-route-v001.apk`.

Flutter and server tests cover:

- modifier pricing
- cart totals
- promo discounts
- tax and tip math
- loyalty earning/redemption rules
- order state transitions
- pickup-capacity timing
- Owner / Staff role permissions

CI is scoped to `bite-route/**` and publishes numbered Android prereleases as `bite-route-v###.apk` only after the full stack passes.

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

**Coding is complete.** The remaining work is account-level provider configuration, deployment, and store signing—not unfinished application code.

The repository is designed so missing provider credentials degrade to explicit demo/integration-pending behavior rather than pretending production services are live.
