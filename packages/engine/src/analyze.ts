import { PlateData, PlateLayout, AnalysisResult, wellName } from './types.js';
import { computeBlankMean, getStandardPoints, getWellsByGroup } from './layout.js';
import { fit4PL } from './curve-fit.js';
import { inverse4PL } from './interpolation.js';
import { computeGroupStats } from './statistics.js';

/** Run the complete ELISA analysis pipeline */
export function analyze(data: PlateData, layout: PlateLayout): AnalysisResult {
  // 1. Compute blank mean
  const blankMean = computeBlankMean(layout, data);

  // 2. Get standard curve points
  const stdPoints = getStandardPoints(layout, data, blankMean);
  if (stdPoints.length < 4) {
    throw new Error(`Need at least 4 standard groups, got ${stdPoints.length}`);
  }

  // 3. Fit 4PL curve
  const curveFit = fit4PL(stdPoints.map(p => ({ x: p.concentration, y: p.od })));

  // 4. Interpolate unknowns and standards
  const groupMap = getWellsByGroup(layout, data, blankMean);

  for (const [, group] of groupMap) {
    for (const well of group.wells) {
      if (group.type === 'blank') continue;
      const result = inverse4PL(well.odCorrected, curveFit.params);
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
