// src/temperaturePage/components/MonthlyChart.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";

export default function MonthlyChart() {
  const { yearsQuery, monthlyQuery } = useTemperatureAPI();
  const { data: years, isLoading: yearsLoading } = yearsQuery();

  const [year, setYear] = useState(null);
  useEffect(() => {
    if (years && years.length && !year) setYear(years[0]);
  }, [years]);

  const { data: series, isLoading: seriesLoading } = monthlyQuery(year);

  if (yearsLoading) return <div>Loading years...</div>;
  if (!years || years.length === 0) return <div>No year data</div>;
  if (!year) return <div>Choose a year</div>;
  if (seriesLoading || !series) return <div>Loading monthly data...</div>;

  const labels = series.map((r) => String(r.month));
  const data = series.map((r) => (r.temp_c === null ? null : Number(r.temp_c.toFixed(2))));

  return (
    <div>
      <h3 className="font-semibold mb-2">Monthly Average Temperature — {year}</h3>

      <label className="text-sm block mb-2">
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

      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Avg °C",
              data,
              borderColor: "rgb(255,99,132)",
              backgroundColor: "rgba(255,99,132,0.2)",
              tension: 0.2,
            },
          ],
        }}
        options={{ responsive: true, scales: { x: { ticks: { autoSkip: false } } } }}
      />
    </div>
  );
}
