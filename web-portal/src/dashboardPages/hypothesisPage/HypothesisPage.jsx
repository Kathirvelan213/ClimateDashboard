import { useState } from "react";
import HypothesisPanel from "./components/HypothesisPanel";
import "./components/hypothesis.css";
function HypothesisPage() {
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(null);

  return (
    <div className="hypothesis-page">
      <h1>Weather Hypothesis Testing Dashboard</h1>

      {/* CONTROL BAR */}
      <div className="controls-bar">
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

        <div>
          <label>Month:</label>
          <select
            onChange={e => {
              const value = e.target.value;
              setMonth(value === "all" ? null : Number(value));
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
      </div>

      {/* MAIN LAYOUT */}
      <div className="hypothesis-layout">

        {/* LEFT: RESULTS */}
        <div className="left-panel">
          <HypothesisPanel year={year} month={month} />
        </div>

        {/* RIGHT: THEORY / EXPLANATION */}
        <div className="right-panel">
          <h2>Understanding the T-Test</h2>

          <p>
            The t-statistic measures how different two group means are,
            compared to how much the data varies.
          </p>

          <h3>Formula:</h3>

          <div className="formula-box">
            <code>
              t = (x̄₁ − x̄₂) / √( (s₁² / n₁) + (s₂² / n₂) )
            </code>
          </div>

          <h3>What each term means in your dashboard:</h3>

          <ul>
            <li><b>x̄₁</b> → Mean temperature for <b>low cloud cover</b> days</li>
            <li><b>x̄₂</b> → Mean temperature for <b>high cloud cover</b> days</li>
            <li><b>s₁²</b> → Variance of temperature in low cloud group</li>
            <li><b>s₂²</b> → Variance of temperature in high cloud group</li>
            <li><b>n₁</b> → Number of low cloud samples</li>
            <li><b>n₂</b> → Number of high cloud samples</li>
          </ul>

          <h3>Interpretation</h3>
          <p>
            The numerator (<b>x̄₁ − x̄₂</b>) tells us how far apart the two averages are.
          </p>

          <p>
            The denominator shows how much random variation exists in the data.
            If the difference between means is large compared to the noise,
            then the t-statistic becomes large in magnitude.
          </p>

          <p>
            A large |t| leads to a small p-value — meaning the difference 
            is unlikely to be caused by random chance.
          </p>
        </div>

      </div>
    </div>
  );
}

export default HypothesisPage;
