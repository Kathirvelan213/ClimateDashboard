const API = "http://localhost:5000/api/precip";

export const precipitationAPI = {
  fetchYears: async () => (await fetch(`${API}/years`)).json(),

  fetchYearly: async () => (await fetch(`${API}/yearly`)).json(),

  fetchMonthly: async (year) => (await fetch(`${API}/monthly?year=${year}`)).json(),

  fetchDaily: async (year, month) => (await fetch(`${API}/daily?year=${year}&month=${month}`)).json(),

  fetchHistogram: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    return (await fetch(`${API}/histogram?${qs.join("&")}`)).json();
  },

  fetchScatter: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    const raw = await fetch(`${API}/scatter?${qs.join("&")}`).then((r) => r.json());
    return raw.map((p) => ({
      x: p.longitude,
      y: p.tp_mm,
    }));
  },

  fetchBoxPlot: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    return (await fetch(`${API}/boxplot?${qs.join("&")}`)).json();
  },
  fetchHistogramDaily: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    return (await fetch(`${API}/histogram_daily?${qs.join("&")}`)).json();
  },
  fetchTimeSeries: async ({ freq, start, end, vars }) => {
    const qs = [];
    if (freq) qs.push(`freq=${freq}`);
    if (start) qs.push(`start=${start}`);
    if (end) qs.push(`end=${end}`);
    if (vars) qs.push(`vars=${vars.join(",")}`);
    const q = qs.length ? `?${qs.join("&")}` : "";

    const raw = await fetch(`${API}/timeseries${q}`).then((r) => r.json());

    const labels = raw.map((r) => r.timestamp);
    const varsList = Object.keys(raw[0] || {}).filter((k) => k !== "timestamp");
    const series = {};
    varsList.forEach((v) => (series[v] = raw.map((r) => r[v])));

    return { labels, series };
  },
};
