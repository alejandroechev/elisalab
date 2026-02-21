import { describe, it, expect } from 'vitest';
import { mean, sd, cv, recovery } from '../statistics.js';

describe('mean', () => {
  it('computes mean', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });
  it('returns 0 for empty', () => {
    expect(mean([])).toBe(0);
  });
});

describe('sd', () => {
  it('computes sample standard deviation', () => {
    // SD of [2, 4, 4, 4, 5, 5, 7, 9] = 2.138...
    expect(sd([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
  });
  it('returns 0 for single value', () => {
    expect(sd([5])).toBe(0);
  });
});

describe('cv', () => {
  it('computes CV%', () => {
    const vals = [10, 10.5, 9.5, 10.2, 9.8];
    const c = cv(vals);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(10);
  });
});

describe('recovery', () => {
  it('computes % recovery', () => {
    expect(recovery(95, 100)).toBeCloseTo(95);
    expect(recovery(105, 100)).toBeCloseTo(105);
  });
  it('returns 0 for zero expected', () => {
    expect(recovery(50, 0)).toBe(0);
  });
});
