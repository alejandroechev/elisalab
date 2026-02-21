import { GroupResult, WellResult, WellAssignment, wellName } from './types.js';

/** Compute mean of array */
export function mean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Compute standard deviation (population) */
export function sd(vals: number[]): number {
  if (vals.length <= 1) return 0;
  const m = mean(vals);
  const variance = vals.reduce((s, v) => s + (v - m) ** 2, 0) / (vals.length - 1);
  return Math.sqrt(variance);
}

/** Compute CV% */
export function cv(vals: number[]): number {
  const m = mean(vals);
  if (m === 0) return 0;
  return (sd(vals) / Math.abs(m)) * 100;
}

/** Compute % recovery for a standard: (measured / expected) * 100 */
export function recovery(measured: number, expected: number): number {
  if (expected === 0) return 0;
  return (measured / expected) * 100;
}

/** Build group results from well results */
export function computeGroupStats(
  groupMap: Map<string, {
    type: WellAssignment['type'];
    conc?: number;
    wells: { row: number; col: number; od: number; odCorrected: number; concentration?: number; flag?: string }[];
  }>
): GroupResult[] {
  const groups: GroupResult[] = [];

  for (const [group, data] of groupMap) {
    const wellResults: WellResult[] = data.wells.map(w => ({
      well: wellName(w.row, w.col),
      row: w.row,
      col: w.col,
      type: data.type,
      group,
      od: w.od,
      odCorrected: w.odCorrected,
      concentration: w.concentration,
      flag: w.flag,
    }));

    const ods = data.wells.map(w => w.odCorrected);
    const concentrations = data.wells
      .filter(w => w.concentration !== undefined)
      .map(w => w.concentration!);

    const cvVal = cv(ods);
    let flag: string | undefined;
    if (cvVal > 15) flag = 'high-cv';

    const gr: GroupResult = {
      group,
      type: data.type,
      meanOD: mean(ods),
      meanConcentration: concentrations.length > 0 ? mean(concentrations) : undefined,
      sd: sd(ods),
      cv: cvVal,
      wells: wellResults,
    };

    if (data.type === 'standard' && data.conc !== undefined && gr.meanConcentration !== undefined) {
      gr.recovery = recovery(gr.meanConcentration, data.conc);
    }
    if (flag) gr.flag = flag;

    groups.push(gr);
  }

  return groups;
}
