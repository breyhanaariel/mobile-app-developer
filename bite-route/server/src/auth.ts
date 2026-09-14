import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { and, eq } from 'drizzle-orm';
import { db } from './db.js';
import { staffMembers, users } from './schema.js';

export type Principal = { userId: string; email?: string; role: 'customer'|'owner'|'staff' };

const demoTokens: Record<string, Principal> = {
  'demo-customer-token': { userId: '11111111-1111-4111-8111-111111111111', email: 'maya@biteroute.demo', role: 'customer' },
  'demo-owner-token': { userId: '22222222-2222-4222-8222-222222222222', email: 'owner@biteroute.demo', role: 'owner' },
};

async function ensureFirebase() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return;
  initializeApp({ projectId, credential: process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : undefined });
}

export async function principalFromAuthorization(header?: string): Promise<Principal | null> {
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (demoTokens[token]) return demoTokens[token];
  if (!process.env.FIREBASE_PROJECT_ID || !db) return null;
  try {
    await ensureFirebase();
    const decoded = await getAuth().verifyIdToken(token);
    const email = decoded.email;
    const [existing] = await db.select().from(users).where(eq(users.authSubject, decoded.uid)).limit(1);
    let user = existing;
    if (!user) {
      const [created] = await db.insert(users).values({ authSubject: decoded.uid, email, displayName: decoded.name ?? email?.split('@')[0] ?? 'Bite Route Customer' }).returning();
      user = created;
    }
    const [staff] = await db.select().from(staffMembers).where(and(eq(staffMembers.userId, user.id), eq(staffMembers.active, true))).limit(1);
    return { userId: user.id, email: user.email ?? undefined, role: staff?.role === 'owner' ? 'owner' : staff?.role === 'staff' ? 'staff' : 'customer' };
  } catch { return null; }
}

export function canManageOrders(role: Principal['role']) { return role === 'owner' || role === 'staff'; }
export function canManageBusiness(role: Principal['role']) { return role === 'owner'; }
