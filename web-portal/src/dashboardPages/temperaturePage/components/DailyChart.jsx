// src/temperaturePage/components/DailyChart.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";

export default function DailyChart() {
  const { yearsQuery, dailyQuery } = useTemperatureAPI();
  const { data: years, isLoading: yearsLoading } = yearsQuery();

  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(1);

  useEffect(() => {
    if (years && years.length && !year) setYear(years[0]);
  }, [years]);

  const { data: series, isLoading: seriesLoading } = dailyQuery(year, month);

  if (yearsLoading) return <div>Loading years...</div>;
  if (!years || years.length === 0) return <div>No year data</div>;
  if (!year) return <div>Choose a year</div>;
  if (seriesLoading || !series) return <div>Loading daily data...</div>;

  const labels = series.map((r) => String(r.day));
  const data = series.map((r) => (r.temp_c === null ? null : Number(r.temp_c.toFixed(2))));

  return (
    <div>
      <h3 className="font-semibold mb-2">Daily Avg Temperature — {year}-{String(month).padStart(2, "0")}</h3>

      <div className="flex gap-3 mb-3 text-sm">
        <label>
          Year:
          <select
            className="ml-2 px-2 py-1 border rounded"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label>
          Month:
          <select
            className="ml-2 px-2 py-1 border rounded"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Avg °C",
              data,
              borderColor: "rgb(54,162,235)",
              backgroundColor: "rgba(54,162,235,0.2)",
              tension: 0.2,
            },
          ],
        }}
        options={{ responsive: true, scales: { x: { ticks: { autoSkip: false } } } }}
      />
    </div>
  );
}
