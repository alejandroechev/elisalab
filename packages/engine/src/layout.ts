import { PlateLayout, WellAssignment, PlateData, ROWS, COLS, wellName } from './types.js';

/** Create an empty plate layout (all wells = empty) */
export function createEmptyLayout(): PlateLayout {
  const assignments: WellAssignment[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: WellAssignment[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push({ type: 'empty' });
    }
    assignments.push(row);
  }
  return { assignments };
}

/** Assign a well type */
export function assignWell(
  layout: PlateLayout,
  row: number,
  col: number,
  assignment: WellAssignment
): PlateLayout {
  const next: WellAssignment[][] = layout.assignments.map(r => [...r]);
  next[row][col] = { ...assignment };
  return { assignments: next };
}

/** Compute mean blank OD */
export function computeBlankMean(layout: PlateLayout, data: PlateData): number {
  const blanks: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (layout.assignments[r][c].type === 'blank') {
        blanks.push(data.values[r][c]);
      }
    }
  }
  if (blanks.length === 0) return 0;
  return blanks.reduce((a, b) => a + b, 0) / blanks.length;
}

/** Get standard curve data points: { concentration, od } averaged per group */
export function getStandardPoints(
  layout: PlateLayout,
  data: PlateData,
  blankMean: number
): { concentration: number; od: number }[] {
  const groups = new Map<string, { conc: number; ods: number[] }>();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const a = layout.assignments[r][c];
      if (a.type === 'standard' && a.concentration !== undefined && a.group) {
        if (!groups.has(a.group)) {
          groups.set(a.group, { conc: a.concentration, ods: [] });
        }
        groups.get(a.group)!.ods.push(data.values[r][c] - blankMean);
      }
    }
  }

  const points: { concentration: number; od: number }[] = [];
  for (const [, g] of groups) {
    const meanOD = g.ods.reduce((a, b) => a + b, 0) / g.ods.length;
    points.push({ concentration: g.conc, od: meanOD });
  }
  points.sort((a, b) => a.concentration - b.concentration);
  return points;
}

/** Collect wells by group for statistics */
export function getWellsByGroup(
  layout: PlateLayout,
  data: PlateData,
  blankMean: number
): Map<string, { type: WellAssignment['type']; conc?: number; wells: { row: number; col: number; od: number; odCorrected: number; concentration?: number; flag?: string }[] }> {
  const groups = new Map<string, { type: WellAssignment['type']; conc?: number; wells: { row: number; col: number; od: number; odCorrected: number }[] }>();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const a = layout.assignments[r][c];
      if (a.type === 'empty') continue;
      const group = a.group ?? wellName(r, c);
      if (!groups.has(group)) {
        groups.set(group, { type: a.type, conc: a.concentration, wells: [] });
      }
      groups.get(group)!.wells.push({
        row: r, col: c,
        od: data.values[r][c],
        odCorrected: Math.max(0, data.values[r][c] - blankMean),
      });
    }
  }
  return groups;
}
