# AllTogether External-Service Setup

The AllTogether codebase is complete and intentionally safe to clone publicly. Real provider credentials are never committed.

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

Optionally configure `CLERK_JWT_KEY` and `CLERK_AUTHORIZED_PARTIES` for stricter token verification. Without these credentials, the app deliberately uses the labeled demo-auth boundary rather than pretending live social authentication is active.

## 3. Cloudinary

Create a Cloudinary account/project and set:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

The API generates signed upload parameters. The mobile app uploads the selected/compressed image directly to Cloudinary, records the resulting secure URL in Neon, and supports organizer/uploader removal. The API secret is never sent to the mobile app.

## 4. Google Maps

AllTogether always supports Google Maps universal-link handoff. A restricted mobile key adds an embedded Static Maps preview:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

A separate server key can be configured for future server-side Maps calls:

```env
GOOGLE_MAPS_API_KEY=...
```

Restrict mobile keys to the Android package/iOS bundle and to the required Maps APIs.

## 5. Expo Push

Create/link an Expo/EAS project and set:

```env
EXPO_PUBLIC_EAS_PROJECT_ID=...
```

If Expo Push access-token security is enabled, set this only on the API host:

```env
EXPO_ACCESS_TOKEN=...
```

The Profile screen registers the device token with the API after permission is granted.

## 6. Secondary email

The reminder delivery service uses push first and can also send secondary email through the Resend HTTP API:

```env
RESEND_API_KEY=...
EMAIL_FROM=AllTogether <family@verified-domain.example>
```

SMS is intentionally excluded from the AllTogether MVP.

## 7. Scheduled reminders

Set a long random secret on the API host:

```env
CRON_SECRET=...
```

`server/vercel.json` schedules a daily request to `/v1/jobs/reminders`. Vercel sends `Authorization: Bearer <CRON_SECRET>` to the secured route. The reminder sweep covers upcoming activities, closing polls, due tasks, and households that still need a final RSVP near the event date.

## 8. Vercel

Import `breyhanaariel/mobile-app-developer` into Vercel and set the project root directory to:

`all-together/server`

Set `DATABASE_URL`, `CRON_SECRET`, and the API-only provider variables above in Vercel Production/Preview environments. After deployment, set the mobile variable:

```env
EXPO_PUBLIC_ALLTOGETHER_API_URL=https://<your-api-domain>
```

The connected Vercel team was checked and currently has no imported project. The first GitHub import/link is therefore an account-level deployment action; the repository already contains the Fastify app and Vercel cron configuration it needs.

## 9. Apple/iOS

The CI pipeline validates that Expo can generate the native iOS project. A signed/distributable iOS build still requires Apple Developer credentials, provisioning, and certificates. Those must remain outside GitHub.
