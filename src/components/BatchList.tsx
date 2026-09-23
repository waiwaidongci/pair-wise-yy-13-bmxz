import { DELTA_E_LIMIT, STATUS_LABEL, passReason, type SampleBatch } from "../lab";

interface Props {
  batches: SampleBatch[];
  onPass: (id: string) => void;
}

const STATUS_CLASS: Record<SampleBatch["status"], string> = {
  passed: "status passed",
  "pending-redye": "status redye",
  "pending-review": "status review",
};

function BatchCard({ batch, index, onPass }: { batch: SampleBatch; index: number; onPass: (id: string) => void }) {
  const blockReason = passReason(batch.status, batch.deltaE);
  const overLimit = batch.deltaE > DELTA_E_LIMIT;

  return (
    <article className="batch-card">
      <b>{String(index + 1).padStart(2, "0")}</b>
      <div className="batch-main">
        <div className="batch-title">
          <h3>{batch.id}</h3>
          <span className={STATUS_CLASS[batch.status]}>{STATUS_LABEL[batch.status]}</span>
          <span className={overLimit ? "delta bad" : "delta ok"}>ΔE {batch.deltaE.toFixed(2)}</span>
        </div>
        <p className="batch-meta">
          订单 {batch.orderNo} · {batch.fabric} · {batch.weight} g/m² · 浴比 {batch.liquorRatio || "—"} · 保温{" "}
          {batch.holdMinutes} min
        </p>
        <p className="batch-line">
          <strong>配方：</strong>
          {batch.formula.map((d) => (
            <span className="dye-tag" key={d.name}>
              {d.name} {d.percent}%
            </span>
          ))}
          <em className="formula-sum">合计 {batch.formula.reduce((s, d) => s + d.percent, 0).toFixed(2)}%</em>
        </p>
        {(batch.tempCurve || batch.finishing) && (
          <p className="batch-line muted">
            {batch.tempCurve && <>温度曲线：{batch.tempCurve}</>}
            {batch.tempCurve && batch.finishing && "　｜　"}
            {batch.finishing && <>后整理：{batch.finishing}</>}
          </p>
        )}
        <p className="batch-foot">
          <small>{batch.createdAt}</small>
          {batch.status === "passed" ? (
            <span className="passed-text">已复核通过</span>
          ) : (
            <button
              className="pass-btn"
              disabled={blockReason !== null}
              title={blockReason ?? "色差合格，标记为评审通过"}
              onClick={() => onPass(batch.id)}
            >
              复核通过
            </button>
          )}
          {blockReason && batch.status !== "passed" && <small className="block-reason">{blockReason}</small>}
        </p>
      </div>
    </article>
  );
}

export default function BatchList({ batches, onPass }: Props) {
  if (batches.length === 0) {
    return (
      <div className="empty-state">
        <strong>当前筛选条件下暂无小样批次</strong>
        <span>换一个订单号，或清除筛选查看全部批次。</span>
      </div>
    );
  }

  return (
    <div className="records">
      {batches.map((batch, index) => (
        <BatchCard key={batch.id} batch={batch} index={index} onPass={onPass} />
      ))}
    </div>
  );
}
