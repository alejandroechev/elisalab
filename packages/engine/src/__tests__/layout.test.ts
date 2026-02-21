import { describe, it, expect } from 'vitest';
import { createEmptyLayout, assignWell, computeBlankMean, getStandardPoints } from '../layout.js';
import { PlateData, ROWS, COLS } from '../types.js';

function makePlateData(fill: number = 0.5): PlateData {
  const values: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    values.push(Array(COLS).fill(fill));
  }
  return { values };
}

describe('createEmptyLayout', () => {
  it('creates 8×12 empty layout', () => {
    const layout = createEmptyLayout();
    expect(layout.assignments.length).toBe(8);
    expect(layout.assignments[0].length).toBe(12);
    expect(layout.assignments[0][0].type).toBe('empty');
  });
});

describe('assignWell', () => {
  it('assigns well type immutably', () => {
    const layout = createEmptyLayout();
    const updated = assignWell(layout, 0, 0, { type: 'standard', concentration: 100, group: 'S1' });
    expect(updated.assignments[0][0].type).toBe('standard');
    expect(updated.assignments[0][0].concentration).toBe(100);
    expect(layout.assignments[0][0].type).toBe('empty'); // original unchanged
  });
});

describe('computeBlankMean', () => {
  it('computes mean of blank wells', () => {
    let layout = createEmptyLayout();
    layout = assignWell(layout, 7, 0, { type: 'blank' });
    layout = assignWell(layout, 7, 1, { type: 'blank' });
    const data = makePlateData(0.1);
    data.values[7][0] = 0.05;
    data.values[7][1] = 0.07;
    expect(computeBlankMean(layout, data)).toBeCloseTo(0.06);
  });

  it('returns 0 when no blanks', () => {
    const layout = createEmptyLayout();
    const data = makePlateData(0.5);
    expect(computeBlankMean(layout, data)).toBe(0);
  });
});

describe('getStandardPoints', () => {
  it('extracts standard points averaged by group', () => {
    let layout = createEmptyLayout();
    layout = assignWell(layout, 0, 0, { type: 'standard', concentration: 100, group: 'S1' });
    layout = assignWell(layout, 0, 1, { type: 'standard', concentration: 100, group: 'S1' });
    layout = assignWell(layout, 1, 0, { type: 'standard', concentration: 50, group: 'S2' });
    layout = assignWell(layout, 1, 1, { type: 'standard', concentration: 50, group: 'S2' });

    const data = makePlateData(0);
    data.values[0][0] = 2.0;
    data.values[0][1] = 2.2;
    data.values[1][0] = 1.0;
    data.values[1][1] = 1.2;

    const points = getStandardPoints(layout, data, 0);
    expect(points.length).toBe(2);
    expect(points[0].concentration).toBe(50);
    expect(points[0].od).toBeCloseTo(1.1);
    expect(points[1].concentration).toBe(100);
    expect(points[1].od).toBeCloseTo(2.1);
  });
});
