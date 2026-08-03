import FlatIcon from "./FlatIcon";
import propertyHero from "../assets/property-hero.webp";

export interface DashboardChartPoint {
  label: string;
  value: number;
}

interface DashboardHeroProps {
  name: string;
  role: string;
  title: string;
}

export function DashboardHero({ name, role, title }: DashboardHeroProps) {
  const firstName = name.split(" ")[0] || name;

  return (
    <section className="dashboard-hero relative min-h-[304px] overflow-hidden rounded-[24px] text-white">
      <div className="dashboard-hero-orb" />
      <div className="relative z-10 flex min-h-[304px] max-w-[52%] flex-col justify-between p-6 sm:p-7">
        <div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/85">
            <FlatIcon name="building" className="text-[12px]" />
            Rolad portfolio desk
          </span>
          <h2 className="mt-5 max-w-md text-2xl font-extrabold tracking-[-0.035em] sm:text-[30px]">
            Hello, {firstName}
          </h2>
          <p className="mt-2 max-w-sm text-[12px] leading-5 text-white/76">
            {title}. Track client movement, payments and estate delivery from
            one clear operational view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-white px-3 py-2 text-[9px] font-bold text-brand-teal">
            {role}
          </span>
          <span className="rounded-lg border border-white/20 bg-white/8 px-3 py-2 text-[9px] font-semibold text-white/85">
            Live portfolio data
          </span>
        </div>
      </div>
      <img
        src={propertyHero}
        alt="Contemporary Rolad property"
        className="dashboard-hero-property"
      />
    </section>
  );
}

interface DashboardChartsProps {
  primaryTitle: string;
  land: DashboardChartPoint[];
  investment: DashboardChartPoint[];
}

const makePolyline = (values: number[], width = 620, height = 190) => {
  if (values.length === 0) return "";
  const maximum = Math.max(...values, 1);
  return values
    .map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (value / maximum) * (height - 28) - 12;
      return `${x},${y}`;
    })
    .join(" ");
};

export default function DashboardCharts({
  primaryTitle,
  land,
  investment,
}: DashboardChartsProps) {
  const combined = [...land, ...investment];
  const lineValues = combined.map((point) => point.value);
  const maxStage = Math.max(...combined.map((point) => point.value), 1);
  const totalLand = land.reduce((sum, point) => sum + point.value, 0);
  const totalInvestment = investment.reduce(
    (sum, point) => sum + point.value,
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <section className="app-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-teal">
              Portfolio movement
            </p>
            <h2 className="mt-1 text-base font-bold text-charcoal">
              {primaryTitle}
            </h2>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e7f5f6] text-brand-teal">
            <FlatIcon name="chart-line-up" className="text-[17px]" />
          </div>
        </div>

        {lineValues.length > 0 ? (
          <div className="mt-5">
            <svg
              viewBox="0 0 620 210"
              role="img"
              aria-label="Client pipeline movement"
              className="h-[220px] w-full overflow-visible"
              preserveAspectRatio="none"
            >
              {[45, 90, 135, 180].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="620"
                  y1={y}
                  y2={y}
                  stroke="#dbe7e9"
                  strokeDasharray="5 7"
                />
              ))}
              <polyline
                points={makePolyline(lineValues)}
                fill="none"
                stroke="#0e6b57"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {makePolyline(lineValues)
                .split(" ")
                .filter(Boolean)
                .map((point, index) => {
                  const [cx, cy] = point.split(",");
                  return (
                    <circle
                      key={`${point}-${index}`}
                      cx={cx}
                      cy={cy}
                      r="5"
                      fill="white"
                      stroke="#ff7758"
                      strokeWidth="3"
                    />
                  );
                })}
            </svg>
            <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center text-[9px] text-muted-gray sm:grid-cols-6">
              {combined.slice(0, 6).map((point) => (
                <span
                  key={point.label}
                  className="truncate"
                  title={point.label}
                >
                  {point.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <ChartEmptyState />
        )}
      </section>

      <section className="app-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-teal">
              Client distribution
            </p>
            <h2 className="mt-1 text-base font-bold text-charcoal">
              Pipeline by milestone
            </h2>
          </div>
          <div className="flex gap-3 text-[10px] font-semibold text-muted-gray">
            <span>
              <b className="text-charcoal">{totalLand}</b> Land
            </span>
            <span>
              <b className="text-charcoal">{totalInvestment}</b> Investment
            </span>
          </div>
        </div>

        {combined.length > 0 ? (
          <div className="mt-6 space-y-4">
            {combined.slice(0, 7).map((point, index) => (
              <div
                key={`${point.label}-${index}`}
                className="grid grid-cols-[120px_1fr_28px] items-center gap-3"
              >
                <span
                  className="truncate text-[10px] font-semibold text-muted-gray"
                  title={point.label}
                >
                  {point.label}
                </span>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#edf5f6]">
                  <div
                    className={`h-full rounded-full ${index % 3 === 1 ? "bg-brand-coral" : index % 3 === 2 ? "bg-brand-lime" : "bg-brand-teal"}`}
                    style={{
                      width: `${Math.max(6, (point.value / maxStage) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-right text-[11px] font-bold text-charcoal">
                  {point.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <ChartEmptyState />
        )}
      </section>
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div className="mt-5 grid h-[220px] place-items-center rounded-xl border border-dashed border-brand-teal/15 bg-[#f8fbfb] text-center">
      <div>
        <FlatIcon
          name="chart-histogram"
          className="text-2xl text-brand-teal/45"
        />
        <p className="mt-2 text-[11px] font-semibold text-muted-gray">
          Chart data will appear when portfolio records are available.
        </p>
      </div>
    </div>
  );
}
