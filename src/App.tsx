import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { Batch, BatchDraft } from "./lib/types";
import { SEED_BATCHES } from "./lib/seed";
import { loadJSON, saveJSON } from "./lib/storage";
import {
  filterByOrder,
  getStats,
  listOrderNos,
} from "./lib/stats";
import { createBatch, generateBatchId, markPassed } from "./lib/ledger";
import { batchesToCSV } from "./lib/csv";
import MetricsBar from "./components/MetricsBar";
import OrderFilter from "./components/OrderFilter";
import BatchForm from "./components/BatchForm";
import BatchList from "./components/BatchList";

const STORAGE_KEY = "lab-sample-ledger:v1";

function loadBatches(): Batch[] {
  const stored = loadJSON<unknown>(STORAGE_KEY, SEED_BATCHES);
  if (!Array.isArray(stored)) return SEED_BATCHES;
  return stored.filter(
    (item): item is Batch =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Batch).id === "string" &&
      typeof (item as Batch).orderNo === "string" &&
      Number.isFinite((item as Batch).deltaE)
  );
}

export default function App() {
  const [batches, setBatches] = useState<Batch[]>(loadBatches);
  const [orderFilter, setOrderFilter] = useState("");
  const [exportNote, setExportNote] = useState<string | null>(null);

  useEffect(() => {
    saveJSON(STORAGE_KEY, batches);
  }, [batches]);

  const orderNos = useMemo(() => listOrderNos(batches), [batches]);
  const orderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const batch of batches) {
      map.set(batch.orderNo, (map.get(batch.orderNo) ?? 0) + 1);
    }
    return map;
  }, [batches]);

  const filtered = useMemo(
    () => filterByOrder(batches, orderFilter),
    [batches, orderFilter]
  );
  const stats = useMemo(() => getStats(filtered), [filtered]);

  const handleAdd = (draft: BatchDraft) => {
    setBatches((prev) => {
      const batch = createBatch(
        draft,
        generateBatchId(prev),
        new Date().toISOString()
      );
      return [batch, ...prev];
    });
  };

  const handlePass = (id: string) => {
    setBatches((prev) =>
      prev.map((batch) => (batch.id === id ? markPassed(batch) : batch))
    );
  };

  const handleExport = () => {
    const csv = batchesToCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const scope = orderFilter.trim() ? `-${orderFilter.trim()}` : "-全部";
    link.href = url;
    link.download = `小样台账${scope}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportNote(
      `已导出当前筛选结果 ${filtered.length} 个批次${
        orderFilter.trim() ? `（订单 ${orderFilter.trim()}）` : "（全部订单）"
      }`
    );
    window.setTimeout(() => setExportNote(null), 3000);
  };

  return (
    <main className="app">
      <section className="hero">
        <p>纺织染整实验室 · 小样台账</p>
        <h1>纺织染整小样管理</h1>
        <span>
          新增小样时校验克重与染料配方合计，色差 ΔE 不超过 1.0
          的批次才可复核通过，超限批次自动保存为待复染。支持按客户订单筛选批次、统计超限数与通过率，并导出当前筛选结果
          CSV。数据保存在浏览器本地，校验与统计模块可被后续接单系统直接复用。
        </span>
      </section>

      <MetricsBar stats={stats} filtered={orderFilter.trim() !== ""} />

      <section className="workspace">
        <OrderFilter
          orderNos={orderNos}
          value={orderFilter}
          onChange={setOrderFilter}
          counts={orderCounts}
        />
        <BatchForm onAdd={handleAdd} />
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>近期记录{orderFilter.trim() ? " · 已按订单筛选" : ""}</p>
            <h2>
              小样批次列表（{filtered.length}
              {orderFilter.trim() ? ` / 共 ${batches.length}` : ""}）
            </h2>
          </div>
          <div className="heading-actions">
            {exportNote ? <span className="export-note">{exportNote}</span> : null}
            <button type="button" onClick={handleExport}>
              导出CSV（当前筛选）
            </button>
          </div>
        </div>
        <BatchList
          batches={filtered}
          filterActive={orderFilter.trim() !== ""}
          onPass={handlePass}
        />
      </section>
    </main>
  );
}
