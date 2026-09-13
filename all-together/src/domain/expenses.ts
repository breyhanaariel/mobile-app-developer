export type ExpenseSplitMode = 'equal' | 'selected' | 'custom';

export type ExpenseShare = {
  personId: string;
  amount: number;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function splitExpenseEqually(total: number, personIds: string[]): ExpenseShare[] {
  if (total < 0) throw new Error('total_must_be_non_negative');
  if (!personIds.length) throw new Error('at_least_one_person_required');

  const cents = Math.round(total * 100);
  const base = Math.floor(cents / personIds.length);
  const remainder = cents - base * personIds.length;

  return personIds.map((personId, index) => ({
    personId,
    amount: (base + (index < remainder ? 1 : 0)) / 100,
  }));
}

export function validateCustomShares(total: number, shares: ExpenseShare[]): boolean {
  if (!shares.length || shares.some((share) => share.amount < 0)) return false;
  return roundMoney(shares.reduce((sum, share) => sum + share.amount, 0)) === roundMoney(total);
}

export function outstandingBalance(shares: Array<ExpenseShare & { settled: boolean }>): number {
  return roundMoney(shares.filter((share) => !share.settled).reduce((sum, share) => sum + share.amount, 0));
}
