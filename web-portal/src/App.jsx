import "./App.css";
import Tabs from "./assets/Tabs";
import TemperaturePage from "./dashboardPages/temperaturePage/temperaturePage";
import { CombinedPage } from "./dashboardPages/combinedPage/combinedPage";
import "./assets/chartSetup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PrecipitationPage from "./dashboardPages/precipitationPage/precipitationPage";
import HypothesisPage from "./dashboardPages/hypothesisPage/HypothesisPage";
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
              label: "Precipitation",
              content: <PrecipitationPage />,
            },
            {
              label: "Combined",
              content: <CombinedPage />,
            },
            {
              label: "Hypothesis Testing",
              content: <HypothesisPage />,
            },
          ]}
        />
      </div>
    </QueryClientProvider>
  );
}
