/** Core types for ElisaLab engine */

export const ROWS = 8;
export const COLS = 12;
export const WELL_COUNT = ROWS * COLS;

export type WellType = 'standard' | 'unknown' | 'blank' | 'empty';

export interface WellAssignment {
  type: WellType;
  /** For standards: known concentration */
  concentration?: number;
  /** Group label for replicate grouping (e.g. "S1", "U3") */
  group?: string;
}

export interface PlateLayout {
  assignments: WellAssignment[][];
}

export interface PlateData {
  /** 8×12 matrix of OD values */
  values: number[][];
}

export interface FourPLParams {
  A: number; // min asymptote
  B: number; // Hill slope
  C: number; // IC50/EC50
  D: number; // max asymptote
}

export interface CurveFitResult {
  params: FourPLParams;
  rSquared: number;
}

export interface WellResult {
  well: string;
  row: number;
  col: number;
  type: WellType;
  group?: string;
  od: number;
  odCorrected: number;
  concentration?: number;
  flag?: string;
}

export interface GroupResult {
  group: string;
  type: WellType;
  meanOD: number;
  meanConcentration?: number;
  sd: number;
  cv: number;
  recovery?: number;
  flag?: string;
  wells: WellResult[];
}

export interface AnalysisResult {
  wells: WellResult[];
  groups: GroupResult[];
  curveFit: CurveFitResult;
  blankMean: number;
}

/** Convert row/col to well name (e.g. 0,0 -> "A1") */
export function wellName(row: number, col: number): string {
  return String.fromCharCode(65 + row) + (col + 1);
}
