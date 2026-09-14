import { describe, expect, it } from 'vitest';
import { canManageBusiness, canManageOrders } from './auth.js';

describe('Bite Route role permissions', () => {
  it('lets owner manage orders and business settings', () => {
    expect(canManageOrders('owner')).toBe(true);
    expect(canManageBusiness('owner')).toBe(true);
  });
  it('lets staff operate orders but not owner-only business settings', () => {
    expect(canManageOrders('staff')).toBe(true);
    expect(canManageBusiness('staff')).toBe(false);
  });
  it('keeps customers out of staff operations', () => {
    expect(canManageOrders('customer')).toBe(false);
    expect(canManageBusiness('customer')).toBe(false);
  });
});
