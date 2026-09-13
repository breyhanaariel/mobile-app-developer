# AllTogether Architecture

AllTogether is a cross-platform iOS + Android family-event coordination product. The portfolio build deliberately separates the client, authentication provider, HTTP API, relational data model, media storage, and notification providers so each external service can be swapped without rewriting the product layer.

## Mobile

- Expo SDK 57
- React Native + TypeScript
- iOS bundle: `com.breyhanaariel.alltogether`
- Android package: `com.breyhanaariel.alltogether`
- Clerk boundary for email/password, Google, and Apple authentication
- seeded offline/demo fallback when the API is not configured
- 12-second refresh of the event bundle for Vercel-compatible near-real-time collaboration
- Expo Image Picker for event photos
- Expo Notifications registration seam
- Google Maps universal handoff for locations

## API

`server/src/index.ts` is a Fastify + TypeScript HTTP API designed to run with the project root set to `all-together/server` on Vercel.

Authenticated participation uses bearer tokens. The API verifies Clerk tokens when credentials exist and preserves a credential-free demo token only for local/portfolio testing.

Major API responsibilities:

- private event creation and membership
- invitation preview/acceptance
- Household RSVP and individual household attendance
- event schedules
- polls/voting
- expense share settlement
- task completion
- event-wide chat
- notification records
- Expo push-token registration
- Cloudinary signed upload preparation and photo records

## Database

Production persistence is PostgreSQL 17 on Neon using Drizzle ORM.

Core relations:

`users -> identities/sessions`

`family_groups -> family_memberships -> events -> event_memberships`

`events -> invitations / households / schedule_items / polls / expenses / tasks / messages / photos / notifications`

Supporting tables provide household people, activity RSVPs, poll options/votes, expense shares, and push tokens.

The seeded portfolio event is **The Carter Family Reunion 2027**. All people and event details are fictional concept data.

## Authorization

Roles:

- Organizer
- Co-organizer
- Family Member
- Guest

Organizer/co-organizer can manage event content and people. Family members can participate. Guests have deliberately narrower permissions. Household managers may update their own Household RSVP even when they are not organizers.

## Realtime strategy

Vercel is the selected HTTP host, so the portfolio MVP uses short polling rather than pretending a permanently connected WebSocket is available in the same deployment model. The client refreshes the event bundle every 12 seconds and immediately refreshes after writes. The data/API boundary can later be connected to a persistent realtime transport without changing the core domain model.

## Integrations

- Clerk: authentication
- Neon: PostgreSQL
- Cloudinary: image storage
- Google Maps: location handoff/preview
- Expo Push: push reminders
- Resend-compatible API: secondary email notification path

All secrets stay in environment variables and never belong in the repository.
