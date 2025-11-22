import { Line } from "react-chartjs-2";
import { usePrecipitationAPI } from "../../../hooks/usePrecipitationAPI";
import { useState, useEffect } from "react";

export default function PrecipitationRollingAverages() {
  const { yearsQuery, timeSeriesQuery } = usePrecipitationAPI();

  const { data: years } = yearsQuery();
  const [year, setYear] = useState(null);

  // Auto-select first year
  useEffect(() => {
    if (years && years.length > 0 && !year) {
      setYear(years[0]);
    }
  }, [years]);

  const start = year ? `${year}-01-01` : null;
  const end = year ? `${year}-12-31` : null;

  // Fetch daily precipitation
  const { data, isLoading } = timeSeriesQuery({
    freq: "D",
    start,
    end,
    vars: ["tp_mm"], // key difference
  });

  if (isLoading || !data) return <div>Loading...</div>;

  if (!data.labels || !data.series || !data.series.tp_mm) {
    console.error("PrecipRolling error: unexpected format", data);
    return <div>Error loading data</div>;
  }

  const labels = data.labels.map((ts) => ts.split("T")[0]);
  const precips = data.series.tp_mm;

  // Rolling average helper
  const rolling = (arr, windowSize) => {
    return arr.map((_, i) => {
      const slice = arr.slice(Math.max(0, i - windowSize + 1), i + 1);
      const valid = slice.filter((v) => v !== null);
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    });
  };

  // 7–14–30 day rolling averages (same as temperature)
  const r7 = rolling(precips, 7);
  const r14 = rolling(precips, 14);
  const r30 = rolling(precips, 30);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Daily Precip (mm)",
        data: precips,
        borderColor: "rgb(0,122,255)",
        backgroundColor: "rgba(0,122,255,0.2)",
        tension: 0.3,
      },
      {
        label: "7-day Rolling Avg",
        data: r7,
        borderColor: "rgb(34,197,94)",
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.3,
      },
      {
        label: "14-day Rolling Avg",
        data: r14,
        borderColor: "rgb(249,115,22)",
        backgroundColor: "rgba(249,115,22,0.2)",
        tension: 0.3,
      },
      {
        label: "30-day Rolling Avg",
        data: r30,
        borderColor: "rgb(168,85,247)",
        backgroundColor: "rgba(168,85,247,0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="w-full h-full p-4 bg-white rounded-xl shadow justify-center">
      <h3 className="text-lg font-semibold mb-3">
        Precipitation Rolling Averages — {year}
      </h3>

      {/* Year selector */}
      {years && (
        <label className="mb-2 block">
          Year:&nbsp;
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      )}

      <div style={{ height: "100%" }}>
        <Line data={chartData} />
      </div>
    </div>
  );
}
