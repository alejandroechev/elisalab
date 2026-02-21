import { PlateLayout, PlateData, ROWS, COLS, wellName } from '@elisalab/engine';

interface Props {
  layout: PlateLayout;
  plateData: PlateData | null;
  onWellClick: (row: number, col: number) => void;
}

export default function PlateGrid({ layout, plateData, onWellClick }: Props) {
  const colHeaders = Array.from({ length: COLS }, (_, i) => i + 1);
  const rowHeaders = 'ABCDEFGH'.split('');

  return (
    <div className="plate-grid-container">
      <div className="plate-grid">
        <div /> {/* empty top-left corner */}
        {colHeaders.map(c => (
          <div key={c} className="col-header">{c}</div>
        ))}
        {rowHeaders.map((rLabel, r) => (
          <>
            <div key={`rh-${r}`} className="row-header">{rLabel}</div>
            {colHeaders.map((_, c) => {
              const assignment = layout.assignments[r][c];
              const od = plateData?.values[r][c];
              return (
                <div
                  key={wellName(r, c)}
                  className="well"
                  data-type={assignment.type}
                  onClick={() => onWellClick(r, c)}
                  title={`${wellName(r, c)} ${assignment.type}${assignment.concentration ? ` (${assignment.concentration})` : ''}${od !== undefined ? ` OD=${od.toFixed(3)}` : ''}`}
                >
                  {od !== undefined ? od.toFixed(2) : (assignment.group ?? '')}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
