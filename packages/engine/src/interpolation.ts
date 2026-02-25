import { FourPLParams, FivePLParams } from './types.js';

/**
 * Inverse 4PL: given OD (y), compute concentration (x).
 * x = C × ((A - D) / (y - D) - 1)^(1/B)
 *
 * Returns null if y is outside the curve range [A, D] (or [D, A]).
 */
export function inverse4PL(y: number, params: FourPLParams): { concentration: number; flag?: string } | null {
  const { A, B, C, D } = params;
  const low = Math.min(A, D);
  const high = Math.max(A, D);

  if (y <= low || y >= high) {
    return null; // out of range
  }

  const ratio = (A - D) / (y - D) - 1;
  if (ratio <= 0) return null;

  const concentration = C * Math.pow(ratio, 1 / B);

  let flag: string | undefined;
  // Flag if very close to asymptotes (within 5% of range)
  const range = high - low;
  if (y < low + 0.05 * range) flag = 'near-low';
  if (y > high - 0.05 * range) flag = 'near-high';

  return { concentration, flag };
}

/**
 * Inverse 5PL: given OD (y), compute concentration (x).
 * x = C × (((A - D) / (y - D))^(1/S) - 1)^(1/B)
 */
export function inverse5PL(y: number, params: FivePLParams): { concentration: number; flag?: string } | null {
  const { A, B, C, D, S } = params;
  const low = Math.min(A, D);
  const high = Math.max(A, D);

  if (y <= low || y >= high) return null;

  const innerRatio = (A - D) / (y - D);
  if (innerRatio <= 0) return null;

  const raised = Math.pow(innerRatio, 1 / S) - 1;
  if (raised <= 0) return null;

  const concentration = C * Math.pow(raised, 1 / B);

  let flag: string | undefined;
  const range = high - low;
  if (y < low + 0.05 * range) flag = 'near-low';
  if (y > high - 0.05 * range) flag = 'near-high';

  return { concentration, flag };
}
