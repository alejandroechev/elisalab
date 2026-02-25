import { FourPLParams, FivePLParams, FitModel, CurveFitResult } from './types.js';

/** Evaluate the 4PL model: y = D + (A - D) / (1 + (x/C)^B) */
export function fourPL(x: number, p: FourPLParams): number {
  const { A, B, C, D } = p;
  if (x <= 0) return A; // at zero concentration, return min asymptote
  return D + (A - D) / (1 + Math.pow(x / C, B));
}

/** Evaluate the 5PL model: y = D + (A - D) / (1 + (x/C)^B)^S */
export function fivePL(x: number, p: FivePLParams): number {
  const { A, B, C, D, S } = p;
  if (x <= 0) return A;
  return D + (A - D) / Math.pow(1 + Math.pow(x / C, B), S);
}

/** Estimate initial 4PL parameters from data points */
function estimateInitial(points: { x: number; y: number }[]): FourPLParams {
  const sortedByX = [...points].sort((a, b) => a.x - b.x);
  const A = sortedByX[0].y; // y at lowest x
  const D = sortedByX[sortedByX.length - 1].y; // y at highest x
  const midY = (A + D) / 2;

  // Find x closest to midpoint y → estimate C
  let closestIdx = 0;
  let closestDist = Infinity;
  for (let i = 0; i < sortedByX.length; i++) {
    const d = Math.abs(sortedByX[i].y - midY);
    if (d < closestDist) { closestDist = d; closestIdx = i; }
  }
  const C = Math.max(sortedByX[closestIdx].x, 0.001);

  // Estimate B from the slope at the inflection point
  let B = 1;
  if (sortedByX.length >= 3) {
    // Use points around the midpoint to estimate slope
    const i = closestIdx;
    const iLow = Math.max(0, i - 1);
    const iHigh = Math.min(sortedByX.length - 1, i + 1);
    if (iHigh > iLow && sortedByX[iHigh].x > 0 && sortedByX[iLow].x > 0) {
      const dLogX = Math.log(sortedByX[iHigh].x) - Math.log(sortedByX[iLow].x);
      const dY = sortedByX[iHigh].y - sortedByX[iLow].y;
      if (dLogX !== 0 && (D - A) !== 0) {
        B = Math.abs(4 * dY / ((D - A) * dLogX));
        B = Math.max(0.1, Math.min(B, 10));
      }
    }
  }

  return { A, B, C, D };
}

/**
 * Fit a 4PL curve using Levenberg-Marquardt optimization.
 * points: array of { x: concentration, y: OD }
 */
export function fit4PL(points: { x: number; y: number }[]): CurveFitResult {
  if (points.length < 4) {
    throw new Error('Need at least 4 data points for 4PL fitting');
  }

  let params = estimateInitial(points);
  let lambda = 0.001;
  const maxIter = 1000;
  const tol = 1e-12;

  const paramVec = () => [params.A, params.B, params.C, params.D];
  const fromVec = (v: number[]): FourPLParams => ({ A: v[0], B: v[1], C: v[2], D: v[3] });

  const residuals = (p: FourPLParams) =>
    points.map(pt => pt.y - fourPL(pt.x, p));

  const sumSqRes = (p: FourPLParams) =>
    residuals(p).reduce((s, r) => s + r * r, 0);

  const jacobian = (p: FourPLParams): number[][] => {
    const eps = 1e-8;
    const pv = [p.A, p.B, p.C, p.D];
    const J: number[][] = [];
    for (let i = 0; i < points.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < 4; j++) {
        const pPlus = [...pv];
        pPlus[j] += eps;
        const yPlus = fourPL(points[i].x, fromVec(pPlus));
        const y0 = fourPL(points[i].x, p);
        row.push(-(yPlus - y0) / eps); // negative because residual = y - f(x)
      }
      J.push(row);
    }
    return J;
  };

  let prevSSR = sumSqRes(params);

  for (let iter = 0; iter < maxIter; iter++) {
    const r = residuals(params);
    const J = jacobian(params);
    const n = 4;

    // JᵀJ
    const JtJ: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const JtR: number[] = new Array(n).fill(0);

    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < n; j++) {
        JtR[j] += J[i][j] * r[i];
        for (let k = 0; k < n; k++) {
          JtJ[j][k] += J[i][j] * J[i][k];
        }
      }
    }

    // (JᵀJ + λI) δ = JᵀR
    const A_mat = JtJ.map((row, i) => {
      const nr = [...row];
      nr[i] += lambda;
      return nr;
    });

    const delta = solveLinear(A_mat, JtR);
    if (!delta) { lambda *= 10; continue; }

    const pv = paramVec();
    const newPv = pv.map((v, i) => v + delta[i]);

    // Ensure C > 0
    if (newPv[2] <= 0) newPv[2] = 0.001;

    const newParams = fromVec(newPv);
    const newSSR = sumSqRes(newParams);

    if (newSSR < prevSSR) {
      params = newParams;
      lambda = Math.max(lambda / 10, 1e-15);
      if (Math.abs(prevSSR - newSSR) < tol) break;
      prevSSR = newSSR;
    } else {
      lambda *= 10;
    }
  }

  // Compute R²
  const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = sumSqRes(params);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { model: '4pl' as FitModel, params, rSquared };
}

