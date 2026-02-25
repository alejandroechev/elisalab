import { useState } from 'react';
import { sampleDatasets } from '../samples/index.js';
import { FeedbackModal } from './FeedbackModal';
import type { FitModel } from '@elisalab/engine';

interface Props {
  onImport: () => void;
  onFitCurve: () => void;
  onToggleTheme: () => void;
  onResetLayout: () => void;
  onLoadSample: (index: number) => void;
  theme: 'light' | 'dark';
  hasData: boolean;
  fitModel: FitModel;
  onFitModelChange: (model: FitModel) => void;
}

export default function Toolbar({
  onImport, onFitCurve,
  onToggleTheme, onResetLayout, onLoadSample, theme,
  hasData, fitModel, onFitModelChange,
}: Props) {
  const [showFeedback, setShowFeedback] = useState(false);
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

      <select
        value={fitModel}
        onChange={e => onFitModelChange(e.target.value as FitModel)}
        data-testid="model-select"
        style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--fg)', fontSize: '0.85rem' }}
      >
        <option value="4pl">4PL</option>
        <option value="5pl">5PL</option>
      </select>

      <button className="btn-cta" onClick={onFitCurve} disabled={!hasData}>▶ Fit Curve</button>

      <div className="toolbar-right">
        <button onClick={() => window.open('/intro.html', '_blank')} title="Domain guide">📖 Guide</button>
        <button onClick={() => setShowFeedback(true)} title="Feedback">💬 Feedback</button>
        <a className="github-link" href="https://github.com/alejandroechev/elisalab" target="_blank" rel="noopener noreferrer">GitHub</a>
        <button onClick={onToggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
      </div>
      {showFeedback && <FeedbackModal product="ElisaLab" onClose={() => setShowFeedback(false)} />}
    </div>
  );
}
