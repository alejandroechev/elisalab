import { useRef, useCallback } from 'react';
import { PlateLayout, PlateData, COLS, wellName } from '@elisalab/engine';

interface Props {
  layout: PlateLayout;
  plateData: PlateData | null;
  onWellClick: (row: number, col: number, shiftKey: boolean) => void;
  onWellDragOver: (row: number, col: number) => void;
  selectedWells: Set<string>;
}

export default function PlateGrid({ layout, plateData, onWellClick, onWellDragOver, selectedWells }: Props) {
  const colHeaders = Array.from({ length: COLS }, (_, i) => i + 1);
  const rowHeaders = 'ABCDEFGH'.split('');
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    onWellClick(r, c, e.shiftKey);
  }, [onWellClick]);

  const handleMouseEnter = useCallback((r: number, c: number) => {
    if (isDragging.current) onWellDragOver(r, c);
  }, [onWellDragOver]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div className="plate-grid-container" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
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
              const isSelected = selectedWells.has(`${r},${c}`);
              return (
                <div
                  key={wellName(r, c)}
                  className={`well${isSelected ? ' selected' : ''}`}
                  data-type={assignment.type}
                  onMouseDown={e => handleMouseDown(r, c, e)}
                  onMouseEnter={() => handleMouseEnter(r, c)}
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
