// 小样台账领域类型。页面与后续接单系统共用，不放任何 React / DOM 逻辑。

export type ReviewStatus = "passed" | "pending-redye" | "pending-review";

export const STATUS_LABEL: Record<ReviewStatus, string> = {
  passed: "评审通过",
  "pending-redye": "待复染",
  "pending-review": "待复核",
};

export interface DyeComponent {
  /** 染料名称，如「活性红 3BS」 */
  name: string;
  /** 配方百分比，单位 % */
  percent: number;
}

export interface SampleBatch {
  id: string;
  /** 客户订单号，如 PO-7781 */
  orderNo: string;
  /** 面料成分，如 棉100% */
  fabric: string;
  /** 克重 g/m²，必须 > 0 */
  weight: number;
  /** 染料配方，各项百分比合计应在 100 ± 0.5 */
  formula: DyeComponent[];
  /** 浴比，如 1:10 */
  liquorRatio: string;
  /** 温度曲线，如 60℃×30min 升温 1.5℃/min */
  tempCurve: string;
  /** 保温时间（分钟） */
  holdMinutes: number;
  /** 后整理方式，如 柔软剂 2% */
  finishing: string;
  /** Lab 色差 ΔE，> 1.0 判为待复染 */
  deltaE: number;
  status: ReviewStatus;
  createdAt: string;
}

/** 表单草稿：数值字段在输入阶段一律为字符串，校验通过后才转类型。 */
export interface SampleDraft {
  orderNo: string;
  fabric: string;
  weight: string;
  formula: DyeDraft[];
  liquorRatio: string;
  tempCurve: string;
  holdMinutes: string;
  finishing: string;
  deltaE: string;
}

export interface DyeDraft {
  name: string;
  percent: string;
}

/** 字段级错误：key 为草稿字段名；染料明细错误挂到 formulaRows 下标上。 */
export type ValidationErrors = {
  orderNo?: string;
  fabric?: string;
  weight?: string;
  formula?: string;
  formulaRows?: Record<number, string>;
  liquorRatio?: string;
  tempCurve?: string;
  holdMinutes?: string;
  finishing?: string;
  deltaE?: string;
};

export const FORMULA_TARGET = 100;
export const FORMULA_TOLERANCE = 0.5;
export const DELTA_E_LIMIT = 1.0;
