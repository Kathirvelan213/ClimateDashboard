// src/pages/TemperaturePage.jsx
import React from "react";

import TrendChart from "./components/TrendChart";
import RollingAverages from "./components/RollingAverages";
import DiurnalChart from "./components/DiurnalChart";
import CloudScatter from "./components/CloudScatter";
import HistogramChart from "./components/HistogramChart";
import BoxPlot from "./components/BoxPlot";
import MapHeatmap from "./components/MapHeatMap";

export default function TemperaturePage() {
  return (
    <div className="p-1 h-[100%] w-full  flex flex-col">
      <h2 className="text-xl font-semibold flex-none text-orange-700">
        Temperature — Dashboard Charts
      </h2>

      {/* 3 equal columns */}
      <div className="flex flex-grow gap-4 ">

        {/* ───────────────── Column 1 (2 charts) ───────────────── */}
        <div className="flex flex-col gap-4 flex-grow-[4] basis-0 h-full">
          <DashboardCard className="flex-grow basis-1/2">
            <RollingAverages />
          </DashboardCard>

          <DashboardCard className="flex-grow basis-1/2">
            <DiurnalChart />
          </DashboardCard>
        </div>

        {/* ───────────────── Column 2 (3 charts) ───────────────── */}
        <div className="flex flex-col gap-4 flex-grow-[3] basis-0 h-full">
          <DashboardCard className="flex-grow basis-3/8">
            <TrendChart />
          </DashboardCard>

          <DashboardCard className="flex-grow basis-2/8">
            <CloudScatter />
          </DashboardCard>

          <DashboardCard className="flex-grow basis-3/8">
            <HistogramChart />
          </DashboardCard>
        </div>

        {/* ───────────────── Column 3 (2 charts) ───────────────── */}
        <div className="flex flex-col gap-4 flex-grow-[4] basis-0 h-full">
          <DashboardCard className="flex-grow basis-1/2">
            <MapHeatmap />
          </DashboardCard>

          <DashboardCard className="flex-grow basis-1/2">
            <BoxPlot />
          </DashboardCard>
        </div>

      </div>
    </div>
  );
}

/* Reusable card */
function DashboardCard({ children, className }) {
  return (
    <div className={`bg-white rounded-xl shadow flex flex-col min-h-0 ${className}`}>
      <div className="flex-grow min-h-0">{children}</div>
    </div>
  );
}
