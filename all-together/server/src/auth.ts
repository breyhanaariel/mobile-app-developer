export type EventRole = 'organizer' | 'co-organizer' | 'family-member' | 'guest';

export type SessionPrincipal = {
  userId: string;
  email: string;
  displayName: string;
};

const demoSessions: Record<string, SessionPrincipal> = {
  'demo-jordan-carter-token': {
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'jordan.carter@example.com',
    displayName: 'Jordan Carter',
  },
};

export function principalFromAuthorization(authorization: string | undefined): SessionPrincipal | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return demoSessions[token] ?? null;
}

export function roleCanManageEvent(role: EventRole): boolean {
  return role === 'organizer' || role === 'co-organizer';
}
