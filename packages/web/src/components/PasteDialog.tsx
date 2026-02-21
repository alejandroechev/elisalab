import { useState } from 'react';

interface Props {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export default function PasteDialog({ onSubmit, onCancel }: Props) {
  const [text, setText] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(reader.result as string);
    reader.readAsText(file);
  };

  return (
    <div className="paste-dialog" onClick={onCancel}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12 }}>Import Plate Data</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginBottom: 8 }}>
          Paste 8×12 OD values (tab or comma separated) or upload a CSV file.
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste 8 rows × 12 columns of OD values..."
        />
        <div className="dialog-actions">
          <input type="file" accept=".csv,.txt,.tsv" onChange={handleFile} />
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={() => onSubmit(text)} disabled={!text.trim()}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
