import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";

export default function HistogramChart() {
  const { histogramQuery, yearsQuery } = useTemperatureAPI();

  const { data: years } = yearsQuery();

  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);

  const { data: temps } = histogramQuery(year, month);

  if (!temps) return <div>Loading histogram...</div>;
  if (temps.length === 0) return <div>No data</div>;

  // compute bins
  const vals = temps.map((v) => Number(v));
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  const binCount = 20;
  const width = (max - min) / binCount || 1;
  const counts = new Array(binCount).fill(0);

  for (const v of vals) {
    let idx = Math.floor((v - min) / width);
    if (idx >= binCount) idx = binCount - 1;
    counts[idx]++;
  }

  const labels = counts.map((_, i) => `${(min + i * width).toFixed(1)} - ${(min + (i + 1) * width).toFixed(1)}`);

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-semibold mb-2">Temperature Histogram</h3>

      {/* Filters */}
      <div className="flex gap-3 mb-3">
        {/* Year */}
        <select className="border rounded px-2 py-1" value={year || ""} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}>
          <option value="">All Years</option>
          {years?.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Month */}
        <select className="border rounded px-2 py-1" value={month || ""} onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}>
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option value={m} key={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Frequency",
                data: counts,
                backgroundColor: "rgba(153,102,255,0.6)",
              },
            ],
          }}
          options={{
            plugins: { legend: { display: false } },
            responsive: true,
          }}
        />
      </div>
    </div>
  );
}
