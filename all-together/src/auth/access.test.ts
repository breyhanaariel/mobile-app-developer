import { describe, expect, it } from 'vitest';
import { can, canManageHouseholdRsvp } from './access';

describe('event access policy', () => {
  it('lets organizers manage the event', () => {
    expect(can('organizer', 'manage-event')).toBe(true);
    expect(can('organizer', 'manage-people')).toBe(true);
  });

  it('keeps family members out of organizer-only actions', () => {
    expect(can('family-member', 'view-event')).toBe(true);
    expect(can('family-member', 'manage-event')).toBe(false);
  });

  it('allows a household manager to submit Household RSVP', () => {
    expect(canManageHouseholdRsvp('family-member', true)).toBe(true);
    expect(canManageHouseholdRsvp('guest', false)).toBe(false);
  });
});
