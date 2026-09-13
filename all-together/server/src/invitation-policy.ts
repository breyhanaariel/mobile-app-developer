export type InvitationState = {
  revokedAt?: Date | null;
  expiresAt?: Date | null;
  maxUses?: number | null;
  useCount: number;
  email?: string | null;
};

export type InvitationDecision = 'ok' | 'revoked' | 'expired' | 'exhausted' | 'email_mismatch';

export function validateInvitation(state: InvitationState, userEmail: string, now = new Date()): InvitationDecision {
  if (state.revokedAt) return 'revoked';
  if (state.expiresAt && state.expiresAt <= now) return 'expired';
  if (state.maxUses != null && state.useCount >= state.maxUses) return 'exhausted';
  if (state.email && state.email.toLowerCase() !== userEmail.toLowerCase()) return 'email_mismatch';
  return 'ok';
}
