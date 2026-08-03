import type { ReactNode } from "react";
import FlatIcon from "./FlatIcon";
import Skeleton from "./Skeleton";

export interface LiveChartDatum {
  label: string;
  value: number;
  displayValue?: string;
  color?: string;
}

interface ChartShellProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  children: ReactNode;
}

function ChartShell({
  eyebrow,
  title,
  description,
  icon,
  children,
}: ChartShellProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-teal">
              {eyebrow}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          </div>
          <h2 className="mt-1 text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-1 max-w-lg text-[11px] leading-5 text-slate-500">
            {description}
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-teal/8 text-brand-teal">
          <FlatIcon name={icon} className="text-[17px]" />
        </span>
      </div>
      {children}
    </section>
  );
}

interface LiveMetricBarsProps {
  eyebrow: string;
  title: string;
  description: string;
  data: LiveChartDatum[];
  loading?: boolean;
  icon?: string;
}

export function LiveMetricBars({
  eyebrow,
  title,
  description,
  data,
  loading = false,
  icon = "chart-histogram",
}: LiveMetricBarsProps) {
  const cleanData = data.filter(
    (item) => Number.isFinite(item.value) && item.value >= 0,
  );
  const maximum = Math.max(...cleanData.map((item) => item.value), 1);

  return (
    <ChartShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={icon}
    >
      {loading ? (
        <div className="mt-6 space-y-5" aria-label={`Loading ${title}`}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : cleanData.length === 0 ? (
        <ChartEmptyState />
      ) : (
        <div className="mt-6 space-y-5" role="img" aria-label={title}>
          {cleanData.map((item, index) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-4 text-[11px]">
                <span
                  className="truncate font-semibold text-slate-600"
                  title={item.label}
                >
                  {item.label}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-slate-900">
                  {item.displayValue ?? item.value.toLocaleString()}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${item.value === 0 ? 0 : Math.max(5, (item.value / maximum) * 100)}%`,
                    backgroundColor:
                      item.color ||
                      ["#0e6b57", "#ff7758", "#64c977", "#c5a880"][index % 4],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartShell>
  );
}

interface LiveDonutChartProps extends LiveMetricBarsProps {
  centerLabel: string;
}

export function LiveDonutChart({
  eyebrow,
  title,
  description,
  data,
  centerLabel,
  loading = false,
  icon = "chart-pie",
}: LiveDonutChartProps) {
  const palette = ["#0e6b57", "#ff7758", "#64c977", "#c5a880", "#34515b"];
  const cleanData = data.filter(
    (item) => Number.isFinite(item.value) && item.value >= 0,
  );
  const total = cleanData.reduce((sum, item) => sum + item.value, 0);
  let running = 0;
  const stops = cleanData.map((item, index) => {
    const start = total > 0 ? (running / total) * 100 : 0;
    running += item.value;
    const end = total > 0 ? (running / total) * 100 : 0;
    const color = item.color || palette[index % palette.length];
    return `${color} ${start}% ${end}%`;
  });

  return (
    <ChartShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={icon}
    >
      {loading ? (
        <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-[170px_1fr]">
          <Skeleton className="mx-auto h-40 w-40 rounded-full" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </div>
      ) : total <= 0 ? (
        <ChartEmptyState />
      ) : (
        <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-[170px_1fr]">
          <div
            role="img"
            aria-label={`${title}. Total ${total.toLocaleString()}.`}
            className="relative mx-auto h-40 w-40 rounded-full"
            style={{ background: `conic-gradient(${stops.join(", ")})` }}
          >
            <div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center shadow-inner">
              <div>
                <strong className="block text-xl font-extrabold tabular-nums text-slate-900">
                  {total.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </strong>
                <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  {centerLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {cleanData.map((item, index) => {
              const color = item.color || palette[index % palette.length];
              const percentage =
                total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate text-[11px] font-semibold text-slate-600">
                      {item.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-900">
                    {item.displayValue ?? item.value.toLocaleString()}{" "}
                    <span className="text-slate-400">· {percentage}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ChartShell>
  );
}

export function LiveChartGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{children}</div>
  );
}

function ChartEmptyState() {
  return (
    <div className="mt-6 grid min-h-44 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
      <div>
        <FlatIcon name="chart-histogram" className="text-2xl text-slate-300" />
        <p className="mt-2 text-[11px] font-semibold text-slate-500">
          Live chart data is not available yet.
        </p>
      </div>
    </div>
  );
}
