import CombinedChart from "./components/CombinedChart";
import CorrelationChart from "./components/CorrelationMatrix";
import WindDirectionChart from "./components/WiindRoseChart";

export function CombinedPage() {
  return (
    <div className="grid grid-rows-2 grid-cols-2 gap-4 h-[95%] justify-self-center justify-content-center p-4 overflow-hidden w-[85%] justify-self-center">
      <DashboardCard><CombinedChart /></DashboardCard>
      <DashboardCard><CorrelationChart /></DashboardCard>
      <div className="col-span-2">
      <WindDirectionChart year={2023} month={1} />
      </div>
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
