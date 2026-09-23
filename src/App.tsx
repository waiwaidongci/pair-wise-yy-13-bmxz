import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import SampleForm from "./components/SampleForm";
import OrderFilter from "./components/OrderFilter";
import BatchList from "./components/BatchList";
import StatsBar from "./components/StatsBar";
import {
  computeStats,
  createLocalStorageStore,
  downloadCsv,
  filterByOrder,
  judgeStatus,
  listOrderNos,
  nextBatchId,
  parseNumberField,
  SEED_BATCHES,
  type SampleBatch,
  type SampleDraft,
} from "./lab";

// 本地保存适配器集中在此创建；后续接单系统可替换为接口实现。
const store = createLocalStorageStore();

function nowText(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function App() {
  const [batches, setBatches] = useState<SampleBatch[]>(() => store.load() ?? SEED_BATCHES);
  const [orderKeyword, setOrderKeyword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    store.save(batches);
  }, [batches]);

  // 筛选派生数据：列表、指标、订单下拉选项全部跟随关键字同步。
  const filtered = useMemo(() => filterByOrder(batches, orderKeyword), [batches, orderKeyword]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const orderOptions = useMemo(
    () =>
      listOrderNos(batches).map((orderNo) => ({
        orderNo,
        count: batches.filter((b) => b.orderNo === orderNo).length,
      })),
    [batches]
  );
  const nextId = useMemo(() => nextBatchId(batches), [batches]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  }

  function handleAdd(draft: SampleDraft) {
    // 校验已在表单完成（validateDraft），这里只做类型转换与落库。
    const weight = parseNumberField(draft.weight, { positive: true }).value!;
    const deltaE = parseNumberField(draft.deltaE).value!;
    const status = judgeStatus(deltaE);
    const batch: SampleBatch = {
      id: nextBatchId(batches),
      orderNo: draft.orderNo.trim(),
      fabric: draft.fabric.trim(),
      weight,
      formula: draft.formula
        .filter((row) => row.name.trim() !== "" || row.percent.trim() !== "")
        .map((row) => ({ name: row.name.trim(), percent: Number(row.percent) })),
      liquorRatio: draft.liquorRatio.trim(),
      tempCurve: draft.tempCurve.trim(),
      holdMinutes: parseNumberField(draft.holdMinutes).value ?? 0,
      finishing: draft.finishing.trim(),
      deltaE,
      status,
      createdAt: nowText(),
    };
    setBatches((prev) => [batch, ...prev]);
    flash(
      status === "pending-redye"
        ? `${batch.id} 色差 ΔE ${deltaE.toFixed(2)} 超限，已保存为「待复染」`
        : `${batch.id} 已保存为「待复核」，色差合格后可标记通过`
    );
  }

  function handlePass(id: string) {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, status: "passed" } : b)));
    flash(`${id} 已标记为评审通过`);
  }

  function handleExport() {
    if (filtered.length === 0) {
      flash("当前筛选结果为空，没有可导出的批次");
      return;
    }
    const stamp = nowText().replace(/[^0-9]/g, "").slice(0, 12);
    const suffix = orderKeyword.trim() ? `-${orderKeyword.trim()}` : "";
    downloadCsv(filtered, `小样台账${suffix}-${stamp}.csv`);
  }

  return (
    <main className="app">
      <section className="hero">
        <p>LAB LEDGER · 纺织染整实验室</p>
        <h1>小样台账</h1>
        <span>
          记录面料成分、克重、染料配方与 Lab 色差；配方合计须为 100 ± 0.5%，色差 ΔE 不超过 1.0
          的批次才可复核通过。校验、统计与本地保存逻辑位于 <code>src/lab</code>，可被后续接单系统复用。
        </span>
      </section>

      <StatsBar stats={stats} />

      {notice && <div className="toast">{notice}</div>}

      <section className="workspace">
        <OrderFilter
          keyword={orderKeyword}
          options={orderOptions}
          totalCount={batches.length}
          onKeywordChange={setOrderKeyword}
          onPick={setOrderKeyword}
        />
        <SampleForm nextId={nextId} onAdd={handleAdd} />
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>小样批次</p>
            <h2>
              批次列表{orderKeyword.trim() && <span className="filter-scope">（订单 {orderKeyword.trim()}）</span>}
            </h2>
          </div>
          <button onClick={handleExport}>导出 CSV（当前筛选 {filtered.length} 批）</button>
        </div>
        <BatchList batches={filtered} onPass={handlePass} />
      </section>
    </main>
  );
}
