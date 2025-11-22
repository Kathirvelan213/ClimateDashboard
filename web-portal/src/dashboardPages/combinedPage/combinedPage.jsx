import CombinedChart from "./components/CombinedChart";

export function CombinedPage() {
  return (
    <div className="p-4 h-full w-full overflow-hidden flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Combined Variables (t2m) — Dashboard Charts</h2>

      <div
        className="
              grid gap-4 
              auto-rows-[minmax(300px,500px)]
              grid-cols-1 
              md:grid-cols-2 
              xl:grid-cols-3 
              2xl:grid-cols-3
              overflow-y-auto
              pr-2
              flex-grow
            ">
        <div className="bg-white rounded-xl shadow p-4">
          <CombinedChart />
        </div>
      </div>
    </div>
  );
}
