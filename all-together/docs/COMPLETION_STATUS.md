# AllTogether Completion Status

## Portfolio/demo completion

AllTogether's repository implementation is complete enough to demonstrate the intended product architecture and customer-facing experience on Android, with iOS source/configuration maintained in the same Expo project.

### Completed in repository

- Expo + React Native + TypeScript mobile application
- iOS + Android identifiers/configuration
- Home / Events / Create / Notifications / Profile navigation
- Overview / Schedule / People / Polls / Expenses / Photos / Chat event experience
- multi-generational accessibility requirements
- seeded offline Carter Family Reunion 2027 demo
- live Neon PostgreSQL project and seeded Carter reunion dataset
- Drizzle relational schema
- Fastify API and repository layer
- multiple family groups
- private event creation
- invite preview and authenticated acceptance
- Organizer / Co-organizer / Family Member / Guest authorization
- Household RSVP and individual household attendance data model
- schedules and optional activity RSVP model
- single/multiple polls and voting rules
- expense split/share/settlement model without money movement
- tasks
- event-wide chat
- Cloudinary signed-upload architecture
- Expo push-token architecture
- secondary email architecture
- Google Maps handoff
- Clerk integration boundary for Email/Google/Apple
- Vercel-compatible short-poll collaboration strategy
- automated domain tests
- Android GitHub Actions release pipeline
- architecture/setup/QA/case-study documentation

## External credentials / account actions still required for a live production-like demo

These are intentionally not stored in GitHub:

- Clerk application credentials and Google/Apple provider configuration
- Cloudinary credentials
- Expo/EAS project ID and optional push access token
- email provider credentials and verified sender/domain
- optional restricted Google Maps API keys for richer embedded map previews
- Apple Developer signing credentials for distributable iOS builds
- permanent Android release signing credentials

## Vercel

The API is prepared for Vercel with the project root set to `all-together/server`. The connected Vercel team was checked and currently contains no imported projects. The first project import/link therefore remains an explicit account-level deployment step rather than something the repository can truthfully mark as already deployed.

## Status label for portfolio

Until the external credentials and first Vercel project import are supplied, use:

**Demo Complete · Live Neon Persistence · External Integrations Pending**

After those credentials are configured and end-to-end device QA passes, the label can be simplified to:

**Completed · Demo Ready**
