import { useState } from "react";
import "./App.css";
import Tabs from "./assets/Tabs";
import TemperaturePage from "./dashboardPages/temperaturePage/temperaturePage";
import { CombinedPage } from "./dashboardPages/combinedPage/combinedPage";
import "./assets/chartSetup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RollingAverages from "./dashboardPages/temperaturePage/components/RollingAverages";
import PrecipitationPage from "./dashboardPages/precipitationPage/precipitationPage";
const client = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <div className="w-full h-[100vh] flex flex-col justify-self-center">
        <Tabs
          tabs={[
            {
              label: "Temperature",
              content: <TemperaturePage />,
            },
            {
              label: "Tab2",
              content: <PrecipitationPage />,
            },
            {
              label: "Tab3",
              content: <CombinedPage />,
            },
          ]}
        />
      </div>
    </QueryClientProvider>
  );
}
