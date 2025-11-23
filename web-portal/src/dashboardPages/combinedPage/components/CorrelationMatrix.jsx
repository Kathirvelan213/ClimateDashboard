// src/components/CorrelationMatrix.jsx
import React, { useEffect, useState, useMemo } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  MatrixController,
  MatrixElement,
  Tooltip,
  Legend
);

export default function CorrelationMatrix() {
  const [variables, setVariables] = useState([]);
  const [matrix, setMatrix] = useState([]);

  // Fetch correlation matrix
  useEffect(() => {
    fetch("http://localhost:5000/api/temperature/correlation")
      .then((res) => res.json())
      .then((json) => {
        setVariables(json.variables || []);
        setMatrix(json.matrix || []);
      });
  }, []);

  // Heatmap datapoints (build on every render, hook-safe)
  const dataPoints = useMemo(() => {
    if (!variables.length || !matrix.length) return [];

    const points = [];

    for (let i = 0; i < variables.length; i++) {
      for (let j = 0; j < variables.length; j++) {
        let v = matrix[i][j];

        // handle bad values
        if (!Number.isFinite(v)) v = 0;

        const r = v > 0 ? Math.floor(v * 255) : 0;
        const b = v < 0 ? Math.floor(-v * 255) : 0;

        points.push({
          x: variables[j],    // x-axis label
          y: variables[i],    // y-axis label
          v,
          backgroundColor: `rgba(${r},0,${b},0.75)`
        });
      }
    }

    return points;
  }, [variables, matrix]);

  // Chart dataset (STATIC cell size → avoids distortion)
 const data = {
  datasets: [
    {
      label: "Correlation",
      data: dataPoints,
      parsing: false,
      width: () => 32,
      height: () => 32,

      // 🔥 THE MISSING PIECE
      backgroundColor: (ctx) => ctx.raw.backgroundColor,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.1)"
    }
  ]
};

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (ctx) => {
            const r = ctx[0].raw.y;
            const c = ctx[0].raw.x;
            return `${r} vs ${c}`;
          },
          label: (ctx) => `Correlation: ${ctx.raw.v.toFixed(3)}`
        }
      }
    },
    scales: {
      x: {
        type: "category",
        labels: variables,
        offset: true,
        position: "top",
        grid: { display: false },
        ticks: {
          minRotation: 90,
          maxRotation: 90
        }
      },
      y: {
        type: "category",
        labels: variables,
        offset: true,
        reverse: true, // IMPORTANT: makes matrix oriented correctly
        grid: { display: false }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl  w-full justify-items-center" >
      <h3 className="text-xl font-semibold mb-4 text-center">Correlation Heatmap</h3>

      {!variables.length ? (
        <div className="text-center text-gray-500 mt-20">Loading correlation…</div>
      ) : (
        <div className="aspect-square w-[350px]">
          <Chart type="matrix" data={data} options={options} />
        </div>
      )}
    </div>
  );
}
