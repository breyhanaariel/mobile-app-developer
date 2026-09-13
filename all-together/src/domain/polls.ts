export type PollMode = 'single' | 'multiple';

export function nextPollSelection(mode: PollMode, selected: string[], optionId: string): string[] {
  if (mode === 'single') return [optionId];
  return selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId];
}

export function canVote(closesAt?: string, now = new Date()): boolean {
  if (!closesAt) return true;
  return new Date(closesAt).getTime() > now.getTime();
}
