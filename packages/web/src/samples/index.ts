import type { PlateData, PlateLayout, WellAssignment } from '@elisalab/engine';
import { ROWS, COLS } from '@elisalab/engine';

export interface SampleDataset {
  name: string;
  description: string;
  plateData: PlateData;
  layout: PlateLayout;
  standardConcentrations: number[];
}

// Standards in cols 0-1 (duplicates), rows 0..n
// Blanks in row 7, cols 0-1
// Unknowns in cols 2-3 (duplicates), rows 0..5
function buildSample(
  name: string,
  description: string,
  stdConcs: number[],
  stdODs: [number, number][],
  blankODs: [number, number],
  unkODs: [number, number][],
): SampleDataset {
  const values: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0.042));
  const assignments: WellAssignment[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, (): WellAssignment => ({ type: 'empty' })),
  );

  for (let i = 0; i < stdConcs.length; i++) {
    values[i][0] = stdODs[i][0];
    values[i][1] = stdODs[i][1];
    assignments[i][0] = { type: 'standard', concentration: stdConcs[i], group: `S${i + 1}` };
    assignments[i][1] = { type: 'standard', concentration: stdConcs[i], group: `S${i + 1}` };
  }

  values[7][0] = blankODs[0];
  values[7][1] = blankODs[1];
  assignments[7][0] = { type: 'blank', group: 'BLK' };
  assignments[7][1] = { type: 'blank', group: 'BLK' };

  for (let i = 0; i < unkODs.length; i++) {
    values[i][2] = unkODs[i][0];
    values[i][3] = unkODs[i][1];
    assignments[i][2] = { type: 'unknown', group: `U${i + 1}` };
    assignments[i][3] = { type: 'unknown', group: `U${i + 1}` };
  }

  return {
    name,
    description,
    plateData: { values },
    layout: { assignments },
    standardConcentrations: stdConcs,
  };
}

// 4PL: y = D + (A-D) / (1 + (x/C)^B)
// Params: A=0.062, B=1.2, C=80, D=2.85
const il6 = buildSample(
  'IL-6 Sandwich ELISA',
  'Standard sandwich ELISA for IL-6 (0–500 pg/mL). Good 4PL fit with R² > 0.99.',
  [500, 250, 125, 62.5, 31.25, 15.625, 7.8125],
  [
    [2.5606, 2.5583],
    [2.2763, 2.3320],
    [1.8136, 1.7388],
    [1.2635, 1.2410],
    [0.7389, 0.7463],
    [0.4091, 0.4205],
    [0.2275, 0.2238],
  ],
  [0.0606, 0.0601],
  [
    [0.7241, 0.7471],  // ~30 pg/mL
    [1.4578, 1.4514],  // ~80 pg/mL
    [1.9894, 1.8728],  // ~150 pg/mL
    [2.2625, 2.3175],  // ~250 pg/mL
    [2.5625, 2.4790],  // ~400 pg/mL
    [0.2775, 0.2765],  // ~10 pg/mL
  ],
);

// 4PL: A=0.048, B=1.5, C=10, D=2.5
const tnfAlpha = buildSample(
  'TNF-α High Sensitivity',
  'High-sensitivity TNF-α assay (0–50 pg/mL). Tight standard curve for low-abundance cytokine.',
  [50, 25, 12.5, 6.25, 3.125, 1.5625, 0.78125],
  [
    [2.3526, 2.2219],
    [2.0391, 1.9138],
    [1.3612, 1.4504],
    [0.8353, 0.8815],
    [0.4209, 0.3976],
    [0.1955, 0.1849],
    [0.1001, 0.0995],
  ],
  [0.0483, 0.0505],
  [
    [0.7017, 0.6957],  // ~5 pg/mL
    [1.6676, 1.6592],  // ~15 pg/mL
    [2.0647, 2.0590],  // ~30 pg/mL
    [1.0556, 1.0868],  // ~8 pg/mL
    [0.2474, 0.2668],  // ~2 pg/mL
    [2.1728, 2.1541],  // ~40 pg/mL
  ],
);

// 4PL: A=0.055, B=1.0, C=1500, D=3.0
const igg = buildSample(
  'IgG Quantification',
  'Total IgG quantification (0–10,000 ng/mL). Wide dynamic range with shallow Hill slope.',
  [10000, 5000, 2500, 1250, 625, 312.5, 156.25],
  [
    [2.6762, 2.7275],
    [2.3556, 2.3786],
    [1.9767, 1.8903],
    [1.3341, 1.3714],
    [0.9475, 0.8813],
    [0.5633, 0.5670],
    [0.3297, 0.3401],
  ],
  [0.0560, 0.0588],
  [
    [0.4089, 0.3941],  // ~200 ng/mL
    [1.0612, 1.0524],  // ~800 ng/mL
    [1.7875, 1.7083],  // ~2000 ng/mL
    [2.3155, 2.3725],  // ~5000 ng/mL
    [2.4800, 2.5127],  // ~8000 ng/mL
    [0.2259, 0.2313],  // ~100 ng/mL
  ],
);

// 4PL: A=0.070, B=1.3, C=100, D=2.7
// High CV on some replicates, outlier at S3
const poorQuality = buildSample(
  'Poor Quality Plate',
  'Plate with QC issues: outlier at S3 (125 pg/mL), high CV% at S5, variable unknowns. Demonstrates QC flagging.',
  [500, 250, 125, 62.5, 31.25, 15.625, 7.8125],
  [
    [2.3016, 2.4913],
    [2.2864, 2.0840],
    [1.6073, 2.2829],  // outlier — one replicate is ~45% high
    [1.0817, 1.0664],
    [0.4360, 0.6541],  // high CV% (~40%)
    [0.3068, 0.2948],
    [0.1782, 0.1619],
  ],
  [0.0837, 0.0675],
  [
    [0.7482, 0.6876],  // ~40 pg/mL
    [1.2149, 1.1197],  // ~90 pg/mL, moderate CV
    [1.9228, 2.1061],  // ~200 pg/mL
    [2.4909, 2.4562],  // ~350 pg/mL
    [0.8264, 1.0049],  // ~60 pg/mL, high CV
    [0.2850, 0.2667],  // ~15 pg/mL
  ],
);

// 4PL: A=2.8, B=1.1, C=50, D=0.08 (inverted — high OD at low concentration)
const competitive = buildSample(
  'Competitive ELISA',
  'Competitive binding assay with inverted curve: high OD at low analyte, low OD at high analyte.',
  [1000, 500, 250, 125, 62.5, 31.25, 15.625],
  [
    [0.1739, 0.1772],
    [0.2947, 0.2713],
    [0.4696, 0.4952],
    [0.7965, 0.7985],
    [1.2777, 1.2265],
    [1.7957, 1.7192],
    [2.2667, 2.2082],
  ],
  [0.0510, 0.0480],
  [
    [2.1576, 1.9917],  // ~20 (high OD = low conc)
    [1.2993, 1.3167],  // ~60
    [0.7425, 0.6699],  // ~150
    [0.3405, 0.3366],  // ~400
    [1.1465, 1.1195],  // ~80
    [0.2806, 0.2758],  // ~500
  ],
);

export const sampleDatasets: SampleDataset[] = [
  il6,
  tnfAlpha,
  igg,
  poorQuality,
  competitive,
];
