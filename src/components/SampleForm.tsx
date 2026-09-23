import { useMemo, useState } from "react";
import {
  DELTA_E_LIMIT,
  FORMULA_TARGET,
  FORMULA_TOLERANCE,
  judgeStatus,
  parseNumberField,
  validateDraft,
  validateFormula,
  type DyeDraft,
  type SampleDraft,
} from "../lab";

interface Props {
  nextId: string;
  onAdd: (draft: SampleDraft) => void;
}

const EMPTY_FORMULA_ROW: DyeDraft = { name: "", percent: "" };

function emptyDraft(): SampleDraft {
  return {
    orderNo: "",
    fabric: "",
    weight: "",
    formula: [{ ...EMPTY_FORMULA_ROW }, { ...EMPTY_FORMULA_ROW }, { ...EMPTY_FORMULA_ROW }],
    liquorRatio: "",
    tempCurve: "",
    holdMinutes: "",
    finishing: "",
    deltaE: "",
  };
}

const inputErrorStyle: React.CSSProperties = { borderColor: "#be123c" };

export default function SampleForm({ nextId, onAdd }: Props) {
  const [draft, setDraft] = useState<SampleDraft>(emptyDraft);
  const [errors, setErrors] = useState<ReturnType<typeof validateDraft>>({});

  // 配方合计实时反馈（不阻断输入）
  const formulaCheck = useMemo(() => validateFormula(draft.formula), [draft.formula]);
  const deltaLive = parseNumberField(draft.deltaE);
  const deltaHint = deltaLive.ok
    ? deltaLive.value! > DELTA_E_LIMIT
      ? `ΔE ${deltaLive.value!.toFixed(2)} 超 ${DELTA_E_LIMIT.toFixed(1)}，保存后为「待复染」`
      : `ΔE ${deltaLive.value!.toFixed(2)} 合格，保存后可复核通过`
    : "";

  function patch<K extends keyof SampleDraft>(key: K, value: SampleDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function patchRow(index: number, key: keyof DyeDraft, value: string) {
    setDraft((d) => ({
      ...d,
      formula: d.formula.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  }

  function addRow() {
    patch("formula", [...draft.formula, { ...EMPTY_FORMULA_ROW }]);
  }

  function removeRow(index: number) {
    patch("formula", draft.formula.length > 1 ? draft.formula.filter((_, i) => i !== index) : draft.formula);
  }

  function handleSubmit() {
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onAdd(draft);
    setDraft(emptyDraft());
    setErrors({});
  }

  const sumClass =
    formulaCheck.filledCount === 0 || Math.abs(formulaCheck.diff) <= FORMULA_TOLERANCE ? "hint ok" : "hint bad";

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>新增小样</p>
          <h2>
            批次号 <span className="next-id">{nextId}</span>
          </h2>
        </div>
        <button className="primary" onClick={handleSubmit}>
          保存批次
        </button>
      </div>

      {(errors.orderNo || errors.fabric || errors.weight || errors.formula || errors.deltaE || errors.holdMinutes) && (
        <div className="error-banner">
          <b>无法保存，请修正以下问题：</b>
          <ul>
            {[
              errors.orderNo,
              errors.fabric,
              errors.weight,
              errors.formula,
              errors.holdMinutes,
              errors.deltaE,
            ]
            .filter(Boolean)
            .map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="field-grid">
        <label>
          <span>订单号 *</span>
          <input
            placeholder="如 PO-7781"
            value={draft.orderNo}
            style={errors.orderNo ? inputErrorStyle : undefined}
            onChange={(e) => patch("orderNo", e.target.value)}
          />
          {errors.orderNo && <small className="field-error">{errors.orderNo}</small>}
        </label>

        <label>
          <span>面料成分 *</span>
          <input
            placeholder="如 棉100% 府绸"
            value={draft.fabric}
            style={errors.fabric ? inputErrorStyle : undefined}
            onChange={(e) => patch("fabric", e.target.value)}
          />
          {errors.fabric && <small className="field-error">{errors.fabric}</small>}
        </label>

        <label>
          <span>克重 g/m²（&gt; 0）*</span>
          <input
            inputMode="decimal"
            placeholder="如 120"
            value={draft.weight}
            style={errors.weight ? inputErrorStyle : undefined}
            onChange={(e) => patch("weight", e.target.value)}
          />
          {errors.weight && <small className="field-error">{errors.weight}</small>}
        </label>

        <label>
          <span>色差 ΔE（≤ {DELTA_E_LIMIT.toFixed(1)} 可通过）*</span>
          <input
            inputMode="decimal"
            placeholder="如 0.84"
            value={draft.deltaE}
            style={errors.deltaE ? inputErrorStyle : undefined}
            onChange={(e) => patch("deltaE", e.target.value)}
          />
          {errors.deltaE ? (
            <small className="field-error">{errors.deltaE}</small>
          ) : (
            deltaHint && <small className={deltaLive.value! > DELTA_E_LIMIT ? "hint bad" : "hint ok"}>{deltaHint}</small>
          )}
        </label>

        <label>
          <span>浴比</span>
          <input placeholder="如 1:10" value={draft.liquorRatio} onChange={(e) => patch("liquorRatio", e.target.value)} />
        </label>

        <label>
          <span>保温时间（分钟）</span>
          <input
            inputMode="numeric"
            placeholder="如 30"
            value={draft.holdMinutes}
            style={errors.holdMinutes ? inputErrorStyle : undefined}
            onChange={(e) => patch("holdMinutes", e.target.value)}
          />
          {errors.holdMinutes && <small className="field-error">{errors.holdMinutes}</small>}
        </label>

        <label className="wide">
          <span>温度曲线</span>
          <input
            placeholder="如 60℃恒温，升温 1.5℃/min"
            value={draft.tempCurve}
            onChange={(e) => patch("tempCurve", e.target.value)}
          />
        </label>

        <label className="wide">
          <span>后整理方式</span>
          <input
            placeholder="如 柔软剂 2% 浸轧"
            value={draft.finishing}
            onChange={(e) => patch("finishing", e.target.value)}
          />
        </label>
      </div>

      <div className="formula-block">
        <div className="formula-head">
          <span>染料配方（百分比，合计须为 {FORMULA_TARGET} ± {FORMULA_TOLERANCE}）*</span>
          <span className={sumClass}>
            当前合计 {formulaCheck.total.toFixed(2)}%
            {formulaCheck.filledCount > 0 &&
              Math.abs(formulaCheck.diff) > FORMULA_TOLERANCE &&
              `（偏离 ${formulaCheck.diff > 0 ? "+" : ""}${formulaCheck.diff.toFixed(2)}）`}
          </span>
        </div>
        <div className="formula-rows">
          {draft.formula.map((row, index) => {
            const rowError = errors.formulaRows?.[index];
            return (
              <div className="formula-row" key={index}>
                <input
                  className="formula-name"
                  placeholder={`染料 ${index + 1} 名称`}
                  value={row.name}
                  style={rowError ? inputErrorStyle : undefined}
                  onChange={(e) => patchRow(index, "name", e.target.value)}
                />
                <input
                  className="formula-percent"
                  inputMode="decimal"
                  placeholder="%"
                  value={row.percent}
                  style={rowError ? inputErrorStyle : undefined}
                  onChange={(e) => patchRow(index, "percent", e.target.value)}
                />
                <button
                  type="button"
                  className="row-remove"
                  title="删除该染料"
                  disabled={draft.formula.length <= 1}
                  onClick={() => removeRow(index)}
                >
                  删除
                </button>
                {rowError && <small className="field-error">{rowError}</small>}
              </div>
            );
          })}
        </div>
        <div className="formula-actions">
          <button type="button" onClick={addRow}>
            + 添加染料
          </button>
          {errors.formula && <small className="field-error">{errors.formula}</small>}
        </div>
      </div>

      <p className="save-preview">
        保存后状态判定：
        {(() => {
          const value = deltaLive.ok ? deltaLive.value! : NaN;
          if (Number.isNaN(value)) return "请先填写色差值";
          return judgeStatus(value) === "pending-redye"
            ? `ΔE ${value.toFixed(2)} 超限，将保存为「待复染」`
            : `ΔE ${value.toFixed(2)} 合格，将保存为「待复核」`;
        })()}
      </p>
    </section>
  );
}
