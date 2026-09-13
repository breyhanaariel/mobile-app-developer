import { createClerkClient, verifyToken } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { userIdentities, users } from './schema.js';

export type EventRole = 'organizer' | 'co-organizer' | 'family-member' | 'guest';

export type SessionPrincipal = {
  userId: string;
  email: string;
  displayName: string;
};

const demoSessions: Record<string, SessionPrincipal> = {
  'demo-jordan-carter-token': {
    userId: '11111111-1111-4111-8111-111111111112',
    email: 'jordan.carter@example.com',
    displayName: 'Jordan Carter',
  },
};

async function principalFromClerkToken(token: string): Promise<SessionPrincipal | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  const jwtKey = process.env.CLERK_JWT_KEY;
  if (!secretKey && !jwtKey) return null;

  try {
    const verified = await verifyToken(token, {
      secretKey,
      jwtKey,
      authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(',').map((value) => value.trim()).filter(Boolean),
    });
    const clerkUserId = verified.sub;
    if (!clerkUserId) return null;

    if (db) {
      const [existingIdentity] = await db.select().from(userIdentities).where(eq(userIdentities.providerSubject, clerkUserId)).limit(1);
      if (existingIdentity) {
        const [existingUser] = await db.select().from(users).where(eq(users.id, existingIdentity.userId)).limit(1);
        if (existingUser) return { userId: existingUser.id, email: existingUser.email, displayName: existingUser.displayName };
      }
    }

    if (!secretKey || !publishableKey) return null;
    const clerk = createClerkClient({ secretKey, publishableKey });
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;
    const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email.split('@')[0];

    if (!db) return { userId: clerkUserId, email, displayName };
    const [user] = await db.insert(users).values({ email, displayName }).onConflictDoUpdate({ target: users.email, set: { displayName } }).returning();
    await db.insert(userIdentities).values({ userId: user.id, provider: 'email', providerSubject: clerkUserId }).onConflictDoNothing();
    return { userId: user.id, email: user.email, displayName: user.displayName };
  } catch {
    return null;
  }
}

export async function principalFromAuthorization(authorization: string | undefined): Promise<SessionPrincipal | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  if (demoSessions[token]) return demoSessions[token];
  return principalFromClerkToken(token);
}

export function roleCanManageEvent(role: EventRole): boolean {
  return role === 'organizer' || role === 'co-organizer';
}
