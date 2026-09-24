import { describe, expect, it } from 'vitest';
import { epaWinPercent, epaWinProbability } from './winProbability';

describe('epaWinProbability', () => {
  it('is a coin flip for equal EPA', () => {
    expect(epaWinProbability(50, 50)).toBeCloseTo(0.5);
  });

  it('is symmetric between the two sides', () => {
    expect(epaWinProbability(60, 40) + epaWinProbability(40, 60)).toBeCloseTo(1);
  });

  it('makes a 26-point favourite a 10-to-1 shot (~91%)', () => {
    expect(epaWinProbability(76, 50)).toBeCloseTo(10 / 11, 5);
  });
});

describe('epaWinPercent', () => {
  it('rounds to whole percent and never claims certainty', () => {
    expect(epaWinPercent(50, 50)).toBe(50);
    expect(epaWinPercent(300, 0)).toBe(96);
    expect(epaWinPercent(0, 300)).toBe(4);
  });
});
