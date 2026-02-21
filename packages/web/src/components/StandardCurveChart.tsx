import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ComposedChart,
} from 'recharts';

interface Props {
  curveData: { x: number; y: number }[];
  standardPoints: { concentration: number; od: number }[];
}

export default function StandardCurveChart({ curveData, standardPoints }: Props) {
  // Convert standard points to chart format
  const scatterData = standardPoints.map(p => ({ x: p.concentration, y: p.od }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="x"
            type="number"
            scale="log"
            domain={['auto', 'auto']}
            label={{ value: 'Concentration', position: 'bottom', offset: 15 }}
            tick={{ fontSize: 11 }}
            allowDataOverflow
          />
          <YAxis
            dataKey="y"
            label={{ value: 'OD', angle: -90, position: 'insideLeft', offset: -5 }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number) => value.toFixed(4)}
            labelFormatter={(label: number) => `Conc: ${label.toFixed(2)}`}
          />
          <Line
            data={curveData}
            dataKey="y"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="4PL Fit"
            isAnimationActive={false}
          />
          <Scatter
            data={scatterData}
            fill="#ef4444"
            name="Standards"
            shape="circle"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
