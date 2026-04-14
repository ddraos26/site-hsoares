function safeNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function MiniTrendBars({ items = [], tone = 'blue' }) {
  const values = items.map((item) => safeNumber(item.value));
  const maxValue = Math.max(...values, 1);

  return (
    <div className={`mini-trend mini-trend--${tone}`} aria-hidden="true">
      {items.map((item) => {
        const value = safeNumber(item.value);
        const height = value > 0 ? Math.max(22, (value / maxValue) * 100) : 14;

        return (
          <div key={item.label} className="mini-trend-item">
            <div className="mini-trend-bar-shell">
              <div className="mini-trend-bar" style={{ height: `${height}%` }} />
            </div>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function MiniSignalRail({ items = [], tone = 'blue' }) {
  const values = items.map((item) => safeNumber(item.value));
  const maxValue = Math.max(...values, 1);

  return (
    <div className={`mini-signal-rail mini-signal-rail--${tone}`} aria-hidden="true">
      {items.map((item) => {
        const value = safeNumber(item.value);
        const width = value > 0 ? Math.max(12, (value / maxValue) * 100) : 10;

        return (
          <div key={item.label} className="mini-signal-row">
            <span>{item.label}</span>
            <div className="mini-signal-track">
              <div className="mini-signal-fill" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
