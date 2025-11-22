import BoxPlotTP from "./components/BoxPlotTP";
import PrecipitationDiurnalChart from "./components/PrecipitationDiurnalChart";
import PrecipitationHeatmap from "./components/PrecipitationHeatmap";
import PrecipitationHistogramChart from "./components/PrecipitationHistogramChart";
import PrecipitationRollingAverages from "./components/PrecipitationRollingAverages";
import PrecipitationTrendChart from "./components/PrecipitationTrendChart";
import PrecipScatter from "./components/PrecipScatter";

export default function PrecipitationPage() {
  return (
    <div className="grid grid-rows-2 grid-cols-3 gap-4 h-[95%] justify-self-center justify-content-center p-4 overflow-hidden w-[85%]">
      <DashboardCard><PrecipitationTrendChart /></DashboardCard>
      <DashboardCard><PrecipitationRollingAverages /></DashboardCard>
      <DashboardCard><PrecipitationHeatmap /></DashboardCard>
      <DashboardCard><PrecipitationHistogramChart /></DashboardCard>
      <DashboardCard><PrecipScatter /></DashboardCard>
      <DashboardCard><PrecipitationDiurnalChart /></DashboardCard>
    </div>
  );
}

function DashboardCard({ children, className }) {
  return (
    <div className={`bg-white rounded-xl shadow flex flex-col overflow-hidden h-full ${className}`}>
      <div className="flex-grow h-full">{children}</div>
    </div>
  );
}

