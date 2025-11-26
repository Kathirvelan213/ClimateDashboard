import { useState } from "react";
import HypothesisPanel from "./components/HypothesisPanel";
import "./components/hypothesis.css";

function HypothesisPage() {
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(null);

  const [target, setTarget] = useState("t2m_c");   // Temperature by default
  const [feature, setFeature] = useState("tcc");   // Cloud cover by default

  return (
    <div className="hypothesis-page">
      <h1>Weather Hypothesis Testing Dashboard</h1>

      {/* CONTROL BAR */}
      <div className="controls-bar">

        {/* YEAR */}
        <div>
          <label>Year:</label>
          <select onChange={e => setYear(Number(e.target.value))} value={year}>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>

        {/* MONTH */}
        <div>
          <label>Month:</label>
          <select
            onChange={e => {
              const val = e.target.value;
              setMonth(val === "all" ? null : Number(val));
            }}
          >
            <option value="all">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>

        {/* TARGET VARIABLE */}
        <div>
          <label>Target Variable:</label>
          <select value={target} onChange={e => setTarget(e.target.value)}>
            <option value="t2m_c">Temperature (°C)</option>
            <option value="tp_mm">Precipitation (mm)</option>
          </select>
        </div>

        {/* FEATURE VARIABLE */}
        <div>
          <label>Compare Against:</label>
          <select value={feature} onChange={e => setFeature(e.target.value)}>
            <option value="tcc">Cloud Cover</option>
            <option value="u10">Wind U Component</option>
            <option value="v10">Wind V Component</option>
            <option value="wind_speed">Wind Speed</option>
            <option value="d2m_c">Dew Point</option>
            <option value="sp_hpa">Surface Pressure</option>
            <option value="slt">Soil Type</option>
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="hypothesis-layout">

        {/* LEFT PANEL */}
        <div className="left-panel">
          <HypothesisPanel
            year={year}
            month={month}
            target={target}
            feature={feature}
          />
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <h2>Understanding the Hypothesis Test</h2>

          <p>
            This test splits the <b>{feature}</b> variable into low and high groups
            using its 30th and 70th percentiles.
          </p>

          <p>
            Then we compare the mean <b>{target}</b> values using a T-Test.
          </p>

          <div className="formula-box">
            <code>
              t = (x̄₁ − x̄₂) / √( (s₁² / n₁) + (s₂² / n₂) )
            </code>
          </div>

          <ul>
            <li><b>x̄₁</b>: Mean {target} for low {feature}</li>
            <li><b>x̄₂</b>: Mean {target} for high {feature}</li>
            <li><b>s₁²</b>: Variance in low group</li>
            <li><b>s₂²</b>: Variance in high group</li>
            <li><b>n₁, n₂</b>: Sample sizes</li>
          </ul>

          <p>
            A smaller P-value means stronger evidence that {feature} affects {target}.
          </p>
        </div>

      </div>
    </div>
  );
}

export default HypothesisPage;
