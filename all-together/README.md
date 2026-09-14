# AllTogether

**Status:** Code Complete · Live Neon Persistence · External Provider Setup Pending  
**Type:** Independent concept project based on a realistic fictional family-event brief

**Tagline:** *Family plans, all in one place.*

AllTogether is an iOS + Android family-event planning app designed for multi-generational use. It centralizes RSVPs, schedules, polls, responsibilities, shared expense tracking, photos, reminders, and one event-wide family chat.

## Signature feature — Household RSVP

One adult can manage attendance for everyone in a household, including children and guests who do not need individual accounts. Household managers can set the overall RSVP and individual attendance for each person. A user can belong to multiple family groups/events and can participate as Organizer, Co-organizer, Family Member, or Guest.

## Completed mobile product

- Expo + React Native + TypeScript
- clean modern interface with warm scrapbook-inspired accents
- Home attention dashboard
- Home list of all events and event switching
- Events / Create / Notifications / Profile navigation
- private-by-default event creation
- public invite-code preview before sign-in
- authenticated invite acceptance / join-by-code
- multiple event memberships and switching
- multi-day schedules
- per-activity RSVP for optional activities
- Household RSVP plus individual person attendance
- single- and multiple-choice polls with persisted voting
- expense track / split / settle workflow with no money movement
- task completion workflow
- shared event album with image picker, compression, captions, Cloudinary upload, and moderation/removal
- one event-wide chat with organizer/co-organizer moderation
- Expo push-reminder opt-in/token registration
- notification center backed by persisted notification records
- Google Maps universal-link handoff
- optional Google Static Maps preview when a restricted key is configured
- accessibility-first controls, readable typography, large touch targets, and simple navigation
- seeded **The Carter Family Reunion 2027** demo
- clearly labeled seeded/offline fallback when the API is unavailable

## Completed backend

`server/` contains the persistence and collaboration API:

- Fastify + TypeScript
- Neon PostgreSQL 17
- Drizzle ORM
- Clerk bearer-token verification and database identity mapping
- Organizer / Co-organizer / Family Member / Guest authorization
- multiple family groups and event memberships
- private event creation and invitation lifecycle
- guest-safe invitation preview and authenticated acceptance
- Household RSVP and per-person attendance
- activity RSVP
- polls and vote counts
- expense shares and settlement
- tasks
- event-wide chat and moderation
- Cloudinary signed uploads, Neon media records, and remote-delete integration
- Expo push-token registration and push delivery
- persisted notifications
- Resend secondary email delivery
- secured scheduled reminder sweep for RSVP, activity, poll, and task reminders
- Vercel-compatible short-poll synchronization endpoint for near-real-time collaboration
- health and integration-readiness endpoints

A real Neon `all-together` project has been created, schema-provisioned, and seeded with the Carter reunion concept data. Database credentials are intentionally excluded from GitHub.

## Authentication

Clerk is the production auth provider for:

- Email/password
- Google
- Apple

Invite codes can show a safe event preview before authentication. RSVP, voting, chat, photos, expenses, tasks, and other participation require authentication. When Clerk credentials are absent, the portfolio build uses an explicitly labeled demo session rather than pretending live provider authentication is active.

## Realtime collaboration

AllTogether refreshes collaborative state on a short polling interval and immediately after writes. This provides a Vercel-compatible near-real-time experience without falsely claiming a persistent WebSocket connection in the selected hosting model.

## Reminder delivery

The API includes a secured scheduled reminder job. With provider credentials configured it records the notification, sends Expo Push, and can send secondary email for:

- household RSVP reminders
- activities starting within 24 hours
- polls closing within 24 hours
- assigned tasks due within 24 hours

`server/vercel.json` contains the daily cron schedule. `CRON_SECRET` protects the job endpoint.

## Tests and CI

Automated tests cover role/access behavior, Household RSVP permissions, invitation policy, API authorization, poll behavior, exact-cent expense splitting, custom-share validation, and outstanding balances.

`.github/workflows/build-all-together.yml` is scoped to AllTogether changes and performs:

1. Expo dependency validation
2. mobile TypeScript validation
3. mobile unit tests
4. API TypeScript validation
5. API tests
6. API build
7. iOS native-project generation validation
8. Expo Android prebuild
9. native Android APK compilation
10. numbered `all-together-v###` artifact packaging
11. GitHub prerelease publishing after all gates pass

A distributable iOS archive still requires Apple signing credentials; those are account configuration, not application coding.

## External setup still required

See:

- `docs/ARCHITECTURE.md`
- `docs/CREDENTIALS_SETUP.md`
- `docs/QA_CHECKLIST.md`
- `docs/CASE_STUDY.md`
- `docs/COMPLETION_STATUS.md`

The application code is complete. The remaining work is account-owned configuration: Clerk provider credentials, Cloudinary credentials, Expo/EAS project credentials, email sender credentials, optional Maps preview key, first Vercel project import/environment variables, and store signing credentials. No secret values belong in this repository.

No fictional usage metrics, testimonials, or paid-client claims are used in this concept project.
