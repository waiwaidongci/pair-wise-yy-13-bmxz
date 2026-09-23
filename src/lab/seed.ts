// 初始台账：首次打开且本地无存档时使用，原静态样例的三个批次补齐为完整数据。
import type { SampleBatch } from "./types";

export const SEED_BATCHES: SampleBatch[] = [
  {
    id: "LAB-620A",
    orderNo: "PO-7781",
    fabric: "棉100% 府绸",
    weight: 120,
    formula: [
      { name: "活性红3BS", percent: 62 },
      { name: "活性黄3RS", percent: 26 },
      { name: "活性蓝BRF", percent: 12 },
    ],
    liquorRatio: "1:10",
    tempCurve: "60℃恒温，升温 1.5℃/min",
    holdMinutes: 30,
    finishing: "柔软剂 2% 浸轧",
    deltaE: 0.84,
    status: "passed",
    createdAt: "2026-09-18 10:22",
  },
  {
    id: "LAB-621C",
    orderNo: "PO-7785",
    fabric: "涤纶100% 针织",
    weight: 165,
    formula: [
      { name: "分散红玉S-5BL", percent: 55 },
      { name: "分散橙S-4RL", percent: 30 },
      { name: "分散蓝HGL", percent: 15 },
    ],
    liquorRatio: "1:12",
    tempCurve: "130℃高温，升温曲线偏快",
    holdMinutes: 40,
    finishing: "还原清洗",
    deltaE: 1.42,
    status: "pending-redye",
    createdAt: "2026-09-19 14:05",
  },
  {
    id: "LAB-624B",
    orderNo: "PO-7781",
    fabric: "涤棉 65/35 斜纹",
    weight: 210,
    formula: [
      { name: "分散黄棕S-2RFL", percent: 40 },
      { name: "活性红3BS", percent: 35 },
      { name: "活性黄3RS", percent: 25 },
    ],
    liquorRatio: "1:10",
    tempCurve: "130℃/60℃ 两浴法",
    holdMinutes: 35,
    finishing: "柔软剂 2%，客户确认中",
    deltaE: 0.96,
    status: "pending-review",
    createdAt: "2026-09-21 09:40",
  },
];
