/**
 * 台账统计（纯函数，供页面与后续接单系统复用）
 */
import type { Batch } from "./types";
import { isDeltaEQualified } from "./validation";

/** 按客户订单号筛选：空串返回全部；支持订单号关键字包含匹配 */
export function filterByOrder(batches: Batch[], orderNo: string): Batch[] {
  const keyword = orderNo.trim().toUpperCase();
  if (keyword === "") return batches;
  return batches.filter((batch) =>
    batch.orderNo.toUpperCase().includes(keyword)
  );
}

/** 台账中出现过的全部客户订单号（去重，按首次出现顺序） */
export function listOrderNos(batches: Batch[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const batch of batches) {
    if (!seen.has(batch.orderNo)) {
      seen.add(batch.orderNo);
      result.push(batch.orderNo);
    }
  }
  return result;
}

export interface LedgerStats {
  /** 当前范围内批次总数 */
  total: number;
  /** 色差超限（待复染）批次数 */
  redyeCount: number;
  /** 客户订单数（去重） */
  orderCount: number;
  /** 通过率（0~1，空列表为 0） */
  passRate: number;
}

/** 计算给定批次集合的统计指标（配合订单筛选使用） */
export function getStats(batches: Batch[]): LedgerStats {
  const total = batches.length;
  const passed = batches.filter((batch) => batch.status === "passed").length;
  const redyeCount = batches.filter(
    (batch) => !isDeltaEQualified(batch.deltaE)
  ).length;
  return {
    total,
    redyeCount,
    orderCount: new Set(batches.map((batch) => batch.orderNo)).size,
    passRate: total === 0 ? 0 : passed / total,
  };
}
