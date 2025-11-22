import { Scatter } from "react-chartjs-2";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";
import { useEffect, useState } from "react";

export default function CloudScatter() {
  const { yearsQuery } = useTemperatureAPI();
  const { data: years } = yearsQuery();

  const [year, setYear] = useState(null);
  const [points, setPoints] = useState(null);

  useEffect(() => {
    if (years && years.length > 0 && !year) {
      setYear(years[0]);
    }
  }, [years]);

  useEffect(() => {
    if (!year) return;

    async function load() {
      const res = await fetch(
        `http://localhost:5000/api/temperature/cloud_scatter?year=${year}`
      );
      const arr = await res.json();

      // remove null cloud values
      const filtered = arr
        .filter((p) => p.tcc !== null && !isNaN(p.tcc))
        .map((p) => ({
          x: p.tcc,
          y: p.t2m_c,
        }));

      setPoints(filtered);
    }

    load();
  }, [year]);

  if (!points) return <div>Loading cloud vs temp...</div>;

  const chartData = {
    datasets: [
      {
        label: "Cloud Cover vs Temperature",
        data: points,
        pointRadius: 3,
        backgroundColor: "rgba(31,119,180,0.8)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        title: { display: true, text: "Total Cloud Cover (0–1)" },
        min: 0,
        max: 1,
      },
      y: {
        title: { display: true, text: "Temperature (°C)" },
      },
    },
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow w-full">
      <h3 className="text-lg font-semibold mb-3">Cloud Cover vs Temperature</h3>

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

      <div style={{ height: 300 }}>
        <Scatter data={chartData} options={options} />
      </div>
    </div>
  );
}
