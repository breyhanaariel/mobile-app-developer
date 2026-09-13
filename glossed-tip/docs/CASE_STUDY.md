# Glossed Tip — Case Study

## Client brief

Glossed Tip is an independent concept project for Maya Brooks, a fictional solo mobile nail technician. The business needs a branded system that replaces booking through social DMs, manual travel checks, separate inspiration-photo messages, and disconnected deposits.

## Problem

A mobile technician cannot treat availability like a fixed salon calendar. Every appointment depends on service duration, setup/cleanup time, customer location, travel from the previous client, and travel to the next client. Deposits and late cancellation policy also need to be enforced consistently.

## Product solution

A native Android customer app plus a responsive technician dashboard. Customers can browse work, use Book This Set, customize service details, validate a Pinellas County service address, see route-feasible times, attach inspiration, review pricing, place a 25% deposit, and manage appointments. The technician receives operational views for route-aware scheduling, clients, services, portfolio content, availability, waitlist, analytics, and settings.

## Signature feature — Book This Set

Portfolio designs carry service, length, shape, and art-level metadata into the booking flow. Customers can then modify the preconfigured appointment before selecting a location and time.

## Booking logic

Availability evaluates:

`previous appointment → travel → setup/service/cleanup → travel → next appointment`

The credential-free demo uses deterministic Pinellas travel-zone estimates. The production seam is designed for Google Places and Google Routes.

## Payments

The demo calculates a 25% non-refundable deposit and creates a 10-minute `PENDING_PAYMENT` hold. The production architecture uses Firebase Cloud Functions and Stripe PaymentSheet so a booking becomes `CONFIRMED` only after trusted payment confirmation.

## Technology

- Kotlin + Jetpack Compose
- MVVM-style booking state
- GitHub Actions build/test/release pipeline
- Firebase integration contracts and security-rule scaffolding
- Google Places/Routes integration seam
- Stripe integration seam
- Responsive technician dashboard demo

## Testing

Unit tests cover pricing, deposit math, service-area validation, workday availability boundaries, cancellation policy, and waitlist compatibility. GitHub Actions runs unit tests before producing a debug APK prerelease.

## Portfolio integrity

Maya Brooks, customers, appointments, analytics, and business outcomes are fictional demo data. No paid-client relationship or invented business-performance metrics are claimed.
