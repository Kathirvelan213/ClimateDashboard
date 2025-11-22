// src/pages/TemperaturePage.jsx
import React from "react";

import MonthlyChart from "./components/MonthlyChart";
import DailyChart from "./components/DailyChart";
import YearlyChart from "./components/YearlyChart";
import RollingAverages from "./components/RollingAverages";
import DiurnalChart from "./components/DiurnalChart";
import CloudScatter from "./components/CloudScatter";
import HistogramChart from "./components/HistogramChart";
import BoxPlot from "./components/BoxPlot";
import MapHeatmap from "./components/MapHeatMap";

export default function TemperaturePage() {
  return (
    <div className="p-4 h-full w-full overflow-hidden flex flex-col">
      <h2 className="text-xl font-semibold mb-4">
        Temperature (t2m) — Dashboard Charts
      </h2>

      <div
        className="
          grid gap-4 
          auto-rows-[minmax(300px,_1fr)]
          grid-cols-1 
          md:grid-cols-2 
          xl:grid-cols-3 
          2xl:grid-cols-3
          overflow-y-auto
          pr-2
          flex-grow
        "
      >
        <div className="bg-white rounded-xl shadow p-4">
          <RollingAverages />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <DiurnalChart />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <YearlyChart />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <MonthlyChart />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <DailyChart />
        </div>


        <div className="bg-white rounded-xl shadow p-4">
          <CloudScatter />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <HistogramChart />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <MapHeatmap />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <BoxPlot />
        </div>
      </div>
    </div>
  );
}
