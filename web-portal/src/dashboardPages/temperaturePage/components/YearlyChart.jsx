// src/temperaturePage/components/YearlyChart.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";

export default function YearlyChart() {
  const { yearlyQuery } = useTemperatureAPI();
  const { data: res, isLoading } = yearlyQuery();

  if (isLoading) return <div>Loading yearly chart...</div>;
  if (!res) return <div>No yearly data</div>;

  const labels = res.map((r) => String(r.year));
  const data = res.map((r) => Number(r.temp_c.toFixed(2)));

  return (
    <div>
      <h3 className="font-semibold mb-2">Yearly Average Temperature</h3>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Avg °C",
              data,
              borderColor: "rgb(75,192,192)",
              backgroundColor: "rgba(75,192,192,0.2)",
              tension: 0.2,
            },
          ],
        }}
        options={{ responsive: true, plugins: { legend: { position: "top" } } }}
      />
    </div>
  );
}
