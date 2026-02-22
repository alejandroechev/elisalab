import { sampleDatasets } from '../samples/index.js';

interface Props {
  onImport: () => void;
  onFitCurve: () => void;
  onToggleTheme: () => void;
  onResetLayout: () => void;
  onLoadSample: (index: number) => void;
  theme: 'light' | 'dark';
  hasData: boolean;
}

export default function Toolbar({
  onImport, onFitCurve,
  onToggleTheme, onResetLayout, onLoadSample, theme,
  hasData,
}: Props) {
  return (
    <div className="toolbar">
      <h1>🧪 ElisaLab</h1>

      <button onClick={onImport}>📋 Import Plate</button>

      <select
        value=""
        onChange={e => { if (e.target.value !== '') onLoadSample(Number(e.target.value)); }}
        style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--fg)', fontSize: '0.85rem' }}
      >
        <option value="">📂 Samples</option>
        {sampleDatasets.map((s, i) => (
          <option key={i} value={i}>{s.name}</option>
        ))}
      </select>

      <button onClick={onResetLayout}>🔄 Reset</button>
      <button className="btn-cta" onClick={onFitCurve} disabled={!hasData}>▶ Fit Curve</button>

      <div className="toolbar-right">
        <button onClick={() => window.open('/intro.html', '_blank')} title="Domain guide">📖 Guide</button>
        <button onClick={() => window.open('https://github.com/alejandroechev/elisalab/issues/new', '_blank')} title="Feedback">💬 Feedback</button>
        <button onClick={onToggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
      </div>
    </div>
  );
}
