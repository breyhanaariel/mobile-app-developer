# Bite Route External Provider Setup

Real credentials never belong in GitHub.

## Neon

A real Neon PostgreSQL project named `bite-route` is already created and seeded. Set its connection string in the API environment as:

```env
DATABASE_URL=postgresql://...
```

## Firebase Authentication + Push

Create a Firebase project and enable:

- Email/password
- Google
- Apple

Register Android package and iOS bundle IDs generated under the `com.breyhanaariel` namespace. Add native Firebase configuration files only through secure local/build-secret handling; do not commit private service-account credentials.

API:

```env
FIREBASE_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
```

The Flutter app uses `firebase_auth`, `google_sign_in`, `sign_in_with_apple`, and `firebase_messaging`.

## Stripe sandbox

Mobile build/runtime:

```text
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

API:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Only test/sandbox credentials should be used for the portfolio demo. The API owns prices and PaymentIntent amounts.

## Cloudinary

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

The API creates signed upload parameters; the secret never goes to the customer/admin browser.

## Google Maps

Basic directions work with universal Google Maps URLs and no embedded secret. For richer embedded maps/geocoding:

```env
GOOGLE_MAPS_API_KEY=...
```

Create separate restricted Android, iOS and server keys.

## API deployment

Recommended Vercel project root:

`bite-route/server`

Set all API-only environment variables above. Then build the Flutter app with its API URL supplied through `--dart-define=BITE_ROUTE_API_URL=https://...`.

## Admin deployment

Recommended second Vercel project root:

`bite-route/admin`

Set:

```env
NEXT_PUBLIC_BITE_ROUTE_API_URL=https://your-api-domain
```

## Store signing

Apple Developer credentials/certificates and permanent Android keystore credentials remain outside GitHub. CI publishes a tested debug portfolio APK; signed store releases require those account-owned credentials.
