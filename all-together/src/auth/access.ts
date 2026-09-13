export type EventRole = 'organizer' | 'co-organizer' | 'family-member' | 'guest';

export type EventCapability =
  | 'view-event'
  | 'manage-event'
  | 'manage-people'
  | 'manage-content'
  | 'rsvp'
  | 'vote'
  | 'track-expenses'
  | 'upload-photos'
  | 'chat';

const capabilities: Record<EventRole, ReadonlySet<EventCapability>> = {
  organizer: new Set([
    'view-event', 'manage-event', 'manage-people', 'manage-content', 'rsvp', 'vote',
    'track-expenses', 'upload-photos', 'chat',
  ]),
  'co-organizer': new Set([
    'view-event', 'manage-event', 'manage-people', 'manage-content', 'rsvp', 'vote',
    'track-expenses', 'upload-photos', 'chat',
  ]),
  'family-member': new Set([
    'view-event', 'rsvp', 'vote', 'track-expenses', 'upload-photos', 'chat',
  ]),
  guest: new Set(['view-event', 'rsvp', 'vote', 'upload-photos', 'chat']),
};

export function can(role: EventRole, capability: EventCapability): boolean {
  return capabilities[role].has(capability);
}

export function canManageHouseholdRsvp(role: EventRole, isHouseholdManager: boolean): boolean {
  return role === 'organizer' || role === 'co-organizer' || isHouseholdManager;
}
