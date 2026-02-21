import { GroupResult } from '@elisalab/engine';
import { useState } from 'react';

interface Props {
  groups: GroupResult[];
}

type SortKey = 'group' | 'type' | 'meanOD' | 'meanConcentration' | 'cv' | 'recovery' | 'flag';

export default function ResultsTable({ groups }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('group');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...groups].sort((a, b) => {
    let va: any = a[sortKey] ?? '';
    let vb: any = b[sortKey] ?? '';
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
      <table className="results-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('group')}>Group{arrow('group')}</th>
            <th onClick={() => handleSort('type')}>Type{arrow('type')}</th>
            <th onClick={() => handleSort('meanOD')}>Mean OD{arrow('meanOD')}</th>
            <th onClick={() => handleSort('meanConcentration')}>Conc.{arrow('meanConcentration')}</th>
            <th onClick={() => handleSort('cv')}>CV%{arrow('cv')}</th>
            <th onClick={() => handleSort('recovery')}>Recovery%{arrow('recovery')}</th>
            <th onClick={() => handleSort('flag')}>Flag{arrow('flag')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(g => (
            <tr key={g.group} className={g.flag ? 'flagged' : ''}>
              <td>{g.group}</td>
              <td>{g.type}</td>
              <td>{g.meanOD.toFixed(4)}</td>
              <td>{g.meanConcentration !== undefined ? g.meanConcentration.toFixed(2) : '—'}</td>
              <td>{g.cv.toFixed(1)}</td>
              <td>{g.recovery !== undefined ? g.recovery.toFixed(1) : '—'}</td>
              <td className="flag">{g.flag ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
