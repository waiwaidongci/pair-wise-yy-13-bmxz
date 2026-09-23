/**
 * 台账 CSV 导出（纯文本构造，下载动作由页面负责）
 */
import type { Batch } from "./types";
import { STATUS_LABEL } from "./types";
import { isDeltaEQualified } from "./validation";

export const CSV_HEADERS = [
  "批次号",
  "客户订单号",
  "面料成分",
  "克重(g/m²)",
  "染料配方",
  "浴比",
  "温度曲线",
  "保温时间(min)",
  "后整理方式",
  "色差值ΔE",
  "色差判定",
  "评审结果",
];

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 将批次集合转为 CSV 文本（传入当前筛选结果即可导出筛选结果） */
export function batchesToCSV(batches: Batch[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const batch of batches) {
    const recipe = batch.recipe
      .map((item) => `${item.name} ${item.percent}%`)
      .join("; ");
    lines.push(
      [
        batch.id,
        batch.orderNo,
        batch.fabric,
        String(batch.weight),
        recipe,
        batch.liquorRatio,
        batch.tempCurve,
        batch.holdTime === null ? "" : String(batch.holdTime),
        batch.finishing,
        batch.deltaE.toFixed(2),
        isDeltaEQualified(batch.deltaE) ? "合格" : "超限",
        STATUS_LABEL[batch.status],
      ]
        .map(escapeCell)
        .join(",")
    );
  }
  // BOM 保证 Excel 打开中文不乱码
  return "﻿" + lines.join("\r\n");
}
