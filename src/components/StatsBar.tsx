import type { BatchStats } from "../lab";

const METRICS: { key: keyof BatchStats; label: string; suffix: string }[] = [
  { key: "total", label: "小样批次（当前筛选）", suffix: "批" },
  { key: "overLimit", label: "色差超限", suffix: "批" },
  { key: "orders", label: "客户订单", suffix: "个" },
  { key: "passRate", label: "通过率", suffix: "%" },
];

export default function StatsBar({ stats }: { stats: BatchStats }) {
  return (
    <section className="metrics">
      {METRICS.map((m) => (
        <article key={m.key} className={m.key === "overLimit" && stats.overLimit > 0 ? "metric alert" : ""}>
          <small>{m.label}</small>
          <strong>
            {stats[m.key]}
            <i>{m.suffix}</i>
          </strong>
        </article>
      ))}
    </section>
  );
}
