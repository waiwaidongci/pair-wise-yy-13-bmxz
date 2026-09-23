import { useMemo, useState } from "react";
import type { BatchDraft, ValidationErrors } from "../lib/types";
import {
  parseNumberInput,
  validateBatchDraft,
  RECIPE_SUM_TARGET,
  RECIPE_SUM_TOLERANCE,
} from "../lib/validation";
import { normalizeRecipe } from "../lib/ledger";

interface RecipeRow {
  name: string;
  percent: string;
}

interface BatchFormProps {
  onAdd: (draft: BatchDraft) => void;
}

const EMPTY_FORM = {
  orderNo: "",
  fabric: "",
  weight: "",
  liquorRatio: "1:10",
  tempCurve: "",
  holdTime: "",
  finishing: "",
  deltaE: "",
};

export default function BatchForm({ onAdd }: BatchFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [rows, setRows] = useState<RecipeRow[]>([
    { name: "", percent: "" },
    { name: "", percent: "" },
    { name: "", percent: "" },
  ]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  /** 实时合计（空白/非法行按 0 处理，仅用于提示） */
  const recipeTotal = useMemo(
    () =>
      rows.reduce((sum, row) => sum + (parseNumberInput(row.percent) ?? 0), 0),
    [rows]
  );
  const recipeDiff = Math.abs(recipeTotal - RECIPE_SUM_TARGET);
  const recipeOff = recipeTotal > 0 && recipeDiff > RECIPE_SUM_TOLERANCE;

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setRow = (index: number, patch: Partial<RecipeRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
    setErrors((prev) => {
      if (!prev.recipe) return prev;
      const next = { ...prev };
      delete next.recipe;
      return next;
    });
  };

  const addRow = () =>
    setRows((prev) => [...prev, { name: "", percent: "" }]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const reset = () => {
    setForm(EMPTY_FORM);
    setRows([
      { name: "", percent: "" },
      { name: "", percent: "" },
      { name: "", percent: "" },
    ]);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const recipe = normalizeRecipe(
      rows.map((row) => ({
        name: row.name,
        percent: parseNumberInput(row.percent),
      }))
    );
    const draft: BatchDraft = {
      orderNo: form.orderNo,
      fabric: form.fabric,
      weight: parseNumberInput(form.weight) ?? 0,
      recipe,
      liquorRatio: form.liquorRatio,
      tempCurve: form.tempCurve,
      holdTime: parseNumberInput(form.holdTime),
      finishing: form.finishing,
      deltaE: parseNumberInput(form.deltaE) ?? NaN,
    };

    const nextErrors = validateBatchDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNotice(null);
      return;
    }

    onAdd(draft);
    reset();
    setErrors({});
    setNotice(
      draft.deltaE > 1.0
        ? `已保存为待复染：ΔE ${draft.deltaE.toFixed(2)} 超过 1.0`
        : "小样批次已保存，等待复核"
    );
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>专业字段</p>
          <h2>新增小样批次</h2>
        </div>
        <button type="submit" form="batch-form" className="primary">
          保存记录
        </button>
      </div>

      {Object.keys(errors).length > 0 ? (
        <div className="alert error" role="alert">
          <b>表单存在 {Object.keys(errors).length} 项错误：</b>
          {Object.entries(errors).map(([field, message]) => (
            <span key={field}>{message}</span>
          ))}
        </div>
      ) : null}
      {notice ? (
        <div className="alert success" role="status">
          {notice}
        </div>
      ) : null}

      <form id="batch-form" className="field-grid" onSubmit={handleSubmit} noValidate>
        <label className={errors.orderNo ? "invalid" : ""}>
          <span>客户订单号 *</span>
          <input
            value={form.orderNo}
            placeholder="如 PO-240901"
            onChange={(e) => setField("orderNo", e.target.value)}
          />
          {errors.orderNo ? <em className="field-error">{errors.orderNo}</em> : null}
        </label>

        <label className={errors.fabric ? "invalid" : ""}>
          <span>面料成分 *</span>
          <input
            value={form.fabric}
            placeholder="如 100% 棉府绸"
            onChange={(e) => setField("fabric", e.target.value)}
          />
          {errors.fabric ? <em className="field-error">{errors.fabric}</em> : null}
        </label>

        <label className={errors.weight ? "invalid" : ""}>
          <span>克重 g/m² *（须大于 0）</span>
          <input
            inputMode="decimal"
            value={form.weight}
            placeholder="如 120"
            onChange={(e) => setField("weight", e.target.value)}
          />
          {errors.weight ? <em className="field-error">{errors.weight}</em> : null}
        </label>

        <label className={errors.deltaE ? "invalid" : ""}>
          <span>Lab 色差值 ΔE *（≤1.0 可通过）</span>
          <input
            inputMode="decimal"
            value={form.deltaE}
            placeholder="如 0.84"
            onChange={(e) => setField("deltaE", e.target.value)}
          />
          {errors.deltaE ? <em className="field-error">{errors.deltaE}</em> : null}
        </label>

        <label>
          <span>浴比</span>
          <input
            value={form.liquorRatio}
            placeholder="如 1:10"
            onChange={(e) => setField("liquorRatio", e.target.value)}
          />
        </label>

        <label className={errors.holdTime ? "invalid" : ""}>
          <span>保温时间（分钟）</span>
          <input
            inputMode="numeric"
            value={form.holdTime}
            placeholder="如 40"
            onChange={(e) => setField("holdTime", e.target.value)}
          />
          {errors.holdTime ? <em className="field-error">{errors.holdTime}</em> : null}
        </label>

        <label>
          <span>温度曲线</span>
          <input
            value={form.tempCurve}
            placeholder="如 60℃固色 40min，升温 1.5℃/min"
            onChange={(e) => setField("tempCurve", e.target.value)}
          />
        </label>

        <label>
          <span>后整理方式</span>
          <input
            value={form.finishing}
            placeholder="如 柔软剂 2% 浸轧"
            onChange={(e) => setField("finishing", e.target.value)}
          />
        </label>

        <div className={`recipe-editor ${errors.recipe ? "invalid" : ""}`}>
          <div className="recipe-head">
            <span>
              染料配方（百分比，合计须为 {RECIPE_SUM_TARGET}%，允差 ±
              {RECIPE_SUM_TOLERANCE}%）*
            </span>
            <button type="button" className="mini" onClick={addRow}>
              + 添加染料
            </button>
          </div>
          <div className="recipe-rows">
            {rows.map((row, index) => (
              <div className="recipe-row" key={index}>
                <input
                  value={row.name}
                  placeholder="染料名称"
                  onChange={(e) => setRow(index, { name: e.target.value })}
                />
                <input
                  inputMode="decimal"
                  value={row.percent}
                  placeholder="%"
                  onChange={(e) => setRow(index, { percent: e.target.value })}
                />
                <button
                  type="button"
                  className="mini danger"
                  onClick={() => removeRow(index)}
                  aria-label={`删除第 ${index + 1} 行染料`}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          <p className={`recipe-sum ${recipeOff ? "off" : recipeTotal > 0 ? "ok" : ""}`}>
            当前合计：{recipeTotal.toFixed(2)}%
            {recipeOff
              ? `（偏离 100% 达 ${recipeDiff.toFixed(2)}%，超出 ±${RECIPE_SUM_TOLERANCE}%）`
              : recipeTotal > 0
                ? "（符合 ±0.5% 允差）"
                : ""}
          </p>
          {errors.recipe ? <em className="field-error">{errors.recipe}</em> : null}
        </div>
      </form>
    </section>
  );
}
