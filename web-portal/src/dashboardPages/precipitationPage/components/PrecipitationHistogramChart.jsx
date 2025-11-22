import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import { usePrecipitationAPI } from "../../../hooks/usePrecipitationAPI";

export default function PrecipitationHistogramChart() {
  const { yearsQuery, histogramDailyQuery } = usePrecipitationAPI();

  // Fetch available years
  const { data: years } = yearsQuery();

  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);

  // Fetch aggregated precipitation (daily totals)
  const { data: precips } = histogramDailyQuery(year, month);

  if (!precips) return <div>Loading precipitation histogram...</div>;
  if (precips.length === 0) return <div>No data</div>;

  // Process data
  const vals = precips
    .map((v) => Number(v))
    .filter((v) => !isNaN(v) && isFinite(v));

  if (vals.length === 0) return <div>No valid precipitation data</div>;

  const min = Math.min(...vals);
  const max = Math.max(...vals);

  const binCount = 20;
  const width = (max - min) / binCount || 1;

  const counts = new Array(binCount).fill(0);

  for (const v of vals) {
    let idx = Math.floor((v - min) / width);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    counts[idx]++;
  }

  const labels = counts.map(
    (_, i) =>
      `${(min + i * width).toFixed(1)} - ${(min + (i + 1) * width).toFixed(
        1
      )} mm`
  );

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-semibold mb-2">
        Precipitation Histogram (Daily Totals)
      </h3>

      {/* Filters */}
      <div className="flex gap-3 mb-3">
        {/* YEAR SELECT */}
        <select
          className="border rounded px-2 py-1"
          value={year ?? ""}
          onChange={(e) =>
            setYear(e.target.value === "" ? null : Number(e.target.value))
          }
        >
          <option value="">All Years</option>
          {years?.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* MONTH SELECT */}
        <select
          className="border rounded px-2 py-1"
          value={month ?? ""}
          onChange={(e) =>
            setMonth(e.target.value === "" ? null : Number(e.target.value))
          }
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* HISTOGRAM */}
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
  );
}
