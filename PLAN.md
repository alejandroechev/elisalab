# ElisaLab — ELISA Data Analysis

## Mission
Replace MyAssays/Excel ELISA workflows with a clean web tool: paste plate data → 4PL fit → concentrations.

## Architecture
- `packages/engine/` — 4PL curve fitting (Levenberg-Marquardt), plate layout, interpolation
- `packages/web/` — React + Vite, plate layout grid editor, standard curve chart
- `packages/cli/` — Node runner for batch plate analysis

## MVP Features (Free Tier)
1. Input OD values for one 96-well plate via paste or CSV
2. Visual plate layout editor (assign standards, unknowns, blanks)
3. 4PL curve fitting with R² display
4. Automatic interpolation of unknown concentrations from standard curve
5. Flag out-of-range samples
6. Export results table as CSV + download standard curve image

## Engine Tasks

### E1: Plate Data Parser
- Parse tab/comma-delimited 8×12 OD values
- Support paste from Excel and CSV upload
- Validate: 96 values, numeric, positive
- **Validation**: Known plate data fixtures

### E2: Plate Layout Model
- Assign well types: Standard, Unknown, Blank, Empty
- Standards: concentration + replicate grouping
- Blanks: average and subtract from all wells
- **Validation**: Layout assignment round-trip

### E3: 4-Parameter Logistic (4PL) Curve Fitting
- Model: `y = D + (A - D) / (1 + (x/C)^B)`
  - A = minimum asymptote, B = Hill slope, C = IC50/EC50, D = maximum asymptote
- Levenberg-Marquardt least-squares optimization
- Output: A, B, C, D parameters + R² goodness of fit
- **Validation**: Known 4PL datasets from literature, compare to GraphPad output

### E4: Concentration Interpolation
- Given fitted 4PL curve, solve for x given y (inverse 4PL)
- `x = C × ((A - D) / (y - D) - 1)^(1/B)`
- Flag samples where OD is outside standard curve range
- **Validation**: Manual inverse calculation verification

### E5: Statistics
- Compute mean, SD, CV% for replicate groups
- Flag high CV% replicates (>15%)
- Back-calculate standard concentrations and compute % recovery
- **Validation**: Manual calculation on test dataset

### E6: Export
- Results table: Well, Type, OD, Concentration, CV%, Flag
- Standard curve plot data for charting
- CSV export

## Web UI Tasks

### W1: Plate Grid Editor
- 8×12 interactive grid (click to assign well types)
- Color-coded: blue=standard, green=unknown, gray=blank
- Paste OD values into grid

### W2: Standard Curve Chart
- Recharts scatter plot: log(concentration) vs OD
- 4PL fitted curve overlay
- Display R² and parameters
- Hover: show interpolated concentration

### W3: Results Table
- Sortable table: Well, Sample, OD, Concentration, CV%, Flag
- Highlight out-of-range and high-CV samples
- Inline editing of well assignments

### W4: Export & Report
- Download CSV
- Download standard curve chart as PNG
- Print-friendly results summary

### W5: Toolbar & Theme
- Import Plate, Fit Curve, Export buttons
- Standard concentration entry panel
- Light/dark theme

## Key Equations
- 4PL: `y = D + (A - D) / (1 + (x/C)^B)`
- Inverse 4PL: `x = C × ((A - D) / (y - D) - 1)^(1/B)`
- R²: `1 - (SS_res / SS_tot)`
- CV%: `(SD / mean) × 100`

## Validation Strategy
- Published 4PL datasets with known parameters
- Compare curve fit to GraphPad Prism output on same data
- Verify interpolated concentrations match manual inverse 4PL calculation
