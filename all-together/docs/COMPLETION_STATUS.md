# AllTogether Completion Status

## Coding status

**Application coding is complete.**

All planned MVP product flows, persistence models, API endpoints, authorization rules, integration code, automated validation, and release automation are implemented in the repository. A real Neon PostgreSQL project is provisioned and seeded for the portfolio demo.

The items that remain are external provider credentials, first-time account configuration/deployment, and store signing. Those are deliberately kept outside GitHub and are not unfinished application code.

## Completed mobile implementation

- Expo + React Native + TypeScript application for iOS + Android
- Home / Events / Create / Notifications / Profile navigation
- Overview / Schedule / People / Polls / Expenses / Photos / Chat event experience
- multi-generational accessibility requirements
- live API mode plus clearly labeled seeded offline Carter Family Reunion 2027 fallback
- multiple family groups/events and event switching
- private event creation
- public invitation preview before authentication
- authenticated join-by-code/acceptance flow
- Organizer / Co-organizer / Family Member / Guest roles
- Household RSVP
- individual attendance for children/guests/household members
- optional activity RSVP
- single/multiple polls and persisted voting
- expense shares and settlement without money movement
- task completion
- event-wide chat and organizer moderation
- image picker/compression, captioning, Cloudinary upload, live album rendering, and media moderation
- Google Maps handoff plus optional embedded Static Maps preview
- Expo push-reminder permission/token registration
- live notification center
- short-poll near-real-time synchronization after writes and on an interval

## Completed backend implementation

- Fastify + TypeScript
- Drizzle ORM
- live Neon PostgreSQL database
- relational schema for users, identities, family groups, events, memberships, invitations, households, people, schedules, activity RSVPs, polls/votes, expenses/shares, tasks, chat, photos, push tokens, and notifications
- Clerk token verification and local user/identity mapping
- role-based authorization
- event list/create/read/admin access
- invitation preview/acceptance rules
- Household RSVP and person attendance
- activity RSVP
- poll voting and vote counts
- expense settlement
- task completion
- chat posting/moderation
- signed Cloudinary upload + stored media + remote delete
- Expo Push delivery
- Resend secondary email delivery
- persisted notification records
- secured reminder job for RSVP/activity/poll/task reminders
- health/readiness endpoints
- Vercel cron configuration

## Testing/release automation

CI validates:

- Expo package compatibility
- mobile TypeScript
- mobile domain tests
- server TypeScript
- server tests, including invitation and authorization behavior
- server production build
- iOS native-project generation
- Android native-project generation
- Android Gradle APK compilation
- versioned artifact packaging
- GitHub prerelease publication

A successful `all-together-v001.apk` prerelease has already been produced. Subsequent completed revisions automatically publish the next numbered prerelease after every gate succeeds.

## Live infrastructure already completed

- Neon project: created
- PostgreSQL schema: applied
- Carter Family Reunion 2027 data: seeded
- repository/API persistence code: implemented

## External account configuration still required

These items require credentials or account authorization and are intentionally not committed:

- Clerk application keys and Google/Apple provider setup
- Cloudinary account credentials
- Expo/EAS project ID and push credentials
- Resend credentials and verified email sender/domain
- optional restricted Google Maps key for embedded previews
- first Vercel project import/link and environment variables
- `CRON_SECRET` on the deployed API
- Apple Developer signing/provisioning for distributable iOS builds
- permanent Android release signing for store distribution

## Vercel boundary

The API source and `vercel.json` cron configuration are complete. The connected Vercel team currently has no imported project, and the available connector does not expose the initial project-import action. Importing `breyhanaariel/mobile-app-developer` with root `all-together/server` is therefore an account-level deployment step rather than missing code.

## Portfolio status label

Use:

**Code Complete · Live Neon Persistence · External Provider Setup Pending**

After the external provider credentials are added, the Vercel project is imported, and signed-device QA is completed, the deployment label may be simplified to:

**Completed · Demo Ready**
