// 统计与筛选：纯函数，页面和后续接单系统都可复用。
import type { SampleBatch } from "./types";

export interface BatchStats {
  total: number;
  /** 色差超限（ΔE > 1.0）的批次数，与状态是否已复核无关 */
  overLimit: number;
  /** 涉及的客户订单数（去重） */
  orders: number;
  /** 评审通过批次占比，0-100，无数据时为 0 */
  passRate: number;
}

export function computeStats(batches: SampleBatch[]): BatchStats {
  const total = batches.length;
  const overLimit = batches.filter((b) => b.deltaE > 1.0).length;
  const orders = new Set(batches.map((b) => b.orderNo)).size;
  const passed = batches.filter((b) => b.status === "passed").length;
  return {
    total,
    overLimit,
    orders,
    passRate: total === 0 ? 0 : Math.round((passed / total) * 1000) / 10,
  };
}

/** 按客户订单号筛选；orderNo 为空串表示全部。匹配忽略大小写与首尾空格。 */
export function filterByOrder(batches: SampleBatch[], orderNo: string): SampleBatch[] {
  const keyword = orderNo.trim().toLowerCase();
  if (keyword === "") return batches;
  return batches.filter((b) => b.orderNo.toLowerCase().includes(keyword));
}

/** 台账中出现过的订单号（去重、按首次出现顺序）。 */
export function listOrderNos(batches: SampleBatch[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  batches.forEach((b) => {
    if (!seen.has(b.orderNo)) {
      seen.add(b.orderNo);
      result.push(b.orderNo);
    }
  });
  return result;
}

/**
 * 生成下一个批次号：沿用 LAB- 前缀加三位序号，如 LAB-625。
 * 兼容 LAB-620A 这类带字母尾缀的历史编号（取数字部分 620）。
 * 无法从既有编号解析序号时从 001 开始。
 */
export function nextBatchId(batches: SampleBatch[]): string {
  let max = 0;
  batches.forEach((b) => {
    const match = /^LAB-(\d+)/i.exec(b.id.trim());
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `LAB-${String(max + 1).padStart(3, "0")}`;
}
