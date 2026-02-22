import { useState, useCallback, useEffect } from 'react';
import {
  PlateData, PlateLayout, AnalysisResult,
  createEmptyLayout, assignWell, WellAssignment,
  parsePlateData, analyze, exportResultsCSV, getCurvePlotData,
  COLS, getStandardPoints,
} from '@elisalab/engine';
import { sampleDatasets } from './samples/index.js';
import PlateGrid from './components/PlateGrid.js';
import StandardCurveChart from './components/StandardCurveChart.js';
import ResultsTable from './components/ResultsTable.js';
import Toolbar from './components/Toolbar.js';
import PasteDialog from './components/PasteDialog.js';
import StandardEntry from './components/StandardEntry.js';

type WellTool = 'standard' | 'unknown' | 'blank' | 'empty';

function loadTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('elisalab-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* ignore */ }
  return 'light';
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);
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
  const [selectedWells, setSelectedWells] = useState<Set<string>>(new Set());

  useEffect(() => {
    try { localStorage.setItem('elisalab-theme', theme); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  const handleWellClick = useCallback((row: number, col: number, shiftKey: boolean) => {
    const key = `${row},${col}`;
    setSelectedWells(prev => {
      const next = new Set(shiftKey ? prev : [key]);
      if (shiftKey) {
        if (next.has(key)) next.delete(key); else next.add(key);
      }
      return next;
    });
  }, []);

  const handleWellDragOver = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    setSelectedWells(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const handleApplyRole = useCallback((role: WellTool) => {
    setActiveTool(role);
    if (selectedWells.size === 0) return;

    setLayout(prev => {
      let updated = prev;
      let stdIdx = nextStdIndex;
      const wells = Array.from(selectedWells).map(k => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      });

      for (const { r, c } of wells) {
        let assignment: WellAssignment;
        if (role === 'standard') {
          const conc = stdConcentrations[stdIdx % stdConcentrations.length] ?? 100;
          const group = `S${stdIdx + 1}`;
          assignment = { type: 'standard', concentration: conc, group };
          stdIdx++;
        } else if (role === 'unknown') {
          assignment = { type: 'unknown', group: `U${r * COLS + c + 1}` };
        } else if (role === 'blank') {
          assignment = { type: 'blank', group: 'BLK' };
        } else {
          assignment = { type: 'empty' };
        }
        updated = assignWell(updated, r, c, assignment);
      }

      if (role === 'standard') setNextStdIndex(stdIdx);
      return updated;
    });

    setResult(null);
    setSelectedWells(new Set());
  }, [selectedWells, stdConcentrations, nextStdIndex]);

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

  const handleExportChartPNG = useCallback(() => {
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

  const handleExportChartSVG = useCallback(() => {
    const svg = document.querySelector('.chart-container svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'standard-curve.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleResetLayout = useCallback(() => {
    setLayout(createEmptyLayout());
    setNextStdIndex(0);
    setResult(null);
    setSelectedWells(new Set());
  }, []);

  const handleLoadSample = useCallback((index: number) => {
    const sample = sampleDatasets[index];
    if (!sample) return;
    setPlateData(sample.plateData);
    setLayout(sample.layout);
    setStdConcentrations(sample.standardConcentrations);
    setNextStdIndex(sample.standardConcentrations.length);
    setResult(null);
    setError(null);
    setSelectedWells(new Set());
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
        onToggleTheme={toggleTheme}
        onResetLayout={handleResetLayout}
        onLoadSample={handleLoadSample}
        theme={theme}
        hasData={!!plateData}
      />

      {error && <div className="error-banner">{error}</div>}

      <div className="main-layout">
        <div className="plate-section">
          <div className="legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--std-color)' }} /> Standard</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--unk-color)' }} /> Unknown</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--blank-color)' }} /> Blank</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--empty-color)', border: '1px solid var(--border)' }} /> Empty</span>
          </div>

          <div className="role-selector" data-testid="role-selector">
            <span style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>Assign role:</span>
            <button className={activeTool === 'standard' ? 'active' : ''} onClick={() => handleApplyRole('standard')}>🔵 Standard</button>
            <button className={activeTool === 'unknown' ? 'active' : ''} onClick={() => handleApplyRole('unknown')}>🟢 Unknown</button>
            <button className={activeTool === 'blank' ? 'active' : ''} onClick={() => handleApplyRole('blank')}>⚪ Blank</button>
            <button className={activeTool === 'empty' ? 'active' : ''} onClick={() => handleApplyRole('empty')}>❌ Clear</button>
            {selectedWells.size > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
                {selectedWells.size} well{selectedWells.size > 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          <PlateGrid
            layout={layout}
            plateData={plateData}
            onWellClick={handleWellClick}
            onWellDragOver={handleWellDragOver}
            selectedWells={selectedWells}
          />

          <StandardEntry
            concentrations={stdConcentrations}
            onChange={setStdConcentrations}
          />
        </div>

        <div className="results-section">
          <div className="panel">
            <div className="panel-header">
              <h3>Standard Curve</h3>
              {result && (
                <div className="export-inline">
                  <button onClick={handleExportChartPNG} title="Export as PNG">🖼️ PNG</button>
                  <button onClick={handleExportChartSVG} title="Export as SVG">📐 SVG</button>
                </div>
              )}
            </div>
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
                Import data &amp; assign wells, then click "▶ Fit Curve"
              </p>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Results</h3>
              {result && (
                <div className="export-inline">
                  <button onClick={handleExportCSV} title="Export as CSV">💾 CSV</button>
                </div>
              )}
            </div>
            {result ? (
              <ResultsTable groups={result.groups} />
            ) : (
              <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>
                No results yet
              </p>
            )}
          </div>
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
