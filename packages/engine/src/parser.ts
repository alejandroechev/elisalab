import { PlateData, ROWS, COLS, WELL_COUNT } from './types.js';

/** Parse pasted or CSV text into 8×12 plate data */
export function parsePlateData(text: string): PlateData {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < ROWS) {
    throw new Error(`Expected at least ${ROWS} rows, got ${lines.length}`);
  }

  const values: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const cells = lines[r].split(/[\t,]/).map(s => s.trim()).filter(s => s !== '');
    if (cells.length < COLS) {
      throw new Error(`Row ${r + 1}: expected ${COLS} values, got ${cells.length}`);
    }
    const row: number[] = [];
    for (let c = 0; c < COLS; c++) {
      const v = Number(cells[c]);
      if (isNaN(v)) {
        throw new Error(`Row ${r + 1}, Col ${c + 1}: "${cells[c]}" is not a number`);
      }
      if (v < 0) {
        throw new Error(`Row ${r + 1}, Col ${c + 1}: negative value ${v}`);
      }
      row.push(v);
    }
    values.push(row);
  }

  return { values };
}

/** Parse a flat array of 96 values into 8×12 */
export function parseFlatValues(vals: number[]): PlateData {
  if (vals.length !== WELL_COUNT) {
    throw new Error(`Expected ${WELL_COUNT} values, got ${vals.length}`);
  }
  for (const v of vals) {
    if (isNaN(v) || v < 0) throw new Error(`Invalid value: ${v}`);
  }
  const values: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    values.push(vals.slice(r * COLS, (r + 1) * COLS));
  }
  return { values };
}