/**
 * Fit a 5PL curve using Levenberg-Marquardt optimization.
 * 5PL: y = D + (A - D) / (1 + (x/C)^B)^S
 */
export function fit5PL(points: { x: number; y: number }[]): CurveFitResult {
  if (points.length < 5) {
    throw new Error('Need at least 5 data points for 5PL fitting');
  }

  const init4 = estimateInitial(points);
  let params: FivePLParams = { ...init4, S: 1.0 };
  let lambda = 0.001;
  const maxIter = 1500;
  const tol = 1e-12;
  const nParams = 5;

  const paramVec = () => [params.A, params.B, params.C, params.D, params.S];
  const fromVec = (v: number[]): FivePLParams => ({ A: v[0], B: v[1], C: v[2], D: v[3], S: v[4] });

  const residuals = (p: FivePLParams) =>
    points.map(pt => pt.y - fivePL(pt.x, p));

  const sumSqRes = (p: FivePLParams) =>
    residuals(p).reduce((s, r) => s + r * r, 0);

  const jacobian = (p: FivePLParams): number[][] => {
    const eps = 1e-8;
    const pv = paramVec();
    const J: number[][] = [];
    for (let i = 0; i < points.length; i++) {
      const row: number[] = [];
      const y0 = fivePL(points[i].x, p);
      for (let j = 0; j < nParams; j++) {
        const pPlus = [...pv];
        pPlus[j] += eps;
        const yPlus = fivePL(points[i].x, fromVec(pPlus));
        row.push(-(yPlus - y0) / eps);
      }
      J.push(row);
    }
    return J;
  };

  let prevSSR = sumSqRes(params);

  for (let iter = 0; iter < maxIter; iter++) {
    const r = residuals(params);
    const J = jacobian(params);

    const JtJ: number[][] = Array.from({ length: nParams }, () => new Array(nParams).fill(0));
    const JtR: number[] = new Array(nParams).fill(0);

    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < nParams; j++) {
        JtR[j] += J[i][j] * r[i];
        for (let k = 0; k < nParams; k++) {
          JtJ[j][k] += J[i][j] * J[i][k];
        }
      }
    }

    const A_mat = JtJ.map((row, i) => {
      const nr = [...row];
      nr[i] += lambda;
      return nr;
    });

    const delta = solveLinear(A_mat, JtR);
    if (!delta) { lambda *= 10; continue; }

    const pv = paramVec();
    const newPv = pv.map((v, i) => v + delta[i]);

    // Constraints: C > 0, S > 0.01
    if (newPv[2] <= 0) newPv[2] = 0.001;
    if (newPv[4] <= 0.01) newPv[4] = 0.01;

    const newParams = fromVec(newPv);
    const newSSR = sumSqRes(newParams);

    if (newSSR < prevSSR) {
      params = newParams;
      lambda = Math.max(lambda / 10, 1e-15);
      if (Math.abs(prevSSR - newSSR) < tol) break;
      prevSSR = newSSR;
    } else {
      lambda *= 10;
    }
  }

  const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = sumSqRes(params);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { model: '5pl', params, rSquared };
}

/** Solve 4×4 linear system Ax = b using Gaussian elimination */
function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const aug = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-20) return null;

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= aug[i][j] * x[j];
    }
    x[i] /= aug[i][i];
  }
  return x;
}
