// CSV 导出：纯转换函数与触发下载分开，转换部分可被接单系统直接复用。
import { STATUS_LABEL, type SampleBatch } from "./types";

const COLUMNS = [
  "批次号",
  "订单号",
  "面料成分",
  "克重(g/m²)",
  "染料配方",
  "浴比",
  "温度曲线",
  "保温时间(min)",
  "后整理方式",
  "色差ΔE",
  "评审结果",
  "创建时间",
] as const;

/** CSV 单元格转义：含逗号、引号、换行时用双引号包裹，内部引号双写。 */
export function escapeCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function formatFormula(batch: SampleBatch): string {
  return batch.formula.map((d) => `${d.name} ${d.percent}%`).join("；");
}

/** 按当前（已筛选的）台账生成 CSV 文本。 */
export function batchesToCsv(batches: SampleBatch[]): string {
  const rows = batches.map((b) =>
    [
      b.id,
      b.orderNo,
      b.fabric,
      b.weight,
      formatFormula(b),
      b.liquorRatio,
      b.tempCurve,
      b.holdMinutes,
      b.finishing,
      b.deltaE,
      STATUS_LABEL[b.status],
      b.createdAt,
    ]
      .map(escapeCell)
      .join(",")
  );
  // BOM 让 Excel 正确识别 UTF-8 中文
  return "﻿" + [COLUMNS.join(","), ...rows].join("\r\n");
}

/** 页面侧调用：触发浏览器下载当前筛选结果。 */
export function downloadCsv(batches: SampleBatch[], filename: string): void {
  const blob = new Blob([batchesToCsv(batches)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
