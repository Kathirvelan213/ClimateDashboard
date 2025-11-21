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
            label: "Home",
            content: <TemperaturePage/>,
          },
          {
            label: "Profile",
            content: "profile",
          },
          {
            label: "Settings",
            content: "settings",
          },
        ]}
      />
    </>
  );
}

export default App;
