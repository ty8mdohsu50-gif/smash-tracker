import { useMemo, useState } from "react";

const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];
const WEEKS = 13;

function getCellColor(count, T) {
  if (!count) return T.inp;
  if (count <= 5) return `${T.accent}55`;
  if (count <= 15) return `${T.accent}99`;
  return T.accent;
}

function buildGrid(matches) {
  const countByDate = {};
  const winByDate = {};
  for (const m of matches) {
    if (!countByDate[m.date]) {
      countByDate[m.date] = 0;
      winByDate[m.date] = 0;
    }
    countByDate[m.date]++;
    if (m.result === "win") winByDate[m.date]++;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDay = new Date(today);
  const dayOfWeek = startDay.getDay();
  startDay.setDate(startDay.getDate() - dayOfWeek - (WEEKS - 1) * 7);

  const cells = [];
  for (let week = 0; week < WEEKS; week++) {
    const col = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + week * 7 + day);
      const dateStr = date.toISOString().split("T")[0];
      const isFuture = date > today;
      col.push({
        dateStr,
        count: isFuture ? -1 : (countByDate[dateStr] || 0),
        wins: winByDate[dateStr] || 0,
        date,
      });
    }
    cells.push(col);
  }

  const monthLabels = [];
  let lastMonth = -1;
  for (let week = 0; week < WEEKS; week++) {
    const firstCell = cells[week][0];
    const month = firstCell.date.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ week, month: month + 1 });
      lastMonth = month;
    } else {
      monthLabels.push(null);
    }
  }

  return { cells, monthLabels };
}

export default function Heatmap({ matches, T, isPC }) {
  const [tooltip, setTooltip] = useState(null);

  const { cells, monthLabels } = useMemo(() => buildGrid(matches), [matches]);

  const cellSize = isPC ? 16 : 12;
  const gap = isPC ? 4 : 3;

  return (
    <div>
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 0 }}>
          {/* Month labels row */}
          <div style={{ display: "flex", marginLeft: 22, marginBottom: 4, gap: gap }}>
            {monthLabels.map((label, i) => (
              <div
                key={i}
                style={{
                  width: cellSize,
                  fontSize: 9,
                  color: label ? T.sub : "transparent",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  letterSpacing: 0,
                }}
              >
                {label ? `${label.month}月` : ""}
              </div>
            ))}
          </div>

          {/* Grid rows (day of week) */}
          <div style={{ display: "flex", gap: gap }}>
            {/* Day labels column */}
            <div style={{ display: "flex", flexDirection: "column", gap: gap, marginRight: 4 }}>
              {WEEK_DAYS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: cellSize,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    fontSize: 9,
                    color: T.dim,
                    fontWeight: 600,
                    userSelect: "none",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks columns */}
            {cells.map((col, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: gap }}>
                {col.map((cell, di) => {
                  const isFuture = cell.count < 0;
                  return (
                    <div
                      key={di}
                      title={!isFuture ? `${cell.dateStr}: ${cell.count}戦 ${cell.wins}勝${cell.count - cell.wins}敗` : ""}
                      onClick={() => {
                        if (!isFuture && cell.count > 0) {
                          setTooltip(tooltip?.dateStr === cell.dateStr ? null : cell);
                        }
                      }}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 3,
                        background: isFuture ? "transparent" : getCellColor(cell.count, T),
                        cursor: (!isFuture && cell.count > 0) ? "pointer" : "default",
                        transition: "opacity .15s ease",
                        border: tooltip?.dateStr === cell.dateStr ? `1px solid ${T.accent}` : "1px solid transparent",
                        boxSizing: "border-box",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 14px",
            background: T.card,
            borderRadius: 10,
            border: `1px solid ${T.brd}`,
            fontSize: 13,
            color: T.text,
            display: "flex",
            alignItems: "center",
            gap: 14,
            animation: "fadeUp .15s ease",
          }}
        >
          <span style={{ fontWeight: 700, color: T.sub }}>{tooltip.dateStr}</span>
          <span style={{ fontWeight: 700 }}>{tooltip.count}戦</span>
          <span style={{ color: T.win, fontWeight: 700 }}>{tooltip.wins}勝</span>
          <span style={{ color: T.lose, fontWeight: 700 }}>{tooltip.count - tooltip.wins}敗</span>
          <button
            onClick={() => setTooltip(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: T.dim, fontSize: 16, cursor: "pointer", padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: T.dim }}>少</span>
        {[0, 3, 8, 20].map((count, i) => (
          <div
            key={i}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 3,
              background: getCellColor(count, T),
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: T.dim }}>多</span>
      </div>
    </div>
  );
}
