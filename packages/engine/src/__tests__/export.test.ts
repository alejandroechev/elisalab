import { describe, it, expect } from 'vitest';
import { exportResultsCSV, getCurvePlotData } from '../export.js';
import { WellResult, CurveFitResult } from '../types.js';

describe('exportResultsCSV', () => {
  it('generates CSV with header and rows', () => {
    const wells: WellResult[] = [
      { well: 'A1', row: 0, col: 0, type: 'standard', group: 'S1', od: 2.1, odCorrected: 2.0, concentration: 100, flag: undefined },
      { well: 'B1', row: 1, col: 0, type: 'unknown', group: 'U1', od: 1.5, odCorrected: 1.4, concentration: 45.2, flag: undefined },
    ];
    const csv = exportResultsCSV(wells);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Well,Type,Group,OD,OD_Corrected,Concentration,Flag');
    expect(lines[1]).toContain('A1');
    expect(lines[1]).toContain('standard');
    expect(lines.length).toBe(3);
  });
});

describe('getCurvePlotData', () => {
  it('generates log-spaced curve points', () => {
    const fit: CurveFitResult = {
      model: '4pl',
      params: { A: 0.05, B: 1.5, C: 50, D: 2.5 },
      rSquared: 0.999,
    };
    const data = getCurvePlotData(fit, 0.1, 1000, 50);
    expect(data.length).toBe(50);
    expect(data[0].x).toBeGreaterThan(0);
    expect(data[data.length - 1].x).toBeCloseTo(1000, -1);
    // Y values should be between A and D
    for (const pt of data) {
      expect(pt.y).toBeGreaterThanOrEqual(0.04);
      expect(pt.y).toBeLessThanOrEqual(2.6);
    }
  });
});
