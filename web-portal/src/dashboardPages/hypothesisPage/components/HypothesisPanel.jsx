import { useEffect, useState } from "react";
import "./hypothesis.css";

export default function HypothesisPanel({ year, month, target, feature }) {

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHypothesis = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `http://localhost:5000/api/hypothesis/general?year=${year}&target=${target}&feature=${feature}`;

      if (month !== null) {
        url += `&month=${month}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || "Hypothesis test failed");
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
  }, [year, month, target, feature]);

  if (loading) return <div className="hypothesis-panel">Running hypothesis test...</div>;

  if (error)
    return (
      <div className="hypothesis-panel error">
        <h3>Hypothesis Test</h3>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );

  if (!data) return <div className="hypothesis-panel">No results yet...</div>;

  return (
    <div className="hypothesis-panel">

      <h3>Hypothesis Test Results</h3>

      <div className="hypothesis-theory">
        <p><strong>H₀:</strong> {data.null_hypothesis}</p>
        <p><strong>H₁:</strong> {data.alt_hypothesis}</p>
      </div>

      <br />

      <div className="hypothesis-results">
        <p><strong>Low {feature} threshold:</strong> {data.low_threshold.toFixed(3)}</p>
        <p><strong>High {feature} threshold:</strong> {data.high_threshold.toFixed(3)}</p>

        <br />

        <p><strong>Low Group Mean:</strong> {data.group_low_mean.toFixed(3)}</p>
        <p><strong>High Group Mean:</strong> {data.group_high_mean.toFixed(3)}</p>

        <br />

        <p><strong>T-statistic:</strong> {data.t_statistic.toFixed(4)}</p>
        <p><strong>P-value:</strong> {data.p_value.toFixed(6)}</p>
      </div>

      <br />

      <div className={`hypothesis-decision ${data.decision === "Reject H0" ? "reject" : "accept"}`}>
        <h3>Decision: {data.decision}</h3>
        <p>
          {data.decision === "Reject H0"
            ? `${feature} significantly affects ${target}`
            : `No significant effect of ${feature} on ${target}`}
        </p>
      </div>

    </div>
  );
}
