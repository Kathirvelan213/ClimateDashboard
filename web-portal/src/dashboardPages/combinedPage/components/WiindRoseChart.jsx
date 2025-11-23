// src/components/WindRoseChart.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { PolarArea } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const SECTORS = [
  "N", "NNE", "NE", "ENE",
  "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW",
  "W", "WNW", "NW", "NNW"
];

export default function WindRoseChart() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [points, setPoints] = useState(null);

  // Fetch available years (same as your temp charts)
  useEffect(() => {
    fetch("http://localhost:5000/api/temperature/years")
      .then((res) => res.json())
      .then((json) => {
        setYears(json);
        setSelectedYear(json[0]); // default first year
      });
  }, []);

  // Fetch wind direction data when year or month changes
  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;

    fetch(`http://localhost:5000/api/temperature/wind_direction?year=${selectedYear}&month=${selectedMonth}`)
      .then((res) => res.json())
      .then((json) => setPoints(json))
      .catch((err) => console.error("Wind rose fetch error:", err));
  }, [selectedYear, selectedMonth]);

  const bins = useMemo(() => {
    if (!points) return null;

    // 16-sector binning
    const arr = Array(16).fill(0);
    points.forEach((p) => {
      const idx = Math.floor(p.wind_dir / 22.5) % 16;
      arr[idx] += 1;
    });
    return arr;
  }, [points]);

  if (!years.length)
    return (
      <div className="w-full h-[400px] bg-white rounded-xl shadow p-4 flex items-center justify-center">
        Loading years…
      </div>
    );

  const data = {
    labels: SECTORS,
    datasets: [
      {
        label: "Wind Direction Frequency",
        data: bins || [],
        backgroundColor: SECTORS.map((_, i) =>
          `hsla(${i * 22.5}, 70%, 55%, 0.75)`
        ),
        borderColor: "#333",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.15)" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.raw} samples`,
        },
      },
    },
  };

  return (
    <div className="w-full h-[450px] bg-white rounded-xl shadow p-4">
      <h3 className="text-xl font-semibold text-center mb-4">Wind Rose</h3>

      {/* YEAR + MONTH SELECTORS */}
      <div className="flex gap-4 justify-center mb-4">
        {/* Year selector */}
        <select
          className="border rounded px-2 py-1"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Month selector */}
        <select
          className="border rounded px-2 py-1"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Actual chart */}
      <div className="h-[320px]">
        {!bins ? (
          <div className="text-center text-gray-500 mt-20">Loading wind rose…</div>
        ) : (
          <PolarArea data={data} options={options} />
        )}
      </div>
    </div>
  );
}
