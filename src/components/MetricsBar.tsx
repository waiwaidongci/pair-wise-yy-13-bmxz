import type { LedgerStats } from "../lib/stats";

interface MetricsBarProps {
  stats: LedgerStats;
  filtered: boolean;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <article>
      <small>{label}</small>
      <strong>{value}</strong>
      {hint ? <em>{hint}</em> : null}
    </article>
  );
}

export default function MetricsBar({ stats, filtered }: MetricsBarProps) {
  return (
    <section className="metrics">
      <MetricCard
        label="小样批次"
        value={stats.total}
        hint={filtered ? "当前筛选结果" : "全部批次"}
      />
      <MetricCard
        label="色差超限"
        value={stats.redyeCount}
        hint={`ΔE > 1.0 · 待复染`}
      />
      <MetricCard label="客户订单" value={stats.orderCount} hint="去重订单数" />
      <MetricCard
        label="通过率"
        value={`${(stats.passRate * 100).toFixed(1)}%`}
        hint="已通过 / 批次总数"
      />
    </section>
  );
}
