import { useState } from "react";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";

export default function BoxPlot() {
  const { boxplotQuery, yearsQuery } = useTemperatureAPI();

  const { data: years } = yearsQuery();
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);

  const { data: stats } = boxplotQuery(year, month);

  if (!stats) return <div>Loading boxplot...</div>;

  // If backend returned "no data"
  if (!stats.q1 || !stats.q2 || !stats.q3) {
    return <div>No boxplot data for this selection</div>;
  }

  const outliers = stats.outliers ?? []; // ✅ SAFETY FIX

  const width = 400;
  const height = 140;
  const padding = 30;

  const minVal = Math.min(stats.lower_whisker, stats.q1) - 2;
  const maxVal = Math.max(stats.upper_whisker, stats.q3) + 2;

  const scale = (v) =>
    padding + ((v - minVal) / (maxVal - minVal)) * (width - padding * 2);

  return (
    <div className="w-full h-full justify-self-center">
      <h3 className="font-semibold text-lg">
        Box Plot — {year || "All Years"} {month ? `- ${month}` : ""}
      </h3>

      {/* Filters */}
      <div className="flex gap-3 mb-3 ">
        <select
          className="border px-2 py-1 rounded"
          value={year || ""}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All</option>
          {years?.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <select
          className="border px-2 py-1 rounded"
          value={month || ""}
          onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Boxplot */}
      <svg width={width} height={height} className="border border-gray-200 rounded justify-self-center">
        <line
          x1={scale(stats.lower_whisker)}
          x2={scale(stats.upper_whisker)}
          y1={height / 2}
          y2={height / 2}
          stroke="#444"
          strokeWidth={2}
        />

        <rect
          x={scale(stats.q1)}
          y={height / 2 - 20}
          width={Math.max(2, scale(stats.q3) - scale(stats.q1))}
          height={40}
          fill="rgba(100,150,240,0.4)"
          stroke="#333"
        />

        <line
          x1={scale(stats.q2)}
          x2={scale(stats.q2)}
          y1={height / 2 - 20}
          y2={height / 2 + 20}
          stroke="#222"
          strokeWidth={2}
        />

        <line
          x1={scale(stats.lower_whisker)}
          x2={scale(stats.lower_whisker)}
          y1={height / 2 - 10}
          y2={height / 2 + 10}
          stroke="#222"
        />
        <line
          x1={scale(stats.upper_whisker)}
          x2={scale(stats.upper_whisker)}
          y1={height / 2 - 10}
          y2={height / 2 + 10}
          stroke="#222"
        />

        {/* Outliers — now ALWAYS safe */}
        {outliers.map((o, i) => (
          <circle
            key={i}
            cx={scale(o.temp_c)}
            cy={height / 2 + 35}
            r={3}
            fill="red"
          />
        ))}

        <text x={padding} y={height - 4} fontSize={10}>
          {minVal.toFixed(1)}°C
        </text>
        <text x={width - padding - 20} y={height - 4} fontSize={10}>
          {maxVal.toFixed(1)}°C
        </text>
      </svg>

      {/* Outliers list — safe */}
      <div className="mt-3">
        <strong>Outliers (showing {outliers.length}):</strong>
        <ul className="max-h-[200px] overflow-auto list-disc ml-5">
          {outliers.map((o, i) => (
            <li key={i}>
              {o.valid_time} — {o.temp_c.toFixed(2)}°C @ {o.latitude.toFixed(3)},
              {o.longitude.toFixed(3)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
