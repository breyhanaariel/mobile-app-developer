# Glossed Tip Architecture

Glossed Tip is the native Android flagship project inside the `mobile-app-developer` monorepo.

## Customer flow

Guest browsing → choose service/set → authenticate when booking begins → customize → choose/save address → validate service area → calculate route-aware availability → select time → upload inspiration → review → create 10-minute slot hold → pay 25% deposit → confirm appointment.

## Production integrations

- Firebase Authentication: Google + phone/OTP
- Cloud Firestore: customers, saved addresses, services, portfolio sets, availability, bookings, holds, waitlist, business settings
- Firebase Storage: inspiration images
- Firebase Cloud Messaging: push notifications
- Google Places: address autocomplete + place resolution
- Google Routes: previous appointment → proposed appointment → next appointment travel feasibility
- Firebase Cloud Functions: trusted Stripe PaymentIntent creation, hold finalization, webhooks, notification triggers
- Stripe PaymentSheet: test-mode 25% deposits

## Booking safety

A selected appointment is not confirmed immediately. Checkout creates a 10-minute `PENDING_PAYMENT` hold. A successful Stripe webhook converts it to `CONFIRMED`; expiry or failed checkout releases the slot.

## Current local/demo behavior

The app remains buildable without credentials. The `data/integration` contracts define the production seams while the local engine supplies fictional Pinellas County zones, seeded appointments, route-like travel estimates, pricing, and availability.
