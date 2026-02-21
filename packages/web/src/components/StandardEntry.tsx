interface Props {
  concentrations: number[];
  onChange: (concs: number[]) => void;
}

export default function StandardEntry({ concentrations, onChange }: Props) {
  const handleChange = (index: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const next = [...concentrations];
    next[index] = num;
    onChange(next);
  };

  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <h3>Standard Concentrations</h3>
      <div className="std-entry" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {concentrations.map((c, i) => (
          <div key={i} className="std-row">
            <label>S{i + 1}:</label>
            <input
              type="number"
              value={c}
              onChange={e => handleChange(i, e.target.value)}
              step="any"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
