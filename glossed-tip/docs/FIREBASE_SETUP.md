# Firebase / Google / Stripe Setup Checklist

Do not create or commit secrets yet. The app intentionally compiles without them.

When integration begins:

1. Create Firebase project: `glossed-tip`.
2. Add Android app: `com.breyhanaariel.glossedtip`.
3. Download `google-services.json` and keep production configuration out of public commits when appropriate.
4. Enable Firebase Authentication providers: Google and Phone.
5. Create Firestore and Firebase Storage.
6. Enable Firebase Cloud Messaging.
7. In Google Cloud, enable Places API and Routes API with billing configured and API-key restrictions.
8. Create Stripe test-mode keys.
9. Store server secrets in Firebase/Google secret management; never in Android source or GitHub.
10. Add Cloud Functions for appointment holds, PaymentIntent creation, Stripe webhooks, and booking finalization.

## Planned Firestore collections

- `customers/{customerId}`
- `customers/{customerId}/addresses/{addressId}`
- `services/{serviceId}`
- `portfolioSets/{setId}`
- `appointments/{appointmentId}`
- `appointmentHolds/{holdId}`
- `waitlist/{entryId}`
- `availability/{availabilityId}`
- `businessConfig/glossedTip`

All allergy/sensitivity fields are customer-provided notes only and are not medical advice.
