interface OrderOption {
  orderNo: string;
  count: number;
}

interface Props {
  keyword: string;
  options: OrderOption[];
  totalCount: number;
  onKeywordChange: (value: string) => void;
  onPick: (orderNo: string) => void;
}

export default function OrderFilter({ keyword, options, totalCount, onKeywordChange, onPick }: Props) {
  const active = keyword.trim();
  return (
    <aside className="panel filter-panel">
      <h2>客户订单</h2>
      <input
        className="filter-search"
        placeholder="输入订单号筛选，如 PO-7781"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
      />
      <div className="chips filter-chips">
        <button className={active === "" ? "chip active" : "chip"} onClick={() => onPick("")}>
          全部订单 <em>{totalCount}</em>
        </button>
        {options.map((opt) => {
          const selected = active.toLowerCase() === opt.orderNo.toLowerCase();
          return (
            <button
              key={opt.orderNo}
              className={selected ? "chip active" : "chip"}
              onClick={() => onPick(selected ? "" : opt.orderNo)}
            >
              {opt.orderNo} <em>{opt.count}</em>
            </button>
          );
        })}
      </div>
      {active && (
        <button className="clear-filter" onClick={() => onPick("")}>
          清除筛选（当前：{active}）
        </button>
      )}
      <p className="filter-note">筛选结果会同步更新批次列表、超限数与通过率，CSV 也只导出当前结果。</p>
    </aside>
  );
}
