import { useState, useMemo } from "react";
import { Swords, Share2 } from "lucide-react";
import HistRow from "./HistRow";
import SharePopup from "./SharePopup";
import FighterIcon from "./FighterIcon";
import { useI18n } from "../i18n/index.jsx";
import { fighterName } from "../constants/fighters";
import { formatDateLong, formatTime, numFormat, percentStr, barColor, getDayPowerSummary } from "../utils/format";

export default function HistoryTab({ data, onSave, T, isPC, onGoBattle }) {
  const { t, lang } = useI18n();
  const [histDate, setHistDate] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);
  const [sharePopupText, setSharePopupText] = useState(null);
  const [editingPower, setEditingPower] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const doShare = async (text) => {
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (_) { /* cancelled */ }
    }
    setSharePopupText(text);
  };

  const shareDay = async (date, matches) => {
    const w = matches.filter((m) => m.result === "win").length;
    const l = matches.length - w;
    const dp = data.daily?.[date];
    const ps = getDayPowerSummary(dp);
    const ss = { showChar: true, showMatchups: true, showPower: true, showRecord: true, ...(data.shareSettings || {}) };
    const myChars = [...new Set(matches.map((m) => m.myChar).filter(Boolean))];
    const oppStats = (() => {
      const stats = {};
      matches.forEach((m) => {
        if (!m.oppChar) return;
        if (!stats[m.oppChar]) stats[m.oppChar] = { w: 0, l: 0 };
        m.result === "win" ? stats[m.oppChar].w++ : stats[m.oppChar].l++;
      });
      return stats;
    })();
    const lines = [`【SMASH TRACKER】${formatDateLong(date)}`];
    if (ss.showChar && myChars.length > 0) {
      const charLabel = ss.showRecord
        ? `${t("share.used")}: ${myChars.map((c) => fighterName(c, lang)).join(" / ")} ${w}W ${l}L（勝率 ${percentStr(w, matches.length)}）`
        : `${t("share.used")}: ${myChars.map((c) => fighterName(c, lang)).join(" / ")}`;
      lines.push(charLabel);
    } else if (ss.showRecord) {
      lines.push(`${w}W ${l}L（勝率 ${percentStr(w, matches.length)}）`);
    }
    if (ss.showMatchups) {
      Object.entries(oppStats)
        .sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))
        .slice(0, 5)
        .forEach(([opp, s]) => {
          lines.push(`vs ${fighterName(opp, lang)} ${s.w}W:${s.l}L`);
        });
    }
    if (ss.showPower && ps.start && ps.end) {
      const delta = ps.end - ps.start;
      lines.push("");
      lines.push(`${t("battle.power")}: ${numFormat(ps.start)} → ${numFormat(ps.end)} (${delta >= 0 ? "+" : ""}${numFormat(delta)})`);
    }
    if (dp?.vip) lines.push(t("share.vip"));
    lines.push("", "#スマブラ #SmashTracker #スマトラ", "https://smash-tracker.pages.dev/");
    doShare(lines.join("\n"));
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
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{t("history.emptyTitle")}</div>
      <div style={{ fontSize: 13, color: T.dim }}>{t("history.emptyDesc")}</div>
      {onTabClick && (
        <button
          onClick={onTabClick}
          style={{ marginTop: 4, padding: "8px 20px", borderRadius: 10, border: "none", background: T.accentSoft, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          {t("history.goToBattle")}
        </button>
      )}
    </div>
  );

  // Mobile layout
  if (!isPC) {
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>{t("history.dailyRecord")}</div>
        {!histDate ? (
          <div>
            {dGroups.length === 0
              ? emptyHistoryState(onGoBattle)
              : dGroups.map(([dt, ms]) => {
                  const w = ms.filter((m) => m.result === "win").length;
                  const ps = getDayPowerSummary(data.daily?.[dt]);
                  return (
                    <button key={dt} onClick={() => setHistDate(dt)} style={{ ...cd, display: "flex", alignItems: "center", width: "100%", cursor: "pointer", textAlign: "left", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{formatDateLong(dt)}</div>
                        <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>
                          {ms.length}{t("common.matches")}
                          {ps.start ? ` · ${numFormat(ps.start)}${ps.end ? " → " + numFormat(ps.end) : ""}` : ""}
                        </div>
                        {ps.start && ps.end && (() => {
                          const delta = ps.end - ps.start;
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
              <button onClick={() => { setHistDate(null); setEditingPower(false); }} style={{ background: T.inp, border: "none", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 14px", borderRadius: 10 }}>{t("history.back")}</button>
              <button
                onClick={() => shareDay(histDate, selDay)}
                style={{ background: T.inp, border: "none", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Share2 size={14} />
                {shareStatus === "copied" ? t("battle.copied") : t("battle.share")}
              </button>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{formatDateLong(histDate)}</div>
            {(() => { const w = selDay.filter((m) => m.result === "win").length; return <div style={{ fontSize: 14, color: T.sub, marginTop: 4, marginBottom: 12 }}>{selDay.length}{t("common.matches")} · <span style={{ color: T.win, fontWeight: 700 }}>{w}W</span> - <span style={{ color: T.lose, fontWeight: 700 }}>{selDay.length - w}L</span> · {percentStr(w, selDay.length)}</div>; })()}
            {/* Power edit section */}
            {(() => {
              const dp = data.daily?.[histDate] || {};
              const ps = getDayPowerSummary(dp);
              return (
                <div style={{ background: T.card, borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: `1px solid ${T.brd}`, boxShadow: T.sh }}>
                  {!editingPower ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.dim, marginBottom: 4 }}>{t("battle.power")}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                          {ps.start ? numFormat(ps.start) : t("analysis.noData")}
                          {ps.end ? <span style={{ color: T.dim }}> → {numFormat(ps.end)}</span> : null}
                          {ps.start && ps.end ? (
                            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: (ps.end - ps.start) >= 0 ? T.win : T.lose }}>
                              {(ps.end - ps.start) >= 0 ? "+" : ""}{numFormat(ps.end - ps.start)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        onClick={() => { setEditStart(ps.start ? String(ps.start) : ""); setEditEnd(ps.end ? String(ps.end) : ""); setEditingPower(true); }}
                        style={{ background: T.inp, border: "none", color: T.sub, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}
                      >
                        {t("battle.change")}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, color: T.dim, marginBottom: 8 }}>{t("battle.power")}</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: T.dim, marginBottom: 4 }}>{t("battle.powerStart")}</div>
                          <input
                            type="number"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            placeholder="0"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.brd}`, background: T.inp, color: T.text, fontSize: 14, fontWeight: 600, boxSizing: "border-box" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: T.dim, marginBottom: 4 }}>{t("battle.powerCurrent")}</div>
                          <input
                            type="number"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            placeholder="0"
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.brd}`, background: T.inp, color: T.text, fontSize: 14, fontWeight: 600, boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setEditingPower(false)}
                          style={{ flex: 1, padding: "8px 0", border: `1px solid ${T.brd}`, borderRadius: 8, background: "transparent", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          {t("settings.cancel")}
                        </button>
                        <button
                          onClick={() => {
                            const nd = { ...data };
                            if (!nd.daily) nd.daily = {};
                            if (!nd.daily[histDate]) nd.daily[histDate] = {};
                            if (editStart) nd.daily[histDate].start = Number(editStart);
                            if (editEnd) nd.daily[histDate].end = Number(editEnd);
                            onSave(nd);
                            setEditingPower(false);
                          }}
                          style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 8, background: T.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          {t("battle.record")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {selDayWithIdx.map((e, i) => <HistRow key={i} m={e.m} onDelete={() => deleteMatch(e.idx)} T={T} />)}
          </div>
        )}
        {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
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
        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16 }}>{t("history.dailyRecord")}</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {dGroups.length === 0
            ? emptyHistoryState(onGoBattle)
            : dGroups.map(([dt, ms]) => {
                const w = ms.filter((m) => m.result === "win").length;
                const r = ms.length ? w / ms.length : 0;
                const ps = getDayPowerSummary(data.daily?.[dt]);
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
                        {ms.length}{t("common.matches")}{ps.start ? ` · ${numFormat(ps.start)}${ps.end ? " → " + numFormat(ps.end) : ""}` : ""}
                      </div>
                      {ps.start && ps.end && (() => {
                        const delta = ps.end - ps.start;
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
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>{t("history.selectDate")}</div>
            <div style={{ fontSize: 13, color: T.dim }}>{t("history.selectDateDesc")}</div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{formatDateLong(histDate)}</div>
                <div style={{ fontSize: 14, color: T.sub }}>
                  {selDay.length}{t("common.matches")} · <span style={{ color: T.win, fontWeight: 700 }}>{selW}W</span> - <span style={{ color: T.lose, fontWeight: 700 }}>{selDay.length - selW}L</span> · {percentStr(selW, selDay.length)}
                </div>
              </div>
              <button
                onClick={() => shareDay(histDate, selDay)}
                style={{ background: T.inp, border: "none", color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
              >
                <Share2 size={14} />
                {shareStatus === "copied" ? t("battle.copied") : t("battle.share")}
              </button>
            </div>

            <div style={{ ...cd, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.inp }}>
                    <th style={thStyle}>{t("history.num")}</th>
                    <th style={thStyle}>{t("history.result")}</th>
                    <th style={thStyle}>{t("history.myChar")}</th>
                    <th style={thStyle}>{t("history.oppChar")}</th>
                    <th style={thStyle}>{t("history.time")}</th>
                    <th style={thStyle}>{t("history.memo")}</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>{t("history.actions")}</th>
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
                        <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}><span style={{ display: "flex", alignItems: "center", gap: 8 }}><FighterIcon name={m.myChar} size={30} />{fighterName(m.myChar, lang)}</span></td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}><span style={{ display: "flex", alignItems: "center", gap: 8 }}><FighterIcon name={m.oppChar} size={30} />{fighterName(m.oppChar, lang)}</span></td>
                        <td style={{ ...tdStyle, color: T.dim, fontSize: 13 }}>{formatTime(m.time)}</td>
                        <td style={{ ...tdStyle, color: T.sub, fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{m.memo || "\u2014"}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <button onClick={() => { if (window.confirm("この対戦記録を削除しますか？")) deleteMatch(e.idx); }} style={{ border: "none", background: T.loseBg, color: T.lose, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 8, cursor: "pointer" }}>{t("history.delete")}</button>
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
      {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
    </div>
  );
}
