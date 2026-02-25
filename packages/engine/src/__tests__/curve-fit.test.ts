import { describe, it, expect } from 'vitest';
import { fit4PL, fourPL, fivePL, fit5PL } from '../curve-fit.js';
import { FourPLParams, FivePLParams } from '../types.js';

describe('fourPL', () => {
  it('evaluates 4PL model correctly', () => {
    const p: FourPLParams = { A: 0.05, B: 1.5, C: 50, D: 2.5 };
    // At x = C (EC50), y should be midpoint = (A + D) / 2
    const midpoint = (p.A + p.D) / 2;
    expect(fourPL(p.C, p)).toBeCloseTo(midpoint, 2);
    // At x = 0, y ≈ A
    expect(fourPL(0, p)).toBeCloseTo(p.A);
    // At very large x, y → D
    expect(fourPL(1e6, p)).toBeCloseTo(p.D, 1);
  });
});

describe('fit4PL', () => {
  it('recovers known 4PL parameters', () => {
    const trueParams: FourPLParams = { A: 0.05, B: 1.2, C: 50, D: 2.5 };
    const concentrations = [0.1, 0.5, 1, 5, 10, 25, 50, 100, 200, 500, 1000];
    const points = concentrations.map(x => ({
      x,
      y: fourPL(x, trueParams),
    }));

    const result = fit4PL(points);
    expect(result.rSquared).toBeGreaterThan(0.99);
    expect(result.params.A).toBeCloseTo(trueParams.A, 0);
    expect(result.params.B).toBeCloseTo(trueParams.B, 0);
    expect(result.params.C).toBeCloseTo(trueParams.C, -1);
    expect(result.params.D).toBeCloseTo(trueParams.D, 0);
  });

  it('fits noisy data with good R²', () => {
    const trueParams: FourPLParams = { A: 0.1, B: 1.0, C: 100, D: 3.0 };
    const concentrations = [1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
    // Add small noise
    const points = concentrations.map(x => ({
      x,
      y: fourPL(x, trueParams) + (Math.sin(x) * 0.02),
    }));

    const result = fit4PL(points);
    expect(result.rSquared).toBeGreaterThan(0.99);
  });

  it('throws on too few points', () => {
    expect(() => fit4PL([{ x: 1, y: 1 }, { x: 2, y: 2 }])).toThrow('at least 4');
  });
});

describe('fivePL', () => {
  it('evaluates 5PL model correctly', () => {
    const p: FivePLParams = { A: 0.05, B: 1.5, C: 50, D: 2.5, S: 1.0 };
    // With S=1, should match 4PL
    const fourP = { A: p.A, B: p.B, C: p.C, D: p.D };
    expect(fivePL(p.C, p)).toBeCloseTo(fourPL(p.C, fourP), 6);
    expect(fivePL(0, p)).toBeCloseTo(p.A);
    expect(fivePL(1e6, p)).toBeCloseTo(p.D, 1);
  });

  it('S parameter creates asymmetry', () => {
    const symmetric: FivePLParams = { A: 0.05, B: 1.5, C: 50, D: 2.5, S: 1.0 };
    const asymmetric: FivePLParams = { A: 0.05, B: 1.5, C: 50, D: 2.5, S: 0.5 };
    // At EC50, asymmetric should differ from symmetric
    expect(fivePL(50, asymmetric)).not.toBeCloseTo(fivePL(50, symmetric), 2);
    // Both should still approach A at x=0 and D at large x
    expect(fivePL(0, asymmetric)).toBeCloseTo(0.05);
    expect(fivePL(1e6, asymmetric)).toBeCloseTo(2.5, 1);
  });
});

describe('fit5PL', () => {
  it('recovers known 5PL parameters', () => {
    const trueParams: FivePLParams = { A: 0.05, B: 1.2, C: 50, D: 2.5, S: 0.8 };
    const concentrations = [0.1, 0.5, 1, 5, 10, 25, 50, 100, 200, 500, 1000];
    const points = concentrations.map(x => ({
      x,
      y: fivePL(x, trueParams),
    }));

    const result = fit5PL(points);
    expect(result.model).toBe('5pl');
    expect(result.rSquared).toBeGreaterThan(0.99);
  });

  it('throws on too few points', () => {
    const pts = [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }];
    expect(() => fit5PL(pts)).toThrow('at least 5');
  });
});
