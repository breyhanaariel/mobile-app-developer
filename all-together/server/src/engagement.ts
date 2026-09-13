import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from './db.js';
import { photos, pushTokens } from './schema.js';
import { getMembership } from './repository.js';

function requireDb() {
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

export function createCloudinaryUploadSignature(eventId: string, userId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `alltogether/${eventId}`;
  const context = `uploader_user_id=${userId}`;
  const toSign = `context=${context}&folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash('sha1').update(toSign).digest('hex');
  return { cloudName, apiKey, timestamp, folder, context, signature };
}

export async function savePhoto(input: { eventId: string; userId: string; publicId: string; secureUrl: string; caption?: string }) {
  if (!(await getMembership(input.eventId, input.userId))) return { kind: 'forbidden' as const };
  const [photo] = await requireDb().insert(photos).values({
    eventId: input.eventId,
    uploaderUserId: input.userId,
    cloudinaryPublicId: input.publicId,
    secureUrl: input.secureUrl,
    caption: input.caption,
  }).returning();
  return { kind: 'ok' as const, photo };
}

export async function registerPushToken(userId: string, token: string, platform: string) {
  const database = requireDb();
  const [existing] = await database.select().from(pushTokens).where(eq(pushTokens.token, token)).limit(1);
  if (existing) {
    await database.update(pushTokens).set({ userId, platform, updatedAt: new Date() }).where(eq(pushTokens.id, existing.id));
  } else {
    await database.insert(pushTokens).values({ userId, token, platform });
  }
  return { ok: true };
}

export async function sendExpoPush(userId: string, title: string, body: string, data: Record<string, unknown> = {}) {
  const database = requireDb();
  const tokens = await database.select().from(pushTokens).where(eq(pushTokens.userId, userId));
  if (!tokens.length) return { delivered: 0 };
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  let delivered = 0;
  for (const row of tokens) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ to: row.token, title, body, data, sound: 'default' }),
    });
    if (response.ok) delivered += 1;
  }
  return { delivered };
}

export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { sent: false, reason: 'email_credentials_missing' as const };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  return { sent: response.ok };
}
