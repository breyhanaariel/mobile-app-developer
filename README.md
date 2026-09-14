# Brianna Dickenson — Mobile Application Developer

> Complete mobile app solutions for small businesses, entrepreneurs, and custom product ideas.

**Portfolio status:** Three flagship codebases complete

This repository is the source for my freelance-first Mobile Application Developer portfolio. The portfolio demonstrates complete app delivery: product thinking, UI/UX, implementation, authentication, databases, notifications, payments and booking where appropriate, testing, and deployment.

## Positioning

I design and build complete mobile applications—not just interfaces.

The portfolio is primarily designed for freelance clients while retaining enough technical depth for employers and engineering reviewers. Each flagship project is an **Independent Concept Project based on a realistic client brief**. Concept projects are never presented as paid client work.

## Repository Structure

This portfolio uses a monorepo structure, matching my other specialty portfolios. The portfolio website lives at the repository root while each flagship app has its own project folder and README:

- `glossed-tip/` — native Android mobile nail booking system
- `all-together/` — React Native family event planning platform
- `bite-route/` — Flutter food-truck ordering and loyalty app
- `.github/workflows/` — app-specific CI/build workflows

Each app remains independently buildable inside the shared `mobile-app-developer` repository.

## Flagship Projects

### 01 — Glossed Tip

**Independent mobile nail technician booking system**  
**Status:** Demo Complete / Cloud Integration Pending

**Client scenario:** A solo mobile nail technician needs a branded booking and client-management system that replaces scheduling through DMs, manually checking travel feasibility, and disconnected payment tools.

Glossed Tip is designed around a mobile service model. Customers can browse nail sets and services, use **Book This Set**, enter a service address, see only travel-feasible appointment times, upload inspiration photos, calculate a 25% deposit, review cancellation policy, and rebook previous services. The credential-free portfolio build uses deterministic fictional Pinellas County travel zones while production integration seams are prepared for Firebase, Google Places/Routes, and Stripe.

The technician receives a dedicated responsive web admin dashboard demo for daily route-aware scheduling, appointments, clients, services, portfolio content, availability, waitlist management, analytics, and business settings.

**Technical focus:** Native Android • Kotlin • Jetpack Compose • route-aware scheduling • Firebase architecture • Stripe integration architecture • maps/routing • automated testing/CI

**Portfolio proof:** Native mobile development, location-aware booking logic, payment-state design, media uploads, authentication architecture, route-aware scheduling, business rules, testing, and a complete customer + business-management product concept.

### 02 — AllTogether

**Family event planning platform**  
**Status:** Code Complete / Live Neon Persistence / External Provider Setup Pending

**Client scenario:** A family organizer wants one private place to coordinate reunions, birthdays, vacations, holidays, and other multi-generational family events instead of relying on group texts, spreadsheets, and scattered apps.

AllTogether is event-centered rather than feed-centered. The completed codebase includes private event creation, public invite preview and authenticated join-by-code, multiple events, household and individual attendance RSVPs, activity RSVPs, polls, tasks, shared expense tracking/settlement, an event-wide moderated chat, a shared Cloudinary-ready photo album, push/email reminder delivery code, Google Maps preview/handoff, and accessible multi-generational UX.

**Signature feature:** Household RSVP — one family member can manage attendance for an entire household, including children and guests who do not need accounts.

The backend uses a real seeded Neon PostgreSQL database with a Fastify/Drizzle API. Clerk email/Google/Apple auth, Cloudinary media, Expo Push, Resend email, optional embedded Google Maps, and a secured Vercel cron reminder workflow are fully wired in code. Their actual provider credentials plus the first Vercel project import remain account-level configuration outside GitHub.

**Technical focus:** iOS + Android • Expo/React Native • TypeScript • Fastify • Neon PostgreSQL • Drizzle ORM • Clerk • Cloudinary • Expo Push • Resend • Google Maps • scheduled reminders • CI/testing

**Portfolio proof:** Cross-platform development, relational database design, role-based authorization, private invitations, multi-user collaboration, Household RSVP logic, exact-cent expense behavior, media moderation, notification delivery, accessibility, automated tests, iOS native-project validation, and Android release packaging.

### 03 — Bite Route

