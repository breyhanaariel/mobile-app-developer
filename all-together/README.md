# AllTogether

**Status:** Demo Complete · Live Neon Persistence · External Integrations Pending  
**Type:** Independent concept project based on a realistic fictional family-event brief

**Tagline:** *Family plans, all in one place.*

AllTogether is an iOS + Android family-event planning app designed for multi-generational use. It centralizes RSVPs, schedules, polls, responsibilities, shared expense tracking, photos, reminders, and one event-wide family chat.

## Signature feature — Household RSVP

One adult can manage attendance for everyone in a household, including children and guests who do not need individual accounts. A user can belong to multiple family groups and can participate as Organizer, Co-organizer, Family Member, or Guest.

## Product implementation

- Expo + React Native + TypeScript
- clean modern interface with warm scrapbook-inspired accents
- Home attention dashboard
- Events / Create / Notifications / Profile navigation
- private-by-default event creation
- invite link/code architecture with safe guest preview
- multi-day schedules and optional activity RSVP model
- Household RSVP with individual household people
- single- and multiple-choice polls
- expense track/split/settle workflow with no money movement
- tasks and due dates
- shared event album architecture
- one event-wide chat
- Google Maps handoff and map preview treatment
- multiple family groups
- accessibility-first controls and navigation
- seeded **The Carter Family Reunion 2027** demo
- seeded offline fallback when the API is unavailable

## Backend

`server/` contains a real persistence/API implementation:

- Fastify + TypeScript
- Neon PostgreSQL 17
- Drizzle ORM
- Clerk token verification boundary
- role-based event authorization
- invitation acceptance
- Household RSVP
- polls/votes
- expense shares/settlement
- tasks
- chat
- notification records
- Cloudinary signed-upload support
- Expo push-token support
- secondary email integration seam

A real Neon `all-together` project has been created and seeded with the Carter reunion concept data. Database credentials are intentionally excluded from GitHub.

## Authentication

Clerk is the production auth provider for:

- Email/password
- Google
- Apple

Invite links may show a safe event preview before authentication. RSVP, voting, chat, photos, expenses, tasks, and other participation require authentication. Without Clerk credentials, the portfolio app uses an explicitly labeled demo session rather than pretending production auth is active.

## Collaboration

AllTogether refreshes collaborative state on a short polling interval and immediately after writes. This provides Vercel-compatible near-real-time behavior without claiming a persistent WebSocket connection in the selected hosting model.

## Tests and CI

Automated tests cover role/access behavior, Household RSVP permissions, poll behavior, exact-cent expense splitting, custom-share validation, and outstanding balances.

`.github/workflows/build-all-together.yml` is scoped to AllTogether changes and performs:

1. Expo dependency validation
2. mobile TypeScript validation
3. mobile unit tests
4. API TypeScript validation
5. API tests/build
6. Expo Android prebuild
7. native Android APK build
8. numbered `all-together-v###` artifact packaging
9. GitHub prerelease publishing after all gates pass

The iOS project remains source-ready, while signing/distribution requires Apple credentials.

## External setup

See:

- `docs/ARCHITECTURE.md`
- `docs/CREDENTIALS_SETUP.md`
- `docs/QA_CHECKLIST.md`
- `docs/CASE_STUDY.md`
- `docs/COMPLETION_STATUS.md`

Clerk, Cloudinary, Expo/EAS push, email, optional embedded Google Maps keys, Vercel project import, and store signing credentials remain account-level setup. No secret values belong in this repository.

No fictional usage metrics, testimonials, or paid-client claims are used in this concept project.
