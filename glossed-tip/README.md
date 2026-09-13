# Glossed Tip

**Status:** Demo Complete / Cloud Integration Pending  
**Type:** Independent concept project based on a realistic fictional client brief

A location-aware Android booking and business-management system for **Maya Brooks**, a fictional independent mobile nail technician operating Glossed Tip Nail Studio.

## Customer experience

- Kotlin + Jetpack Compose Android app
- Guest browsing
- Nail-set gallery with category filters
- **Book This Set** preconfiguration
- Gel-X, acrylic, fills, structured manicure, manicure, removal, repairs, and nail-art customization
- Length, shape, and Simple / Detailed / Freestyle art pricing
- Multiple-address production model with fictional Pinellas County service zones
- Previous → proposed → next appointment travel-feasibility logic
- Inspiration image picker and client notes
- 25% deposit calculation
- 10-minute `PENDING_PAYMENT` appointment hold model
- Confirmation flow
- Demo customer profile, saved addresses, favorites, appointment history, and Book Again
- 24-hour cancellation/deposit policy logic
- Waitlist compatibility logic

## Technician experience

`admin-dashboard/` contains a responsive technician dashboard demo with:

**Today • Calendar • Appointments • Clients • Services • Portfolio • Availability • Waitlist • Analytics • Settings**

The Today view emphasizes the mobile workday: travel, setup, service, cleanup, and the next client location.

## Production integration seams

The repository is intentionally safe to build without credentials. Interfaces and configuration scaffolding are prepared for:

- Firebase Authentication — Google + Phone/OTP
- Cloud Firestore — customers, addresses, appointments, holds, services, portfolio, availability, waitlist, settings
- Firebase Storage — inspiration images and portfolio media
- Firebase Cloud Messaging — push notifications
- Google Places — address autocomplete/resolution
- Google Routes — real drive-time feasibility
- Firebase Cloud Functions — trusted holds, Stripe PaymentIntents/webhooks, reminders, waitlist notifications
- Stripe PaymentSheet — test-mode 25% deposits

## Testing and CI

Unit tests cover pricing, deposit math, service-area validation, workday slot boundaries, cancellation policy, and waitlist matching. `.github/workflows/build-glossed-tip.yml` runs tests, builds a debug APK, uploads the artifact, and publishes numbered prereleases such as `glossed-tip-v001.apk`.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/FIREBASE_SETUP.md`
- `docs/CASE_STUDY.md`
- `docs/COMPLETION_STATUS.md`
- `firebase/` security rules, indexes, and deployment configuration scaffold

## Important boundary

Glossed Tip is demo-complete without external credentials. Live authentication, persistent Firestore data, Google Places/Routes, push/SMS/email delivery, Firebase Storage uploads, and Stripe payments require the account/project setup listed in `docs/COMPLETION_STATUS.md`.

All customers, appointments, analytics, and business details shown in the demo are fictional portfolio data.
