import { PlateData, PlateLayout, AnalysisResult, FitModel, FivePLParams, wellName } from './types.js';
import { computeBlankMean, getStandardPoints, getWellsByGroup } from './layout.js';
import { fit4PL, fit5PL } from './curve-fit.js';
import { inverse4PL, inverse5PL } from './interpolation.js';
import { computeGroupStats } from './statistics.js';

/** Run the complete ELISA analysis pipeline */
export function analyze(data: PlateData, layout: PlateLayout, model: FitModel = '4pl'): AnalysisResult {
  // 1. Compute blank mean
  const blankMean = computeBlankMean(layout, data);

  // 2. Get standard curve points
  const stdPoints = getStandardPoints(layout, data, blankMean);
  const minPoints = model === '5pl' ? 5 : 4;
  if (stdPoints.length < minPoints) {
    throw new Error(`Need at least ${minPoints} standard groups for ${model.toUpperCase()} fitting, got ${stdPoints.length}`);
  }

  // 3. Fit curve
  const fitPoints = stdPoints.map(p => ({ x: p.concentration, y: p.od }));
  const curveFit = model === '5pl' ? fit5PL(fitPoints) : fit4PL(fitPoints);

  // 4. Interpolate unknowns and standards
  const groupMap = getWellsByGroup(layout, data, blankMean);

  for (const [, group] of groupMap) {
    for (const well of group.wells) {
      if (group.type === 'blank') continue;
      const result = model === '5pl'
        ? inverse5PL(well.odCorrected, curveFit.params as FivePLParams)
        : inverse4PL(well.odCorrected, curveFit.params);
      if (result) {
        well.concentration = result.concentration;
        well.flag = result.flag;
      } else {
        well.flag = 'out-of-range';
      }
    }
  }

  // 5. Compute group statistics
  const groups = computeGroupStats(groupMap);

  // 6. Flatten well results
  const wells = groups.flatMap(g => g.wells);

  return { wells, groups, curveFit, blankMean };
}
