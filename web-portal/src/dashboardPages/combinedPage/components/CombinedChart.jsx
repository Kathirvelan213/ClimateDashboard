import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";

export default function CombinedChart() {
  const { yearsQuery, timeSeriesQuery } = useTemperatureAPI();

  const { data: years } = yearsQuery();

  const [freq, setFreq] = useState("yearly");
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(1);

  // initialize first year once available
  useEffect(() => {
    if (years && years.length > 0 && !year) {
      setYear(years[0]);
    }
  }, [years]);

  /** -----------------------------------------------------------
   *  Fetch time series data depending on frequency
   * ----------------------------------------------------------- */
  const vars = ["t2m_c", "d2m_c", "sp_hpa", "tcc"];

  let start = null;
  let end = null;

  if (freq === "monthly" && year) {
    start = `${year}-01-01`;
    end = `${year}-12-31`;
  }

  if (freq === "daily" && year && month) {
    const mm = String(month).padStart(2, "0");
    const last = new Date(year, month, 0).getDate();
    start = `${year}-${mm}-01`;
    end = `${year}-${mm}-${last}`;
  }

  const { data } = timeSeriesQuery({
    freq: freq === "yearly" ? "Y" : freq === "monthly" ? "M" : "D",
    start,
    end,
    vars,
  });

  if (!data) return <div>Loading combined chart...</div>;

  /** -----------------------------------------------------------
   *  Label formatting
   * ----------------------------------------------------------- */
  const labels =
    freq === "yearly"
      ? data.labels.map((d) => d.substring(0, 4))
      : freq === "monthly"
      ? data.labels.map((d) => d.substring(0, 7))
      : data.labels.map((d) => d.split("T")[0]);

  /** -----------------------------------------------------------
   *  Dataset styling
   * ----------------------------------------------------------- */
  const colors = {
    t2m_c: "rgb(255,99,132)",
    d2m_c: "rgb(75,192,192)",
    sp_hpa: "rgb(54,162,235)",
    tcc: "rgb(153,102,255)",
  };

  const axisMap = {
    t2m_c: "y",
    d2m_c: "y",
    sp_hpa: "y1", // separate axis
    tcc: "y",
  };

  const datasets = Object.keys(data.series).map((k) => ({
    label:
      {
        t2m_c: "Temperature (°C)",
        d2m_c: "Dew Point (°C)",
        sp_hpa: "Surface Pressure (hPa)",
        tcc: "Cloud Cover (%)",
      }[k] || k,
    data: data.series[k],
    yAxisID: axisMap[k] || "y",
    borderColor: colors[k],
    backgroundColor: colors[k] + "33",
    tension: 0.25,
    spanGaps: true,
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-3">
        Combined Variables — {freq}
      </h3>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        <label>
          Frequency:
          <select
            value={freq}
            onChange={(e) => setFreq(e.target.value)}
            className="ml-2 border px-2 py-1 rounded"
          >
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>
        </label>

        {freq !== "yearly" && (
          <label>
            Year:
            <select
              value={year || ""}
              onChange={(e) => setYear(Number(e.target.value))}
              className="ml-2 border px-2 py-1 rounded"
            >
              {years?.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        )}

        {freq === "daily" && (
          <label>
            Month:
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="ml-2 border px-2 py-1 rounded"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* CHART */}
      <div className="h-[350px] w-full">
  <Line
    data={{ labels, datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: "linear",
              position: "left",
              title: { display: true, text: "Temperature / Dew Point / Cloud" },
            },
            y1: {
              type: "linear",
              position: "right",
              grid: { drawOnChartArea: false },
              title: { display: true, text: "Surface Pressure (hPa)" },
            },
          },
        }}
      />
      </div>
    </div>
  );
}
