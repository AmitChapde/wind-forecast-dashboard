
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getWindAccuracy } from "../api/windApi";
import MetricCard from "../components/MetricCard";
import ChartPanel from "../components/ChartPanel";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/StateMessage";

import styles from "./Dashboard.module.css";

const numberFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

const decimalFormat = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatMW(value) {
  return `${numberFormat.format(value)} MW`;
}

function formatTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : dateTimeFormat.format(date);
}

export default function Dashboard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const loadData = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await getWindAccuracy({ signal });
      setResult(response);
    } catch (err) {
      if (err.name === "AbortError") return;

      setError(err.message || "An unexpected error occurred.");
      setResult(null);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadData(controller.signal);

    return () => controller.abort();
  }, [loadData, retryCount]);

  const chartData = useMemo(() => {
    if (!result?.data) return [];

    return [...result.data]
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() -
          new Date(b.startTime).getTime()
      )
      .map((item) => ({
        ...item,
        timeLabel: formatTimestamp(item.startTime),
      }));
  }, [result]);

  const retry = () => {
    setRetryCount((count) => count + 1);
  };

  const mae = result?.mae;
  const bias = result?.bias;
  const matchedIntervals = result?.matchedIntervals ?? chartData.length;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              W
            </span>
            <span>WindScope</span>
          </div>

          <div className={styles.headerMeta}>
            <span className={styles.liveDot} />
            <span>Day-ahead forecast analysis</span>
          </div>
        </header>

        <section className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>ENERGY ANALYTICS / GB WIND</p>
            <h1>Wind forecast performance</h1>
            <p className={styles.subtitle}>
              Compare forecast wind generation against actual output
              and understand forecast error across the selected period.
            </p>
          </div>

          <div className={styles.period}>
            <span className={styles.periodLabel}>REPORTING PERIOD</span>
            <strong>{result?.period || "January 2026"}</strong>
          </div>
        </section>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : !result || chartData.length === 0 ? (
          <EmptyState message="No matching forecast and actual records were returned for January 2026." />
        ) : (
          <>
            <section className={styles.metrics} aria-label="Forecast metrics">
              <MetricCard
                label="Mean absolute error"
                value={mae == null ? "—" : `${numberFormat.format(mae)} MW`}
                description="Average absolute difference between forecast and actual"
                icon="↕"
                tone="teal"
              />

              <MetricCard
                label="Forecast bias"
                value={
                  bias == null
                    ? "—"
                    : `${bias > 0 ? "+" : ""}${numberFormat.format(bias)} MW`
                }
                description={
                  bias > 0
                    ? "Forecasts overestimated generation on average"
                    : bias < 0
                      ? "Forecasts underestimated generation on average"
                      : "Average forecast error was approximately zero"
                }
                icon="±"
                tone="amber"
              />

              <MetricCard
                label="Matched intervals"
                value={numberFormat.format(matchedIntervals)}
                description="Exact delivery timestamps with both forecast and actual"
                icon="◷"
              />

              <MetricCard
                label="Forecast frequency"
                value="Hourly matches"
                description="Exact timestamp matching; no half-hourly interpolation"
                icon="⌁"
              />
            </section>

            <div className={styles.notice}>
              <span className={styles.noticeIcon} aria-hidden="true">i</span>
              <p>
                <strong>Methodology:</strong>{" "}
                {result.decisionCutoffAssumption}. Error is calculated as
                forecast minus actual, so positive errors indicate
                overforecasting. Only exact timestamp matches are included.
              </p>
            </div>

            <div className={styles.charts}>
              <ChartPanel
                title="Forecast vs. actual generation"
                description="Wind generation in MW at matched delivery timestamps. Hover over the lines for values."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke="var(--chart-grid)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="timeLabel"
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={30}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(value) => numberFormat.format(value)}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                    />
                    <Tooltip
                      labelFormatter={(label) => `Delivery: ${label} UK`}
                      formatter={(value, name) => [
                        formatMW(value),
                        name,
                      ]}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actualGeneration"
                      name="Actual"
                      stroke="#0d9488"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecastGeneration"
                      name="Forecast"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel
                title="Forecast error over time"
                description="Forecast minus actual generation. Above zero means overforecasting; below zero means underforecasting."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke="var(--chart-grid)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="timeLabel"
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={30}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(value) => numberFormat.format(value)}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="var(--muted)"
                      strokeDasharray="4 4"
                    />
                    <Tooltip
                      labelFormatter={(label) => `Delivery: ${label} UK`}
                      formatter={(value) => [
                        formatMW(value),
                        "Forecast error",
                      ]}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="error"
                      name="Forecast error"
                      stroke="#6366f1"
                      strokeWidth={1.8}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>

            <footer className={styles.footer}>
              <span>Source: Elexon BMRS</span>
              <span>Units: MW</span>
              <span>
                MAE: {mae == null ? "—" : decimalFormat.format(mae)} MW
              </span>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
