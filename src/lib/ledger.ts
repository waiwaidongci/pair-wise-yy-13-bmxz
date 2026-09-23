/**
 * 小样台账领域逻辑（纯函数，供页面与后续接单系统复用）
 */
import type { Batch, BatchDraft, ReviewStatus } from "./types";
import { isDeltaEQualified } from "./validation";

/** 根据色差值推导复核状态：超限即为待复染，否则进入待复核 */
export function deriveStatus(deltaE: number): ReviewStatus {
  return isDeltaEQualified(deltaE) ? "pending" : "redye";
}

/** 过滤掉未填写名称或百分比的空白染料行 */
export function normalizeRecipe(
  rows: { name: string; percent: number | null }[]
): Batch["recipe"] {
  return rows
    .filter((row) => row.name.trim() !== "" && row.percent !== null)
    .map((row) => ({ name: row.name.trim(), percent: row.percent as number }));
}

/** 依据现有批次生成下一批次号：LAB-620A 形式（序号递进，字母循环） */
export function generateBatchId(batches: Pick<Batch, "id">[]): string {
  const base = 620;
  let maxSeq = 0;
  for (const batch of batches) {
    const match = /^LAB-(\d+)([A-Z]?)$/.exec(batch.id);
    if (match) {
      const seq = parseInt(match[1], 10) - base;
      if (Number.isInteger(seq) && seq >= 0 && seq > maxSeq) maxSeq = seq;
    }
  }
  const next = maxSeq + 1;
  const letter = String.fromCharCode(65 + (next % 26));
  return `LAB-${base + next}${letter}`;
}

/** 由草稿构造新批次（调用前应先通过 validateBatchDraft 校验） */
export function createBatch(draft: BatchDraft, id: string, now: string): Batch {
  return {
    ...draft,
    orderNo: draft.orderNo.trim(),
    fabric: draft.fabric.trim(),
    liquorRatio: draft.liquorRatio.trim(),
    tempCurve: draft.tempCurve.trim(),
    finishing: draft.finishing.trim(),
    id,
    status: deriveStatus(draft.deltaE),
    createdAt: now,
  };
}

/** 复核通过：仅色差值合格的批次允许标记 */
export function markPassed(batch: Batch): Batch {
  if (!isDeltaEQualified(batch.deltaE)) return batch;
  return { ...batch, status: "passed" };
}
