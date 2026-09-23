interface OrderFilterProps {
  orderNos: string[];
  /** 当前筛选值（输入框文本） */
  value: string;
  onChange: (value: string) => void;
  /** 各订单命中的批次数 */
  counts: Map<string, number>;
}

export default function OrderFilter({
  orderNos,
  value,
  onChange,
  counts,
}: OrderFilterProps) {
  const trimmed = value.trim();
  return (
    <aside className="panel">
      <h2>客户订单筛选</h2>
      <label>
        <span>订单号</span>
        <input
          value={value}
          placeholder="输入订单号，如 PO-240901"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>

      <div className="chips filter-chips">
        <button
          type="button"
          className={trimmed === "" ? "active" : ""}
          onClick={() => onChange("")}
        >
          全部
        </button>
        {orderNos.map((orderNo) => (
          <button
            key={orderNo}
            type="button"
            className={trimmed === orderNo ? "active" : ""}
            onClick={() => onChange(orderNo)}
            title={`订单 ${orderNo}，共 ${counts.get(orderNo) ?? 0} 个批次`}
          >
            {orderNo}
            <i>{counts.get(orderNo) ?? 0}</i>
          </button>
        ))}
      </div>

      {trimmed !== "" && orderNos.length === 0 ? (
        <p className="filter-hint">暂无任何订单数据</p>
      ) : null}
      <p className="filter-hint">列表、超限数与通过率会随筛选同步更新</p>
    </aside>
  );
}
