import { sampleDatasets } from '../samples/index.js';

interface Props {
  onImport: () => void;
  onFitCurve: () => void;
  onExportCSV: () => void;
  onExportChart: () => void;
  onToggleTheme: () => void;
  onResetLayout: () => void;
  onLoadSample: (index: number) => void;
  theme: 'light' | 'dark';
  activeTool: string;
  onToolChange: (tool: any) => void;
  hasResult: boolean;
  hasData: boolean;
}

export default function Toolbar({
  onImport, onFitCurve, onExportCSV, onExportChart,
  onToggleTheme, onResetLayout, onLoadSample, theme, activeTool, onToolChange,
  hasResult, hasData,
}: Props) {
  return (
    <div className="toolbar">
      <h1>🧪 ElisaLab</h1>

      <button onClick={onImport}>📋 Import Plate</button>

      <select
        value=""
        onChange={e => { if (e.target.value !== '') onLoadSample(Number(e.target.value)); }}
        style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--fg)', fontSize: '0.85rem' }}
      >
        <option value="">📂 Samples</option>
        {sampleDatasets.map((s, i) => (
          <option key={i} value={i}>{s.name}</option>
        ))}
      </select>

      <select
        value={activeTool}
        onChange={e => onToolChange(e.target.value)}
        style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--fg)', fontSize: '0.85rem' }}
      >
        <option value="standard">🔵 Standard</option>
        <option value="unknown">🟢 Unknown</option>
        <option value="blank">⚪ Blank</option>
        <option value="empty">❌ Clear</option>
      </select>

      <button onClick={onResetLayout}>🔄 Reset</button>
      <button onClick={onFitCurve} disabled={!hasData}>📈 Fit Curve</button>
      <button onClick={onExportCSV} disabled={!hasResult}>💾 CSV</button>
      <button onClick={onExportChart} disabled={!hasResult}>🖼️ Chart PNG</button>
      <button onClick={() => window.open('/intro.html', '_blank')} title="Domain guide">📖 Guide</button>
      <button onClick={() => window.open('https://github.com/alejandroechev/elisalab/issues/new', '_blank')} title="Feedback">💬 Feedback</button>
      <button onClick={onToggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
    </div>
  );
}
