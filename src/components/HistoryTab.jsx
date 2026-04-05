import { useState, useMemo } from "react";
import { Swords, Share2 } from "lucide-react";
import HistRow from "./HistRow";
import FighterIcon from "./FighterIcon";
import { formatDateLong, formatTime, numFormat, percentStr, barColor } from "../utils/format";

export default function HistoryTab({ data, onSave, T, isPC, onGoBattle }) {
  const [histDate, setHistDate] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);

  const shareDay = async (date, matches) => {
    const w = matches.filter((m) => m.result === "win").length;
    const l = matches.length - w;
    const dp = data.daily?.[date];
    const ss = { showChar: true, showOppChar: true, showPower: true, showRecord: true, ...(data.shareSettings || {}) };
    const myChars = [...new Set(matches.map((m) => m.myChar).filter(Boolean))];
    const topOpp = (() => {
      const cnt = {};
      matches.forEach((m) => { if (m.oppChar) cnt[m.oppChar] = (cnt[m.oppChar] || 0) + 1; });
      const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
      return sorted[0] ? sorted[0][0] : null;
    })();
    const lines = [`【SMASH TRACKER】${formatDateLong(date)}の結果`];
    if (ss.showChar && myChars.length > 0) lines.push(`使用: ${myChars.join(" / ")}`);
    if (ss.showRecord) lines.push(`${w}勝${l}敗（勝率${percentStr(w, matches.length)}）`);
    if (ss.showOppChar && topOpp) lines.push(`最多対戦: ${topOpp}`);
    if (ss.showPower && dp?.start && dp?.end) {
      const delta = dp.end - dp.start;
      lines.push(`戦闘力: ${numFormat(dp.start)} → ${numFormat(dp.end)} (${delta >= 0 ? "+" : ""}${numFormat(delta)})`);
    }
    lines.push("#SmashTracker #スマブラ", "https://ty8mdohsu50-gif.github.io/smash-tracker/");
    const text = lines.join("\n");
    if (navigator.share) {
      try { await navigator.share({ text }); } catch (_) { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus("copied");
        setTimeout(() => setShareStatus(null), 2000);
      } catch (_) {
        setShareStatus("error");
        setTimeout(() => setShareStatus(null), 2000);
      }
    }
  };

  const dGroups = useMemo(() => {
    const g = {};
    data.matches.forEach((m) => {
      if (!g[m.date]) g[m.date] = [];
      g[m.date].push(m);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  const selDayWithIdx = useMemo(() => {
    if (!histDate) return [];
    const result = [];
    data.matches.forEach((m, idx) => {
      if (m.date === histDate) result.push({ m, idx });
    });
    return result.reverse();
  }, [data, histDate]);

  const selDay = useMemo(() => selDayWithIdx.map((e) => e.m), [selDayWithIdx]);

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

  const emptyHistoryState = (onTabClick) => (
    <div style={{ textAlign: "center", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ background: T.accentSoft, borderRadius: "50%", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Swords size={28} color={T.accent} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>対戦履歴はまだありません</div>
      <div style={{ fontSize: 13, color: T.dim }}>対戦を記録すると日別の戦績が表示されます</div>
      {onTabClick && (
        <button
          onClick={onTabClick}
          style={{ marginTop: 4, padding: "8px 20px", borderRadius: 10, border: "none", background: T.accentSoft, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          対戦タブへ →
        </button>
      )}
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
              ? emptyHistoryState(onGoBattle)
              : dGroups.map(([dt, ms]) => {
                  const w = ms.filter((m) => m.result === "win").length;
                  const dp = data.daily?.[dt];
                  return (
                    <button key={dt} onClick={() => setHistDate(dt)} style={{ ...cd, display: "flex", alignItems: "center", width: "100%", cursor: "pointer", textAlign: "left", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{formatDateLong(dt)}</div>
                        <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>
                          {ms.length}戦
                          {dp?.start ? ` · ${numFormat(dp.start)}${dp.end ? " → " + numFormat(dp.end) : ""}` : ""}
                        </div>
                        {dp?.start && dp?.end && (() => {
                          const delta = dp.end - dp.start;
                          return (
                            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: delta >= 0 ? T.win : T.lose }}>
                              {delta >= 0 ? "+" : ""}{numFormat(delta)}
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ textAlign: "right", marginRight: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: T.win }}>{w}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{ms.length - w}</span></div>
                        <div style={{ fontSize: 12, color: T.dim }}>{percentStr(w, ms.length)}</div>
                      </div>
                      <span style={{ color: T.dimmer, fontSize: 20 }}>›</span>
                    </button>
                  );
                })}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button onClick={() => setHistDate(null)} style={{ background: T.inp, border: "none", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 14px", borderRadius: 10 }}>← 戻る</button>
              <button
                onClick={() => shareDay(histDate, selDay)}
                style={{ background: T.inp, border: "none", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Share2 size={14} />
                {shareStatus === "copied" ? "コピー済み" : "シェア"}
              </button>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{formatDateLong(histDate)}</div>
            {(() => { const w = selDay.filter((m) => m.result === "win").length; return <div style={{ fontSize: 14, color: T.sub, marginTop: 4, marginBottom: 16 }}>{selDay.length}戦 · <span style={{ color: T.win, fontWeight: 700 }}>{w}W</span> - <span style={{ color: T.lose, fontWeight: 700 }}>{selDay.length - w}L</span> · {percentStr(w, selDay.length)}</div>; })()}
            {selDayWithIdx.map((e, i) => <HistRow key={i} m={e.m} onDelete={() => deleteMatch(e.idx)} T={T} />)}
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
            ? emptyHistoryState(onGoBattle)
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
                      background: active ? T.accentSoft : T.card,
                      border: active ? `2px solid ${T.accent}` : (T.brd !== "transparent" ? `1px solid ${T.brd}` : `1px solid ${T.inp}`),
                      borderRadius: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: active ? T.accentGlow : T.sh,
                      transition: "all .15s ease",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: active ? T.accent : T.text }}>{formatDateLong(dt)}</div>
                      <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>
                        {ms.length}戦{dp?.start ? ` · ${numFormat(dp.start)}${dp.end ? " → " + numFormat(dp.end) : ""}` : ""}
                      </div>
                      {dp?.start && dp?.end && (() => {
                        const delta = dp.end - dp.start;
                        return (
                          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: delta >= 0 ? T.win : T.lose }}>
                            {delta >= 0 ? "+" : ""}{numFormat(delta)}
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>
                        <span style={{ color: T.win }}>{w}</span>
                        <span style={{ color: T.dimmer }}> : </span>
                        <span style={{ color: T.lose }}>{ms.length - w}</span>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>日付を選択してください</div>
            <div style={{ fontSize: 13, color: T.dim }}>左のリストから日付をクリックすると詳細が表示されます</div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{formatDateLong(histDate)}</div>
                <div style={{ fontSize: 14, color: T.sub }}>
                  {selDay.length}戦 · <span style={{ color: T.win, fontWeight: 700 }}>{selW}W</span> - <span style={{ color: T.lose, fontWeight: 700 }}>{selDay.length - selW}L</span> · {percentStr(selW, selDay.length)}
                </div>
              </div>
              <button
                onClick={() => shareDay(histDate, selDay)}
                style={{ background: T.inp, border: "none", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
              >
                <Share2 size={14} />
                {shareStatus === "copied" ? "コピー済み" : "シェア"}
              </button>
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
                  {selDayWithIdx.map((e, i) => {
                    const m = e.m;
                    return (
                      <tr key={i} style={{ transition: "background .1s" }} onMouseEnter={(ev) => ev.currentTarget.style.background = T.inp} onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}>
                        <td style={{ ...tdStyle, color: T.dim, fontSize: 12, fontWeight: 600 }}>{selDayWithIdx.length - i}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                            background: m.result === "win" ? T.winBg : T.loseBg,
                            color: m.result === "win" ? T.win : T.lose,
                          }}>
                            {m.result === "win" ? "WIN" : "LOSE"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}><span style={{ display: "flex", alignItems: "center", gap: 8 }}><FighterIcon name={m.myChar} size={30} />{m.myChar}</span></td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}><span style={{ display: "flex", alignItems: "center", gap: 8 }}><FighterIcon name={m.oppChar} size={30} />{m.oppChar}</span></td>
                        <td style={{ ...tdStyle, color: T.dim, fontSize: 13 }}>{formatTime(m.time)}</td>
                        <td style={{ ...tdStyle, color: T.sub, fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{m.memo || "\u2014"}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <button onClick={() => deleteMatch(e.idx)} style={{ border: "none", background: T.loseBg, color: T.lose, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 8, cursor: "pointer" }}>削除</button>
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
