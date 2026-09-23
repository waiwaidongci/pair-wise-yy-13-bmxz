// 本地保存：序列化/反序列化为纯函数，localStorage 仅作为可替换的存储后端，
// 后续接单系统可传入自己的 Storage 实现或改为接口调用。
import type { SampleBatch } from "./types";

export const STORAGE_KEY = "lab-sample-ledger:v1";

/** 读入未知数据，结构不合法时返回 null（调用方负责回落到种子数据）。 */
export function deserializeBatches(raw: string | null): SampleBatch[] | null {
  if (raw == null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    if (!data.every((item) => item && typeof item === "object" && typeof (item as SampleBatch).id === "string")) {
      return null;
    }
    return data as SampleBatch[];
  } catch {
    return null;
  }
}

export function serializeBatches(batches: SampleBatch[]): string {
  return JSON.stringify(batches);
}

export interface BatchStore {
  load(): SampleBatch[] | null;
  save(batches: SampleBatch[]): void;
}

export function createLocalStorageStore(key: string = STORAGE_KEY): BatchStore {
  return {
    load() {
      try {
        return deserializeBatches(window.localStorage.getItem(key));
      } catch {
        return null;
      }
    },
    save(batches) {
      try {
        window.localStorage.setItem(key, serializeBatches(batches));
      } catch {
        // 隐私模式或配额超时时静默：台账仍可在当前会话使用。
      }
    },
  };
}
