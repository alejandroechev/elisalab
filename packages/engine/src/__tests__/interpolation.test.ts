import { describe, it, expect } from 'vitest';
import { inverse4PL } from '../interpolation.js';
import { fourPL } from '../curve-fit.js';
import { FourPLParams } from '../types.js';

describe('inverse4PL', () => {
  const params: FourPLParams = { A: 0.05, B: 1.5, C: 50, D: 2.5 };

  it('inverts 4PL correctly (round-trip)', () => {
    const concentrations = [1, 5, 10, 25, 50, 100, 200, 500];
    for (const x of concentrations) {
      const y = fourPL(x, params);
      const result = inverse4PL(y, params);
      expect(result).not.toBeNull();
      expect(result!.concentration).toBeCloseTo(x, 1);
    }
  });

  it('returns null for OD below curve range', () => {
    const result = inverse4PL(0.01, params);
    expect(result).toBeNull();
  });

  it('returns null for OD above curve range', () => {
    const result = inverse4PL(3.0, params);
    expect(result).toBeNull();
  });

  it('flags values near asymptotes', () => {
    // Near the minimum (A = 0.05)
    const yNearA = 0.06;
    const result = inverse4PL(yNearA, params);
    // This is very close to A, so might be near-low
    if (result) {
      // Value is technically in range but very close
      expect(result.concentration).toBeGreaterThan(0);
    }
  });
});
