import { useState } from "react";
import "./App.css";
import Tabs from "./assets/Tabs";
import TemperaturePage from "./dashboardPages/temperaturePage/temperaturePage";
import { CombinedPage } from "./dashboardPages/combinedPage/combinedPage";
import "./assets/chartSetup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RollingAverages from "./dashboardPages/temperaturePage/components/RollingAverages";
const client = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <div className="w-full flex flex-col">
        {/* <div className="w-[500px]">
          <RollingAverages />
        </div> */}

      <Tabs
        tabs={[
          {
            label: "Temperature",
            content: <TemperaturePage/>,
          },
          {
            label: "Tab2",
            content: <CombinedPage />,
          },
          {
            label: "Tab3",
            content: "Tab3",
          },
        ]}
      />
</div>

    </QueryClientProvider>
  );
}