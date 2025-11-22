import { useQuery } from "@tanstack/react-query";
import { temperatureAPI } from "../api/temperature";

export function useTemperatureAPI() {
  return {
    yearsQuery: () =>
      useQuery({
        queryKey: ["years"],
        queryFn: temperatureAPI.fetchYears,
        staleTime: Infinity,
      }),

    yearlyQuery: () =>
      useQuery({
        queryKey: ["yearly"],
        queryFn: temperatureAPI.fetchYearly,
        staleTime: Infinity,
      }),

    monthlyQuery: (year) =>
      useQuery({
        queryKey: ["monthly", year],
        queryFn: () => temperatureAPI.fetchMonthly(year),
        enabled: !!year,
      }),

    dailyQuery: (year, month) =>
      useQuery({
        queryKey: ["daily", year, month],
        queryFn: () => temperatureAPI.fetchDaily(year, month),
        enabled: !!year && !!month,
      }),

    timeSeriesQuery: ({ freq, start, end, vars }) =>
      useQuery({
        queryKey: ["timeseries", freq, start, end, vars],
        queryFn: () => temperatureAPI.fetchTimeSeries({ freq, start, end, vars }),
        enabled: !!freq,
      }),

    histogramQuery: (year, month) =>
      useQuery({
        queryKey: ["histogram", year, month],
        queryFn: () => temperatureAPI.fetchHistogram(year, month),
      }),

    scatterQuery: (year, month) =>
      useQuery({
        queryKey: ["scatter", year, month],
        queryFn: () => temperatureAPI.fetchScatter(year, month),
      }),

    boxplotQuery: (year, month) =>
      useQuery({
        queryKey: ["boxplot", year, month],
        queryFn: () => temperatureAPI.fetchBoxPlot(year, month),
      }),

    heatmapQuery: (year, month) =>
      useQuery({
        queryKey: ["heatmap", year, month],
        queryFn: () => temperatureAPI.fetchHeatmap(year, month),
      }),

    diurnalQuery: (year, month) =>
      useQuery({
        queryKey: ["diurnal", year, month],
        queryFn: () => temperatureAPI.fetchDiurnal(year, month),
        enabled: !!year && !!month,
      }),
  };
}
