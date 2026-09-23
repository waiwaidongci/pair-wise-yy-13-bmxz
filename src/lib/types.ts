/** 小样台账领域类型（后续接单系统复用） */

export type ReviewStatus = "passed" | "pending" | "redye";

export interface DyeItem {
  /** 染料名称 */
  name: string;
  /** 百分比占比（全部染料合计应为 100） */
  percent: number;
}

export interface Batch {
  id: string;
  orderNo: string;
  fabric: string;
  /** 克重 g/m²，必须大于 0 */
  weight: number;
  recipe: DyeItem[];
  /** 浴比，如 1:10 */
  liquorRatio: string;
  /** 温度曲线摘要 */
  tempCurve: string;
  /** 保温时间（分钟） */
  holdTime: number | null;
  /** 后整理方式 */
  finishing: string;
  /** Lab 色差值 ΔE，≤1.0 才可通过 */
  deltaE: number;
  status: ReviewStatus;
  createdAt: string;
}

/** 新增批次的表单草稿 */
export interface BatchDraft {
  orderNo: string;
  fabric: string;
  weight: number;
  recipe: DyeItem[];
  liquorRatio: string;
  tempCurve: string;
  holdTime: number | null;
  finishing: string;
  deltaE: number;
}

/** 字段级校验错误：键为字段名，值为错误说明 */
export type ValidationErrors = Record<string, string>;

export const STATUS_LABEL: Record<ReviewStatus, string> = {
  passed: "评审通过",
  pending: "待复核",
  redye: "待复染",
};
