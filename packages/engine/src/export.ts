import { WellResult, GroupResult, CurveFitResult, FivePLParams } from './types.js';
import { fourPL, fivePL } from './curve-fit.js';

/** Format results as CSV string */
export function exportResultsCSV(wells: WellResult[]): string {
  const header = 'Well,Type,Group,OD,OD_Corrected,Concentration,Flag';
  const rows = wells.map(w =>
    [
      w.well,
      w.type,
      w.group ?? '',
      w.od.toFixed(4),
      w.odCorrected.toFixed(4),
      w.concentration !== undefined ? w.concentration.toFixed(4) : '',
      w.flag ?? '',
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

/** Format group results as CSV string */
export function exportGroupCSV(groups: GroupResult[]): string {
  const header = 'Group,Type,Mean_OD,Mean_Concentration,SD,CV%,Recovery%,Flag';
  const rows = groups.map(g =>
    [
      g.group,
      g.type,
      g.meanOD.toFixed(4),
      g.meanConcentration !== undefined ? g.meanConcentration.toFixed(4) : '',
      g.sd.toFixed(4),
      g.cv.toFixed(2),
      g.recovery !== undefined ? g.recovery.toFixed(1) : '',
      g.flag ?? '',
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

/** Generate standard curve plot data for charting */
export function getCurvePlotData(
  fit: CurveFitResult,
  minX: number,
  maxX: number,
  nPoints: number = 100
): { x: number; y: number }[] {
  const logMin = Math.log10(Math.max(minX, 0.001));
  const logMax = Math.log10(maxX);
  const step = (logMax - logMin) / (nPoints - 1);

  const data: { x: number; y: number }[] = [];
  for (let i = 0; i < nPoints; i++) {
    const x = Math.pow(10, logMin + step * i);
    const y = fit.model === '5pl'
      ? fivePL(x, fit.params as FivePLParams)
      : fourPL(x, fit.params);
    data.push({ x, y });
  }
  return data;
}