**Food truck ordering, location & loyalty app**  
**Status:** Code Complete / Live Neon Persistence / External Provider Setup Pending

**Client scenario:** A food truck owner wants a branded mobile experience that helps customers find the truck, browse the current menu, order ahead, pay, track pickup status, and return through a loyalty program.

Customers can see current/upcoming Tampa Bay truck locations, browse stop-aware menu availability, customize items, place ASAP or scheduled pickup orders, use guest checkout or Firebase account flows, receive order-status updates, redeem points, favorite items, reorder, and open Google Maps directions. Stripe sandbox PaymentSheet integration is wired for card payments plus Apple Pay/Google Pay configuration when credentials are supplied.

A responsive Owner/Staff dashboard supports the live order queue, status progression, menu availability, sold-out states, truck stops, pause/resume ordering, wait-time overrides, promo creation, loyalty guidance, and database-derived analytics. No fictional metrics are presented as real business performance.

**Signature feature:** Find the Truck — current/next location, ordering state, estimated pickup time, optional distance, and upcoming route are surfaced immediately.

The backend uses a real seeded Neon PostgreSQL database with Fastify + TypeScript + Drizzle. Firebase Admin identity verification, FCM notification delivery, Stripe sandbox PaymentIntent creation/confirmation, Cloudinary signing, guest-order recovery, capacity-aware pickup logic, loyalty accounting, and Owner/Staff authorization are implemented in code. Provider credentials and store signing remain outside GitHub.

**Technical focus:** iOS + Android • Flutter • Riverpod • Fastify • TypeScript • Neon PostgreSQL • Drizzle ORM • Firebase • Stripe sandbox • FCM • Cloudinary • Google Maps • Next.js • Tailwind CSS • CI/testing

**Portfolio proof:** Flutter, mobile commerce, location/maps, stop-aware availability, modifier pricing, guest/account checkout, payment-state handling, capacity-aware pickup logic, notifications, loyalty, role-based operations, responsive business tooling, automated tests, iOS/Android project generation, and Android release packaging.

**Verified release:** `bite-route-v001.apk`

## Skill Coverage Strategy

The three projects are intentionally different rather than variations of the same CRUD application:

- **Glossed Tip:** mobile service business + route-aware scheduling + deposits
- **AllTogether:** custom consumer product + collaboration + custom backend
- **Bite Route:** commerce + location + orders + loyalty

Across the portfolio, authentication patterns are demonstrated where they naturally fit, including email/password, Google, Apple, phone/OTP, guest access, and device/biometric re-entry where appropriate. Authentication methods are not artificially duplicated across every project.

## Freelance Services

The finished portfolio will offer:

- MVP Development
- Full Mobile App Development
- App Redesign & Modernization
- Feature Development
- Bug Fixes & Maintenance

Services will use starting prices/project tiers rather than rigid flat-rate pricing for complex builds.

## Portfolio Website

Planned stack:

- Next.js
- TypeScript
- Tailwind CSS
- Vercel deployment
- Light-first interface
- Modern, creative-technical visual direction
- Visual relationship to my wider portfolio family

The site will include project case studies, working demos, source-code links, architecture diagrams, development process, services, project tiers, contact information, a project inquiry form, and a placeholder resume download until the final resume is supplied.

### Project inquiry fields

The initial inquiry will stay intentionally short: app idea, desired platforms, key features, budget range, timeline, and contact details.

## Case Study Standard

Each completed project documents:

**Client Brief → Problem → Product Solution → UX/UI → Architecture → Implementation → Features → Testing → Deployment → Results**

Only real technical measurements and actual outcomes are reported. No fictional business metrics, testimonials, clients, or performance claims are invented.

## Development Order

All three flagship application codebases are now complete at their documented portfolio boundaries:

1. **Glossed Tip** — demo complete; live provider credentials/configuration pending
2. **AllTogether** — code complete; live Neon persistence; external provider/account configuration pending
3. **Bite Route** — code complete; live Neon persistence; external provider/account configuration pending

Each application remains inside this repository. GitHub Actions workflows are scoped per app so changes to one project can build that project independently.

## Planned Contact Options

Email • GitHub • LinkedIn • Phone • Project Inquiry Form

Phone details will be added later.