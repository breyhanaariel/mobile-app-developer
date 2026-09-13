# AllTogether External-Service Setup

The repository is intentionally safe to clone publicly. Real provider credentials are never committed.

## 1. Neon

A Neon PostgreSQL project named `all-together` has already been created and seeded for the portfolio demo. Put its connection string in `all-together/server/.env` as `DATABASE_URL`. Do not copy the real value into GitHub.

## 2. Clerk

Create a Clerk application for AllTogether and enable:

- Email/password
- Google
- Apple

Set the native/deep-link redirect configuration for the `alltogether://` scheme and bundle/package identifier `com.breyhanaariel.alltogether`.

Mobile:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

API:

```env
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Optionally configure `CLERK_JWT_KEY` and `CLERK_AUTHORIZED_PARTIES` for stricter token verification.

## 3. Cloudinary

Create a Cloudinary account/project and set:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

The API creates server-side signed upload parameters; the API secret is never sent to the mobile app.

## 4. Google Maps

The MVP opens event/activity locations in Google Maps using universal URLs, so basic map handoff works without exposing a Maps SDK key. If richer embedded previews are enabled, create restricted Android/iOS keys and a separate server key.

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
GOOGLE_MAPS_API_KEY=...
```

Restrict mobile keys to the package/bundle and server keys to the intended APIs.

## 5. Expo Push

Create/link an Expo/EAS project and set:

```env
EXPO_PUBLIC_EAS_PROJECT_ID=...
```

If Expo Push access-token security is enabled, set this only on the API host:

```env
EXPO_ACCESS_TOKEN=...
```

## 6. Secondary email

The API includes a secondary email notification path using the Resend HTTP API:

```env
RESEND_API_KEY=...
EMAIL_FROM=AllTogether <family@verified-domain.example>
```

SMS is intentionally excluded from the AllTogether MVP.

## 7. Vercel

Import `breyhanaariel/mobile-app-developer` into Vercel and set the project root directory to:

`all-together/server`

Set `DATABASE_URL` plus the API-only variables above in Vercel Production and Preview environments. After deployment, set the mobile variable:

```env
EXPO_PUBLIC_ALLTOGETHER_API_URL=https://<your-api-domain>
```

The connected Vercel account currently has no project imported, so the first project import/link remains an explicit account action rather than being simulated in repository code.

## 8. Apple/iOS

iOS source/configuration is ready, but signing and distribution require the user's Apple Developer credentials. Those credentials and certificates must remain outside GitHub.
