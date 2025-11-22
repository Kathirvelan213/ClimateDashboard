// src/temperaturePage/components/PrecipitationTrendChart.jsx
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { usePrecipitationAPI } from "../../../hooks/usePrecipitationAPI";

export default function PrecipitationTrendChart() {
  const { yearsQuery, yearlyQuery, monthlyQuery, dailyQuery } =
    usePrecipitationAPI();

  // ─────────────────────────────────────────────
  // BASIC STATE
  // ─────────────────────────────────────────────
  const [granularity, setGranularity] = useState("yearly");
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(1);

  // COMPARISON
  const [compareMode, setCompareMode] = useState(false);

  // For monthly comparison: pick 2nd year
  const [compareYear, setCompareYear] = useState(null);

  // For daily comparison: pick 2nd month
  const [compareMonth, setCompareMonth] = useState(1);

  // ─────────────────────────────────────────────
  // API QUERIES
  // ─────────────────────────────────────────────
  const { data: years, isLoading: yearsLoading } = yearsQuery();

  const {
    data: yearlySeries,
    isLoading: yearlyLoading,
  } = yearlyQuery();

  const {
    data: monthlySeries,
    isLoading: monthlyLoading,
  } = monthlyQuery(year);

  const {
    data: dailySeries,
    isLoading: dailyLoading,
  } = dailyQuery(year, month);

  // Comparison dataset queries:
  const { data: monthlySeries2 } = monthlyQuery(
    compareMode && granularity === "monthly" ? compareYear : null
  );

  const { data: dailySeries2 } = dailyQuery(
    year,
    compareMode && granularity === "daily" ? compareMonth : null
  );

  // Set initial year
  useEffect(() => {
    if (Array.isArray(years) && years.length && year === null) {
      setYear(years[0]);
      setCompareYear(years[0]); // default compare year
    }
  }, [years, year]);

  // ─────────────────────────────────────────────
  // DERIVED DATA FOR THE CHART (precipitation)
  // ─────────────────────────────────────────────
  const derived = useMemo(() => {
    // YEARLY — no comparison
    if (granularity === "yearly") {
      if (yearlyLoading || !yearlySeries) return { loading: true };

      const labels = yearlySeries.map((r) => String(r.year));
      const data = yearlySeries.map((r) =>
        r.tp_mm === null ? null : Number(Number(r.tp_mm).toFixed(2))
      );

      return {
        loading: false,
        labels,
        datasets: [
          {
            label: "Avg mm (Yearly)",
            data,
            borderColor: "rgb(75,192,192)",
            backgroundColor: "rgba(75,192,192,0.2)",
            tension: 0.2,
          },
        ],
        title: "Yearly Average Precipitation",
        xTitle: "Year",
      };
    }

    // MONTHLY (1–12)
    if (granularity === "monthly") {
      if (yearsLoading || monthlyLoading || !monthlySeries)
        return { loading: true };

      const labels = monthlySeries.map((r) => String(r.month));

      const datasets = [
        {
          label: `Avg mm — ${year}`,
          data: monthlySeries.map((r) =>
            r.tp_mm === null ? null : Number(Number(r.tp_mm).toFixed(2))
          ),
          borderColor: "rgb(255,99,132)",
          backgroundColor: "rgba(255,99,132,0.2)",
          tension: 0.2,
        },
      ];

      // add compare line
      if (compareMode && monthlySeries2) {
        datasets.push({
          label: `Avg mm — ${compareYear}`,
          data: monthlySeries2.map((r) =>
            r.tp_mm === null ? null : Number(Number(r.tp_mm).toFixed(2))
          ),
          borderColor: "rgb(54,162,235)",
          backgroundColor: "rgba(54,162,235,0.2)",
          tension: 0.2,
        });
      }

      return {
        loading: false,
        labels,
        datasets,
        title: `Monthly Average Precipitation (Comparison ${year}${
          compareMode ? ` vs ${compareYear}` : ""
        })`,
        xTitle: "Month",
      };
    }

    // DAILY (1–31)
    if (granularity === "daily") {
      if (yearsLoading || dailyLoading || !dailySeries) return { loading: true };

      const labels = dailySeries.map((r) => String(r.day));

      const datasets = [
        {
          label: `Avg mm — ${year}-${String(month).padStart(2, "0")}`,
          data: dailySeries.map((r) =>
            r.tp_mm === null ? null : Number(Number(r.tp_mm).toFixed(2))
          ),
          borderColor: "rgb(255,159,64)",
          backgroundColor: "rgba(255,159,64,0.3)",
          tension: 0.2,
        },
      ];

      if (compareMode && dailySeries2) {
        datasets.push({
          label: `Avg mm — ${year}-${String(compareMonth).padStart(2, "0")}`,
          data: dailySeries2.map((r) =>
            r.tp_mm === null ? null : Number(Number(r.tp_mm).toFixed(2))
          ),
          borderColor: "rgb(75,192,192)",
          backgroundColor: "rgba(75,192,192,0.3)",
          tension: 0.2,
        });
      }

      return {
        loading: false,
        labels,
        datasets,
        title: `Daily Precipitation (Comparison ${year}-${String(month).padStart(
          2,
          "0"
        )}${compareMode ? ` vs ${year}-${String(compareMonth).padStart(2, "0")}` : ""})`,
        xTitle: "Day",
      };
    }

    return { loading: true };
  }, [
    granularity,
    year,
    month,
    compareMode,
    compareYear,
    compareMonth,
    yearlySeries,
    monthlySeries,
    monthlySeries2,
    dailySeries,
    dailySeries2,
    yearlyLoading,
    monthlyLoading,
    dailyLoading,
    yearsLoading,
  ]);

  // ─────────────────────────────────────────────
  // CHART CONFIG
  // ─────────────────────────────────────────────
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: derived.title || "Precipitation",
      },
    },
    scales: {
      x: {
        title: { display: true, text: derived.xTitle },
        ticks: {
          autoSkip: granularity === "yearly",
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        title: { display: true, text: "Precipitation (mm)" },
      },
    },
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  if (yearsLoading) return <div>Loading years...</div>;
  if (!years || years.length === 0) return <div>No year data</div>;

  return (
    <div className="p-2 justify-content-center bg-white rounded-xl shadow w-full">
      <h2 className="text-lg font-semibold mb-3">Precipitation — Trend Chart</h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {/* Granularity */}
        <label className="text-sm">
          Granularity:
          <select
            className="ml-2 px-2 py-1 border rounded"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
          >
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>
        </label>

        {/* Compare Mode */}
        {(granularity === "monthly" || granularity === "daily") && (
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
            />
            Compare two lines
          </label>
        )}

        {/* YEAR selector (monthly + daily) */}
        {granularity !== "yearly" && (
          <label className="text-sm">
            Year:
            <select
              className="ml-2 px-2 py-1 border rounded"
              value={year ?? ""}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* MONTH selector (daily only) */}
        {granularity === "daily" && (
          <label className="text-sm">
            Month:
            <select
              className="ml-2 px-2 py-1 border rounded"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* MONTHLY compare: select second year */}
        {granularity === "monthly" && compareMode && (
          <label className="text-sm">
            Compare Year:
            <select
              className="ml-2 px-2 py-1 border rounded"
              value={compareYear ?? ""}
              onChange={(e) => setCompareYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* DAILY compare: select second month */}
        {granularity === "daily" && compareMode && (
          <label className="text-sm">
            Compare Month:
            <select
              className="ml-2 px-2 py-1 border rounded"
              value={compareMonth}
              onChange={(e) => setCompareMonth(Number(e.target.value))}
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

      {/* Chart */}
      <div style={{ height: "100%" }}>
        {derived.loading ? (
          <div>Loading data...</div>
        ) : (
          <Line
            key={`${granularity}-${year}-${month}-${compareMode}-${compareYear}-${compareMonth}`}
            data={{ labels: derived.labels, datasets: derived.datasets }}
            options={chartOptions}
          />
        )}
      </div>
    </div>
  );
}
