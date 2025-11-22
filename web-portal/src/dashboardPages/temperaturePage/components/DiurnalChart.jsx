import { Line } from "react-chartjs-2";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";
import { useEffect, useState } from "react";

export default function DiurnalChart() {
  const { yearsQuery } = useTemperatureAPI();
  const { data: years } = yearsQuery();

  const [year, setYear] = useState(null);
  const [data, setData] = useState(null);

  const HOURS = [0, 6, 12, 18];
  const COLORS = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3"];

  useEffect(() => {
    if (years && years.length > 0 && !year) {
      setYear(years[0]);
    }
  }, [years]);

  useEffect(() => {
    if (!year) return;

    async function fetchAllMonths() {
      const labels = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
      const hourly = { 0: [], 6: [], 12: [], 18: [] };

      for (let m = 1; m <= 12; m++) {
        const res = await fetch(
          `http://localhost:5000/api/temperature/diurnal?year=${year}&month=${m}&hours=0,6,12,18`
        );
        const arr = await res.json();

        // Convert list → {hour: value} map
        const mapped = {};
        arr.forEach((o) => (mapped[o.hour] = o.t2m_c));

        HOURS.forEach((h) => {
          hourly[h].push(mapped[h] ?? null);
        });
      }

      setData({ labels, hourly });
    }

    fetchAllMonths();
  }, [year]);

  if (!data) return <div>Loading diurnal chart...</div>;

  const chartData = {
    labels: data.labels,
    datasets: HOURS.map((h, index) => ({
      label: `${h}:00`,
      data: data.hourly[h],
      borderColor: COLORS[index],
      backgroundColor: COLORS[index] + "33",
      fill: false,
      tension: 0.3,
    })),
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow w-full h-full">
      <h3 className="text-lg font-semibold mb-3">
        Diurnal Pattern by Month ({year})
      </h3>

      {years && (
        <label className="mb-2 block">
          Year:&nbsp;
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      )}

      <div>
        <Line data={chartData} />
      </div>
    </div>
  );
}
