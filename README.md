# Brianna Dickenson — Mobile Application Developer

> Complete mobile app solutions for small businesses, entrepreneurs, and custom product ideas.

**Portfolio status:** Foundation / projects in development

This repository is the source for my freelance-first Mobile Application Developer portfolio. The portfolio is designed to demonstrate complete app delivery: product thinking, UI/UX, implementation, authentication, databases, notifications, payments and booking where appropriate, testing, and deployment.

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
**Status:** In Development

**Client scenario:** A solo mobile nail technician needs a branded booking and client-management system that replaces scheduling through DMs, manually checking travel feasibility, and disconnected payment tools.

Glossed Tip is designed around a mobile service model. Customers can browse nail sets and services, use **Book This Set**, enter a service address, see only travel-feasible appointment times, upload inspiration photos, pay a 25% deposit, receive reminders, reschedule within policy, join a waitlist, and rebook previous services.

The technician receives a dedicated responsive web admin dashboard for daily route-aware scheduling, appointments, clients, services, portfolio content, availability, waitlist management, analytics, and business settings.

**Technical focus:** Native Android • Kotlin • Jetpack Compose • Firebase • Stripe test mode • maps/routing • push notifications

**Portfolio proof:** Native mobile development, location-aware booking logic, payments, media uploads, authentication, notifications, route-aware scheduling, and a complete customer + business-management system.

### 02 — AllTogether

**Family event planning platform**  
**Status:** Planned

**Client scenario:** A family organizer wants one private place to coordinate reunions, birthdays, vacations, holidays, and other multi-generational family events instead of relying on group texts, spreadsheets, and scattered apps.

AllTogether is event-centered rather than feed-centered. Planned features include event creation, household-based RSVPs, schedules, polls, responsibilities, shared expenses, invitations, family roles, chat, photos, reminders, and simple multi-generational UX.

**Signature feature:** Household RSVP — one family member can manage attendance for their household without requiring every attendee to create an account.

**Technical focus:** iOS + Android • React Native • TypeScript • custom API/backend • PostgreSQL

**Portfolio proof:** Cross-platform development, custom backend architecture, database design, authorization, real-time collaboration, accessibility, and complex multi-user product design.

### 03 — Bite Route

**Food truck ordering, location & loyalty app**  
**Status:** Planned

**Client scenario:** A food truck owner wants a branded mobile experience that helps customers find the truck, browse the current menu, order ahead, pay, track pickup status, and return through a loyalty program.

Customers will be able to see current/upcoming truck locations, browse available menu items, customize orders, place order-ahead purchases using sandbox payments, receive order-status notifications, and participate in loyalty/rewards. A responsive web admin dashboard will support menus, sold-out states, item availability, incoming orders, pickup wait times, truck locations, promotions, loyalty, and pausing online ordering.

**Signature feature:** Find the Truck — current location, operating status, today's hours, estimated pickup time, and next scheduled stop are immediately visible.

**Technical focus:** iOS + Android • Flutter • backend services selected during architecture phase • Stripe test mode • maps/location

**Portfolio proof:** Flutter, mobile commerce, location/maps, order workflows, inventory/availability, payments, notifications, loyalty systems, and customer + business-management experiences.

## Skill Coverage Strategy

The three projects are intentionally different rather than variations of the same CRUD application:

- **Glossed Tip:** mobile service business + route-aware scheduling + deposits
- **AllTogether:** custom consumer product + collaboration + custom backend
- **Bite Route:** commerce + location + orders + loyalty

Across the portfolio, authentication patterns will be demonstrated where they naturally fit, including email/password, Google, Apple, phone/OTP, guest access, and device/biometric re-entry where appropriate. Authentication methods will not be artificially duplicated across every project.

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

Each completed project will document:

**Client Brief → Problem → Product Solution → UX/UI → Architecture → Implementation → Features → Testing → Deployment → Results**

Only real technical measurements and actual outcomes will be reported. No fictional business metrics, testimonials, clients, or performance claims will be invented.

## Development Order

Projects will be built one at a time and made genuinely functional before moving to the next:

1. **Glossed Tip** — mobile nail technician booking system
2. **AllTogether** — family event planning platform
3. **Bite Route** — food truck ordering & loyalty app

Each application will ultimately have a usable/demo-ready build where practical while remaining inside this repository. GitHub Actions workflows are scoped per app so changes to one project can build that project independently.

## Planned Contact Options

Email • GitHub • LinkedIn • Phone • Project Inquiry Form

Phone details will be added later.
