import { describe, it, expect } from 'vitest';
import { parsePlateData, parseFlatValues } from '../parser.js';

const makeRow = (n: number) => Array.from({ length: 12 }, (_, i) => (n * 12 + i + 1) * 0.01);
const makePlateText = () => {
  const rows: string[] = [];
  for (let r = 0; r < 8; r++) {
    rows.push(makeRow(r).map(v => v.toFixed(4)).join('\t'));
  }
  return rows.join('\n');
};

describe('parsePlateData', () => {
  it('parses tab-delimited 8×12 data', () => {
    const text = makePlateText();
    const plate = parsePlateData(text);
    expect(plate.values.length).toBe(8);
    expect(plate.values[0].length).toBe(12);
    expect(plate.values[0][0]).toBeCloseTo(0.01);
    expect(plate.values[7][11]).toBeCloseTo(0.96);
  });

  it('parses comma-delimited data', () => {
    const rows: string[] = [];
    for (let r = 0; r < 8; r++) {
      rows.push(makeRow(r).map(v => v.toFixed(4)).join(','));
    }
    const plate = parsePlateData(rows.join('\n'));
    expect(plate.values[0][0]).toBeCloseTo(0.01);
  });

  it('throws on too few rows', () => {
    expect(() => parsePlateData('1,2,3')).toThrow('Expected at least 8 rows');
  });

  it('throws on too few columns', () => {
    const rows = Array.from({ length: 8 }, () => '1,2,3');
    expect(() => parsePlateData(rows.join('\n'))).toThrow('expected 12 values');
  });

  it('throws on non-numeric value', () => {
    const rows: string[] = [];
    for (let r = 0; r < 8; r++) {
      rows.push(makeRow(r).map(v => v.toFixed(4)).join(','));
    }
    // Replace a known numeric cell with non-numeric text
    const cells = rows[2].split(',');
    cells[0] = 'abc';
    rows[2] = cells.join(',');
    expect(() => parsePlateData(rows.join('\n'))).toThrow('not a number');
  });

  it('throws on negative value', () => {
    const rows: string[] = [];
    for (let r = 0; r < 8; r++) {
      rows.push(makeRow(r).map(v => v.toFixed(4)).join(','));
    }
    rows[0] = rows[0].replace(/0\.0100/, '-0.0100');
    expect(() => parsePlateData(rows.join('\n'))).toThrow('negative');
  });
});

describe('parseFlatValues', () => {
  it('parses 96 flat values into 8×12', () => {
    const vals = Array.from({ length: 96 }, (_, i) => i * 0.01);
    const plate = parseFlatValues(vals);
    expect(plate.values.length).toBe(8);
    expect(plate.values[0].length).toBe(12);
    expect(plate.values[0][0]).toBe(0);
    expect(plate.values[7][11]).toBeCloseTo(0.95);
  });

  it('throws on wrong count', () => {
    expect(() => parseFlatValues([1, 2, 3])).toThrow('Expected 96');
  });
});
