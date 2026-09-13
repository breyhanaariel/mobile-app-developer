# AllTogether QA Checklist

## Build gates

- Expo dependency versions match SDK 57
- Mobile TypeScript passes
- Mobile unit tests pass
- API TypeScript passes
- API build passes
- Android native prebuild passes
- Android debug APK compiles
- numbered prerelease artifact is published

## Authentication and privacy

- private events are not exposed to unauthenticated participants
- invite preview reveals only safe event summary information
- participation requires authentication
- expired, revoked, exhausted, and email-restricted invitations are rejected
- Organizer / Co-organizer / Family Member / Guest capabilities are enforced server-side

## Household RSVP

- household manager can change household status
- organizer/co-organizer can assist/override
- unrelated member cannot edit another household
- individual people can carry attendance state without requiring accounts

## Events and schedules

- create event is private by default
- creator becomes Organizer
- invite code is generated
- multi-day schedule renders chronologically
- optional activity RSVP can be represented
- location handoff opens Google Maps

## Polls

- single choice permits exactly one option
- multiple choice permits toggles
- invalid option IDs are rejected
- closed polls reject voting

## Expenses

- equal splits preserve exact cents
- selected/custom shares are supported by data model
- custom totals validate against expense total
- only participant/payer/organizer can update settlement where appropriate
- no payment processing is presented as a feature

## Collaboration

- chat is event-wide for MVP
- only event members can post
- client refreshes after writes
- 12-second polling refresh provides Vercel-compatible near-real-time behavior

## Photos

- picker handles cancellation
- Cloudinary signatures are server-created
- Cloudinary secret never reaches the mobile client
- upload is associated with authenticated event member
- organizers can be extended to moderate/remove photo records

## Notifications

- permission can be requested
- Android channel can be created
- Expo push token can be registered to the user
- notification records render in-app
- secondary email path remains credential-gated
- SMS remains excluded

## Accessibility

- major tap targets are at least approximately 44–48 points
- important controls have clear text labels
- color is not the only state indicator
- content remains understandable at larger system font sizes
- navigation is shallow and consistent

## Manual device QA before production distribution

- fresh install
- sign in/sign up with each configured Clerk provider
- invite preview and acceptance
- Household RSVP
- poll vote
- expense status
- task completion
- send/receive chat
- image upload
- notification opt-in
- Google Maps handoff
- airplane/offline fallback behavior
- Android back/navigation behavior
- iOS safe-area/navigation behavior
