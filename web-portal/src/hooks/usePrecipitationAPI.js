import { useQuery } from "@tanstack/react-query";
import { precipitationAPI } from "../api/precipitationAPI";

export function usePrecipitationAPI() {
  return {
    // ---- YEARS ----
    yearsQuery: () =>
      useQuery({
        queryKey: ["precip_years"],
        queryFn: precipitationAPI.fetchYears,
        staleTime: Infinity,
      }),

    // ---- YEARLY ----
    yearlyQuery: () =>
      useQuery({
        queryKey: ["precip_yearly"],
        queryFn: precipitationAPI.fetchYearly,
        staleTime: Infinity,
      }),

    // ---- MONTHLY ----
    monthlyQuery: (year) =>
      useQuery({
        queryKey: ["precip_monthly", year],
        queryFn: () => precipitationAPI.fetchMonthly(year),
        enabled: !!year,
      }),

    // ---- DAILY ----
    dailyQuery: (year, month) =>
      useQuery({
        queryKey: ["precip_daily", year, month],
        queryFn: () => precipitationAPI.fetchDaily(year, month),
        enabled: !!year && !!month,
      }),

    // ---- RAW HISTOGRAM ----
    histogramQuery: (year, month) =>
      useQuery({
        queryKey: ["precip_hist", year, month],
        queryFn: () => precipitationAPI.fetchHistogram(year, month),
      }),

    // ---- DAILY AGGREGATED HISTOGRAM ----
    histogramDailyQuery: (year, month) =>
      useQuery({
        queryKey: ["precip_hist_daily", year, month],
        queryFn: () => precipitationAPI.fetchHistogramDaily(year, month),
      }),

    // ---- SCATTER ----
    scatterQuery: (year, month) =>
      useQuery({
        queryKey: ["precip_scatter", year, month],
        queryFn: () => precipitationAPI.fetchScatter(year, month),
      }),

    // ---- BOXPLOT ----
    boxplotQuery: (year, month) =>
      useQuery({
        queryKey: ["precip_box", year, month],
        queryFn: () => precipitationAPI.fetchBoxPlot(year, month),
      }),
    timeSeriesQuery: ({ freq, start, end, vars }) =>
      useQuery({
        queryKey: ["precip_timeseries", freq, start, end, vars],
        queryFn: () => precipitationAPI.fetchTimeSeries({ freq, start, end, vars }),
        enabled: !!freq,
      }),
  };
}
