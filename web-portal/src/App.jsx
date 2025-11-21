import { useState } from "react";
import "./App.css";
import Tabs from "./assets/Tabs";
import TemperaturePage from "./dashboardPages/temperaturePage/temperaturePage";

function App() {
  return (
    <>
      <Tabs
        tabs={[
          {
            label: "Temperature",
            content: <TemperaturePage/>,
          },
          {
            label: "Tab2",
            content: "Tab2",
          },
          {
            label: "Tab3",
            content: "Tab3",
          },
        ]}
      />
    </>
  );
}

export default App;
