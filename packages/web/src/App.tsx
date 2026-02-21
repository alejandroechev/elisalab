import { useState, useCallback } from 'react';
import {
  PlateData, PlateLayout, AnalysisResult, CurveFitResult,
  createEmptyLayout, assignWell, WellAssignment,
  parsePlateData, analyze, exportResultsCSV, getCurvePlotData,
  ROWS, COLS, wellName, getStandardPoints, computeBlankMean,
} from '@elisalab/engine';
import PlateGrid from './components/PlateGrid.js';
import StandardCurveChart from './components/StandardCurveChart.js';
import ResultsTable from './components/ResultsTable.js';
import Toolbar from './components/Toolbar.js';
import PasteDialog from './components/PasteDialog.js';
import StandardEntry from './components/StandardEntry.js';

type WellTool = 'standard' | 'unknown' | 'blank' | 'empty';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [layout, setLayout] = useState<PlateLayout>(createEmptyLayout());
  const [plateData, setPlateData] = useState<PlateData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [activeTool, setActiveTool] = useState<WellTool>('standard');
  const [stdConcentrations, setStdConcentrations] = useState<number[]>([
    1000, 500, 250, 125, 62.5, 31.25, 15.625, 7.8125,
  ]);
  const [nextStdIndex, setNextStdIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  const handlePaste = useCallback((text: string) => {
    try {
      const data = parsePlateData(text);
      setPlateData(data);
      setShowPaste(false);
      setError(null);
      setResult(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const handleWellClick = useCallback((row: number, col: number) => {
    setLayout(prev => {
      const current = prev.assignments[row][col];
      let assignment: WellAssignment;

      if (activeTool === 'standard') {
        const conc = stdConcentrations[nextStdIndex % stdConcentrations.length] ?? 100;
        const group = `S${nextStdIndex + 1}`;

        // If clicking a second well with same tool and we just placed one, add to same group
        if (current.type === 'standard') {
          // Toggle off
          return assignWell(prev, row, col, { type: 'empty' });
        }
        assignment = { type: 'standard', concentration: conc, group };
      } else if (activeTool === 'unknown') {
        if (current.type === 'unknown') {
          return assignWell(prev, row, col, { type: 'empty' });
        }
        assignment = { type: 'unknown', group: `U${row * COLS + col + 1}` };
      } else if (activeTool === 'blank') {
        if (current.type === 'blank') {
          return assignWell(prev, row, col, { type: 'empty' });
        }
        assignment = { type: 'blank', group: 'BLK' };
      } else {
        assignment = { type: 'empty' };
      }

      const updated = assignWell(prev, row, col, assignment);
      if (activeTool === 'standard' && current.type !== 'standard') {
        setNextStdIndex(i => i + 1);
      }
      return updated;
    });
    setResult(null);
  }, [activeTool, stdConcentrations, nextStdIndex]);

  const handleFitCurve = useCallback(() => {
    if (!plateData) { setError('Import plate data first'); return; }
    try {
      const r = analyze(plateData, layout);
      setResult(r);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [plateData, layout]);

  const handleExportCSV = useCallback(() => {
    if (!result) return;
    const csv = exportResultsCSV(result.wells);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elisalab-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const handleExportChart = useCallback(() => {
    const svg = document.querySelector('.chart-container svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'standard-curve.png';
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [theme]);

  const handleResetLayout = useCallback(() => {
    setLayout(createEmptyLayout());
    setNextStdIndex(0);
    setResult(null);
  }, []);

  // Prepare chart data
  let curveData: { x: number; y: number }[] = [];
  let stdPointsForChart: { concentration: number; od: number }[] = [];
  if (result) {
    curveData = getCurvePlotData(result.curveFit, 0.1, 2000, 200);
    if (plateData) {
      stdPointsForChart = getStandardPoints(layout, plateData, result.blankMean);
    }
  }

  return (
    <div className="app" data-theme={theme}>
      <Toolbar
        onImport={() => setShowPaste(true)}
        onFitCurve={handleFitCurve}
        onExportCSV={handleExportCSV}
        onExportChart={handleExportChart}
        onToggleTheme={toggleTheme}
        onResetLayout={handleResetLayout}
        theme={theme}
        activeTool={activeTool}
        onToolChange={setActiveTool}
        hasResult={!!result}
        hasData={!!plateData}
      />

      {error && (
        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className="legend">
        <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--std-color)' }} /> Standard</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--unk-color)' }} /> Unknown</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--blank-color)' }} /> Blank</span>
        <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--empty-color)', border: '1px solid var(--border)' }} /> Empty</span>
      </div>

      <PlateGrid
        layout={layout}
        plateData={plateData}
        onWellClick={handleWellClick}
      />

      <StandardEntry
        concentrations={stdConcentrations}
        onChange={setStdConcentrations}
      />

      <div className="panels">
        <div className="panel">
          <h3>Standard Curve</h3>
          {result ? (
            <>
              <StandardCurveChart
                curveData={curveData}
                standardPoints={stdPointsForChart}
              />
              <div className="fit-info">
                <strong>R² = {result.curveFit.rSquared.toFixed(4)}</strong> &nbsp;|&nbsp;
                A={result.curveFit.params.A.toFixed(3)},
                B={result.curveFit.params.B.toFixed(3)},
                C={result.curveFit.params.C.toFixed(3)},
                D={result.curveFit.params.D.toFixed(3)}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>
              Import data & assign wells, then click "Fit Curve"
            </p>
          )}
        </div>

        <div className="panel">
          <h3>Results</h3>
          {result ? (
            <ResultsTable groups={result.groups} />
          ) : (
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>
              No results yet
            </p>
          )}
        </div>
      </div>

      {showPaste && (
        <PasteDialog
          onSubmit={handlePaste}
          onCancel={() => setShowPaste(false)}
        />
      )}
    </div>
  );
}
