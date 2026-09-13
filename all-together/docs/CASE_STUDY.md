# AllTogether Case Study

## Client Brief

Design and build a believable family-event planning product that helps a multi-generational family coordinate reunions, birthdays, vacations, holidays, graduations, and other private events without forcing every person into a social network.

The concept client needs one place for attendance, schedules, decisions, shared costs, responsibilities, photos, reminders, and conversation.

## Problem

Family events are often coordinated across text threads, spreadsheets, payment notes, photo albums, calendar screenshots, and repeated phone calls. That creates several product problems:

- one household may contain children or guests who should not need accounts
- older and younger relatives need the same interface to remain understandable
- organizers need controls without turning the product into enterprise software
- event details change and must propagate quickly
- shared expenses must be transparent without requiring AllTogether to become a payment processor
- private family information should not behave like a public social feed

## Product Solution

AllTogether is a private iOS + Android event workspace organized around the event rather than a social feed.

Its signature feature is **Household RSVP**: one adult can manage attendance for multiple people in a household while individual account holders can still belong to multiple family groups.

Core event spaces are:

- Overview
- Schedule
- People
- Polls
- Expenses
- Photos
- Chat

The root experience adds Home attention items, Events, Create, Notifications, and Profile.

## UX/UI

The visual direction is clean modern with warm scrapbook accents rather than a literal scrapbook interface. Terracotta, golden yellow, and cream make the product friendly while readable typography, large controls, high contrast, and shallow navigation support multi-generational use.

The home screen answers a practical question first: **What needs your attention?** Pending RSVP, polls, tasks, and the next event surface before secondary content.

## Architecture

### Mobile

Expo + React Native + TypeScript provides one iOS/Android codebase.

### Authentication

Clerk is the production auth boundary for email/password, Google, and Apple. Safe invite previews can be opened before authentication, while participation requires an authenticated account.

### API

Fastify + TypeScript owns authorization and business rules. It never trusts client-side role checks by themselves.

### Data

Neon PostgreSQL + Drizzle models users, family groups, event memberships, invitations, households, schedules, polls/votes, expenses/shares, tasks, chat, photos, push tokens, and notifications.

### Collaboration

Because Vercel is the selected API host, the portfolio MVP uses short polling and immediate post-write refresh rather than claiming a persistent WebSocket connection in an unsuitable hosting model. The boundary can later move to a dedicated realtime transport.

### Media and notifications

Cloudinary signed uploads keep the API secret server-side. Expo Push is the primary notification transport; email is secondary. SMS is intentionally excluded.

## Implementation Highlights

- private-by-default event creation
- multiple family groups per account
- Organizer, Co-organizer, Family Member, and Guest roles
- expiring/revocable/limited invitations
- Household RSVP with non-account household members
- multi-day schedules and map handoff
- single/multiple choice polls
- exact-cent expense splitting logic
- selected/custom expense-share model
- settlement tracking without money movement
- assigned tasks
- one event-wide chat
- shared album architecture
- push-token registration
- seeded Carter Family Reunion 2027 in the real Neon database
- seeded offline fallback for a portable portfolio demo

## Testing

Automated tests cover access capabilities, Household RSVP permissions, poll selection/deadline behavior, equal expense splitting, custom-share validation, and outstanding balances. GitHub Actions additionally type-checks mobile/API code, builds the API, generates the Android native project, compiles the APK, and publishes numbered prereleases after successful gates.

## Deployment

The Android portfolio build is automated through GitHub Actions. iOS remains structurally ready but requires Apple signing credentials for distribution.

The Fastify server is prepared for a Vercel project rooted at `all-together/server`. The initial Vercel project import and external provider credentials remain account-level setup rather than hard-coded repository state.

## Results

This concept project demonstrates a complete mobile product architecture rather than fabricated business metrics: cross-platform UI, relational data modeling, role-based authorization, invitations, collaborative state, image upload architecture, notifications, API design, testing, CI, and deployable Android packaging.

No fictional testimonials, user counts, revenue, conversion results, or paid-client claims are used.
