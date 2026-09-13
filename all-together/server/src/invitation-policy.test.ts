import { describe, expect, it } from 'vitest';
import { validateInvitation } from './invitation-policy.js';

describe('invitation policy', () => {
  const now = new Date('2027-01-01T12:00:00Z');

  it('accepts an active reusable invitation', () => {
    expect(validateInvitation({ useCount: 1, maxUses: 10 }, 'family@example.com', now)).toBe('ok');
  });

  it('rejects expired and revoked invitations', () => {
    expect(validateInvitation({ useCount: 0, expiresAt: new Date('2026-12-31T12:00:00Z') }, 'family@example.com', now)).toBe('expired');
    expect(validateInvitation({ useCount: 0, revokedAt: new Date('2026-12-30T12:00:00Z') }, 'family@example.com', now)).toBe('revoked');
  });

  it('rejects exhausted and email-restricted invitations', () => {
    expect(validateInvitation({ useCount: 2, maxUses: 2 }, 'family@example.com', now)).toBe('exhausted');
    expect(validateInvitation({ useCount: 0, email: 'specific@example.com' }, 'other@example.com', now)).toBe('email_mismatch');
  });
});
