import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { usePrecipitationAPI } from "../../../hooks/usePrecipitationAPI";
import { useQuery } from "@tanstack/react-query";

const API = "http://localhost:5000/api/precip";

export default function PrecipitationHeatmap() {
  const { histogramDailyQuery, yearsQuery } = usePrecipitationAPI();

  const { data: years } = yearsQuery();
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);

  // Fetch precip points (lat/lon/tp_mm)
  const { data: points } = useQuery({
    queryKey: ["precip_scatter_for_heatmap", year, month],
    queryFn: async () => {
      const qs = [];
      if (year) qs.push(`year=${year}`);
      if (month) qs.push(`month=${month}`);
      const url = `${API}/scatter?${qs.join("&")}`;
      const res = await fetch(url).then((r) => r.json());
      return res;
    },
  });

  const mapRef = useRef(null);
  const overlaysRef = useRef([]);

  // Create map once
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("precip-heatmap-map", {
        center: [0, 0],
        zoom: 2,
        minZoom: 2,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        mapRef.current
      );
    }
  }, []);

  // Render raster overlay
  useEffect(() => {
    if (!points || points.length === 0) return;

    overlaysRef.current.forEach((layer) => {
      try {
        mapRef.current.removeLayer(layer);
      } catch {}
    });
    overlaysRef.current = [];

    const lats = points.map((p) => p.latitude);
    const lons = points.map((p) => p.longitude);

    const bounds = [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ];

    const mapEl = document.getElementById("precip-heatmap-map");
    const width = mapEl.clientWidth;
    const height = 350;

    const q = [];
    if (year) q.push(`year=${year}`);
    if (month) q.push(`month=${month}`);
    q.push(`width=${width}`);
    q.push(`height=${height}`);
    q.push(`grid_cols=6`);
    q.push(`grid_rows=8`);
    const qs = "?" + q.join("&");

    fetch(`${API}/heat_raster${qs}`)
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const overlay = L.imageOverlay(url, bounds, { opacity: 0.85 }).addTo(
          mapRef.current
        );
        overlaysRef.current.push(overlay);
        overlay._url = url;

        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      });
  }, [points, year, month]);

  // Legend min/max
  const vals = points?.map((p) => p.tp_mm) ?? [];
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);

  return (
    <div className="w-full">
      <h3 className="font-semibold text-lg mb-2">Precipitation Heatmap</h3>

      {/* Filters */}
      <div className="flex gap-3 mb-3">
        <select
          className="border px-2 py-1 rounded"
          value={year || ""}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All</option>
          {years?.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <select
          className="border px-2 py-1 rounded"
          value={month || ""}
          onChange={(e) =>
            setMonth(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">All</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Map */}
      <div
        id="precip-heatmap-map"
        style={{
          height: "250px",
          width: "90%",
          borderRadius: 8,
          justifySelf: "center",
        }}
      />

      {/* Legend */}
      {vals.length > 0 && (
        <div className="mt-3 flex flex-col items-center w-full">
          <div className="w-full max-w-md flex items-center gap-3">
            <span className="text-sm font-medium">{minVal.toFixed(1)} mm</span>

            <div
              className="h-4 flex-grow rounded"
              style={{
                background:
                  "linear-gradient(to right, #313695, #4575b4, #74add1, #abd9e9, #fee090, #fdae61, #f46d43, #d73027, #a50026)",
              }}
            />

            <span className="text-sm font-medium">{maxVal.toFixed(1)} mm</span>
          </div>
        </div>
      )}
    </div>
  );
}
