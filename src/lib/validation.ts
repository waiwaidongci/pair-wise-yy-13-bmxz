/**
 * 小样台账校验规则（纯函数，供页面与后续接单系统复用）
 */
import type { BatchDraft, DyeItem, ReviewStatus } from "./types";

/** 色差合格上限：ΔE ≤ 1.0 */
export const DELTA_E_LIMIT = 1.0;
/** 染料配方目标合计 */
export const RECIPE_SUM_TARGET = 100;
/** 配方合计允许偏差 */
export const RECIPE_SUM_TOLERANCE = 0.5;

/** 解析数值输入：空串视为缺失 */
export function parseNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

/**
 * 校验染料配方：
 * 1. 单项百分比必须为非负数；
 * 2. 百分比合计与 100 的偏差不得超过 0.5。
 * 返回的错误信息会指出具体是哪一项不合格。
 */
export function validateRecipe(recipe: DyeItem[]): string | null {
  if (recipe.length === 0) {
    return "请至少填写一项染料配方";
  }

  for (const item of recipe) {
    if (!Number.isFinite(item.percent)) {
      return `染料「${item.name || "未命名"}」的百分比不是有效数值`;
    }
    if (item.percent < 0) {
      return `染料「${item.name || "未命名"}」的百分比不能为负数`;
    }
  }

  const total = recipe.reduce((sum, item) => sum + item.percent, 0);
  const diff = Math.abs(total - RECIPE_SUM_TARGET);
  if (diff > RECIPE_SUM_TOLERANCE) {
    const overUnder = total > RECIPE_SUM_TARGET ? "高出" : "低于";
    return `染料配方合计 ${total.toFixed(2)}%，${overUnder} ${RECIPE_SUM_TARGET}% 达 ${diff.toFixed(2)}%，超过 ±${RECIPE_SUM_TOLERANCE}% 允许偏差，请调整各染料占比`;
  }

  return null;
}

/** 校验新增批次草稿，返回字段 -> 错误信息映射（空对象表示通过） */
export function validateBatchDraft(draft: BatchDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft.orderNo.trim()) {
    errors.orderNo = "请填写客户订单号";
  }
  if (!draft.fabric.trim()) {
    errors.fabric = "请填写面料成分";
  }
  if (!Number.isFinite(draft.weight) || draft.weight <= 0) {
    errors.weight = "克重必须为大于 0 的数值";
  }

  const recipeError = validateRecipe(draft.recipe);
  if (recipeError) errors.recipe = recipeError;

  if (!Number.isFinite(draft.deltaE) || draft.deltaE < 0) {
    errors.deltaE = "色差值必须为不小于 0 的数值";
  }

  if (draft.holdTime !== null && (!Number.isFinite(draft.holdTime) || draft.holdTime < 0)) {
    errors.holdTime = "保温时间必须为不小于 0 的数值";
  }

  return errors;
}

/** 色差是否合格（≤1.0 方可标记通过） */
export function isDeltaEQualified(deltaE: number): boolean {
  return Number.isFinite(deltaE) && deltaE <= DELTA_E_LIMIT;
}

/**
 * 通过按钮不可用原因：
 * 超限时返回原因说明，合格但已通过返回状态说明，其余返回 null（可点击）。
 */
export function passDisabledReason(
  status: ReviewStatus,
  deltaE: number
): string | null {
  if (status === "passed") return "该批次已标记通过";
  if (!isDeltaEQualified(deltaE)) {
    return `色差值 ΔE ${deltaE.toFixed(2)} 超过 ${DELTA_E_LIMIT.toFixed(1)}，保存为待复染，不可标记通过`;
  }
  return null;
}
