import { describe, expect, it } from 'vitest';
import { canTransition, estimatePickupMinutes, pointsEarned, priceOrder } from './domain.js';

describe('Bite Route order rules', () => {
  it('prices promo, loyalty, tax and tip without moving money', () => {
    expect(priceOrder({subtotalCents:2500,promoPercent:10,loyaltyPointsRedeemed:100,tipCents:300,taxRate:.07})).toEqual({subtotalCents:2500,discountCents:250,loyaltyDiscountCents:100,taxCents:151,tipCents:300,totalCents:2601});
  });
  it('earns one point per dollar',()=>expect(pointsEarned(1499)).toBe(14));
  it('enforces order state transitions',()=>{expect(canTransition('received','preparing')).toBe(true);expect(canTransition('received','ready')).toBe(false);expect(canTransition('ready','completed')).toBe(true);});
  it('expands wait time as capacity fills',()=>{expect(estimatePickupMinutes(0,8)).toBe(15);expect(estimatePickupMinutes(9,8)).toBe(45);expect(estimatePickupMinutes(99,8,25)).toBe(25);});
});
