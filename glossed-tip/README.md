# Glossed Tip

**Status:** In Development  
**Type:** Independent concept project based on a realistic fictional client brief

A location-aware Android booking and business-management system for **Maya Brooks**, a fictional independent mobile nail technician operating Glossed Tip Nail Studio.

## Current implementation

- Kotlin + Jetpack Compose customer app
- Services + portfolio browsing
- Book This Set foundation
- Multi-step booking flow
- Pricing and duration customization
- Fictional Pinellas County travel zones
- Travel-aware availability using previous → proposed → next appointment feasibility
- Inspiration image picker
- Booking summary
- 25% deposit calculation
- 10-minute `PENDING_PAYMENT` appointment hold model
- Simulated successful checkout until Stripe/Firebase credentials are added
- Production integration contracts for Firebase, Google Places/Routes, Storage and Stripe

## Production architecture target

Firebase Authentication + Firestore + Storage + FCM • Google Places + Routes • Firebase Cloud Functions • Stripe PaymentSheet.

See `docs/ARCHITECTURE.md` and `docs/FIREBASE_SETUP.md`.
