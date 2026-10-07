import { useState } from "react";
import { formatDate, formatNumber } from "@/lib/format";

/** Single-series daily views bar chart (14 days). Hover/focus shows the exact value; a table backs it for screen readers. */
export function ViewsChart({ data }: { data: Array<{ date: string; views: number }> }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 560;
  const height = 180;
  const padTop = 16;
  const padBottom = 24;
  const max = Math.max(1, ...data.map((d) => d.views));
  const slot = width / Math.max(1, data.length);
  const barW = Math.max(4, slot - 2); // 2px surface gap between bars
  const plotH = height - padTop - padBottom;
  const total = data.reduce((s, d) => s + d.views, 0);

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label={`पिछले 14 दिनों में ${formatNumber(total)} व्यूज़`}>
        {/* recessive baseline + max gridline */}
        <line x1={0} x2={width} y1={padTop} y2={padTop} className="stroke-border" strokeDasharray="3 4" />
        <line x1={0} x2={width} y1={height - padBottom} y2={height - padBottom} className="stroke-border" />
        {data.map((d, i) => {
          const h = (d.views / max) * plotH;
          const x = i * slot + 1;
          const y = height - padBottom - h;
          const r = Math.min(4, h / 2, barW / 2);
          return (
            <g key={d.date}>
              {/* hit target taller and wider than the mark */}
              <rect
                x={i * slot}
                y={padTop}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${formatDate(d.date)}: ${formatNumber(d.views)} व्यूज़`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none"
              />
              {h > 0 && (
                <path
                  d={`M${x},${height - padBottom} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${height - padBottom} Z`}
                  className="pointer-events-none"
                  style={{ fill: "hsl(var(--chart-1))", opacity: active === null || active === i ? 1 : 0.45 }}
                />
              )}
            </g>
          );
        })}
        <text x={0} y={height - 6} className="fill-muted-foreground text-[11px]">{formatDate(data[0]?.date, { withYear: false })}</text>
        <text x={width} y={height - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">{formatDate(data[data.length - 1]?.date, { withYear: false })}</text>
        <text x={width} y={padTop - 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular">{formatNumber(max)}</text>
      </svg>
      {active !== null && data[active] && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-caption shadow-2"
          style={{ left: `${((active + 0.5) / data.length) * 100}%` }}
        >
          <span className="block font-normal text-muted-foreground">{formatDate(data[active].date)}</span>
          <span className="tabular text-foreground">{formatNumber(data[active].views)} व्यूज़</span>
        </div>
      )}
      <table className="sr-only">
        <caption>रोज़ाना व्यूज़</caption>
        <thead><tr><th>तारीख</th><th>व्यूज़</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.date}><td>{formatDate(d.date)}</td><td>{d.views}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
