import { describe, expect, it } from 'vitest';
import { principalFromAuthorization, roleCanManageEvent } from './auth.js';

describe('API authorization boundary', () => {
  it('allows only organizer roles to manage an event', () => {
    expect(roleCanManageEvent('organizer')).toBe(true);
    expect(roleCanManageEvent('co-organizer')).toBe(true);
    expect(roleCanManageEvent('family-member')).toBe(false);
    expect(roleCanManageEvent('guest')).toBe(false);
  });

  it('requires a bearer token', async () => {
    await expect(principalFromAuthorization(undefined)).resolves.toBeNull();
    await expect(principalFromAuthorization('Basic abc')).resolves.toBeNull();
  });

  it('supports the explicit credential-free portfolio demo session', async () => {
    await expect(principalFromAuthorization('Bearer demo-jordan-carter-token')).resolves.toMatchObject({
      userId: '11111111-1111-4111-8111-111111111112',
      displayName: 'Jordan Carter',
    });
  });
});
