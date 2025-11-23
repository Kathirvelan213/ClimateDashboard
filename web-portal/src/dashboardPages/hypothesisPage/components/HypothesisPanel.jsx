import { useEffect, useState } from "react";
import "./hypothesis.css";


export default function HypothesisPanel({ year, month }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHypothesis = async () => {
    if (!year) return;

    setLoading(true);
    setError(null);

    try {
      let url = `http://localhost:5000/api/hypothesis/cloud_vs_temp?year=${year}`;

      // Only send month if it exists
      if (month !== null && month !== undefined) {
        url += `&month=${month}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || "Failed to fetch hypothesis result");
        setData(null);
      } else {
        setData(json);
      }

    } catch (err) {
      console.error(err);
      setError("Server connection failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHypothesis();
  }, [year, month]);

  if (loading) {
    return <div className="hypothesis-panel">Running hypothesis test...</div>;
  }

  if (error) {
    return (
      <div className="hypothesis-panel error">
        <h3>Hypothesis Test</h3>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="hypothesis-panel">No data yet...</div>;
  }

  return (
    <div className="hypothesis-panel">
      <b>Hypothesis: Cloud Cover vs Temperature</b>
      <br/>
      <br/>

      <div className="hypothesis-theory">
        <p><strong>H₀:</strong> {data.null_hypothesis}</p>
        <p><strong>H₁:</strong> {data.alt_hypothesis}</p>
      </div>
        <br/>
      <div className="hypothesis-results">
        <p><strong>{data.group1_label} Mean:</strong> {data.group1_mean.toFixed(2)} °C</p>
        <p><strong>{data.group2_label} Mean:</strong> {data.group2_mean.toFixed(2)} °C</p>
        <br/>
        <p><strong>T-statistic:</strong> {data.t_statistic.toFixed(4)}</p>
        <p><strong>P-value:</strong> {data.p_value.toFixed(6)}</p>
      </div>
        <br/>

      <div
        className={`hypothesis-decision ${
          data.decision === "Reject H0" ? "reject" : "accept"
        }`}
      >
        <h3>Decision: {data.decision}</h3>
        <p>
          {data.decision === "Reject H0"
            ? "Cloud cover significantly affects temperature."
            : "No significant evidence that cloud cover affects temperature."}
        </p>
      </div>
    </div>
  );
}
