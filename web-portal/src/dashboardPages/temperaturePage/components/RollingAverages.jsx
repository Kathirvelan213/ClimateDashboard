import { Line } from "react-chartjs-2";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";
import { useState, useEffect } from "react";

export default function RollingAverages() {
  const { yearsQuery, timeSeriesQuery } = useTemperatureAPI();

  const { data: years } = yearsQuery();
  const [year, setYear] = useState(null);

  useEffect(() => {
    if (years && years.length > 0 && !year) {
      setYear(years[0]);
    }
  }, [years]);

  const start = year ? `${year}-01-01` : null;
  const end = year ? `${year}-12-31` : null;

  const { data, isLoading } = timeSeriesQuery({
    freq: "D",
    start,
    end,
    vars: ["t2m_c"],
  });

  if (isLoading || !data) return <div>Loading...</div>;

  if (!data.labels || !data.series || !data.series.t2m_c) {
    console.error("RollingAverages error: unexpected data format", data);
    return <div>Error loading data</div>;
  }

  const labels = data.labels.map((ts) => ts.split("T")[0]);
  const temps = data.series.t2m_c;

  // Rolling average helper
  const rolling = (arr, windowSize) => {
    return arr.map((_, i) => {
      const slice = arr.slice(Math.max(0, i - windowSize + 1), i + 1);
      const valid = slice.filter((v) => v !== null);
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    });
  };

  // Compute all 3 windows
  const r7 = rolling(temps, 7);
  const r14 = rolling(temps, 14); // ✅ FIXED — ADDED BACK
  const r30 = rolling(temps, 30);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Daily Temp (°C)",
        data: temps,
        borderColor: "rgb(255,99,132)",
        backgroundColor: "rgba(255,99,132,0.2)",
        tension: 0.3,
      },
      {
        label: "7-day Rolling Avg",
        data: r7,
        borderColor: "rgb(54,162,235)",
        backgroundColor: "rgba(54,162,235,0.2)",
        tension: 0.3,
      },
      {
        label: "14-day Rolling Avg",  // ✅ FIXED
        data: r14,
        borderColor: "rgb(255,159,64)",
        backgroundColor: "rgba(255,159,64,0.2)",
        tension: 0.3,
      },
      {
        label: "30-day Rolling Avg",
        data: r30,
        borderColor: "rgb(75,192,192)",
        backgroundColor: "rgba(75,192,192,0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="w-full h-full p-4 bg-white rounded-xl shadow justify-center ">
      <h3 className="text-lg font-semibold mb-3">Rolling Averages — {year}</h3>

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

      <div style={{ height: '100%' }}>
        <Line data={chartData} />
      </div>
    </div>
  );
}
