// 纯校验逻辑：不依赖 React / localStorage，接单系统可直接复用。
import {
  DELTA_E_LIMIT,
  FORMULA_TARGET,
  FORMULA_TOLERANCE,
  type DyeDraft,
  type ReviewStatus,
  type SampleDraft,
  type ValidationErrors,
} from "./types";

export interface NumberFieldResult {
  ok: boolean;
  value?: number;
  message?: string;
}

/** 通用数值字段解析：必填、必须为数字。positive=true 时要求 > 0。 */
export function parseNumberField(raw: string, { positive = false } = {}): NumberFieldResult {
  const text = raw.trim();
  if (text === "") return { ok: false, message: "请填写数值" };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, message: "必须是数字" };
  if (positive && value <= 0) return { ok: false, message: "克重必须大于 0" };
  return { ok: true, value };
}

export interface FormulaRowError {
  name?: string;
  percent?: string;
}

/** 校验单条染料：名称必填，百分比为非负数字（0 允许，表示记录但不投料）。 */
export function validateFormulaRow(row: DyeDraft): FormulaRowError {
  const error: FormulaRowError = {};
  if (!row.name.trim()) error.name = "染料名称未填写";
  const text = row.percent.trim();
  if (text === "") {
    error.percent = "百分比未填写";
  } else {
    const value = Number(text);
    if (!Number.isFinite(value)) error.percent = "必须是数字";
    else if (value < 0) error.percent = "百分比不能为负";
  }
  return error;
}

export interface FormulaCheck {
  total: number;
  diff: number;
  ok: boolean;
  /** 已填写的染料行数（名称和百分比都为空的行忽略） */
  filledCount: number;
  rowErrors: Record<number, string>;
  /** 明细本身合格但合计偏离 100 时给出说明 */
  totalMessage?: string;
}

/**
 * 校验染料配方：
 * 1. 至少一条染料；2. 每条名称/百分比合法；3. 合计偏离 100 不得超过 0.5。
 */
export function validateFormula(rows: DyeDraft[]): FormulaCheck {
  const rowErrors: Record<number, string> = {};
  let total = 0;
  let filledCount = 0;

  rows.forEach((row, originalIndex) => {
    if (row.name.trim() === "" && row.percent.trim() === "") return;
    filledCount += 1;
    const err = validateFormulaRow(row);
    if (err.name) rowErrors[originalIndex] = err.name;
    else if (err.percent) rowErrors[originalIndex] = err.percent;
    if (!err.percent) total += Number(row.percent);
  });

  const diff = total - FORMULA_TARGET;
  const ok = filledCount > 0 && Object.keys(rowErrors).length === 0 && Math.abs(diff) <= FORMULA_TOLERANCE;
  let totalMessage: string | undefined;
  if (filledCount === 0) {
    totalMessage = "请至少填写一条染料配方";
  } else if (Object.keys(rowErrors).length > 0) {
    totalMessage = "染料明细存在未合格项，请先修正";
  } else if (Math.abs(diff) > FORMULA_TOLERANCE) {
    totalMessage =
      diff > 0
        ? `配方合计 ${total.toFixed(2)}%，高于 100% ${diff.toFixed(2)} 个百分点（允许 ±${FORMULA_TOLERANCE}）`
        : `配方合计 ${total.toFixed(2)}%，低于 100% ${Math.abs(diff).toFixed(2)} 个百分点（允许 ±${FORMULA_TOLERANCE}）`;
  }

  return { total, diff, ok, filledCount, rowErrors, totalMessage };
}

/** 整表校验，返回字段级错误；errors 为空对象即通过。 */
export function validateDraft(draft: SampleDraft): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!draft.orderNo.trim()) errors.orderNo = "请填写订单号";
  if (!draft.fabric.trim()) errors.fabric = "请填写面料成分";

  const weight = parseNumberField(draft.weight, { positive: true });
  if (!weight.ok) errors.weight = weight.message;

  const formula = validateFormula(draft.formula);
  if (formula.rowErrors && Object.keys(formula.rowErrors).length > 0) {
    errors.formulaRows = formula.rowErrors;
  }
  if (!formula.ok) errors.formula = formula.totalMessage;

  const hold = parseNumberField(draft.holdMinutes);
  if (!hold.ok) errors.holdMinutes = hold.message;
  else if ((hold.value ?? 0) < 0) errors.holdMinutes = "保温时间不能为负";

  const deltaE = parseNumberField(draft.deltaE);
  if (!deltaE.ok) errors.deltaE = deltaE.message;
  else if ((deltaE.value ?? 0) < 0) errors.deltaE = "色差值不能为负";

  return errors;
}

/** 色差评定：ΔE 不超过 1.0 可进入复核，否则只能待复染。 */
export function judgeStatus(deltaE: number): ReviewStatus {
  return deltaE <= DELTA_E_LIMIT ? "pending-review" : "pending-redye";
}

/** 复核动作是否允许，失败时返回面向操作员的原因。 */
export function passReason(status: ReviewStatus, deltaE: number): string | null {
  if (status === "passed") return "该批次已标记通过，无需重复操作";
  if (deltaE > DELTA_E_LIMIT)
    return `色差 ΔE ${deltaE.toFixed(2)} 超过限值 ${DELTA_E_LIMIT.toFixed(1)}，需重新打样后复核`;
  return null;
}
