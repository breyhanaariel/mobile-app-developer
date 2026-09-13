import { describe, expect, it } from 'vitest';
import { outstandingBalance, splitExpenseEqually, validateCustomShares } from './expenses';

describe('expense splitting', () => {
  it('splits cents without losing money', () => {
    const shares = splitExpenseEqually(10, ['a','b','c']);
    expect(shares).toEqual([
      { personId: 'a', amount: 3.34 },
      { personId: 'b', amount: 3.33 },
      { personId: 'c', amount: 3.33 },
    ]);
    expect(shares.reduce((sum, share) => sum + share.amount, 0)).toBeCloseTo(10, 2);
  });

  it('validates custom totals', () => {
    expect(validateCustomShares(25, [{ personId: 'a', amount: 10 }, { personId: 'b', amount: 15 }])).toBe(true);
    expect(validateCustomShares(25, [{ personId: 'a', amount: 10 }, { personId: 'b', amount: 14 }])).toBe(false);
  });

  it('computes unsettled balance only', () => {
    expect(outstandingBalance([
      { personId: 'a', amount: 12.5, settled: true },
      { personId: 'b', amount: 8.25, settled: false },
    ])).toBe(8.25);
  });
});
