import type { Batch } from "../lib/types";
import { STATUS_LABEL } from "../lib/types";
import {
  DELTA_E_LIMIT,
  isDeltaEQualified,
  passDisabledReason,
} from "../lib/validation";

interface BatchListProps {
  batches: Batch[];
  filterActive: boolean;
  onPass: (id: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function BatchList({
  batches,
  filterActive,
  onPass,
}: BatchListProps) {
  if (batches.length === 0) {
    return (
      <div className="empty-state">
        <b>未找到匹配的小样批次</b>
        <span>
          {filterActive
            ? "当前订单筛选条件下没有记录，请更换订单号或清除筛选。"
            : "台账暂无记录，请先在上方新增小样批次。"}
        </span>
      </div>
    );
  }

  return (
    <div className="records">
      {batches.map((batch, index) => {
        const qualified = isDeltaEQualified(batch.deltaE);
        const disabledReason = passDisabledReason(batch.status, batch.deltaE);
        const recipeTotal = batch.recipe.reduce(
          (sum, item) => sum + item.percent,
          0
        );
        return (
          <article key={batch.id}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <div className="record-body">
              <div className="record-head">
                <h3>{batch.id}</h3>
                <span className={`badge status-${batch.status}`}>
                  {STATUS_LABEL[batch.status]}
                </span>
                <span className={`badge delta ${qualified ? "ok" : "over"}`}>
                  ΔE {batch.deltaE.toFixed(2)}
                  {qualified ? " 合格" : ` 超限（>${DELTA_E_LIMIT.toFixed(1)}）`}
                </span>
              </div>
              <p className="record-meta">
                订单 {batch.orderNo} · {batch.fabric} · {batch.weight}g/m² ·
                浴比 {batch.liquorRatio || "—"} · 保温{" "}
                {batch.holdTime === null ? "—" : `${batch.holdTime}min`}
              </p>
              <p className="record-meta">
                温度曲线：{batch.tempCurve || "—"} · 后整理：
                {batch.finishing || "—"}
              </p>
              <div className="recipe-bars" aria-label="染料配方比例">
                {batch.recipe.map((item) => (
                  <span key={item.name} className="recipe-chip">
                    {item.name} <i>{item.percent}%</i>
                  </span>
                ))}
                <span
                  className={`recipe-total ${
                    Math.abs(recipeTotal - 100) > 0.5 ? "off" : ""
                  }`}
                >
                  合计 {recipeTotal.toFixed(2)}%
                </span>
              </div>
              <div className="record-foot">
                <small>建档 {formatDate(batch.createdAt)}</small>
                <button
                  type="button"
                  className="approve"
                  disabled={disabledReason !== null}
                  title={disabledReason ?? "色差合格，标记复核通过"}
                  onClick={() => onPass(batch.id)}
                >
                  {batch.status === "passed" ? "已通过" : "标记通过"}
                </button>
              </div>
              {disabledReason && batch.status !== "passed" ? (
                <p className="block-reason">{disabledReason}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
