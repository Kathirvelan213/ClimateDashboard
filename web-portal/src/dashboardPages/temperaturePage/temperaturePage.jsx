import React, { useEffect, useState, useRef } from 'react'
import { Line, Bar, Scatter } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
 	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
)
	ChartJS.register(BarElement)

const API_BASE = 'http://localhost:5000/api/temperature'

export default function TemperaturePage() {
  const [years, setYears] = useState([])

  useEffect(() => {
    // fetch available years
    fetch(`${API_BASE}/years`).then((r) => r.json()).then((y) => {
      setYears(y)
    })
  }, [])

  // helper to fetch and format series
  const fetchYearly = async () => {
    const res = await fetch(`${API_BASE}/yearly`).then((r) => r.json())
    return {
      labels: res.map((r) => String(r.year)),
      data: res.map((r) => Number(r.temp_c.toFixed(2))),
    }
  }

  const fetchMonthly = async (year) => {
    const res = await fetch(`${API_BASE}/monthly?year=${year}`).then((r) => r.json())
    return {
      labels: res.map((r) => String(r.month)),
      data: res.map((r) => (r.temp_c === null ? null : Number(r.temp_c.toFixed(2)))),
    }
  }

  const fetchDaily = async (year, month) => {
    const res = await fetch(`${API_BASE}/daily?year=${year}&month=${month}`).then((r) => r.json())
    return {
      labels: res.map((r) => String(r.day)),
      data: res.map((r) => Number(r.temp_c.toFixed(2))),
    }
  }

	// fetch general timeseries (daily/monthly/yearly) for multiple variables
	const fetchTimeSeries = async ({ freq = 'D', start, end, vars } = {}) => {
		const qs = []
		if (freq) qs.push(`freq=${encodeURIComponent(freq)}`)
		if (start) qs.push(`start=${encodeURIComponent(start)}`)
		if (end) qs.push(`end=${encodeURIComponent(end)}`)
		if (vars) qs.push(`vars=${encodeURIComponent(vars.join(','))}`)
		const q = qs.length ? `?${qs.join('&')}` : ''
		const res = await fetch(`${API_BASE}/timeseries${q}`).then((r) => r.json())
		// return object with labels (timestamps) and series per var
		const labels = res.map((r) => r.timestamp)
		const series = {}
		if (res.length > 0) {
			Object.keys(res[0]).forEach((k) => { if (k !== 'timestamp') series[k] = [] })
			for (const r of res) {
				for (const k of Object.keys(series)) {
					series[k].push(r[k] === null ? null : Number(r[k]))
				}
			}
		}
		return { labels, series }
	}

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: { position: 'top' },
			title: { display: true, text: 't2m (°C)' },
		},
		scales: {
			x: {
				title: { display: true, text: 'Period' },
				ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 },
			},
			y: { title: { display: true, text: 'Temperature (°C)' } },
		},
	}

	// --- Subcomponents: Yearly, Monthly, Daily, Histogram, Scatter ---

	function YearlyChart() {
		const [series, setSeries] = useState(null)
		useEffect(() => {
			fetchYearly().then((s) => setSeries(s))
		}, [])
		if (!series) return <div>Loading yearly...</div>
		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Yearly Average Temperature</h3>
				<Line
					key={`yearly-${series.labels.length}`}
					data={{ labels: series.labels, datasets: [{ label: 'Avg °C', data: series.data, borderColor: 'rgb(75,192,192)', backgroundColor: 'rgba(75,192,192,0.2)' }] }}
					options={{ ...chartOptions }}
				/>
			</div>
		)
	}

	function MonthlyChart() {
		const [selectedYear, setSelectedYear] = useState(years && years.length ? years[0] : null)
		const [series, setSeries] = useState(null)
		useEffect(() => {
			if (selectedYear) fetchMonthly(selectedYear).then((s) => setSeries(s))
		}, [selectedYear])
		if (!selectedYear) return <div>No year selected</div>
		if (!series) return <div>Loading monthly...</div>
		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Monthly Average Temperature ({selectedYear})</h3>
				<label>Year: <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ marginLeft: 8 }}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
				<Line
					key={`monthly-${selectedYear}-${series.labels.length}`}
					data={{ labels: series.labels, datasets: [{ label: 'Avg °C', data: series.data, borderColor: 'rgb(255,99,132)', backgroundColor: 'rgba(255,99,132,0.2)' }] }}
					options={{ ...chartOptions, scales: { x: { ticks: { autoSkip: false } }, y: chartOptions.scales.y } }}
				/>
			</div>
		)
	}

	function DailyChart() {
		const [selectedYear, setSelectedYear] = useState(years && years.length ? years[0] : null)
		const [selectedMonth, setSelectedMonth] = useState(1)
		const [series, setSeries] = useState(null)
		useEffect(() => {
			if (selectedYear && selectedMonth) fetchDaily(selectedYear, selectedMonth).then((s) => setSeries(s))
		}, [selectedYear, selectedMonth])
		if (!selectedYear) return <div>No year selected</div>
		if (!series) return <div>Loading daily...</div>
		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Daily Average Temperature ({selectedYear}-{String(selectedMonth).padStart(2, '0')})</h3>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
					<label>Year: <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ marginLeft: 8 }}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
					<label>Month: <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ marginLeft: 8 }}>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
				</div>
				<Line
					key={`daily-${selectedYear}-${selectedMonth}-${series.labels.length}`}
					data={{ labels: series.labels, datasets: [{ label: 'Avg °C', data: series.data, borderColor: 'rgb(54,162,235)', backgroundColor: 'rgba(54,162,235,0.2)' }] }}
					options={{ ...chartOptions, scales: { x: { ticks: { autoSkip: false } }, y: chartOptions.scales.y } }}
				/>
			</div>
		)
	}

	// Histogram: fetch temps (sampled) and compute bins
	function HistogramChart() {
		const [selectedYear, setSelectedYear] = useState(null)
		const [selectedMonth, setSelectedMonth] = useState(null)
		const [bins, setBins] = useState(null)
		useEffect(() => {
			const qs = []
			if (selectedYear) qs.push(`year=${selectedYear}`)
			if (selectedMonth) qs.push(`month=${selectedMonth}`)
			const q = qs.length ? `?${qs.join('&')}` : ''
			fetch(`${API_BASE}/histogram${q}`).then((r) => r.json()).then((temps) => {
				if (!temps || temps.length === 0) { setBins(null); return }
				// compute 20 bins
				const vals = temps.map((v) => Number(v))
				const min = Math.min(...vals)
				const max = Math.max(...vals)
				const binCount = 20
				const width = (max - min) / binCount || 1
				const counts = new Array(binCount).fill(0)
				for (const v of vals) {
					let idx = Math.floor((v - min) / width)
					if (idx >= binCount) idx = binCount - 1
					if (idx < 0) idx = 0
					counts[idx] += 1
				}
				const labels = counts.map((_, i) => `${(min + i * width).toFixed(1)} to ${(min + (i + 1) * width).toFixed(1)}`)
				setBins({ labels, counts })
			})
		}, [selectedYear, selectedMonth])
		if (!bins) return <div>Loading histogram...</div>
		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Temperature Distribution (Histogram)</h3>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
					<label>Year: <select value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
					<label>Month: <select value={selectedMonth || ''} onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
				</div>
				<Bar data={{ labels: bins.labels, datasets: [{ label: 'Count', data: bins.counts, backgroundColor: 'rgba(153,102,255,0.6)' }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
			</div>
		)
	}

	// Scatter: sample lat vs temp
	function ScatterChart() {
		const [selectedYear, setSelectedYear] = useState(null)
		const [selectedMonth, setSelectedMonth] = useState(null)
		const [points, setPoints] = useState(null)
		useEffect(() => {
			const qs = []
			if (selectedYear) qs.push(`year=${selectedYear}`)
			if (selectedMonth) qs.push(`month=${selectedMonth}`)
			const q = qs.length ? `?${qs.join('&')}` : ''
			fetch(`${API_BASE}/scatter${q}`).then((r) => r.json()).then((pts) => {
				if (!pts || pts.length === 0) { setPoints([]); return }
				// map to Chart.js scatter points: x = latitude, y = temp
				const dataPts = pts.map((p) => ({ x: Number(p.latitude), y: Number(p.temp_c) }))
				setPoints(dataPts)
			})
		}, [selectedYear, selectedMonth])
		if (!points) return <div>Loading scatter...</div>
		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Scatter: Latitude vs Temperature</h3>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
					<label>Year: <select value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
					<label>Month: <select value={selectedMonth || ''} onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
				</div>
				<Scatter data={{ datasets: [{ label: 'Lat vs °C', data: points, backgroundColor: 'rgba(255,159,64,0.8)' }] }} options={{ responsive: true, scales: { x: { title: { display: true, text: 'Latitude' } }, y: { title: { display: true, text: 'Temperature (°C)' } } }, plugins: { legend: { display: false } } }} />
			</div>
		)
	}

	// Map heat-like display using Leaflet: circle markers colored by temperature
	function MapHeatmap() {
		const [selectedYear, setSelectedYear] = useState(null)
		const [selectedMonth, setSelectedMonth] = useState(null)
		const mapRef = useRef(null)
		const markersRef = useRef([])

		useEffect(() => {
			if (!mapRef.current) {
				mapRef.current = L.map('temp-map', { center: [0, 0], zoom: 2 })
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; OpenStreetMap contributors'
				}).addTo(mapRef.current)
			}
		}, [])

		useEffect(() => {
			// remove existing overlays
			markersRef.current.forEach((m) => {
				try { mapRef.current.removeLayer(m) } catch (e) {}
				if (m && m._url) {
					try { URL.revokeObjectURL(m._url) } catch (e) {}
				}
			})
			markersRef.current = []
			const qs = []
			if (selectedYear) qs.push(`year=${selectedYear}`)
			if (selectedMonth) qs.push(`month=${selectedMonth}`)
			const q = qs.length ? `?${qs.join('&')}` : ''
			// first fetch discrete points to compute bbox
			fetch(`${API_BASE}/heatmap${q}`).then((r) => r.json()).then((pts) => {
				if (!pts || pts.length === 0) return
				const lats = pts.map((p) => p.latitude)
				const lons = pts.map((p) => p.longitude)
				const minLat = Math.min(...lats)
				const maxLat = Math.max(...lats)
				const minLon = Math.min(...lons)
				const maxLon = Math.max(...lons)
				const bounds = [[minLat, minLon], [maxLat, maxLon]]
				// fetch raster PNG sized to map container
				const mapEl = document.getElementById('temp-map')
				const w = mapEl ? Math.max(400, Math.round(mapEl.clientWidth)) : 600
				const h = 400
				const sep = q ? '&' : '?'
				// request a raster generated from a 6x8 grid by default to match the station grid
				const gridCols = 6
				const gridRows = 8
				const imgUrl = `${API_BASE}/heat_raster${q}${sep}width=${w}&height=${h}&grid_cols=${gridCols}&grid_rows=${gridRows}`
				fetch(imgUrl).then((r) => r.blob()).then((blob) => {
					const url = URL.createObjectURL(blob)
					const overlay = L.imageOverlay(url, bounds, { opacity: 0.8 })
					overlay.addTo(mapRef.current)
					// keep reference so we can remove later
					overlay._url = url
					markersRef.current.push(overlay)
					mapRef.current.fitBounds(bounds, { maxZoom: 6, padding: [20, 20] })
				})
			})
		}, [selectedYear, selectedMonth])

		function tempColor(t) {
			// simple blue->red scale for -40..40°C
			const min = -40
			const max = 40
			const v = Math.max(min, Math.min(max, t))
			const ratio = (v - min) / (max - min)
			const r = Math.round(255 * ratio)
			const g = Math.round(100 * (1 - Math.abs(ratio - 0.5) * 2))
			const b = Math.round(255 * (1 - ratio))
			return `rgb(${r},${g},${b})`
		}

		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Map: Temperature Points (heat-like)</h3>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
					<label>Year: <select value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
					<label>Month: <select value={selectedMonth || ''} onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
				</div>
				<div id='temp-map' style={{ height: 400, width: '100%', border: '1px solid #ddd' }} />
			</div>
		)
	}

	// Box plot using server quartiles + simple SVG rendering and outlier list
	function BoxPlot() {
		const [selectedYear, setSelectedYear] = useState(null)
		const [selectedMonth, setSelectedMonth] = useState(null)
		const [stats, setStats] = useState(null)

		useEffect(() => {
			const qs = []
			if (selectedYear) qs.push(`year=${selectedYear}`)
			if (selectedMonth) qs.push(`month=${selectedMonth}`)
			const q = qs.length ? `?${qs.join('&')}` : ''
			fetch(`${API_BASE}/boxplot${q}`).then((r) => r.json()).then((j) => setStats(j))
		}, [selectedYear, selectedMonth])

		if (!stats) return <div>Loading boxplot...</div>

		const width = 400
		const height = 120
		const padding = 30
		const minVal = Math.min(stats.lower_bound ?? stats.lower_whisker, stats.q1) - 2
		const maxVal = Math.max(stats.upper_bound ?? stats.upper_whisker, stats.q3) + 2
		const scaleX = (v) => padding + ((v - minVal) / (maxVal - minVal)) * (width - padding * 2)

		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Box Plot (Temperature) — {selectedYear ? selectedYear : 'All Years'} {selectedMonth ? `- ${String(selectedMonth).padStart(2, '0')}` : ''}</h3>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
					<label>Year: <select value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
					<label>Month: <select value={selectedMonth || ''} onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
				</div>
				<svg width={width} height={height} style={{ border: '1px solid #eee' }}>
					{/* whisker line */}
					<line x1={scaleX(stats.lower_whisker)} y1={height/2} x2={scaleX(stats.upper_whisker)} y2={height/2} stroke="#444" strokeWidth={2} />
					{/* box */}
					<rect x={scaleX(stats.q1)} y={height/2 - 20} width={Math.max(2, scaleX(stats.q3) - scaleX(stats.q1))} height={40} fill="rgba(100,150,240,0.4)" stroke="#333" />
					{/* median */}
					<line x1={scaleX(stats.q2)} y1={height/2 - 20} x2={scaleX(stats.q2)} y2={height/2 + 20} stroke="#222" strokeWidth={2} />
					{/* whisker end caps */}
					<line x1={scaleX(stats.lower_whisker)} y1={height/2 - 10} x2={scaleX(stats.lower_whisker)} y2={height/2 + 10} stroke="#222" />
					<line x1={scaleX(stats.upper_whisker)} y1={height/2 - 10} x2={scaleX(stats.upper_whisker)} y2={height/2 + 10} stroke="#222" />
					{/* outliers */}
					{stats.outliers && stats.outliers.map((o, i) => (
						<circle key={i} cx={scaleX(o.temp_c)} cy={height/2 + 30} r={3} fill="red" />
					))}
					{/* axis labels */}
					<text x={padding} y={height - 4} fontSize={10}>{minVal.toFixed(1)}°C</text>
					<text x={width - padding - 40} y={height - 4} fontSize={10}>{maxVal.toFixed(1)}°C</text>
				</svg>
				<div style={{ marginTop: 8 }}>
					<strong>Outliers (showing up to {stats.outliers.length}):</strong>
					<ul style={{ maxHeight: 160, overflow: 'auto', paddingLeft: 18 }}>
						{stats.outliers.map((o, i) => (
							<li key={i}>{o.valid_time} — {o.temp_c.toFixed(2)}°C @ {o.latitude.toFixed(3)},{o.longitude.toFixed(3)}</li>
						))}
					</ul>
				</div>
			</div>
		)
	}

	// --- New Charts: Combined variables, Rolling Averages, Diurnal, Cloud Scatter ---

	function CombinedChart() {
		const [selectedYear, setSelectedYear] = useState(years && years.length ? years[0] : null)
		const [data, setData] = useState(null)
		const varOptions = {
			t2m_c: { label: 'Temperature (°C)', unit: '°C', axis: 'y' },
			d2m_c: { label: 'Dew Point (°C)', unit: '°C', axis: 'y' },
			sp_hpa: { label: 'Surface Pressure (hPa)', unit: 'hPa', axis: 'y1' },
			tcc: { label: 'Total Cloud Cover (%)', unit: '%', axis: 'y' },
		}

		useEffect(() => {
			if (!selectedYear) return
			// fetch daily timeseries for all four variables
			const start = `${selectedYear}-01-01`
			const end = `${selectedYear}-12-31`
			const vars = ['t2m_c', 'd2m_c', 'sp_hpa', 'tcc']
			fetchTimeSeries({ freq: 'D', start, end, vars }).then((res) => {
				setData(res)
			})
		}, [selectedYear])

		if (!data) return <div>Loading combined chart...</div>

		const labels = data.labels.map((ts) => ts.split('T')[0])
		const datasets = []
		// Temperature
		if (data.series.t2m_c) datasets.push({ label: varOptions.t2m_c.label, data: data.series.t2m_c, borderColor: 'rgb(255,99,132)', backgroundColor: 'rgba(255,99,132,0.15)', yAxisID: 'y' })
		// Dew point
		if (data.series.d2m_c) datasets.push({ label: varOptions.d2m_c.label, data: data.series.d2m_c, borderColor: 'rgb(75,192,192)', backgroundColor: 'rgba(75,192,192,0.12)', yAxisID: 'y' })
		// Surface pressure on right axis
		if (data.series.sp_hpa) datasets.push({ label: varOptions.sp_hpa.label, data: data.series.sp_hpa, borderColor: 'rgb(54,162,235)', backgroundColor: 'rgba(54,162,235,0.12)', yAxisID: 'y1' })
		// Cloud cover
		if (data.series.tcc) datasets.push({ label: varOptions.tcc.label, data: data.series.tcc, borderColor: 'rgb(153,102,255)', backgroundColor: 'rgba(153,102,255,0.12)', yAxisID: 'y' })

		const opts = {
			...chartOptions,
			scales: {
				x: chartOptions.scales.x,
				y: { type: 'linear', position: 'left', title: { display: true, text: '°C / %' } },
				y1: { type: 'linear', position: 'right', title: { display: true, text: 'hPa' }, grid: { drawOnChartArea: false } },
			}
		}

		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Combined Variables — {selectedYear}</h3>
				<div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
					<label>Year: <select value={selectedYear || ''} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ marginLeft: 8 }}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
					<div style={{ marginLeft: 8, color: '#555' }}>All variables shown; use the legend to toggle visibility.</div>
				</div>
				<Line data={{ labels, datasets }} options={opts} />
			</div>
		)
	}

	// rolling average helper
	const rollingMean = (arr, window) => {
		const res = new Array(arr.length).fill(null)
		const half = Math.floor(window / 2)
		for (let i = 0; i < arr.length; i++) {
			const from = Math.max(0, i - (window - 1))
			const to = i
			const slice = arr.slice(from, to + 1).filter(v => v !== null && !isNaN(v))
			if (slice.length) res[i] = slice.reduce((a, b) => a + b, 0) / slice.length
		}
		return res
	}

	function RollingAverages() {
		const [selectedYear, setSelectedYear] = useState(years && years.length ? years[0] : null)
		const [data, setData] = useState(null)

		useEffect(() => {
			if (!selectedYear) return
			const start = `${selectedYear}-01-01`
			const end = `${selectedYear}-12-31`
			fetchTimeSeries({ freq: 'D', start, end, vars: ['t2m_c'] }).then((res) => setData(res))
		}, [selectedYear])
		if (!data) return <div>Loading rolling averages...</div>
		const labels = data.labels.map(l => l.split('T')[0])
		const orig = data.series.t2m_c
		const r7 = rollingMean(orig, 7)
		const r14 = rollingMean(orig, 14)
		const r30 = rollingMean(orig, 30)
		const datasets = [
			{ label: 'Original °C', data: orig, borderColor: 'rgba(0,0,0,0.3)', backgroundColor: 'rgba(0,0,0,0.05)' },
			{ label: '7-day MA', data: r7, borderColor: 'rgb(255,99,132)' },
			{ label: '14-day MA', data: r14, borderColor: 'rgb(54,162,235)' },
			{ label: '30-day MA', data: r30, borderColor: 'rgb(75,192,192)' },
		]
		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Rolling Means ({selectedYear})</h3>
				<label>Year: <select value={selectedYear || ''} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ marginLeft: 8 }}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
				<Line data={{ labels, datasets }} options={chartOptions} />
			</div>
		)
	}

	function DiurnalChart() {
		const [selectedYear, setSelectedYear] = useState(years && years.length ? years[0] : null)
		const [data, setData] = useState(null)
		const hours = [0, 6, 12, 18]

		useEffect(() => {
			if (!selectedYear) return
			// fetch per-month diurnal averages for the year and build series per hour across months
			const promises = Array.from({ length: 12 }, (_, i) => fetch(`${API_BASE}/diurnal?year=${selectedYear}&month=${i+1}&hours=${hours.join(',')}`).then(r => r.json()))
			Promise.all(promises).then((months) => {
				// months is array of arrays of hour objects
				const series = {}
				for (const h of hours) series[h] = []
				const labels = []
				for (let m = 0; m < 12; m++) {
					labels.push(String(m+1))
					const arr = months[m]
					const map = {}
					for (const o of arr) map[o.hour] = o
					for (const h of hours) {
						const v = map[h] ? map[h].t2m_c : null
						series[h].push(v)
					}
				}
				setData({ labels, series })
			})
		}, [selectedYear])

		if (!data) return <div>Loading diurnal chart...</div>
		const datasets = Object.keys(data.series).map((h, idx) => ({ label: `${h}:00`, data: data.series[h], borderColor: ['#e41a1c','#377eb8','#4daf4a','#984ea3'][idx], fill: false }))
		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Diurnal Pattern by Month ({selectedYear})</h3>
				<label>Year: <select value={selectedYear || ''} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ marginLeft: 8 }}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
				<Line data={{ labels: data.labels, datasets }} options={{ ...chartOptions, plugins: { legend: { position: 'top' } } }} />
			</div>
		)
	}

	function CloudScatter() {
		const [selectedYear, setSelectedYear] = useState(null)
		const [points, setPoints] = useState(null)
		useEffect(() => {
			const qs = []
			if (selectedYear) qs.push(`year=${selectedYear}`)
			const q = qs.length ? `?${qs.join('&')}` : ''
			fetch(`${API_BASE}/cloud_scatter${q}`).then((r) => r.json()).then((pts) => {
				const dataPts = pts.map(p => ({ x: p.tcc, y: p.t2m_c }))
				setPoints(dataPts)
			})
		}, [selectedYear])
		if (!points) return <div>Loading cloud vs temp...</div>
		return (
			<div style={{ marginBottom: 24 }}>
				<h3>Cloud Cover vs Temperature</h3>
				<label>Year: <select value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)} style={{ marginLeft: 8 }}><option value=''>All</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
				<Scatter data={{ datasets: [{ label: 'tcc vs t2m', data: points, backgroundColor: 'rgba(31,119,180,0.8)' }] }} options={{ responsive: true, scales: { x: { title: { display: true, text: 'Total Cloud Cover (%)' } }, y: { title: { display: true, text: 'Temperature (°C)' } } }, plugins: { legend: { display: false } } }} />
			</div>
		)
	}

	return (
		<div style={{ padding: 16 }}>
			<h2>Temperature (t2m) — Dashboard Charts</h2>
			<CombinedChart />
			<RollingAverages />
			<DiurnalChart />
			<CloudScatter />
			<YearlyChart />
			<MonthlyChart />
			<DailyChart />
			<HistogramChart />
			<MapHeatmap />
			<BoxPlot />
		</div>
	)
}

