import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
)

const API_BASE = 'http://localhost:5000/api/temperature'

export default function TemperaturePage() {
	const [granularity, setGranularity] = useState('yearly')
	const [years, setYears] = useState([])
	const [year, setYear] = useState(null)
	const [month, setMonth] = useState(1)
	const [data, setData] = useState(null)

	useEffect(() => {
		// fetch available years
		fetch(`${API_BASE}/years`).then((r) => r.json()).then((y) => {
			setYears(y)
			if (y && y.length > 0) setYear(y[0])
		})
	}, [])

	useEffect(() => {
		if (granularity === 'yearly') {
			fetch(`${API_BASE}/yearly`).then((r) => r.json()).then((res) => {
				const labels = res.map((r) => String(r.year))
				const temps = res.map((r) => Number(r.temp_c.toFixed(2)))
				setData({ labels, temps })
			})
		} else if (granularity === 'monthly' && year) {
			fetch(`${API_BASE}/monthly?year=${year}`).then((r) => r.json()).then((res) => {
				const labels = res.map((r) => String(r.month))
				const temps = res.map((r) => (r.temp_c === null ? null : Number(r.temp_c.toFixed(2))))
				setData({ labels, temps })
			})
		} else if (granularity === 'daily' && year && month) {
			fetch(`${API_BASE}/daily?year=${year}&month=${month}`).then((r) => r.json()).then((res) => {
				const labels = res.map((r) => String(r.day))
				const temps = res.map((r) => Number(r.temp_c.toFixed(2)))
				setData({ labels, temps })
			})
		}
	}, [granularity, year, month])

	const chartData = data
		? {
				labels: data.labels,
				datasets: [
					{
						label: 'Temperature (°C)',
						data: data.temps,
						borderColor: 'rgb(75, 192, 192)',
						backgroundColor: 'rgba(75, 192, 192, 0.2)',
						tension: 0.2,
					},
				],
			}
		: null

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: { position: 'top' },
			title: { display: true, text: 't2m (°C)' },
		},
		scales: {
			x: {
				title: {
					display: true,
					text: granularity === 'yearly' ? 'Year' : granularity === 'monthly' ? 'Month / Day' : 'Day',
				},
				ticks: {
					autoSkip: granularity === 'daily' || granularity === 'monthly' ? false : true,
					maxRotation: 0,
					minRotation: 0,
				},
			},
			y: {
				title: { display: true, text: 'Temperature (°C)' },
			},
		},
	}

	return (
		<div style={{ padding: 16 }}>
			<h2>Temperature (t2m) — Line Chart</h2>
			<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
				<label>
					Granularity:
					<select value={granularity} onChange={(e) => setGranularity(e.target.value)} style={{ marginLeft: 8 }}>
						<option value="yearly">Yearly (all years)</option>
						<option value="monthly">Monthly (limit to a year)</option>
						<option value="daily">Daily (limit to a month)</option>
					</select>
				</label>

				{granularity !== 'yearly' && (
					<label>
						Year:
						<select value={year || ''} onChange={(e) => setYear(Number(e.target.value))} style={{ marginLeft: 8 }}>
							{years.map((y) => (
								<option key={y} value={y}>
									{y}
								</option>
							))}
						</select>
					</label>
				)}

				{granularity === 'daily' && (
					<label>
						Month:
						<select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ marginLeft: 8 }}>
							{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
								<option key={m} value={m}>
									{m}
								</option>
							))}
						</select>
					</label>
				)}
			</div>

			<div style={{ height: 400 }}>
				{chartData ? (
					<Line
						key={`${granularity}-${year}-${month}-${chartData.labels.length}`}
						data={chartData}
						options={chartOptions}
					/>
				) : (
					<div>Loading...</div>
				)}
			</div>
		</div>
	)
}

