import { describe, expect, it } from 'vitest';
import { canVote, nextPollSelection } from './polls';

describe('poll rules', () => {
  it('replaces the choice in a single-choice poll', () => {
    expect(nextPollSelection('single', ['a'], 'b')).toEqual(['b']);
  });

  it('toggles choices in a multiple-choice poll', () => {
    expect(nextPollSelection('multiple', ['a'], 'b')).toEqual(['a','b']);
    expect(nextPollSelection('multiple', ['a','b'], 'a')).toEqual(['b']);
  });

  it('prevents voting after the deadline', () => {
    expect(canVote('2027-01-01T00:00:00Z', new Date('2027-01-02T00:00:00Z'))).toBe(false);
  });
});
