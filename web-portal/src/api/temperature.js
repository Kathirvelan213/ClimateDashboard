const API = "http://localhost:5000/api/temperature";

export const temperatureAPI = {
  fetchYears: async () => {
    const r = await fetch(`${API}/years`);
    return r.json();
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

  fetchYearly: async () => {
    const r = await fetch(`${API}/yearly`);
    return r.json();
  },

  fetchMonthly: async (year) => {
    const r = await fetch(`${API}/monthly?year=${year}`);
    return r.json();
  },

  fetchDaily: async (year, month) => {
    const r = await fetch(`${API}/daily?year=${year}&month=${month}`);
    return r.json();
  },

  fetchDiurnal: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    const q = qs.length ? `?${qs.join("&")}` : "";
    const r = await fetch(`${API}/diurnal${q}`);
    return r.json();
  },

  fetchHistogram: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    const q = qs.length ? `?${qs.join("&")}` : "";
    const r = await fetch(`${API}/histogram${q}`);
    return r.json();
  },

  fetchScatter: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    const q = qs.length ? `?${qs.join("&")}` : "";
    const r = await fetch(`${API}/scatter${q}`).then((r) => r.json());

    return r.map((p) => ({
      x: p.tcc ?? p.latitude,
      y: p.t2m_c,
    }));
  },

  fetchBoxPlot: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    const q = qs.length ? `?${qs.join("&")}` : "";
    const r = await fetch(`${API}/boxplot${q}`);
    return r.json();
  },

  fetchHeatmap: async (year, month) => {
    const qs = [];
    if (year) qs.push(`year=${year}`);
    if (month) qs.push(`month=${month}`);
    const q = qs.length ? `?${qs.join("&")}` : "";
    const r = await fetch(`${API}/heatmap${q}`);
    return r.json();
  },
};
