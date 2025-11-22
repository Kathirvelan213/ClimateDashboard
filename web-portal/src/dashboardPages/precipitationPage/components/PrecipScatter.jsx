import { Scatter } from "react-chartjs-2";
import { usePrecipitationAPI } from "../../../hooks/usePrecipitationAPI";
import { useEffect, useState } from "react";

export default function PrecipScatterCloud() {
  const { yearsQuery } = usePrecipitationAPI();
  const { data: years } = yearsQuery();

  const [year, setYear] = useState(null);
  const [points, setPoints] = useState(null);

  // Pick first available year
  useEffect(() => {
    if (years && years.length > 0 && !year) {
      setYear(years[0]);
    }
  }, [years]);

  // Load precipitation vs cloud scatter
  useEffect(() => {
    if (!year) return;

    async function load() {
      const res = await fetch(
        `http://localhost:5000/api/precip/scatter?year=${year}`
      );
      const arr = await res.json();

      // Filtering: both tp_mm and tcc must exist
      const filtered = arr
        .filter(
          (p) =>
            p.tp_mm !== null &&
            !isNaN(p.tp_mm) &&
            p.tcc !== null &&
            !isNaN(p.tcc)
        )
        .map((p) => ({
          x: p.tcc,    // Cloud cover 0–1
          y: p.tp_mm,  // Precipitation mm
        }));

      setPoints(filtered);
    }

    load();
  }, [year]);

  if (!points) return <div>Loading precipitation vs cloud cover...</div>;

  const chartData = {
    datasets: [
      {
        label: "Precipitation vs Cloud Cover",
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
        title: { display: true, text: "Cloud Cover (0–1)" },
        min: 0,
        max: 1,
      },
      y: {
        title: { display: true, text: "Total Precipitation (mm)" },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow w-full h-full justify-content-center p-3">
      <h3 className="text-lg font-semibold">
        Precipitation vs Cloud Cover
      </h3>

      {years && (
        <label className="block mb-2">
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

      <div className="h-[100%] w-[100%] justify-self-center">
        <Scatter data={chartData} options={options} />
      </div>
    </div>
  );
}
