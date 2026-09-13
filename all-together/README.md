# AllTogether

**Status:** In Development  
**Type:** Independent concept project based on a realistic fictional family-event brief

**Tagline:** *Family plans, all in one place.*

AllTogether is an iOS + Android family-event planning app designed for multi-generational use. It centralizes RSVPs, schedules, polls, responsibilities, shared expense tracking, photos, reminders, and one event-wide family chat.

## Signature feature — Household RSVP

One adult can manage attendance for everyone in a household, including children and guests who do not need individual accounts. A user can belong to multiple family groups and can participate in events as Organizer, Co-organizer, Family Member, or Guest.

## Current mobile demo

- Expo + React Native + TypeScript
- Warm modern visual system with terracotta, golden yellow, and cream
- Home attention dashboard
- Events, Create, Notifications, and Profile navigation
- Private-by-default events
- Multi-day schedule
- Household RSVP
- Single- and multiple-choice polls
- Shared expense tracking only (no money movement)
- Tasks and due dates
- Shared photo-album presentation
- One event-wide chat
- Optional map handoff/preview
- Multiple family groups
- Accessibility-first copy and interaction sizing
- Seeded **The Carter Family Reunion 2027** demo with multiple households, schedule items, polls, expenses, photos, tasks, and chat

## Backend architecture

`server/` contains the custom API foundation:

- Fastify + TypeScript
- PostgreSQL target hosted on Neon
- Drizzle ORM relational schema
- private invite-preview endpoint
- Household RSVP endpoint
- event/chat endpoint scaffolding
- future Socket.IO/realtime layer
- Cloudinary target for event photos
- Expo Notifications target for push reminders
- Vercel target for HTTP API deployment; realtime transport can move to a persistent host if required

## Authentication plan

Email/password + Google + Apple. Invite links may show a safe event preview before authentication, but RSVP, chat, photo uploads, polls, expenses, and task participation require authentication.

## Accessibility requirements

Large touch targets, readable default typography, high contrast, simple navigation, minimal nesting, and multi-generational usability are product requirements rather than optional polish.

## CI

`.github/workflows/build-all-together.yml` is scoped to `all-together/**` and validates the TypeScript mobile/API code before generating an Android preview build. iOS remains project-ready but automated iOS signing/building is intentionally deferred until Apple credentials exist.

No fictional usage metrics, testimonials, or paid-client claims are used in this concept project.
