import { describe, it, expect } from 'vitest';
import { analyze } from '../analyze.js';
import { createEmptyLayout, assignWell } from '../layout.js';
import { fourPL } from '../curve-fit.js';
import { PlateData, FourPLParams, ROWS, COLS } from '../types.js';

describe('analyze (integration)', () => {
  it('runs full pipeline on synthetic data', () => {
    const trueParams: FourPLParams = { A: 0.05, B: 1.2, C: 50, D: 2.5 };
    const blankOD = 0.04;

    // Build plate data and layout
    const stdConcentrations = [1, 5, 10, 25, 50, 100, 200, 500];
    let layout = createEmptyLayout();
    const values: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    // Standards in columns 0-1 (duplicates), rows 0-7
    stdConcentrations.forEach((conc, i) => {
      const od = fourPL(conc, trueParams) + blankOD;
      values[i][0] = od;
      values[i][1] = od + 0.01; // slight replicate variation
      layout = assignWell(layout, i, 0, { type: 'standard', concentration: conc, group: `S${i + 1}` });
      layout = assignWell(layout, i, 1, { type: 'standard', concentration: conc, group: `S${i + 1}` });
    });

    // Blanks in column 2
    values[0][2] = blankOD;
    values[1][2] = blankOD;
    layout = assignWell(layout, 0, 2, { type: 'blank', group: 'BLK' });
    layout = assignWell(layout, 1, 2, { type: 'blank', group: 'BLK' });

    // Unknowns in column 3
    const unknownConc = 30;
    const unknownOD = fourPL(unknownConc, trueParams) + blankOD;
    values[0][3] = unknownOD;
    values[1][3] = unknownOD + 0.02;
    layout = assignWell(layout, 0, 3, { type: 'unknown', group: 'U1' });
    layout = assignWell(layout, 1, 3, { type: 'unknown', group: 'U1' });

    const data: PlateData = { values };
    const result = analyze(data, layout);

    // Check curve fit
    expect(result.curveFit.rSquared).toBeGreaterThan(0.95);

    // Check blank subtraction
    expect(result.blankMean).toBeCloseTo(blankOD, 2);

    // Check unknown interpolation is close to 30
    const u1Group = result.groups.find(g => g.group === 'U1');
    expect(u1Group).toBeDefined();
    expect(u1Group!.meanConcentration).toBeDefined();
    expect(u1Group!.meanConcentration!).toBeCloseTo(unknownConc, -1);

    // Check groups exist
    expect(result.groups.length).toBeGreaterThan(0);
    expect(result.wells.length).toBeGreaterThan(0);
  });
});
