import { useState, useMemo } from "react";
import HistRow from "./HistRow";
import { formatDateLong, formatTime, numFormat, percentStr, barColor } from "../utils/format";

export default function HistoryTab({ data, onSave, T, isPC }) {
  const [histDate, setHistDate] = useState(null);

  const dGroups = useMemo(() => {
    const g = {};
    data.matches.forEach((m) => {
      if (!g[m.date]) g[m.date] = [];
      g[m.date].push(m);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  const selDay = useMemo(
    () => histDate ? data.matches.filter((m) => m.date === histDate) : [],
    [data, histDate],
  );

  const deleteMatch = (idx) => {
    const nm = [...data.matches];
    nm.splice(idx, 1);
    onSave({ ...data, matches: nm });
  };

  const cd = {
    background: T.card,
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 12,
    boxShadow: T.sh,
    border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none",
  };

  const emptyMsg = (msg) => (
    <div style={{ textAlign: "center", padding: "32px 0", color: T.dim, fontSize: 13 }}>
      {msg}
    </div>
  );

  // Mobile layout
  if (!isPC) {
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>日別戦績</div>
        {!histDate ? (
          <div>
            {dGroups.length === 0
              ? emptyMsg("対戦を記録すると日別の戦績が表示されます")
              : dGroups.map(([dt, ms]) => {
                  const w = ms.filter((m) => m.result === "win").length;
                  const dp = data.daily?.[dt];
                  return (
                    <button key={dt} onClick={() => setHistDate(dt)} style={{ ...cd, display: "flex", alignItems: "center", width: "100%", cursor: "pointer", textAlign: "left", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{formatDateLong(dt)}</div>
                        <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{ms.length}戦{dp?.start ? ` · ${numFormat(dp.start)}${dp.end ? "→" + numFormat(dp.end) : ""}` : ""}</div>
                      </div>
                      <div style={{ textAlign: "right", marginRight: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: "#34C759" }}>{w}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: "#FF3B30" }}>{ms.length - w}</span></div>
                        <div style={{ fontSize: 12, color: T.dim }}>{percentStr(w, ms.length)}</div>
                      </div>
                      <span style={{ color: T.dimmer, fontSize: 20 }}>›</span>
                    </button>
                  );
                })}
          </div>
        ) : (
          <div>
            <button onClick={() => setHistDate(null)} style={{ background: "transparent", border: "none", color: "#FF3B30", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}>← 戻る</button>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{formatDateLong(histDate)}</div>
            {(() => { const w = selDay.filter((m) => m.result === "win").length; return <div style={{ fontSize: 14, color: T.sub, marginTop: 4, marginBottom: 16 }}>{selDay.length}戦 · <span style={{ color: "#34C759", fontWeight: 700 }}>{w}W</span> - <span style={{ color: "#FF3B30", fontWeight: 700 }}>{selDay.length - w}L</span> · {percentStr(w, selDay.length)}</div>; })()}
            {selDay.map((m, i) => { let ri = -1, c = 0; for (let j = 0; j < data.matches.length; j++) { if (data.matches[j].date === histDate) { if (c === i) { ri = j; break; } c++; } } return <HistRow key={i} m={m} onDelete={ri >= 0 ? () => deleteMatch(ri) : null} T={T} />; })}
          </div>
        )}
      </div>
    );
  }

  // PC layout - master/detail with table
  const selW = selDay.filter((m) => m.result === "win").length;

  const thStyle = { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.dim, borderBottom: `2px solid ${T.inp}`, whiteSpace: "nowrap" };
  const tdStyle = { padding: "14px 16px", fontSize: 14, borderBottom: `1px solid ${T.inp}`, whiteSpace: "nowrap" };

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Left: date list */}
      <div style={{ width: 340, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>日別戦績</div>
        <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {dGroups.length === 0
            ? emptyMsg("対戦を記録すると日別の戦績が表示されます")
            : dGroups.map(([dt, ms]) => {
                const w = ms.filter((m) => m.result === "win").length;
                const r = ms.length ? w / ms.length : 0;
                const dp = data.daily?.[dt];
                const active = histDate === dt;
                return (
                  <button
                    key={dt}
                    onClick={() => setHistDate(dt)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 18px",
                      marginBottom: 4,
                      background: active ? (data.dark ? "rgba(255,59,48,.12)" : "rgba(255,59,48,.06)") : T.card,
                      border: active ? "2px solid #FF3B30" : (T.brd !== "transparent" ? `1px solid ${T.brd}` : `1px solid ${T.inp}`),
                      borderRadius: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: active ? "0 2px 12px rgba(255,59,48,.15)" : T.sh,
                      transition: "all .15s ease",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: active ? "#FF3B30" : T.text }}>{formatDateLong(dt)}</div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>
                        {ms.length}戦{dp?.start ? ` · ${numFormat(dp.start)}${dp.end ? " → " + numFormat(dp.end) : ""}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>
                        <span style={{ color: "#34C759" }}>{w}</span>
                        <span style={{ color: T.dimmer }}> : </span>
                        <span style={{ color: "#FF3B30" }}>{ms.length - w}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: barColor(r) }}>{percentStr(w, ms.length)}</div>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Right: detail table */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!histDate ? (
          <div style={{ ...cd, padding: "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>日付を選択してください</div>
            <div style={{ fontSize: 13, color: T.dim }}>左のリストから日付をクリックすると詳細が表示されます</div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{formatDateLong(histDate)}</div>
              <div style={{ fontSize: 14, color: T.sub }}>
                {selDay.length}戦 · <span style={{ color: "#34C759", fontWeight: 700 }}>{selW}W</span> - <span style={{ color: "#FF3B30", fontWeight: 700 }}>{selDay.length - selW}L</span> · {percentStr(selW, selDay.length)}
              </div>
            </div>

            <div style={{ ...cd, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.inp }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>結果</th>
                    <th style={thStyle}>使用キャラ</th>
                    <th style={thStyle}>相手キャラ</th>
                    <th style={thStyle}>時刻</th>
                    <th style={thStyle}>メモ</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {selDay.map((m, i) => {
                    let ri = -1, c = 0;
                    for (let j = 0; j < data.matches.length; j++) {
                      if (data.matches[j].date === histDate) { if (c === i) { ri = j; break; } c++; }
                    }
                    return (
                      <tr key={i} style={{ transition: "background .1s" }} onMouseEnter={(e) => e.currentTarget.style.background = T.inp} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ ...tdStyle, color: T.dim, fontSize: 12, fontWeight: 600 }}>{i + 1}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                            background: m.result === "win" ? "rgba(52,199,89,.15)" : "rgba(255,59,48,.15)",
                            color: m.result === "win" ? "#16a34a" : "#dc2626",
                          }}>
                            {m.result === "win" ? "WIN" : "LOSE"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{m.myChar}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{m.oppChar}</td>
                        <td style={{ ...tdStyle, color: T.dim, fontSize: 13 }}>{formatTime(m.time)}</td>
                        <td style={{ ...tdStyle, color: T.sub, fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{m.memo || "\u2014"}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          {ri >= 0 && (
                            <button onClick={() => deleteMatch(ri)} style={{ border: "none", background: "rgba(220,38,38,.1)", color: "#dc2626", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 8, cursor: "pointer" }}>削除</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
