import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTemperatureAPI } from "../../../hooks/useTemperatureAPI";

const API = "http://localhost:5000/api/temperature";

export default function MapHeatmap() {
  const { heatmapQuery, yearsQuery } = useTemperatureAPI();

  const { data: years } = yearsQuery();
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);

  const { data: points } = heatmapQuery(year, month);

  const mapRef = useRef(null);
  const overlaysRef = useRef([]);

  // Create map once
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("heatmap-map", {
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

    const mapEl = document.getElementById("heatmap-map");
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
        const overlay = L.imageOverlay(url, bounds, { opacity: 0.8 }).addTo(
          mapRef.current
        );
        overlaysRef.current.push(overlay);
        overlay._url = url;

        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      });
  }, [points, year, month]);

  // Compute min/max for legend
  const temps = points?.map((p) => p.temp_c) ?? [];
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  return (
    <div className="w-full">
      <h3 className="font-semibold text-lg mb-2">Temperature Heatmap</h3>

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
          onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Map */}
      <div
        id="heatmap-map"
        style={{ height: "250px", width: "90%", borderRadius: 8, justifySelf: "center" }}
      />

      {/* Horizontal Legend */}
      {temps.length > 0 && (
        <div className="mt-3 flex flex-col items-center w-full">
          <div className="w-full max-w-md flex items-center gap-3">
            <span className="text-sm font-medium">
              {minTemp.toFixed(1)}°C
            </span>

            <div
              className="h-4 flex-grow rounded"
              style={{
                background:
                  "linear-gradient(to right, #313695, #4575b4, #74add1, #abd9e9, #fee090, #fdae61, #f46d43, #d73027, #a50026)",
              }}
            />

            <span className="text-sm font-medium">
              {maxTemp.toFixed(1)}°C
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
